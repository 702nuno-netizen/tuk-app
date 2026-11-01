/**
 * Headless demo walkthrough + root PWA smoke test.
 *   NODE_PATH=/tmp/node_modules node manager/tests/e2e.mjs
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const calc = require('../js/calc.js');
function loadPuppeteer() {
  try { return require('puppeteer-core'); } catch (e) { /* optional local install */ }
  return createRequire('/tmp/tm-e2e/package.json')('puppeteer-core');
}
const puppeteer = loadPuppeteer();

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = '/opt/cursor/artifacts/screenshots';
const PORT = 8765;
fs.mkdirSync(OUT, { recursive: true });

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml' };

function startServer() {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    let rel = decodeURIComponent(url.pathname);
    if (rel.endsWith('/')) rel += 'index.html';
    const file = path.join(ROOT, rel);
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404); res.end('not found'); return;
    }
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-cache' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise(resolve => server.listen(PORT, '127.0.0.1', () => resolve(server)));
}

async function shot(page, name) {
  await page.screenshot({ path: path.join(OUT, name + '.png') });
}

function assert(cond, msg) { if (!cond) throw new Error(msg); }

async function text(page) { return page.evaluate(() => document.body.innerText); }
async function crash(page) {
  const msg = await page.$eval('[data-testid="crash"]', el => el.textContent).catch(() => '');
  if (msg) throw new Error('App crash: ' + msg);
}

const server = await startServer();
const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome',
  headless: 'new',
  args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
});

