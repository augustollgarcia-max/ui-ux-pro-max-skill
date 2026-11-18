// Regressão do www local: fotos e scripts do checkout, APIs fictícias, zero envios.
const fs = require('node:fs'),
  path = require('node:path'),
  http = require('node:http');
const pw = require('playwright');
const { registrar } = require('./galeria-navegacao.cjs');
const root = path.resolve(process.env.NAV_ROOT || path.join(__dirname, '../..'), 'site-hair');
const engine = process.env.BROWSER_ENGINE || 'chromium';
const mode = process.argv.includes('--observar') ? 'antes' : 'depois';
const out = path.resolve(process.env.NAV_OUTPUT || 'output/navegacao-www', mode, engine);
const results = [];
const capturas = [];
const larguras = engine === 'webkit' ? ['iPhone13'] : [320, 360, 390, 430];
const landings = ['/', '/business', '/beauty', '/business/apps', '/business/assessoria', '/business/beauty-05-renata-scatena', '/business/beauty-06-estefania-oliveira', '/business/catalogo', '/business/completo', '/business/historia', '/modelo', '/privacidade', '/business/mestre-01-allan-rich', '/business/mestre-02-kenny-wolf', '/business/mestre-03-gustavo-rosatti', '/business/mestre-04-wesley-sharper', '/vertice', '/vertice/agendar'];
const srv = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://local'),
    name = decodeURIComponent(url.pathname);
  if (name === '/origem') return res.writeHead(200, {
    'Content-Type': 'text/html'
  }).end('<title>Origem</title>');
  const rota = name === '/alisamento' ? '/ecare-conversion' : name;
  const candidates = rota === '/' ? ['/index.html'] : [rota, rota + '.html', rota + '/index.html'];
  const file = candidates.map(p => path.resolve(root, '.' + p)).find(x => x.startsWith(root + path.sep) && fs.existsSync(x) && fs.statSync(x).isFile());
  if (!file) return res.writeHead(404).end();
  const mime = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.jpg': 'image/jpeg',
    '.woff2': 'font/woff2',
    '.svg': 'image/svg+xml',
    '.mp4': 'video/mp4'
  };
  res.writeHead(200, {
    'Content-Type': mime[path.extname(file)] || 'application/octet-stream'
  });
  fs.createReadStream(file).pipe(res);
});
async function executar() {
  await new Promise(ok => srv.listen(0, '127.0.0.1', ok));
  const base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await pw[engine].launch(process.env.CHROMIUM_PATH && engine === 'chromium' ? {
    executablePath: process.env.CHROMIUM_PATH
  } : {});
  try {
    fs.mkdirSync(out, {
      recursive: true
    });
    for (const w of larguras) {
      const opts = w === 'iPhone13' ? pw.devices['iPhone 13'] : {
        ...pw.devices['Pixel 7'],
        viewport: {
          width: w,
          height: 800
        },
        deviceScaleFactor: 1,
        isMobile: true,
        hasTouch: true
      };
      const grab = w === 'iPhone13' || w === 390;
      const ctx = await browser.newContext({
        ...opts,
        serviceWorkers: 'block',
        reducedMotion: 'reduce'
      });
      const posted = [];
      try {
        await ctx.addInitScript(() => localStorage.setItem('hair_consent_v1', 'denied'));
        await ctx.route('**/*', r => {
          const u = new URL(r.request().url());
          if (u.origin !== base) return r.abort();
          if (u.pathname.startsWith('/api/')) {
            if (r.request().method() !== 'GET') posted.push(u.pathname);
            return r.fulfill({
              json: u.pathname === '/api/hara-config' ? {
                leadsEnabled: true
              } : {}
            });
          }
          return r.continue();
        });
        const p = await ctx.newPage();
        p.setDefaultTimeout(6000);
        const check = (test, ok, observado) => results.push({
          w,
          test,
          ok: !!ok,
          observado
        });
        const captura = async (sufixo, tela) => {
          if (!grab) return;
          const arquivo = w + '-' + sufixo + '.png';
          await p.screenshot({ path: path.join(out, arquivo) });
          capturas.push({ arquivo, tela, grupo: w === 'iPhone13' ? 'iPhone 13' : w + ' px' });
        };
        const abrir = async loc => {
          await p.goto(base + '/origem');
          await p.goto(base + loc, {
            waitUntil: 'domcontentloaded'
          });
        };
        const tick = () => p.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))));
        if (grab) {
          for (const rota of landings) {
            await abrir(rota);
            await p.locator('#hara-public-host .launch').waitFor();
            await captura('pagina-' + (rota.slice(1) || 'raiz').replaceAll('/', '-'), rota);
          }
        }
        await abrir('/inicio');
        await p.locator('#hara-public-host .launch').waitFor();
        const folhasExtras = await p.evaluate(() => performance.getEntriesByType('resource').filter(e => /\/hara\/(chat|lead-form)\.css(?:$|\?)/.test(e.name)).length);
        check('Estilos das janelas fechadas fora da abertura da página', folhasExtras === 0, folhasExtras);
        for (const [nome, destino] of [['Ver formações', '/inicio#formacoes'], ['Ser modelo', '/modelo']]) {
          await abrir('/');
          await p.locator('#hara-public-host .launch').click();
          await p.locator('#hara-public-host .widget').waitFor();
          const link = p.locator('#hara-public-host .atalhos').getByRole('link', {
            name: nome,
            exact: true
          });
          let toques = 1; // O botão que abriu a HARA.
          let toquesAteInicio = null;
          if (await link.count()) {
            await link.click();
            await p.waitForURL(u => u.pathname + u.hash === destino);
            toques++;
            if (destino.startsWith('/inicio')) toquesAteInicio = toques;
          } else {
            // Recomeça na raiz. A sondagem dos atalhos acima não é contada como parte do caminho antigo.
            await abrir('/');
            toques = 0;
            const caminho = ['/business', '/vertice#grupo', '/vertice/agendar', '/inicio'];
            caminho.push(destino === '/modelo' ? '/modelo' : '#formacoes');
            for (const trecho of caminho) {
              await p.locator('a[href="' + trecho + '"]:visible').first().click();
              toques++;
              if (trecho.startsWith('#')) await p.waitForURL(u => u.pathname === '/inicio' && u.hash === trecho);
              else await p.waitForURL(u => u.pathname === trecho.split('#')[0]);
              if (trecho === '/inicio') toquesAteInicio = toques;
            }
          }
          check('Do início até ' + nome + ' em dois toques', toques <= 2, { toques, toquesAteInicio, destino: new URL(p.url()).pathname + new URL(p.url()).hash });

        }
        await abrir('/inicio');
        await captura('inicio', '/inicio · Formações');
        const menu = p.locator('#menuBtn');
        await menu.click();
        await p.locator('#mobileNav.open').waitFor();
        await captura('menu', 'Menu de /inicio');
        await p.goBack();
        await tick();
        check('Menu fecha sem abandonar a página', p.url().endsWith('/inicio') && !(await p.locator('#mobileNav.open').count()), new URL(p.url()).pathname);
        for (const type of ['barber', 'beauty', 'brow']) {
          await abrir('/inicio');
          const b = p.locator('[data-course=' + type + ']');
          await b.scrollIntoViewIfNeeded();
          const y = await p.evaluate(() => scrollY);
          await b.click();
          const modal = p.locator('#courseModal.open');
          await modal.waitFor();
          await captura('curso-' + type, 'Ficha do curso ' + type);
          const size = await modal.locator('[data-close]').boundingBox();
          check('× de ' + type + ' ≥44px', size.height >= 44 && size.width >= 44, size);
          await p.goBack();
          await tick();
          const onSite = p.url().endsWith('/inicio');
          const sy = await p.evaluate(() => scrollY);
          check('Ficha ' + type + ' volta à mesma rolagem', onSite && !(await p.locator('#courseModal.open').count()) && Math.abs(y - sy) <= 3, {
            sy,
            y,
            onSite
          });
        }
        await abrir('/inicio');
        await p.locator('[data-install]').first().click();
        await p.locator('#installModal.open').waitFor();
        await captura('instalar', 'Instalar a HAIR');
        await p.locator('[data-install-close]').click();
        await p.locator('#installModal.open').waitFor({
          state: 'hidden'
        });
        await p.goForward();
        await tick();
        check('Fechar instalação pelo × deixa o avanço disponível', (await p.locator('#installModal.open').count()) === 1);
        await abrir('/inicio');
        await p.locator('#hara-public-host .launch').click();
        await p.locator('#hara-public-host .widget').waitFor();
        await captura('chat', 'Conversa com a HARA');
        await p.locator('#hara-public-host footer a').click();
        const form = p.locator('#hara-lead-host dialog[open]');
        await form.waitFor();
        await captura('contato', 'Contato a partir da conversa');
        await p.goBack();
        await tick();
        const chat = await p.locator('#hara-public-host .widget').isVisible();
        check('Voltar fecha só o contato', chat && !(await form.count()) && p.url().endsWith('/inicio'));
        if (chat) {
          await p.goBack();
          await tick();
        }
        check('Segundo voltar fecha o chat', p.url().endsWith('/inicio') && !(await p.locator('#hara-public-host .widget').isVisible()));
        await abrir('/inicio');
        await p.locator('#menuBtn').click();
        await p.locator('#mobileNav.open a[href="#formacoes"]').click();
        await p.waitForURL(u => u.hash === '#formacoes', {
          timeout: 1800
        }).catch(() => {});
        await tick();
        check('Menu preserva o destino da formação', new URL(p.url()).hash === '#formacoes' && !(await p.locator('#mobileNav.open').count()));
        for (const rota of ['/alisamento2', '/apresentacao', '/alisamento']) {
          await abrir(rota);
          await captura(rota.slice(1), rota);
          const a = p.locator('.saida-campanha');
          const width = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
          check('Sem rolagem lateral ' + rota, width <= 1, width);
          let ok = false;
          if (await a.count()) {
            const box = await a.boundingBox();
            await a.click();
            await p.waitForURL(u => u.pathname === '/beauty' || u.pathname === '/inicio');
            ok = box.height >= 44 && box.width >= 44;
          }
          check('Saída interna da campanha ' + rota, ok);
        }
        await abrir('/apresentacao');
        await p.locator('a[href="#voucher"]').click();
        await p.locator('#voucher').waitFor();
        await captura('voucher', 'Voucher da apresentação');
        await p.locator('#voucher .close').click();
        await p.locator('#voucher').waitFor({
          state: 'hidden'
        });
        await p.goForward();
        await tick();
        check('Avançar após × reabre o voucher', await p.locator('#voucher').isVisible());
        // Conversa aberta na tela de escolha + troca de página sem recarga:
        // o primeiro voltar tem de devolver a tela de escolha, não só o endereço.
        await abrir('/');
        const lancar = p.locator('#hara-public-host .launch');
        if (await lancar.isVisible().catch(() => false)) {
          await lancar.click();
          await tick();
        }
        await p.evaluate(() => document.querySelector('a[href="/beauty"]').click());
        await p.waitForURL('**/beauty', { timeout: 15000 });
        await tick();
        await p.goBack();
        await p.locator('.esc-grade').waitFor({ timeout: 15000 }).catch(() => {});
        check('Voltar da escolha com a conversa aberta devolve a tela de escolha',
          new URL(p.url()).pathname === '/' && await p.locator('.esc-grade').isVisible().catch(() => false));
        check('Sem envio de dados', posted.length === 0, posted);
      } finally {
        await ctx.close();
      }
    }
  } finally {
    await browser.close();
  }
}
async function principal() {
  let erro;
  try {
    await executar();
  } catch (e) {
    erro = e;
    console.error(e);
  } finally {
    srv.close();
  }
  const resumo = registrar({
    app: 'HAIR · site público', raiz: path.dirname(root), pasta: out, motor: engine, versao: mode,
    previstas: larguras.length * 23,
    fotosPrevistas: landings.length + 12, resultados: results, capturas, erro
  });
  console.log(mode, resumo.aprovadas + '/' + resumo.executadas, 'verificações aprovadas.',
    resumo.capturas.length + '/' + resumo.fotosPrevistas, 'capturas geradas.');
  if (erro || !resumo.completo) process.exitCode = 1;
  if (mode === 'depois' && resumo.falhas) process.exitCode = 1;
}
principal().catch(e => { console.error(e); process.exitCode = 1; });
