import fs from 'node:fs';
import path from 'node:path';

const REVIEW_DIR = path.join(
  process.cwd(),
  'evaluation',
  'intake',
  'ric_human_reviews',
  'post_nds_result_screen_human_clarity',
);
const OUT_JSON = path.join(process.cwd(), 'evaluation_outputs', 'post_nds_result_screen_human_clarity_v1.json');
const OUT_MD = path.join(process.cwd(), 'evaluation_outputs', 'POST_NDS_RESULT_SCREEN_HUMAN_CLARITY_REVIEW_V1.md');

const SCORE_VALUES = ['pass', 'partial', 'fail'] as const;
type ScoreValue = (typeof SCORE_VALUES)[number];
const QUESTIONS = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'] as const;
type QuestionKey = (typeof QUESTIONS)[number];

type ReviewRow = {
  participant_id: string;
  participant_type: string;
  case_id: string;
  time_to_first_confident_answer_seconds: number;
  q1_answer: string;
  q1_score: ScoreValue;
  q2_answer: string;
  q2_score: ScoreValue;
  q3_answer: string;
  q3_score: ScoreValue;
  q4_answer: string;
  q4_score: ScoreValue;
  q5_answer: string;
  q5_score: ScoreValue;
  q6_answer: string;
  q6_score: ScoreValue;
  hesitation_points: string;
  repeated_phrases: string;
  confusing_phrases: string;
  asked_for_clarification: boolean;
  misread_cta: boolean;
  notes: string;
};

function splitCsv(line: string): string[] {
  const out: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === ',' && !inQuotes) {
      out.push(current.trim());
      current = '';
      continue;
    }
    current += char;
  }
  out.push(current.trim());
  return out;
}

function getCol(cols: string[], index: Map<string, number>, name: string): string {
  const col = index.get(name);
  return col == null ? '' : (cols[col] ?? '').trim();
}

function parseBool(value: string): boolean {
  return value.toLowerCase() === 'true';
}

function parseScore(value: string): ScoreValue {
  const normalized = value.toLowerCase() as ScoreValue;
  if (!SCORE_VALUES.includes(normalized)) {
    throw new Error(`Invalid score value: ${value}`);
  }
  return normalized;
}

function countScores(rows: ReviewRow[], key: `${QuestionKey}_score`) {
  return {
    pass: rows.filter((row) => row[key] === 'pass').length,
    partial: rows.filter((row) => row[key] === 'partial').length,
    fail: rows.filter((row) => row[key] === 'fail').length,
  };
}

function scoreRate(count: number, total: number): number {
  return total === 0 ? 0 : Number((count / total).toFixed(3));
}

function collectTopPhrases(values: string[]): Array<{ phrase: string; count: number }> {
  const freq = new Map<string, number>();
  for (const value of values) {
    value
      .split(/[|;]/)
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((item) => {
        freq.set(item, (freq.get(item) ?? 0) + 1);
      });
  }

  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([phrase, count]) => ({ phrase, count }));
}

function overallDecision(questionSummary: Record<QuestionKey, ReturnType<typeof countScores>>, participantCount: number): 'pass' | 'conditional pass' | 'fail' {
  if (participantCount < 3) return 'fail';

  const majorityPass = (key: QuestionKey) => questionSummary[key].pass > participantCount / 2;
  const anyFails = (key: QuestionKey) => questionSummary[key].fail > 0;

  const criticalKeys: QuestionKey[] = ['q1', 'q2', 'q4', 'q5', 'q6'];
  const passOnCritical = criticalKeys.every(majorityPass);
  const repeatedFailureCount = criticalKeys.filter(anyFails).length + (anyFails('q3') ? 1 : 0);

  if (passOnCritical && repeatedFailureCount === 0) return 'pass';
  if (passOnCritical || repeatedFailureCount <= 2) return 'conditional pass';
  return 'fail';
}