try {
  const root = await browser.newPage();
  await root.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  await root.goto('http://127.0.0.1:' + PORT + '/', { waitUntil: 'domcontentloaded' });
  await root.waitForFunction(() => document.body.innerText.includes('The Lisbon Voyager'));
  const rootText = await text(root);
  assert(rootText.includes('Liga a app'), 'Voyager setup screen missing');
  await shot(root, '00-lisbon-voyager');

  await root.evaluate(async () => {
    const reg = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;
    if (reg.installing) await new Promise(r => reg.installing.addEventListener('statechange', () => { if (reg.installing.state === 'activated' || reg.active) r(); }));
  });
  await root.reload({ waitUntil: 'domcontentloaded' });
  await root.waitForFunction(() => navigator.serviceWorker.controller);
  await root.setOfflineMode(true);
  const offlineManager = await root.evaluate(async () => {
    try {
      const res = await fetch('/manager/index.html');
      return { ok: res.ok, status: res.status, text: (await res.text()).slice(0, 180) };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  });
  const offlineRoot = await root.evaluate(async () => {
    const res = await fetch('/');
    return (await res.text()).includes('The Lisbon Voyager');
  });
  assert(offlineRoot, 'Offline Voyager shell was not served from its cache');
  const servedVoyager = offlineManager.ok && offlineManager.text && offlineManager.text.includes('The Lisbon Voyager') && !offlineManager.text.includes('Tuk Manager');
  assert(!servedVoyager, 'Root service worker served the Voyager shell for /manager/: ' + JSON.stringify(offlineManager));
  await root.setOfflineMode(false);
  await root.close();

  const CLIENT = '812500493427-s7g3mm1vsvalacesva7i4jjqh6i2uof3.apps.googleusercontent.com';
  const gis = await browser.newPage();
  const gisErrors = [];
  gis.on('pageerror', err => gisErrors.push(String(err)));
  await gis.evaluateOnNewDocument(() => {
    window.__gisLog = [];
    window.__gisInitError = '';
    const origAppend = Node.prototype.appendChild;
    Node.prototype.appendChild = function (node) {
      if (node && node.tagName === 'SCRIPT' && String(node.src || '').indexOf('accounts.google.com/gsi/client') !== -1) {
        const appOnload = node.onload;
        node.onload = function (ev) {
          const arm = (tries) => {
            const oauth = window.google && google.accounts && google.accounts.oauth2;
            if (oauth && typeof oauth.initTokenClient === 'function') {
              const orig = oauth.initTokenClient.bind(oauth);
              oauth.initTokenClient = function (cfg) {
                window.__gisLog.push({ client_id: cfg.client_id, scope: cfg.scope });
                try {
                  const client = orig(cfg);
                  client.requestAccessToken = function (opts) { window.__gisPrompt = opts || {}; };
                  return client;
                } catch (e) {
                  window.__gisInitError = String(e && e.message || e);
                  throw e;
                }
              };
              if (typeof appOnload === 'function') appOnload.call(node, ev);
              return;
            }
            if (tries > 40) {
              window.__gisInitError = 'GIS oauth2 was not available after the script loaded';
              if (typeof appOnload === 'function') appOnload.call(node, ev);
              return;
            }
            setTimeout(() => arm(tries + 1), 50);
          };
          arm(0);
        };
      }
      return origAppend.call(this, node);
    };
  });
  await gis.goto('http://127.0.0.1:' + PORT + '/manager/', { waitUntil: 'domcontentloaded' });
  await gis.waitForSelector('#start-google');
  await gis.click('#start-google');
  await gis.waitForFunction(() => (window.__gisLog && window.__gisLog.length) || window.__gisInitError, { timeout: 20000 });
  const gisInfo = await gis.evaluate(() => ({ log: window.__gisLog, error: window.__gisInitError, prompt: window.__gisPrompt || null }));
  assert(!gisInfo.error, 'GIS init error: ' + gisInfo.error);
  assert(gisErrors.length === 0, 'Page errors during GIS init: ' + gisErrors.join(' | '));
  assert(gisInfo.log[0].client_id === CLIENT, 'Unexpected client id: ' + JSON.stringify(gisInfo.log));
  assert(gisInfo.log[0].scope === 'https://www.googleapis.com/auth/drive.file', 'Unexpected scope: ' + gisInfo.log[0].scope);
  assert(gisInfo.prompt && (gisInfo.prompt.prompt === 'select_account' || gisInfo.prompt.prompt === 'consent'), 'Sign-in did not request a Google prompt: ' + JSON.stringify(gisInfo.prompt));
  await gis.close();

  const legal = await browser.newPage();
  await legal.goto('http://127.0.0.1:' + PORT + '/manager/privacy.html', { waitUntil: 'domcontentloaded' });
  let legalText = await text(legal);
  assert(legalText.includes('702nuno@gmail.com'), 'Privacy contact missing');
  assert(legalText.includes('drive.file'), 'Privacy scope missing');
  assert(legalText.includes('myaccount.google.com/permissions'), 'Revoke link missing');
  assert(legalText.includes('cópia de segurança'), 'Backup file missing from privacy policy');
  await legal.click('[data-set-lang="en"]');
  legalText = await text(legal);
  assert(legalText.includes('runs in your browser'), 'English privacy missing');
  assert(legalText.includes('does not collect, share or sell'), 'English privacy promise missing');
  await legal.goto('http://127.0.0.1:' + PORT + '/manager/terms.html', { waitUntil: 'domcontentloaded' });
  legalText = await text(legal);
  assert(legalText.toLowerCase().includes('as is') || legalText.includes('tal como está'), 'Terms missing as-is wording: ' + legalText.slice(0, 200));
  await legal.click('[data-set-lang="en"]');
  legalText = await text(legal);
  assert(legalText.includes('provided as is'), 'English terms missing');
  assert(legalText.includes('free test version'), 'English terms missing test version');
  await legal.close();

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  page.on('pageerror', err => console.log('PAGEERROR', err.message));
  page.on('console', msg => { if (msg.type() === 'error') console.log('CONSOLE', msg.text()); });
  await page.goto('http://127.0.0.1:' + PORT + '/manager/', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => { localStorage.removeItem('tm.lang'); localStorage.removeItem('tm.mode'); localStorage.removeItem('tm.demo.v1'); });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-step="1"]');
  await crash(page);
  const welcome = await text(page);
  assert(welcome.includes('Entrar com Google'), 'Google sign-in button missing');
  assert(welcome.includes('Experimentar sem conta'), 'Demo option missing from the welcome screen');
  assert(welcome.includes('Privacidade') && welcome.includes('Termos'), 'Home page is missing privacy or terms links');
  const homeHtml = await page.content();
  assert(homeHtml.includes('href="privacy.html"') && homeHtml.includes('href="terms.html"'), 'index.html links missing after render');
  await shot(page, '01-onboarding');

  await page.click('#start-demo');
  await page.waitForSelector('[data-step="2"]');
  await page.click('[data-act="next"]');
  await page.waitForSelector('#business-name');
  await page.type('#business-name', 'Lisbon Tuk Tours');
  await page.click('[data-act="next"]');
  await page.waitForSelector('#tuk-name');
  await page.type('#tuk-name', 'Lisboeta');
  await page.type('#tuk-num', '2');
  await page.type('#tuk-plate', '58-TL-22');
  await page.select('#tuk-fuel', 'electric');
  await page.click('[data-act="add-tuk"]');
  await page.waitForFunction(() => document.body.innerText.includes('Lisboeta'));
  await page.click('[data-act="next"]');
  await page.waitForSelector('#drv-name');
  await page.type('#drv-name', 'João Silva');
  await page.type('#drv-num', '1');
  await page.type('#drv-phone', '910000001');
  await page.click('#drv-pct', { clickCount: 3 });
  await page.type('#drv-pct', '50');
  await page.click('[data-act="add-driver"]');
  await page.waitForFunction(() => document.body.innerText.includes('João'));
  await page.click('[data-act="next"]');
  await page.waitForSelector('[data-step="6"]');
  await page.click('[data-act="next"]');
  await page.waitForSelector('[data-act="finish"]');
  await page.click('[data-act="finish"]');
  await page.waitForSelector('[data-screen="day"]');
  await crash(page);

  await page.type('#service-amount', '80');
  await page.click('[data-act="add-service"]');
  await page.waitForFunction(() => document.body.innerText.includes('80'));
  await page.type('#service-amount', '90');
  await page.click('[data-act="add-service"]');
  await page.waitForFunction(() => (document.querySelector('[data-testid="service-total"]') || {}).textContent?.includes('170,00'));
  const share = await page.$eval('[data-testid="owner-share"]', el => el.textContent);
  assert(share.includes('85,00'), 'Owner share should be 85,00, got ' + share);
  await page.click('[data-act="open-tuk"]');
  await page.waitForSelector('[data-act="pick-tuk"]');
  await page.click('[data-act="pick-tuk"]:not([data-tuk="none"])');
  await page.waitForFunction(() => document.body.innerText.toLowerCase().includes('elétr'));
  const bodyDay = await text(page);
  assert(bodyDay.includes('Combustível não aparece'), 'Electric tuk should hide fuel expenses, got: ' + bodyDay.slice(0, 500));
  await shot(page, '02-day');

  const overflow = await page.evaluate(() => {
    const app = document.getElementById('app');
    return { sw: app.scrollWidth, cw: app.clientWidth };
  });
  assert(overflow.sw <= overflow.cw + 1, 'Horizontal overflow on day: ' + JSON.stringify(overflow));

  await page.click('[data-act="nav"][data-tab="drivers"]');
  await page.waitForSelector('[data-act="open-driver"]');
  await page.click('[data-act="open-driver"]');
  await page.waitForSelector('[data-testid="due-total"]');
  const dueBefore = await page.$eval('[data-testid="due-total"]', el => el.getAttribute('data-status'));
  assert(dueBefore === 'amber' || dueBefore === 'clear', 'Unexpected due status before handover: ' + dueBefore);
  await page.click('[data-act="handover-all"]');
  await page.waitForFunction(() => (document.querySelector('#handover-amount') || {}).value?.includes('85'));
  await page.click('[data-act="confirm-handover"]');
  await page.waitForFunction(() => document.querySelector('[data-testid="due-total"]')?.getAttribute('data-status') === 'clear');
  await shot(page, '03-account-settled');

  await page.click('[data-act="nav"][data-tab="month"]');
  await page.waitForSelector('[data-testid="month-profit"]');
  const profit = await page.$eval('[data-testid="month-profit"]', el => el.textContent);
  assert(profit.includes('85,00'), 'Month profit should be 85,00, got ' + profit);
  const note = await page.$eval('[data-testid="month-note"]', el => el.textContent);
  assert(note.toLowerCase().includes('ainda não'), 'Missing unpaid-income note');
  await page.click('[data-act="nav"][data-tab="year"]');
  await page.waitForSelector('[data-testid="year-gross"]');
  const yearGross = await page.$eval('[data-testid="year-gross"]', el => el.textContent);
  assert(yearGross.includes('170,00'), 'Year gross should be 170,00, got ' + yearGross);

  await page.click('[data-act="nav"][data-tab="settings"]');
  await page.waitForSelector('[data-screen="settings"]');
  await page.click('[data-act="nav"][data-tab="general"]');
  await page.waitForSelector('[data-screen="general"]');
  await page.select('[data-bind="lang"]', 'en');
  await page.click('[data-act="save-general"]');
  await page.waitForSelector('[data-screen="settings"]');
  const en = await text(page);
  assert(en.includes('Demo mode'), 'English UI did not show Demo mode: ' + en.slice(0, 240));
  await page.click('[data-act="nav"][data-tab="general"]');
  await page.waitForSelector('[data-screen="general"]');
  await page.select('[data-bind="lang"]', 'pt');
  await page.click('[data-act="save-general"]');
  await page.waitForSelector('[data-testid="demo-banner"]');
  await page.evaluate(() => document.querySelector('[data-tab="data"]').click());
  await page.waitForSelector('[data-screen="data"] a[href="privacy.html"]');
  await page.waitForSelector('[data-screen="data"] a[href="terms.html"]');
  await page.click('[data-act="nav"][data-tab="settings"]');
  await page.waitForSelector('[data-screen="settings"] a[href="privacy.html"]');

  const today = calc.lisbonToday();
  await page.evaluate((todayIso) => {
    const key = 'tm.demo.v1';
    const data = JSON.parse(localStorage.getItem(key));
    const driver = data.drivers.find(d => !d.deleted);
    const tuk = data.tuks.find(t => !t.deleted);
    const addDays = (iso, n) => {
      const [y, m, d] = iso.split('-').map(Number);
      const dt = new Date(Date.UTC(y, m - 1, d + n));
      return dt.toISOString().slice(0, 10);
    };
    const owner = { id: 'drv-owner', name: 'Nuno Baptista', number: '3', phone: '910000003', isOwner: true, active: true, deleted: false, order: 2, pctHistory: [{ from: '1970-01-01', pct: 50 }] };
    if (!data.drivers.some(d => d.id === owner.id)) data.drivers.push(owner);
    data.config.tipsEnabled = true;
    data.config.bonusMode = 'monthly';
    data.config.bonusAmount = 100;
    const parts = todayIso.split('-').map(Number);
    data.goals = data.goals.filter(g => !(g.year === parts[0] && g.month === parts[1]));
    data.goals.push({ year: parts[0], month: parts[1], amount: 400 });
    data.services = data.services.filter(s => s.driverId !== driver.id);
    data.handovers = [];
    data.tips = [{ id: 'tip-1', date: todayIso, driverId: owner.id, amount: 20 }];
    const plan = [-10, -8, -7, -3, -1, 0];
    plan.forEach((delta, i) => {
      const date = addDays(todayIso, delta);
      data.services.push({ id: 'seed-' + i, date, driverId: driver.id, amount: 80 + i * 10, note: '' });
      data.assignments.push({ date, driverId: driver.id, tukId: tuk.id, workedZero: false, tukExplicit: true });
    });
    data.services.push({ id: 'own-1', date: todayIso, driverId: owner.id, amount: 120, note: '' });
    data.assignments.push({ date: todayIso, driverId: owner.id, tukId: null, workedZero: false, tukExplicit: true });
    data.handovers.push({ id: 'pay-old', date: addDays(todayIso, -6), driverId: driver.id, amount: 20, note: 'other' });
    if (tuk) tuk.garageMonthly = 150;
    localStorage.setItem(key, JSON.stringify(data));
  }, today);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[data-screen="day"]');
  await crash(page);
  await shot(page, '04-day-rich');
  await page.click('[data-act="nav"][data-tab="drivers"]');
  await page.waitForSelector('[data-screen="drivers"]');
  await shot(page, '05-drivers');
  const buttons = await page.$$('[data-act="open-driver"]');
  await buttons[0].click();
  await page.waitForSelector('[data-testid="due-total"]');
  const status = await page.$eval('[data-testid="due-total"]', el => el.getAttribute('data-status'));
  assert(status === 'red' || status === 'amber', 'Seeded account should show an open balance, got ' + status);
  await shot(page, '06-account');
  await page.click('[data-act="nav"][data-tab="month"]');
  await page.waitForSelector('[data-testid="month-profit"]');
  await shot(page, '07-month');
  await page.click('[data-act="nav"][data-tab="year"]');
  await page.waitForSelector('[data-testid="year-gross"]');
  await shot(page, '08-year');
  await page.click('[data-act="nav"][data-tab="settings"]');
  await page.waitForSelector('[data-screen="settings"]');
  await shot(page, '09-settings');
  await page.evaluate(() => document.querySelector('[data-tab="types"]').click());
  await page.waitForSelector('[data-screen="types"]');
  await shot(page, '10-expense-types');
  await page.setViewport({ width: 360, height: 800, deviceScaleFactor: 1 });
  const narrow = await page.evaluate(() => {
    const app = document.getElementById('app');
    return app.scrollWidth <= app.clientWidth + 1;
  });
  assert(narrow, 'Expense types overflow at 360px');

  console.log('E2E OK');
  console.log('OFFLINE_MANAGER', JSON.stringify(offlineManager));
} finally {
  await browser.close();
  server.close();
}
