import fs from 'node:fs/promises';

const timeout = setTimeout(() => process.exit(1), 90000);
const browser = process.env.BROWSER_PORT ?? '9223';
const port = process.env.TEST_PORT ?? '3016';
const target = await (await fetch(`http://127.0.0.1:${browser}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }));
let id = 0;
const pending = new Map(), errors = [], missing = [];
ws.addEventListener('message', event => {
  const data = JSON.parse(event.data);
  if (data.method === 'Runtime.exceptionThrown') errors.push(data.params.exceptionDetails.text);
  if (data.method === 'Network.responseReceived' && data.params.response.status >= 400) missing.push(data.params.response.url);
  if (pending.has(data.id)) { pending.get(data.id)(data); pending.delete(data.id); }
});
const send = (method, params = {}) => new Promise(resolve => { const request = ++id; pending.set(request, resolve); ws.send(JSON.stringify({ id: request, method, params })); });
const evaluate = async expression => {
  const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (result.result.exceptionDetails) throw new Error(JSON.stringify(result.result.exceptionDetails));
  return result.result.result.value;
};
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const assert = (ok, message) => { if (!ok) throw new Error(message); console.log('PASS', message); };
try {
  await send('Runtime.enable'); await send('Page.enable'); await send('Network.enable');
  await send('Page.navigate', { url: `http://127.0.0.1:${port}/gio-hang/` }); await pause(1200);
  await evaluate(`localStorage.removeItem('trao:cart:v1')`);
  await send('Page.reload'); await pause(1000);
  assert(await evaluate(`!!document.querySelector('.cart-empty') && document.querySelectorAll('.cart-suggestion').length===5 && document.querySelector('.cart-checkout').disabled`), 'Empty cart, five actual templates, unavailable checkout');
  for (const width of [360, 390, 768, 1440]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: width < 768 });
    await evaluate(`document.querySelector('.cart-suggestion button:not(:disabled)')?.click()`); await pause(150);
    assert(await evaluate(`document.querySelectorAll('.cart-item').length>0 && document.documentElement.scrollWidth<=innerWidth && [...document.querySelectorAll('.cart-page button,.cart-page select,.cart-page a')].every(el=>el.getBoundingClientRect().height>=44)`), `Items, no overflow and accessible targets at ${width}px`);
    if (width >= 768) assert(await evaluate(`document.querySelector('.cart-summary').getBoundingClientRect().left>document.querySelector('.cart-products').getBoundingClientRect().right`), `Summary on right at ${width}px`);
    await evaluate(`scrollTo(0,0);document.querySelectorAll('.cart-item select').forEach(el=>{el.value='standard';el.dispatchEvent(new Event('change',{bubbles:true}))})`);
    const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
    await fs.writeFile(new URL(`./cart-${width}.png`, import.meta.url), Buffer.from(shot.result.data, 'base64'));
  }
  await evaluate(`const select=document.querySelector('.cart-item select');select.value='personal';select.dispatchEvent(new Event('change',{bubbles:true}))`); await pause(100);
  assert(await evaluate(`document.querySelector('.cart-item').textContent.includes('214.000đ')`), 'Package change uses configured personal price');
  const total = await evaluate(`document.querySelector('.cart-summary__total dd').textContent`);
  await send('Page.reload'); await pause(1000);
  assert(await evaluate(`document.querySelector('.cart-item select').value==='personal' && document.querySelector('.cart-summary__total dd').textContent===${JSON.stringify(total)}`), 'Selections and totals persist on reload');
  await evaluate(`document.querySelector('.cart-remove').click()`); await pause(100);
  assert(await evaluate(`document.activeElement.id==='cart-title' && document.querySelector('.cart-live').textContent.includes('Đã xóa')`), 'Remove restores focus and announces result');
  await evaluate(`localStorage.setItem('trao:cart:v1','[{"templateId":"invalid","packageId":"personal"},{"templateId":"hen-cau-mot-ngay","packageId":"invalid"}]')`);
  await send('Page.reload'); await pause(1000);
  assert(await evaluate(`!!document.querySelector('.cart-empty')`), 'Invalid stored selections are ignored');
  await evaluate(`localStorage.setItem('trao:cart:v1','bad json')`); await send('Page.reload'); await pause(1000);
  assert(await evaluate(`!!document.querySelector('.cart-empty')`), 'Malformed storage safely falls back to empty');
  await send('Page.navigate', { url: `http://127.0.0.1:${port}/` }); await pause(1000);
  await evaluate(`document.querySelector('a[aria-label="Giỏ hàng"]').click()`); await pause(1000);
  assert(await evaluate(`location.pathname==='/gio-hang/' && !!document.querySelector('.cart-page')`), 'Header cart icon navigates to actual cart');
  assert(errors.length===0, `No runtime errors: ${errors.join(', ')}`);
  assert(missing.every(url=>new URL(url).pathname==='/favicon.ico'), `No missing application assets: ${missing.join(', ')}`);
} finally {
  ws.close(); clearTimeout(timeout);
  await fetch(`http://127.0.0.1:${browser}/json/close/${target.id}`);
}