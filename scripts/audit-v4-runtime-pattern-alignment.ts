import fs from 'node:fs';
import path from 'node:path';
import { runIntakeOrchestrator } from '@/lib/ai/modules/narrative-intake/intake-orchestrator';
import type { IntakeSessionInput, NarrativePattern } from '@/types/intake';

type HoldoutCase = {
  case_id: string;
  title: string;
  narrative_pattern: NarrativePattern;
  signal_quality: string;
  raw_notes: string;
};

async function main() {
  const casesPath = path.resolve(process.cwd(), 'scripts/data/page3-holdout-v4-cases.json');
  const outPath = path.resolve(process.cwd(), 'evaluation_outputs/page3_holdout_v4_thematic/runtime_pattern_alignment.json');

  const cases = JSON.parse(fs.readFileSync(casesPath, 'utf-8')) as HoldoutCase[];

  const rows: Array<{
    case_id: string;
    expected_pattern: NarrativePattern;
    runtime_pattern: NarrativePattern;
    confidence: string;
    matches_expected: boolean;
    viability: string;
    route_hint: 'direction' | 'clarification';
  }> = [];

  for (const c of cases) {
    const input: IntakeSessionInput = {
      session_id: `runtime_pattern_${c.case_id}`,
      student_user_id: `runtime_pattern_${c.case_id}`,
      subject_entity_id: `runtime_pattern_${c.case_id}`,
      story_entries: [
        {
          id: `${c.case_id}_entry_1`,
          title: 'Initial notes',
          text: c.raw_notes,
        },
      ],
      draft_text: null,
      draft_id: null,
      school_context: null,
      student_profile: null,
      prior_attempt_count: 0,
      questions_asked: [],
      rejected_source_ids: [],
      session_created_at: new Date().toISOString(),
    };

    const result = await runIntakeOrchestrator(input);
    const runtimePattern = result.narrative_pattern.primary_pattern;
    const viability = result.recommendation_viability.decision;

    rows.push({
      case_id: c.case_id,
      expected_pattern: c.narrative_pattern,
      runtime_pattern: runtimePattern,
      confidence: result.narrative_pattern.confidence,
      matches_expected: runtimePattern === c.narrative_pattern,
      viability,
      route_hint: viability === 'needs_more_input' ? 'clarification' : 'direction',
    });
  }

  const counts = rows.reduce(
    (acc, row) => {
      acc.total += 1;
      if (row.runtime_pattern === 'unknown') acc.unknown += 1;
      if (row.matches_expected) acc.matches_expected += 1;
      return acc;
    },
    { total: 0, unknown: 0, matches_expected: 0 }
  );

  const report = {
    generated_at: new Date().toISOString(),
    cases_path: path.relative(process.cwd(), casesPath),
    summary: {
      total_cases: counts.total,
      unknown_runtime_patterns: counts.unknown,
      unknown_rate: counts.total > 0 ? Number((counts.unknown / counts.total).toFixed(3)) : 0,
      expected_pattern_match_count: counts.matches_expected,
      expected_pattern_match_rate: counts.total > 0 ? Number((counts.matches_expected / counts.total).toFixed(3)) : 0,
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
