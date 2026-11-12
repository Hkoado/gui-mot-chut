// Read-only runtime diagnosis; variants modify only the current browser document.
import fs from 'node:fs/promises';
const port = process.env.BROWSER_PORT ?? '9237';
const url = process.env.TEST_URL ?? 'http://localhost:3027/?perf=full';
const tab = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }));
let id = 0;
const pending = new Map();
ws.addEventListener('message', event => {
  const message = JSON.parse(event.data);
  if (message.id) { pending.get(message.id)?.(message); pending.delete(message.id); }
});
const send = (method, params = {}) => new Promise(resolve => {
  pending.set(++id, resolve); ws.send(JSON.stringify({ id, method, params }));
});
const evaluate = async expression => {
  const response = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (response.error || response.result?.exceptionDetails) throw Error(JSON.stringify(response));
  return response.result.result.value;
};
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(expression) {
  for (let attempt = 0; attempt < 120; attempt++) {
    if (await evaluate(expression)) return;
    await pause(250);
  }
  throw Error(`Timed out: ${expression}`);
}
const results = [];
const errors = [];
ws.addEventListener('message', event => {
  const message = JSON.parse(event.data);
  if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails);
});
const assert = (value, message) => { if (!value) throw Error(message); };
try {
  await send('Page.enable');
  await send('Runtime.enable');
  for (const width of [1440, 768, 390, 360]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 768 });
    await send('Page.navigate', { url });
    await until(`!!document.querySelector('.book.is-active') && document.querySelector('.bookshelf')?.dataset.motion === 'continuous'`);
    await pause(3000);
    for (const variant of ['button', 'escape', 'early', 'reduced']) {
      await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: variant === 'reduced' ? 'reduce' : 'no-preference' }] });
      await evaluate(`document.querySelector('.shelf-primary').click()`);
      await until(`!!document.querySelector('.detail[open]')`);
      await pause(variant === 'early' ? 60 : 2600);
      assert(await evaluate(`document.activeElement?.closest('dialog') === document.querySelector('.detail')`), 'Focus must be inside album');
      const before = await evaluate(`(()=>{const d=document.querySelector('.detail');return {clip:getComputedStyle(d).clipPath,transform:getComputedStyle(d).transform,cover:document.querySelector('.book.is-active .book-front').getBoundingClientRect().toJSON(),animations:d.getAnimations({subtree:true}).map(a=>({state:a.playState,target:a.effect?.target?.className}))}})()`);
      await evaluate(`window.samples=[];window.t0=performance.now();window.last=t0;window.sample=()=>{const now=performance.now();const d=document.querySelector('.detail');samples.push({t:now-t0,dt:now-last,exists:!!d,opacity:d?getComputedStyle(d).opacity:null,clip:d?getComputedStyle(d).clipPath:null,transform:d?getComputedStyle(d).transform:null,scroll:scrollY,tilt:document.querySelector('.book.is-active .book-tilt').style.transform});last=now;if(now-t0<1400)requestAnimationFrame(sample)};requestAnimationFrame(sample)`);
      if (variant === 'escape') {
        await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
        await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
      } else await evaluate(`document.querySelector('.detail-close').click();document.querySelector('.detail-close').click()`);
      await pause(1700);
      const frames = await evaluate(`samples`);
      const result = { width, variant, before, max: Math.max(...frames.map(frame => frame.dt)), slow: frames.filter(frame => frame.dt > 30), frames };
      results.push(result);
      const removed = frames.findIndex(frame => !frame.exists);
      if (removed < 1) console.log('Close diagnostics', { width, variant, frames: frames.slice(-4), errors }, await evaluate(`[...document.querySelector('.detail')?.getAnimations() ?? []].map(a=>({state:a.playState,time:a.currentTime,timing:a.effect.getTiming()}))`));
      assert(removed > 0, 'Dialog must close');
      const last = frames[removed - 1];
      assert(Number(last.opacity) === 0, 'Last painted dialog must be transparent');
      assert(['none', 'matrix(1, 0, 0, 1, 0, 0)'].includes(last.transform), `Final clip must not be rotated again: ${last.transform}`);
      assert(await evaluate(`document.body.style.overflow !== 'hidden' && document.activeElement === document.querySelector('.book.is-active')`), 'Close must restore focus and scrolling');
      assert(await evaluate(`document.documentElement.scrollWidth <= innerWidth`), 'No horizontal page overflow');
      console.log(JSON.stringify({ width, variant, max: result.max, removalFrame: frames[removed].dt, transparentFinalFrame: true, focusRestored: true }));
      await until(`!document.querySelector('.detail')`);
    }
  }
  assert(errors.length === 0, `Runtime errors: ${JSON.stringify(errors)}`);
  await fs.writeFile(new URL('./album-close-fixed.json', import.meta.url), JSON.stringify(results, null, 2));
} finally {
  ws.close();
  await fetch(`http://127.0.0.1:${port}/json/close/${tab.id}`);
}