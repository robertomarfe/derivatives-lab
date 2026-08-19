import { CONTENT } from '../content.js';
import * as F from '../core/finance.js';
import { linspace, mean } from '../core/special.js';
import { lineChart, histogram } from '../core/charts.js';
import { field, selectField, metric, interpretation, qs, getn, getv, num, money } from '../core/ui.js';
import { runWorker } from '../core/worker-client.js';
import { st, tabbed, controlGrid, chartBox, section, loading, safeUpdate, safeAsync } from './common.js';

export function renderBlackScholes(root){
  const m=CONTENT.modules.black_scholes,s=st('black_scholes',{S:41,K:40,r:.08,sigma:.30,T:1,delta:0,type:'call',mu:.10,nPaths:1500,nSteps:80,seed:12345});
  tabbed('black_scholes',root,[['greeks','Price & Greeks'],['gbm','GBM paths'],['mc','Monte Carlo']],(t,r)=>{
    if(t==='greeks'){
      const sub=m.submodules.greeks;
      r.innerHTML=section(sub,controlGrid(
        field('$S$','bs-S',s.S,{min:.000001})+field('$K$','bs-K',s.K,{min:.000001})+field('$r$','bs-r',s.r,{step:.005})+
        field('$\\sigma$','bs-sig',s.sigma,{step:.01,min:.000001})+field('$T$','bs-T',s.T,{step:.25,min:.000001})+field('$\\delta$','bs-d',s.delta,{step:.005})+
        selectField('Option','bs-type',['call','put'],s.type)
      ),`<div id="bs-metrics" class="metric-grid"></div>${chartBox('bs-chart','Option value before expiration versus payoff at T')}`);
      const update=safeUpdate(r,()=>{
        s.S=getn('bs-S');s.K=getn('bs-K');s.r=getn('bs-r');s.sigma=getn('bs-sig');s.T=getn('bs-T');s.delta=getn('bs-d');s.type=getv('bs-type');
        const g=F.blackScholesGreeks(s.S,s.K,s.r,s.sigma,s.T,s.delta,s.type);
        qs('#bs-metrics',r).innerHTML=metric('Price',money(g.price,6))+metric('Delta',num(g.delta,5))+metric('Gamma',num(g.gamma,5))+metric('Elasticity',num(g.elasticity,5))+metric('Vega / 1 pp',num(g.vegaPer1Pct,5))+metric('Theta / day',num(g.thetaPerDay,5))+metric('Rho / 1 pp',num(g.rhoPer1Pct,5))+metric('Psi / 1 pp',num(g.psiPer1Pct,5));
        const lo=Math.max(.000001,Math.min(s.S,s.K)*.45),hi=Math.max(s.S,s.K)*1.65,x=linspace(lo,hi,180),v=x.map(S=>F.blackScholesPrice(S,s.K,s.r,s.sigma,s.T,s.delta,s.type)),p=x.map(S=>s.type==='call'?F.callPayoff(S,s.K):F.putPayoff(S,s.K));
        lineChart(qs('#bs-chart',r),[{name:'Black-Scholes value',x,y:v},{name:'Payoff at T',x,y:p}],{xLabel:'Stock price',yLabel:'Option value'});
      });
      ['bs-S','bs-K','bs-r','bs-sig','bs-T','bs-d','bs-type'].forEach(id=>r.querySelector(`#${id}`)?.addEventListener('input',update));update();
    }

    else if(t==='gbm'){
      const sub=m.submodules.gbm;
      r.innerHTML=section(sub,controlGrid(
        field('$S_0$','gb-S',s.S,{min:.000001})+field('$\\mu$ (physical drift)','gb-mu',s.mu,{step:.01})+field('$r$','gb-r',s.r,{step:.005})+
        field('$\\delta$','gb-d',s.delta,{step:.005})+field('$\\sigma$','gb-sig',s.sigma,{step:.01,min:0})+field('$T$','gb-T',s.T,{step:.25,min:.000001})+
        field('Paths','gb-np',s.nPaths,{step:100,min:100,max:5000,inputmode:'numeric'})+field('Steps','gb-ns',s.nSteps,{step:10,min:10,max:252,inputmode:'numeric'})+
        field('Seed','gb-seed',s.seed,{step:1,inputmode:'numeric'})+selectField('Measure','gb-measure',['P','Q'],'P')+`<button id="gb-run" class="primary full">Run simulation</button>`
      ),`<div id="gb-metrics" class="metric-grid"></div>${chartBox('gb-chart','Sample stock paths')}${chartBox('gb-hist','Terminal stock-price distribution')}`);
      qs('#gb-run',r).onclick=safeAsync(r,async()=>{
        const b=qs('#gb-run',r);loading(b,true);
        try{
          s.S=getn('gb-S');s.mu=getn('gb-mu');s.r=getn('gb-r');s.delta=getn('gb-d');s.sigma=getn('gb-sig');s.T=getn('gb-T');s.nPaths=Math.round(getn('gb-np'));s.nSteps=Math.round(getn('gb-ns'));s.seed=Math.round(getn('gb-seed'));
          const measure=getv('gb-measure'),drift=measure==='P'?s.mu:s.r-s.delta,res=await runWorker('gbm',[s.S,drift,s.sigma,s.T,s.nPaths,s.nSteps,s.seed]),terms=res.paths.map(x=>x.at(-1));
          qs('#gb-metrics',r).innerHTML=metric('Measure',measure)+metric('Drift used',num(drift,4))+metric('Mean $S_T$',money(mean(terms),3))+metric('Paths simulated',s.nPaths.toLocaleString());
          const sample=res.paths.slice(0,Math.min(20,res.paths.length)).map((p,i)=>({name:i===0?'Path 1':'',x:res.times,y:p}));
          lineChart(qs('#gb-chart',r),sample,{xLabel:'Time',yLabel:'S_t'});histogram(qs('#gb-hist',r),terms,35,{xLabel:'S_T'});
        } finally {loading(b,false);}
      });
    }

    else {
      const sub=m.submodules.mc;
      r.innerHTML=section(sub,controlGrid(
        field('$S_0$','mc-S',s.S,{min:.000001})+field('$K$','mc-K',s.K,{min:.000001})+field('$r$','mc-r',s.r,{step:.005})+field('$\\delta$','mc-d',s.delta,{step:.005})+
        field('$\\sigma$','mc-sig',s.sigma,{step:.01,min:0})+field('$T$','mc-T',s.T,{step:.25,min:.000001})+
        field('Paths','mc-n',Math.max(1000,s.nPaths),{step:1000,min:1000,max:100000,inputmode:'numeric'})+field('Seed','mc-seed',s.seed,{step:1,inputmode:'numeric'})+
        selectField('Option','mc-type',['call','put'],s.type)+`<button id="mc-run" class="primary full">Price by Monte Carlo</button>`
      ),`<div id="mc-metrics" class="metric-grid"></div><div id="mc-note"></div>`);
      qs('#mc-run',r).onclick=safeAsync(r,async()=>{
        const b=qs('#mc-run',r);loading(b,true);
        try{
          const args=[getn('mc-S'),getn('mc-K'),getn('mc-r'),getn('mc-sig'),getn('mc-T'),getn('mc-d'),getv('mc-type'),Math.round(getn('mc-n')),Math.round(getn('mc-seed'))],x=await runWorker('mc',args);
          qs('#mc-metrics',r).innerHTML=metric('Monte Carlo estimate',money(x.estimate,6))+metric('Std. error',money(x.standardError,6))+metric('95% CI',`${money(x.ci95Low,4)} – ${money(x.ci95High,4)}`)+metric('Black-Scholes',money(x.exactBlackScholes,6));
          qs('#mc-note',r).innerHTML=interpretation(`Sampling error is ${money(x.standardError,6)}. Increasing paths changes numerical precision, not the pricing model.`);
        } finally {loading(b,false);}
      });
    }
  });
}
