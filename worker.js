import { simulateGbmPaths, monteCarloEuropeanPrice, simulateHedging, simulateHestonPaths, simulateMertonPaths } from './core/finance.js';
self.onmessage = (ev) => {
  const {id,type,args} = ev.data;
  try {
    let result;
    if(type==='gbm') result=simulateGbmPaths(...args);
    else if(type==='mc') result=monteCarloEuropeanPrice(...args);
    else if(type==='hedging') result=simulateHedging(...args);
    else if(type==='hestonSim') result=simulateHestonPaths(...args);
    else if(type==='mertonSim') result=simulateMertonPaths(...args);
    else throw new Error(`Unknown worker task: ${type}`);
    self.postMessage({id,result});
  } catch(err) { self.postMessage({id,error:String(err?.message||err)}); }
};
