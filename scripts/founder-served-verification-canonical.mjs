import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { chromium } from '@playwright/test';
import { CANONICAL_CASES_PATH, resolveSourceRevision } from './founder-served-provenance.mjs';

const DEFAULT_CASES_PATH = CANONICAL_CASES_PATH;
const DEFAULT_OUT_ROOT = path.join(process.cwd(), 'evaluation_outputs', 'founder_served_review');
const CANONICAL_PRODUCTION_URL = 'https://college-essay-edge.vercel.app';
const REQUIRED_TAGS = ['locked_strong', 'weak_rescue', 'founder_regression', 'ambiguous', 'production_smoke'];

const normalizeText = (value) => String(value ?? '').replace(/\u00a0/g, ' ').replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/\s+/g, ' ').trim();
const ensureDir = (dirPath) => fs.mkdirSync(dirPath, { recursive: true });
const writeJson = (filePath, data) => fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
const writeText = (filePath, data) => fs.writeFileSync(filePath, `${data}\n`);
const sanitizeSegment = (value) => String(value).replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase();

function deriveCoverageTags(entry) {
  const tags = new Set(Array.isArray(entry.tags) ? entry.tags : []);
  const category = String(entry.category ?? '').toLowerCase();
  if (category === 'locked_strong') tags.add('locked_strong');
  if (category === 'weak_rescue') tags.add('weak_rescue');
  if (category.includes('ambiguous')) tags.add('ambiguous');
  if (category === 'founder_regression') tags.add('founder_regression');
  if (category === 'production_smoke') tags.add('production_smoke');
  return [...tags];
}

function loadCases() {
  const casesPath = process.env.FOUNDER_CASES_PATH || DEFAULT_CASES_PATH;
  if (casesPath.endsWith('founder_served_case_pack_v1.json')) {
    throw new Error('Legacy founder case pack path is retired. Use evaluation/cases/founder_served_case_pack_canonical_v1.json.');
  }
  const parsed = JSON.parse(fs.readFileSync(casesPath, 'utf8'));
  if (!Array.isArray(parsed)) {
    throw new Error(`Founder case pack must be a JSON array: ${casesPath}`);
  }
  const cases = parsed.filter((entry) => entry.status === 'active');
  const coverage = new Set(cases.flatMap((entry) => deriveCoverageTags(entry)));
  const missing = REQUIRED_TAGS.filter((tag) => !coverage.has(tag));
  if (missing.length > 0) throw new Error(`Founder served cases are missing required coverage tags: ${missing.join(', ')}`);
  return { casesPath, cases };
}

function getProductUrls() {
  const raw = process.env.PRODUCT_URLS || process.env.PRODUCT_URL || CANONICAL_PRODUCTION_URL;
  return raw.split(',').map((item) => item.trim()).filter(Boolean);
}

function classifyEnvironment(deployedUrl) {
  const host = new URL(deployedUrl).host;
  if (host === new URL(CANONICAL_PRODUCTION_URL).host) return 'production';
  if (host.endsWith('.vercel.app')) return 'preview';
  if (host === 'localhost' || host.startsWith('127.0.0.1')) return 'local';
  return 'unknown';
}

function buildDecisionHeadline(primary, fallback = '') {
  const normalized = normalizeText(primary || fallback);
  return normalized.match(/^.*?[.!?](?=\s|$)/)?.[0]?.trim() || normalized;
}

function excerpt(value) {
  const normalized = normalizeText(value);
  return normalized.length <= 100 ? normalized : normalized.slice(0, 100).trim();
}

function containsApprox(bodyText, expectedText) {
  return normalizeText(bodyText).toLowerCase().includes(excerpt(expectedText).toLowerCase());
}

function globalRenderFailures(bodyText, heading) {
  const failures = [];
  const body = normalizeText(bodyText).toLowerCase();
  const title = normalizeText(heading).toLowerCase();
  if (title.includes('and the response in')) failures.push('broken_headline_fragment');
  if (body.includes('while the')) failures.push('truncated_fragment:while the');
  if (body.includes('blur the')) failures.push('truncated_fragment:blur the');
  if (body.includes('build the hinge')) failures.push('framework_leak:build the hinge');
  return failures;
}

