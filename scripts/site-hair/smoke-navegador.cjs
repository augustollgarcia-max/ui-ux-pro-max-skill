#!/usr/bin/env node
/*
 * Teste de navegador do site público (site-hair/).
 * Abre a página de verdade no Chromium e confere o que o contrato estático não vê:
 * rolagem lateral, erros de console, imagens quebradas, janelas dos cursos,
 * menu do celular, modal de instalação e a barra fixa de contato.
 *
 * Uso local:  PLAYWRIGHT_LIB=/caminho/node_modules/playwright CHROMIUM_BIN=/caminho/chrome \
 *             node scripts/site-hair/smoke-navegador.cjs
 * No CI:      instala playwright e roda sem variáveis.
 */
const http = require("http");
const fs = require("fs");
const path = require("path");
const { chromium } = require(process.env.PLAYWRIGHT_LIB || "playwright");

const SITE = process.env.SITE_HAIR_DIR || path.join(__dirname, "..", "..", "site-hair");
const TIPOS = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp",
  ".woff2": "font/woff2", ".json": "application/json", ".mp3": "audio/mpeg" };
const WA = "https://wa.me/5516992558810";

function servidor() {
  return new Promise((ok) => {
    const s = http.createServer((req, res) => {
      let u = decodeURIComponent(req.url.split("?")[0]);
      if (u.endsWith("/")) u += "index.html";
      let f = path.join(SITE, u);
      if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, "index.html");       // /business → business/index.html
      else if (!path.extname(f) && fs.existsSync(f + ".html")) f += ".html";                      // cleanUrls: /inicio → inicio.html
      if (!f.startsWith(SITE) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { "content-type": TIPOS[path.extname(f)] || "application/octet-stream" });
      fs.createReadStream(f).pipe(res);
    });
    s.listen(0, "127.0.0.1", () => ok(s));
  });
}

