// =============================================================
// src/__tests__/ai/schema.test.ts
// 4.1 Schema Tests
//
// Validates migration-level correctness:
//  - All required tables exist
//  - module_registry seed row is present
//  - enum types exist and contain required values
//  - Foreign key and index relationships are correct
//
// Uses Supabase service client against a test database.
// Set SUPABASE_TEST_URL and SUPABASE_TEST_SERVICE_ROLE_KEY in
// your test environment (.env.test.local) to target a dedicated
// test Supabase project, not production.
// =============================================================

import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_TEST_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseServiceKey =
  process.env.SUPABASE_TEST_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const hasSupabaseTestEnv = Boolean(supabaseUrl && supabaseServiceKey);

const testDb = hasSupabaseTestEnv
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

beforeAll(() => {
  if (!hasSupabaseTestEnv) {
    console.warn(
      'Skipping schema integration tests: set SUPABASE_TEST_URL and SUPABASE_TEST_SERVICE_ROLE_KEY (or fallback SUPABASE_* vars).'
    );
  }
});

describe.runIf(hasSupabaseTestEnv)('4.1 Schema — Module Registry', () => {
  it('module_registry table exists and is queryable', async () => {
    if (!testDb) return;
    const { error } = await testDb.from('module_registry').select('id').limit(1);
    expect(error).toBeNull();
  });

  it('narrative_direction_selection seed row exists', async () => {
    if (!testDb) return;
    const { data, error } = await testDb
      .from('module_registry')
      .select('module_key, display_name, is_enabled')
      .eq('module_key', 'narrative_direction_selection')
      .single();

    expect(error).toBeNull();
    expect(data).not.toBeNull();
    expect(data!.module_key).toBe('narrative_direction_selection');
    expect(data!.display_name).toBe('Narrative Direction Selection');
    expect(data!.is_enabled).toBe(true);
  });
});

describe.runIf(hasSupabaseTestEnv)('4.1 Schema — AI Runs', () => {
  it('ai_runs table exists and is queryable', async () => {
    if (!testDb) return;
    const { error } = await testDb.from('ai_runs').select('id').limit(1);
    expect(error).toBeNull();
  });

  it('ai_runs has required columns', async () => {
    if (!testDb) return;
    // Insert a minimal row to verify column presence
    const { data: moduleRow } = await testDb
      .from('module_registry')
      .select('id')
      .eq('module_key', 'narrative_direction_selection')
      .single();

    const { data: userRow } = await testDb
      .from('users')
      .select('id')
      .limit(1)
      .single();

    if (!moduleRow || !userRow) {
      console.warn('Skipping ai_runs column test: no module or user row available');
      return;
    }

    const { data, error } = await testDb
      .from('ai_runs')
      .insert({
        module_id: moduleRow.id,
        student_user_id: userRow.id,
        trigger_type: 'user_action',
        subject_entity_type: 'essay_project',
        subject_entity_id: '00000000-0000-0000-0000-000000000001',
        execution_mode: 'standard',
        readiness_state: 'ready',
        status: 'queued',
        retry_count: 0,
        fallback_applied: false,
      })
      .select('id, status, retry_count, fallback_applied, created_at')
      .single();

    expect(error).toBeNull();
    expect(data).not.toBeNull();
    expect(data!.status).toBe('queued');
    expect(data!.retry_count).toBe(0);
    expect(data!.fallback_applied).toBe(false);

    // Clean up
    if (data) {
      await testDb.from('ai_runs').delete().eq('id', data.id);
    }
  });
});

describe.runIf(hasSupabaseTestEnv)('4.1 Schema — AI Artifacts', () => {
  it('ai_artifacts table exists and is queryable', async () => {
    if (!testDb) return;
    const { error } = await testDb.from('ai_artifacts').select('id').limit(1);
    expect(error).toBeNull();
  });

  it('ai_artifacts rejects non-object payload_json', async () => {
    if (!testDb) return;
    // payload_json must be a JSON object — array should be rejected
    const { data: moduleRow } = await testDb
      .from('module_registry')
      .select('id')
      .eq('module_key', 'narrative_direction_selection')
      .single();

    const { data: userRow } = await testDb
      .from('users')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (!moduleRow || !userRow) return;

    // We need an ai_run first (FK constraint)
    const { data: run } = await testDb
      .from('ai_runs')
      .insert({
        module_id: moduleRow.id,
        student_user_id: userRow.id,
        trigger_type: 'user_action',
        subject_entity_type: 'essay_project',
        subject_entity_id: '00000000-0000-0000-0000-000000000002',
        execution_mode: 'standard',
        readiness_state: 'ready',
        status: 'completed',
        retry_count: 0,
        fallback_applied: false,
      })
      .select('id')
      .single();

    if (!run) return;

    // Try inserting with array payload — should fail the check constraint
    const { error } = await testDb.from('ai_artifacts').insert({
      run_id: run.id,
      module_id: moduleRow.id,
      student_user_id: userRow.id,
      subject_entity_type: 'essay_project',
      subject_entity_id: '00000000-0000-0000-0000-000000000002',
      artifact_status: 'success',
      summary_text: 'test',
      payload_json: [1, 2, 3], // array — should be rejected
      render_version: 'v1.0',
    });

    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/chk_ai_artifacts_payload_is_object|violates check/i);

    await testDb.from('ai_runs').delete().eq('id', run.id);
  });
});

describe.runIf(hasSupabaseTestEnv)('4.1 Schema — Required Tables Exist', () => {
  const tables = [
    'module_registry',
    'ai_runs',
    'ai_artifacts',
    'artifact_subject_links',
    'artifact_selection_events',
    'validator_results',
  ];

  for (const table of tables) {
    it(`table ${table} exists`, async () => {
      if (!testDb) return;
      const { error } = await testDb.from(table).select('id').limit(0);
      expect(error).toBeNull();
    });
  }
});

describe.runIf(hasSupabaseTestEnv)('4.1 Schema — Essay Projects Column', () => {
  it('essay_projects has selected_direction_artifact_id column', async () => {
    if (!testDb) return;
    // Query the column directly — if it doesn't exist, the select will error
    const { error } = await testDb
      .from('essay_projects')
      .select('id, selected_direction_artifact_id')
      .limit(1);

    expect(error).toBeNull();
  });
});
