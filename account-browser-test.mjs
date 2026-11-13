import fs from 'node:fs/promises';

const timeout = setTimeout(() => { console.error('Account test timed out'); process.exit(1); }, 60000);
const browser = process.env.BROWSER_PORT ?? '9223';
const port = process.env.TEST_PORT ?? '3016';
const target = await (await fetch(`http://127.0.0.1:${browser}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }));
let id = 0;
const pending = new Map();
const errors = [];
const missing = [];
ws.addEventListener('message', event => {
  const data = JSON.parse(event.data);
  if (data.method === 'Runtime.exceptionThrown') errors.push(data.params.exceptionDetails.text);
  if (data.method === 'Network.responseReceived' && data.params.response.status >= 400) missing.push(data.params.response.url);
  if (pending.has(data.id)) { pending.get(data.id)(data); pending.delete(data.id); }
});
const send = (method, params = {}) => new Promise(resolve => { const request = ++id; pending.set(request, resolve); ws.send(JSON.stringify({ id: request, method, params })); });
const evaluate = async expression => {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.result.exceptionDetails) throw new Error(JSON.stringify(result.result.exceptionDetails));
  return result.result.result.value;
};
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const assert = (ok, label) => { if (!ok) throw new Error(label); console.log('PASS', label); };
const key = async (key, code, windowsVirtualKeyCode) => {
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode });
};
try {
  await send('Runtime.enable'); await send('Network.enable'); await send('Page.enable');
  for (const width of [360, 390, 768, 1440]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: width < 768 });
    await send('Page.navigate', { url: `http://127.0.0.1:${port}/` });
    await pause(1500); await evaluate('document.fonts.ready');
    assert(await evaluate(`document.querySelector('.header-account__panel').hidden`), `Initially closed at ${width}px`);
    await evaluate(`document.querySelector('.header-account__trigger').focus()`);
    await key(' ', 'Space', 32); await pause(100);
    assert(await evaluate(`(() => {
      const trigger=document.querySelector('.header-account__trigger'), panel=document.querySelector('.header-account__panel'), r=panel.getBoundingClientRect(), t=trigger.getBoundingClientRect();
      const items=[...panel.querySelectorAll('button')];
      return !panel.hidden && trigger.getAttribute('aria-expanded')==='true' && trigger.getAttribute('aria-controls')===panel.id && r.left>=0 && r.right<=innerWidth && r.top>=t.bottom && r.bottom<=innerHeight && document.documentElement.scrollWidth<=innerWidth && t.height>=44 && items.every(b=>b.disabled && b.getBoundingClientRect().height>=44) && items.map(b=>b.textContent).join('|')==='Đăng nhập|Đăng ký|Thiệp đã lưu|Cài đặt tài khoản';
    })()`), `Keyboard opens anchored panel, correct unavailable entries and touch targets at ${width}px`);
    const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    await fs.writeFile(new URL(`./account-dropdown-${width}.png`, import.meta.url), Buffer.from(shot.result.data, 'base64'));
    await key('Escape', 'Escape', 27); await pause(80);
    assert(await evaluate(`document.querySelector('.header-account__panel').hidden && document.activeElement===document.querySelector('.header-account__trigger')`), `Escape closes and restores focus at ${width}px`);
    await evaluate(`document.querySelector('.header-account__trigger').click()`); await pause(80);
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: 5, y: 400, button: 'left', clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 5, y: 400, button: 'left', clickCount: 1 });
    await pause(80);
    assert(await evaluate(`document.querySelector('.header-account__panel').hidden`), `Outside click closes at ${width}px`);
    await evaluate(`document.querySelector('.header-account__trigger').focus();document.querySelector('.header-account__trigger').click()`); await pause(80);
    await key('Tab', 'Tab', 9); await pause(80);
    assert(await evaluate(`document.querySelector('.header-account__panel').hidden`), `Tab exits without a focus trap at ${width}px`);
  }
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await send('Page.navigate', { url: `http://127.0.0.1:${port}/bang-gia/` }); await pause(1500);
  await evaluate(`document.querySelector('.header-account__trigger').click()`); await pause(80);
  assert(await evaluate(`!document.querySelector('.header-account__panel').hidden && location.pathname==='/bang-gia/' && document.querySelector('h1')!==null`), 'Direct pricing route and reduced-motion disclosure work');
  await key('Escape', 'Escape', 27);
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send('Emulation.setEmulatedMedia', { features: [] });
  await send('Emulation.setTouchEmulationEnabled', { enabled: false });
  for (let index = 0; index < 5; index++) {
    const point = await evaluate(`(() => { const el=document.querySelectorAll('.header-utility')[${index}];el.blur();const r=el.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...point }); await pause(250);
    assert(await evaluate(`(() => {const el=document.querySelectorAll('.header-utility')[${index}],glow=getComputedStyle(el,'::before');return glow.opacity==='1' && glow.backgroundImage.includes('radial-gradient') && glow.pointerEvents==='none';})()`), `Header icon ${index + 1} has non-interactive purple hover glow`);
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 0, y: 500 }); await pause(250);
    assert(await evaluate(`getComputedStyle(document.querySelectorAll('.header-utility')[${index}],'::before').opacity==='0'`), `Header icon ${index + 1} glow clears on pointer leave`);
    await evaluate(`document.querySelectorAll('.header-utility')[${index}].focus()`); await pause(250);
    assert(await evaluate(`(() => {const el=document.querySelectorAll('.header-utility')[${index}];return getComputedStyle(el,'::before').opacity==='1' && getComputedStyle(el).outlineStyle!=='none';})()`), `Header icon ${index + 1} preserves keyboard focus outline and glow`);
    await evaluate(`document.activeElement.blur()`);
  }
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  assert(await evaluate(`parseFloat(getComputedStyle(document.querySelector('.header-utility'),'::before').transitionDuration)<.01`), 'Header glow respects reduced motion');
  assert(errors.length === 0, `No runtime errors or missing assets: ${errors.join(', ')}`);
  assert(missing.every(url => new URL(url).pathname === '/favicon.ico'), `No missing application assets: ${missing.join(', ')}`);
  if (missing.length) console.warn('Existing missing favicon:', ...missing);
} finally {
  ws.close(); clearTimeout(timeout);
  await fetch(`http://127.0.0.1:${browser}/json/close/${target.id}`);
}