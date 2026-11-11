import fs from 'node:fs/promises';

const watchdog = setTimeout(() => { console.error('Palette test timed out'); process.exit(1); }, 120000);
const port = process.env.TEST_PORT ?? '3016';
const browserPort = process.env.BROWSER_PORT ?? '9223';
const target = await (await fetch(`http://127.0.0.1:${browserPort}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }));
let id = 0;
const waiting = new Map();
const errors = [];
ws.addEventListener('message', event => {
  const data = JSON.parse(event.data);
  if (data.method === 'Runtime.exceptionThrown') errors.push(data.params.exceptionDetails.text);
  if (data.method === 'Network.responseReceived' && data.params.response.status >= 400) errors.push(`${data.params.response.status} ${data.params.response.url}`);
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
const palettes = {
  birthday: ['#fff1b8', '#d6246e'], 'boys-day': ['#2f5da8', '#ffb347'], wedding: ['#f5ebdd', '#8a5a0b'],
  date: ['#f7b6b0', '#8b1a33'], party: ['#1c1c1e', '#e8c872'],
  'womens-day': ['#f2a7c3', '#5e1259'], christmas: ['#124a2c', '#ff7a6b'],
  custom: ['#ffffff', '#1f2a5c'], love: ['#d6404b', '#fff1ee'],
  'new-year': ['#b8232b', '#ffd772'], yearbook: ['#3e4a5c', '#f5cc6e'],
};
const rgb = hex => `rgb(${hex.slice(1).match(/../g).map(value => parseInt(value, 16)).join(', ')})`;
await send('Runtime.enable');
await send('Network.enable');
await send('Page.enable');
for (const width of [1440, 768, 390, 360]) {
  await send('Emulation.setDeviceMetricsOverride', { width, height: width < 768 ? 844 : 1000, deviceScaleFactor: 1, mobile: width < 768 });
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: width === 360 ? 'reduce' : 'no-preference' }] });
  await send('Page.navigate', { url: `http://127.0.0.1:${port}/` });
  await pause(1400);
  await evaluate('document.fonts.ready');
  for (const [topic, [paper, ink]] of Object.entries(palettes)) {
    assert(await evaluate(`(() => {
      const books = [...document.querySelectorAll('.book[data-topic-id="${topic}"]')];
      return books.length > 0 && books.every(book => {
        const front = getComputedStyle(book.querySelector('.book-front'));
        const spine = getComputedStyle(book.querySelector('.book-spine'));
        return front.backgroundColor === '${rgb(paper)}' && front.color === '${rgb(ink)}'
          && spine.backgroundColor === '${rgb(paper)}' && spine.color === '${rgb(ink)}';
      });
    })()`), `${topic}: exact cover/spine colors including loop copies at ${width}px`);
  }
  assert(await evaluate(`document.querySelectorAll('.book:not([aria-hidden="true"])').length === 11 && document.documentElement.scrollWidth <= innerWidth && getComputedStyle(document.body).backgroundColor === 'rgb(248, 246, 240)' && getComputedStyle(document.body).color === 'rgb(11, 60, 27)'`), `Eleven albums, unchanged site theme, no overflow at ${width}px`);
  assert(await evaluate(`(() => {
    const cover = document.querySelector('.book.is-active .cover-art');
    const spine = document.querySelector('.book.is-active .book-spine');
    return getComputedStyle(cover, '::after').backgroundImage.startsWith('linear-gradient(110deg')
      && getComputedStyle(cover).boxShadow !== 'none'
      && getComputedStyle(cover).backgroundImage.startsWith('repeating-linear-gradient')
      && getComputedStyle(spine).backgroundImage.includes('repeating-linear-gradient')
      && getComputedStyle(spine).backgroundImage.includes('linear-gradient(90deg');
  })()`), `Original pre-recolor paper grain, lighting and inset restored at ${width}px`);
  const screenshot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  await fs.writeFile(`d:/gui-mot-chut/album-palette-${width}.png`, Buffer.from(screenshot.result.data, 'base64'));
  if (width === 1440 || width === 360) {
    for (const [topic, [paper, ink]] of Object.entries(palettes)) {
      await evaluate(`document.querySelector('.book[data-topic-id="${topic}"]:not([aria-hidden="true"])').click()`);
      await pause(width === 360 ? 100 : 700);
      await evaluate(`document.querySelector('.shelf-primary').focus(); document.querySelector('.shelf-primary').click()`);
      await pause(width === 360 ? 100 : 1200);
      assert(await evaluate(`(() => {
        const dialog = document.querySelector('.album-dialog[open]');
        const cover = dialog?.querySelector('.detail-cover');
        return cover && getComputedStyle(cover).backgroundColor === '${rgb(paper)}'
          && getComputedStyle(cover).color === '${rgb(ink)}' && dialog.contains(document.activeElement)
          && dialog.scrollWidth <= dialog.clientWidth;
      })()`), `${topic}: matching dialog artwork, modal focus, no overflow at ${width}px`);
      if (topic === 'boys-day') {
        assert(await evaluate(`document.querySelector('.album-dialog').textContent.includes('chưa có mẫu') && document.querySelector('.shelf-controls span').textContent === '02 / 11'`), 'Boy’s day follows birthday with an honest empty state');
        const screenshot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
        await fs.writeFile(`d:/gui-mot-chut/album-boys-day-${width}.png`, Buffer.from(screenshot.result.data, 'base64'));
      }
      await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
      await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
      await pause(width === 360 ? 100 : 950);
      assert(await evaluate(`!document.querySelector('dialog') && document.activeElement.matches('.book.is-active') && document.body.style.overflow !== 'hidden'`), 'Escape restores cover focus and scrolling');
    }
  }
}
await send('Page.navigate', { url: `http://127.0.0.1:${port}/bang-gia/` });
await pause(1200);
assert(await evaluate(`document.title === 'Bảng giá — Trao' && !!document.querySelector('main')`), 'Direct pricing route loads');
assert(errors.length === 0, `No runtime or HTTP asset errors: ${errors.join(', ')}`);
ws.close();
clearTimeout(watchdog);