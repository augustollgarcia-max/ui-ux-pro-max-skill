'use strict';

// Browser integration tests against a local fixture, never the live site.
// Origin/IP and Redis transport are simulated only in this fixture. The UI and
// API handler are the real files under site-hair; no provider secret is needed.
const engines = require('playwright');
const ENGINE = process.env.BROWSER_ENGINE || 'chromium';
if (!['chromium', 'webkit'].includes(ENGINE)) throw new Error('BROWSER_ENGINE must be chromium or webkit');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { createHandler } = require('../../site-hair/api/hara-public');

const SITE = path.resolve(__dirname, '../../site-hair');
const ARTIFACTS = path.resolve(process.env.HARA_TEST_ARTIFACT_DIR || path.join(__dirname, '../../output/hara-browser', ENGINE));
const config = JSON.parse(fs.readFileSync(path.join(SITE, 'vercel.json'), 'utf8'));
const env = {
  VERCEL: '1', HARA_PUBLIC_ENABLED: 'true',
  HARA_RATE_REST_URL: 'https://test.upstash.io',
  HARA_RATE_REST_TOKEN: 'test-only', HARA_RATE_HMAC: 'a'.repeat(32),
};
let calls = 0;
let rateAllowed = true;
let delayMs = 0;
const handler = createHandler({ env, fetcher: async () => ({ ok: true, json: async () => ({ result: rateAllowed ? 1 : 0 }) }) });
const mime = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2', '.json': 'application/json', '.jpg': 'image/jpeg',
  '.png': 'image/png', '.mp4': 'video/mp4', '.mp3': 'audio/mpeg',
};
const timers = new Set();
const server = http.createServer(async (req, res) => {
  try {
    const route = new URL(req.url, 'http://fixture').pathname;
    if (route === '/api/hara-public') {
      calls++;
      let body = '';
      for await (const chunk of req) {
        body += chunk;
        if (Buffer.byteLength(body) > 4096) { res.writeHead(413); return res.end(); }
      }
      const request = {
        method: req.method, body,
        headers: { ...req.headers, origin: 'https://www.hairacademiadabeleza.com.br', 'x-vercel-forwarded-for': '192.0.2.1' },
      };
      res.status = code => { res.statusCode = code; return res; };
      res.json = value => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(value)); };
      if (!delayMs) return await handler(request, res);
      const timer = setTimeout(() => {
        timers.delete(timer);
        if (!res.destroyed) handler(request, res).catch(() => res.destroy());
      }, delayMs);
      timers.add(timer);
      res.once('close', () => { clearTimeout(timer); timers.delete(timer); });
      return;
    }
    let file = path.resolve(SITE, '.' + decodeURIComponent(route));
    if (file !== SITE && !file.startsWith(SITE + path.sep)) { res.writeHead(404); return res.end(); }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!path.extname(file) && fs.existsSync(file + '.html')) file += '.html';
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); return res.end(); }
    res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    // Apply the same matched response headers (including CSP) as the site config.
    for (const rule of config.headers) {
      if (new RegExp('^' + rule.source + '$').test(route)) {
        for (const header of rule.headers) res.setHeader(header.key, header.value);
      }
    }
    fs.createReadStream(file).on('error', () => res.destroy()).pipe(res);
  } catch (error) {
    res.statusCode = 500;
    res.end('Test fixture failure');
    console.error('Fixture error:', error.message);
  }
});

