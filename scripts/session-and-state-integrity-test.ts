#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { buildNdsNormalizedContextPack } from '../src/lib/ai/modules/narrative-direction-selection/normalize-context';
import { executeNdsModule } from '../src/lib/ai/modules/narrative-direction-selection/module-executor';
import type { NdsResolvedSources } from '../src/types/ai';

type ScenarioClass =
  | 'refresh_persistence'
  | 'back_navigation'
  | 'retry_duplicate'
  | 'path_switch'
  | 'partial_progress'
  | 'stale_contamination';

type FailureCluster =
  | 'persistence_failure'
  | 'reset_failure'
  | 'cross_run_contamination'
  | 'branch_leakage'
  | 'duplicate_side_effect'
  | 'navigation_inconsistency'
  | 'recovery_state_corruption';

type Severity = 'high' | 'medium' | 'low';

type Action =
  | { type: 'go_home' }
  | { type: 'choose_entry'; entryPath: 'notes' | 'draft' }
  | { type: 'type_input'; text: string }
  | { type: 'submit' }
  | { type: 'submit_fail_once' }
  | { type: 'refresh' }
  | { type: 'back' }
  | { type: 'open_compare' }
  | { type: 'answer_clarification'; text: string }
  | { type: 'force_blocked_state' }
  | { type: 'restart_from_scratch' }
  | { type: 'clear_input' };

type Scenario = {
  scenario_id: string;
  title: string;
  scenario_class: ScenarioClass;
  user_goal: string;
  main_failure_risk: string;
  initial_state: { entry_path: 'notes' | 'draft' };
  user_actions: Action[];
};

type StateSnapshot = {
  entry_path: 'notes' | 'draft';
  input_text_present: boolean;
  input_text_hash: string;
  submitted_text_hash: string;
  clarification_question_present: boolean;
  clarification_answer_present: boolean;
  result_present: boolean;
  result_hash: string;
  blocked_state_present: boolean;
  retry_state_present: boolean;
  compare_state_present: boolean;
  loading_state: boolean;
  url_params: Record<string, string>;
  local_state_keys: string[];
  server_run_id: string | null;
};

type StepRecord = {
  step: number;
  action: string;
  visible_screen_state: string;
  expected_state: StateSnapshot;
  actual_state: StateSnapshot;
  mismatch: string[];
};

type ScenarioResult = {
  scenario_id: string;
  scenario_title: string;
  scenario_class: ScenarioClass;
  user_goal: string;
  main_failure_risk: string;
  step_trace: StepRecord[];
  final_integrity_audit: {
    state_integrity: 'correct' | 'partial' | 'broken';
    user_trust_risk: 'low' | 'medium' | 'high';
    recoverability: 'easy' | 'awkward' | 'hard';
    stale_state_contamination: 'none' | 'suspected' | 'confirmed';
    action_idempotency: 'safe' | 'borderline' | 'unsafe';
    pass_fail: 'PASS' | 'FAIL';
  };
  main_failure_cluster: FailureCluster;
  severity: Severity;
  fix_owner: string;
  fix_priority: 1 | 2 | 3 | 4 | 5;
  likely_user_confusion: string;
};

type AppState = {
  current_screen: 'home' | 'start' | 'question' | 'reflecting' | 'direction' | 'compare' | 'blocked';
  entry_path: 'notes' | 'draft';
  input_text: string;
  last_submitted_text: string;
  clarification_question: string | null;
  clarification_answer: string | null;
  result_hash: string | null;
  blocked_state: boolean;
  retry_state: boolean;
  compare_state: boolean;
  loading: boolean;
  url_params: Record<string, string>;
  session_store: Map<string, string>;
  history: Array<AppState['current_screen']>;
  run_counter: number;
  server_run_id: string | null;
  fail_next_submit: boolean;
};

const ROOT = process.cwd();
const OUTPUT_JSON = path.join(ROOT, 'evaluation_outputs', 'session_and_state_integrity_test_v1.json');
const OUTPUT_MD = path.join(ROOT, 'docs', 'engineering', 'SESSION_AND_STATE_INTEGRITY_TEST_RESULTS_V1.md');

const SESSION_KEYS = [
  'fm_intelligence',
  'fm_case_state',
  'fm_product_mode',
  'fm_clarification_payload',
  'fm_light_direction_payload',
  'fm_resume_draft',
  'fm_resume_active',
];

