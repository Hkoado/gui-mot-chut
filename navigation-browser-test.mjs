import fs from 'node:fs/promises';

const watchdog = setTimeout(() => { console.error('Navigation test timed out'); process.exit(1); }, 120000);
const port = process.env.TEST_PORT ?? '3016';
const browser = process.env.BROWSER_PORT ?? '9223';
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
  const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (result.result.exceptionDetails) throw new Error(JSON.stringify(result.result.exceptionDetails));
  return result.result.result.value;
};
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const assert = (ok, message) => { if (!ok) throw new Error(message); console.log('PASS', message); };
const aligned = `(() => {const line=document.querySelector('.main-nav-underline').getBoundingClientRect();const label=document.querySelector('.main-nav [aria-current] span').getBoundingClientRect();return Math.abs(line.left-label.left)<1 && Math.abs(line.width-label.width)<1;})()`;
const key = async (key, code, windowsVirtualKeyCode) => { await send('Input.dispatchKeyEvent', {type:'keyDown',key,code,windowsVirtualKeyCode,...(key==='Enter'?{text:'\r'}:{})}); await send('Input.dispatchKeyEvent', {type:'keyUp',key,code,windowsVirtualKeyCode}); };
await send('Runtime.enable');
await send('Page.enable');
await send('Page.bringToFront');
await send('Network.enable');
await send('Emulation.setDeviceMetricsOverride', {width:1440,height:1000,deviceScaleFactor:1,mobile:false});
await send('Page.navigate', {url:`http://127.0.0.1:${port}/`});
await pause(2000);
await evaluate('document.fonts.ready');
assert(await evaluate(aligned), 'Initial underline matches actual label after fonts load');
assert(await evaluate(`document.querySelectorAll('.main-nav-underline').length===1 && [...document.querySelectorAll('.main-nav a')].map(a=>a.textContent).join('|')==='Bộ sưu tập|Cách đặt|Thiết kế riêng|Hỏi đáp|Bảng giá' && [...document.querySelectorAll('.main-nav a')].every(a=>getComputedStyle(a).backgroundColor==='rgba(0, 0, 0, 0)')`), 'One underline; unchanged order and labels; no pill fills');
await evaluate(`window.savedUnderline=document.querySelector('.main-nav-underline'); document.querySelector('.main-nav a[href="/thiet-ke-rieng/"]').click()`);
await pause(650);
assert(await evaluate(`location.pathname==='/thiet-ke-rieng/' && document.querySelector('.main-nav-underline')===window.savedUnderline && document.querySelectorAll('.main-nav [aria-current]').length===1`), 'Client route transition preserves the very same underline element');
assert(await evaluate(aligned), 'Underline fits new route');
// Capture interpolation every frame, including interrupted route changes.
await evaluate(`window.lineSamples=[];window.lineWatching=true;const sample=()=>{if(!window.lineWatching)return;window.lineSamples.push(document.querySelector('.main-nav-underline').getBoundingClientRect().x);requestAnimationFrame(sample)};sample();document.querySelector('.main-nav a[href="/bang-gia/"]').click()`);
await pause(650);
assert(await evaluate(`window.lineWatching=false;new Set(window.lineSamples.map(x=>Math.round(x))).size>5 && document.querySelector('.main-nav-underline')===window.savedUnderline`), 'Underline slides continuously instead of being replaced');
await evaluate(`history.back()`); await pause(650);
assert(await evaluate(`location.pathname==='/thiet-ke-rieng/' && ${aligned}`), 'Browser Back synchronizes active route and underline');
await evaluate(`history.forward()`); await pause(650);
assert(await evaluate(`location.pathname==='/bang-gia/' && ${aligned}`), 'Browser Forward synchronizes active route and underline');
await send('Page.reload'); await pause(1600);
assert(await evaluate(`location.pathname==='/bang-gia/' && ${aligned}`), 'Direct pricing reload initializes correctly');
await evaluate(`window.headerBefore=document.querySelector('.site-header').getBoundingClientRect().height;document.querySelector('.header-search-toggle').click()`); await pause(250);
assert(await evaluate(`document.activeElement.id==='header-search-input' && document.querySelector('.header-search-toggle').getAttribute('aria-expanded')==='true' && !document.querySelector('.header-search-panel').inert && document.querySelector('.site-header').getBoundingClientRect().height===window.headerBefore`), 'Search opens with input focus and without header layout shift');
await send('Input.insertText', {text:'thiệp mời'});
await pause(100);
await key('Enter','Enter',13); await pause(100);
assert(await evaluate(`document.querySelector('.header-search-status').textContent.includes('chưa được kết nối') && location.pathname==='/bang-gia/'`), 'Enter honestly reports unavailable search without fake results or navigation');
await key('Escape','Escape',27); await pause(250);
assert(await evaluate(`document.querySelector('.header-search-panel').inert && document.activeElement.matches('.header-search-toggle')`), 'Escape closes search, restores focus and removes hidden controls from tab order');
await evaluate(`document.querySelector('.header-search-toggle').click()`); await pause(220);
await send('Input.dispatchMouseEvent', {type:'mousePressed',x:5,y:400,button:'left',clickCount:1});
await send('Input.dispatchMouseEvent', {type:'mouseReleased',x:5,y:400,button:'left',clickCount:1}); await pause(220);
assert(await evaluate(`document.querySelector('.header-search-panel').inert`), 'Outside pointer closes search');
await evaluate(`document.querySelector('.header-search-toggle').click()`); await pause(220);
await evaluate(`document.querySelector('.main-nav a').focus()`); await pause(220);
assert(await evaluate(`document.querySelector('.header-search-panel').inert`), 'Keyboard focus can leave the nonmodal search and closes it');
for (const width of [768,390,360,1440]) {
  await send('Emulation.setDeviceMetricsOverride', {width,height:900,deviceScaleFactor:1,mobile:width<768}); await pause(550);
  assert(await evaluate(aligned), `Underline stays aligned at ${width}px`);
  assert(await evaluate(`document.documentElement.scrollWidth<=innerWidth && [...document.querySelectorAll('.main-nav a,.header-search-toggle')].every(a=>a.getBoundingClientRect().height>=44)`), `No page overflow; touch targets >=44px at ${width}px`);
  await evaluate(`document.querySelector('.header-search-toggle').click()`); await pause(230);
  assert(await evaluate(`(()=>{const r=document.querySelector('.header-search-panel').getBoundingClientRect();const input=document.querySelector('#header-search-input').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&input.width>100&&input.height>=44})()`), `Search fits viewport at ${width}px`);
  if (width===360 || width===1440) {
    const shot = await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
    await fs.writeFile(`d:/gui-mot-chut/ui-navigation-search-${width}.png`,Buffer.from(shot.result.data,'base64'));
  }
  await key('Escape','Escape',27); await pause(220);
}
await send('Emulation.setEmulatedMedia', {features:[{name:'prefers-reduced-motion',value:'reduce'}]});
await evaluate(`document.querySelector('.main-nav a').click()`); await pause(350);
assert(await evaluate(`${aligned} && parseFloat(getComputedStyle(document.querySelector('.main-nav-underline')).transitionDuration)<.01`), 'Reduced motion disables underline travel');
await send('Emulation.setEmulatedMedia', {features:[]});
assert(await evaluate(`parseFloat(getComputedStyle(document.querySelector('.shelf-primary')).borderTopLeftRadius)<=4 && [...document.querySelectorAll('button,.button')].every(b=>parseFloat(getComputedStyle(b).borderTopLeftRadius)<=4)`), 'Buttons use square or lightly rounded corners');
const shot = await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
await fs.writeFile('d:/gui-mot-chut/ui-navigation-desktop.png',Buffer.from(shot.result.data,'base64'));
assert(errors.length===0, `No runtime exceptions: ${errors.join(', ')}`);
assert(missing.length===0, `No missing assets: ${missing.join(', ')}`);
ws.close();
clearTimeout(watchdog);