async function main() {
  let browser;
  let currentPage;
  let cases = 0;
  const externalOrigins = new Set();
  fs.mkdirSync(ARTIFACTS, { recursive: true });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    // GitHub Actions installs the pinned Playwright browser. A system binary is
    // optional for a developer's workstation, never an assumed CI dependency.
    const launch = ENGINE === 'chromium' ? { args: ['--no-sandbox'] } : {};
    if (ENGINE === 'chromium' && process.env.CHROMIUM_BIN) launch.executablePath = process.env.CHROMIUM_BIN;
    browser = await engines[ENGINE].launch(launch);
    async function pageAt(route = '/', viewport = { width: 390, height: 844 }) {
      // Mobile options emulate browser/device behavior, not a physical phone.
      const mobile = viewport.width < 600;
      const context = await browser.newContext({ viewport, serviceWorkers: 'block', isMobile: mobile, hasTouch: mobile, deviceScaleFactor: mobile ? 2 : 1 });
      // Prevent all third-party traffic, including marketing, images and APIs.
      await context.route('**/*', route => {
        const origin = new URL(route.request().url()).origin;
        if (origin === base) return route.continue();
        externalOrigins.add(origin);
        return route.fulfill({ status: 200, body: '', contentType: 'text/plain' });
      });
      await context.addInitScript(() => localStorage.setItem('hair_consent_v1', 'denied'));
      const page = await context.newPage();
      currentPage = page;
      page.setDefaultTimeout(12000);
      page.uiErrors = [];
      page.on('pageerror', error => page.uiErrors.push(error.message));
      page.on('dialog', async dialog => { page.uiErrors.push(`Unexpected ${dialog.type()} dialog`); await dialog.dismiss(); });
      await page.goto(base + route, { waitUntil: 'load' });
      const host = page.locator('#hara-public-host');
      await host.getByRole('button', { name: 'Conversar com a HARA', exact: true }).click();
      return { page, host, context };
    }
    async function expectBounds(page) {
      const result = await page.evaluate(() => {
        const root = document.querySelector('#hara-public-host').shadowRoot;
        const dialog = root.querySelector('dialog');
        const r = dialog.getBoundingClientRect();
        const footer = root.querySelector('footer').getBoundingClientRect();
        return {
          inViewport: r.left >= -1 && r.right <= innerWidth + 1 && r.top >= -1 && r.bottom <= innerHeight + 1,
          horizontalOverflow: dialog.scrollWidth > dialog.clientWidth + 1,
          footerInViewport: footer.top >= -1 && footer.bottom <= innerHeight + 1,
          viewport: [innerWidth, innerHeight],
        };
      });
      assert.ok(result.inViewport, JSON.stringify(result));
      assert.ok(!result.horizontalOverflow, JSON.stringify(result));
      assert.ok(result.footerInViewport, JSON.stringify(result));
    }
    for (const route of ['/', '/business', '/beauty', '/inicio']) {
      for (const [width, height] of [[320, 640], [390, 844], [768, 900], [1440, 900], [812, 375], [340, 234]]) {
        const before = calls;
        const { page, host, context } = await pageAt(route, { width, height });
        const input = host.getByRole('textbox', { name: 'Sua pergunta', exact: true });
        const consent = host.getByRole('checkbox');
        const submit = host.getByRole('button', { name: 'Enviar', exact: true });
        assert.equal(calls, before, 'opening the chat must not submit a request');
        assert.ok(await input.isDisabled());
        assert.ok(await submit.isDisabled());
        await expectBounds(page);
        await consent.check();
        await host.getByRole('button', { name: 'Localização', exact: true }).click();
        await host.getByText('HARA: O atendimento presencial', { exact: false }).waitFor();
        assert.equal(calls, before + 1);
        const whatsapp = host.getByRole('link', { name: 'Continuar no WhatsApp', exact: true });
        const url = new URL(await whatsapp.getAttribute('href'));
        assert.equal(url.origin, 'https://wa.me');
        assert.equal(url.pathname, '/5516992558810');
        assert.ok(!url.searchParams.get('text').includes('Onde fica'), 'transcript must not be attached');
        await input.fill('<img src=x onerror=alert(1)> cursos');
        await submit.click();
        await host.getByText('HARA: A HAIR oferece', { exact: false }).waitFor();
        assert.equal(await host.locator('.messages img').count(), 0, 'user text must not become HTML');
        assert.equal(await page.evaluate(() => localStorage.getItem('hair_consent_v1')), 'denied');
        assert.equal(await page.evaluate(() => Object.keys(localStorage).some(key => /hara/i.test(key))), false, 'chat must not persist a transcript');
        await expectBounds(page);
        if (route === '/' && [390, 1440, 340].includes(width)) {
          await page.screenshot({ path: path.join(ARTIFACTS, `chat-${width === 1440 ? 'desktop' : width === 340 ? 'short' : 'mobile'}-${ENGINE}.png`) });
        }
        await host.getByRole('button', { name: 'Apagar conversa', exact: true }).click();
        assert.equal(await host.locator('.messages').innerText(), '');
        assert.ok(!await consent.isChecked());
        assert.ok(await input.isDisabled());
        await page.keyboard.press('Escape');
        assert.ok(!await host.getByRole('dialog').isVisible());
        assert.ok(await host.getByRole('button', { name: 'Conversar com a HARA', exact: true }).evaluate(element => element === element.getRootNode().activeElement));
        assert.deepEqual(page.uiErrors, []);
        await context.close();
        currentPage = null;
        cases++;
        console.log(`PASS ${ENGINE} local browser ${route} ${width}x${height}`);
      }
    }

    // Recovery and pending-request lifecycle: all responses use the simulated
    // local provider. These tests do not claim to validate Redis/Vercel remotely.
    const { page, host, context } = await pageAt();
    const input = host.getByRole('textbox', { name: 'Sua pergunta', exact: true });
    const consent = host.getByRole('checkbox');
    const submit = host.getByRole('button', { name: 'Enviar', exact: true });
    await consent.check();
    rateAllowed = false;
    await host.getByRole('button', { name: 'Cursos', exact: true }).click();
    await host.getByText('Limite de atendimento atingido.', { exact: false }).waitFor();
    assert.ok(await submit.isEnabled());
    rateAllowed = true;
    await host.getByRole('button', { name: 'Localização', exact: true }).click();
    await host.getByText('HARA: O atendimento presencial', { exact: false }).waitFor();
    await page.screenshot({ path: path.join(ARTIFACTS, 'chat-mobile.png') });
    console.log('PASS local browser simulated HTTP 429 and recovery');

    delayMs = 1500;
    await host.getByRole('button', { name: 'Cursos', exact: true }).click();
    await host.getByText('Consultando informações…', { exact: true }).waitFor();
    assert.ok(await input.isDisabled());
    await host.getByRole('button', { name: 'Apagar conversa', exact: true }).click();
    await page.waitForTimeout(1800);
    assert.equal(await host.locator('.messages').innerText(), '');
    assert.equal(await host.locator('.status').innerText(), '');
    assert.ok(!await consent.isChecked());
    assert.ok(await input.isDisabled());
    console.log('PASS local browser revoke/erase while request is pending');

    delayMs = 10000;
    await consent.check();
    await host.getByRole('button', { name: 'Cursos', exact: true }).click();
    await host.getByText('Tempo esgotado.', { exact: false }).waitFor({ timeout: 12000 });
    assert.ok(await input.isEnabled());
    assert.ok(await submit.isEnabled());
    assert.equal(await host.locator('.messages .assistant').count(), 0);
    delayMs = 0;
    await host.getByRole('button', { name: 'Localização', exact: true }).click();
    await host.getByText('HARA: O atendimento presencial', { exact: false }).waitFor();
    assert.deepEqual(page.uiErrors, []);
    console.log('PASS local browser timeout and subsequent successful response');

    // Lead UI contract only: explicit browser mock, synthetic contact details,
    // no CRM, WhatsApp, private group, relay or production backend is contacted.
    await input.fill('Qual o preço do curso?');
    await submit.click();
    await host.getByText('HARA: Como os valores alteram de acordo com as promoções e campanhas', { exact: false }).waitFor();
    const leadRequests = [];
    let leadReply = 'unavailable';
    let popups = 0;
    page.on('popup', async popup => { popups++; await popup.close(); });
    await page.route('**/api/hara-lead', async route => {
      assert.equal(route.request().method(), 'POST');
      leadRequests.push(route.request().postDataJSON());
      return route.fulfill({
        status: leadReply === 'unavailable' ? 503 : 200,
        contentType: 'application/json',
        body: JSON.stringify(leadReply === 'unavailable' ? { error: 'Mock relay not configured' } : {
          reference: 'HAIR-TEST1234',
          whatsappUrl: leadReply === 'malicious' ? 'https://example.invalid/collect' : 'https://wa.me/5516992558810?text=Teste',
        }),
      });
    });
    await host.getByRole('link', { name: 'Continuar no WhatsApp', exact: true }).click();
    const lead = page.locator('#hara-lead-host');
    await lead.getByRole('dialog').waitFor();
    const contactConsent = lead.getByRole('checkbox', { name: /^Autorizo usar meu nome/ });
    const followup = lead.getByRole('checkbox', { name: /^Também autorizo contatos posteriores/ });
    const leadSubmit = lead.getByRole('button', { name: 'Enviar e continuar para o WhatsApp', exact: true });
    const leadStatus = lead.locator('.status');
    const whatsappContinue = lead.getByRole('link', { name: 'Abrir WhatsApp oficial', exact: true });
    assert.ok(!await contactConsent.isChecked());
    assert.ok(!await followup.isChecked());
    assert.equal(leadRequests.length, 0, 'opening contact UI must not share conversation or contact data');
    assert.equal(await lead.getByLabel('Cidade', { exact: true }).inputValue(), 'Ribeirão Preto');
    await lead.getByLabel('Cidade', { exact: true }).selectOption('other');
    await lead.getByLabel('Cidade da região', { exact: true }).selectOption('Jardinópolis');
    await lead.getByLabel('Telefone com DDD', { exact: true }).fill('(16) 99999-1234');
    await lead.getByLabel('E-mail', { exact: true }).fill('lead@example.invalid');
    const review = lead.getByLabel('Resumo do atendimento (você pode revisar)', { exact: true });
    assert.ok(await review.isVisible());
    assert.ok((await review.inputValue()).includes('Qual o preço do curso?'));
    const reviewedSummary = 'Teste sintético: interesse no curso; resumo revisado pelo visitante.';
    await review.fill(reviewedSummary);
    await leadSubmit.click();
    assert.equal(leadRequests.length, 0, 'explicit contact consent must precede POST');
    await contactConsent.check();
    await leadSubmit.click();
    await lead.getByText('Não foi possível confirmar o recebimento.', { exact: false }).waitFor();
    assert.ok(await lead.getByRole('dialog').isVisible());
    assert.ok(!await whatsappContinue.isVisible());
    assert.ok(!(await leadStatus.innerText()).includes('Solicitação recebida'));
    assert.equal(await lead.getByLabel('E-mail', { exact: true }).inputValue(), 'lead@example.invalid');
    assert.equal(popups, 0);
    leadReply = 'success';
    await leadSubmit.click();
    await whatsappContinue.waitFor();
    assert.equal(await whatsappContinue.getAttribute('href'), 'https://wa.me/5516992558810?text=Teste');
    assert.ok((await leadStatus.innerText()).includes('HAIR-TEST1234'));
    assert.equal(leadRequests.length, 2);
    const payload = leadRequests[0];
    assert.equal(payload.eventId, leadRequests[1].eventId, 'retry must retain idempotency identifier');
    assert.match(payload.eventId, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    assert.equal(payload.city, 'Jardinópolis');
    assert.equal(payload.phone, '(16) 99999-1234');
    assert.equal(payload.email, 'lead@example.invalid');
    assert.equal(payload.consent, 'lead-contact-v1');
    assert.equal(payload.followup, false);
    assert.equal(payload.context.page, '/');
    assert.equal(payload.context.summary, reviewedSummary);
    assert.ok(payload.context.topics.includes('valores'));
    assert.deepEqual(leadRequests[1], payload);
    assert.equal(popups, 0, 'successful collection exposes explicit WhatsApp link without navigation');
    await page.screenshot({ path: path.join(ARTIFACTS, `lead-mobile-${ENGINE}.png`) });
    await lead.getByRole('button', { name: 'Fechar formulário de contato', exact: true }).click();

    leadReply = 'malicious';
    await host.getByRole('link', { name: 'Continuar no WhatsApp', exact: true }).click();
    await lead.getByLabel('Telefone com DDD', { exact: true }).fill('(16) 99999-1234');
    await lead.getByLabel('E-mail', { exact: true }).fill('lead@example.invalid');
    await contactConsent.check();
    await leadSubmit.click();
    await lead.getByText('Não foi possível confirmar o recebimento.', { exact: false }).waitFor();
    assert.ok(!await whatsappContinue.isVisible());
    assert.equal(await whatsappContinue.getAttribute('href'), null);
    assert.equal(popups, 0);
    assert.notEqual(leadRequests[2].eventId, payload.eventId, 'new contact opening gets a new identifier');
    assert.deepEqual(page.uiErrors, []);
    const leadChecks = ['price promotion reply', 'CTA opens contact form', 'city/contact fields', 'reviewable summary', 'separate consent/followup', '503 preserves form', 'retry idempotency', 'validated WhatsApp link', 'malicious URL rejection'];
    console.log(`PASS ${ENGINE} ${leadChecks.length} lead UI checks with explicit mocked API only`);
    await context.close();
    currentPage = null;
    fs.writeFileSync(path.join(ARTIFACTS, 'summary.json'), JSON.stringify({
      engine: ENGINE, fixture: 'local; origin/IP/provider simulated; page third-party requests intercepted',
      mobile: 'browser emulation with touch and DPR 2 for widths below 600; no physical phone test',
      layoutCases: cases, routes: ['/', '/business', '/beauty', '/inicio'],
      viewports: [[320, 640], [390, 844], [768, 900], [1440, 900], [812, 375], [340, 234]],
      pageThirdPartyRequestsSent: 0, interceptedExternalOrigins: [...externalOrigins],
      lead: { fixture: 'page.route mock only; synthetic data; no CRM, group or relay validation', checkCount: leadChecks.length, checks: leadChecks, simulatedRequests: leadRequests.length },
      checks: ['consent', 'bounds', 'footer visibility', 'official WhatsApp', 'XSS literal rendering', 'no transcript storage', 'erase/revoke', 'Escape/focus', '429 recovery', 'pending-request erase', 'timeout recovery'],
    }, null, 2));
    console.log(`PASS ${ENGINE} ${cases} local browser layouts and recovery checks; no real provider or production requests`);
  } catch (error) {
    if (currentPage && !currentPage.isClosed()) {
      await currentPage.screenshot({ path: path.join(ARTIFACTS, 'failure.png'), fullPage: false }).catch(() => {});
    }
    throw error;
  } finally {
    for (const timer of timers) clearTimeout(timer);
    timers.clear();
    if (browser) await browser.close();
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