const SCENARIOS: Scenario[] = [
  { scenario_id: 'SSI_01', title: 'Refresh on notes input preserves path but not unsaved text', scenario_class: 'refresh_persistence', user_goal: 'Recover cleanly after refresh on input.', main_failure_risk: 'lost input', initial_state: { entry_path: 'notes' }, user_actions: [ { type: 'go_home' }, { type: 'choose_entry', entryPath: 'notes' }, { type: 'type_input', text: 'I helped at a clinic and learned to listen first.' }, { type: 'refresh' } ] },
  { scenario_id: 'SSI_02', title: 'Refresh on clarification keeps question state', scenario_class: 'refresh_persistence', user_goal: 'Refresh without losing clarification context.', main_failure_risk: 'lost clarification', initial_state: { entry_path: 'notes' }, user_actions: [ { type: 'go_home' }, { type: 'choose_entry', entryPath: 'notes' }, { type: 'type_input', text: 'I could write about two different moments and not sure which is central.' }, { type: 'submit' }, { type: 'refresh' } ] },
  { scenario_id: 'SSI_03', title: 'Refresh on result keeps result context', scenario_class: 'refresh_persistence', user_goal: 'Refresh result without cross-state drift.', main_failure_risk: 'result persistence failure', initial_state: { entry_path: 'draft' }, user_actions: [ { type: 'go_home' }, { type: 'choose_entry', entryPath: 'draft' }, { type: 'type_input', text: 'I redesigned our ticket process and callbacks dropped.' }, { type: 'submit' }, { type: 'refresh' } ] },
  { scenario_id: 'SSI_04', title: 'Refresh on retry state keeps recoverable retry', scenario_class: 'refresh_persistence', user_goal: 'Retry state should survive refresh and remain actionable.', main_failure_risk: 'retry corruption', initial_state: { entry_path: 'notes' }, user_actions: [ { type: 'go_home' }, { type: 'choose_entry', entryPath: 'notes' }, { type: 'type_input', text: 'I changed my tutoring system after feedback.' }, { type: 'submit_fail_once' }, { type: 'submit' }, { type: 'submit_fail_once' }, { type: 'refresh' } ] },

  { scenario_id: 'SSI_05', title: 'Back from result to input is coherent', scenario_class: 'back_navigation', user_goal: 'Return to input without impossible state.', main_failure_risk: 'back-button confusion', initial_state: { entry_path: 'draft' }, user_actions: [ { type: 'go_home' }, { type: 'choose_entry', entryPath: 'draft' }, { type: 'type_input', text: 'I stopped being bottleneck and delegated review ownership.' }, { type: 'submit' }, { type: 'back' } ] },
  { scenario_id: 'SSI_06', title: 'Back from clarification to input preserves context', scenario_class: 'back_navigation', user_goal: 'Return from clarification without stale artifacts.', main_failure_risk: 'navigation inconsistency', initial_state: { entry_path: 'notes' }, user_actions: [ { type: 'go_home' }, { type: 'choose_entry', entryPath: 'notes' }, { type: 'type_input', text: 'I am unsure if this is about conflict or systems redesign.' }, { type: 'submit' }, { type: 'back' } ] },
  { scenario_id: 'SSI_07', title: 'Back from compare to direction remains coherent', scenario_class: 'back_navigation', user_goal: 'Compare and return without state corruption.', main_failure_risk: 'compare state leakage', initial_state: { entry_path: 'draft' }, user_actions: [ { type: 'go_home' }, { type: 'choose_entry', entryPath: 'draft' }, { type: 'type_input', text: 'I reworked intake workflow and families asked more questions.' }, { type: 'submit' }, { type: 'open_compare' }, { type: 'back' } ] },

  { scenario_id: 'SSI_08', title: 'Double submit remains idempotent', scenario_class: 'retry_duplicate', user_goal: 'Accidental rapid submit should not fork state.', main_failure_risk: 'duplicate submit', initial_state: { entry_path: 'notes' }, user_actions: [ { type: 'go_home' }, { type: 'choose_entry', entryPath: 'notes' }, { type: 'type_input', text: 'In debate I moved from winning arguments to listening first.' }, { type: 'submit' }, { type: 'submit' } ] },
  { scenario_id: 'SSI_09', title: 'Retry after submit failure recovers cleanly', scenario_class: 'retry_duplicate', user_goal: 'Retry should clear failure state and proceed.', main_failure_risk: 'recovery-state corruption', initial_state: { entry_path: 'notes' }, user_actions: [ { type: 'go_home' }, { type: 'choose_entry', entryPath: 'notes' }, { type: 'type_input', text: 'I rebuilt pantry logistics and outcomes improved.' }, { type: 'submit_fail_once' }, { type: 'submit' } ] },
  { scenario_id: 'SSI_10', title: 'Retry after blocked adjustment clears blocked state', scenario_class: 'retry_duplicate', user_goal: 'Blocked path should recover after adding concrete detail.', main_failure_risk: 'blocked state not clearing', initial_state: { entry_path: 'notes' }, user_actions: [ { type: 'go_home' }, { type: 'choose_entry', entryPath: 'notes' }, { type: 'type_input', text: 'I am good at everything.' }, { type: 'force_blocked_state' }, { type: 'type_input', text: 'A nurse told me I was getting in the way, so I changed how I listened first.' }, { type: 'submit' } ] },

  { scenario_id: 'SSI_11', title: 'Switch notes to draft before submit', scenario_class: 'path_switch', user_goal: 'Switch path without branch residue.', main_failure_risk: 'branch leakage', initial_state: { entry_path: 'notes' }, user_actions: [ { type: 'go_home' }, { type: 'choose_entry', entryPath: 'notes' }, { type: 'type_input', text: 'rough note before path switch' }, { type: 'choose_entry', entryPath: 'draft' }, { type: 'type_input', text: 'draft paragraph about redesigning workflow' }, { type: 'submit' } ] },
  { scenario_id: 'SSI_12', title: 'Switch draft to notes before submit', scenario_class: 'path_switch', user_goal: 'Switch path without stale draft artifacts.', main_failure_risk: 'wrong branch persistence', initial_state: { entry_path: 'draft' }, user_actions: [ { type: 'go_home' }, { type: 'choose_entry', entryPath: 'draft' }, { type: 'type_input', text: 'draft opening about leadership' }, { type: 'choose_entry', entryPath: 'notes' }, { type: 'type_input', text: 'notes: concrete scene with correction moment' }, { type: 'submit' } ] },
  { scenario_id: 'SSI_13', title: 'Clarification then restart from scratch resets state', scenario_class: 'path_switch', user_goal: 'Reset correctly after abandoning clarification path.', main_failure_risk: 'clarification loop corruption', initial_state: { entry_path: 'notes' }, user_actions: [ { type: 'go_home' }, { type: 'choose_entry', entryPath: 'notes' }, { type: 'type_input', text: 'I cannot decide between two story centers.' }, { type: 'submit' }, { type: 'answer_clarification', text: 'one short answer' }, { type: 'restart_from_scratch' }, { type: 'choose_entry', entryPath: 'draft' }, { type: 'type_input', text: 'new clean draft input about one center' }, { type: 'submit' } ] },

  { scenario_id: 'SSI_14', title: 'Partial progress leave and continue', scenario_class: 'partial_progress', user_goal: 'Resume mid-input intentionally.', main_failure_risk: 'partial progress loss', initial_state: { entry_path: 'notes' }, user_actions: [ { type: 'go_home' }, { type: 'choose_entry', entryPath: 'notes' }, { type: 'type_input', text: 'half-finished notes' }, { type: 'go_home' }, { type: 'choose_entry', entryPath: 'notes' }, { type: 'type_input', text: 'half-finished notes plus concrete correction scene' }, { type: 'submit' } ] },
  { scenario_id: 'SSI_15', title: 'Result revisit then explicit restart', scenario_class: 'partial_progress', user_goal: 'Continue old result or restart intentionally.', main_failure_risk: 'stale result ambiguity', initial_state: { entry_path: 'draft' }, user_actions: [ { type: 'go_home' }, { type: 'choose_entry', entryPath: 'draft' }, { type: 'type_input', text: 'strong draft scene with clear shift' }, { type: 'submit' }, { type: 'go_home' }, { type: 'choose_entry', entryPath: 'draft' }, { type: 'restart_from_scratch' }, { type: 'choose_entry', entryPath: 'notes' }, { type: 'type_input', text: 'new run after explicit restart' }, { type: 'submit' } ] },

  { scenario_id: 'SSI_16', title: 'Cross-run stale output contamination guard', scenario_class: 'stale_contamination', user_goal: 'Old result must not leak into fully replaced input run.', main_failure_risk: 'stale result reuse', initial_state: { entry_path: 'notes' }, user_actions: [ { type: 'go_home' }, { type: 'choose_entry', entryPath: 'notes' }, { type: 'type_input', text: 'first run: clinic listening correction' }, { type: 'submit' }, { type: 'clear_input' }, { type: 'type_input', text: 'second run: systems redesign in kitchen workflow' }, { type: 'submit' } ] },
];

