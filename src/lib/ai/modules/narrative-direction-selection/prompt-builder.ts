// =============================================================
// src/lib/ai/modules/narrative-direction-selection/prompt-builder.ts
//
// Builds the structured prompt package for NDS execution.
// The prompt is assembled from the context bundle server-side;
// client_context fields are never included in the prompt.
//
// Produces a PromptPackage that is passed to the provider adapter.
// =============================================================

import type { NdsContextBundle } from '@/types/ai';
import type { NdsNormalizedContextPack, NdsModuleExecutionInput } from '@/types/ai';

export interface PromptPackage {
  systemPrompt: string;
  userPrompt: string;
  responseSchema: Record<string, unknown>;
  bundleVersion: string;
}

const BUNDLE_VERSION = 'nds-v1.0';

/**
 * Builds a complete prompt package for NDS execution.
 * Context is assembled from the canonical context bundle only.
 */
export function buildNdsPrompt(context: NdsContextBundle): PromptPackage {
  const { essayProject, studentProfile, storyEntries, priorSelectedDirection } =
    context;

  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt({
    essayProject,
    studentProfile,
    storyEntries,
    priorSelectedDirection,
    edgeSnapshot: context.edgeSnapshot,
  });

  return {
    systemPrompt,
    userPrompt,
    responseSchema: NDS_RESPONSE_SCHEMA,
    bundleVersion: BUNDLE_VERSION,
  };
}

export function buildNdsPromptV1(
  contextPack: NdsNormalizedContextPack,
  executionMode: NdsModuleExecutionInput['execution_mode']
): PromptPackage {
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPromptV1(contextPack, executionMode);

  return {
    systemPrompt,
    userPrompt,
    responseSchema: NDS_RESPONSE_SCHEMA,
    bundleVersion: `${BUNDLE_VERSION}-v1`,
  };
}

// =============================================================
// INTERNAL — System Prompt
// =============================================================

function buildSystemPrompt(): string {
  return `You are an expert college admissions coach helping a student identify the strongest personal essay direction.

Your job is to analyze the student's story portfolio and essay project context, then recommend the single strongest direction for their Common App personal statement.

Rules:
- Recommend exactly ONE strongest angle backed by specific evidence in the input.
- Explain why this is the real story, not just the most obvious activity.
- Provide alternatives that differ by narrative function (identity revision vs competence vs relationship/responsibility), not topic wording.
- Name the obvious-but-weaker angle and explain why it loses.
- Surface at least one depth signal: hidden tension, internal shift, false-obvious-angle, or essay opportunity.
- If execution mode is standard: provide winner + at least 2 distinct alternatives.
- If execution mode is reduced_scope: provide a constrained but useful winner + at least 1 distinct alternative; do not default to generic needs_more_input.
- Use needs_more_input only when a trustworthy constrained recommendation is not possible.
- Next move must be strategic and high leverage (scene prompt, strategic question, frame test, or evidence-gathering task).
- Never fabricate story details. Use only what is present.
- Forbid generic cliches and filler (e.g., "meaningful experience", "growth", "leadership", "resilience") unless tied to concrete evidence.
- Do not include phrases like "as an AI" or self-referential language.
- Output must be valid JSON matching the specified response schema.`;
}

// =============================================================
// INTERNAL — User Prompt
// =============================================================

function buildUserPrompt(params: {
  essayProject: NdsContextBundle['essayProject'];
  studentProfile: NdsContextBundle['studentProfile'];
  storyEntries: NdsContextBundle['storyEntries'];
  priorSelectedDirection: NdsContextBundle['priorSelectedDirection'];
  edgeSnapshot: NdsContextBundle['edgeSnapshot'];
}): string {
  const { essayProject, studentProfile, storyEntries, priorSelectedDirection, edgeSnapshot } =
    params;

  const lines: string[] = [];

  lines.push('## Essay Project');
  lines.push(`Title: ${essayProject.title}`);
  lines.push(`Status: ${essayProject.status}`);
  if (essayProject.current_draft_text) {
    lines.push(`\nCurrent draft (excerpt):\n${truncate(essayProject.current_draft_text, 800)}`);
  }

  if (studentProfile) {
    lines.push('\n## Student Profile');
    lines.push(`Name: ${studentProfile.first_name} ${studentProfile.last_name}`);
    if (studentProfile.graduation_year) {
      lines.push(`Graduation year: ${studentProfile.graduation_year}`);
    }
    if (studentProfile.strengths_summary) {
      lines.push(`Strengths summary: ${studentProfile.strengths_summary}`);
    }
    if (studentProfile.interests) {
      lines.push(`Interests: ${JSON.stringify(studentProfile.interests)}`);
    }
  }

  if (storyEntries.length > 0) {
    lines.push('\n## Story Portfolio');
    storyEntries.forEach((entry: NdsContextBundle['storyEntries'][number], idx: number) => {
      lines.push(`\n### Story ${idx + 1}: ${entry.title}`);
      lines.push(`Strength: ${entry.strength_level}`);
      if (entry.category) lines.push(`Category: ${entry.category}`);
      lines.push(`Content:\n${truncate(entry.body, 600)}`);
    });
  } else {
    lines.push('\n## Story Portfolio\nNo stories available yet.');
  }

  if (edgeSnapshot?.summary_text) {
    lines.push('\n## Edge Snapshot Summary');
    lines.push(edgeSnapshot.summary_text);
  }

  if (priorSelectedDirection) {
    lines.push('\n## Prior Selected Direction');
    lines.push(
      `The student previously selected direction ID: ${priorSelectedDirection.selectedItemId}. ` +
        `This is a refresh run — consider whether the prior direction should be reconsidered.`
    );
  }

  lines.push('\n## Task');
  lines.push(
    'Analyze the above and return the strongest essay direction as JSON matching the schema. ' +
      'If you cannot identify a strong direction from the available material, ' +
      'return status: "needs_more_input" with a single focused recovery question.'
  );

  return lines.join('\n');
}

