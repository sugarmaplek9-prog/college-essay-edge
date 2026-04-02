/**
 * Regenerates blind_review_10.packet.md with full student input context.
 * Preserves existing A/B assignments from blind_review_10.decode.json.
 * Run: node evaluation/scripts/regen-blind-packet.js <runDir>
 */

const fs = require('fs');
const path = require('path');

const runDir = process.argv[2];
if (!runDir) {
  console.error('Usage: node regen-blind-packet.js <runDir>');
  process.exit(1);
}

const auditDir = path.join(runDir, 'result_audit');
const ndsDir = path.join(runDir, 'nds_cases');
const baseDir = path.join(runDir, 'baseline_cases');

const caseIds = JSON.parse(
  fs.readFileSync(path.join(auditDir, 'blind_review_10.case_ids.json'), 'utf8')
).selected_case_ids;

const decode = JSON.parse(
  fs.readFileSync(path.join(auditDir, 'blind_review_10.decode.json'), 'utf8')
);

function loadCase(caseId) {
  return JSON.parse(fs.readFileSync(path.join('evaluation/cases', caseId + '.json'), 'utf8'));
}

function loadOutput(dir, caseId) {
  const p = path.join(dir, caseId + '.json');
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

/**
 * Extract the clean reviewer-facing output from a run artifact.
 * Supports both NDS artifacts (artifact_payload) and baseline artifacts (normalized_output).
 * Strips run metadata and system identity so the packet stays blind.
 */
function extractCleanOutput(artifact) {
  // NDS artifact shape
  if (artifact.artifact_payload) {
    const p = artifact.artifact_payload;
    const bd = p.best_direction || {};
    return {
      status: p.status,
      best_direction: bd,
      alternatives: p.alternatives || [],
      evidence_anchors: p.evidence_anchors || [],
      depth_signals: p.depth_signals || {
        detected_tension: null,
        detected_shift: null,
        obvious_but_weaker_angle: null,
        essay_opportunity: null,
      },
      recovery_question: p.recovery_question || null,
      meta: {
        clear_winner_present: (p.status === 'success') && !!(bd.angle_title || bd.title),
        alternative_count: (p.alternatives || []).length,
        evidence_anchor_count: (p.evidence_anchors || []).length,
      },
    };
  }
  // Baseline artifact shape
  if (artifact.normalized_output) {
    const n = artifact.normalized_output;
    const bd = n.best_direction || {};
    return {
      status: n.status,
      best_direction: bd,
      alternatives: n.alternatives || [],
      evidence_anchors: n.evidence_anchors || [],
      depth_signals: n.depth_signals || {
        detected_tension: null,
        detected_shift: null,
        obvious_but_weaker_angle: null,
        essay_opportunity: null,
      },
      recovery_question: n.recovery_question || null,
      meta: {
        clear_winner_present: n.status === 'success' && !!(bd.angle_title || bd.title),
        alternative_count: (n.alternatives || []).length,
        evidence_anchor_count: (n.evidence_anchors || []).length,
      },
    };
  }
  // Fallback: return raw minus system
  const { system, run_id, ...rest } = artifact;
  return rest;
}

function renderOutput(artifact) {
  return JSON.stringify(extractCleanOutput(artifact), null, 2);
}

function renderStudentInput(c) {
  const lines = [];

  // Profile
  lines.push('### Student profile');
  lines.push(`- Grade: ${c.student_profile.grade_level}`);
  lines.push(`- Intended major(s): ${c.student_profile.intended_majors.join(', ')}`);
  if (c.student_profile.core_interests && c.student_profile.core_interests.length) {
    lines.push(`- Core interests: ${c.student_profile.core_interests.join(', ')}`);
  }
  if (c.student_profile.identity_notes && c.student_profile.identity_notes.length) {
    lines.push(`- Identity notes: ${c.student_profile.identity_notes.join('; ')}`);
  }
  lines.push('');

  // Story entries
  if (c.story_entries && c.story_entries.length > 0) {
    lines.push('### Story entries');
    for (const s of c.story_entries) {
      lines.push(`**${s.id}**`);
      lines.push(`> ${s.text.trim()}`);
      lines.push('');
    }
  } else {
    lines.push('### Story entries');
    lines.push('_No story entries provided._');
    lines.push('');
  }

  // Draft
  if (c.current_draft && c.current_draft.text) {
    lines.push('### Current draft excerpt');
    lines.push(`> ${c.current_draft.text.trim()}`);
    lines.push('');
  } else {
    lines.push('### Current draft excerpt');
    lines.push('_No draft present._');
    lines.push('');
  }

  // School context
  if (c.school_context && c.school_context.target_school) {
    lines.push('### School context');
    lines.push(`- Target school: ${c.school_context.target_school}`);
    if (c.school_context.notes && c.school_context.notes.trim()) {
      lines.push(`- Notes: ${c.school_context.notes.trim()}`);
    }
    lines.push('');
  } else {
    lines.push('### School context');
    lines.push('_No school context provided._');
    lines.push('');
  }

  // Reviewer warning (from author_notes)
  if (c.author_notes && c.author_notes.reviewer_warning && c.author_notes.reviewer_warning.trim()) {
    lines.push('### ⚠️ Reviewer note');
    lines.push(`${c.author_notes.reviewer_warning.trim()}`);
    lines.push('');
  }

  return lines.join('\n');
}

const sections = [];

sections.push('# Blind Human Review Packet — 10 Case Slice');
sections.push('mode: blind\n');
sections.push(`case_ids: ${caseIds.join(', ')}\n`);
sections.push(
  '> **Instructions:** Score each case using BLIND_REVIEW_SCORECARD_TEMPLATE.md. ' +
  'Do not attempt to identify which system produced Output A or B until after all scores are submitted. ' +
  'Decode key is locked in blind_review_10.decode.json.\n'
);
sections.push('---\n');

for (const caseId of caseIds) {
  const c = loadCase(caseId);
  const ab = decode[caseId];

  const ndsOut = loadOutput(ndsDir, caseId);
  const baseOut = loadOutput(baseDir, caseId);

  const outputA = ab.A === 'nds_internal' ? ndsOut : baseOut;
  const outputB = ab.B === 'nds_internal' ? ndsOut : baseOut;

  const block = [];
  block.push(`## ${caseId} — ${c.label}`);
  block.push(`difficulty: ${c.difficulty}`);
  block.push(`tags: ${c.tags.join(', ')}`);
  block.push('');

  block.push(renderStudentInput(c));

  block.push('### Output A');
  block.push('```json');
  block.push(renderOutput(outputA));
  block.push('```');
  block.push('');

  block.push('### Output B');
  block.push('```json');
  block.push(renderOutput(outputB));
  block.push('```');
  block.push('');

  block.push('### Score form');
  block.push('Use BLIND_REVIEW_SCORECARD_TEMPLATE.md');
  block.push('');
  block.push('---');
  block.push('');

  sections.push(block.join('\n'));
}

const out = sections.join('\n');
const outPath = path.join(auditDir, 'blind_review_10.packet.md');
fs.writeFileSync(outPath, out, 'utf8');
console.log(`wrote ${outPath} (${out.length} chars, ${caseIds.length} cases)`);
