import fs from 'node:fs/promises';
const browser = process.env.BROWSER_PORT ?? '9237';
const port = process.env.TEST_PORT ?? '3037';
const tab = await (await fetch(`http://127.0.0.1:${browser}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }));
let id = 0;
const pending = new Map();
const errors = [];
ws.addEventListener('message', event => {
  const data = JSON.parse(event.data);
  if (data.id) { pending.get(data.id)?.(data); pending.delete(data.id); }
  if (data.method === 'Runtime.exceptionThrown') errors.push(data.params);
  if (data.method === 'Network.responseReceived' && data.params.response.status >= 400) errors.push(data.params.response.url);
});
const send = (method, params = {}) => new Promise(resolve => { pending.set(++id, resolve); ws.send(JSON.stringify({ id, method, params })); });
const evaluate = async expression => {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.error || result.result.exceptionDetails) throw Error(JSON.stringify(result));
  return result.result.result.value;
};
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const assert = (ok, message) => { if (!ok) throw Error(message); console.log('PASS', message); };
try {
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable'); await send('Page.bringToFront');
  for (const width of [1440, 768, 390, 360]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 768 });
    await send('Page.navigate', { url: `http://127.0.0.1:${port}/` });
    await pause(1800); await evaluate('document.fonts.ready');
    console.log('Geometry', width, await evaluate(`(()=>{const h=document.querySelector('.site-header');return {viewport:innerWidth,page:document.documentElement.scrollWidth,brand:h.querySelector('.brand').getBoundingClientRect().toJSON(),left:h.querySelector('.header-contact').getBoundingClientRect().toJSON(),right:h.querySelector('.header-actions').getBoundingClientRect().toJSON(),controls:[...h.querySelectorAll('.header-utility,.trao-search__toggle')].map(e=>e.getBoundingClientRect().toJSON())}})()`));
    assert(await evaluate(`(()=>{const h=document.querySelector('.site-header');const b=h.querySelector('.brand').getBoundingClientRect();const l=h.querySelector('.header-contact').getBoundingClientRect();const r=h.querySelector('.header-actions').getBoundingClientRect();return Math.abs(b.x+b.width/2-document.documentElement.clientWidth/2)<1 && l.right<=r.left && document.documentElement.scrollWidth<=innerWidth && [...h.querySelectorAll('.header-utility,.trao-search__toggle')].every(e=>{const x=e.getBoundingClientRect();return x.width>=44 && x.height>=44})})()`), `Centered logo, separated groups, 44px targets, no overflow at ${width}`);
    assert(await evaluate(`(()=>{const all=[...document.querySelectorAll('.header-utility')];return all.length===5 && all.every(e=>e.getAttribute('aria-disabled')==='true' && !e.hasAttribute('href')) && document.querySelectorAll('.header-contact svg').length===3 && document.querySelectorAll('.header-actions .header-utility svg,.header-actions .trao-search__toggle svg').length===3})()`), `Honest unavailable states and all six icons at ${width}`);
    assert(await evaluate(`(()=>{const left=[...document.querySelectorAll('.header-contact .header-utility')].map(e=>e.getBoundingClientRect());const right=[...document.querySelectorAll('.header-actions .trao-search__toggle,.header-actions .header-utility')].map(e=>e.getBoundingClientRect()).reverse();return !document.querySelector('.header-contact').textContent.includes('Liên hệ') && left.every((l,i)=>{const r=right[i];return Math.abs(l.left+l.width/2+r.left+r.width/2-document.documentElement.clientWidth)<1 && Math.abs(l.top-r.top)<1 && Math.abs(l.width-r.width)<1})})()`), `Three icon pairs mirror exactly around the logo at ${width}`);
    assert(await evaluate(`(()=>{const nav=document.querySelector('.main-nav').getBoundingClientRect();return [...document.querySelectorAll('.header-contact,.header-actions,.brand')].every(e=>e.getBoundingClientRect().bottom<=nav.top)})()`), `Navigation never overlaps logo or utility groups at ${width}`);
    await evaluate(`document.querySelector('.header-utility').focus()`);
    assert(await evaluate(`getComputedStyle(document.querySelector('.header-utility-status')).visibility==='visible'`), `Unavailable status visible on keyboard focus at ${width}`);
    await evaluate(`document.querySelector('.trao-search__toggle').click()`); await pause(150);
    assert(await evaluate(`document.querySelector('.trao-search__dialog').open && document.activeElement.id==='trao-search-input'`), `Search opens and focuses input at ${width}`);
    await evaluate(`document.querySelector('.trao-search__close').click()`); await pause(150);
    assert(await evaluate(`!document.querySelector('.trao-search__dialog').open && document.activeElement.matches('.trao-search__toggle') && document.body.style.overflow!=='hidden'`), `Search restores trigger focus and scrolling at ${width}`);
    await evaluate('document.activeElement.blur()');
    const screenshot = await send('Page.captureScreenshot', { format: 'png' });
    await fs.writeFile(`d:/gui-mot-chut/header-utilities-${width}.png`, Buffer.from(screenshot.result.data, 'base64'));
  }
  await send('Page.navigate', { url: `http://127.0.0.1:${port}/bang-gia/` }); await pause(1200);
  assert(await evaluate(`location.pathname==='/bang-gia/' && !!document.querySelector('.header-contact') && !!document.querySelector('.main-nav [aria-current="page"][href="/bang-gia/"]')`), 'Direct pricing route retains utilities and active navigation');
  assert(!errors.length, `No runtime or missing-asset errors: ${JSON.stringify(errors)}`);
} finally {
  ws.close(); await fetch(`http://127.0.0.1:${browser}/json/close/${tab.id}`);
}