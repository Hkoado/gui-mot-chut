import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';

const watchdog = setTimeout(() => process.exit(1), 90000);
const port = process.env.TEST_PORT ?? '3016';
const browserPort = process.env.BROWSER_PORT ?? '9223';
const target = await (await fetch(`http://127.0.0.1:${browserPort}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }));
let id = 0;
const pending = new Map();
const errors = [];
ws.addEventListener('message', event => {
  const data = JSON.parse(event.data);
  if (data.method === 'Runtime.exceptionThrown') errors.push(data.params.exceptionDetails.text);
  if (pending.has(data.id)) { pending.get(data.id)(data); pending.delete(data.id); }
});
const send = (method, params = {}) => new Promise(resolve => {
  const request = ++id;
  pending.set(request, resolve);
  ws.send(JSON.stringify({ id: request, method, params }));
});
const evaluate = async expression => {
  const response = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  assert(!response.result.exceptionDetails, JSON.stringify(response.result.exceptionDetails));
  return response.result.result.value;
};
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
try {
  await send('Runtime.enable');
  await send('Page.enable');
  for (const width of [1440, 768, 390, 360]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: width < 768 });
    await send('Page.navigate', { url: `http://127.0.0.1:${port}/` });
    await pause(1400);
    await evaluate('document.fonts.ready');
    for (const reduced of [false, true]) {
      await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: reduced ? 'reduce' : 'no-preference' }] });
      // Include both wrap boundaries and multiple themes, not just the initial pose.
      for (const direction of [-1, 1, 1]) {
        await evaluate(`document.querySelector('.shelf-controls button:${direction < 0 ? 'first' : 'last'}-child').click()`);
        await pause(1000);
        const state = await evaluate(`(() => {
          const shelf = document.querySelector('.bookshelf');
          const books = [...shelf.querySelectorAll('.book:not([aria-hidden="true"])')];
          const left = books.find(book => +book.style.getPropertyValue('--offset') === -1);
          const right = books.find(book => +book.style.getPropertyValue('--offset') === 1);
          const yaw = book => { const m = new DOMMatrix(getComputedStyle(book).transform); return Math.atan2(m.m31, m.m11) * 180 / Math.PI; };
          const cover = document.querySelector('.book.is-active .book-front').getBoundingClientRect();
          return {
            leftYaw: yaw(left), rightYaw: yaw(right),
            backWidth: left.querySelector('.book-back').getBoundingClientRect().width,
            spineWidth: left.querySelector('.book-spine').getBoundingClientRect().width,
            frontHidden: getComputedStyle(left.querySelector('.book-front')).visibility === 'hidden',
            ground: getComputedStyle(shelf, '::before').content,
            clearance: shelf.getBoundingClientRect().bottom - cover.bottom,
            height: +document.querySelector('.bookshelf-wrap').style.getPropertyValue('--shelf-fitted-height').replace('px', ''),
            noOverflow: document.documentElement.scrollWidth <= innerWidth,
            shadows: [...shelf.querySelectorAll('.book-front,.book-spine,.book-back')].filter(face => getComputedStyle(face).boxShadow !== 'none').length,
          };
        })()`);
        assert(Math.abs(state.leftYaw - 9) < .01, JSON.stringify(state));
        assert(Math.abs(state.rightYaw) < .1);
        assert(state.frontHidden);
        assert(state.ground === 'none' && state.shadows === 1, JSON.stringify(state));
        assert(state.clearance > state.height * .05 && state.noOverflow, JSON.stringify(state));
      }
      console.log(`PASS ${width}px ${reduced ? 'reduced' : 'normal'}: left 9deg/right 0deg, wrap, single shadow, clearance, no overflow`);
    }
    let previousWidth = Infinity;
    // Isolate shared perspective from the intentional left-side override.
    await evaluate(`document.documentElement.style.setProperty('--book-left-yaw', '0deg')`);
    for (const perspective of ['1500px', '3000px', '6000px', 'none']) {
      await evaluate(`document.documentElement.style.setProperty('--shelf-perspective', '${perspective}')`);
      await pause(100);
      const projection = await evaluate(`(() => {
        const books = [...document.querySelectorAll('.book')];
        const shelf = document.querySelector('.bookshelf');
        const p = parseFloat(getComputedStyle(shelf).perspective);
        return [1, 2, 3].map(offset => {
          const book = side => books.find(book => +book.style.getPropertyValue('--offset') === side * offset);
          const left = new DOMMatrix(getComputedStyle(book(-1)).transform);
          const right = new DOMMatrix(getComputedStyle(book(1)).transform);
          const yaw = Math.atan2(left.m31, left.m11) * 180 / Math.PI;
          return {
            leftAngle: yaw + (p > 0 ? Math.atan2(left.m41, p) * 180 / Math.PI : 0),
            rightAngle: p > 0 ? Math.atan2(right.m41, p) * 180 / Math.PI : 0,
            left: book(-1).querySelector('.book-front').getBoundingClientRect().width,
            right: book(1).querySelector('.book-back').getBoundingClientRect().width,
          };
        });
      })()`);
      for (const pair of projection) {
        assert(Math.abs(pair.leftAngle + pair.rightAngle) < .01, JSON.stringify(pair));
        assert(Math.abs(pair.left - pair.right) < .1, JSON.stringify(pair));
        if (perspective !== 'none') assert(pair.left > 0 && pair.right > 0);
        else assert(pair.left < .01 && pair.right < .01);
      }
      assert(projection[0].left < previousWidth, `Perspective ${perspective}: ${JSON.stringify(projection)}`);
      previousWidth = projection[0].left;
    }
    await evaluate(`document.documentElement.style.removeProperty('--shelf-perspective')`);
    for (const angle of [0, 9, 16]) {
      await evaluate(`document.documentElement.style.setProperty('--book-left-yaw', '${angle}deg')`);
      await pause(100);
      const yaw = await evaluate(`(() => {
        const left = [...document.querySelectorAll('.book')].find(book => +book.style.getPropertyValue('--offset') === -1);
        const m = new DOMMatrix(getComputedStyle(left).transform);
        return Math.atan2(m.m31, m.m11) * 180 / Math.PI;
      })()`);
      assert(Math.abs(yaw - angle) < .01);
    }
    await evaluate(`document.documentElement.style.removeProperty('--book-left-yaw')`);
    await pause(100);
    console.log(`PASS ${width}px: symmetric projection at offsets 1/2/3, live perspective edits, no projection without perspective`);
    const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    await writeFile(new URL(`./shelf-after-${width}.png`, import.meta.url), Buffer.from(shot.result.data, 'base64'));
  }
  await send('Emulation.setEmulatedMedia', { features: [] });
  await send('Page.navigate', { url: `http://127.0.0.1:${port}/bang-gia/` });
  await pause(800);
  assert(await evaluate(`!!document.querySelector('h1') && !document.querySelector('.not-found')`));
  assert.equal(errors.length, 0, errors.join('\n'));
  console.log('PASS pricing direct load and no runtime exceptions');
} finally {
  ws.close();
  clearTimeout(watchdog);
}