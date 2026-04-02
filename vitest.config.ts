import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    include: ['src/__tests__/**/*.{test,spec}.ts', '!src/__tests__/e2e/**'],
    exclude: ['node_modules', '.next', 'src/__tests__/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/lib/ai/**/*.ts'],
      exclude: ['src/lib/ai/worker/execute-run.ts'], // worker tested via integration
    },
    // Load .env.test.local for test-specific Supabase credentials
    // schema tests require SUPABASE_TEST_URL and SUPABASE_TEST_SERVICE_ROLE_KEY
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
