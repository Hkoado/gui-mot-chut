import assert from 'node:assert/strict';
import { getTopics } from './src/data/topics.ts';
import { poems } from './src/data/poem.ts';

const browser = `http://127.0.0.1:${process.env.BROWSER_PORT ?? '9223'}`;
const site = `http://127.0.0.1:${process.env.TEST_PORT ?? '3016'}`;
const target = await (await fetch(`${browser}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(resolve => ws.addEventListener('open', resolve, { once: true }));
let id = 0;
const pending = new Map(), errors = [];
ws.addEventListener('message', event => {
  const message = JSON.parse(event.data);
  if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
  const request = pending.get(message.id);
  if (request) {
    pending.delete(message.id);
    if (message.error) request.reject(new Error(message.error.message));
    else request.resolve(message.result);
  }
});
const send = (method, params = {}) => new Promise((resolve, reject) => {
  pending.set(++id, { resolve, reject });
  ws.send(JSON.stringify({ id, method, params }));
});
const evaluate = async expression => {
  const response = await send('Runtime.evaluate', { expression, returnByValue: true });
  assert.ok(!response.exceptionDetails, JSON.stringify(response.exceptionDetails));
  return response.result.value;
};
const waitFor = async expression => {
  for (let i = 0; i < 100; i++) {
    if (await evaluate(`Boolean(${expression})`)) return;
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  assert.fail(`Timed out: ${expression}`);
};
const click = async selector => {
  await waitFor(`(() => { const button = document.querySelector(${JSON.stringify(selector)}); if (!button) return false; const r = button.getBoundingClientRect(); return button.contains(document.elementFromPoint(r.x+r.width/2, r.y+r.height/2)); })()`);
  const point = await evaluate(`(() => { const r = document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect(); return { x: r.x+r.width/2, y: r.y+r.height/2 }; })()`);
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...point });
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', button: 'left', clickCount: 1, ...point });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', button: 'left', clickCount: 1, ...point });
  return point;
};

try {
  await send('Runtime.enable');
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  for (const width of [360, 768, 1440, 1920]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height: 820, deviceScaleFactor: 1, mobile: false });
    await send('Page.navigate', { url: `${site}/` });
    await waitFor(`document.querySelector('.main-nav-underline[data-ready="true"]') && document.querySelector('.book.is-active .book-front')`);
    for (const topic of getTopics()) {
      await evaluate(`location.hash = ${JSON.stringify(`album/${topic.id}`)}`);
      await waitFor(`document.querySelector('.album-dialog[open] #album-title')?.textContent === ${JSON.stringify(topic.title)}`);
      await waitFor(`document.querySelector('.album-dialog').getAnimations({ subtree: true }).every(animation => animation.playState === 'finished')`);
      const content = await evaluate(`(() => {
        const dialog = document.querySelector('.album-dialog');
        const poem = dialog.querySelector('.detail-poem');
        const close = dialog.querySelector('button.close-button');
        const r = close.getBoundingClientRect();
        const author = getComputedStyle(poem.querySelector('figcaption'));
        const titleRect = dialog.querySelector('#album-title').getBoundingClientRect();
        const posterRect = dialog.querySelector('.detail-poster').getBoundingClientRect();
        const poemRect = poem.getBoundingClientRect();
        const samplesButton = dialog.querySelector('.detail-samples-toggle');
        const buttonRect = samplesButton.getBoundingClientRect();
        const buttonStyle = getComputedStyle(samplesButton);
        const centerX = rect => (rect.left + rect.right) / 2;
        const centerY = rect => (rect.top + rect.bottom) / 2;
        return {
          text: poem.querySelector('blockquote').textContent,
          author: poem.querySelector('figcaption').textContent,
          noSamples: !dialog.querySelector('.detail-samples, .topic-templates') && samplesButton.getAttribute('aria-disabled') === 'true',
          eyeStyle: samplesButton.textContent.trim() === 'Xem các mẫu' && !!samplesButton.querySelector('svg[aria-hidden="true"] circle') && buttonStyle.borderTopWidth === '0px' && buttonStyle.backgroundColor === 'rgba(0, 0, 0, 0)' && buttonStyle.textDecorationLine === 'none' && getComputedStyle(samplesButton.querySelector('span')).textDecorationLine === 'none',
          titleSize: parseFloat(getComputedStyle(dialog.querySelector('#album-title')).fontSize),
          centered: Math.abs((poemRect.top + poemRect.bottom) / 2 - innerHeight / 2) < 2 && [poemRect, buttonRect].every(rect => Math.abs(centerX(rect) - centerX(titleRect)) < 2),
          balanced: matchMedia('(min-width: 768px)').matches
            ? Math.abs(centerX(titleRect) + centerX(posterRect) - dialog.clientWidth) < 2 && Math.abs(centerY(poemRect) - centerY(posterRect)) < 2
            : Math.abs(centerX(titleRect) - centerX(posterRect)) < 2 && posterRect.top > buttonRect.bottom,
          spacing: poemRect.top - titleRect.bottom >= 23.5 && buttonRect.top - poemRect.bottom >= 23.5,
          buttonSize: Math.abs(parseFloat(buttonStyle.fontSize) - 18.2) < .1 && Math.abs(parseFloat(buttonStyle.minHeight) - 57.2) < .1 && buttonRect.height >= 57.1,
          minimalist: !dialog.querySelector('.eyebrow, .detail-brand, .detail-meta, .detail-credit, .detail-description'),
          style: parseFloat(author.fontSize) < parseFloat(getComputedStyle(poem.querySelector('blockquote')).fontSize) && author.textAlign === 'end' && getComputedStyle(poem.querySelector('blockquote')).whiteSpace === 'pre-line',
          close: document.activeElement === close && close.textContent === '' && close.getAttribute('aria-label') === 'Đóng album' && r.width >= 44 && r.height >= 44 && r.right <= innerWidth,
          fits: dialog.scrollWidth <= dialog.clientWidth,
        };
      })()`);
      const { titleSize, ...rest } = content;
      const clamp = (low, value, high) => Math.max(low, Math.min(value, high));
      assert.ok(Math.abs(titleSize - (topic.albumTitleSize === 'compact' ? clamp(32, width * .042, 64) : clamp(44, width * .054, 84))) < .1);
      assert.deepEqual(rest, { ...poems[topic.id], noSamples: true, eyeStyle: true, centered: true, balanced: true, spacing: true, buttonSize: true, minimalist: true, style: true, close: true, fits: true }, `${width}px ${topic.id}`);
      await click('.detail-samples-toggle');
      assert.ok(await evaluate(`document.querySelectorAll('dialog[open]').length === 1 && !document.querySelector('.detail-samples, .topic-templates') && document.querySelector('.album-dialog').scrollTop === 0`));
      await click('.album-dialog .close-button');
      await waitFor(`!document.querySelector('.album-dialog[open]') && document.body.style.overflow !== 'hidden'`);
    }
    console.log(`PASS 11 albums at ${width}px: balanced layout, content, close hit targets, no overflow`);
  }
  await evaluate(`document.querySelector('.shelf-primary').click()`);
  await waitFor(`document.querySelector('.album-dialog[open]')`);
  await waitFor(`document.querySelector('.album-dialog').getAnimations().every(animation => animation.playState === 'finished')`);
  const glow = await evaluate(`(() => {
    const button = document.querySelector('.album-dialog .close-button');
    button.blur();
    const r = button.getBoundingClientRect();
    return { x: r.x+r.width/2, y: r.y+r.height/2, fine: matchMedia('(hover:hover) and (pointer:fine)').matches };
  })()`);
  assert.ok(glow.fine, 'Desktop has a fine pointer');
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: glow.x, y: glow.y });
  await waitFor(`getComputedStyle(document.querySelector('.album-dialog .close-button'), '::before').opacity === '1'`);
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await waitFor(`!document.querySelector('.album-dialog[open]') && document.activeElement.matches('.book.is-active')`);
  console.log('PASS close hover glow and Escape restores focus');

  await evaluate(`location.hash = 'album/birthday'`);
  await waitFor(`document.querySelector('.album-dialog[open] .detail-samples-toggle')`);
  await waitFor(`document.querySelector('.album-dialog').getAnimations({ subtree: true }).every(animation => animation.playState === 'finished')`);
  const samplesGlow = `getComputedStyle(document.querySelector('.detail-samples-toggle'), '::before')`;
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 0, y: 0 });
  await waitFor(`${samplesGlow}.opacity === '0'`);
  const buttonPoint = await evaluate(`(() => { const r = document.querySelector('.detail-samples-toggle').getBoundingClientRect(); return { x: (r.left+r.right)/2, y: (r.top+r.bottom)/2 }; })()`);
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...buttonPoint });
  await waitFor(`${samplesGlow}.opacity === '1' && ${samplesGlow}.backgroundImage === getComputedStyle(document.querySelector('.shelf-primary'), '::before').backgroundImage`);
  console.log('PASS samples eye uses the same hover glow as the shelf');
  await click('.album-dialog .close-button');
  await waitFor(`!document.querySelector('.album-dialog[open]')`);
  await click('.trao-search__toggle');
  await waitFor(`document.querySelector('.trao-search__dialog[open] .close-button[aria-label="Đóng tìm kiếm"]') && document.activeElement.matches('#trao-search-input')`);
  await click('.trao-search__dialog .close-button');
  await waitFor(`!document.querySelector('.trao-search__dialog[open]') && document.activeElement.matches('.trao-search__toggle')`);
  console.log('PASS search close button restores focus');
  assert.deepEqual(errors, []);
} finally {
  await (await fetch(`${browser}/json/close/${target.id}`)).text();
}