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
  ".woff2": "font/woff2", ".json": "application/json" };
const WA = "https://wa.me/5516991687977";

function servidor() {
  return new Promise((ok) => {
    const s = http.createServer((req, res) => {
      let u = decodeURIComponent(req.url.split("?")[0]);
      if (u.endsWith("/")) u += "index.html";
      const f = path.join(SITE, u);
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
  const rolar = (p, y) => p.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), y);

  // 1. sem rolagem lateral em nenhuma largura
  console.log("Larguras:");
  for (const w of [320, 360, 390, 412, 430, 768, 1024, 1280, 1440, 1920]) {
    const p = await browser.newPage({ viewport: { width: w, height: 860 } });
    await p.goto(base + "/", { waitUntil: "load" });
    ok(!(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)), `${w}px sem rolagem lateral`);
    await p.close();
  }

  for (const [nome, vp] of [["celular", { width: 390, height: 844 }], ["computador", { width: 1440, height: 900 }]]) {
    console.log(`\n${nome}:`);
    const p = await browser.newPage({ viewport: vp });
    const erros = [], ruins = [];
    p.on("pageerror", (e) => erros.push(e.message));
    p.on("console", (m) => { if (m.type() === "error" && !/googletagmanager|net::ERR|Failed to load resource/.test(m.text())) erros.push(m.text()); });
    p.on("response", (r) => { if (r.url().startsWith(base) && r.status() >= 400) ruins.push(r.status() + " " + r.url().slice(base.length)); });
    await p.goto(base + "/", { waitUntil: "load" });

    // carrega todas as imagens preguiçosas rolando a página
    const altura = await p.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < altura; y += 500) { await rolar(p, y); await p.waitForTimeout(60); }
    await p.waitForTimeout(800);
    const quebradas = await p.evaluate(() => [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.getAttribute("src")));
    ok(quebradas.length === 0, "nenhuma imagem quebrada" + (quebradas.length ? ": " + quebradas.join(", ") : ""));
    ok(ruins.length === 0, "nenhum arquivo local com erro" + (ruins.length ? ": " + ruins.join(", ") : ""));

    ok(await p.evaluate((wa) => [...document.querySelectorAll("[data-wa-generic],[data-wa-consultoria]")].every((a) => a.href.startsWith(wa)), WA), "todos os botões de WhatsApp apontam para o 7977");
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

  await browser.close();
  srv.close();
  console.log(falhas.length ? `\nFALHOU: ${falhas.length} verificação(ões).` : "\nOK: site íntegro no navegador.");
  process.exit(falhas.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
