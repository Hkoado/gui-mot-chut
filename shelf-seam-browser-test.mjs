import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';

const port = process.env.TEST_PORT ?? '3016';
const browserPort = process.env.BROWSER_PORT ?? '9223';
const target = await (await fetch(`http://127.0.0.1:${browserPort}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }));
let id = 0;
const pending = new Map();
ws.addEventListener('message', event => {
  const data = JSON.parse(event.data);
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
const watchdog = setTimeout(() => process.exit(1), 60000);
try {
  await send('Page.enable');
  for (const width of [1440, 768, 390, 360]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: width < 768 });
    await send('Page.navigate', { url: `http://127.0.0.1:${port}/` });
    await new Promise(resolve => setTimeout(resolve, 1400));
    const result = await evaluate(`(() => {
      const books = [...document.querySelectorAll('.book')];
      const failures = books.filter(book => {
        const paper = getComputedStyle(book.querySelector('.book-front')).backgroundColor;
        return ['.book-spine', '.book-front', '.book-back'].some(selector => {
          const face = getComputedStyle(book.querySelector(selector));
          return ['Top', 'Right', 'Bottom', 'Left'].some(side => face['border' + side + 'Color'] !== paper);
        });
      }).map(book => book.dataset.topicId);
      return { failures, topics: new Set(books.map(book => book.dataset.topicId)).size,
        noOverflow: document.documentElement.scrollWidth <= innerWidth };
    })()`);
    assert.equal(result.topics, 11);
    assert.deepEqual(result.failures, []);
    assert(result.noOverflow);
    const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
    await writeFile(new URL(`./shelf-seam-${width}.png`, import.meta.url), Buffer.from(shot.result.data, 'base64'));
    console.log(`PASS ${width}px: all 11 topics and loop copies have stock-colored joins; no overflow`);
  }
} finally {
  ws.close();
  clearTimeout(watchdog);
  await fetch(`http://127.0.0.1:${browserPort}/json/close/${target.id}`);
}