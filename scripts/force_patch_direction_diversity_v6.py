from pathlib import Path
import re

path = Path('/Volumes/TOSHIBA EXT/College Essay/src/lib/fm/direction.ts')
text = path.read_text()

helper_pattern = re.compile(r"""function ensureComparativeWhy\(why: string\): string \{[\s\S]*?return `\$\{normalized\} \$\{addOns\[Math\.abs\(seedValue\) % addOns\.length\]\}`;\n\}\n""")
helper_replacement = """function stableTextHash(value: string): number {
  return Math.abs((value || '').split('').reduce((n, ch) => n + ch.charCodeAt(0), 0));
}

function ensureComparativeWhy(why: string, seedValue = 0): string {
  let out = normalizeSentence(why);
  const comparativeLeads = [
    'Choose this over the weaker version because',
    'This beats the alternate read because',
    'Pick this direction because',
    'This is stronger than the fallback because',
    'Compared with the weaker path, this works because',
  ] as const;

  if (!hasComparativeWhySignal(out)) {
    const lead = comparativeLeads[(stableTextHash(out) + seedValue) % comparativeLeads.length];
    out = `${lead} the claim stays explicit and evidence-aligned.`;
  } else if (/^(this wins because|it is stronger because|this is stronger because)/i.test(out)) {
    const lead = comparativeLeads[(stableTextHash(out) + seedValue) % comparativeLeads.length];
    out = out.replace(/^(this wins because|it is stronger because|this is stronger because)\\s*/i, `${lead} `);
  }

  const payoffVariants = [
    'Drafting payoff: open with the hinge moment, then show decision and immediate result.',
    'Drafting payoff: start with one scene, then write the claim and consequence in order.',
    'Drafting payoff: you can draft the opening in three lines — moment, choice, result.',
    'Drafting payoff: this gives a clean first paragraph structure you can write right now.',
    'Drafting payoff: the reader can follow your argument from scene to claim without guesswork.',
  ] as const;

  if (!hasDraftingPayoffSignal(out)) {
    out = `${out} ${payoffVariants[(stableTextHash(out) + seedValue) % payoffVariants.length]}`;
  }

  return normalizeSentence(out);
}

function ensureConcreteNextMove(nextMove: string, seedValue = 0): string {
  const normalized = normalizeSentence(nextMove);
  if (hasConcreteNextStep(normalized)) return normalized;
  const variants = [
    'Next step: write 3 lines — moment, decision, immediate result.',
    'Next step: draft one scene paragraph, then one sentence claim, then one consequence line.',
    'Next step: list the hinge detail, your choice, and what changed right after.',
    'Next step: write your opening in 4 lines: context, decision, result, why it mattered.',
    'Next step: draft the first paragraph using scene -> choice -> consequence.',
  ] as const;
  return `${normalized} ${variants[(stableTextHash(normalized) + seedValue) % variants.length]}`;
}

function ensurePlainClaimRecommendation(directionLine: string, seedValue: number): string {
  const normalized = normalizeSentence(directionLine);
  const stem = normalized.replace(/^(Center this essay on|Make the claim that|Show how|Write this as|Name the essay as|Your essay should show|Make your main claim|Center your essay on|Write this around)\\s*/i, '').trim();
  const starters = [
    'Your essay should show',
    'Make your main claim that',
    'Center your essay on',
    'Show how',
    'Write this around',
    'Argue that',
    'At the center, show',
    'Lead with the claim that',
  ] as const;
  const lead = starters[(stableTextHash(stem) + seedValue) % starters.length];

  const needRewrite = !hasPlainClaimSignal(normalized)
    || (TAXONOMY_FORWARD_PATTERN.test(normalized) && !/\\b(moment|decision|choice|result|what changed|what you changed)\\b/i.test(normalized));

  if (!needRewrite) return normalized;
  if (!stem) return `${lead} one clear claim you can prove from your notes.`;
  return `${lead} ${stem.charAt(0).toLowerCase()}${stem.slice(1)}`;
}

function ensureEssayAboutAddsMeaning(essayAbout: string, recommendation: string, seedValue: number): string {
  const normalized = normalizeSentence(essayAbout);
  const overlap = jaccardOverlap(normalized, recommendation);
  const hasMeaningCue = /\\b(because|so that|which means|what this reveals|why this matters|this matters because)\\b/i.test(normalized);

  const leadVariants = [
    'What this essay shows is',
    'The deeper point is',
    'Readers should come away seeing',
    'At heart, you are showing',
    'What matters here is',
    'The meaning is',
  ] as const;

  let rewritten = normalized;
  if (/^(this essay is about|the essay is about|at its core, this essay is about)\\s+/i.test(rewritten)) {
    const tail = rewritten.replace(/^(this essay is about|the essay is about|at its core, this essay is about)\\s+/i, '');
    const lead = leadVariants[(stableTextHash(tail) + seedValue) % leadVariants.length];
    rewritten = `${lead} ${tail}`;
  }

  if (overlap < 0.58 && hasMeaningCue) return rewritten;

  const addOns = [
    'Why this matters: it names what changed in your judgment, not just what happened.',
    'Why this matters: the reader can understand your claim in one read and see how to draft it.',
    'Why this matters: it clarifies scene, choice, and consequence as one argument.',
    'Why this matters: it turns the story into a claim the student can actually write.',
    'Why this matters: it removes ambiguity about what the essay is proving.',
  ] as const;

  const addOn = addOns[(stableTextHash(rewritten) + seedValue) % addOns.length];
  if (overlap >= 0.58 || !hasMeaningCue) return `${rewritten} ${addOn}`;
  return rewritten;
}
"""

