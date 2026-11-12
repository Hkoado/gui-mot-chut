import fs from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
const stage=process.env.PERF_STAGE??'baseline';
const root='d:/gui-mot-chut/perf-artifacts';
const t=await(await fetch('http://127.0.0.1:9223/json/new?about:blank',{method:'PUT'})).json();const ws=new WebSocket(t.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let id=0;const pending=new Map();let layers=[];const errors=[];ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id)}if(m.method==='LayerTree.layerTreeDidChange')layers=m.params.layers??[];if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails)});const send=(method,params={})=>new Promise(r=>{pending.set(++id,r);ws.send(JSON.stringify({id,method,params}))});const ev=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.error||r.result.exceptionDetails)throw Error(JSON.stringify(r));return r.result.result.value};const wait=ms=>new Promise(r=>setTimeout(r,ms));await send('Runtime.enable');await send('Page.enable');await send('Network.enable');await send('LayerTree.enable');

const assert=(ok,msg)=>{if(!ok)throw Error(msg);console.log('PASS',msg)};
await send('Emulation.setCPUThrottlingRate',{rate:1});
await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
await send('Page.addScriptToEvaluateOnNewDocument',{source:`window.shelfFrames=0;const raf=window.requestAnimationFrame;window.requestAnimationFrame=cb=>raf.call(window,time=>{if(cb.name==='tick')window.shelfFrames++;cb(time)});Object.defineProperty(navigator,'hardwareConcurrency',{get:()=>2,configurable:true});`});
for(const mode of ['full','lite','auto']){
await send('Page.navigate',{url:'http://127.0.0.1:3016/'+(mode==='auto'?'':'?perf='+mode)});await wait(3000);await ev('document.fonts.ready');
assert(await ev(`document.documentElement.dataset.perf==='${mode==='auto'?'lite':mode}'`),mode+' override/device detection');
assert(await ev(`getComputedStyle(document.querySelector('.bookshelf')).perspective==='3000px'&&getComputedStyle(document.querySelector('.bookshelf-stage')).transformStyle==='preserve-3d'`),mode+' 3D perspective/stage');
const f=await ev('window.shelfFrames');await wait(600);assert(await ev('window.shelfFrames')===f,mode+' shelf rAF rests when stable');
await ev(`document.querySelector('.shelf-primary').focus();document.querySelector('.shelf-primary').click()`);for(let i=0;i<80;i++){if(await ev(`!!document.querySelector('.album-dialog[open]')`))break;await wait(50)}
assert(await ev(`document.querySelector('.album-dialog[open]')?.contains(document.activeElement)`),mode+' dialog focus');
assert(await ev(`getComputedStyle(document.querySelector('.detail-cover')).backgroundColor==='rgb(255, 241, 184)'`),mode+' original album palette');
await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await wait(1500);
assert(await ev(`!document.querySelector('dialog')&&document.activeElement.matches('.book.is-active')&&document.body.style.overflow!=='hidden'`),mode+' Escape/focus/scroll');
}
await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await send('Page.navigate',{url:'http://127.0.0.1:3016/?perf=lite'});await wait(1500);assert(await ev(`getComputedStyle(document.documentElement).getPropertyValue('--duration-sheet-open').trim()==='1ms'`),'reduced motion overrides lite');await ev(`document.querySelector('.shelf-controls button:last-child').click()`);await wait(100);assert(await ev(`document.querySelector('.shelf-controls span').textContent==='02 / 11'`),'reduced navigation');await send('Page.navigate',{url:'http://127.0.0.1:3016/bang-gia/'});await wait(1200);console.log('Pricing title',await ev('document.title'));assert(await ev(`!!document.querySelector('main') && location.pathname==='/bang-gia/' && !document.title.includes('404')`),'pricing direct load');assert(errors.length===0,'no runtime errors');ws.close();await fetch(`http://127.0.0.1:9223/json/close/${t.id}`);