function requiredChanges(questionSummary: Record<QuestionKey, ReturnType<typeof countScores>>): string[] {
  const changes: string[] = [];
  const needsWork = (key: QuestionKey) => questionSummary[key].pass <= questionSummary[key].partial + questionSummary[key].fail;

  if (needsWork('q1')) changes.push('Tighten the subhead and essay-about explanation.');
  if (needsWork('q2')) changes.push('Make “what to write first” more sentence-level and concrete.');
  if (needsWork('q3')) changes.push('Rewrite warnings in plainer language.');
  if (needsWork('q4')) changes.push('Strengthen “what to write right after the opening.”');
  if (needsWork('q5')) changes.push('Rename or reorder buttons to make CTA choice more obvious.');
  if (needsWork('q6')) changes.push('Make the whole screen more operational and less advisory.');

  return changes.length > 0 ? changes : ['No required copy changes before next iteration.'];
}

function toMarkdown(data: {
  participantCount: number;
  participantTypes: string[];
  questionSummary: Record<QuestionKey, ReturnType<typeof countScores>>;
  confusion: Array<{ phrase: string; count: number }>;
  hesitation: Array<{ phrase: string; count: number }>;
  overall: 'pass' | 'conditional pass' | 'fail';
  requiredChanges: string[];
}): string {
  const questionLabels: Record<QuestionKey, string> = {
    q1: 'Essay-about clarity',
    q2: 'First-step clarity',
    q3: 'Anti-pattern clarity',
    q4: 'Next-step clarity',
    q5: 'CTA clarity',
    q6: 'Overall readiness',
  };

  const lines = [
    '# POST_NDS_RESULT_SCREEN_HUMAN_CLARITY_REVIEW_V1',
    '',
    `- Participant count: ${data.participantCount}`,
    `- Participant types: ${data.participantTypes.join(', ') || 'none'}`,
    `- Overall result: ${data.overall}`,
    '',
    '## Per-question summary',
    '',
    '| Dimension | Pass | Partial | Fail |',
    '| --- | ---: | ---: | ---: |',
  ];

  for (const key of QUESTIONS) {
    const row = data.questionSummary[key];
    lines.push(`| ${questionLabels[key]} | ${row.pass} | ${row.partial} | ${row.fail} |`);
  }

  lines.push('', '## Common confusion points', '');
  if (data.confusion.length === 0) {
    lines.push('- None captured.');
  } else {
    for (const item of data.confusion) {
      lines.push(`- ${item.phrase} (${item.count})`);
    }
  }

  lines.push('', '## Common hesitation points', '');
  if (data.hesitation.length === 0) {
    lines.push('- None captured.');
  } else {
    for (const item of data.hesitation) {
      lines.push(`- ${item.phrase} (${item.count})`);
    }
  }

  lines.push('', '## Specific changes required before next iteration', '');
  for (const change of data.requiredChanges) {
    lines.push(`- ${change}`);
  }

  return `${lines.join('\n')}\n`;
}

