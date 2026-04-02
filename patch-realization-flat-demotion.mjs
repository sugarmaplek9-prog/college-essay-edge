import fs from 'fs';

const filePath = '/Volumes/TOSHIBA EXT/College Essay/src/lib/fm/direction.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Replace the contradiction/realization demotion block
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

  // Realization fallback penalty: if original sorted[0] was contradiction but we're now demoting it,
  // and realization is becoming the winner, apply penalty if the lead is marginal
  if (sorted.length > 0 && sorted[0].family_type === 'contradiction' && diversityAdjusted[0].family_type === 'realization' && !contradictionAllowedPrimary && diversityAdjusted.length > 1) {
    const nonRealization = diversityAdjusted.find((c) => c.family_type !== 'realization' && c.rejection_reasons.length < 2);
    if (nonRealization) {
      const realizationLead = diversityAdjusted[0].scores.total_score - nonRealization.scores.total_score;
      // If realization's lead is very small (< 0.015), prefer the non-realization alternative
      if (realizationLead < 0.015) {
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

  // Realization demotion: outside specific primary-realization patterns, demote realization unless it has substantial lead
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
  console.error('ERROR: Could not find old block');
  process.exit(1);
}

content = content.replace(oldBlock, newBlock);
fs.writeFileSync(filePath, content, 'utf8');
console.log('✓ Applied realization demotion patch');
