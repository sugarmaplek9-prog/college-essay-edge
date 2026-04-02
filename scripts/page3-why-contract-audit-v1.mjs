import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const DIRECTION_PATH = path.join(ROOT, 'src', 'lib', 'fm', 'direction.ts');
const OUT_DIR = path.join(ROOT, 'evaluation_outputs', 'page3_holdout_v2_remediation');
const OUT_JSON = path.join(OUT_DIR, 'WHY_CONTRACT_ALIGNMENT_AUDIT_V1.json');
const OUT_MD = path.join(OUT_DIR, 'WHY_CONTRACT_ALIGNMENT_AUDIT_V1.md');

const source = fs.readFileSync(DIRECTION_PATH, 'utf8');

const comparativeSignalRegex = /\b(stronger|beats|rather than|instead of|compared|vs\.?|easier to trust)\b/i;
const draftingSignalRegex = /\b(drafting payoff|so you can draft|easier to draft|gives you a clear opening|clear opening|draft your opening|start by)\b/i;

function extractQuotedItems(arraySource) {
  const items = [];
  const quoteRe = /'([^']+)'/g;
  let m;
  while ((m = quoteRe.exec(arraySource)) !== null) {
    items.push(m[1]);
  }
  return items;
}

const comparativeLeadMatch = source.match(/const comparativeLeads\s*=\s*\[((?:.|\n)*?)\]\s*as const;/);
const payoffVariantMatch = source.match(/const payoffVariants\s*=\s*\[((?:.|\n)*?)\]\s*as const;/);

const comparativeLeads = comparativeLeadMatch ? extractQuotedItems(comparativeLeadMatch[1]) : [];
const payoffVariants = payoffVariantMatch ? extractQuotedItems(payoffVariantMatch[1]) : [];

const comparativeFailures = comparativeLeads
  .map((lead) => ({ lead, passes_contract: comparativeSignalRegex.test(lead) }))
  .filter((x) => !x.passes_contract);

const payoffFailures = payoffVariants
  .map((line) => ({ line, passes_contract: draftingSignalRegex.test(line) }))
  .filter((x) => !x.passes_contract);

const report = {
  generated_at: new Date().toISOString(),
  source_path: DIRECTION_PATH,
  contracts: {
    comparative_signal_regex: String(comparativeSignalRegex),
    drafting_signal_regex: String(draftingSignalRegex),
  },
  counts: {
    comparative_leads: comparativeLeads.length,
    comparative_failures: comparativeFailures.length,
    payoff_variants: payoffVariants.length,
    payoff_failures: payoffFailures.length,
    contract_alignment_ok: comparativeFailures.length === 0 && payoffFailures.length === 0,
  },
  comparative_failures: comparativeFailures,
  payoff_failures: payoffFailures,
  comparative_leads,
  payoff_variants: payoffVariants,
};

const md = [
  '# Why Contract Alignment Audit V1',
  '',
  `Generated: ${report.generated_at}`,
  `Comparative leads: ${report.counts.comparative_leads}`,
  `Comparative failures: ${report.counts.comparative_failures}`,
  `Payoff variants: ${report.counts.payoff_variants}`,
  `Payoff failures: ${report.counts.payoff_failures}`,
  `Contract alignment OK: ${report.counts.contract_alignment_ok}`,
  '',
  '## Comparative lead failures',
  ...report.comparative_failures.map((f) => `- ${f.lead}`),
  '',
  '## Payoff variant failures',
  ...report.payoff_failures.map((f) => `- ${f.line}`),
  '',
].join('\n');

fs.writeFileSync(OUT_JSON, JSON.stringify(report, null, 2));
fs.writeFileSync(OUT_MD, md);

console.log(JSON.stringify({ out_json: OUT_JSON, out_md: OUT_MD, contract_alignment_ok: report.counts.contract_alignment_ok, comparative_failures: report.counts.comparative_failures, payoff_failures: report.counts.payoff_failures }, null, 2));
