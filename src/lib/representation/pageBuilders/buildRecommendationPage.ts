import type { LiveDirectionSessionState } from '@/lib/fm/liveSessionDirection';
import { buildHandoffContract } from '@/lib/representation/handoff/buildHandoffContract';
import { block, buildSessionFromLiveState, cta, defaultCarryForwardKeys, type RepresentationPageBuild } from '@/lib/representation/pageBuilders/helpers';

type DirectionSurfaceCopy = {
  title: string;
  support: string;
  primaryClaim: string;
  whyThisWins: string;
  riskSummary: string;
  strongerRead: string;
  weakerRead: string;
  judgment: string;
  bestNextStep: string;
  handoffSummary: string;
  handoffBullets: string[];
};

function cleanSnippet(text: string | undefined, max = 110): string {
  const normalized = (text ?? '').replace(/\s+/g, ' ').trim().replace(/^['"“”]+|['"“”]+$/g, '');
  if (!normalized) return '';
  return normalized.length > max ? `${normalized.slice(0, max - 1).trim()}…` : normalized;
}

function compactEvidenceExplanation(index: number): string {
  if (index === 0) return 'Anchor the scene.';
  if (index === 1) return 'Keep the hinge visible.';
  return 'Name only what changes next.';
}

function buildFallbackSurfaceCopy(state: LiveDirectionSessionState): DirectionSurfaceCopy {
  const selected = state.selectedDirection;
  const firstQuote = cleanSnippet(selected.evidenceLines[0]?.quote, 84);
  const secondQuote = cleanSnippet(selected.evidenceLines[1]?.quote, 84);

  return {
    title: firstQuote
      ? `Make this an essay about "${firstQuote}" and the choice it forced next.`
      : selected.strongestDirection,
    support: secondQuote
      ? `Stay with the scene, the turn in "${secondQuote}", and the result that followed.`
      : 'Stay with the scene, the turn, and the visible result that followed.',
    primaryClaim: firstQuote && secondQuote
      ? `The essay works if it stays with "${firstQuote}", the choice it forced, and what changed by "${secondQuote}".`
      : selected.recommendationText,
    whyThisWins: secondQuote
      ? `It wins because the same sequence gives you a concrete scene, a changed response, and a result the reader can actually watch.`
      : selected.whyWins,
    riskSummary: 'If you lose the scene, the page turns back into a broad lesson before the change is visible.',
    strongerRead: 'The stronger version stays with the pressure point, the response it forced, and the visible result before it tries to explain the meaning.',
    weakerRead: 'The weaker version jumps to the lesson too early and leaves the scene doing too little work on the page.',
    judgment: secondQuote
      ? `If the alternate path cannot stay with the same scene, choice, and visible result around "${secondQuote}", it will sound explained before it feels earned.`
      : 'If the alternate path cannot stay with the same scene, choice, and visible result, it will sound explained before it feels earned.',
    bestNextStep: selected.bestNextMove,
    handoffSummary: 'One connected handoff: keep the same scene, turn, and consequence through the opening and workspace.',
    handoffBullets: [
      `Selected direction: ${firstQuote ? `"${firstQuote}" and the choice it forced next` : selected.strongestDirection}`,
      'Next stop: opening build',
      'Keep the same scene and consequence visible in the handoff.',
    ],
  };
}

function buildDirectionSurfaceCopy(state: LiveDirectionSessionState): DirectionSurfaceCopy {
  const rawInput = state.canonicalPayload.source_truth.raw_input;
  const pattern = state.intelligence.narrative_pattern.primary_pattern;
  const fallback = buildFallbackSurfaceCopy(state);

  if (pattern === 'conflict_reframe' && /\b(robot|robotics|match|autonomous|inspection|finals|quarterfinal)\b/i.test(rawInput)) {
    return {
      title: 'Make this an essay about the override call, the match it cost, and the handoff you rebuilt next.',
      support: 'Stay with the stall, the override, and the rebuild instead of drifting into a general leadership claim.',
      primaryClaim: 'The essay works when it stays with the stalled-finals override, the loss that exposed its cost, and the rebuilt handoff that changed how you led under pressure.',
      whyThisWins: 'It wins because the same sequence gives you a pressured decision, a visible cost, and a concrete correction the reader can watch happen.',
      riskSummary: 'If you skip the override and the loss it caused, the essay turns into a generic leadership summary.',
      strongerRead: 'The stronger version stays with the stall, the override, and the rebuilt handoff, so the judgment feels earned on the page.',
      weakerRead: 'The weaker version turns the match into a generic leadership lesson before the loss and rebuild have done the work.',
      judgment: 'If the alternate path cannot stay inside the override, the lost match, and the rebuilt handoff, it will sound explained before it feels true.',
      bestNextStep: 'Open with the stall and the override. Then show the lost match before you land on the rebuilt handoff that changed how you led next round.',
      handoffSummary: 'One connected handoff: the override, the cost, and the rebuild should all stay visible through the opening and workspace.',
      handoffBullets: [
        'Selected direction: the override call, the match it cost, and the handoff you rebuilt next',
        'Next stop: opening build',
        'Keep the override, the loss, and the rebuild in the same line of sight.',
      ],
    };
  }

  if (/\b(hospital|nurse|volunteer|getting in the way)\b/i.test(rawInput)) {
    return {
      title: 'Make this an essay about the nurse correction that proved effort was not the same as helping.',
      support: 'Stay with the interruption, what it exposed, and the response you changed after it.',
      primaryClaim: 'The essay works when it stays with the nurse interruption, what it exposed about your first approach, and the response you changed afterward.',
      whyThisWins: 'It wins because the correction gives you a visible hinge and a sharper claim than a broad service essay can carry.',
      riskSummary: 'If you lose the nurse correction scene, the essay slides back into a broad service summary.',
      strongerRead: 'The stronger version keeps the correction and the changed response in the same line of sight.',
      weakerRead: 'The weaker version turns the page into a broad service summary before the correction has done its work.',
      judgment: 'If the alternate path cannot stay with the nurse correction and the response you changed after it, it will sound admirable but unfocused.',
      bestNextStep: 'Open with the nurse stopping you. Then show what you changed in the very next response before you explain what helping meant afterward.',
      handoffSummary: 'One connected handoff: keep the correction, the changed response, and the earned claim together through the next pages.',
      handoffBullets: [
        'Selected direction: the nurse correction that changed what helping meant',
        'Next stop: opening build',
        'Keep the interruption and the changed response on the page.',
      ],
    };
  }

  if (/\b(grandparents?|translate|translator|clerk|officials|appointment|form)\b/i.test(rawInput)) {
    return {
      title: 'Make this an essay about the form you summarized too fast—and the translation standard that changed after it.',
      support: 'Stay with the summary, the misunderstanding it caused, and the way you translate now.',
      primaryClaim: 'The essay works when it stays with the too-fast summary, the form your grandfather signed, and the stricter standard for translating that came out of that mistake.',
      whyThisWins: 'It wins because the same scene gives you a visible misread, a real consequence, and a changed response instead of a generic responsibility lesson.',
      riskSummary: 'If you skip the misunderstanding, the page sounds like family duty instead of a visible turn.',
      strongerRead: 'The stronger version keeps the summary, the misunderstanding, and the new translation standard in one continuous line.',
      weakerRead: 'The weaker version jumps straight to family-duty meaning before the misunderstanding has earned it.',
      judgment: 'If the alternate path cannot stay with the summary, the signed form, and the changed translation standard, it will sound abstract too early.',
      bestNextStep: 'Open with the summary you gave and the form that got signed. Then let the misunderstanding land before you explain what you changed in the next interaction.',
      handoffSummary: 'One connected handoff: keep the summary, the misunderstanding, and the changed translation standard visible through the next pages.',
      handoffBullets: [
        'Selected direction: the rushed summary, the signed form, and the stricter standard that followed',
        'Next stop: opening build',
        'Keep the misunderstanding visible before you explain the lesson.',
      ],
    };
  }

  if (/\b(chem|lab|sample|checklist|burette|titration)\b/i.test(rawInput)) {
    return {
      title: 'Make this an essay about the skipped lab step another student copied—and the reliability rule you built after it failed.',
      support: 'Stay with the skipped step, the failure it caused for someone else, and the rule you changed after it.',
      primaryClaim: 'The essay works when it stays with the skipped step, the contaminated result it caused for someone else, and the reliability rule you built afterward.',
      whyThisWins: 'It wins because the same sequence gives you a concrete mistake, a trust failure, and a changed standard that the reader can actually see.',
      riskSummary: 'If you skip the failed result, the page turns into a generic STEM growth lesson.',
      strongerRead: 'The stronger version keeps the skipped step, the failure, and the new reliability rule in one visible chain.',
      weakerRead: 'The weaker version turns the page into a generic STEM-growth lesson before the failure has earned it.',
      judgment: 'If the alternate path cannot stay with the skipped step, the trust failure, and the rule you changed after it, it will sound polished but generic.',
      bestNextStep: 'Open with the skipped step your classmate copied. Then show the contaminated result before you explain the checklist or the rule you changed.',
      handoffSummary: 'One connected handoff: keep the skipped step, the failure, and the new reliability rule visible through the next pages.',
      handoffBullets: [
        'Selected direction: the skipped step, the failure it caused, and the rule you changed after it',
        'Next stop: opening build',
        'Keep the trust failure visible before you explain the lesson.',
      ],
    };
  }

  return fallback;
}

export function buildRecommendationPage(state: LiveDirectionSessionState): RepresentationPageBuild {
  const selected = state.selectedDirection;
  const surfaceCopy = buildDirectionSurfaceCopy(state);
  const packet = state.canonicalPayload.recommendation_packet;
  const recommendationTitle = packet.displayed_recommendation?.trim() || surfaceCopy.title;
  const recommendationAbout = packet.essay_about?.trim() || surfaceCopy.primaryClaim;
  const recommendationWhy = packet.why_this_direction?.trim() || surfaceCopy.whyThisWins;
  const weakerRead = packet.weaker_read?.trim() || surfaceCopy.weakerRead;
  const strongerRead = packet.stronger_read?.trim() || surfaceCopy.strongerRead;
  const bestNextStep = packet.first_coaching_step?.trim() || packet.next_step?.trim() || surfaceCopy.bestNextStep;
  const pageContract = {
    pageRole: 'recommendation' as const,
    pageId: 'direction-recommendation',
    title: recommendationTitle,
    subtitle: 'This is the angle to draft now.',
    blocks: [
      block('page_intro', 'direction-intro', {
        eyebrow: 'The decision',
        title: recommendationTitle,
        subtitle: 'This is the angle to draft now.',
        support: surfaceCopy.support,
      }),
      block('handoff_summary', 'direction-state', {
        label: 'Current state',
        title: 'What you have now.',
        summary: 'One direction is selected and ready to draft.',
        bullets: [
          'You already have the winning hinge.',
          'Next stop: draft the opening from this scene.',
          'Use compare only if this no longer feels true.',
        ],
      }),
      block('recommendation', 'direction-recommendation', {
        label: 'Draft this direction',
        title: 'Why this wins',
        primaryClaim: recommendationAbout,
        whyThisWins: recommendationWhy,
      }),
      block('compare', 'direction-compare', {
        label: 'Compare the reads',
        title: 'How the stronger read separates itself',
        stronger: strongerRead,
        weaker: weakerRead,
      }),
      block('risk', 'direction-risk', {
        label: 'Risk',
        whatCouldFail: surfaceCopy.riskSummary,
      }),
      block('evidence', 'direction-evidence', {
        label: 'Evidence',
        items: selected.evidenceLines.slice(0, 2).map((item, index) => ({
          quote: cleanSnippet(item.quote, 72),
          explanation: compactEvidenceExplanation(index),
        })),
      }),
      block('next_move', 'direction-next', {
        label: 'Best next move',
        title: 'Do this next.',
        bestNextStep,
        support: 'Draft the opening now.',
      }),
      block('cta_group', 'direction-related-ctas', {
        label: 'Related actions',
        ctas: state.compareAlternative
          ? [
              cta({ id: 'direction-compare', label: 'Compare the weaker path', actionType: 'route', targetRoute: '/start/compare', requiredStateKeys: ['compare_option_present'], analyticsEvent: 'direction_compare', variant: 'ghost' }),
            ]
          : [],
      }, Boolean(state.compareAlternative)),
    ],
    primaryCta: cta({
      id: 'direction-draft-opening',
      label: 'Draft the opening',
      actionType: 'route_and_mutation',
      targetRoute: '/start/opening',
      requiredStateKeys: ['selected_direction_id', 'primary_claim', 'evidence_lines'],
      analyticsEvent: 'direction_draft_opening',
      variant: 'primary',
    }),
    secondaryCta: cta({
      id: 'direction-sharpen',
      label: 'Ask one question first',
      actionType: 'route_and_mutation',
      targetRoute: '/start/question',
      requiredStateKeys: ['selected_direction_id', 'best_next_step'],
      analyticsEvent: 'direction_sharpen',
      variant: 'secondary',
    }),
    requiredInputs: ['selected_direction_id', 'primary_claim', 'evidence_lines'],
    carryForwardKeys: defaultCarryForwardKeys(),
  };

  return buildSessionFromLiveState({
    state,
    pageContract,
    handoffState: buildHandoffContract({ fromPageId: pageContract.pageId, toPageId: 'opening-build', state }),
    currentRoute: '/start/direction',
    priorRoutes: ['/start'],
    nextRoutes: ['/start/opening', '/start/compare', '/start/question'],
  });
}
