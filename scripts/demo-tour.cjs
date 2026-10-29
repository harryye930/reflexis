/* Run against a built local server. Requires Playwright (or PLAYWRIGHT_MODULE).
 * --record also captures a captioned tour; all browser profiles are temporary.
 * No Firebase or AI requests are allowed during verification or recording; no OpenAI key is entered.
 */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const baseUrl = process.env.DEMO_BASE_URL || 'http://127.0.0.1:3000';
const output = path.resolve(process.env.DEMO_OUTPUT_DIR || 'docs/demo');
const record = process.argv.includes('--record');
const viewport = { width: 1600, height: 1000 };
const errors = [];
const forbiddenRequests = [];
const checks = [];

async function protect(page) {
  page.setDefaultTimeout(10000);
  page.on('pageerror', error => errors.push(error.message));
  await page.route(/(?:firestore|identitytoolkit|securetoken)\.googleapis\.com|\/api\//, route => {
    forbiddenRequests.push(new URL(route.request().url()).pathname);
    return route.abort();
  });
}
async function enter(page) {
  await page.goto(`${baseUrl}/demo`);
  await page.locator('[title="Click to open Living Codebook"]').first().waitFor();
  await page.getByText('Changes aren’t saved. To use AI, add your OpenAI key in Settings.', { exact: true }).waitFor();
  assert.equal(await page.locator('[aria-label="Demo guide"]').count(), 0);
  assert.equal((await page.locator('body').innerText()).includes('\u00b7'), false);
}
async function openCode(page, label = 'Invisible work') {
  const back = page.getByRole('button', { name: 'Back to all codes', exact: true });
  if (await back.count()) await back.click();
  await page.locator('[title="Click to open Living Codebook"]').filter({ hasText: label }).click();
  await page.getByText('Living Codebook', { exact: true }).waitFor();
}
async function description(page) {
  return page.locator('.living-codebook-enter').first().innerText();
}
async function verify(browser) {
  const one = await browser.newContext({ viewport });
  const two = await browser.newContext({ viewport });
  const visitorOne = await one.newPage();
  const visitorTwo = await two.newPage();
  const anotherTab = await one.newPage();
  for (const page of [visitorOne, visitorTwo, anotherTab]) await protect(page);
  await Promise.all([enter(visitorOne), enter(visitorTwo), enter(anotherTab)]);
  checks.push('Two simultaneous visitors and another tab enter without authentication.');
  await Promise.all([openCode(visitorOne), openCode(visitorTwo), openCode(anotherTab)]);
  await visitorOne.getByRole('button', { name: 'Edit', exact: true }).click();
  await visitorOne.getByPlaceholder('Code description').fill('A private code definition belonging only to visitor one.');
  await visitorOne.getByRole('button', { name: 'Save Changes', exact: true }).click();
  assert.match(await description(visitorOne), /A private code definition/);
  for (const page of [visitorTwo, anotherTab]) assert.doesNotMatch(await description(page), /A private code definition/);
  checks.push('Code edits are invisible to the other visitor and tab.');
  await visitorOne.getByRole('button', { name: 'Settings', exact: true }).click();
  await visitorOne.getByRole('button', { name: 'Edit positionality', exact: true }).click();
  await visitorOne.locator('#editInitialDataView').fill('My private interpretation stays in this sandbox.');
  await visitorOne.getByRole('button', { name: 'Save', exact: true }).click();
  await visitorOne.getByText('My private interpretation stays in this sandbox.', { exact: true }).waitFor();
  await visitorTwo.getByRole('button', { name: 'Settings', exact: true }).click();
  assert.doesNotMatch(await visitorTwo.locator('body').innerText(), /My private interpretation/);
  checks.push('Profile changes stay in memory without touching the account or another visitor.');
  await visitorTwo.getByRole('button', { name: 'Reset demo', exact: true }).click();
  await visitorTwo.locator('[title="Click to open Living Codebook"]').first().waitFor();
  await visitorOne.getByRole('button', { name: 'Codes', exact: true }).click();
  await openCode(visitorOne);
  assert.match(await description(visitorOne), /A private code definition/);
  checks.push('Resetting a concurrent visitor leaves the first visitor’s edits intact.');
  await visitorOne.reload();
  await openCode(visitorOne);
  assert.doesNotMatch(await description(visitorOne), /A private code definition/);
  await visitorOne.getByRole('button', { name: 'Settings', exact: true }).click();
  assert.doesNotMatch(await visitorOne.locator('body').innerText(), /My private interpretation/);
  assert.equal(await visitorOne.evaluate(() => sessionStorage.length), 0);
  assert.equal(await visitorOne.evaluate(() => Object.keys(localStorage).filter(key => key.includes('reflexis-demo')).length), 0);
  checks.push('Refresh discards edits and profile changes; demo data and preferences are not stored in the browser.');
  await one.close(); await two.close();
  console.log('Visitor isolation, refresh, profile editing and reset verified.');
}