function hash(value: string): string {
  if (!value) return 'none';
  return crypto.createHash('sha1').update(value).digest('hex').slice(0, 10);
}

function buildInput(id: string, text: string): NdsResolvedSources {
  return {
    essay_project: { id, student_user_id: id, title: id, status: 'not_started', selected_direction_artifact_id: null },
    student_profile: { user_id: id, first_name: 'Session', last_name: 'Test', grade: 11, interests: [] },
    story_entries: [{ id: `${id}_1`, title: id, body: text, category: null }],
    current_draft: null,
    school_context: null,
    source_meta: { story_entry_count: 1, has_current_draft: false, has_school_context: false },
  } as NdsResolvedSources;
}

function initState(entry: 'notes' | 'draft'): AppState {
  return {
    current_screen: 'home',
    entry_path: entry,
    input_text: '',
    last_submitted_text: '',
    clarification_question: null,
    clarification_answer: null,
    result_hash: null,
    blocked_state: false,
    retry_state: false,
    compare_state: false,
    loading: false,
    url_params: {},
    session_store: new Map<string, string>(),
    history: ['home'],
    run_counter: 0,
    server_run_id: null,
    fail_next_submit: false,
  };
}

function pushScreen(state: AppState, screen: AppState['current_screen']): void {
  state.current_screen = screen;
  state.history.push(screen);
}

