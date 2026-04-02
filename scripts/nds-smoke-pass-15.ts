#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { buildNdsNormalizedContextPack } from '../src/lib/ai/modules/narrative-direction-selection/normalize-context';
import { executeNdsModule } from '../src/lib/ai/modules/narrative-direction-selection/module-executor';
import type { NdsResolvedSources } from '../src/types/ai';

type Bucket = 'realization' | 'action' | 'clarification';

interface SmokeCase {
  caseId: string;
  bucket: Bucket;
  note: string;
}

const SMOKE_CASES: SmokeCase[] = [
  // Realization-winner leaning
  { caseId: 'case_014', bucket: 'realization', note: 'medium debate conflict' },
  { caseId: 'case_021', bucket: 'realization', note: 'strong family caregiving' },
  { caseId: 'case_024', bucket: 'realization', note: 'strong debate conflict' },
  { caseId: 'case_027', bucket: 'realization', note: 'strong clinic volunteer' },
  { caseId: 'case_020', bucket: 'realization', note: 'medium peer tutoring' },

  // Action-winner leaning
  { caseId: 'case_012', bucket: 'action', note: 'medium robotics leadership' },
  { caseId: 'case_013', bucket: 'action', note: 'medium restaurant ops' },
  { caseId: 'case_015', bucket: 'action', note: 'medium science fair failure' },
  { caseId: 'case_022', bucket: 'action', note: 'strong robotics leadership' },
  { caseId: 'case_023', bucket: 'action', note: 'strong restaurant ops' },

  // Clarification-leaning (weak/noisy)
  { caseId: 'case_001', bucket: 'clarification', note: 'weak family caregiving' },
  { caseId: 'case_003', bucket: 'clarification', note: 'weak restaurant ops' },
  { caseId: 'case_005', bucket: 'clarification', note: 'weak science fair' },
  { caseId: 'case_007', bucket: 'clarification', note: 'weak clinic volunteer' },
  { caseId: 'case_009', bucket: 'clarification', note: 'weak cross-country recovery' },
];

const FALLBACK_PATTERNS = [
  /change signal is limited/i,
  /partial change indicators/i,
  /no clear evidence span available/i,
  /needs clearer evidence/i,
];

function mapCaseToSources(caseId: string): NdsResolvedSources {
  const casePath = path.join('evaluation', 'cases', `${caseId}.json`);
  const c = JSON.parse(fs.readFileSync(casePath, 'utf8'));
  return {
    essay_project: {
      id: c.essay_project.project_id,
      student_user_id: `smoke_${caseId}`,
      title: c.label,
      status: 'not_started',
      selected_direction_artifact_id: null,
    },
    student_profile: {
      user_id: `smoke_${caseId}`,
      first_name: 'Smoke',
      last_name: caseId,
      grade: Number(c.student_profile.grade_level) || null,
      interests: c.student_profile.core_interests,
    },
    story_entries: c.story_entries.map((s: { id: string; text: string }) => ({
      id: s.id,
      title: s.id,
      body: s.text,
      category: null,
    })),
    current_draft: c.current_draft?.text
      ? {
          id: c.current_draft.id ?? `${caseId}_draft`,
          draft_text: c.current_draft.text,
          version_number: 1,
        }
      : null,
    school_context: c.school_context?.target_school
      ? {
          source_id: `${caseId}_school_ctx`,
          target_school: c.school_context.target_school,
          signal_summary: c.school_context.notes || 'school context provided',
        }
      : null,
    source_meta: {
      story_entry_count: c.story_entries.length,
      has_current_draft: !!c.current_draft?.text,
      has_school_context: !!c.school_context?.target_school,
    },
  };
}

function qualityLabel(value: number): 'high' | 'medium' | 'low' {
  if (value >= 0.75) return 'high';
  if (value >= 0.5) return 'medium';
  return 'low';
}

function explanationQuality(payload: any): { score: number; label: string; note: string } {
  const best = payload?.best_direction ?? {};
  const text = [
    best.core_claim,
    best.why_this_is_the_real_story,
    best.what_it_reveals_about_the_student,
    best.why_it_beats_the_obvious_angle,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const lengthScore = Math.min(1, text.length / 480);
  const hasConcreteLexicon = /when|after|because|specific|moment|feedback|changed|realized|delegat|redesign|trained|impact|team|patient|student/i.test(
    text
  );
  const genericPenalty = /leadership and growth|generic|strongest version|real turn/i.test(text) ? 0.2 : 0;
  const score = Math.max(0, Math.min(1, lengthScore * 0.7 + (hasConcreteLexicon ? 0.3 : 0.1) - genericPenalty));

  return {
    score,
    label: qualityLabel(score),
    note: hasConcreteLexicon ? 'Concrete causal framing present' : 'Mostly abstract framing',
  };
}

function evidenceNoteQuality(payload: any): { score: number; label: string; note: string } {
  const selected = payload?.candidates?.find((c: any) => c.selected) ?? payload?.candidates?.[0];
  const spans: string[] = (selected?.evidence_spans ?? []).map((s: any) => String(s.text ?? ''));
  const joined = spans.join(' ').toLowerCase();

  const fallbackHit = FALLBACK_PATTERNS.some((p) => p.test(joined));
  const spanCountScore = Math.min(1, spans.length / 2);
  const lengthScore = Math.min(1, joined.length / 220);
  const score = Math.max(0, Math.min(1, spanCountScore * 0.45 + lengthScore * 0.55 - (fallbackHit ? 0.45 : 0)));

  return {
    score,
    label: qualityLabel(score),
    note: fallbackHit ? 'Fallback language detected' : 'Evidence notes are student-grounded',
  };
}

async function run(): Promise<void> {
  console.log('NDS 15-case smoke pass\n');

  let passCount = 0;

  for (const item of SMOKE_CASES) {
    const sources = mapCaseToSources(item.caseId);
    const pack = buildNdsNormalizedContextPack(sources);

    const runOut = await executeNdsModule({
      run_id: `smoke_${item.caseId}`,
      module_key: 'narrative_direction_selection',
      execution_mode: 'standard',
      context_pack: pack,
      module_versions: {
        prompt_version: 'v1',
        schema_version: 'v1',
        validator_version: 'v1',
      },
    });

    const payload = runOut.candidate_payload as any;
    const winner = payload?.selected_candidate_id ?? payload?.candidates?.[0]?.candidate_id ?? 'n/a';
    const confidence = payload?.confidence_band ?? 'n/a';
    const route = payload?.route_decision ?? 'n/a';

    const explanation = explanationQuality(payload);
    const evidence = evidenceNoteQuality(payload);

    let expectedOk = true;
    if (item.bucket === 'clarification') {
      expectedOk = route === 'ask_question_before_showing';
    }

    if (expectedOk) passCount += 1;

    console.log(`${item.caseId} [${item.bucket}] ${item.note}`);
    console.log(`  winner: ${winner}`);
    console.log(`  confidence band: ${confidence}`);
    console.log(`  route decision: ${route}`);
    console.log(`  explanation quality: ${explanation.label} (${explanation.score.toFixed(2)}) - ${explanation.note}`);
    console.log(`  evidence-note quality: ${evidence.label} (${evidence.score.toFixed(2)}) - ${evidence.note}`);
    console.log('');
  }

  console.log(`Smoke pass complete: ${passCount}/${SMOKE_CASES.length} cases met bucket expectation checks.`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
