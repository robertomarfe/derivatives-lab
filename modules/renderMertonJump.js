import { CONTENT } from '../content.js';
import * as F from '../core/finance-v111.js';
import { linspace, mean } from '../core/special.js';
import { lineChart, histogram } from '../core/charts.js';
import { field, table, metric, interpretation, qs, getn, money, num } from '../core/ui.js';
import { runWorker } from '../core/worker-client.js';
import { st, tabbed, controlGrid, chartBox, section, loading, safeUpdate, safeAsync } from './common.js';

export function renderMertonJump(root){
  const m=CONTENT.modules.merton_jump,s=st('merton_jump',{S:100,K:100,r:.03,T:.75,sigma:.18,lam:.8,m:-.08,delta:.22,seed:12345});
  tabbed('merton_jump',root,[['dynamics','Dynamics'],['pricing','Pricing'],['smile','Smile'],['simulation','Simulation']],(t,r)=>{
    const controls=controlGrid(
      field('$S_0$','mj-S',s.S,{min:.000001})+field('$r$','mj-r',s.r,{step:.005})+field('$T$','mj-T',s.T,{step:.25,min:.000001})+
      field('Diffusion $\\sigma$','mj-sig',s.sigma,{step:.01,min:0})+field('Jump intensity $\\lambda$','mj-lam',s.lam,{step:.1,min:0})+
      field('Mean log jump $m$','mj-m',s.m,{step:.02})+field('Log-jump std $\\delta$','mj-d',s.delta,{step:.02,min:0})
    );

    if(t==='dynamics'){
      const sub=m.submodules.dynamics;
      r.innerHTML=section(sub,controls,`<div id="mj-dyn" class="metric-grid"></div><div id="mj-dyn-note"></div>`);
      const update=safeUpdate(r,()=>{
        const lam=getn('mj-lam'),mm=getn('mj-m'),dd=getn('mj-d'),T=getn('mj-T'),S=getn('mj-S'),rr=getn('mj-r'),sig=getn('mj-sig');
        F.mertonCallPrice(S,S,rr,T,sig,lam,mm,dd,'eq35');
        const k=F.jumpCompensator(mm,dd);
        qs('#mj-dyn',r).innerHTML=metric('Jump compensator $k$',num(k,6))+metric('Expected jump count $\\lambda T$',num(lam*T,4))+metric('$E[Y]$',num(1+k,6))+metric('Risk-neutral drift adjustment $-\\lambda k$',num(-lam*k,6));
        qs('#mj-dyn-note',r).innerHTML=interpretation('The compensator keeps the risk-neutral expected return consistent after jumps are introduced. $\\lambda$ governs frequency, while $m$ and $\\delta$ govern the log jump-size distribution.');
      });
      ['mj-S','mj-r','mj-T','mj-sig','mj-lam','mj-m','mj-d'].forEach(id=>r.querySelector(`#${id}`)?.addEventListener('input',update));update();
    }

    else if(t==='pricing'){
      const sub=m.submodules.pricing;
      r.innerHTML=section(sub,`${controls}${field('Strike $K$','mj-K',s.K,{min:.000001})}<button id="mj-price" class="primary full">Price call</button>`,`<div id="mj-price-metrics" class="metric-grid"></div><div id="mj-terms"></div>`);
      qs('#mj-price',r).onclick=safeUpdate(r,()=>{
        s.S=getn('mj-S');s.r=getn('mj-r');s.T=getn('mj-T');s.sigma=getn('mj-sig');s.lam=getn('mj-lam');s.m=getn('mj-m');s.delta=getn('mj-d');s.K=getn('mj-K');
        const a=F.mertonCallPrice(s.S,s.K,s.r,s.T,s.sigma,s.lam,s.m,s.delta,'eq35'),b=F.mertonCallPrice(s.S,s.K,s.r,s.T,s.sigma,s.lam,s.m,s.delta,'eq36'),bs=F.blackScholesPrice(s.S,s.K,s.r,s.sigma,s.T,0,'call');
        qs('#mj-price-metrics',r).innerHTML=metric('Merton call',money(a.callPrice,6))+metric('Equivalent eq. 36',money(b.callPrice,6))+metric('Black-Scholes diffusion only',money(bs,6))+metric('$k$',num(a.jumpCompensatorK,6))+metric('Omitted Poisson mass',num(a.omittedProbabilityMass,3));
        qs('#mj-terms',r).innerHTML=table(['$j$','Poisson weight','$\\sigma_j$','Conditional BS','Contribution'],a.terms.slice(0,12).map(z=>[z.j,num(z.weight,6),num(z.conditionalSigma,5),money(z.conditionalBsPrice,5),money(z.contribution,5)]),'First Poisson-mixture terms');
      });
      qs('#mj-price',r).click();
    }

    else if(t==='smile'){
      const sub=m.submodules.smile;
      r.innerHTML=section(sub,`${controls}<button id="mj-smile-run" class="primary full">Compute smile</button>`,`${chartBox('mj-smile','Merton-implied volatility')}<div id="mj-smile-note"></div>`);
      qs('#mj-smile-run',r).onclick=safeUpdate(r,()=>{
        const S=getn('mj-S'),rr=getn('mj-r'),T=getn('mj-T'),sig=getn('mj-sig'),lam=getn('mj-lam'),mm=getn('mj-m'),dd=getn('mj-d'),K=linspace(.7*S,1.3*S,25),iv=K.map(k=>{const p=F.mertonCallPrice(S,k,rr,T,sig,lam,mm,dd,'eq35').callPrice;return 100*F.impliedVolatility(p,S,k,rr,T,0,'call').sigma;});
        lineChart(qs('#mj-smile',r),[{name:'Merton implied volatility',x:K,y:iv},{name:'Black-Scholes diffusion σ',x:K,y:K.map(()=>100*sig)}],{xLabel:'Strike K',yLabel:'Implied volatility (%)'});
        qs('#mj-smile-note',r).innerHTML=interpretation('$\\lambda=0$ removes the jump component and collapses the Merton price to the Black-Scholes diffusion benchmark. For positive jump intensity, the smile is obtained by pricing under Merton and then inverting Black-Scholes strike by strike.');
      });
      qs('#mj-smile-run',r).click();
    }

    else {
      const sub=m.submodules.simulation;
      r.innerHTML=section(sub,`${controls}${controlGrid(field('Paths','mj-np',1000,{step:100,min:100,max:5000,inputmode:'numeric'})+field('Steps','mj-ns',120,{step:10,min:20,max:252,inputmode:'numeric'})+field('Seed','mj-seed',s.seed,{step:1,inputmode:'numeric'}))}<button id="mj-sim" class="primary full">Simulate jump diffusion</button>`,`${chartBox('mj-paths','Stock paths')}${chartBox('mj-ret','Terminal log-return distribution')}<div id="mj-sim-metrics" class="metric-grid"></div><div id="mj-sim-note"></div>`);
      qs('#mj-sim',r).onclick=safeAsync(r,async()=>{
        const b=qs('#mj-sim',r);loading(b,true);
        try{
          const args=[getn('mj-S'),getn('mj-r'),getn('mj-T'),getn('mj-sig'),getn('mj-lam'),getn('mj-m'),getn('mj-d'),Math.round(getn('mj-np')),Math.round(getn('mj-ns')),Math.round(getn('mj-seed'))],x=await runWorker('mertonSim',args),n=Math.min(15,x.stockPaths.length),S0=args[0],rets=x.stockPaths.map(p=>Math.log(p.at(-1)/S0)),jumps=x.jumpCounts.map(p=>p.at(-1));
          lineChart(qs('#mj-paths',r),x.stockPaths.slice(0,n).map((y,i)=>({name:i===0?'S_t':'',x:x.times,y})),{xLabel:'Time',yLabel:'S_t'});histogram(qs('#mj-ret',r),rets,40,{xLabel:'log(S_T/S_0)'});
          qs('#mj-sim-metrics',r).innerHTML=metric('Mean realized jumps',num(mean(jumps),4))+metric('Theoretical $\\lambda T$',num(args[4]*args[2],4))+metric('Paths',x.stockPaths.length.toLocaleString());
          qs('#mj-sim-note',r).innerHTML=interpretation('For simulation, the lab uses the course specification $\\log Y\\sim N(m,\\delta^2)$ directly: conditional on $n$ jumps in a time step, the sum of log jumps is Normal with mean $nm$ and variance $n\\delta^2$. This makes explicit the notation behind the simulation rather than silently imposing an alternative jump convention.');
        } finally {loading(b,false);}
      });
    }
  });
}
