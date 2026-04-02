import { PermissionDeniedError } from '@/lib/ai/errors';
import { createServiceClient } from '@/lib/supabase/server';

const REVIEW_ROLES = new Set(['reviewer', 'admin', 'adjudicator']);

export async function assertReviewerAccess(userId: string): Promise<void> {
  if (process.env.RIC_REVIEWER_AUTH_DISABLED === 'true') {
    return;
  }

  const envAllowlist = parseCsv(process.env.RIC_ALLOWED_REVIEWER_IDS);
  if (envAllowlist.has(userId)) {
    return;
  }

  const db = createServiceClient();
  const { data, error } = await db.auth.admin.getUserById(userId);

  if (error || !data?.user) {
    throw new PermissionDeniedError('Reviewer access denied');
  }

  const appMeta = data.user.app_metadata as Record<string, unknown> | undefined;
  const userMeta = data.user.user_metadata as Record<string, unknown> | undefined;

  const roleCandidates = [
    ...extractRoles(appMeta?.roles),
    ...extractRoles(appMeta?.role),
    ...extractRoles(userMeta?.roles),
    ...extractRoles(userMeta?.role),
  ];

  const hasAccess = roleCandidates.some((role) => REVIEW_ROLES.has(role.toLowerCase()));
  if (!hasAccess) {
    throw new PermissionDeniedError('Reviewer access denied');
  }
}

function parseCsv(value: string | undefined): Set<string> {
  if (!value) {
    return new Set();
  }

  return new Set(
    value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  );
}

function extractRoles(value: unknown): string[] {
  if (typeof value === 'string') {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === 'string');
  }

  return [];
}