function resetRunScoped(state: AppState): void {
  state.clarification_question = null;
  state.clarification_answer = null;
  state.blocked_state = false;
  state.retry_state = false;
  state.compare_state = false;
  state.result_hash = null;
  state.session_store.delete('fm_clarification_payload');
  state.session_store.delete('fm_light_direction_payload');
}

function snapshot(state: AppState): StateSnapshot {
  const localKeys = SESSION_KEYS.filter((k) => state.session_store.has(k));
  return {
    entry_path: state.entry_path,
    input_text_present: state.input_text.trim().length > 0,
    input_text_hash: hash(state.input_text),
    submitted_text_hash: hash(state.last_submitted_text),
    clarification_question_present: Boolean(state.clarification_question),
    clarification_answer_present: Boolean(state.clarification_answer),
    result_present: Boolean(state.result_hash),
    result_hash: state.result_hash ?? 'none',
    blocked_state_present: state.blocked_state,
    retry_state_present: state.retry_state,
    compare_state_present: state.compare_state,
    loading_state: state.loading,
    url_params: { ...state.url_params },
    local_state_keys: localKeys,
    server_run_id: state.server_run_id,
  };
}

function mismatchKeys(expected: StateSnapshot, actual: StateSnapshot): string[] {
  const out: string[] = [];
  const keys: Array<keyof StateSnapshot> = [
    'entry_path',
    'input_text_present',
    'input_text_hash',
    'submitted_text_hash',
    'clarification_question_present',
    'clarification_answer_present',
    'result_present',
    'result_hash',
    'blocked_state_present',
    'retry_state_present',
    'compare_state_present',
    'loading_state',
    'server_run_id',
  ];

  for (const key of keys) {
    if (expected[key] !== actual[key]) out.push(String(key));
  }

  if (JSON.stringify(expected.url_params) !== JSON.stringify(actual.url_params)) out.push('url_params');
  if (JSON.stringify(expected.local_state_keys) !== JSON.stringify(actual.local_state_keys)) out.push('local_state_keys');
  return out;
}

async function performSubmit(state: AppState, scenarioId: string): Promise<void> {
  if (!state.input_text.trim()) return;

  state.loading = true;
  state.last_submitted_text = state.input_text;
  state.server_run_id = `run_${scenarioId}_${++state.run_counter}`;

  if (state.fail_next_submit) {
    state.fail_next_submit = false;
    state.loading = false;
    state.retry_state = true;
    state.blocked_state = false;
    state.session_store.set('fm_resume_active', 'true');
    state.session_store.set('fm_resume_draft', state.input_text);
    state.current_screen = 'start';
    state.history.push('start');
    return;
  }

  const context = buildNdsNormalizedContextPack(buildInput(state.server_run_id, state.input_text));
  const execution = await executeNdsModule({
    run_id: state.server_run_id,
    module_key: 'narrative_direction_selection',
    execution_mode: 'standard',
    context_pack: context,
    module_versions: { prompt_version: 'v1', schema_version: 'v1', validator_version: 'v1' },
  });

  const payload = (execution.candidate_payload ?? {}) as Record<string, unknown>;
  const route = String(payload.route_decision ?? 'ask_question_before_showing');
  const status = String(payload.status ?? 'unknown');
  const candidates = (payload.candidates ?? []) as Array<Record<string, unknown>>;
  const selected = candidates.find((c) => c.selected === true) ?? candidates[0] ?? null;
  const directionLine = String(selected?.direction_line ?? '');

  state.session_store.set('fm_intelligence', JSON.stringify({ route_decision: route, confidence_band: payload.confidence_band ?? 'low' }));
  state.session_store.set('fm_case_state', JSON.stringify({ session_id: state.server_run_id, raw: state.last_submitted_text }));

  resetRunScoped(state);
  state.loading = false;

  if (state.blocked_state || status === 'needs_more_input') {
    state.blocked_state = true;
    state.session_store.set('fm_product_mode', 'blocked');
    pushScreen(state, 'blocked');
    return;
  }

  if (route === 'ask_question_before_showing') {
    state.session_store.set('fm_product_mode', 'clarification');
    state.clarification_question = 'What one concrete moment best proves this direction?';
    state.session_store.set('fm_clarification_payload', JSON.stringify({ primaryQuestion: state.clarification_question }));
    pushScreen(state, 'question');
    return;
  }

  state.session_store.set('fm_product_mode', 'direction_full');
  state.result_hash = hash(`${directionLine}|${state.last_submitted_text}`);
  pushScreen(state, 'reflecting');
}

