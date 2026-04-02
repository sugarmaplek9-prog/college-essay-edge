// =============================================================
// src/lib/supabase/server.ts
// Supabase client factories for server-side use.
//
// Two clients:
//  createAuthClient()    — anon key + user session cookies.
//                          Subject to RLS. Use in route handlers
//                          for operations that must run as the
//                          authenticated user.
//
//  createServiceClient() — service role key. Bypasses RLS.
//                          Use only in the background worker
//                          and trusted internal services.
//
// Dependencies:
//   @supabase/ssr        — SSR-aware client with cookie support
//   @supabase/supabase-js — base client for service role
// =============================================================

import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { ServiceConfigurationError } from '@/lib/ai/errors';

type CookieToSet = {
  name: string;
  value: string;
  options?: {
    domain?: string;
    path?: string;
    expires?: Date;
    maxAge?: number;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'lax' | 'strict' | 'none' | boolean;
    priority?: 'low' | 'medium' | 'high';
  };
};

/**
 * Creates an authenticated Supabase client scoped to the
 * current user session. Subject to Row Level Security.
 *
 * Must be called inside a Server Component or Route Handler
 * where `next/headers` cookies() is available.
 */
export async function createAuthClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new ServiceConfigurationError(
      'Supabase auth client cannot be created: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured.',
    );
  }

  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }: CookieToSet) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Route handlers cannot always set cookies (e.g. when called
            // from a cached Server Component). Ignore gracefully.
          }
        },
      },
    }
  );
}

/**
 * Creates a service-role Supabase client for trusted
 * server-side operations. Bypasses RLS entirely.
 *
 * Use ONLY in:
 *  - The background worker (execute-run.ts)
 *  - Internal admin services
 *  - Migration seeders
 *
 * Never expose service-role credentials to the client.
 */
export function createServiceClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new ServiceConfigurationError(
      'Supabase service client cannot be created: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not configured.',
    );
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