async function caption(page, text) {
  if (!record) return;
  await page.evaluate(text => {
    let element = document.getElementById('tour-caption');
    if (!element) {
      element = document.createElement('div'); element.id = 'tour-caption';
      element.style.cssText = 'position:fixed;bottom:22px;left:50%;transform:translateX(-50%);z-index:10000;padding:14px 24px;border-radius:14px;background:rgba(15,23,42,.94);color:white;font:500 19px/1.45 system-ui;text-align:center;max-width:850px;box-shadow:0 8px 32px #0003;pointer-events:none';
      document.body.appendChild(element);
    }
    element.textContent = text;
  }, text);
}
async function pause(page, ms = 2000) { await page.waitForTimeout(record ? ms : 150); }
async function selectPassage(page, phrase) {
  const points = await page.locator('#text-container').evaluate((element, phrase) => {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const offset = node.textContent.indexOf(phrase);
      if (offset < 0) continue;
      const first = document.createRange(); first.setStart(node, offset); first.setEnd(node, offset + 1);
      const last = document.createRange(); last.setStart(node, offset + phrase.length - 1); last.setEnd(node, offset + phrase.length);
      const a = first.getBoundingClientRect(), b = last.getBoundingClientRect();
      return { x: a.x + 1, y: a.y + a.height / 2, ex: b.right - 1, ey: b.y + b.height / 2 };
    }
    throw new Error('Tour passage not found.');
  }, phrase);
  await page.mouse.move(points.x, points.y); await page.mouse.down();
  await page.mouse.move(points.ex, points.ey, { steps: 30 }); await page.mouse.up();
  assert.equal(await page.evaluate(() => window.getSelection().toString()), phrase);
}

async function focusEvolutionGraph(page) {
  const eventIds = ['merge-verification-source', 'merge-invisible-work', 'split-feedback-barriers', 'split-received-public_voice', 'split-received-technical_translation'];
  const boxes = [];
  for (const id of eventIds) {
    const node = page.locator(`.react-flow__node[data-id="${id}"]`);
    await node.waitFor();
    boxes.push(await node.boundingBox());
  }
  const flow = await page.locator('.react-flow').boundingBox();
  const centerX = (Math.min(...boxes.map(box => box.x)) + Math.max(...boxes.map(box => box.x + box.width))) / 2;
  const centerY = (Math.min(...boxes.map(box => box.y)) + Math.max(...boxes.map(box => box.y + box.height))) / 2;
  const startX = flow.x + flow.width / 2;
  const startY = flow.y + 40;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(startX + flow.x + flow.width / 2 - centerX, startY + flow.y + flow.height / 2 - centerY, { steps: 20 });
  await page.mouse.up();
  for (let i = 0; i < 12; i++) {
    const zoom = await page.locator('.react-flow__viewport').evaluate(element => new DOMMatrixReadOnly(getComputedStyle(element).transform).a);
    if (zoom >= .78) break;
    await page.locator('.react-flow__controls-zoomin').click();
    await page.waitForTimeout(220);
  }
}