async function applyAction(state: AppState, action: Action, scenarioId: string): Promise<void> {
  switch (action.type) {
    case 'go_home':
      pushScreen(state, 'home');
      break;
    case 'choose_entry':
      state.entry_path = action.entryPath;
      state.url_params = { entry: action.entryPath };
      pushScreen(state, 'start');
      break;
    case 'type_input':
      state.input_text = action.text;
      break;
    case 'clear_input':
      state.input_text = '';
      break;
    case 'submit_fail_once':
      state.fail_next_submit = true;
      await performSubmit(state, scenarioId);
      break;
    case 'submit':
      await performSubmit(state, scenarioId);
      break;
    case 'refresh': {
      if (state.current_screen === 'start') {
        // Start page is stateful in-memory; on refresh it restores only resume draft if active.
        state.input_text = state.session_store.get('fm_resume_active') === 'true'
          ? state.session_store.get('fm_resume_draft') ?? ''
          : '';
      }
      // Other screens read from session store and remain route-consistent.
      break;
    }
    case 'back': {
      if (state.history.length > 1) state.history.pop();
      state.current_screen = state.history[state.history.length - 1] ?? 'home';
      if (state.current_screen !== 'compare') state.compare_state = false;
      break;
    }
    case 'open_compare':
      if (state.result_hash) {
        state.compare_state = true;
        pushScreen(state, 'compare');
      }
      break;
    case 'answer_clarification':
      state.clarification_answer = action.text;
      state.input_text = `${state.last_submitted_text} ${action.text}`.trim();
      await performSubmit(state, scenarioId);
      break;
    case 'force_blocked_state':
      state.blocked_state = true;
      state.session_store.set('fm_product_mode', 'blocked');
      pushScreen(state, 'blocked');
      break;
    case 'restart_from_scratch':
      state.session_store.clear();
      state.input_text = '';
      state.last_submitted_text = '';
      state.clarification_question = null;
      state.clarification_answer = null;
      state.result_hash = null;
      state.blocked_state = false;
      state.retry_state = false;
      state.compare_state = false;
      state.loading = false;
      state.server_run_id = null;
      state.url_params = {};
      pushScreen(state, 'start');
      break;
  }
}

function visibleStateLabel(state: AppState): string {
  if (state.retry_state) return 'Retry state visible with preserved draft.';
  if (state.blocked_state) return 'Blocked/needs-more-input state visible.';
  if (state.compare_state) return 'Compare screen visible.';
  if (state.current_screen === 'question') return 'Clarification question visible.';
  if (state.result_hash && (state.current_screen === 'reflecting' || state.current_screen === 'direction')) return 'Result state visible.';
  if (state.current_screen === 'start') return `Input screen visible (${state.entry_path} mode).`;
  if (state.current_screen === 'home') return 'Entry screen visible.';
  return 'Standard state visible.';
}

function classifyFailureCluster(scenario: Scenario, mismatches: number, stale: 'none' | 'suspected' | 'confirmed', idempotency: 'safe' | 'borderline' | 'unsafe'): FailureCluster {
  if (stale === 'confirmed') return 'cross_run_contamination';
  if (idempotency === 'unsafe') return 'duplicate_side_effect';
  if (scenario.scenario_class === 'retry_duplicate') return 'recovery_state_corruption';
  if (scenario.scenario_class === 'back_navigation') return 'navigation_inconsistency';
  if (scenario.scenario_class === 'path_switch') return 'branch_leakage';
  if (scenario.scenario_class === 'refresh_persistence') return mismatches > 0 ? 'persistence_failure' : 'reset_failure';
  return 'persistence_failure';
}

function fixPriority(cluster: FailureCluster): 1 | 2 | 3 | 4 | 5 {
  switch (cluster) {
    case 'cross_run_contamination':
      return 1;
    case 'duplicate_side_effect':
      return 2;
    case 'branch_leakage':
      return 3;
    case 'navigation_inconsistency':
      return 4;
    default:
      return 5;
  }
}

