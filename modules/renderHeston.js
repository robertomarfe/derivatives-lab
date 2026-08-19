import { CONTENT } from '../content.js';
import * as F from '../core/finance-v111.js';
import { linspace, mean } from '../core/special.js';
import { lineChart } from '../core/charts.js';
import { field, metric, interpretation, qs, getn, num, money, pct } from '../core/ui.js';
import { runWorker } from '../core/worker-client.js';
import { st, tabbed, controlGrid, chartBox, section, loading, safeUpdate, safeAsync } from './common.js';

export function renderHeston(root){
  const m=CONTENT.modules.heston,s=st('heston',{S:100,K:100,r:.03,T:1,nu0:.04,k:2,theta:.04,sigma:.3,rho:-.7,seed:12345});
  tabbed('heston',root,[['dynamics','Dynamics'],['pricing','Pricing'],['simulation','Simulation']],(t,r)=>{
    const controls=controlGrid(
      field('$S_0$','he-S',s.S,{min:.000001})+field('$r$','he-r',s.r,{step:.005})+field('$\\nu_0$','he-nu',s.nu0,{step:.005,min:.000001})+
      field('$k$','he-k',s.k,{step:.1,min:.000001})+field('$\\theta$','he-theta',s.theta,{step:.005,min:.000001})+
      field('$\\sigma$ (volatility of the volatility)','he-sig',s.sigma,{step:.02,min:.000001})+field('$\\rho$','he-rho',s.rho,{step:.1,min:-1,max:1})+
      field('$T$','he-T',s.T,{step:.25,min:.000001})
    );

    if(t==='dynamics'){
      const sub=m.submodules.dynamics;
      r.innerHTML=section(sub,controls,`<div id="he-dyn-metrics" class="metric-grid"></div><div id="he-dyn-note"></div>`);
      const update=safeUpdate(r,()=>{
        const k=getn('he-k'),th=getn('he-theta'),sig=getn('he-sig'),rho=getn('he-rho');
        F.hestonCharacteristic(0.25,getn('he-S'),getn('he-r'),getn('he-T'),getn('he-nu'),k,th,sig,rho);
        const fm=F.fellerMargin(k,th,sig);
        qs('#he-dyn-metrics',r).innerHTML=metric('Long-run variance $\\theta$',num(th,5))+metric('Long-run volatility $\\sqrt{\\theta}$',pct(Math.sqrt(th),2))+metric('Feller margin $2k\\theta-\\sigma^2$',num(fm,6))+metric('Condition',fm>0?'Satisfied':'Not satisfied');
        qs('#he-dyn-note',r).innerHTML=interpretation('The state variable $\\nu_t$ is instantaneous variance. The course parameter $\\sigma$ is the scale of variance shocks, described in the lecture as volatility of the volatility. The Feller condition is shown as the lecture diagnostic; the app does not silently replace it with a different parameter restriction.');
      });
      ['he-S','he-r','he-nu','he-k','he-theta','he-sig','he-rho','he-T'].forEach(id=>r.querySelector(`#${id}`)?.addEventListener('input',update));update();
    }

    else if(t==='pricing'){
      const sub=m.submodules.pricing;
      r.innerHTML=section(sub,`${controls}${field('Strike $K$','he-K',s.K,{min:.000001})}<button id="he-price" class="primary full">Price call</button>`,`<div id="he-price-metrics" class="metric-grid"></div>${chartBox('he-smile','Model-implied volatility by strike')}<div class="small-note">The lecture pricing slides retain a λ inside b₁,b₂ without defining it in the preceding risk-neutral dynamics. Consistently with the validated course implementation, the lab fixes the internal λ_v=0 and does not invent an additional user parameter.</div>`);
      qs('#he-price',r).onclick=safeUpdate(r,()=>{
        const b=qs('#he-price',r);loading(b,true);
        try{
          s.S=getn('he-S');s.r=getn('he-r');s.nu0=getn('he-nu');s.k=getn('he-k');s.theta=getn('he-theta');s.sigma=getn('he-sig');s.rho=getn('he-rho');s.T=getn('he-T');s.K=getn('he-K');
          const p=F.hestonCallPrice(s.S,s.K,s.r,s.T,s.nu0,s.k,s.theta,s.sigma,s.rho);
          qs('#he-price-metrics',r).innerHTML=metric('Call price',money(p.callPrice,6))+metric('$P_1$',num(p.P1,6))+metric('$P_2$',num(p.P2,6))+metric('Feller margin',num(F.fellerMargin(s.k,s.theta,s.sigma),5));
          const lo=Math.max(.000001,s.K*.7),hi=s.K*1.3,K=linspace(lo,hi,13),iv=K.map(kk=>{const pp=F.hestonCallPrice(s.S,kk,s.r,s.T,s.nu0,s.k,s.theta,s.sigma,s.rho).callPrice;return 100*F.impliedVolatility(pp,s.S,kk,s.r,s.T,0,'call').sigma;});
          const bsVol=100*Math.sqrt(s.nu0);
          lineChart(qs('#he-smile',r),[{name:'Heston implied volatility',x:K,y:iv},{name:'Black-Scholes at √ν₀',x:K,y:K.map(()=>bsVol)}],{xLabel:'Strike K',yLabel:'Implied volatility (%)'});
        } finally {loading(b,false);}
      });
      qs('#he-price',r).click();
    }

    else {
      const sub=m.submodules.simulation;
      r.innerHTML=section(sub,`${controls}${controlGrid(field('Paths','he-np',800,{step:100,min:100,max:3000,inputmode:'numeric'})+field('Steps','he-ns',100,{step:10,min:20,max:252,inputmode:'numeric'})+field('Seed','he-seed',s.seed,{step:1,inputmode:'numeric'}))}<button id="he-sim" class="primary full">Simulate Heston</button>`,`${chartBox('he-paths','Stock paths')}${chartBox('he-var','Instantaneous variance paths')}<div id="he-sim-metrics" class="metric-grid"></div><div class="small-note">Variance transitions use the exact noncentral-χ² Poisson-mixture representation of the CIR state process. The Poisson draw is sampled by exact transformed rejection rather than a normal approximation.</div>`);
      qs('#he-sim',r).onclick=safeAsync(r,async()=>{
        const b=qs('#he-sim',r);loading(b,true);
        try{
          const args=[getn('he-S'),getn('he-r'),getn('he-T'),getn('he-nu'),getn('he-k'),getn('he-theta'),getn('he-sig'),getn('he-rho'),Math.round(getn('he-np')),Math.round(getn('he-ns')),Math.round(getn('he-seed'))],x=await runWorker('hestonSim',args),n=Math.min(15,x.stockPaths.length);
          lineChart(qs('#he-paths',r),x.stockPaths.slice(0,n).map((y,i)=>({name:i===0?'S_t':'',x:x.times,y})),{xLabel:'Time',yLabel:'S_t'});
          lineChart(qs('#he-var',r),x.variancePaths.slice(0,n).map((y,i)=>({name:i===0?'ν_t':'',x:x.times,y})),{xLabel:'Time',yLabel:'ν_t'});
          qs('#he-sim-metrics',r).innerHTML=metric('Mean terminal $S$',money(mean(x.stockPaths.map(p=>p.at(-1))),3))+metric('Mean terminal variance',num(mean(x.variancePaths.map(p=>p.at(-1))),5))+metric('Paths',x.stockPaths.length.toLocaleString());
        } finally {loading(b,false);}
      });
    }
  });
}