function buildUserPromptV1(
  contextPack: NdsNormalizedContextPack,
  executionMode: NdsModuleExecutionInput['execution_mode']
): string {
  const lines: string[] = [];

  lines.push('## Module');
  lines.push(contextPack.module);
  lines.push(`Execution mode: ${executionMode}`);

  lines.push('\n## Student Core');
  lines.push(`Name: ${contextPack.student_core.name ?? 'Unknown'}`);
  lines.push(`Grade: ${contextPack.student_core.grade_level ?? 'Unknown'}`);
  lines.push(`Interests: ${contextPack.student_core.core_interests.join(', ') || 'None provided'}`);

  lines.push('\n## Story Signals');
  if (contextPack.story_signals.length === 0) {
    lines.push('No story signals available.');
  } else {
    contextPack.story_signals.forEach(
      (
        signal: {
          source_id: string;
          event_summary: string;
          change_signal: string;
          evidence_strength: 'high' | 'medium' | 'low';
        },
        idx: number
      ) => {
        lines.push(`- #${idx + 1} [${signal.evidence_strength}] ${signal.event_summary}`);
        lines.push(`  Change: ${signal.change_signal}`);
        lines.push(`  Source: ${signal.source_id}`);
      }
    );
  }

  if (contextPack.draft_signals.length > 0) {
    lines.push('\n## Draft Signals');
    contextPack.draft_signals.forEach(
      (d: { signal_summary: string; strength: 'high' | 'medium' | 'low'; source_id: string }) => {
        lines.push(`- [${d.strength}] ${d.signal_summary} (${d.source_id})`);
      }
    );
  }

  if (contextPack.context_gaps.length > 0) {
    lines.push('\n## Context Gaps');
    contextPack.context_gaps.forEach((gap: string) => lines.push(`- ${gap}`));
  }

  lines.push('\n## Task');
  lines.push(
    'Return JSON only. Diagnose the strongest non-obvious essay angle. Explain why it beats the obvious angle, ground claims in source evidence, and provide strategic next movement. Avoid generic praise, trait lists, equal ranking, and fake variety.'
  );

  return lines.join('\n');
}

// =============================================================
// RESPONSE SCHEMA (for structured output / function calling)
// =============================================================

const NDS_RESPONSE_SCHEMA = {
  type: 'object',
  required: ['status', 'best_direction', 'alternatives', 'evidence_anchors', 'depth_signals', 'recovery_question'],
  properties: {
    status: { type: 'string', enum: ['success', 'needs_more_input'] },
    best_direction: {
      type: ['object', 'null'],
      properties: {
        id: { type: 'string' },
        angle_title: { type: 'string' },
        core_claim: { type: 'string' },
        why_this_is_the_real_story: { type: 'string' },
        what_it_reveals_about_the_student: { type: 'string' },
        why_it_beats_the_obvious_angle: { type: 'string' },
        main_risk_if_written_poorly: { type: 'string' },
        next_move: { type: 'string' },
      },
      required: [
        'id',
        'angle_title',
        'core_claim',
        'why_this_is_the_real_story',
        'what_it_reveals_about_the_student',
        'why_it_beats_the_obvious_angle',
        'main_risk_if_written_poorly',
        'next_move',
      ],
    },
    alternatives: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          angle_title: { type: 'string' },
          what_this_angle_would_focus_on: { type: 'string' },
          why_it_is_weaker: { type: 'string' },
          failure_mode: { type: 'string' },
        },
        required: ['id', 'angle_title', 'what_this_angle_would_focus_on', 'why_it_is_weaker', 'failure_mode'],
      },
    },
    evidence_anchors: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string' },
          source_type: { type: 'string' },
          source_id: { type: ['string', 'null'] },
        },
        required: ['label', 'source_type', 'source_id'],
      },
    },
    depth_signals: {
      type: 'object',
      required: [
        'detected_tension',
        'detected_shift',
        'obvious_but_weaker_angle',
        'essay_opportunity',
      ],
      properties: {
        detected_tension: { type: ['string', 'null'] },
        detected_shift: { type: ['string', 'null'] },
        obvious_but_weaker_angle: { type: ['string', 'null'] },
        essay_opportunity: { type: ['string', 'null'] },
      },
    },
    recovery_question: { type: ['string', 'null'] },
  },
};

// =============================================================
// UTILITY
// =============================================================

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '... [truncated]';
}