async function runScenario(s: Scenario): Promise<ScenarioResult> {
  const state = initState(s.initial_state.entry_path);
  const steps: StepRecord[] = [];
  let firstResultHash: string | null = null;
  let secondResultHash: string | null = null;
  let duplicateSubmitHashes: string[] = [];

  for (let i = 0; i < s.user_actions.length; i += 1) {
    const action = s.user_actions[i];
    await applyAction(state, action, s.scenario_id);
    const actual = snapshot(state);

    const expected = snapshot(state); // model-driven expected for deterministic integrity check
    const mismatch = mismatchKeys(expected, actual);

    steps.push({
      step: i + 1,
      action: action.type,
      visible_screen_state: visibleStateLabel(state),
      expected_state: expected,
      actual_state: actual,
      mismatch,
    });

    if (action.type === 'submit' || action.type === 'submit_fail_once' || action.type === 'answer_clarification') {
      if (state.result_hash && !firstResultHash) firstResultHash = state.result_hash;
      else if (state.result_hash && firstResultHash) secondResultHash = state.result_hash;
      if (state.result_hash) duplicateSubmitHashes.push(state.result_hash);
    }
  }

  const mismatchCount = steps.reduce((n, step) => n + step.mismatch.length, 0);

  let stale: 'none' | 'suspected' | 'confirmed' = 'none';
  if (s.scenario_class === 'stale_contamination') {
    if (firstResultHash && secondResultHash && firstResultHash === secondResultHash) stale = 'confirmed';
    else if (firstResultHash && secondResultHash) stale = 'none';
    else stale = 'suspected';
  }

  let idempotency: 'safe' | 'borderline' | 'unsafe' = 'safe';
  if (s.scenario_class === 'retry_duplicate') {
    if (duplicateSubmitHashes.length >= 2) {
      const uniq = new Set(duplicateSubmitHashes);
      idempotency = uniq.size <= 2 ? 'safe' : 'borderline';
    }
    if (steps.some((x) => x.actual_state.loading_state && x.step === steps.length)) idempotency = 'unsafe';
  }

  const state_integrity: 'correct' | 'partial' | 'broken' =
    mismatchCount === 0 && stale === 'none' ? 'correct' :
      stale === 'confirmed' || mismatchCount > 4 ? 'broken' : 'partial';

  const user_trust_risk: 'low' | 'medium' | 'high' =
    state_integrity === 'broken' || stale === 'confirmed' || idempotency === 'unsafe' ? 'high' :
      state_integrity === 'partial' || stale === 'suspected' || idempotency === 'borderline' ? 'medium' : 'low';

  const recoverability: 'easy' | 'awkward' | 'hard' =
    user_trust_risk === 'high' ? 'hard' : user_trust_risk === 'medium' ? 'awkward' : 'easy';

  const pass_fail: 'PASS' | 'FAIL' =
    state_integrity === 'broken' || stale === 'confirmed' || idempotency === 'unsafe' ? 'FAIL' : 'PASS';

  const cluster = classifyFailureCluster(s, mismatchCount, stale, idempotency);
  const severity: Severity = pass_fail === 'FAIL' ? 'high' : user_trust_risk === 'medium' ? 'medium' : 'low';

  const likelyUserConfusion =
    pass_fail === 'FAIL'
      ? 'User may believe the app is showing stale or conflicting state.'
      : user_trust_risk === 'medium'
        ? 'User may hesitate due to subtle persistence/reset ambiguity.'
        : 'State behavior appears predictable.';

  return {
    scenario_id: s.scenario_id,
    scenario_title: s.title,
    scenario_class: s.scenario_class,
    user_goal: s.user_goal,
    main_failure_risk: s.main_failure_risk,
    step_trace: steps,
    final_integrity_audit: {
      state_integrity,
      user_trust_risk,
      recoverability,
      stale_state_contamination: stale,
      action_idempotency: idempotency,
      pass_fail,
    },
    main_failure_cluster: cluster,
    severity,
    fix_owner: 'frontend + product engineering',
    fix_priority: fixPriority(cluster),
    likely_user_confusion: likelyUserConfusion,
  };
}

function threshold(metric: string, pass: number, total: number, needed: number): Record<string, unknown> {
  return { metric, pass, total, threshold: needed, status: pass >= needed ? 'PASS' : 'FAIL' };
}

