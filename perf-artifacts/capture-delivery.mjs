import fs from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
const stage='delivery';
const root='d:/gui-mot-chut/perf-artifacts';
const t=await(await fetch('http://127.0.0.1:9223/json/new?about:blank',{method:'PUT'})).json();const ws=new WebSocket(t.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));let id=0;const pending=new Map();let layers=[];const errors=[];ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id)}if(m.method==='LayerTree.layerTreeDidChange')layers=m.params.layers??[];if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails)});const send=(method,params={})=>new Promise(r=>{pending.set(++id,r);ws.send(JSON.stringify({id,method,params}))});const ev=async expression=>{const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.error||r.result.exceptionDetails)throw Error(JSON.stringify(r));return r.result.result.value};const wait=ms=>new Promise(r=>setTimeout(r,ms));await send('Runtime.enable');await send('Page.enable');await send('Network.enable');await send('LayerTree.enable');
const results=[];
for(const mode of (stage==='baseline'?['full']:['full','lite'])){
await send('Emulation.setCPUThrottlingRate',{rate:1});await send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});
for(const width of [1440,1024,390]){
await send('Emulation.setDeviceMetricsOverride',{width,height:width===390?844:1000,deviceScaleFactor:1,mobile:width===390});await send('Page.navigate',{url:`http://127.0.0.1:3016/?perf=${mode}`});await wait(1500);await ev('document.fonts.ready');await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:0,y:0});await wait(1300);const snap=async suffix=>{const s=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await fs.writeFile(`${root}/${stage}-${mode}-${width}${suffix}.png`,Buffer.from(s.result.data,'base64'))};await snap('');await ev(`document.querySelector('.shelf-controls button:last-child').click()`);await wait(100);await snap('-motion');console.log('Screenshot',stage,mode,width);
}
}
await fs.writeFile(`${root}/${stage}-metrics.json`,JSON.stringify({results,errors},null,2));ws.close();await fetch(`http://127.0.0.1:9223/json/close/${t.id}`);