async function main(): Promise<void> {
  const files = fs.existsSync(REVIEW_DIR)
    ? fs.readdirSync(REVIEW_DIR).filter((file) => file.endsWith('.csv') && !file.startsWith('reviewer_template'))
    : [];

  if (files.length === 0) {
    console.log('POST_NDS_RESULT_SCREEN_HUMAN_CLARITY_NO_DATA', JSON.stringify({ reviewDir: REVIEW_DIR }));
    return;
  }

  const rows: ReviewRow[] = [];
  for (const file of files) {
    const content = fs.readFileSync(path.join(REVIEW_DIR, file), 'utf-8').trim();
    if (!content) continue;
    const lines = content.split(/\r?\n/).filter(Boolean);
    if (lines.length <= 1) continue;

    const header = splitCsv(lines[0]);
    const index = new Map<string, number>(header.map((name, idx) => [name.trim(), idx]));

    for (let i = 1; i < lines.length; i += 1) {
      const cols = splitCsv(lines[i]);
      rows.push({
        participant_id: getCol(cols, index, 'participant_id'),
        participant_type: getCol(cols, index, 'participant_type'),
        case_id: getCol(cols, index, 'case_id'),
        time_to_first_confident_answer_seconds: Number(getCol(cols, index, 'time_to_first_confident_answer_seconds')),
        q1_answer: getCol(cols, index, 'q1_answer'),
        q1_score: parseScore(getCol(cols, index, 'q1_score')),
        q2_answer: getCol(cols, index, 'q2_answer'),
        q2_score: parseScore(getCol(cols, index, 'q2_score')),
        q3_answer: getCol(cols, index, 'q3_answer'),
        q3_score: parseScore(getCol(cols, index, 'q3_score')),
        q4_answer: getCol(cols, index, 'q4_answer'),
        q4_score: parseScore(getCol(cols, index, 'q4_score')),
        q5_answer: getCol(cols, index, 'q5_answer'),
        q5_score: parseScore(getCol(cols, index, 'q5_score')),
        q6_answer: getCol(cols, index, 'q6_answer'),
        q6_score: parseScore(getCol(cols, index, 'q6_score')),
        hesitation_points: getCol(cols, index, 'hesitation_points'),
        repeated_phrases: getCol(cols, index, 'repeated_phrases'),
        confusing_phrases: getCol(cols, index, 'confusing_phrases'),
        asked_for_clarification: parseBool(getCol(cols, index, 'asked_for_clarification')),
        misread_cta: parseBool(getCol(cols, index, 'misread_cta')),
        notes: getCol(cols, index, 'notes'),
      });
    }
  }

  const questionSummary = {
    q1: countScores(rows, 'q1_score'),
    q2: countScores(rows, 'q2_score'),
    q3: countScores(rows, 'q3_score'),
    q4: countScores(rows, 'q4_score'),
    q5: countScores(rows, 'q5_score'),
    q6: countScores(rows, 'q6_score'),
  } satisfies Record<QuestionKey, ReturnType<typeof countScores>>;

  const participantTypes = [...new Set(rows.map((row) => row.participant_type).filter(Boolean))];
  const participantIds = [...new Set(rows.map((row) => row.participant_id).filter(Boolean))];
  const confusion = collectTopPhrases(rows.map((row) => row.confusing_phrases));
  const hesitation = collectTopPhrases(rows.map((row) => row.hesitation_points));
  const overall = overallDecision(questionSummary, participantIds.length);
  const changes = requiredChanges(questionSummary);
  const askedForClarificationRate = scoreRate(rows.filter((row) => row.asked_for_clarification).length, rows.length);
  const misreadCtaRate = scoreRate(rows.filter((row) => row.misread_cta).length, rows.length);
  const avgTime = rows.length === 0
    ? 0
    : Number((rows.reduce((sum, row) => sum + row.time_to_first_confident_answer_seconds, 0) / rows.length).toFixed(1));

  const structured = {
    generated_at: new Date().toISOString(),
    participant_count: participantIds.length,
    participant_types: participantTypes,
    review_row_count: rows.length,
    per_question_summary: questionSummary,
    common_confusion_points: confusion,
    common_hesitation_points: hesitation,
    observation_summary: {
      average_time_to_first_confident_answer_seconds: avgTime,
      asked_for_clarification_rate: askedForClarificationRate,
      misread_cta_rate: misreadCtaRate,
    },
    overall_result: overall,
    specific_changes_required_before_next_iteration: changes,
    rows,
  };

  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
  fs.writeFileSync(OUT_JSON, JSON.stringify(structured, null, 2), 'utf-8');
  fs.writeFileSync(
    OUT_MD,
    toMarkdown({
      participantCount: participantIds.length,
      participantTypes,
      questionSummary,
      confusion,
      hesitation,
      overall,
      requiredChanges: changes,
    }),
    'utf-8',
  );

  console.log('POST_NDS_RESULT_SCREEN_HUMAN_CLARITY_REVIEW_READY', JSON.stringify({ outJson: OUT_JSON, outMd: OUT_MD, overall }));
}

main().catch((error) => {
  console.error('POST_NDS_RESULT_SCREEN_HUMAN_CLARITY_REVIEW_FAILED', error);
  process.exit(1);
});
