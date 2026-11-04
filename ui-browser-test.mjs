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
assert(await evaluate(`document.querySelector('.hero')?.id === 'xem-mau' && !document.querySelector('main')?.textContent.includes('Một chiếc web nhỏ.')`), 'Shelf first, old headline removed');
assert(await evaluate(`document.querySelectorAll('.book:not([aria-hidden="true"])').length === 10 && document.querySelectorAll('.book').length > 10`), 'Ten accessible topics with visual loop copies');
assert(await evaluate(`document.documentElement.scrollWidth <= innerWidth`), 'Desktop has no horizontal overflow');
assert(await evaluate(`Math.abs(document.querySelector('.bookshelf').getBoundingClientRect().width - document.documentElement.clientWidth) < 2`), 'Shelf fills the viewport width');
await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
await evaluate(`document.querySelector('.book[data-topic-id="new-year"]:not([aria-hidden="true"])').focus({preventScroll:true})`);
assert(await evaluate(`(() => { const book = document.activeElement; return book.matches('.book:focus-visible') && getComputedStyle(book).outlineStyle === 'none' && getComputedStyle(book.querySelector('.book-spine'), '::after').boxShadow !== 'none' && book.querySelector('.book-tilt > .book-bottom') !== null; })()`), 'Keyboard focus is on the physical book face, not a floating 3D pivot outline');
const focused = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
await fs.writeFile('d:/gui-mot-chut/ui-book-focus.png', Buffer.from(focused.result.data, 'base64'));
await evaluate(`document.activeElement.blur()`);
assert(await evaluate(`[...document.querySelectorAll('.book')].every(book => getComputedStyle(book.querySelector('.book-spine'), '::after').boxShadow === 'none')`), 'Book face focus rings disappear on blur');
await evaluate(`document.querySelector('.language-switch button[lang="en"]').click()`);
await pause(800);
assert(await evaluate(`document.documentElement.lang === 'en' && document.querySelector('#hero-title').textContent.includes('A SHELF') && document.querySelector('.shelf-caption').textContent.includes('Birthday cards')`), 'EN switch translates shelf and document language');
await evaluate(`document.querySelector('.topic-templates button').focus(); document.querySelector('.topic-templates button').click()`);
await pause(600);
assert(await evaluate(`document.querySelector('dialog').open && document.activeElement.classList.contains('dialog-close') && document.querySelector('dialog').textContent.includes('Make it your own')`), 'Translated dialog opens with focus');
await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
await pause(600);
assert(await evaluate(`!document.querySelector('dialog') && document.activeElement === document.querySelector('.topic-templates button')`), 'Escape closes and restores focus');
await send('Page.reload'); await pause(1800);
assert(await evaluate(`document.documentElement.lang === 'en'`), 'Language survives refresh');
await evaluate(`document.querySelector('.language-switch button[lang="vi"]').click()`); await pause(400);
const desktop = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
await fs.writeFile('d:/gui-mot-chut/ui-desktop.png', Buffer.from(desktop.result.data, 'base64'));
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true }); await pause(600);
assert(await evaluate(`document.documentElement.scrollWidth <= innerWidth`), 'Mobile has no horizontal overflow');
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
    return cover.width > 100 && Math.abs(cover.x + cover.width / 2 - (shelf.x + shelf.width / 2)) < 80 && document.querySelectorAll('.book').length >= 50;
  })()`);
  assert(result, `Four rapid cycles ${step === 1 ? 'forward' : 'backward'} preserve visible active book, DOM continuity and ten accessible topics`);
}
await evaluate(`document.querySelector('.bookshelf').blur()`);
const bounds = await evaluate(`(() => { const r=document.querySelector('.bookshelf').getBoundingClientRect(); return {x:r.x+r.width*.9,y:r.y+r.height/2}; })()`);
await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: bounds.x, y: bounds.y, button: 'left', clickCount: 1 });
await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: bounds.x - 90, y: bounds.y, button: 'left', buttons: 1 });
await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: bounds.x - 90, y: bounds.y, button: 'left', clickCount: 1 });
await pause(800);
assert(await evaluate(`document.querySelector('.shelf-controls span').textContent === '01 / 10' && !document.querySelector('dialog')`), 'Drag selects a book without opening dialog');
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
assert(await evaluate(`getComputedStyle(document.documentElement).getPropertyValue('--duration-shelf').trim() === '1ms'`), 'Reduced motion uses minimal shelf duration');
const mobile = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
await fs.writeFile('d:/gui-mot-chut/ui-mobile.png', Buffer.from(mobile.result.data, 'base64'));
await send('Page.navigate', { url: `http://127.0.0.1:${targetPort}/bang-gia/?templateId=hen-cau-mot-ngay` }); await pause(1800);
assert(await evaluate(`document.querySelector('main').textContent.includes('Hẹn cậu một ngày') && document.documentElement.lang === 'vi'`), 'Direct pricing URL retains selected design');
assert(errors.length === 0, `No browser runtime exceptions: ${errors.join(', ')}`);
ws.close();
clearTimeout(watchdog);