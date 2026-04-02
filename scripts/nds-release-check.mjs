#!/usr/bin/env node

import { spawnSync } from 'node:child_process';

const steps = [
  ['npm', ['test']],
  ['npm', ['run', 'test:nds:realization-vs-action']],
  ['npm', ['run', 'test:nds:action-dominance']],
  ['npm', ['run', 'test:nds:evidence-grounding']],
  ['npm', ['run', 'test:nds:axis-coverage']],
  ['npm', ['run', 'test:nds:meta-label-rejection']],
  ['npm', ['run', 'test:nds:direction-line-fit']],
  ['npm', ['run', 'test:nds:direction-stability']],
  ['npm', ['run', 'test:nds:edge-case-breaker']],
  ['npm', ['run', 'test:nds:stability-failure-diagnostic']],
  ['npm', ['run', 'test:nds:edge-stability-reconciliation-sprint']],
];

for (const [cmd, args] of steps) {
  const label = `${cmd} ${args.join(' ')}`;
  console.log(`\n[NDS RELEASE CHECK] ${label}`);

  const result = spawnSync(cmd, args, {
    stdio: 'inherit',
    shell: false,
    env: process.env,
  });

  if (result.status !== 0) {
    console.error(`\n[NDS RELEASE CHECK] FAILED at step: ${label}`);
    process.exit(result.status ?? 1);
  }
}

console.log('\n[NDS RELEASE CHECK] PASS: all hard-gate checks completed.');