function getRouteTarget(apiResponse, canonicalPayload) {
  return canonicalPayload?.routing?.route_target ?? apiResponse?.canonical_page3_payload?.routing?.route_target ?? null;
}

function isRecoveryRouteTarget(routeTarget) {
  return routeTarget === 'question' || routeTarget === 'blank_page';
}

function getProductionUrlForBundle(deployedUrl) {
  if (classifyEnvironment(deployedUrl) === 'production') return deployedUrl;
  return normalizeText(process.env.PROMOTED_PRODUCTION_URL || process.env.PRODUCTION_URL || '') || null;
}

function inspectDeployment(deployedUrl) {
  if (!/vercel\.app/.test(deployedUrl)) return null;
  try {
    const raw = execSync(`npx vercel inspect ${JSON.stringify(deployedUrl)} --json`, {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    const parsed = JSON.parse(raw);
    return {
      deployment_id: parsed.id ?? null,
      deployment_target: parsed.target ?? null,
      deployment_ready_state: parsed.readyState ?? null,
      deployment_created_at: parsed.createdAt ?? null,
      deployment_url: parsed.url ? `https://${parsed.url}` : deployedUrl,
      aliases: Array.isArray(parsed.aliases) ? parsed.aliases.map((alias) => `https://${alias}`) : [],
    };
  } catch {
    return null;
  }
}

async function waitForRoute(page) {
  await page.waitForFunction(() => /\/start\/(question|reflecting|direction|blocked|opening)/.test(window.location.pathname), { timeout: 30000 });
  return new URL(page.url()).pathname;
}

async function waitForRouteChange(page, previousRoute, timeout = 6000) {
  await page.waitForFunction((prev) => /\/start\/(question|reflecting|direction|blocked|opening)/.test(window.location.pathname) && window.location.pathname !== prev, previousRoute, { timeout });
  return new URL(page.url()).pathname;
}

async function clickAndAdvance(page, buttonPattern, previousRoute, fallbackUrl) {
  await page.getByRole('button', { name: buttonPattern }).first().click();
  try {
    return { route: await waitForRouteChange(page, previousRoute), flowFailure: null, label: null };
  } catch {
    await page.goto(fallbackUrl, { waitUntil: 'networkidle' });
    return { route: await waitForRoute(page), flowFailure: `flow_navigation_required_direct_load:${fallbackUrl}`, label: null };
  }
}

async function clickPrimaryDirectionCTA(page, previousRoute, fallbackUrl) {
  const patterns = [
    /Draft my opening now|Build from this direction|Show me the strongest angle|Show me the direction/i,
    /Draft.*opening|opening now/i,
  ];
  for (const pattern of patterns) {
    const locator = page.getByRole('button', { name: pattern }).first();
    if (await locator.count()) {
      const label = normalizeText(await locator.innerText().catch(() => ''));
      await locator.click();
      try {
        return { route: await waitForRouteChange(page, previousRoute), flowFailure: null, label };
      } catch {
        await page.goto(fallbackUrl, { waitUntil: 'networkidle' });
        return { route: await waitForRoute(page), flowFailure: `flow_navigation_required_direct_load:${fallbackUrl}`, label };
      }
    }
  }
  throw new Error('Could not find primary direction CTA.');
}

async function submitStart(page, baseUrl, rawInput) {
  await page.goto(`${baseUrl.replace(/\/$/, '')}/start`, { waitUntil: 'networkidle' });
  await page.getByLabel('Your notes or draft').fill(rawInput);
  const responsePromise = page.waitForResponse((response) => response.url().includes('/api/intake/session') && response.request().method() === 'POST', { timeout: 30000 });
  await page.getByRole('button', { name: /Find the strongest direction|See what's here|Show me possible directions/i }).click();
  return await responsePromise.then((response) => response.json().catch(() => null));
}

async function captureQuestionPage(page, caseDir, index) {
  const screenshotName = `question-${index}.png`;
  const textName = `question-${index}.txt`;
  const screenshotPath = path.join(caseDir, screenshotName);
  const textPath = path.join(caseDir, textName);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  const bodyText = normalizeText(await page.locator('body').innerText().catch(() => ''));
  writeText(textPath, bodyText);
  return { kind: 'question', route: new URL(page.url()).pathname, body_text: bodyText, screenshot_path: screenshotName, text_path: textName };
}

async function handleQuestion(page, caseConfig, caseDir) {
  const captures = [];
  let latestResponse = null;
  let latestCapture = null;
  const followUpAnswers = caseConfig.follow_up_answers ?? [];

  for (let index = 0; ; index += 1) {
    const route = await waitForRoute(page);
    if (!route.includes('/question')) break;
    latestCapture = await captureQuestionPage(page, caseDir, index + 1);
    captures.push(latestCapture);
    if (index >= followUpAnswers.length) break;
    const responsePromise = page.waitForResponse((response) => response.url().includes('/api/intake/session') && response.request().method() === 'POST', { timeout: 30000 });
    await page.getByLabel('Your answer').fill(followUpAnswers[index]);
    await page.getByRole('button', { name: /Use this answer|Continue with this answer/i }).click();
    latestResponse = await responsePromise.then((response) => response.json().catch(() => null));
    try {
      await waitForRouteChange(page, route);
    } catch {
      break;
    }
  }

  return { captures, latestResponse, latestCapture };
}

async function extractCapture(page, kind) {
  return {
    kind,
    route: new URL(page.url()).pathname,
    heading: normalizeText(await page.locator('h1').first().innerText().catch(() => '')),
    body_text: normalizeText(await page.locator('body').innerText().catch(() => '')),
  };
}

function evaluateQuestion(apiResponse, canonicalPayload, capture) {
  const routeTarget = getRouteTarget(apiResponse, canonicalPayload);
  if (!isRecoveryRouteTarget(routeTarget)) return { pass: true, failures: [], expected: false };
  const failures = [];
  const bodyText = normalizeText(capture?.body_text ?? '');
  if (!capture) failures.push('missing_rendered_question_text');
  if (capture && bodyText.length < 40) failures.push('question_page_too_thin');
  if (capture && !/[?]/.test(bodyText)) failures.push('question_missing_interrogative');
  return { pass: failures.length === 0, failures, expected: true };
}

function evaluateDirection(caseConfig, apiResponse, canonicalPayload, capture) {
  const failures = [];
  const packet = canonicalPayload?.recommendation_packet ?? apiResponse?.canonical_page3_payload?.recommendation_packet ?? null;
  const routeTarget = getRouteTarget(apiResponse, canonicalPayload);
  if (isRecoveryRouteTarget(routeTarget) && !capture) {
    return { pass: true, failures, packet_present: Boolean(packet), skipped_for_recovery_route: true };
  }
  if (!capture) failures.push('missing_rendered_page3_text');
  if (!packet) failures.push('missing_canonical_packet');
  if (packet && capture) {
    if (normalizeText(capture.heading) !== normalizeText(buildDecisionHeadline(packet.displayed_recommendation, capture.heading))) failures.push('packet_render_heading_mismatch');
    for (const [name, value] of [
      ['why_this_direction', packet.why_this_direction],
      ['weaker_read', packet.weaker_read],
      ['stronger_read', packet.stronger_read],
      ['essay_about', packet.essay_about],
      ['next_move', packet.first_coaching_step || packet.next_step],
    ]) {
      if (normalizeText(value) && !containsApprox(capture.body_text, value)) failures.push(`packet_render_field_mismatch:${name}`);
    }
  }
  for (const phrase of caseConfig.direction_must_include_any ?? []) {
    if (capture && !capture.body_text.toLowerCase().includes(phrase.toLowerCase())) failures.push(`direction_missing_expected_phrase:${phrase}`);
  }
  for (const phrase of caseConfig.direction_must_not_include ?? []) {
    if (capture && (capture.body_text.toLowerCase().includes(phrase.toLowerCase()) || capture.heading.toLowerCase().includes(phrase.toLowerCase()))) failures.push(`direction_contains_banned_phrase:${phrase}`);
  }
  if (capture) failures.push(...globalRenderFailures(capture.body_text, capture.heading));
  return { pass: failures.length === 0, failures, packet_present: Boolean(packet) };
}

function evaluateOpening(apiResponse, canonicalPayload, capture) {
  const routeTarget = getRouteTarget(apiResponse, canonicalPayload);
  if (isRecoveryRouteTarget(routeTarget) && !capture) return { pass: true, failures: [], skipped_for_recovery_route: true };
  if (!capture) return { pass: false, failures: ['page4_not_reached'] };
  const failures = [...globalRenderFailures(capture.body_text, capture.heading)];
  return { pass: failures.length === 0, failures };
}

function classifyFailure(result) {
  const failures = [
    ...result.flow_failures,
    ...result.question_evaluation.failures,
    ...result.direction_evaluation.failures,
    ...result.opening_evaluation.failures,
  ];
  if (failures.some((entry) => entry.startsWith('packet_render_'))) return 'packet_render_mismatch';
  if (failures.some((entry) => entry.startsWith('flow_navigation_required_direct_load'))) return 'render_ui_or_navigation_failure';
  if (failures.some((entry) => entry.includes('broken_headline') || entry.includes('truncated_fragment') || entry.includes('framework_leak'))) return 'render_ui_failure';
  if (failures.some((entry) => entry === 'missing_canonical_packet')) return 'packet_assembly_failure';
  return failures.length === 0 ? 'pass' : 'served_behavior_failure';
}

async function runCase(browser, deployedUrl, sourceRevision, deploymentMetadata, caseConfig, runDir) {
  const caseDir = path.join(runDir, sanitizeSegment(caseConfig.case_id));
  ensureDir(caseDir);
  const context = await browser.newContext({ viewport: { width: 1440, height: 1600 } });
  const page = await context.newPage();
  const flowFailures = [];
  const questionCaptures = [];
  let questionPageCapture = null;
  let reflectingArtifacts = null;
  let page3Artifacts = null;
  let page4Artifacts = null;

  let apiResponse = await submitStart(page, deployedUrl, caseConfig.raw_input);
  let route = await waitForRoute(page);
  const visitedRoutes = [route];

  if (route.includes('/question')) {
    const question = await handleQuestion(page, caseConfig, caseDir);
    questionCaptures.push(...question.captures);
    questionPageCapture = question.latestCapture;
    if (question.latestResponse) apiResponse = question.latestResponse;
    route = await waitForRoute(page);
    if (visitedRoutes[visitedRoutes.length - 1] !== route) visitedRoutes.push(route);
  }

  if (route.includes('/reflecting')) {
    const screenshotName = 'reflecting.png';
    const textName = 'reflecting.txt';
    await page.screenshot({ path: path.join(caseDir, screenshotName), fullPage: true });
    writeText(path.join(caseDir, textName), normalizeText(await page.locator('body').innerText().catch(() => '')));
    reflectingArtifacts = { screenshot_path: screenshotName, text_path: textName };
    const transition = await clickAndAdvance(page, /Build from this direction|Show me the strongest angle|Show me the direction/i, route, `${deployedUrl.replace(/\/$/, '')}/start/direction`);
    route = transition.route;
    if (transition.flowFailure) flowFailures.push(transition.flowFailure);
    if (visitedRoutes[visitedRoutes.length - 1] !== route) visitedRoutes.push(route);
  }

  let page3Capture = null;
  let page4Capture = null;
  let primaryCTAText = null;

  if (route.includes('/direction')) {
    const screenshotName = 'page3-direction.png';
    const textName = 'page3-direction.txt';
    const structuredName = 'page3-direction-structured.json';
    await page.screenshot({ path: path.join(caseDir, screenshotName), fullPage: true });
    page3Capture = await extractCapture(page, 'page3');
    writeText(path.join(caseDir, textName), page3Capture.body_text);
    writeJson(path.join(caseDir, structuredName), page3Capture);
    page3Artifacts = { screenshot_path: screenshotName, text_path: textName, structured_path: structuredName };
    const transition = await clickPrimaryDirectionCTA(page, route, `${deployedUrl.replace(/\/$/, '')}/start/opening`);
    primaryCTAText = transition.label;
    route = transition.route;
    if (transition.flowFailure) flowFailures.push(transition.flowFailure);
    if (visitedRoutes[visitedRoutes.length - 1] !== route) visitedRoutes.push(route);
  }

  if (route.includes('/opening')) {
    const screenshotName = 'page4-opening.png';
    const textName = 'page4-opening.txt';
    const structuredName = 'page4-opening-structured.json';
    await page.screenshot({ path: path.join(caseDir, screenshotName), fullPage: true });
    page4Capture = await extractCapture(page, 'page4');
    writeText(path.join(caseDir, textName), page4Capture.body_text);
    writeJson(path.join(caseDir, structuredName), page4Capture);
    page4Artifacts = { screenshot_path: screenshotName, text_path: textName, structured_path: structuredName };
  }

  const canonicalPacket = await page.evaluate(() => {
    const raw = sessionStorage.getItem('fm_canonical_page3_payload');
    return raw ? JSON.parse(raw) : null;
  }).catch(() => null);

  const routeTarget = getRouteTarget(apiResponse, canonicalPacket);
  const questionEvaluation = evaluateQuestion(apiResponse, canonicalPacket, questionPageCapture);
  const directionEvaluation = evaluateDirection(caseConfig, apiResponse, canonicalPacket, page3Capture);
  const openingEvaluation = evaluateOpening(apiResponse, canonicalPacket, page4Capture);
  const packetRenderMatchResult = isRecoveryRouteTarget(routeTarget)
    ? 'not_applicable_recovery_route'
    : directionEvaluation.failures.some((entry) => entry.startsWith('packet_render_')) ? 'mismatch' : 'match';

  const metadataFailures = [];
  if (!sourceRevision.commit_sha) metadataFailures.push('missing_git_sha');

  const result = {
    verifier_script: 'scripts/founder-served-verification-canonical.mjs',
    deployed_url: deployedUrl,
    preview_url: classifyEnvironment(deployedUrl) === 'preview' ? deployedUrl : normalizeText(process.env.PREVIEW_URL || '') || null,
    production_url: getProductionUrlForBundle(deployedUrl),
    environment: classifyEnvironment(deployedUrl),
    source_revision: sourceRevision,
    deployment_metadata: deploymentMetadata,
    case_id: caseConfig.case_id,
    category: caseConfig.category,
    case_title: caseConfig.title,
    case_raw_input: caseConfig.raw_input,
    tags: deriveCoverageTags(caseConfig),
    visited_routes: visitedRoutes,
    route_target: routeTarget,
    page_reached: route,
    primary_cta_text: primaryCTAText,
    reflecting_artifacts: reflectingArtifacts,
    question_captures: questionCaptures,
    question_page_capture: questionPageCapture,
    page3_artifacts: page3Artifacts,
    page4_artifacts: page4Artifacts,
    flow_failures: flowFailures,
    canonical_packet: canonicalPacket,
    api_response: apiResponse,
    page3_capture: page3Capture,
    page4_capture: page4Capture,
    question_evaluation: questionEvaluation,
    direction_evaluation: directionEvaluation,
    opening_evaluation: openingEvaluation,
    packet_render_match_result: packetRenderMatchResult,
    metadata_failures: metadataFailures,
  };

  result.classification = classifyFailure(result);
  result.served_pass = result.flow_failures.length === 0 && result.question_evaluation.pass && result.direction_evaluation.pass && result.opening_evaluation.pass;
  result.traceability_complete = metadataFailures.length === 0 && Boolean(result.case_id) && (Boolean(result.question_page_capture) || Boolean(result.page3_artifacts) || Boolean(result.page4_artifacts));
  result.final_pass = result.served_pass && result.traceability_complete;
  result.pass = result.final_pass;

  writeJson(path.join(caseDir, 'artifact.json'), result);
  await context.close();
  return result;
}

function buildMarkdownSummary(meta, results) {
  const lines = [
    '# Founder Served Review',
    '',
    `- Verifier: ${meta.verifierScript}`,
    `- Preview URL: ${meta.previewUrl ?? 'N/A'}`,
    `- Production URL: ${meta.productionUrl ?? 'N/A'}`,
    `- Commit SHA: ${meta.commitSha ?? 'MISSING'}`,
    `- Source Snapshot SHA: ${meta.sourceSnapshotSha}`,
    `- Cases Path: ${meta.casesPath}`,
    `- Timestamp: ${meta.timestamp}`,
    `- Case IDs: ${meta.caseIdsRun.join(', ')}`,
    '',
    '| Case | Served | Traceability | Final | Classification | Page | Packet/Render |',
    '| --- | --- | --- | --- | --- | --- | --- |',
  ];

  for (const result of results) {
    lines.push(`| ${result.case_id} | ${result.served_pass ? 'PASS' : 'FAIL'} | ${result.traceability_complete ? 'PASS' : 'FAIL'} | ${result.final_pass ? 'PASS' : 'FAIL'} | ${result.classification} | ${result.page_reached} | ${result.packet_render_match_result} |`);
  }

  lines.push('', '## Failures', '');
  for (const result of results.filter((entry) => !entry.final_pass)) {
    lines.push(`### ${result.case_id}`);
    for (const failure of [...result.metadata_failures, ...result.flow_failures, ...result.question_evaluation.failures, ...result.direction_evaluation.failures, ...result.opening_evaluation.failures]) {
      lines.push(`- ${failure}`);
    }
    lines.push('');
  }

  return `${lines.join('\n')}\n`;
}

async function main() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const { casesPath, cases } = loadCases();
  const deployedUrls = getProductUrls();
  const outRoot = process.env.FOUNDER_SERVED_OUT_DIR || path.join(DEFAULT_OUT_ROOT, timestamp);
  ensureDir(outRoot);
  const browser = await chromium.launch({ headless: true });
  const runs = [];

  try {
    for (const deployedUrl of deployedUrls) {
      const deploymentMetadata = inspectDeployment(deployedUrl);
      const sourceRevision = resolveSourceRevision({
        casesPath,
        deployedUrl,
        deploymentMetadata,
        requireCommitSha: process.env.ALLOW_MISSING_GIT_SHA !== '1',
      });
      const runDir = path.join(outRoot, sanitizeSegment(new URL(deployedUrl).host));
      ensureDir(runDir);
      const results = [];
      for (const caseConfig of cases) {
        results.push(await runCase(browser, deployedUrl, sourceRevision, deploymentMetadata, caseConfig, runDir));
      }

      const previewUrl = classifyEnvironment(deployedUrl) === 'preview' ? deployedUrl : normalizeText(process.env.PREVIEW_URL || '') || null;
      const productionUrl = getProductionUrlForBundle(deployedUrl);
      const summary = {
        verifier_script: 'scripts/founder-served-verification-canonical.mjs',
        deployed_url: deployedUrl,
        preview_url: previewUrl,
        production_url: productionUrl,
        source_revision: sourceRevision,
        deployment_metadata: deploymentMetadata,
        cases_path: casesPath,
        case_ids_run: cases.map((entry) => entry.case_id),
        timestamp,
        total_cases: results.length,
        served_passing_cases: results.filter((entry) => entry.served_pass).length,
        served_failing_cases: results.filter((entry) => !entry.served_pass).length,
        traceability_complete_cases: results.filter((entry) => entry.traceability_complete).length,
        final_passing_cases: results.filter((entry) => entry.final_pass).length,
        final_failing_cases: results.filter((entry) => !entry.final_pass).length,
        results,
      };
      writeJson(path.join(runDir, 'served-review.json'), summary);
      writeText(path.join(runDir, 'served-review.md'), buildMarkdownSummary({
        verifierScript: summary.verifier_script,
        previewUrl: summary.preview_url,
        productionUrl: summary.production_url,
        commitSha: summary.source_revision.commit_sha,
        sourceSnapshotSha: summary.source_revision.source_snapshot_sha,
        casesPath: summary.cases_path,
        timestamp,
        caseIdsRun: summary.case_ids_run,
      }, results));
      runs.push(summary);
    }
  } finally {
    await browser.close();
  }

  const combined = { timestamp, runs };
  writeJson(path.join(outRoot, 'served-review.json'), combined);
  console.log(JSON.stringify(combined, null, 2));
}

main().catch((error) => {
  console.error(`[founder-served-verification-canonical] ${error instanceof Error ? error.stack ?? error.message : String(error)}`);
  process.exit(1);
});
