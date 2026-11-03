// Renderiza motion.html quadro a quadro (determinístico) e entrega os JPEGs
// para o ffmpeg via stdin. Uso: node render.mjs <saida.mp4> [fps] [t0] [t1]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = process.argv[2] || path.join(here, 'render-silencioso.mp4');
const fps = Number(process.argv[3] || 30);
const t0 = Number(process.argv[4] || 0);
const t1arg = process.argv[5] ? Number(process.argv[5]) : null;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
await page.goto('file://' + path.join(here, 'motion.html'));
await page.evaluate(async () => {
  await document.fonts.ready;
  await Promise.all([...document.images].map(i => i.decode().catch(() => {})));
});
const total = await page.evaluate(() => window.__total);
const t1 = t1arg ?? total;
const nFrames = Math.round((t1 - t0) * fps);
console.error(`total ${total.toFixed(2)}s · ${nFrames} quadros @ ${fps}fps · ${t0}-${t1.toFixed(2)}s`);

const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-',
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });

const cdp = await page.context().newCDPSession(page);
const started = Date.now();
for (let i = 0; i < nFrames; i++) {
  const t = t0 + i / fps;
  await page.evaluate(s => window.__seek(s), t);
  const { data } = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 93 });
  const buf = Buffer.from(data, 'base64');
  if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  if (i % 150 === 0) console.error(`quadro ${i}/${nFrames} · ${((Date.now() - started) / 1000).toFixed(0)}s`);
}
ff.stdin.end();
await new Promise(r => ff.on('close', r));
await browser.close();
console.error('ok ' + out);