(async () => {
  const srv = await servidor();
  const base = `http://127.0.0.1:${srv.address().port}`;
  const browser = await chromium.launch(process.env.CHROMIUM_BIN ? { executablePath: process.env.CHROMIUM_BIN } : {});
  const falhas = [];
  const ok = (cond, nome) => { console.log((cond ? "  ✓ " : "  ✗ ") + nome); if (!cond) falhas.push(nome); };
  // O aviso de cookies (rastreio.js) fica preso no rodapé: os testes abaixo entram já com "Recusar" escolhido,
  // e a seção "Cookies" no fim confere o aviso e o aceite separadamente.
  const criarPagina = browser.newPage.bind(browser);
  const novaPagina = async (o) => {
    const pg = await criarPagina(o);
    // A suíte nunca envia pageviews/conversões aos fornecedores reais.
    await pg.route(/googletagmanager|google-analytics|doubleclick|googleadservices|connect\.facebook/, r => r.fulfill({ status: 200, contentType: "application/javascript", body: "/* teste isolado */" }));
    return pg;
  };
  browser.newPage = async (o) => { const pg = await novaPagina(o); await pg.addInitScript(() => { try { localStorage.setItem("hair_consent_v1", "denied"); } catch (e) {} }); return pg; };
  const rolar = (p, y) => p.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), y);

  // 1. sem rolagem lateral em nenhuma largura — na landing completa (/inicio) e na raiz (seleção)
  console.log("Larguras:");
  for (const rota of ["/inicio", "/"]) for (const w of [320, 360, 390, 412, 430, 768, 1024, 1280, 1440, 1920]) {
    const p = await browser.newPage({ viewport: { width: w, height: 860 } });
    await p.goto(base + rota, { waitUntil: "load" });
    ok(!(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)), `${rota} ${w}px sem rolagem lateral`);
    await p.close();
  }

  for (const [nome, vp] of [["celular", { width: 390, height: 844 }], ["computador", { width: 1440, height: 900 }]]) {
    console.log(`\n${nome}:`);
    const p = await browser.newPage({ viewport: vp });
    const erros = [], ruins = [];
    p.on("pageerror", (e) => erros.push(e.message));
    p.on("console", (m) => { if (m.type() === "error" && !/googletagmanager|net::ERR|Failed to load resource/.test(m.text())) erros.push(m.text()); });
    p.on("response", (r) => { if (r.url().startsWith(base) && r.status() >= 400) ruins.push(r.status() + " " + r.url().slice(base.length)); });
    await p.goto(base + "/inicio", { waitUntil: "load" });

    // carrega todas as imagens preguiçosas rolando a página
    const altura = await p.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < altura; y += 500) { await rolar(p, y); await p.waitForTimeout(60); }
    await p.waitForTimeout(800);
    const quebradas = await p.evaluate(() => [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.getAttribute("src")));
    ok(quebradas.length === 0, "nenhuma imagem quebrada" + (quebradas.length ? ": " + quebradas.join(", ") : ""));
    ok(ruins.length === 0, "nenhum arquivo local com erro" + (ruins.length ? ": " + ruins.join(", ") : ""));

    ok(await p.evaluate((wa) => [...document.querySelectorAll("[data-wa-generic],[data-wa-consultoria]")].every((a) => a.href.startsWith(wa)), WA), "todos os botões de WhatsApp apontam para o 8810");
    ok(await p.evaluate(() => typeof window.gtag === "function"), "gtag do Google Ads carregado");

    await rolar(p, 0);
    for (const [curso, texto] of [["barber", "Conexão Barber"], ["beauty", "Conexão Beauty"], ["brow", "Conexão Brow & Lash"]]) {
      await p.click(`[data-course="${curso}"]`);
      await p.waitForTimeout(250);
      const r = await p.evaluate(() => ({ aberto: document.getElementById("courseModal").classList.contains("open"),
        wa: decodeURIComponent(document.getElementById("mWa").href), insc: decodeURIComponent(document.getElementById("mEnroll").href) }));
      ok(r.aberto && r.wa.startsWith(WA) && r.wa.includes(texto) && r.insc.includes(texto), `janela do curso ${texto} com WhatsApp do curso`);
      await p.keyboard.press("Escape");
      await p.waitForTimeout(150);
    }
    await p.click("[data-install]");
    ok(await p.evaluate(() => document.getElementById("installModal").classList.contains("open")), "janela de instalação do app abre");
    await p.keyboard.press("Escape");

    if (nome === "celular") {
      await rolar(p, 0); await p.waitForTimeout(200);
      const dock = () => p.evaluate(() => { const d = document.getElementById("dock"); return d.classList.contains("show") && getComputedStyle(d).transform === "none"; });
      ok(!(await dock()), "barra de contato escondida no topo");
      await rolar(p, 2200); await p.waitForTimeout(500);
      ok(await dock(), "barra de contato aparece ao rolar");
      await p.click("#menuBtn"); await p.waitForTimeout(500);
      ok(await p.evaluate(() => document.getElementById("mobileNav").classList.contains("open")), "menu do celular abre");
      ok(!(await dock()), "barra some com o menu aberto");
      await p.click('#mobileNav a[href="#formacoes"]'); await p.waitForTimeout(300);
      ok(!(await p.evaluate(() => document.getElementById("mobileNav").classList.contains("open"))), "menu fecha ao escolher um item");
      await rolar(p, altura); await p.waitForTimeout(500);
      ok(!(await dock()), "barra some no rodapé");
    }
    ok(erros.length === 0, "zero erro de JavaScript" + (erros.length ? ": " + erros.join(" | ") : ""));
    await p.close();
  }

  // 3. raiz = página de seleção (gerada pelo repositório hair-business-, 17/10/2026): os dois emblemas levam a
  //    /business e /beauty, o botão pequeno a /business/assessoria, e os três destinos abrem.
  console.log("\nraiz (seleção):");
  for (const [nome, vp] of [["celular", { width: 390, height: 844 }], ["computador", { width: 1440, height: 900 }]]) {
    const p = await browser.newPage({ viewport: vp });
    const erros = [], ruins = [];
    p.on("pageerror", (e) => erros.push(e.message));
    p.on("console", (m) => { if (m.type() === "error" && !/googletagmanager|net::ERR|Failed to load resource/.test(m.text())) erros.push(m.text()); });
    p.on("response", (r) => { if (r.url().startsWith(base) && r.status() >= 400) ruins.push(r.status() + " " + r.url().slice(base.length)); });
    await p.goto(base + "/", { waitUntil: "load" });
    await p.waitForTimeout(400);
    const links = await p.evaluate(() => [...document.querySelectorAll("a.emblema, a.esc-assessoria")].map((a) => a.getAttribute("href")).join(" "));
    ok(links === "/business /beauty /business/assessoria", `${nome}: raiz leva a /business, /beauty e /business/assessoria (${links})`);
    const lado = await p.evaluate(() => { const [a, b] = document.querySelectorAll("a.emblema"); const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect(); return rb.left >= ra.right - 1 && Math.abs(ra.top - rb.top) < 4 ? "lado" : rb.top >= ra.bottom - 1 ? "pilha" : "?"; });
    ok(lado === (vp.width >= 760 ? "lado" : "pilha"), `${nome}: emblemas ${vp.width >= 760 ? "lado a lado" : "empilhados"} (${lado})`);
    const quebradas = await p.evaluate(() => [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.getAttribute("src")));
    ok(quebradas.length === 0, `${nome}: emblemas e fundo carregam` + (quebradas.length ? ": " + quebradas.join(", ") : ""));
    ok(ruins.length === 0, `${nome}: nenhum arquivo local com erro na raiz` + (ruins.length ? ": " + ruins.join(", ") : ""));
    for (const rota of ["/business", "/beauty", "/business/assessoria"]) {
      const r = await p.goto(base + rota, { waitUntil: "load" });
      ok(!!r && r.status() === 200 && (await p.title()).length > 0, `${nome}: ${rota} abre (${r && r.status()})`);
    }
    ok(erros.length === 0, `${nome}: zero erro de JavaScript na raiz` + (erros.length ? ": " + erros.join(" | ") : ""));
    await p.close();
  }


  // Regressão: o toque na escolha deve liberar áudio real, sem trocar o documento.
  console.log("\\nÁudio na escolha:");
  for (const rota of ["/business", "/beauty"]) {
    const p = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const erros = [];
    p.on("pageerror", e => erros.push(e.message));
    await p.addInitScript(() => {
      localStorage.setItem("hb_trilha_off", "1"); // silêncio de uma visita antiga
      const play = HTMLMediaElement.prototype.play;
      window.__gestosAudio = [];
      HTMLMediaElement.prototype.play = function () {
        if (this.id === "trilha") window.__gestosAudio.push(navigator.userActivation.isActive);
        return play.call(this);
      };
    });
    await p.goto(base + "/", { waitUntil: "load" });
    await p.evaluate(() => { window.__docEscolha = document; window.__audioEscolha = document.getElementById("trilha"); });
    ok(await p.evaluate(() => window.__audioEscolha.paused), rota + ": entrada permanece silenciosa antes da escolha");
    await p.click('a.emblema[href="' + rota + '"]');
    await p.waitForURL(base + rota);
    await p.waitForSelector(".som-btn");
    await p.waitForFunction(() => { const a = document.getElementById("trilha"); return a && !a.paused && a.currentTime > 0; }, { timeout: 15000 });
    ok(await p.evaluate(() => document === window.__docEscolha && document.getElementById("trilha") === window.__audioEscolha), rota + ": documento e áudio preservados");
    ok(await p.evaluate(() => window.__gestosAudio[0] === true), rota + ": primeiro play dentro do gesto do visitante");
    ok(await p.locator(".som-btn").getAttribute("aria-pressed") === "true", rota + ": botão confirma música ativa");
    await p.click(".som-btn");
    ok(await p.evaluate(() => document.getElementById("trilha").paused), rota + ": botão desliga no primeiro toque");
    await p.click(".som-btn");
    await p.waitForFunction(() => !document.getElementById("trilha").paused);
    ok(await p.locator(".som-btn").getAttribute("aria-pressed") === "true", rota + ": botão religa no primeiro toque");
    await p.click(".menu-btn");
    ok(await p.locator(".menu-btn").getAttribute("aria-expanded") === "true", rota + ": menu funciona após a escolha");
    await p.goBack({ waitUntil: "load" });
    await p.waitForSelector(".esc-grade");
    ok(new URL(p.url()).pathname === "/", rota + ": Voltar recupera a escolha");
    ok(erros.length === 0, rota + ": sem erro JavaScript na transição" + (erros.length ? ": " + erros.join(" | ") : ""));
    await p.close();
  }

  // Cookies: nada da Meta antes do aceite; aceitar liga o Pixel e manda o evento ao /api/meta-capi
  console.log("Cookies:");
  {
    const pg = await novaPagina({ viewport: { width: 390, height: 844 } });
    const meta = [], capi = [];
    await pg.route("https://connect.facebook.net/**", (r) => { meta.push(r.request().url()); r.fulfill({ status: 200, contentType: "text/javascript", body: "" }); });
    await pg.route("**/api/meta-capi", (r) => { capi.push(JSON.parse(r.request().postData() || "{}")); r.fulfill({ status: 204, body: "" }); });
    await pg.goto(base + "/business", { waitUntil: "load" });
    ok(await pg.locator("#hair-consent").isVisible(), "aviso de cookies aparece na primeira visita");
    ok(meta.length === 0 && capi.length === 0, "nada vai para a Meta antes do aceite");
    await pg.click('#hair-consent [data-c="1"]');
    // O envio ao servidor espera o cookie _fbp por até ~1,5 s (aqui o fbevents.js é falso e nunca o cria).
    await pg.waitForTimeout(1900);
    ok(meta.some((u) => u.includes("fbevents.js")), "aceitar carrega o Meta Pixel");
    ok(capi.some((e) => e.event_name === "PageView" && e.event_id), "PageView vai ao /api/meta-capi com event_id");
    ok(!capi.some((e) => e.event_name === "Lead"), "nenhum Lead só por abrir a página");
    await pg.close();
  }
  await browser.close();
  srv.close();
  console.log(falhas.length ? `\nFALHOU: ${falhas.length} verificação(ões).` : "\nOK: site íntegro no navegador.");
  process.exit(falhas.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
