
import { writeFileSync, readFileSync } from 'fs';

const filePath = '/Volumes/TOSHIBA EXT/College Essay/src/lib/fm/direction.ts';
let content = readFileSync(filePath, 'utf8');

// Replace the realization demotion block with a simpler version that doesn't reference invalid patterns
const oldBlock = `  // Realization demotion: outside specific primary-realization patterns, demote realization unless it has substantial lead (> 0.04)
  const realizationAllowedPrimary = pattern === 'value_alignment_discovery' || pattern === 'identity_formation';
  if (!realizationAllowedPrimary && diversityAdjusted[0].family_type === 'realization' && diversityAdjusted.length > 1) {
    const nonRealization = diversityAdjusted.find((c) => c.family_type !== 'realization' && c.rejection_reasons.length < 2);
    if (nonRealization) {
      const realizationLead = diversityAdjusted[0].scores.total_score - nonRealization.scores.total_score;
      if (realizationLead < 0.04) {
        const forced = [
          nonRealization,
          ...diversityAdjusted.filter((c) => c.candidate_id !== nonRealization.candidate_id),
        ];
        return forced.map((c, i) => ({ ...c, selected: i === 0, rank: i + 1 }));
      }
    }
  }`;

const newBlock = `  // Realization demotion: if realization is winning but another family is close (< 0.03 margin), prefer the other family
  if (diversityAdjusted[0].family_type === 'realization' && diversityAdjusted.length > 1) {
    const nonRealization = diversityAdjusted.find((c) => c.family_type !== 'realization' && c.rejection_reasons.length < 2);
    if (nonRealization) {
      const realizationLead = diversityAdjusted[0].scores.total_score - nonRealization.scores.total_score;
      if (realizationLead < 0.03) {
        const forced = [
          nonRealization,
          ...diversityAdjusted.filter((c) => c.candidate_id !== nonRealization.candidate_id),
        ];
        return forced.map((c, i) => ({ ...c, selected: i === 0, rank: i + 1 }));
      }
    }
  }`;

if (!content.includes(oldBlock)) {
  console.error('ERROR: Could not find oldBlock');
  process.exit(1);
}

content = content.replace(oldBlock, newBlock);
writeFileSync(filePath, content, 'utf8');
console.log('✓ Realization demotion simplified');
