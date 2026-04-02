import fs from 'node:fs';
import path from 'node:path';
import { runIntakeOrchestrator } from '@/lib/ai/modules/narrative-intake/intake-orchestrator';
import { normalizeFirstMinuteDecision } from '@/lib/fm/firstMinuteDecisionNormalizer';
import { createSessionCaseState } from '@/lib/fm/case-state';
import { buildEvidenceFeatures } from '@/lib/ml/evidenceStrength/predict';
import type { IntakeSessionInput } from '@/types/intake';

type HoldoutCase = {
  case_id: string;
  title: string;
  narrative_pattern: string;
  signal_quality: string;
  raw_notes: string;
};

async function main() {
  const inPath = path.resolve(process.cwd(), process.env.HOLDOUT_CASES_PATH || 'scripts/data/page3-holdout-v4-cases.json');
  const outPath = path.resolve(process.cwd(), process.env.OUT_PATH || 'evaluation_outputs/page3_holdout_v4_thematic/unknown_path_audit.json');

  const cases = JSON.parse(fs.readFileSync(inPath, 'utf-8')) as HoldoutCase[];
  const rows: Array<Record<string, unknown>> = [];

  for (const c of cases) {
    const now = new Date().toISOString();
    const storyEntry = {
      id: `${c.case_id}_entry_1`,
      title: 'Initial notes',
      text: c.raw_notes,
      created_at: now,
    };

    const input: IntakeSessionInput = {
      session_id: `unknown_audit_${c.case_id}`,
      student_user_id: `unknown_audit_${c.case_id}`,
      subject_entity_id: `unknown_audit_${c.case_id}`,
      story_entries: [storyEntry],
      draft_text: null,
      draft_id: null,
      school_context: null,
      student_profile: null,
      prior_attempt_count: 0,
      questions_asked: [],
      rejected_source_ids: [],
      session_created_at: now,
    };

    const intake = await runIntakeOrchestrator(input);
    const normalized = normalizeFirstMinuteDecision(c.raw_notes, intake as any);
    const caseState = createSessionCaseState(c.raw_notes, normalized as any);
    const features = buildEvidenceFeatures({
      rawInput: c.raw_notes,
      normalizedInput: c.raw_notes,
      intelligence: normalized as any,
      sessionCaseState: caseState,
    });

    const unknown = normalized.narrative_pattern.primary_pattern === 'unknown';
    const unknownDrivers: string[] = [];
    if (unknown) {
      unknownDrivers.push(...(normalized.narrative_pattern.reason_codes || []));
      if (normalized.usable_signal.signal_strength === 'none') unknownDrivers.push('usable_signal_none');
      if ((normalized.authorship_signal?.student_scene_evidence || 'absent') === 'absent') unknownDrivers.push('scene_evidence_absent');
      if (features.turningPointPresent === 0) unknownDrivers.push('turning_point_missing');
      if (features.consequencePresent === 0) unknownDrivers.push('consequence_missing');
      if (features.sceneSpecificityScore < 0.3) unknownDrivers.push('low_scene_specificity');
    }

    rows.push({
      case_id: c.case_id,
      title: c.title,
      expected_pattern: c.narrative_pattern,
      signal_quality_label: c.signal_quality,
      raw_notes: c.raw_notes,
      runtime_story_entries: [storyEntry],
      extracted_features: {
        token_count: features.tokenCount,
        scene_specificity_score: features.sceneSpecificityScore,
        turning_point_present: features.turningPointPresent,
        consequence_present: features.consequencePresent,
        reflection_present: features.reflectionPresent,
        conflict_present: features.conflictPresent,
        trusted_evidence_count: features.trustedEvidenceCount,
      },
      classifier_decision: {
        primary_pattern: normalized.narrative_pattern.primary_pattern,
        confidence: normalized.narrative_pattern.confidence,
        reason_codes: normalized.narrative_pattern.reason_codes,
      },
      viability: normalized.recommendation_viability.decision,
      unknown_path: unknown,
      unknown_drivers: Array.from(new Set(unknownDrivers)),
    });
  }

  const unknownRows = rows.filter((r) => Boolean(r.unknown_path));
  const report = {
    generated_at: new Date().toISOString(),
    input_cases_path: path.relative(process.cwd(), inPath),
    summary: {
      total_cases: rows.length,
      unknown_cases: unknownRows.length,
      unknown_rate: rows.length ? Number((unknownRows.length / rows.length).toFixed(3)) : 0,
      immediate_target: '< 0.15',
    },
    rows,
  };

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + '\n', 'utf-8');

  console.log(JSON.stringify(report.summary, null, 2));
  console.log(`Wrote ${path.relative(process.cwd(), outPath)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