async function tour(browser) {
  const context = await browser.newContext({ viewport, ...(record ? { recordVideo: { dir: path.join(output, 'raw'), size: viewport } } : {}) });
  const page = await context.newPage(); await protect(page);
  await page.addInitScript(() => {
    document.addEventListener('DOMContentLoaded', () => {
      const cursor = document.createElement('div');
      cursor.style.cssText = 'position:fixed;width:18px;height:18px;border:2px solid #2563eb;background:#60a5fa55;border-radius:100%;pointer-events:none;z-index:9999;transform:translate(-50%,-50%);left:-50px;top:-50px';
      document.body.appendChild(cursor);
      document.addEventListener('mousemove', e => { cursor.style.left = `${e.clientX}px`; cursor.style.top = `${e.clientY}px`; });
    });
  });
  try {
    await page.goto(baseUrl);
    await page.getByRole('link', { name: /Explore the demo/ }).waitFor();
    await caption(page, 'Explore Reflexis — no sign-up needed'); await pause(page, 2500);
    await page.getByRole('link', { name: /Explore the demo/ }).click();
    await page.getByText('Demo workspace', { exact: true }).waitFor();
    await caption(page, 'A complete corpus, sample coding, and a team’s reflections'); await pause(page, 3500);
    await caption(page, 'The same passage can hold several perspectives');
    await page.locator('[data-highlight-ids="demo-work-jordan,demo-work-maya,demo-work-sam"]').click();
    await page.getByText('3 highlights on this text', { exact: true }).waitFor();
    await pause(page, 5500);
    await page.getByRole('button', { name: 'Close', exact: true }).click();
    await openCode(page);
    await caption(page, 'The living codebook connects definitions, source text, and reflexive notes');
    await page.getByRole('button', { name: 'Reflexive Stream', exact: true }).scrollIntoViewIfNeeded();
    await pause(page, 5000);
    await page.getByRole('button', { name: 'Discussion Focus', exact: true }).click();
    await caption(page, 'Differences in coding become a starting point for discussion'); await pause(page, 4000);
    await page.getByRole('button', { name: 'History', exact: true }).click();
    await page.getByText('Source Codes:', { exact: true }).waitFor();
    checks.push('The demo code history includes a merge from Data verification into Invisible work.');
    await page.getByRole('button', { name: 'Full History Graph', exact: true }).click();
    await page.locator('.react-flow__node').first().waitFor();
    await caption(page, 'Follow how the team’s codebook develops over time'); await pause(page, 1800);
    await focusEvolutionGraph(page);
    assert.equal(await page.locator('.react-flow__edge-text').filter({ hasText: 'MERGE INTO' }).count(), 1);
    assert.equal(await page.locator('.react-flow__edge-text').filter({ hasText: 'SPLIT INTO' }).count(), 2);
    checks.push('The history graph connects the merged source and both split destinations.');
    await caption(page, 'Trace codes as they merge and split, with their earlier versions preserved'); await pause(page, 4000);
    await page.screenshot({ path: path.join(output, 'history.png') });
    await page.getByRole('button', { name: 'Home', exact: true }).click();
    const backToCodes = page.getByRole('button', { name: 'Back to all codes', exact: true });
    if (await backToCodes.count()) await backToCodes.click();
    await page.locator('main').evaluate(element => { element.scrollTop = 0; });
    await caption(page, 'Select a passage, apply a code, and explain your interpretation');
    await selectPassage(page, 'We can build an object detection model, sure.');
    const code = page.locator('.code-button-wrapper').filter({ has: page.getByRole('button', { name: 'Institutional change', exact: true }) });
    await code.getByRole('button', { name: 'Institutional change', exact: true }).hover(); await pause(page, 1200);
    await code.getByRole('button', { name: 'Reflect', exact: true }).click();
    await pause(page, 1800);
    await page.getByRole('button', { name: 'Start', exact: true }).click();
    const reflection = 'Building a model is only one step. The passage points to a longer-term responsibility to maintain a public service.';
    await page.locator('.reflexive-modal textarea').pressSequentially(reflection, { delay: record ? 25 : 0 });
    await pause(page, 1800);
    await page.getByRole('button', { name: 'Next →', exact: true }).click(); await page.waitForTimeout(300);
    await page.getByRole('button', { name: 'Skip', exact: true }).click(); await page.waitForTimeout(300);
    await page.getByRole('button', { name: 'Skip', exact: true }).click();
    await page.locator('.reflexive-modal').waitFor({ state: 'detached' });
    await page.getByText('Reflexive responses saved successfully', { exact: true }).waitFor();
    await caption(page, 'Changes are temporary and aren’t saved'); await pause(page, 2200);
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await page.getByText('Collaborators', { exact: true }).scrollIntoViewIfNeeded();
    await caption(page, 'Explore the researchers’ positionality and compare their perspectives'); await pause(page, 3500);
    await page.getByText('Participant B', { exact: true }).first().click();
    await page.getByRole('button', { name: 'Codes', exact: true }).click();
    await page.locator('main').evaluate(element => { element.scrollTop = 0; });
    await caption(page, 'Move between interviews while keeping the team’s codebook in view'); await pause(page, 3000);
    await page.getByRole('button', { name: 'Reset demo', exact: true }).click();
    await page.locator('[title="Click to open Living Codebook"]').first().waitFor();
    await caption(page, 'Reset anytime. Every visitor gets an independent sandbox.'); await pause(page, 3500);
    await page.screenshot({ path: path.join(output, 'workspace.png') });
    checks.push('Walkthrough verified overlapping highlights, codebook, disagreement, history graph, passage coding, reflection, settings, corpus navigation and reset.');
  } catch (error) {
    await page.screenshot({ path: path.join(output, 'failure.png') });
    console.error((await page.locator('body').innerText()).slice(-5000));
    throw error;
  } finally {
    const video = record ? page.video() : null;
    await context.close();
    if (video) {
      await video.saveAs(path.join(output, 'walkthrough.webm'));
      await video.delete();
    }
  }
}

(async () => {
  await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {}) });
  try {
    await verify(browser);
    await tour(browser);
    assert.deepEqual(errors, [], 'Browser errors');
    assert.deepEqual(forbiddenRequests, [], 'Demo attempted a backend request');
    await fs.rm(path.join(output, 'failure.png'), { force: true });
    await fs.writeFile(path.join(output, 'verification.json'), JSON.stringify({ checks, browserErrors: errors, firebaseOrAiRequests: forbiddenRequests }, null, 2) + '\n');
    console.log(JSON.stringify({ checks, browserErrors: errors, firebaseOrAiRequests: forbiddenRequests, output }, null, 2));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
