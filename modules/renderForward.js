import { CONTENT } from '../content.js';
import * as F from '../core/finance.js';
import { linspace } from '../core/special.js';
import { lineChart } from '../core/charts.js';
import { field, metric, qs, getn, money, escapeHtml } from '../core/ui.js';
import { st, tabbed, controlGrid, chartBox, section, bindNums, safeUpdate } from './common.js';

export function renderForward(root){
  const m=CONTENT.modules.forward,s=st('forward',{F:1020,qS:0,qF:1,inspect:1050,S0:100,r:.05,delta:.02,T:1,market:105});
  tabbed('forward',root,[['payoff','Payoff builder'],['pricing','Fair price & arbitrage']],(t,r)=>{
    if(t==='payoff'){
      const sub=m.submodules.payoff;
      r.innerHTML=section(sub,controlGrid(
        field('Forward price $F_{0,T}$','fw-F',s.F,{step:1,min:0})+
        field('Underlying quantity $q_S$','fw-qS',s.qS,{step:.25})+
        field('Forward quantity $q_F$','fw-qF',s.qF,{step:.25})+
        field('Inspector $S_T$','fw-inspect',s.inspect,{step:1,min:0})
      ),`<div id="fw-metrics" class="metric-grid"></div>${chartBox('fw-chart','Expiration payoff / terminal value')}`);
      const update=safeUpdate(r,()=>{
        s.F=getn('fw-F');s.qS=getn('fw-qS');s.qF=getn('fw-qF');s.inspect=getn('fw-inspect');
        const lo=Math.max(0,s.F*.65),hi=Math.max(s.F*1.35,s.F+1),x=linspace(lo,hi,121),yl=x.map(ST=>F.longForwardPayoff(ST,s.F)),ys=x.map(ST=>F.shortForwardPayoff(ST,s.F)),yc=x.map(ST=>F.combinedTerminalPayoff(ST,s.F,s.qS,s.qF));
        qs('#fw-metrics',r).innerHTML=metric('Long forward at inspector',money(F.longForwardPayoff(s.inspect,s.F)))+metric('Short forward at inspector',money(F.shortForwardPayoff(s.inspect,s.F)))+metric('Combined terminal value',money(F.combinedTerminalPayoff(s.inspect,s.F,s.qS,s.qF)));
        lineChart(qs('#fw-chart',r),[{name:'Long forward',x,y:yl},{name:'Short forward',x,y:ys},{name:'Combined position',x,y:yc}],{xLabel:'S_T',yLabel:'Payoff / terminal value'});
      });
      bindNums(r,['fw-F','fw-qS','fw-qF','fw-inspect'],update);update();
    } else {
      const sub=m.submodules.pricing;
      r.innerHTML=section(sub,controlGrid(
        field('Spot $S_0$','fw-S0',s.S0,{min:.000001})+
        field('Risk-free rate $r$','fw-r',s.r,{step:.005})+
        field('Dividend yield $\\delta$','fw-d',s.delta,{step:.005})+
        field('Maturity $T$','fw-T',s.T,{step:.25,min:0})+
        field('Observed market forward','fw-market',s.market,{step:.5,min:.000001})
      ),`<div id="fw-price-metrics" class="metric-grid"></div><div id="fw-arb" class="interpretation"></div>`);
      const update=safeUpdate(r,()=>{
        s.S0=getn('fw-S0');s.r=getn('fw-r');s.delta=getn('fw-d');s.T=getn('fw-T');s.market=getn('fw-market');
        const fair=F.fairForwardPrice(s.S0,s.r,s.delta,s.T),arb=F.diagnoseForwardArbitrage(s.S0,s.market,s.r,s.delta,s.T);
        qs('#fw-price-metrics',r).innerHTML=metric('Fair F₀,T',money(fair,4))+metric('Market − fair',money(s.market-fair,4))+metric('Maturity arbitrage profit/unit',money(arb.maturityProfitPerUnit,4));
        qs('#fw-arb',r).innerHTML=`<strong>${arb.relation==='fair'?'No arbitrage detected':arb.relation==='market_above_fair'?'Cash-and-carry':'Reverse cash-and-carry'}.</strong><ol>${arb.strategy.map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ol>`;
      });
      bindNums(r,['fw-S0','fw-r','fw-d','fw-T','fw-market'],update);update();
    }
  });
}
