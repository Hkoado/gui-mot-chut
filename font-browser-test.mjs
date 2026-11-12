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
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const request = ++id;
  pending.set(request, data => data.error ? reject(new Error(JSON.stringify(data.error))) : resolve(data.result));
  ws.send(JSON.stringify({ id: request, method, params }));
});
const evaluate = async expression => {
  const response = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  assert(!response.exceptionDetails, JSON.stringify(response.exceptionDetails));
  return response.result.value;
};
const watchdog = setTimeout(() => process.exit(1), 60000);
try {
  await send('Page.enable');
  await send('DOM.enable');
  await send('CSS.enable');
  await send('Network.enable');
  await send('Network.setCacheDisabled', { cacheDisabled: true });
  for (const width of [1440, 390]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: width < 768 });
    for (const route of ['/', '/bang-gia/']) {
      await send('Page.navigate', { url: `http://127.0.0.1:${port}${route}` });
      await new Promise(resolve => setTimeout(resolve, 1400));
      const faces = await evaluate(`(async () => {
        await Promise.all([...document.fonts].map(face => face.load()));
        await document.fonts.ready;
        return [...document.fonts].map(face => ({ family: face.family, status: face.status }));
      })()`);
      assert.equal(faces.length, 2);
      assert.deepEqual(faces.map(face => face.family.replaceAll('"', '')).sort(), ['Hina Mincho', 'Ribel Noise']);
      assert(faces.every(face => face.status === 'loaded'), JSON.stringify(faces));
      const { root } = await send('DOM.getDocument');
      for (const [selector, expected] of [['.brand-wordmark', 'Ribel'], ['h1', 'Hina']]) {
        const { nodeId } = await send('DOM.querySelector', { nodeId: root.nodeId, selector });
        assert(nodeId, `Missing ${selector}`);
        const { fonts } = await send('CSS.getPlatformFontsForNode', { nodeId });
        assert(fonts.some(font => font.isCustomFont && `${font.familyName} ${font.postScriptName}`.includes(expected) && font.glyphCount > 0), JSON.stringify(fonts));
        console.log(`PASS ${width}px ${route} ${selector}: rendered with ${fonts.map(font => font.familyName).join(', ')}`);
      }
      assert(await evaluate('document.documentElement.scrollWidth <= innerWidth'));
      if (route === '/') {
        const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
        await writeFile(new URL(`./font-restored-${width}.png`, import.meta.url), Buffer.from(shot.data, 'base64'));
      }
      console.log(`PASS ${width}px ${route}: only the 2 active font faces loaded without cache; no page overflow`);
    }
  }
} finally {
  ws.close();
  clearTimeout(watchdog);
  await fetch(`http://127.0.0.1:${browserPort}/json/close/${target.id}`);
}