#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

type JsonObject = Record<string, unknown>;

type RepairRecord = {
  screen_id: string;
  pre_patch_severity: 'high' | 'medium' | 'low';
  issue_cluster: string;
  main_trust_break: string;
  changes_made: string[];
  post_patch_expected_improvement: string;
  owner: string;
  status: 'completed' | 'in_progress' | 'blocked';
};

const ROOT = process.cwd();
const TRUST_AUDIT_JSON = path.join(ROOT, 'evaluation_outputs', 'screen_by_screen_trust_audit_v1.json');
const OUTPUT_JSON = path.join(ROOT, 'evaluation_outputs', 'product_trust_repair_sprint_v1.json');
const OUTPUT_MD = path.join(ROOT, 'docs', 'engineering', 'PRODUCT_TRUST_REPAIR_SPRINT_RESULTS_V1.md');

function readJson(filePath: string): JsonObject {
  if (!fs.existsSync(filePath)) throw new Error(`Missing required artifact: ${filePath}`);
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as JsonObject;
}

function main(): void {
  const audit = readJson(TRUST_AUDIT_JSON);
  const packets = (audit.packets ?? []) as Array<Record<string, unknown>>;
  const summary = (audit.aggregate_summary ?? {}) as Record<string, unknown>;
  const thresholds = (summary.thresholds ?? []) as Array<Record<string, unknown>>;
  const passFail = String(summary.pass_fail ?? 'FAIL');

  const prePatchFailureProfile = {
    pass_fail: 'FAIL',
    language_quality_strong_ratio: 0.667,
    emotional_fit_strong_fit_ratio: 0.667,
    high_severity_screens: 3,
    notes: 'Baseline from initial SCREEN_BY_SCREEN_TRUST_AUDIT_V1 run before trust-repair sprint patches.',
  };

  const repairRecords: RepairRecord[] = [
    {
      screen_id: 'SSTA_04',
      pre_patch_severity: 'high',
      issue_cluster: 'output_framing',
      main_trust_break: 'Result framing felt template-heavy and less student-readable under weak/ambiguous inputs.',
      changes_made: [
        'Reframed result labels in reflecting screen to plain-language, student-facing headings.',
        'Clarified secondary CTA to emphasize sharpening purpose and lowered ambiguity.',
      ],
      post_patch_expected_improvement: 'Higher language quality and emotional-fit perception on first result exposure.',
      owner: 'frontend + product copy',
      status: 'completed',
    },
    {
      screen_id: 'SSTA_05',
      pre_patch_severity: 'high',
      issue_cluster: 'output_framing',
      main_trust_break: 'Direction screen action rationale and label tone were weaker than trust target.',
      changes_made: [
        'Renamed section labels for clarity: result rationale, generic-risk warning, and immediate next move.',
        'Improved CTA wording to make compare vs sharpen paths unmistakably distinct.',
      ],
      post_patch_expected_improvement: 'Stronger action clarity and less generic-feeling result framing.',
      owner: 'frontend + product copy',
      status: 'completed',
    },
    {
      screen_id: 'SSTA_09',
      pre_patch_severity: 'high',
      issue_cluster: 'trust',
      main_trust_break: 'Submit failure path had no visible explanation or explicit retry guidance.',
      changes_made: [
        'Added explicit inline error state on intake submit failure.',
        'Added reassurance copy that notes are preserved and retry is safe.',
        'Updated primary CTA copy to switch to retry behavior after failure.',
      ],
      post_patch_expected_improvement: 'Trust-break removed for API failure path; recovery action now explicit.',
      owner: 'frontend',
      status: 'completed',
    },
    {
      screen_id: 'SSTA_02',
      pre_patch_severity: 'low',
      issue_cluster: 'cta_next_step',
      main_trust_break: 'Entry-mode branching and acceptable-input expectations were not explicit enough.',
      changes_made: [
        'Added notes vs draft mode-specific headings, examples, and placeholders.',
        'Added mode indicator copy to reduce branching ambiguity.',
      ],
      post_patch_expected_improvement: 'Lower first-input confusion and clearer start expectations.',
      owner: 'frontend + product copy',
      status: 'completed',
    },
    {
      screen_id: 'SSTA_06',
      pre_patch_severity: 'low',
      issue_cluster: 'trust',
      main_trust_break: 'Clarification step needed stronger dignity framing and quality-safeguard explanation.',
      changes_made: [
        'Added explicit safeguard framing (“not a rejection”).',
        'Reworded CTA labels to concrete next actions.',
      ],
      post_patch_expected_improvement: 'Recovery state feels intentional rather than fallback-like.',
      owner: 'frontend + product copy',
      status: 'completed',
    },
    {
      screen_id: 'SSTA_07',
      pre_patch_severity: 'low',
      issue_cluster: 'recovery',
      main_trust_break: 'Blocked state needed stronger dignity language and concrete next-step guidance.',
      changes_made: [
        'Added dignity-preserving reassurance copy.',
        'Reworded actions to “focused question” and “concrete detail” framing.',
      ],
      post_patch_expected_improvement: 'Blocked state reads as quality control, not product failure.',
      owner: 'frontend + product copy',
      status: 'completed',
    },
  ];

  const postPatch = {
    pass_fail: passFail,
    thresholds,
    high_severity_screens: Number(summary.high_severity_screens ?? 0),
    result_screen_rule: summary.result_screen_rule ?? {},
  };

  const remainingHighSeverity = packets
    .filter((p) => String((p as JsonObject).severity ?? '') === 'high')
    .map((p) => ({
      screen_id: String((p as JsonObject).screen_id ?? 'n/a'),
      screen_name: String((p as JsonObject).screen_name ?? 'n/a'),
      main_issue_cluster: String((p as JsonObject).main_issue_cluster ?? 'n/a'),
    }));

  const failureClusters = (audit.failure_clusters ?? {}) as Record<string, unknown>;

  const artifact = {
    sprint: 'PRODUCT_TRUST_REPAIR_SPRINT_V1',
    generated_at: new Date().toISOString(),
    sprint_purpose:
      'Repair trust, clarity, flow, and emotional-fit failures identified by SCREEN_BY_SCREEN_TRUST_AUDIT_V1 before launch readiness.',
    pre_patch_failure_profile: prePatchFailureProfile,
    repaired_screens_by_priority: {
      priority_1_result_screens: repairRecords.filter((r) => ['SSTA_04', 'SSTA_05'].includes(r.screen_id)),
      priority_2_input_branching: repairRecords.filter((r) => r.screen_id === 'SSTA_02'),
      priority_3_recovery: repairRecords.filter((r) => ['SSTA_06', 'SSTA_07'].includes(r.screen_id)),
      priority_4_supporting_states: repairRecords.filter((r) => r.screen_id === 'SSTA_09'),
    },
    per_screen_repair_record: repairRecords,
    before_after_summary: {
      language_quality_strong_ratio: `${prePatchFailureProfile.language_quality_strong_ratio} -> see post thresholds`,
      emotional_fit_strong_fit_ratio: `${prePatchFailureProfile.emotional_fit_strong_fit_ratio} -> see post thresholds`,
      high_severity_screens: `${prePatchFailureProfile.high_severity_screens} -> ${postPatch.high_severity_screens}`,
    },
    post_patch_trust_audit_result: postPatch,
    remaining_high_severity_screens: remainingHighSeverity,
    remaining_issue_clusters: failureClusters,
    validation_commands_run: [
      'npm run test:product:screen-trust',
      'npm run test:nds:evidence-grounding',
      'npm run test:nds:direction-line-fit',
    ],
    next_recommended_product_sprint:
      remainingHighSeverity.length > 0
        ? 'PRODUCT_TRUST_RESULT_PRESENTATION_REFINEMENT_SPRINT_V1'
        : 'PRODUCT_TRUST_COHERENCE_POLISH_SPRINT_V1',
    release_recommendation:
      passFail === 'PASS'
        ? 'Proceed with launch-readiness checklist; keep trust audit in hard gate.'
        : 'BLOCK launch-readiness until trust audit thresholds are met.',
  };

  fs.mkdirSync(path.dirname(OUTPUT_JSON), { recursive: true });
  fs.mkdirSync(path.dirname(OUTPUT_MD), { recursive: true });
  fs.writeFileSync(OUTPUT_JSON, JSON.stringify(artifact, null, 2));

  const thresholdLines = thresholds.map((t) => {
    const metric = String((t as JsonObject).metric ?? 'unknown');
    const passed = Number((t as JsonObject).passed ?? 0);
    const total = Number((t as JsonObject).total ?? 0);
    const ratio = Number((t as JsonObject).ratio ?? 0);
    const threshold = Number((t as JsonObject).threshold ?? 0);
    const status = String((t as JsonObject).status ?? 'FAIL');
    return `- ${metric}: ${passed}/${total} (${(ratio * 100).toFixed(1)}%) vs ${(threshold * 100).toFixed(0)}% -> ${status}`;
  });

  const md = [
    '# PRODUCT_TRUST_REPAIR_SPRINT_RESULTS_V1',
    '',
    '## sprint purpose',
    '',
    artifact.sprint_purpose,
    '',
    '## pre-patch failure profile',
    '',
    `- pass_fail: ${prePatchFailureProfile.pass_fail}`,
    `- language_quality_strong_ratio: ${(prePatchFailureProfile.language_quality_strong_ratio * 100).toFixed(1)}%`,
    `- emotional_fit_strong_fit_ratio: ${(prePatchFailureProfile.emotional_fit_strong_fit_ratio * 100).toFixed(1)}%`,
    `- high_severity_screens: ${prePatchFailureProfile.high_severity_screens}`,
    '',
    '## repaired screens by priority',
    '',
    '- Priority 1: SSTA_04, SSTA_05',
    '- Priority 2: SSTA_02',
    '- Priority 3: SSTA_06, SSTA_07',
    '- Priority 4: SSTA_09',
    '',
    '## before/after summary',
    '',
    `- high_severity_screens: ${prePatchFailureProfile.high_severity_screens} -> ${postPatch.high_severity_screens}`,
    '',
    '## post-patch trust audit result',
    '',
    `**${postPatch.pass_fail}**`,
    ...thresholdLines,
    '',
    '## remaining high-severity screens',
    '',
    ...(remainingHighSeverity.length > 0
      ? remainingHighSeverity.map((x) => `- ${x.screen_id} ${x.screen_name} (${x.main_issue_cluster})`)
      : ['- none']),
    '',
    '## remaining issue clusters',
    '',
    ...Object.entries(failureClusters).map(([k, v]) => `- ${k}: ${Array.isArray(v) ? v.length : 0}`),
    '',
    '## next recommended product sprint',
    '',
    artifact.next_recommended_product_sprint,
    '',
  ].join('\n');

  fs.writeFileSync(OUTPUT_MD, md);

  console.log('PRODUCT_TRUST_REPAIR_SPRINT_V1');
  console.log(`  post_patch_trust_audit: ${postPatch.pass_fail}`);
  console.log(`  wrote: ${OUTPUT_JSON}`);
  console.log(`  wrote: ${OUTPUT_MD}`);
}

main();
