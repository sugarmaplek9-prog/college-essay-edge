import fs from 'fs';

const filePath = '/Volumes/TOSHIBA EXT/College Essay/src/lib/fm/direction.ts';
let src = fs.readFileSync(filePath, 'utf8');

// The scores object is missing 5 fields required by RuntimeDirectionCandidateScores:
// angle_first_quality, essay_about_conceptual_lift, batch_diversity_credit,
// packet_family_sameness_penalty, batch_family_distribution_penalty
// Add them as 0 placeholders so the type is satisfied.

const OLD = `        pre_penalty_total: prePenaltyTotal,
        post_penalty_total: postPenaltyTotal,
        total_score: totalScore,
      },`;

const NEW = `        pre_penalty_total: prePenaltyTotal,
        post_penalty_total: postPenaltyTotal,
        total_score: totalScore,
        // fields required by RuntimeDirectionCandidateScores (batch-level, computed at packet layer)
        angle_first_quality: 0,
        essay_about_conceptual_lift: 0,
        batch_diversity_credit: 0,
        packet_family_sameness_penalty: 0,
        batch_family_distribution_penalty: 0,
      },`;

if (!src.includes(OLD)) {
  console.error('ERROR: target scores block not found');
  process.exit(1);
}
const count = src.split(OLD).length - 1;
if (count > 1) {
  console.error('ERROR: multiple matches for target block, expected exactly 1');
  process.exit(1);
}

const patched = src.replace(OLD, NEW);
fs.writeFileSync(filePath, patched, 'utf8');
console.log('Written.');

const verify = fs.readFileSync(filePath, 'utf8');
if (verify.includes('angle_first_quality: 0')) {
  console.log('PATCH CONFIRMED: missing score fields added');
} else {
  console.error('PATCH FAILED');
  process.exit(1);
}
