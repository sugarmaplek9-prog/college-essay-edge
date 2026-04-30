import type { CanonicalPage3Payload } from '@/types/PAGE_THREE_CANONICAL_PAYLOAD_TYPE_V1';

export type MalformedCopyIssue = {
  field: string;
  code:
    | 'empty'
    | 'truncation_ellipsis'
    | 'broken_sentence_join'
    | 'malformed_source_join'
    | 'dangling_render';
  message: string;
};

const ELLIPSIS_PATTERN = /…|\.\.\./;
const BROKEN_SENTENCE_JOIN_PATTERN = /\.\,|,\.|[.?!]{2,}(?!")/;
const MALFORMED_SOURCE_JOIN_PATTERN = /\b(after|at|before|from|in|inside|around|during|near|with)\s+(I|we|my|our|he|she|they|In|At|During|After|Before)\b/;
const DANGLING_RENDER_PATTERN = /\b(at|after|before|from|in|inside|around|during|near|with|the|a|an)\s*[.…]*$/i;

function validateText(field: string, text: string | null | undefined): MalformedCopyIssue[] {
  const value = (text ?? '').trim();
  const issues: MalformedCopyIssue[] = [];

  if (!value) {
    issues.push({ field, code: 'empty', message: `${field} is empty.` });
    return issues;
  }

  if (ELLIPSIS_PATTERN.test(value)) {
    issues.push({ field, code: 'truncation_ellipsis', message: `${field} contains truncation ellipsis.` });
  }

  if (BROKEN_SENTENCE_JOIN_PATTERN.test(value)) {
    issues.push({ field, code: 'broken_sentence_join', message: `${field} contains broken sentence joins.` });
  }

  if (MALFORMED_SOURCE_JOIN_PATTERN.test(value)) {
    issues.push({ field, code: 'malformed_source_join', message: `${field} contains malformed source-term joins.` });
  }

  if (DANGLING_RENDER_PATTERN.test(value)) {
    issues.push({ field, code: 'dangling_render', message: `${field} appears to end in incomplete rendered phrasing.` });
  }

  return issues;
}

export function validateRecommendationPacketCopy(
  packet: CanonicalPage3Payload['recommendation_packet'] | null | undefined,
): MalformedCopyIssue[] {
  if (!packet) {
    return [{ field: 'recommendation_packet', code: 'empty', message: 'recommendation_packet is missing.' }];
  }

  const issues = [
    ...validateText('displayed_recommendation', packet.displayed_recommendation),
    ...validateText('essay_about', packet.essay_about),
    ...validateText('why_this_direction', packet.why_this_direction),
    ...validateText('weaker_read', packet.weaker_read),
    ...validateText('stronger_read', packet.stronger_read),
    ...validateText('first_coaching_step', packet.first_coaching_step),
    ...validateText('next_step', packet.next_step),
  ];

  packet.evidence_lines.forEach((line, index) => {
    issues.push(...validateText(`evidence_lines[${index}]`, line));
  });

  packet.evidence_explanations.forEach((line, index) => {
    issues.push(...validateText(`evidence_explanations[${index}]`, line));
  });

  return issues;
}

export function recommendationPacketCopyIsValid(
  packet: CanonicalPage3Payload['recommendation_packet'] | null | undefined,
): boolean {
  return validateRecommendationPacketCopy(packet).length === 0;
}
