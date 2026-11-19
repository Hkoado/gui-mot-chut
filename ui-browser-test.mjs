import fs from 'node:fs/promises';
const watchdog = setTimeout(() => { console.error('Browser test timed out'); process.exit(1); }, 120000);
const targetPort = process.env.TEST_PORT ?? '3000';
const browserPort = process.env.BROWSER_PORT ?? '9223';
const tabs = await (await fetch(`http://127.0.0.1:${browserPort}/json`)).json();
let target = tabs.find(tab => tab.type === 'page' && tab.url === 'about:blank');
if (!target) {
  try { target = await (await fetch(`http://127.0.0.1:${browserPort}/json/new?about:blank`, { method: 'PUT' })).json(); }
  catch { target = tabs.find(tab => tab.type === 'page' && !tab.url.startsWith('edge:')); }
}
if (!target?.webSocketDebuggerUrl) throw new Error(`No page target available on CDP port ${browserPort}`);
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }));
let id = 0;
const waiting = new Map();
const errors = [];
ws.addEventListener('message', event => {
  const data = JSON.parse(event.data);
  if (data.method === 'Runtime.exceptionThrown') errors.push(data.params.exceptionDetails.text);
  if (waiting.has(data.id)) { waiting.get(data.id)(data); waiting.delete(data.id); }
});
const send = (method, params = {}) => new Promise(resolve => { const request = ++id; waiting.set(request, resolve); ws.send(JSON.stringify({ id: request, method, params })); });
const evaluate = async expression => {
  const response = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (response.result.exceptionDetails) throw new Error(JSON.stringify(response.result.exceptionDetails));
  return response.result.result.value;
};
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const assert = (condition, message) => { if (!condition) throw new Error(message); console.log('PASS', message); };
await send('Runtime.enable');
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: `http://127.0.0.1:${targetPort}/` });
await pause(3000);
await evaluate('document.fonts.ready');
assert(await evaluate(`document.fonts.check('400 16px "Be Vietnam Pro"') && document.fonts.check('500 16px "Lora"')`), 'Local fonts loaded');
assert(await evaluate(`document.fonts.check('400 48px "Ribel Noise"') && [...document.fonts].some(face => face.family === 'Ribel Noise' && face.status === 'loaded') && document.querySelector('.brand-wordmark').textContent === 'Trao' && getComputedStyle(document.querySelector('.brand-wordmark')).fontFamily.includes('Ribel Noise') && document.title.startsWith('Trao')`), 'Trao wordmark uses the loaded local Ribel Noise font and shared brand metadata');
assert(await evaluate(`(() => { const root = document.documentElement; const originalGlow = getComputedStyle(document.body, '::before').backgroundImage; root.style.setProperty('--palette-electric-purple', 'rgb(90, 20, 220)'); const logo = getComputedStyle(document.querySelector('.brand-wordmark')).color; const underline = getComputedStyle(document.querySelector('.main-nav-underline')).backgroundColor; const focus = getComputedStyle(root).getPropertyValue('--focus-color').trim(); const glow = getComputedStyle(document.body, '::before').backgroundImage; root.style.removeProperty('--palette-electric-purple'); return logo === 'rgb(15, 61, 31)' && underline === getComputedStyle(document.body).color && focus === 'rgb(90, 20, 220)' && glow !== originalGlow && glow.includes('radial-gradient'); })()`), 'Purple token updates focus/glow while logo and navigation stay forest green');
assert(await evaluate(`document.querySelector('.hero')?.id === 'xem-mau' && !document.querySelector('main')?.textContent.includes('Một chiếc web nhỏ.')`), 'Shelf first, old headline removed');
assert(await evaluate(`document.querySelectorAll('.book').length > 10 && document.querySelectorAll('.book:not([aria-hidden="true"])').length === 10 && new Set([...document.querySelectorAll('.book')].map(book => book.dataset.topicId)).size === 10`), 'Loop copies fill shelf with ten accessible unique topics');
assert(await evaluate(`getComputedStyle(document.querySelector('.bookshelf')).maskImage.includes('linear-gradient') && [...document.querySelectorAll('.book .cover-art')].every(cover => cover.children.length === 1 && cover.querySelector('.cover-title')) && document.querySelector('[data-topic-id="womens-day"] .cover-title').textContent === 'Ngày Phụ nữ'`), 'Inset mist mask and title-only temporary album covers');
assert(await evaluate(`document.documentElement.scrollWidth <= innerWidth`), 'Desktop has no horizontal overflow');
assert(await evaluate(`!document.querySelector('.album-price') && document.querySelector('.main-nav a[href="/bang-gia/"]') && document.querySelectorAll('.main-nav-underline').length === 1 && getComputedStyle(document.querySelector('.main-nav [aria-current]')).backgroundColor === 'rgba(0, 0, 0, 0)' && getComputedStyle(document.body, '::before').backgroundImage.includes('50% 0%')`), 'Minimal navigation retains pricing and one underline; overhead glow remains');
assert(await evaluate(`[...document.querySelectorAll('.book[data-pose="spine"]')].every(book => getComputedStyle(book.querySelector('.book-front')).visibility === 'hidden' && getComputedStyle(book.querySelector('.book-spine strong')).writingMode === 'horizontal-tb') && getComputedStyle(document.querySelector('.book.is-active .book-front')).boxShadow !== 'none'`), 'Settled spine labels use a single rotated line, edge-on covers are culled, active cover has elevation');
await evaluate(`document.querySelector('.shelf-primary').focus(); document.querySelector('.shelf-primary').click()`); await pause(1200);
assert(await evaluate(`!!document.querySelector('.album-dialog[open]') && document.querySelector('dialog').contains(document.activeElement)`), 'Primary CTA opens the selected album with modal focus');
await evaluate(`document.querySelector('.detail-close').click()`); await pause(950);
assert(await evaluate(`document.documentElement.lang === 'vi' && !document.querySelector('.language-switch, [lang="en"]')`), 'Vietnamese only, without a language switch');
for (const selector of ['.shelf-controls button:first-child', '.shelf-controls button:last-child']) {
  const arrow = await evaluate(`(() => { const r = document.querySelector('${selector}').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; })()`);
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...arrow }); await pause(250);
  assert(await evaluate(`(() => { const b = document.querySelector('${selector}'); const s = getComputedStyle(b); const glow = getComputedStyle(b, '::before'); const r = b.getBoundingClientRect(); return s.backgroundColor === 'rgba(0, 0, 0, 0)' && s.color === getComputedStyle(document.body).color && s.borderRadius !== '50%' && glow.backgroundImage.includes('radial-gradient') && +glow.opacity === 1 && glow.pointerEvents === 'none' && r.width >= 44 && r.height >= 44; })()`), `${selector} shows a soft glow without a circular fill or changed hit target`);
}
await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 0, y: 0 }); await pause(250);
assert(await evaluate(`[...document.querySelectorAll('.shelf-controls button')].every(b => +getComputedStyle(b, '::before').opacity === 0)`), 'Arrow glow clears after pointer leaves');
await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
await evaluate(`document.querySelector('.shelf-controls button:first-child').focus({preventScroll:true})`); await pause(250);
assert(await evaluate(`(() => { const b = document.activeElement; const s = getComputedStyle(b); return b.matches('.shelf-controls button:focus-visible') && s.outlineStyle === 'solid' && parseFloat(s.outlineWidth) >= 3 && +getComputedStyle(b, '::before').opacity === 1; })()`), 'Arrow keyboard focus retains an outline as well as glow');
await evaluate(`document.activeElement.blur()`);
await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 720, y: 400 }); await pause(700);
assert(await evaluate(`!document.querySelector('.pointer-cursor') && !document.documentElement.hasAttribute('data-custom-cursor') && getComputedStyle(document.body).cursor !== 'none' && getComputedStyle(document.querySelector('.book.is-active')).cursor === 'pointer'`), 'Native system cursor replaces circular custom cursor');
assert(await evaluate(`[...document.querySelectorAll('.book-spine')].every(spine => spine.children.length === 1 && spine.firstElementChild.tagName === 'STRONG') && document.querySelector('[data-topic-id="christmas"] .book-spine').textContent === 'Giáng sinh' && document.querySelector('[data-topic-id="womens-day"] .book-spine').textContent === 'Ngày Phụ nữ'`), 'Spines contain only the main occasion title');
assert(await evaluate(`(() => { const shelf=document.querySelector('.bookshelf'); const style=getComputedStyle(shelf); const height=parseFloat(document.querySelector('.bookshelf-wrap').style.getPropertyValue('--shelf-fitted-height')); return parseFloat(style.getPropertyValue('--book-gap-ratio')) === .075 && height < 414 && height >= 414 * .78; })()`), 'Desktop albums are smaller with increased spacing');
const hoverSpine = await evaluate(`(() => { const r=document.querySelector('.book.is-active + .book .book-spine').getBoundingClientRect(); return {x:r.x+r.width/2,y:r.y+r.height/2}; })()`);
const beforeHover = await evaluate(`document.querySelector('.book.is-active + .book').style.transform`);
await send('Input.dispatchMouseEvent', { type:'mouseMoved', ...hoverSpine }); await pause(700);
assert(await evaluate(`document.querySelector('.book.is-active + .book').style.transform !== ${JSON.stringify(beforeHover)}`), 'Spine hover still lifts the book');
assert(await evaluate(`(() => {
  const body = getComputedStyle(document.body);
  const tab = getComputedStyle(document.querySelector('.main-nav [aria-current="page"]'));
  return body.backgroundColor === 'rgb(248, 246, 240)' && body.color === 'rgb(11, 60, 27)'
    && tab.backgroundColor === 'rgba(0, 0, 0, 0)' && tab.color === body.color
    && getComputedStyle(document.querySelector('.main-nav-underline')).backgroundColor === body.color;
})()`), 'Paper Cream canvas and Forest Green navigation retain the palette with a green active underline');
assert(await evaluate(`Math.abs(document.querySelector('.bookshelf').getBoundingClientRect().width - document.documentElement.clientWidth) < 2`), 'Shelf fills the viewport width');
await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
await evaluate(`document.querySelector('.book[data-topic-id="new-year"]:not([aria-hidden="true"])').focus({preventScroll:true})`);
assert(await evaluate(`(() => { const book = document.activeElement; return book.matches('.book:focus-visible') && getComputedStyle(book).outlineStyle === 'none' && getComputedStyle(book.querySelector('.book-spine'), '::after').boxShadow !== 'none' && book.querySelector('.book-tilt > .book-bottom') !== null; })()`), 'Keyboard focus is on the physical book face, not a floating 3D pivot outline');
const focused = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
await fs.writeFile('d:/gui-mot-chut/ui-book-focus.png', Buffer.from(focused.result.data, 'base64'));
await evaluate(`document.activeElement.blur()`);
assert(await evaluate(`[...document.querySelectorAll('.book')].every(book => getComputedStyle(book.querySelector('.book-spine'), '::after').boxShadow === 'none')`), 'Book face focus rings disappear on blur');
await evaluate(`localStorage.setItem('gmc-language', 'en')`);
await pause(800);
assert(await evaluate(`document.documentElement.lang === 'vi' && !document.querySelector('[lang="en"]') && [...document.querySelectorAll('.book .cover-title, .book-spine')].every(node => !/Birthday|Wedding|Date|Private Party|Women's Day|Christmas|Custom|Love|New Year|Yearbook/.test(node.textContent))`), 'Stored English preference is ignored');
// Settle focus-driven page scrolling before measuring the dialog origin.
await evaluate(`document.querySelector('.book.is-active').focus({preventScroll:true})`);
await pause(400);
const openingTop = await evaluate(`document.querySelector('.book.is-active .book-front').getBoundingClientRect().top`);
await evaluate(`document.querySelector('.book.is-active').focus(); document.querySelector('.book.is-active').click()`);
await pause(300);
assert(await evaluate(`document.querySelector('.album-dialog').open && document.activeElement.classList.contains('dialog-close')`), 'Album cover opens a focused dialog');
assert(await evaluate(`getComputedStyle(document.querySelector('.album-dialog')).backgroundColor === 'rgb(248, 246, 240)'`), 'Album sheet inherits Paper Cream');
assert(await evaluate(`(() => { const d=document.querySelector('.album-dialog'); const a=d.getAnimations().find(a=>a.effect.target===d); const first=a.effect.getKeyframes()[0]; return d.classList.contains('detail') && a.effect.getTiming().duration===1050 && Math.abs(parseFloat(first.clipPath.replace('inset(',''))-Math.max(0,${openingTop}))<2 && d.querySelectorAll('.ink-blob').length===7 && !document.querySelector('.album-open'); })()`), 'Sheet starts at projected cover, uses 1050ms opening and seven ink blobs; no bottom open button');
await pause(2200);
assert(await evaluate(`(() => { const d=document.querySelector('.detail'); const r=d.getBoundingClientRect(); return Math.abs(r.width-innerWidth)<2 && Math.abs(r.height-innerHeight)<2 && [...d.querySelectorAll('.ink-blob')].every(c=>+c.getAttribute('r')===720) && d.scrollWidth<=d.clientWidth; })()`), 'Paper fills viewport and ink fully reveals without overflow');
const detailDesktop = await send('Page.captureScreenshot', { format:'png', captureBeyondViewport:false });
await fs.writeFile('d:/gui-mot-chut/ui-album-detail-desktop.png', Buffer.from(detailDesktop.result.data,'base64'));
await evaluate(`document.querySelector('.detail-samples-toggle').click()`);
assert(await evaluate(`document.querySelector('.detail-samples-toggle[aria-disabled="true"] svg') && !document.querySelector('.topic-templates, .template-dialog')`), 'Samples eye is marked unavailable without opening inline content');
await evaluate(`document.querySelector('.album-dialog .dialog-close').click()`);
await pause(1000);
assert(await evaluate(`!document.querySelector('dialog') && document.activeElement.matches('.book.is-active')`), 'Closing album restores cover focus');
await evaluate(`document.querySelector('.book.is-active').click()`); await pause(150);
await send('Input.dispatchKeyEvent', { type:'keyDown', key:'Escape', code:'Escape', windowsVirtualKeyCode:27 });
await send('Input.dispatchKeyEvent', { type:'keyUp', key:'Escape', code:'Escape', windowsVirtualKeyCode:27 });
await pause(1000);
assert(await evaluate(`!document.querySelector('.detail') && document.body.style.overflow !== 'hidden'`), 'Early Escape cancels reveal and restores page scrolling');
await send('Page.reload'); await pause(1800);
assert(await evaluate(`document.documentElement.lang === 'vi' && !document.querySelector('.language-switch, [lang="en"]')`), 'Vietnamese survives refresh with a legacy English preference');
await evaluate(`localStorage.removeItem('gmc-language')`);
const desktop = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
await fs.writeFile('d:/gui-mot-chut/ui-desktop.png', Buffer.from(desktop.result.data, 'base64'));
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true }); await pause(600);
assert(await evaluate(`document.documentElement.scrollWidth <= innerWidth`), 'Mobile has no horizontal overflow');
assert(await evaluate(`getComputedStyle(document.body).backgroundColor === 'rgb(248, 246, 240)' && getComputedStyle(document.body).color === 'rgb(11, 60, 27)'`), 'Mobile retains Paper Cream and Forest Green');
await evaluate(`document.querySelector('.bookshelf').focus()`);
await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowRight', code: 'ArrowRight' }); await pause(800);
assert(await evaluate(`document.querySelector('.shelf-controls span').textContent === '02 / 10'`), 'Keyboard selects next book');
await evaluate(`document.querySelector('.shelf-controls button:last-child').click()`); await pause(750);
await evaluate(`document.querySelector('.shelf-controls button:last-child').click()`); await pause(750);
for (let i = 0; i < 7; i++) { await evaluate(`document.querySelector('.shelf-controls button:last-child').click()`); await pause(100); }
await pause(750);
assert(await evaluate(`document.querySelector('.shelf-controls span').textContent === '01 / 10' && document.querySelectorAll('.book.is-active').length === 1`), 'Next from last topic keeps an active book');
await evaluate(`document.querySelector('.shelf-controls button:first-child').click()`); await pause(750);
assert(await evaluate(`document.querySelector('.shelf-controls span').textContent === '10 / 10' && document.querySelectorAll('.book.is-active').length === 1`), 'Previous from first topic keeps an active book');
for (const step of [1, -1]) {
  const result = await evaluate(`(async () => {
    const control = document.querySelector('.shelf-controls button:${step === 1 ? 'last' : 'first'}-child');
    for (let i = 0; i < 40; i++) {
      const outgoing = document.querySelector('.book.is-active');
      control.click();
      await new Promise(resolve => setTimeout(resolve, 80));
      if (!outgoing.isConnected || document.querySelectorAll('.book.is-active').length !== 1 || document.querySelectorAll('.book:not([aria-hidden="true"])').length !== 10) return false;
    }
    await new Promise(resolve => setTimeout(resolve, 750));
    const cover = document.querySelector('.book.is-active .book-front').getBoundingClientRect();
    const shelf = document.querySelector('.bookshelf').getBoundingClientRect();
    return cover.width > 100 && Math.abs(cover.x + cover.width / 2 - (shelf.x + shelf.width / 2)) < 80 && document.querySelectorAll('.book').length > 10;
  })()`);
  assert(result, `Four rapid cycles ${step === 1 ? 'forward' : 'backward'} preserve visible active book, DOM continuity and ten accessible topics`);
}
await evaluate(`document.querySelector('.bookshelf').blur()`);
const bounds = await evaluate(`(() => { const shelf=document.querySelector('.bookshelf'); const r=shelf.getBoundingClientRect(); const style=getComputedStyle(shelf); const height=parseFloat(document.querySelector('.bookshelf-wrap').style.getPropertyValue('--shelf-fitted-height')); return {x:r.x+r.width*.9,y:r.y+r.height/2,step:height*(parseFloat(style.getPropertyValue('--book-spine-ratio'))+parseFloat(style.getPropertyValue('--book-gap-ratio')))}; })()`);
await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: bounds.x, y: bounds.y, button: 'left', clickCount: 1 });
await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: bounds.x - bounds.step, y: bounds.y, button: 'left', buttons: 1 });
await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: bounds.x - bounds.step, y: bounds.y, button: 'left', clickCount: 1 });
await pause(800);
assert(await evaluate(`document.querySelector('.shelf-controls span').textContent === '01 / 10' && !document.querySelector('dialog')`), 'Drag selects a book without opening dialog');
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
assert(await evaluate(`getComputedStyle(document.documentElement).getPropertyValue('--duration-shelf').trim() === '1ms'`), 'Reduced motion uses minimal shelf duration');
const mobile = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
await fs.writeFile('d:/gui-mot-chut/ui-mobile.png', Buffer.from(mobile.result.data, 'base64'));
await send('Page.navigate', { url: `http://127.0.0.1:${targetPort}/bang-gia/?templateId=hen-cau-mot-ngay` }); await pause(1800);
assert(await evaluate(`document.querySelector('main').textContent.includes('Hẹn cậu một ngày') && document.documentElement.lang === 'vi'`), 'Direct pricing URL retains selected design');
assert(await evaluate(`getComputedStyle(document.body).backgroundColor === 'rgb(248, 246, 240)' && getComputedStyle(document.body).color === 'rgb(11, 60, 27)'`), 'Direct pricing route inherits the shared cream/forest theme');
assert(await evaluate(`document.title === 'Bảng giá — Trao' && [...document.querySelectorAll('.brand-wordmark')].every(mark => mark.textContent === 'Trao' && getComputedStyle(mark).fontFamily.includes('Ribel Noise')) && document.querySelector('.site-footer small').textContent.includes('Trao')`), 'Direct pricing route shares Trao header, footer and metadata');
assert(errors.length === 0, `No browser runtime exceptions: ${errors.join(', ')}`);
for (const [width, height] of [[1366,768],[1440,900],[1920,1080],[390,844],[360,640]]) {
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 768 });
  await send('Page.navigate', { url: `http://127.0.0.1:${targetPort}/` }); await pause(900);
  assert(await evaluate(`document.documentElement.scrollWidth <= innerWidth && document.querySelector('.shelf-primary').getBoundingClientRect().bottom <= innerHeight && !document.querySelector('.album-price') && !document.querySelector('.site-footer') && document.querySelectorAll('main > section').length === 1`), `Album fits ${width}x${height} without overflow or extra sections`);
}
await evaluate(`document.querySelector('.shelf-controls button:last-child').click()`); await pause(700);
await evaluate(`document.querySelector('.book.is-active').focus(); document.querySelector('.book.is-active').click()`); await pause(150);
assert(await evaluate(`document.querySelector('.album-dialog .detail-samples-toggle[aria-disabled="true"]') && !document.querySelector('.topic-templates')`), 'Empty album keeps the same unavailable samples action');
assert(await evaluate(`getComputedStyle(document.querySelector('.detail')).getPropertyValue('--duration-sheet-open').trim()==='1ms' && [...document.querySelectorAll('.ink-blob')].every(c=>+c.getAttribute('r')===720) && document.querySelector('.detail').scrollWidth<=innerWidth`), 'Reduced motion reveals ink immediately on mobile without overflow');
const detailMobile = await send('Page.captureScreenshot', { format:'png', captureBeyondViewport:false });
await fs.writeFile('d:/gui-mot-chut/ui-album-detail-mobile.png', Buffer.from(detailMobile.result.data,'base64'));
await evaluate(`document.querySelector('.detail-close').click()`); await pause(100);
assert(await evaluate(`!document.querySelector('.detail') && document.activeElement.matches('.book.is-active')`), 'Reduced motion close restores album focus');
for (const path of ['cach-dat','thiet-ke-rieng','hoi-dap','bang-gia']) {
  await send('Page.navigate', { url: `http://127.0.0.1:${targetPort}/${path}/` }); await pause(1000);
  assert(await evaluate(`!!document.querySelector('main') && document.querySelector('.main-nav [aria-current="page"]').getAttribute('href') === '/${path}/' && document.documentElement.scrollWidth <= innerWidth && document.documentElement.lang === 'vi' && !document.querySelector('.language-switch, [lang="en"]')`), `Direct ${path} route loads with selected tab and no overflow`);
}
assert(errors.length === 0, `No browser runtime exceptions after route checks: ${errors.join(', ')}`);
ws.close();
clearTimeout(watchdog);
