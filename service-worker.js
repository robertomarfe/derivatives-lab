const CACHE='derivatives-lab-v1.1.1';
const ASSETS=["./","./index.html","./styles.css","./styles-v111.css","./app.js","./bootstrap-v111.js","./content-v111-patch.js","./content.js","./worker.js","./manifest.webmanifest","./assets/icon-192.png","./assets/icon-512.png","./assets/icon.svg","./core/charts.js","./core/charts-v111.js","./core/complex.js","./core/finance.js","./core/finance-v111.js","./core/math.js","./core/random.js","./core/special.js","./core/ui.js","./core/validation.js","./core/worker-client.js","./modules/common.js","./modules/renderBinomial.js","./modules/renderBlackScholes.js","./modules/renderForward.js","./modules/renderFutures.js","./modules/renderHedging.js","./modules/renderHeston.js","./modules/renderImplied.js","./modules/renderMertonCredit.js","./modules/renderMertonJump.js","./modules/renderStrategies.js","./modules/renderers.js","./vendor/katex/katex.css","./vendor/katex/katex.mjs"];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  if(event.request.mode==='navigate'){
    event.respondWith(fetch(event.request).then(response=>{
      const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));return response;
    }).catch(()=>caches.match('./index.html')));
    return;
  }
  event.respondWith(caches.match(event.request).then(hit=>hit||fetch(event.request).then(response=>{
    if(response&&response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}
    return response;
  })));
});
