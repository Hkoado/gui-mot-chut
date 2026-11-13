import fs from 'node:fs/promises';

const watchdog = setTimeout(() => process.exit(1), 90000);
const browser = process.env.BROWSER_PORT ?? '9223';
const port = process.env.TEST_PORT ?? '3016';
const target = await (await fetch(`http://127.0.0.1:${browser}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }));
let id = 0;
const pending = new Map(), errors = [];
ws.addEventListener('message', event => {
  const data = JSON.parse(event.data);
  if (data.method === 'Runtime.exceptionThrown') errors.push(data.params.exceptionDetails.text);
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
const point = (selector, x = .5, y = .5) => evaluate(`(() => {const r=document.querySelector('${selector}').getBoundingClientRect();return {x:r.left+r.width*${x},y:r.top+r.height*${y}};})()`);
const tap = async (position, touch) => {
  if (touch) {
    await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [position] });
    await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } else {
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', ...position, button: 'left', clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...position, button: 'left', clickCount: 1 });
  }
  await pause(80);
};
try {
  await send('Runtime.enable'); await send('Page.enable');
  for (const width of [320, 393, 768, 1440]) {
    const touch = width < 768;
    await send('Emulation.setDeviceMetricsOverride', { width, height: 852, deviceScaleFactor: 1, mobile: touch });
    await send('Emulation.setTouchEmulationEnabled', { enabled: touch, maxTouchPoints: 1 });
    await send('Page.navigate', { url: `http://127.0.0.1:${port}/` }); await pause(1200);
    for (const reduced of [false, true]) {
      await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: reduced ? 'reduce' : 'no-preference' }] });
      for (const [x, y] of [[.5, .5], [.15, .15], [.85, .85]]) {
        await tap(await point('.trao-search__toggle'), touch); await pause(450);
        assert(await evaluate(`document.querySelector('.trao-search__dialog').open`), `Open search ${width}px`);
        const p = await point('.trao-search__close', x, y);
        const hit = await evaluate(`document.elementFromPoint(${p.x},${p.y})?.closest('.trao-search__close')!==null`);
        const hitClass = await evaluate(`document.elementFromPoint(${p.x},${p.y})?.outerHTML.slice(0,180)`);
        assert(hit, `Close hit target ${x}/${y} ${width}px reduced=${reduced}; actual=${hitClass}`);
        await tap(p, touch);
        assert(await evaluate(`!document.querySelector('.trao-search__dialog').open && document.body.style.overflow!=='hidden' && document.activeElement===document.querySelector('.trao-search__toggle')`), `Physical ${touch ? 'touch' : 'mouse'} closes search and restores focus/scroll ${width}px reduced=${reduced}`);
      }
      await tap(await point('.trao-search__toggle'), touch); await pause(450);
      await evaluate(`(() => {const input=document.querySelector('#trao-search-input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'cuoi');input.dispatchEvent(new Event('input',{bubbles:true}));})()`); await pause(80);
      assert(await evaluate(`!!document.querySelector('.trao-search__clear')`), `Clear control available ${width}px`);
      await tap(await point('.trao-search__clear'), touch);
      assert(await evaluate(`document.querySelector('#trao-search-input').value==='' && document.querySelector('.trao-search__dialog').open && document.activeElement.id==='trao-search-input'`), `Physical clear X empties query without closing ${width}px`);
      await tap(await point('.trao-search__close'), touch);
    }
    await tap(await point('.trao-search__toggle'), touch); await pause(450);
    const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    await fs.writeFile(new URL(`./search-close-${width}.png`, import.meta.url), Buffer.from(shot.result.data, 'base64'));
    await tap(await point('.trao-search__close'), touch);
  }
  assert(errors.length === 0, `No runtime errors: ${errors.join(', ')}`);
} finally {
  ws.close(); clearTimeout(watchdog);
  await fetch(`http://127.0.0.1:${browser}/json/close/${target.id}`);
}