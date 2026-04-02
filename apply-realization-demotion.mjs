
import { writeFileSync, readFileSync } from 'fs';

const filePath = '/Volumes/TOSHIBA EXT/College Essay/src/lib/fm/direction.ts';
let content = readFileSync(filePath, 'utf8');

// Replace the lines 1005-1039 (the demotion logic)
const oldBlock = `  const diversityAdjusted = applySelectionDiversity(sorted);
  const contradictionAllowedPrimary = pattern === 'conflict_reframe' || pattern === 'identity_shift';
  const contradictionMarginRequired = pattern === 'failure_reinterpretation' ? 0.04 : 0.01;
  let contradictionWasDemoted = false;
  if (diversityAdjusted.length > 1 && diversityAdjusted[0].family_type === 'contradiction' && !contradictionAllowedPrimary) {
    const bestNonContradiction = diversityAdjusted.find((c) => c.family_type !== 'contradiction' && c.rejection_reasons.length < 2);
    if (bestNonContradiction) {
      const contradictionLead = diversityAdjusted[0].scores.total_score - bestNonContradiction.scores.total_score;
      if (contradictionLead < contradictionMarginRequired) {
        contradictionWasDemoted = true;
        const forced = [
          bestNonContradiction,
          ...diversityAdjusted.filter((c) => c.candidate_id !== bestNonContradiction.candidate_id),
        ];
        return forced.map((c, i) => ({ ...c, selected: i === 0, rank: i + 1 }));
      }
    }
  }

  // If contradiction was demoted and realization is now winning, apply penalty to prefer other families
  if (contradictionWasDemoted && diversityAdjusted[0].family_type === 'realization' && diversityAdjusted.length > 1) {
    const nonRealization = diversityAdjusted.find((c) => c.family_type !== 'realization' && c.rejection_reasons.length < 2);
    if (nonRealization) {
      // If realization's lead over non-realization is small (< 0.025), prefer non-realization
      const realizationLead = diversityAdjusted[0].scores.total_score - nonRealization.scores.total_score;
      if (realizationLead < 0.025) {
        const forced = [
          nonRealization,
          ...diversityAdjusted.filter((c) => c.candidate_id !== nonRealization.candidate_id),
        ];
        return forced.map((c, i) => ({ ...c, selected: i === 0, rank: i + 1 }));
      }
    }
  }
  if (!needsDominanceCap) return diversityAdjusted;`;

const newBlock = `  const diversityAdjusted = applySelectionDiversity(sorted);
  const contradictionAllowedPrimary = pattern === 'conflict_reframe' || pattern === 'identity_shift';
  const contradictionMarginRequired = pattern === 'failure_reinterpretation' ? 0.04 : 0.01;
  if (diversityAdjusted.length > 1 && diversityAdjusted[0].family_type === 'contradiction' && !contradictionAllowedPrimary) {
    const bestNonContradiction = diversityAdjusted.find((c) => c.family_type !== 'contradiction' && c.rejection_reasons.length < 2);
    if (bestNonContradiction) {
      const contradictionLead = diversityAdjusted[0].scores.total_score - bestNonContradiction.scores.total_score;
      if (contradictionLead < contradictionMarginRequired) {
        const forced = [
          bestNonContradiction,
          ...diversityAdjusted.filter((c) => c.candidate_id !== bestNonContradiction.candidate_id),
        ];
        return forced.map((c, i) => ({ ...c, selected: i === 0, rank: i + 1 }));
      }
    }
  }

  // Realization demotion: outside specific primary-realization patterns, demote realization unless it has substantial lead (> 0.04)
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
  }
  if (!needsDominanceCap) return diversityAdjusted;`;

if (!content.includes(oldBlock)) {
  console.error('ERROR: Could not find oldBlock');
  process.exit(1);
}

content = content.replace(oldBlock, newBlock);
writeFileSync(filePath, content, 'utf8');
console.log('✓ Realization flat demotion patch applied');