text, n = helper_pattern.subn(helper_replacement, text, count=1)
if n != 1:
  raise RuntimeError(f'helper replace count={n}')

text = text.replace(
  'why_this_direction: ensureComparativeWhy(why_this_direction),',
  'why_this_direction: ensureComparativeWhy(why_this_direction, seedValue),'
)
text = text.replace(
  'next_move: ensureConcreteNextMove(next_move),',
  'next_move: ensureConcreteNextMove(next_move, seedValue),'
)

text = text.replace(
"""          [
            `The weaker version is confusing on the main claim, so the reader may not know what you are arguing.`,
            `The weaker version has details, but it is hard to tell what your essay is actually trying to prove.`,
            `The weaker version sounds abstract, so it is less usable when you start drafting.`,
          ][Math.abs(`${runnerUpCandidate.candidate_id || ''}:${runnerUpCandidate.hinge_span || ''}`.split('').reduce((n, ch) => n + ch.charCodeAt(0), 0)) % 3],""",
"""          [
            `Readers may get lost here because the core claim is still blurry.`,
            `What makes this weaker is not the details; it is that the argument stays hard to name.`,
            `If you draft from this version, you may end up summarizing events instead of making a claim.`,
            `This option sounds less coach-like because the reader still has to guess what you are proving.`,
            `The issue here is usability: the scenes are present, but the main point is not clear enough.`,
            `This read is harder to write from because it never locks one explicit claim early.`,
          ][Math.abs(`${runnerUpCandidate.candidate_id || ''}:${runnerUpCandidate.hinge_span || ''}`.split('').reduce((n, ch) => n + ch.charCodeAt(0), 0)) % 6],"""
)

text = text.replace(
"""          [
            `The stronger version is more usable: the claim is clear and the evidence stays aligned. Next step: write moment, decision, result.`,
            `The stronger version is easier to draft because you can see the argument in one read. Next step: write 3 sentences for scene, choice, consequence.`,
            `The stronger version is clearer and coach-like, so you know what to write first. Next step: draft the opening around hinge plus immediate result.`,
          ][Math.abs(`${selectedCandidate?.candidate_id ?? 'selected'}:${selectedCandidate?.hinge_span ?? ''}`.split('').reduce((n, ch) => n + ch.charCodeAt(0), 0)) % 3],""",
"""          [
            `This is the usable version: claim first, evidence aligned, and a clear place to start drafting.`,
            `You can write from this immediately because the argument is legible in one read.`,
            `This one is coach-like: it tells you what to prove and what scene to open with.`,
            `This version works better for drafting because it keeps claim, decision, and result in one line of logic.`,
            `What makes this stronger is practical clarity — you can turn it into an opening paragraph right away.`,
            `This read is easier to execute: the student knows the point and the first move without guessing.`,
          ][Math.abs(`${selectedCandidate?.candidate_id ?? 'selected'}:${selectedCandidate?.hinge_span ?? ''}`.split('').reduce((n, ch) => n + ch.charCodeAt(0), 0)) % 6],"""
)

path.write_text(text)
print('ok')