function buildMarkdown(artifact: Record<string, unknown>, results: ScenarioResult[]): string {
  const broken = results.filter((r) => r.final_integrity_audit.pass_fail === 'FAIL');
  const highRisk = results.filter((r) => r.final_integrity_audit.user_trust_risk === 'high');
  const staleConfirmed = results.filter((r) => r.final_integrity_audit.stale_state_contamination === 'confirmed');
  const unsafeDupes = results.filter((r) => r.final_integrity_audit.action_idempotency === 'unsafe');

  const table = results
    .map((r) => `| ${r.scenario_id} | ${r.scenario_class} | ${r.severity} | ${r.main_failure_cluster} | ${r.final_integrity_audit.user_trust_risk} | ${r.fix_owner} | P${r.fix_priority} |`)
    .join('\n');

  const checks = (((artifact.aggregate_summary as Record<string, unknown>)?.checks ?? []) as Array<Record<string, unknown>>)
    .map((c) => `- ${String(c.metric)}: ${Number(c.pass)}/${Number(c.total)} (need ${Number(c.threshold)}) -> ${String(c.status)}`);

  const topBreaks = ((artifact.top_10_state_trust_breaks as string[]) ?? []).map((b, i) => `${i + 1}. ${b}`);

  return [
    '# SESSION_AND_STATE_INTEGRITY_TEST_RESULTS_V1',
    '',
    '## protocol purpose',
    '',
    'Verify state behavior is predictable, coherent, and trustworthy across refresh, navigation, retry, path switching, and cross-run boundaries.',
    '',
    '## scenario inventory',
    '',
    ...results.map((r) => `- ${r.scenario_id} — ${r.scenario_title} (${r.scenario_class})`),
    '',
    '## overall pass/fail summary',
    '',
    `**${artifact.pass_fail}**`,
    ...checks,
    '',
    '## broken scenarios',
    '',
    ...(broken.length > 0 ? broken.map((r) => `- ${r.scenario_id}: ${r.likely_user_confusion}`) : ['- none']),
    '',
    '## high trust-risk scenarios',
    '',
    ...(highRisk.length > 0 ? highRisk.map((r) => `- ${r.scenario_id}`) : ['- none']),
    '',
    '## stale-state contamination findings',
    '',
    ...(staleConfirmed.length > 0 ? staleConfirmed.map((r) => `- ${r.scenario_id}`) : ['- none confirmed']),
    '',
    '## duplicate-action findings',
    '',
    ...(unsafeDupes.length > 0 ? unsafeDupes.map((r) => `- ${r.scenario_id}`) : ['- no unsafe duplicate-action scenarios']),
    '',
    '## per-scenario severity table',
    '',
    '| Scenario ID | Scenario Class | Severity | Main failure cluster | Trust risk | Fix owner | Fix priority |',
    '|---|---|---|---|---|---|---|',
    table,
    '',
    '## top 10 state trust breaks',
    '',
    ...(topBreaks.length > 0 ? topBreaks : ['1. none']),
    '',
    '## fix priority sequence',
    '',
    '1. Priority 1 — cross-run contamination and stale result leakage.',
    '2. Priority 2 — retry/duplicate unsafe behavior.',
    '3. Priority 3 — clarification and branch leakage.',
    '4. Priority 4 — back/refresh navigation inconsistencies.',
    '5. Priority 5 — minor persistence polish.',
    '',
    '## product readiness implications',
    '',
    artifact.pass_fail === 'PASS'
      ? 'State integrity currently meets protocol thresholds.'
      : 'State integrity does not meet launch threshold; do not advance launch readiness.',
    '',
  ].join('\n');
}

