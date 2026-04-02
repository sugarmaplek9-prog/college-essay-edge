#!/usr/bin/env node
'use strict';
const fs = require('fs');
const s = JSON.parse(fs.readFileSync('/Volumes/TOSHIBA EXT/College Essay/evaluation_outputs/page3_holdout_v2_remediation/summary.json'));
const decisionShellPat = /\b(decision under pressure|one concrete decision|reveals your real standard|center of this essay|write this essay around|cleaner route from scene to insight|what happened next)\b/i;
for (const r of s.rows || []) {
  if (r.case_id !== 'HV2_03' && r.case_id !== 'HV2_09') continue;
  const out = (r.product && r.product.output) || {};
  const fields = {
    rec: out.displayed_recommendation || '',
    ea: out.essay_about || '',
    why: out.why_this_direction || '',
    weaker: out.weaker_read || '',
    stronger: out.stronger_read || '',
  };
  console.log('=== ' + r.case_id + ' ===');
  for (const [k, v] of Object.entries(fields)) {
    const hit = decisionShellPat.test(v);
    if (hit) {
      const m = v.match(decisionShellPat);
      console.log('  DECISIONSHELL HIT in ' + k + ': "' + (m && m[0]) + '"');
    }
    console.log('  ' + k + ': ' + v.slice(0, 100));
  }
}
