// Mini-controlador de Chrome vía CDP (sin dependencias) para recorrer la web de PARTYVERSE.
import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const DIST = process.argv[2];
const OUT = process.argv[3];
const PORT = 8790;
fs.mkdirSync(OUT, { recursive: true });

// Servidor estático con fallback SPA.
const types = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.ico': 'image/x-icon', '.json': 'application/json', '.ttf': 'font/ttf' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let f = path.join(DIST, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(DIST, 'index.html');
  res.writeHead(200, { 'content-type': types[path.extname(f)] ?? 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(PORT);

const chrome = spawn('google-chrome', ['--headless=new', '--no-sandbox', '--disable-gpu', '--remote-debugging-port=9333', '--user-data-dir=' + OUT + '/profile', '--window-size=390,844', 'about:blank'], { stdio: 'ignore' });
let targets = [];
for (let i = 0; i < 40; i++) {
  try { targets = await (await fetch('http://127.0.0.1:9333/json')).json(); if (targets.some((t) => t.type === 'page')) break; } catch {}
  await new Promise((r) => setTimeout(r, 500));
}
const page = targets.find((t) => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pending = new Map();
const errors = [];
ws.onmessage = (m) => {
  const d = JSON.parse(m.data);
  if (d.id && pending.has(d.id)) {
    pending.get(d.id)(d);
    pending.delete(d.id);
  }
  if (d.method === 'Runtime.exceptionThrown') errors.push(d.params.exceptionDetails?.exception?.description ?? d.params.exceptionDetails?.text);
  if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') errors.push(d.params.args.map((a) => a.value ?? a.description).join(' '));
};
const send = (method, params = {}) =>
  new Promise((r) => {
    const i = ++id;
    pending.set(i, r);
    ws.send(JSON.stringify({ id: i, method, params }));
  });
await send('Runtime.enable');
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const evaluate = async (expr) => (await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result?.result?.value;

export async function go(url) {
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}${url}` });
  await sleep(1800);
}
/** Busca un elemento por aria-label exacto/prefijo o por texto visible exacto y devuelve su centro. */
async function locate(text, { prefix = false } = {}) {
  return evaluate(`(() => {
    const t = ${JSON.stringify(text)}; const prefix = ${prefix};
    const els = [...document.querySelectorAll('[aria-label],[role=button],[role=radio],[role=switch],div,span,input')];
    const match = (s) => s && (prefix ? s.startsWith(t) : s.trim() === t);
    let el = els.find((e) => match(e.getAttribute('aria-label')) && e.offsetParent !== null);
    if (!el) {
      const cands = els.filter((e) => e.offsetParent !== null && match(e.innerText));
      el = cands[cands.length - 1];
    }
    if (!el) return null;
    el.scrollIntoView({ block: 'center' });
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  })()`);
}
export async function click(text, opts) {
  const p = await locate(text, opts);
  if (!p) throw new Error(`No encontrado: «${text}»`);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', clickCount: 1 });
  await sleep(opts?.hold ?? 40);
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x, y: p.y, button: 'left', clickCount: 1 });
  await sleep(opts?.wait ?? 350);
}
export async function press(text) {
  const p = await locate(text);
  if (!p) throw new Error(`No encontrado: «${text}»`);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: p.x, y: p.y, button: 'left', clickCount: 1 });
  await sleep(300);
  return async () => {
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p.x, y: p.y, button: 'left', clickCount: 1 });
    await sleep(300);
  };
}
export async function type(placeholder, text) {
  const ok = await evaluate(`(() => { const el = [...document.querySelectorAll('input')].find(i => i.placeholder === ${JSON.stringify(placeholder)}); if (!el) return false; el.focus(); return true; })()`);
  if (!ok) throw new Error(`Input no encontrado: ${placeholder}`);
  await send('Input.insertText', { text });
  await sleep(150);
}
export async function key(k) {
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code: k, windowsVirtualKeyCode: k === 'Enter' ? 13 : 0 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code: k });
  await sleep(200);
}
export const has = async (text) => !!(await evaluate(`document.body.innerText.includes(${JSON.stringify(text)})`));
export const bodyText = () => evaluate('document.body.innerText');
export async function shot(name) {
  const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  fs.writeFileSync(path.join(OUT, `${name}.png`), Buffer.from(r.result.data, 'base64'));
}
export async function fullShot(name) {
  const h = await evaluate('Math.min(4000, document.documentElement.scrollHeight)');
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: h, deviceScaleFactor: 1, mobile: true });
  await evaluate('window.scrollTo(0,0)');
  await sleep(400);
  await shot(name);
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
}
export { sleep, evaluate, errors };
export function close() {
  ws.close();
  chrome.kill();
  server.close();
}
