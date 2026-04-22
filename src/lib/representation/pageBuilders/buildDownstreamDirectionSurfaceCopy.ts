import type { LiveDirectionSessionState } from '@/lib/fm/liveSessionDirection';

type DownstreamDirectionSurfaceCopy = {
  directionTitle: string;
  directionSupport: string;
  primaryClaim: string;
  whyThisWins: string;
  bestNextStep: string;
  openingSupport: string;
  workspaceSummary: string;
  workspaceDirectionLabel: string;
  compareStronger: string;
  compareWeaker: string;
  compareJudgment: string;
};

function cleanSnippet(text: string | undefined, max = 110): string {
  const normalized = (text ?? '').replace(/\s+/g, ' ').trim().replace(/^['"“”]+|['"“”]+$/g, '');
  if (!normalized) return '';
  return normalized.length > max ? `${normalized.slice(0, max - 1).trim()}…` : normalized;
}

function buildFallbackSurfaceCopy(state: LiveDirectionSessionState): DownstreamDirectionSurfaceCopy {
  const selected = state.selectedDirection;
  const firstQuote = cleanSnippet(selected.evidenceLines[0]?.quote, 84);
  const secondQuote = cleanSnippet(selected.evidenceLines[1]?.quote, 84);

  return {
    directionTitle: firstQuote
      ? `Build from "${firstQuote}" and the choice it forced next.`
      : selected.strongestDirection,
    directionSupport: secondQuote
      ? `Keep the scene, the turn in "${secondQuote}", and the visible result in the same line of sight.`
      : 'Keep the scene, the turn, and the visible result in the same line of sight.',
    primaryClaim: firstQuote && secondQuote
      ? `The paragraph works if it stays with "${firstQuote}", the choice it forced, and what changed by "${secondQuote}".`
      : selected.recommendationText,
    whyThisWins: secondQuote
      ? 'It wins because the same sequence gives you a concrete scene, a changed response, and a result the reader can actually watch.'
      : selected.whyWins,
    bestNextStep: selected.bestNextMove,
    openingSupport: secondQuote
      ? `Start inside the scene, let the turn at "${secondQuote}" land, and explain the meaning only after the result is visible.`
      : 'Start inside the scene, let the turn land, and explain the meaning only after the result is visible.',
    workspaceSummary: 'Keep the same scene, turn, and consequence visible while you extend the draft.',
    workspaceDirectionLabel: firstQuote ? `${firstQuote} and the choice it forced next` : selected.strongestDirection,
    compareStronger: 'The stronger version stays with the pressure point, the response it forced, and the visible result before it tries to explain the meaning.',
    compareWeaker: 'The weaker version jumps to the lesson too early and leaves the scene doing too little work on the page.',
    compareJudgment: secondQuote
      ? `If the alternate path cannot stay with the same scene, choice, and visible result around "${secondQuote}", it will sound explained before it feels earned.`
      : 'If the alternate path cannot stay with the same scene, choice, and visible result, it will sound explained before it feels earned.',
  };
}

export function buildDownstreamDirectionSurfaceCopy(state: LiveDirectionSessionState): DownstreamDirectionSurfaceCopy {
  const rawInput = state.canonicalPayload.source_truth.raw_input;
  const pattern = state.intelligence.narrative_pattern.primary_pattern;
  const fallback = buildFallbackSurfaceCopy(state);

  if (pattern === 'conflict_reframe' && /\b(robot|robotics|match|autonomous|inspection|finals|quarterfinal)\b/i.test(rawInput)) {
    return {
      directionTitle: 'Build from the override call, the match it cost, and the handoff you rebuilt next.',
      directionSupport: 'Keep the stall, the override, and the rebuild in view instead of drifting into a generic leadership claim.',
      primaryClaim: 'The paragraph works when it stays with the stalled-finals override, the loss that exposed its cost, and the rebuilt handoff that changed how you led under pressure.',
      whyThisWins: 'It wins because the same sequence gives you a pressured decision, a visible cost, and a concrete correction the reader can watch happen.',
      bestNextStep: 'Start with the stall and the override. Then show the lost match before you land on the rebuilt handoff that changed how you led next round.',
      openingSupport: 'Open inside the stall and override. Let the lost match land before you name what the rebuilt handoff changed.',
      workspaceSummary: 'Keep the override, the cost, and the rebuild visible while you extend the live draft.',
      workspaceDirectionLabel: 'the override call, the match it cost, and the handoff you rebuilt next',
      compareStronger: 'The stronger version stays with the stall, the override, and the rebuilt handoff, so the judgment feels earned on the page.',
      compareWeaker: 'The weaker version turns the match into a generic leadership lesson before the loss and rebuild have done the work.',
      compareJudgment: 'If the alternate path cannot stay inside the override, the lost match, and the rebuilt handoff, it will sound explained before it feels true.',
    };
  }

  if (/\b(hospital|nurse|volunteer|getting in the way)\b/i.test(rawInput)) {
    return {
      directionTitle: 'Build from the nurse correction that proved effort was not the same as helping.',
      directionSupport: 'Keep the interruption, what it exposed, and the response you changed after it in the same line of sight.',
      primaryClaim: 'The paragraph works when it stays with the nurse interruption, what it exposed about your first approach, and the response you changed afterward.',
      whyThisWins: 'It wins because the correction gives you a visible hinge and a sharper claim than a broad service essay can carry.',
      bestNextStep: 'Open with the nurse stopping you. Then show what you changed in the very next response before you explain what helping meant afterward.',
      openingSupport: 'Open inside the correction. Let the interruption land before you name the lesson it forced.',
      workspaceSummary: 'Keep the correction, the changed response, and the earned claim visible while you extend the draft.',
      workspaceDirectionLabel: 'the nurse correction that changed what helping meant',
      compareStronger: 'The stronger version keeps the correction and the changed response in the same line of sight.',
      compareWeaker: 'The weaker version turns the page into a broad service summary before the correction has done its work.',
      compareJudgment: 'If the alternate path cannot stay with the nurse correction and the response you changed after it, it will sound admirable but unfocused.',
    };
  }

  if (/\b(grandparents?|translate|translator|clerk|officials|appointment|form)\b/i.test(rawInput)) {
    return {
      directionTitle: 'Build from the form you summarized too fast—and the translation standard that changed after it.',
      directionSupport: 'Keep the summary, the misunderstanding it caused, and the way you translate now in one continuous line.',
      primaryClaim: 'The paragraph works when it stays with the too-fast summary, the form your grandfather signed, and the stricter standard for translating that came out of that mistake.',
      whyThisWins: 'It wins because the same scene gives you a visible misread, a real consequence, and a changed response instead of a generic responsibility lesson.',
      bestNextStep: 'Open with the summary you gave and the form that got signed. Then let the misunderstanding land before you explain what you changed in the next interaction.',
      openingSupport: 'Open inside the rushed summary. Let the misunderstanding land before you explain the lesson or the later standard.',
      workspaceSummary: 'Keep the summary, the misunderstanding, and the changed translation standard visible while you extend the draft.',
      workspaceDirectionLabel: 'the rushed summary, the signed form, and the stricter standard that followed',
      compareStronger: 'The stronger version keeps the summary, the misunderstanding, and the new translation standard in one continuous line.',
      compareWeaker: 'The weaker version jumps straight to family-duty meaning before the misunderstanding has earned it.',
      compareJudgment: 'If the alternate path cannot stay with the summary, the signed form, and the changed translation standard, it will sound abstract too early.',
    };
  }

  if (/\b(chem|lab|sample|checklist|burette|titration)\b/i.test(rawInput)) {
    return {
      directionTitle: 'Build from the skipped lab step another student copied—and the reliability rule you built after it failed.',
      directionSupport: 'Keep the skipped step, the failure it caused for someone else, and the rule you changed after it in one visible chain.',
      primaryClaim: 'The paragraph works when it stays with the skipped step, the contaminated result it caused for someone else, and the reliability rule you built afterward.',
      whyThisWins: 'It wins because the same sequence gives you a concrete mistake, a trust failure, and a changed standard the reader can actually see.',
      bestNextStep: 'Open with the skipped step your classmate copied. Then show the contaminated result before you explain the checklist or the rule you changed.',
      openingSupport: 'Open inside the skipped step. Let the trust failure land before you explain the lesson or the new rule.',
      workspaceSummary: 'Keep the skipped step, the failure, and the new reliability rule visible while you extend the draft.',
      workspaceDirectionLabel: 'the skipped step, the failure it caused, and the rule you changed after it',
      compareStronger: 'The stronger version keeps the skipped step, the failure, and the new reliability rule in one visible chain.',
      compareWeaker: 'The weaker version turns the page into a generic STEM-growth lesson before the failure has earned it.',
      compareJudgment: 'If the alternate path cannot stay with the skipped step, the trust failure, and the rule you changed after it, it will sound polished but generic.',
    };
  }

  return fallback;
}