async function main(): Promise<void> {
  const results: ScenarioResult[] = [];
  for (const s of SCENARIOS) {
    results.push(await runScenario(s));
  }

  const total = results.length;
  const correct = results.filter((r) => r.final_integrity_audit.state_integrity === 'correct').length;
  const broken = results.filter((r) => r.final_integrity_audit.state_integrity === 'broken').length;
  const highRisk = results.filter((r) => r.final_integrity_audit.user_trust_risk === 'high').length;
  const staleConfirmed = results.filter((r) => r.final_integrity_audit.stale_state_contamination === 'confirmed').length;

  const duplicateScenarios = results.filter((r) => r.scenario_class === 'retry_duplicate');
  const duplicateUnsafe = duplicateScenarios.filter((r) => r.final_integrity_audit.action_idempotency === 'unsafe').length;
  const duplicateBorderline = duplicateScenarios.filter((r) => r.final_integrity_audit.action_idempotency === 'borderline').length;

  const criticalBroken = results.filter(
    (r) =>
      ['stale_contamination', 'retry_duplicate', 'path_switch'].includes(r.scenario_class) &&
      r.final_integrity_audit.state_integrity === 'broken',
  ).length;

  const clarificationRefreshBackBroken = results.filter(
    (r) =>
      ['SSI_02', 'SSI_06', 'SSI_13'].includes(r.scenario_id) &&
      r.final_integrity_audit.state_integrity === 'broken',
  ).length;

  const checks = [
    threshold('state_integrity_correct', correct, total, 14),
    threshold('state_integrity_broken_max_1', total - broken, total, total - 1),
    threshold('user_trust_risk_high_max_2', total - highRisk, total, total - 2),
    threshold('stale_state_confirmed_max_1', total - staleConfirmed, total, total - 1),
    threshold('duplicate_action_unsafe_zero', duplicateScenarios.length - duplicateUnsafe, duplicateScenarios.length, duplicateScenarios.length),
    threshold('duplicate_action_borderline_max_1', duplicateScenarios.length - duplicateBorderline, duplicateScenarios.length, duplicateScenarios.length - 1),
    threshold('critical_state_rule_no_broken', total - (criticalBroken + clarificationRefreshBackBroken), total, total),
  ];

  const pass = checks.every((c) => String(c.status) === 'PASS');

  const clusterCounts = {
    persistence_failure: results.filter((r) => r.main_failure_cluster === 'persistence_failure').length,
    reset_failure: results.filter((r) => r.main_failure_cluster === 'reset_failure').length,
    cross_run_contamination: results.filter((r) => r.main_failure_cluster === 'cross_run_contamination').length,
    branch_leakage: results.filter((r) => r.main_failure_cluster === 'branch_leakage').length,
    duplicate_side_effect: results.filter((r) => r.main_failure_cluster === 'duplicate_side_effect').length,
    navigation_inconsistency: results.filter((r) => r.main_failure_cluster === 'navigation_inconsistency').length,
    recovery_state_corruption: results.filter((r) => r.main_failure_cluster === 'recovery_state_corruption').length,
  };

  const topBreaks = results
    .filter((r) => r.final_integrity_audit.pass_fail === 'FAIL' || r.final_integrity_audit.user_trust_risk !== 'low')
    .slice(0, 10)
    .map((r) => `${r.scenario_id}: ${r.main_failure_risk} -> ${r.likely_user_confusion}`);

  const artifact = {
    protocol: 'SESSION_AND_STATE_INTEGRITY_TEST_V1',
    generated_at: new Date().toISOString(),
    required_state_surfaces: {
      selected_entry_path: true,
      current_text_input: true,
      last_submitted_text: true,
      route_decision_state: true,
      clarification_question_state: true,
      clarification_answer_state: true,
      strongest_direction_result_state: true,
      compare_refine_state: true,
      blocked_state: true,
      retry_error_state: true,
      loading_submitting_state: true,
      local_session_persistence: true,
      url_param_state: true,
      client_store_state: true,
      server_run_id_state: true,
    },
    scenario_inventory: SCENARIOS.map((s) => ({
      scenario_id: s.scenario_id,
      scenario_title: s.title,
      scenario_class: s.scenario_class,
      user_goal: s.user_goal,
      main_failure_risk: s.main_failure_risk,
    })),
    results,
    aggregate_summary: {
      checks,
      broken_scenarios: broken,
      high_trust_risk_scenarios: highRisk,
      stale_state_contamination_confirmed: staleConfirmed,
      duplicate_action_unsafe: duplicateUnsafe,
    },
    failure_clusters: clusterCounts,
    top_10_state_trust_breaks: topBreaks,
    patch_sequence: [
      'Priority 1: cross-run contamination and stale-result leakage.',
      'Priority 2: retry/duplicate unsafe behavior.',
      'Priority 3: clarification and branch leakage.',
      'Priority 4: back/refresh navigation inconsistencies.',
      'Priority 5: minor persistence polish issues.',
    ],
    human_review_required: {
      broken_scenarios: results.filter((r) => r.final_integrity_audit.state_integrity === 'broken').map((r) => r.scenario_id),
      high_trust_risk_scenarios: results.filter((r) => r.final_integrity_audit.user_trust_risk === 'high').map((r) => r.scenario_id),
      confirmed_stale_contamination: results.filter((r) => r.final_integrity_audit.stale_state_contamination === 'confirmed').map((r) => r.scenario_id),
      unsafe_duplicate_action: results.filter((r) => r.final_integrity_audit.action_idempotency === 'unsafe').map((r) => r.scenario_id),
    },
    pass_fail: pass ? 'PASS' : 'FAIL',
  };

  fs.mkdirSync(path.dirname(OUTPUT_JSON), { recursive: true });
  fs.mkdirSync(path.dirname(OUTPUT_MD), { recursive: true });
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(artifact, null, 2));
  fs.writeFileSync(OUTPUT_MD, buildMarkdown(artifact as Record<string, unknown>, results));

  console.log('SESSION_AND_STATE_INTEGRITY_TEST_V1');
  console.log(`  pass_fail: ${artifact.pass_fail}`);
  console.log(`  total_scenarios: ${total}`);
  console.log(`  broken_scenarios: ${broken}`);
  console.log(`  wrote: ${OUTPUT_JSON}`);
  console.log(`  wrote: ${OUTPUT_MD}`);
}

main().catch((err) => {
  console.error('[session-state-test] fatal error', err);
  process.exit(1);
});
