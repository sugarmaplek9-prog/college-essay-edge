from pathlib import Path

p = Path('/Volumes/TOSHIBA EXT/College Essay/scripts/page3-holdout-v2.mjs')
s = p.read_text()

s = s.replace(
"const HOLDOUT_OUT_DIR = process.env.HOLDOUT_OUT_DIR ?? path.join(process.cwd(), 'evaluation_outputs', 'page3_holdout_v2');\nconst HOLDOUT_LABEL = process.env.HOLDOUT_LABEL ?? 'V2 (UNTOUCHED PACKET)';\n",
"const HOLDOUT_OUT_DIR = process.env.HOLDOUT_OUT_DIR ?? path.join(process.cwd(), 'evaluation_outputs', 'page3_holdout_v2');\nconst BASELINE_CACHE_SUMMARY = process.env.BASELINE_CACHE_SUMMARY\n  ?? path.join(process.cwd(), 'evaluation_outputs', 'page3_delivery_bundle_v1', 'summary.json');\nconst HOLDOUT_LABEL = process.env.HOLDOUT_LABEL ?? 'V2 (UNTOUCHED PACKET)';\n",
1
)

insert_after = "function deterministicSwap(caseId) {\n  let sum = 0;\n  for (const ch of caseId) sum += ch.charCodeAt(0);\n  return sum % 2 === 1;\n}\n"
insert_block = """
function isScorableOpenAiStatus(status) {
  return /^ok/.test(String(status ?? ''));
}

function loadBaselineCache() {
  try {
    if (!fs.existsSync(BASELINE_CACHE_SUMMARY)) return new Map();
    const summary = JSON.parse(fs.readFileSync(BASELINE_CACHE_SUMMARY, 'utf-8'));
    const rows = summary?.rows ?? [];
    const byCase = new Map();
    for (const row of rows) {
      const output = row?.openai?.output;
      if (!row?.case_id || !output) continue;
      byCase.set(row.case_id, {
        displayed_recommendation: clean(output.displayed_recommendation || ''),
        essay_about: clean(output.essay_about || ''),
        why_this_direction: clean(output.why_this_direction || ''),
        weaker_read: clean(output.weaker_read || ''),
        stronger_read: clean(output.stronger_read || ''),
        evidence_lines: (output.evidence_lines ?? []).map(clean).filter(Boolean).slice(0, 4),
        evidence_explanations: (output.evidence_explanations ?? []).map(clean).filter(Boolean).slice(0, 4),
        body_excerpt: short(output.body_excerpt || `${output.displayed_recommendation || ''} ${output.essay_about || ''} ${output.why_this_direction || ''}`, 540),
      });
    }
    return byCase;
  } catch {
    return new Map();
  }
}
"""
if insert_after in s and insert_block not in s:
    s = s.replace(insert_after, insert_after + insert_block, 1)

s = s.replace("if (r.openai.status !== 'ok') continue;", "if (!isScorableOpenAiStatus(r.openai.status)) continue;")
s = s.replace("const cases = JSON.parse(fs.readFileSync(CASES_PATH, 'utf-8'));\n  const browser = await chromium.launch({ headless: true });",
              "const cases = JSON.parse(fs.readFileSync(CASES_PATH, 'utf-8'));\n  const baselineCache = loadBaselineCache();\n  const browser = await chromium.launch({ headless: true });",
              1)
s = s.replace("const openai = await fetchOpenAiBaseline(c.raw_notes);",
              "let openai = await fetchOpenAiBaseline(c.raw_notes);\n      if (!isScorableOpenAiStatus(openai.status)) {\n        const cached = baselineCache.get(c.case_id);\n        if (cached) {\n          openai = { status: 'ok_cache', output: cached, source: 'baseline_cache' };\n        }\n      }",
              1)
s = s.replace("const openaiScore = openai.status === 'ok' ? scoreOutput(openai.output) : null;",
              "const openaiScore = isScorableOpenAiStatus(openai.status) ? scoreOutput(openai.output) : null;",
              1)
s = s.replace("if (row.openai.status !== 'ok') continue;", "if (!isScorableOpenAiStatus(row.openai.status)) continue;")
s = s.replace("const baselineComplete = rows.every((r) => r.openai.status === 'ok');",
              "const baselineComplete = rows.every((r) => isScorableOpenAiStatus(r.openai.status));",
              1)

p.write_text(s)
print('patched holdout baseline cache fallback')
