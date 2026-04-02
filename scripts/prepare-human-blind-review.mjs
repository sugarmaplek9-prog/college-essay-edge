import fs from 'node:fs';
import path from 'node:path';

function prepare(packetPath, outDir, label) {
  const packet = JSON.parse(fs.readFileSync(packetPath, 'utf-8'));
  fs.mkdirSync(outDir, { recursive: true });

  const csvHeader = [
    'case_id',
    'directional_usefulness(A|B|Tie)',
    'why_quality(A|B|Tie)',
    'coaching_actionability(A|B|Tie)',
    'student_specificity(A|B|Tie)',
    'evidence_usefulness(A|B|Tie)',
    'evidence_faithfulness(A|B|Tie)',
    'overall_winner(A|B|Tie)',
    'reviewer_notes',
  ].join(',');

  const rows = [csvHeader, ...packet.map((c) => c.case_id + ',,,,,,')];
  fs.writeFileSync(path.join(outDir, 'human_blind_scores_template.csv'), rows.join('\n') + '\n', 'utf-8');

  const md = [];
  md.push('# HUMAN BLIND REVIEW SHEET -- ' + label);
  md.push('');
  md.push('## How to score each case');
  md.push('');
  md.push('Rate A/B/Tie on six dimensions per case:');
  md.push('');
  md.push('**1. Directional usefulness** -- Which output better tells the student what their essay is ABOUT?');
  md.push('   - A good answer names the actual claim or tension, not just which quote to use.');
  md.push('');
  md.push('**2. Why-quality** -- Which why-this-direction better explains WHY this makes a compelling essay?');
  md.push('   - A good answer names the specific tension non-generic to this situation.');
  md.push('   - Bad: strongest because the quote is concrete.');
  md.push('   - Good: works because the gap between X and Y is specific to you.');
  md.push('');
  md.push('**3. Coaching actionability** -- Which output better equips the student to start writing right now?');
  md.push('   - Does it give a first move? Does the weaker/stronger contrast help?');
  md.push('');
  md.push('**4. Evidence faithfulness** -- Which output better grounds its recommendation in the actual notes?');
  md.push('   - Cites real lines, avoids fabricating or generalizing past what was written.');
  md.push('');
  md.push('**5. Student-specificity** -- Which output feels more specific to this student, not generic coaching language?');
  md.push('   - Should sound tied to this student\'s actual tension and choices.');
  md.push('');
  md.push('**6. Evidence usefulness** -- Which output uses evidence in a way that actually helps the student write?');
  md.push('   - Not just quoting lines, but using the right lines to justify the direction.');
  md.push('');
  md.push('**Overall winner** -- which output would you rather receive as a student?');
  md.push('');
  md.push('---');
  md.push('');

  for (const c of packet) {
    md.push('## ' + c.case_id + ' -- ' + c.title);
    md.push('');
    md.push('### Raw notes');
    md.push(c.raw_notes);
    md.push('');
    function renderCandidate(label, cand) {
      md.push('### Candidate ' + label);
      md.push('**Recommendation:** ' + (cand.recommendation || '(none)'));
      md.push('');
      md.push('**Why this direction:** ' + (cand.why_this_direction || '(none)'));
      md.push('');
      if (cand.essay_about && cand.essay_about !== '(none)') {
        md.push('**Essay is about:** ' + cand.essay_about);
        md.push('');
      }
      if (cand.first_coaching_step && cand.first_coaching_step !== '(none)') {
        md.push('**First step:** ' + cand.first_coaching_step);
        md.push('');
      }
      if (cand.weaker_read && cand.weaker_read !== '(none)') {
        md.push('**Weaker read:** ' + cand.weaker_read);
        md.push('');
      }
      if (cand.stronger_read && cand.stronger_read !== '(none)') {
        md.push('**Stronger read:** ' + cand.stronger_read);
        md.push('');
      }
      md.push('**Evidence:** ' + ((cand.evidence_lines || []).join(' | ') || '(none)'));
      md.push('');
    }
    renderCandidate('A', c.candidate_A);
    renderCandidate('B', c.candidate_B);
    md.push('### Your scores');
    md.push('- Directional usefulness (A/B/Tie): ');
    md.push('- Why-quality (A/B/Tie): ');
    md.push('- Coaching actionability (A/B/Tie): ');
    md.push('- Student-specificity (A/B/Tie): ');
    md.push('- Evidence usefulness (A/B/Tie): ');
    md.push('- Evidence faithfulness (A/B/Tie): ');
    md.push('- Overall winner (A/B/Tie): ');
    md.push('- Notes: ');
    md.push('');
    md.push('---');
    md.push('');
  }

  fs.writeFileSync(path.join(outDir, 'HUMAN_BLIND_REVIEW_SHEET.md'), md.join('\n') + '\n', 'utf-8');
  console.log(JSON.stringify({ label, out_dir: outDir, cases: packet.length }, null, 2));
}

function main() {
  const singlePacket = process.env.BLIND_PACKET;
  if (singlePacket) {
    prepare(
      path.resolve(process.cwd(), singlePacket),
      path.resolve(process.cwd(), process.env.BLIND_OUT_DIR || (path.dirname(path.resolve(process.cwd(), singlePacket)) + '/human_blind_review')),
      process.env.BLIND_LABEL || 'PAGE3 HOLDOUT'
    );
    return;
  }
  prepare(
    path.join(process.cwd(), 'evaluation_outputs', 'page3_holdout_v2', 'blind_review_packet.json'),
    path.join(process.cwd(), 'evaluation_outputs', 'page3_holdout_v2', 'human_blind_review'),
    'PAGE3 HOLDOUT V2'
  );
  prepare(
    path.join(process.cwd(), 'evaluation_outputs', 'page3_holdout_v3', 'blind_review_packet.json'),
    path.join(process.cwd(), 'evaluation_outputs', 'page3_holdout_v3', 'human_blind_review'),
    'PAGE3 HOLDOUT V3'
  );
}

main();