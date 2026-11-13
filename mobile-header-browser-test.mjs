import fs from 'node:fs/promises';

const watchdog = setTimeout(() => process.exit(1), 90000);
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
  const response = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (response.result.exceptionDetails) throw new Error(JSON.stringify(response.result.exceptionDetails));
  return response.result.result.value;
};
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const assert = (ok, label) => { if (!ok) throw new Error(label); console.log('PASS', label); };
const key = async (key, code, windowsVirtualKeyCode) => {
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode });
};
const shot = async name => {
  const result = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  await fs.writeFile(new URL(`./${name}.png`, import.meta.url), Buffer.from(result.result.data, 'base64'));
};
try {
  await send('Runtime.enable'); await send('Page.enable'); await send('Network.enable');
  await send('Network.setCacheDisabled', { cacheDisabled: true });
  for (const [width, height] of [[393, 852], [360, 640], [390, 844], [667, 375]]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: true });
    await send('Page.navigate', { url: `http://127.0.0.1:${port}/` }); await pause(1300); await evaluate('document.fonts.ready');
    assert(await evaluate(`(() => {
      const header=document.querySelector('.site-header').getBoundingClientRect(), main=document.querySelector('.album-page').getBoundingClientRect(), shelf=document.querySelector('.bookshelf-wrap').getBoundingClientRect();
      const button=document.querySelector('.shelf-controls button'), b=button.getBoundingClientRect(), css=getComputedStyle(button), root=getComputedStyle(document.documentElement), base=parseFloat(root.getPropertyValue('--type-lead'))*parseFloat(getComputedStyle(document.documentElement).fontSize);
      const available=innerHeight-header.bottom;
      return (shelf.height+32>available || Math.abs(shelf.y+shelf.height/2-(header.bottom+available/2))<2) && shelf.top>=header.bottom && main.height>=available-1 && document.documentElement.scrollWidth<=innerWidth && Math.abs(b.width-52.8)<1 && Math.abs(b.height-52.8)<1 && Math.abs(parseFloat(css.fontSize)-base*1.2)<.1 && document.body.style.overflow!=='hidden';
    })()`), `Centered mobile shelf, 120% arrows and safe scrolling ${width}x${height}`);
    await shot(`mobile-shelf-centered-${width}x${height}`);
    assert(await evaluate(`(() => {const f=document.querySelector('.site-footer'),main=document.querySelector('.album-page');return document.querySelectorAll('.site-footer').length===1 && f.getBoundingClientRect().height>0 && f.getBoundingClientRect().top>=main.getBoundingClientRect().bottom-1 && f.textContent.includes('Một câu chuyện nhỏ, gửi đến người thật đặc biệt.') && !!f.querySelector('a[href="/"]');})()`), `Shared footer follows shelf ${width}x${height}`);
    await evaluate(`window.scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'})`); await pause(80);
    assert(await evaluate(`(() => {const r=document.querySelector('.site-footer').getBoundingClientRect();return scrollY>0 && r.bottom<=innerHeight+1 && r.top>=0 && document.documentElement.scrollWidth<=innerWidth;})()`), `Footer reachable by normal scroll ${width}x${height}`);
    await shot(`shelf-footer-${width}x${height}`);
    await evaluate(`window.scrollTo({top:0,behavior:'instant'})`);
    const before = await evaluate(`document.querySelector('.shelf-controls span').textContent`);
    await evaluate(`document.querySelector('.shelf-controls button:last-child').click()`); await pause(700);
    assert(await evaluate(`document.querySelector('.shelf-controls span').textContent!==${JSON.stringify(before)} && !document.querySelector('.album-dialog[open]')`), `Larger next arrow selects without opening ${width}x${height}`);
    await evaluate(`document.querySelector('.shelf-controls button:first-child').click()`); await pause(700);
    assert(await evaluate(`document.querySelector('.shelf-controls span').textContent===${JSON.stringify(before)}`), `Larger previous arrow restores selection ${width}x${height}`);
  }
  for (const width of [320, 360, 390, 767, 768, 1440]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 844, deviceScaleFactor: 1, mobile: width < 768 });
    await send('Page.navigate', { url: `http://127.0.0.1:${port}/` }); await pause(1100); await evaluate('document.fonts.ready');
    assert(await evaluate(`document.documentElement.scrollWidth<=innerWidth`), `No overflow ${width}px`);
    if (width >= 768) {
      assert(await evaluate(`getComputedStyle(document.querySelector('.main-nav')).display!=='none' && getComputedStyle(document.querySelector('.header-disclosure--navigation')).display==='none' && !!document.querySelector('.header-account__trigger').getBoundingClientRect().width`), `Desktop header preserved ${width}px`);
      await shot(`mobile-header-desktop-${width}`);
      await evaluate(`window.scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'})`); await pause(80);
      assert(await evaluate(`(() => {const f=document.querySelector('.site-footer'),r=f.getBoundingClientRect();return document.querySelectorAll('.site-footer').length===1 && r.height>0 && r.bottom<=innerHeight+1 && r.top>=0;})()`), `Desktop shelf footer reachable ${width}px`);
      await shot(`shelf-footer-${width}`); continue;
    }
    assert(await evaluate(`(() => {
      const rect=s=>document.querySelector(s).getBoundingClientRect(), b=rect('.brand'), m=rect('.header-disclosure--navigation .header-utility'), s=rect('.trao-search__toggle'), cart=rect('.header-mobile-actions .header-cart');
      return Math.abs(b.x+b.width/2-innerWidth/2)<1 && [m,s,cart].every(r=>Math.abs(r.y+r.height/2-b.y-b.height/2)<1 && r.width>=44 && r.height>=44) && m.right<=s.left+1 && s.right<=b.left && b.right<=cart.left && cart.right<=innerWidth && !!document.querySelector('.mobile-nav .header-disclosure--contact') && !document.querySelector('.mobile-nav a[href="/gio-hang/"]') && getComputedStyle(document.querySelector('.main-nav')).display==='none';
    })()`), `Single row, centered logo and 44px targets ${width}px`);
    await shot(`mobile-header-${width}`);
    for (const name of ['navigation', 'contact']) {
      const root = `.header-disclosure--${name}`;
      if (name === 'contact') await evaluate(`document.querySelector('.header-disclosure--navigation > button').click()`);
      await evaluate(`document.querySelector('${root} button').focus()`); await key(' ', 'Space', 32);
      assert(await evaluate(`(() => {const p=document.querySelector('${root} .header-disclosure__panel'),r=p.getBoundingClientRect();return !p.hidden && r.left>=0 && r.right<=innerWidth && r.bottom<=innerHeight;})()`), `Keyboard opens bounded ${name} ${width}px`);
      if (name === 'contact') assert(await evaluate(`(() => {const p=document.querySelector('${root} .header-disclosure__panel'); return [...p.querySelectorAll('.header-utility')].map(b=>b.textContent).join('|')==='Facebook|Instagram|Threads' && p.querySelectorAll('svg').length===3 && [...p.querySelectorAll('button')].every(b=>b.getAttribute('aria-disabled')==='true');})()`), `Three labeled social icons, honest unavailable states ${width}px`);
      await shot(`mobile-header-${name}-${width}`);
      await key('Escape', 'Escape', 27);
      assert(await evaluate(`document.querySelector('${root} .header-disclosure__panel').hidden && document.activeElement===document.querySelector('${root} button')`), `Escape restores ${name} focus ${width}px`);
      await evaluate(`document.querySelector('${root} button').click()`);
      await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: 3, y: 600, button: 'left', clickCount: 1 });
      await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 3, y: 600, button: 'left', clickCount: 1 });
      assert(await evaluate(`document.querySelector('${root} .header-disclosure__panel').hidden`), `Outside click closes ${name} ${width}px`);
      if (name === 'contact') await evaluate(`document.querySelector('.header-disclosure--navigation > button').click()`);
      await evaluate(`document.querySelector('${root} button').focus();document.querySelector('${root} button').click()`);
      await evaluate(`document.querySelector('.brand').focus()`);
      assert(await evaluate(`document.querySelector('${root} .header-disclosure__panel').hidden`), `Focus exit closes ${name} ${width}px`);
    }
    await evaluate(`document.querySelector('.trao-search__toggle').click()`); await pause(100);
    assert(await evaluate(`document.querySelector('.trao-search__dialog').open && document.activeElement.id==='trao-search-input'`), `Search focus ${width}px`);
    await key('Escape', 'Escape', 27); await pause(80);
    assert(await evaluate(`!document.querySelector('.trao-search__dialog').open && document.activeElement===document.querySelector('.trao-search__toggle')`), `Search closes and restores focus ${width}px`);
    await evaluate(`document.querySelector('.header-disclosure--navigation button').click();document.querySelector('.mobile-nav a[href="/bang-gia/"]').click()`); await pause(700);
    assert(await evaluate(`location.pathname==='/bang-gia/' && document.querySelector('.header-disclosure--navigation .header-disclosure__panel').hidden`), `Menu navigates to pricing and closes ${width}px`);
    await evaluate(`window.scrollTo({top:0,behavior:'instant'})`); await pause(150);
    const cartPoint = await evaluate(`(() => {const r=document.querySelector('.header-mobile-actions .header-cart').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', ...cartPoint, button: 'left', clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...cartPoint, button: 'left', clickCount: 1 }); await pause(700);
    assert(await evaluate(`location.pathname==='/gio-hang/' && !!document.querySelector('h1')`), `Separate cart icon navigates ${width}px`);
  }
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await send('Page.navigate', { url: `http://127.0.0.1:${port}/` }); await pause(1300);
  await evaluate(`window.scrollTo({top:0,behavior:'instant'})`); await pause(300);
  await evaluate(`document.querySelector('.shelf-primary').focus();document.querySelector('.shelf-primary').click()`); await pause(400);
  assert(await evaluate(`!!document.querySelector('.album-dialog[open]')`), 'Album view action still opens dialog');
  await key('Escape', 'Escape', 27); await pause(1100);
  assert(await evaluate(`!document.querySelector('.album-dialog[open]') && document.body.style.overflow!=='hidden' && document.activeElement===document.querySelector('.book.is-active')`), 'Album Escape restores active-book focus and page scrolling');
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await send('Page.navigate', { url: `http://127.0.0.1:${port}/bang-gia/` }); await pause(900);
  await evaluate(`document.querySelector('.header-disclosure--navigation > button').click();document.querySelector('.header-disclosure--contact button').click()`);
  assert(await evaluate(`!!document.querySelector('h1') && !document.querySelector('.header-disclosure--contact .header-disclosure__panel').hidden && document.body.style.overflow!=='hidden'`), 'Direct pricing, reduced motion and normal scrolling');
  assert(await evaluate(`document.querySelectorAll('.site-footer').length===1 && document.querySelector('.site-footer').getBoundingClientRect().height>0`), 'Pricing retains one shared footer');
  assert(errors.length === 0, `No runtime errors: ${errors.join(', ')}`);
  assert(missing.every(url => new URL(url).pathname === '/favicon.ico'), `No missing application assets: ${missing.join(', ')}`);
} finally {
  ws.close(); clearTimeout(watchdog);
  await fetch(`http://127.0.0.1:${browser}/json/close/${target.id}`);
}