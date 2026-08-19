import { CONTENT } from '../content.js';
import * as F from '../core/finance.js';
import { lineChart, histogram } from '../core/charts.js';
import { field, selectField, table, metric, interpretation, qs, getn, getv, money, num } from '../core/ui.js';
import { runWorker } from '../core/worker-client.js';
import { st, tabbed, controlGrid, chartBox, section, loading, safeAsync } from './common.js';

export function renderHedging(root){
  const m=CONTENT.modules.hedging,s=st('hedging',{K:110,T:.5,S0:100,r:.03,mu:.05,sigma:.2,nPaths:2500,nSteps:100,TC:0,K2:115,T2:1,seed:12345,gamma:false});
  tabbed('hedging',root,[['distribution','P&L distribution'],['path','One path'],['frequency','Rebalancing frequency']],(t,r)=>{
    const controls=controlGrid(
      field('Sold call $K$','hd-K',s.K,{min:.000001})+field('$T$','hd-T',s.T,{step:.1,min:.000001})+field('$S_0$','hd-S',s.S0,{min:.000001})+
      field('$r$','hd-r',s.r,{step:.005})+field('$\\mu$','hd-mu',s.mu,{step:.005})+field('$\\sigma$','hd-sig',s.sigma,{step:.01,min:.000001})+
      field('Transaction cost $\\epsilon$','hd-TC',s.TC,{step:.0005,min:0})+field('Hedge call $\\widetilde K$','hd-K2',s.K2,{min:.000001})+
      field('Hedge call $\\widetilde T$','hd-T2',s.T2,{step:.1,min:.000001})+field('Seed','hd-seed',s.seed,{step:1,inputmode:'numeric'})
    );
    function args(np,ns,gamma,tc=s.TC){
      const S0=getn('hd-S'),K=getn('hd-K'),T=getn('hd-T'),rr=getn('hd-r'),mu=getn('hd-mu'),sig=getn('hd-sig'),K2=getn('hd-K2'),T2=getn('hd-T2'),seed=Math.round(getn('hd-seed')),charge=F.blackScholesPrice(S0,K,rr,sig,T,0,'call');
      return [charge,K,T,S0,rr,mu,sig,np,ns,tc,gamma,K2,T2,seed];
    }

    if(t==='distribution'){
      const sub=m.submodules.distribution;
      r.innerHTML=section(sub,`${controls}${controlGrid(field('Paths','hd-np',s.nPaths,{step:500,min:500,max:10000,inputmode:'numeric'})+field('Rebalancing steps','hd-ns',s.nSteps,{step:10,min:5,max:500,inputmode:'numeric'})+selectField('Hedge','hd-gh',['Delta only','Delta-Gamma'],s.gamma?'Delta-Gamma':'Delta only'))}<button id="hd-run" class="primary full">Run hedging experiment</button>`,`<div id="hd-metrics" class="metric-grid"></div>${chartBox('hd-hist','Final bank balance / P&L')}`);
      qs('#hd-run',r).onclick=safeAsync(r,async()=>{
        const b=qs('#hd-run',r);loading(b,true);
        try{
          const np=Math.round(getn('hd-np')),ns=Math.round(getn('hd-ns')),gh=getv('hd-gh')==='Delta-Gamma',tc=getn('hd-TC'),x=await runWorker('hedging',args(np,ns,gh,tc));
          qs('#hd-metrics',r).innerHTML=metric('Mean P&L',money(x.mean,5))+metric('Std. dev.',money(x.std,5))+metric('5% percentile',money(x.percentile5,5))+metric('Paths',np.toLocaleString());
          histogram(qs('#hd-hist',r),x.finalBalance,40,{xLabel:'Final balance'});
        } finally {loading(b,false);}
      });
    }

    else if(t==='path'){
      const sub=m.submodules.path;
      r.innerHTML=section(sub,`${controls}${controlGrid(field('Path steps','hp-ns',80,{step:10,min:10,max:250,inputmode:'numeric'})+selectField('Hedge','hp-gh',['Delta only','Delta-Gamma'],'Delta only'))}<button id="hp-run" class="primary full">Simulate one path</button>`,`${chartBox('hp-chart','Illustrative underlying path')}${chartBox('hp-balance','Bank account along the hedge')}<div id="hp-metrics" class="metric-grid"></div><div id="hp-table"></div><div id="hp-note"></div>`);
      qs('#hp-run',r).onclick=safeAsync(r,async()=>{
        const b=qs('#hp-run',r);loading(b,true);
        try{
          const ns=Math.round(getn('hp-ns')),gh=getv('hp-gh')==='Delta-Gamma',a=args(1,ns,gh,getn('hd-TC'));
          const traceArgs=[a[0],a[1],a[2],a[3],a[4],a[5],a[6],a[8],a[9],a[10],a[11],a[12],a[13]],x=await runWorker('hedgingPath',traceArgs);
          lineChart(qs('#hp-chart',r),[{name:'S_t',x:x.times,y:x.stockPath}],{xLabel:'Time',yLabel:'Stock price'});
          lineChart(qs('#hp-balance',r),[{name:'Bank account / terminal P&L',x:x.times,y:x.bankBalance}],{xLabel:'Time',yLabel:'Balance'});
          const totalTc=x.transactionCostPaid.reduce((u,v)=>u+v,0);
          qs('#hp-metrics',r).innerHTML=metric('Final hedging balance',money(x.finalBalance,5))+metric('Total explicit transaction costs',money(totalTc,5))+metric('Initial stock hedge',num(x.stockQuantity[0],5))+metric('Initial hedge-option quantity',num(x.option2Quantity[0],5));
          const picks=[0,...Array.from({length:Math.min(8,ns-1)},(_,i)=>Math.round((i+1)*ns/(Math.min(8,ns-1)+1))),ns].filter((v,i,a)=>a.indexOf(v)===i);
          qs('#hp-table',r).innerHTML=table(['Step','$t$','$S_t$','$q_t^S$','$q_t^2$','Bank balance','Transaction cost'],picks.map(i=>[i,num(x.times[i],4),money(x.stockPath[i],4),num(x.stockQuantity[i],5),num(x.option2Quantity[i],5),money(x.bankBalance[i],5),money(x.transactionCostPaid[i],5)]),'Selected rebalancing dates along the simulated path');
          qs('#hp-note',r).innerHTML=interpretation('The trace applies the same discrete self-financing recursion used in the distribution experiment. The terminal row includes stock and hedge-option liquidation and the sold-call payoff.');
        } finally {loading(b,false);}
      });
    }

    else {
      const sub=m.submodules.frequency;
      r.innerHTML=section(sub,`${controls}${field('Paths per frequency','hf-np',1500,{step:500,min:500,max:5000,inputmode:'numeric'})}<button id="hf-run" class="primary full">Compare frequencies</button>`,`${chartBox('hf-chart','P&L standard deviation versus rebalancing frequency')}<div id="hf-note"></div>`);
      qs('#hf-run',r).onclick=safeAsync(r,async()=>{
        const b=qs('#hf-run',r);loading(b,true);
        try{
          const np=Math.round(getn('hf-np')),steps=[20,50,100,200],no=[],withEntered=[],tcRate=getn('hd-TC');
          for(const ns of steps){no.push((await runWorker('hedging',args(np,ns,false,0))).std);withEntered.push((await runWorker('hedging',args(np,ns,false,tcRate))).std);}
          lineChart(qs('#hf-chart',r),[{name:'No transaction costs',x:steps,y:no},{name:`Entered costs ε=${tcRate}`,x:steps,y:withEntered}],{xLabel:'Number of rebalancing steps',yLabel:'P&L Std Dev'});
          qs('#hf-note',r).innerHTML=interpretation(tcRate===0?'The two curves coincide because ε=0. Enter a positive transaction-cost rate to reproduce the lecture comparison between discretization risk and trading costs.':'Without costs, finer rebalancing reduces discretization risk. With proportional costs, the lecture highlights that the overall effect need not be monotone.');
        } finally {loading(b,false);}
      });
    }
  });
}
