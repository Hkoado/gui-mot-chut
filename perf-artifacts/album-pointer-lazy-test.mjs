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
const click = async (x,y,jitter=0) => {
 await send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y});await pause(200);
 await send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1});
 if(jitter) await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:x+jitter,y:y+1,button:'left',buttons:1});
 await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:x+jitter,y:y+(jitter?1:0),button:'left',clickCount:1});for(let i=0;i<100;i++){if(await evaluate("!!document.querySelector('.detail[open]')"))break;await pause(50);}
};
const point = async (fx=.5,fy=.5) => evaluate(`(()=>{const r=document.querySelector('.book.is-active .book-front').getBoundingClientRect();return {x:r.left+r.width*${fx},y:r.top+r.height*${fy}}})()`);
const escape = async () => {await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});for(let i=0;i<100;i++){if(await evaluate("!document.querySelector('.detail[open]')"))break;await pause(50);}};
for (const [width,height] of [[1366,768],[390,844]]) {
 await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<768});
 await send('Page.navigate',{url:`http://127.0.0.1:${targetPort}/`});await pause(1000);
 for(const [fx,fy] of [[.5,.5],[.2,.2],[.8,.2],[.2,.8],[.8,.8]]) {
  const p=await point(fx,fy);await click(p.x,p.y);
  assert(await evaluate(`!!document.querySelector('.detail[open]')`),`Physical mouse opens cover at ${fx}/${fy} on ${width}`);
  await escape();assert(await evaluate(`!document.querySelector('dialog') && document.body.style.overflow!=='hidden'`),'Close restores interaction');
 }
 const p=await point();await click(p.x,p.y,5);
 assert(await evaluate(`!!document.querySelector('.detail[open]')`),'Small pointer jitter remains a click');await escape();
  // Drag exactly one responsive shelf step, rather than 90px (multiple books on mobile).
  const distance=await evaluate(`(()=>{const s=document.querySelector('.bookshelf');const c=getComputedStyle(s);return parseFloat(document.querySelector('.bookshelf-wrap').style.getPropertyValue('--shelf-fitted-height'))*(parseFloat(c.getPropertyValue('--book-spine-ratio'))+parseFloat(c.getPropertyValue('--book-gap-ratio')))})()`);
  const start=await point();await send('Input.dispatchMouseEvent',{type:'mousePressed',x:start.x,y:start.y,button:'left',clickCount:1});
  await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:start.x-distance,y:start.y,button:'left',buttons:1});
  await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:start.x-distance,y:start.y,button:'left',clickCount:1});await pause(750);
 assert(await evaluate(`!document.querySelector('dialog') && document.querySelector('.shelf-controls span').textContent==='02 / 11'`),'Dragging actual cover selects without opening');
 // Activate the newly selected book with a real Enter after a suppressed drag click.
 await evaluate(`document.querySelector('.book.is-active').focus({preventScroll:true})`);
 await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});await pause(100);
 assert(await evaluate(`!!document.querySelector('.detail[open]')`),'Keyboard opens immediately after drag');await escape();
 const after=await point(.2,.8);await click(after.x,after.y);
 assert(await evaluate(`!!document.querySelector('.detail[open]')`),'First physical click after drag/close opens');await escape();
 // Send actual touch events (not DOM .click()) at a previously missed corner.
 await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
 const touch=await point(.8,.2);
 await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:touch.x,y:touch.y}]});
 await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await pause(150);
 assert(await evaluate(`!!document.querySelector('.detail[open]')`),'Physical touch opens cover corner');await escape();
 await send('Emulation.setTouchEmulationEnabled',{enabled:false});
 // Switch with a real mouse click on a neighbouring spine, then open its cover.
 const spine=await evaluate(`(()=>{const b=document.querySelector('.book.is-active');const offset=+b.style.getPropertyValue('--offset');const candidates=[...document.querySelectorAll('.book:not([aria-hidden="true"])')];const next=candidates.find(b=>+b.style.getPropertyValue('--offset')===1);const r=next.querySelector('.book-spine').getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2,id:next.dataset.topicId}})()`);
 await click(spine.x,spine.y);await pause(750);
 assert(await evaluate(`document.querySelector('.book.is-active').dataset.topicId===${JSON.stringify(spine.id)} && !document.querySelector('dialog')`),'Actual neighbouring spine selects correct album');
 const nextCover=await point(.8,.8);await click(nextCover.x,nextCover.y);
 assert(await evaluate(`!!document.querySelector('.detail[open]')`),'Selected spine then cover opens on first click');await escape();
 for(let i=0;i<3;i++) {
  const next=await evaluate(`(()=>{const r=document.querySelector('.shelf-controls button:last-child').getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}})()`);
  await click(next.x,next.y);await pause(700);
  const cover=await point(i%2?.2:.8,.5);await click(cover.x,cover.y);
  assert(await evaluate(`!!document.querySelector('.detail[open]')`),`First click after arrow navigation ${i+1} on ${width}`);await escape();
 }
}
assert(errors.length===0,`No runtime errors: ${errors.join(', ')}`);
ws.close();clearTimeout(watchdog);
