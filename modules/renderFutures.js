import { CONTENT } from '../content.js';
import * as F from '../core/finance.js';
import { lineChart } from '../core/charts.js';
import { theoryCard, field, selectField, table, metric, interpretation, qs, getn, getv, num, money, downloadCsv, escapeHtml } from '../core/ui.js';
import { st, tabbed, controlGrid, chartBox, section, bindNums, safeUpdate } from './common.js';

export function renderFutures(root){
  const m=CONTENT.modules.futures,s=st('futures',{prices:F.LECTURE_SP500_FUTURES_PRICES.join(', '),mult:250,n:8,margin:.10,r:.06,ppy:52,maint:.70,pos:'long',rho:.9284,sS:.0263,sF:.0313,QA:2000000,QF:42000,exp:'will_purchase'});
  tabbed('futures',root,[['margin','Margin account'],['cross_hedge','Cross hedging']],(t,r)=>{
    if(t==='margin'){
      const sub=m.submodules.margin;
      r.innerHTML=`${theoryCard(sub)}<div class="runtime-error-slot" aria-live="polite"></div><div class="lab-layout"><section class="panel"><div class="panel-title">Inputs</div><label class="field"><span>Settlement prices (comma-separated)</span><textarea id="fu-prices" rows="5">${escapeHtml(s.prices)}</textarea></label>${controlGrid(
        field('Contract multiplier','fu-mult',s.mult,{min:.000001})+
        field('Number of contracts','fu-n',s.n,{step:1,min:1})+
        field('Initial margin rate','fu-margin',s.margin,{step:.01,min:.000001})+
        field('Risk-free rate $r$','fu-r',s.r,{step:.005})+
        field('Periods/year','fu-ppy',s.ppy,{step:1,min:1})+
        field('Maintenance / initial margin','fu-maint',s.maint,{step:.05,min:0,max:1})+
        selectField('Position','fu-pos',['long','short'],s.pos)
      )}</section><section class="workspace"><div id="fu-metrics" class="metric-grid"></div>${chartBox('fu-chart','Margin account balance')}<div id="fu-table"></div><button id="fu-csv" class="secondary">Download path CSV</button></section></div>`;
      let latest=null;
      const update=safeUpdate(r,()=>{
        s.prices=qs('#fu-prices',r).value;s.mult=getn('fu-mult');s.n=Math.round(getn('fu-n'));s.margin=getn('fu-margin');s.r=getn('fu-r');s.ppy=Math.round(getn('fu-ppy'));s.maint=getn('fu-maint');s.pos=getv('fu-pos');
        const p=s.prices.split(/[ ,;\n]+/).filter(Boolean).map(Number);
        latest=F.marginAccountPath(p,s.mult,s.n,s.margin,s.r,s.ppy,s.maint,s.pos);
        qs('#fu-metrics',r).innerHTML=metric('Initial notional',money(latest.initialNotional))+metric('Initial margin',money(latest.initialMargin))+metric('Maintenance margin',money(latest.maintenanceMargin))+metric('Futures profit',money(latest.futuresProfit))+metric('Comparable forward profit',money(latest.forwardProfit))+metric('Margin calls',latest.marginCall.filter(Boolean).length);
        lineChart(qs('#fu-chart',r),[{name:'Margin balance',x:latest.periods,y:latest.marginBalance},{name:'Maintenance margin',x:latest.periods,y:latest.periods.map(()=>latest.maintenanceMargin)}],{xLabel:'Settlement period',yLabel:'Margin balance'});
        const rows=latest.periods.map((tt,i)=>[tt,money(latest.futuresPrices[i],2),i?money(latest.priceChanges[i],2):'—',money(latest.interestEarned[i],2),money(latest.markToMarket[i],2),money(latest.marginBalance[i],2),latest.marginCall[i]?'CALL':'']);
        qs('#fu-table',r).innerHTML=table(['Period','F','ΔF','Interest','MTM','Balance','Margin call'],rows,'Futures margin-account path');
      });
      ['fu-prices','fu-mult','fu-n','fu-margin','fu-r','fu-ppy','fu-maint','fu-pos'].forEach(id=>r.querySelector(`#${id}`)?.addEventListener('input',update));
      qs('#fu-csv',r).onclick=()=>latest&&downloadCsv('futures_margin.csv',['period','price','change','interest','mtm','balance','margin_call'],latest.periods.map((tt,i)=>[tt,latest.futuresPrices[i],latest.priceChanges[i]??'',latest.interestEarned[i],latest.markToMarket[i],latest.marginBalance[i],latest.marginCall[i]]));
      update();
    } else {
      const sub=m.submodules.cross_hedge;
      r.innerHTML=section(sub,controlGrid(
        field('Correlation $\\rho$','ch-rho',s.rho,{step:.01,min:-1,max:1})+
        field('$\\sigma_S$','ch-sS',s.sS,{step:.001,min:0})+
        field('$\\sigma_F$','ch-sF',s.sF,{step:.001,min:.000001})+
        field('Exposure $Q_A$','ch-QA',s.QA,{step:1000,min:.000001})+
        field('Contract size $Q_F$','ch-QF',s.QF,{step:1000,min:.000001})+
        selectField('Exposure','ch-exp',['will_purchase','own_or_will_sell'],s.exp)
      ),`<div id="ch-metrics" class="metric-grid"></div>${chartBox('ch-chart','Lecture jet-fuel / heating-oil observations')}<div id="ch-reg"></div><div class="small-note"><strong>Lecture rounding note.</strong> The regression uses the original 15 observations and gives approximately 37.03 contracts. Entering the displayed rounded values of $\\rho$, $\\sigma_S$ and $\\sigma_F$ can give a slightly different number; that is a rounding effect, not a different hedge formula.</div>`);
      const update=safeUpdate(r,()=>{
        s.rho=getn('ch-rho');s.sS=getn('ch-sS');s.sF=getn('ch-sF');s.QA=getn('ch-QA');s.QF=getn('ch-QF');s.exp=getv('ch-exp');
        const x=F.crossHedge(s.rho,s.sS,s.sF,s.QA,s.QF,s.exp),reg=F.estimateCrossHedgeFromChanges(F.LECTURE_CROSS_HEDGE_DS,F.LECTURE_CROSS_HEDGE_DF);
        qs('#ch-metrics',r).innerHTML=metric('h*',num(x.hedgeRatio,4))+metric('R²',num(x.hedgeEffectiveness,4))+metric('|N*|',num(x.optimalContracts,2))+metric('Signed futures contracts',num(x.signedContractPosition,2))+metric('Rounded contracts',x.roundedContracts)+metric('Direction',x.recommendedFuturesPosition);
        lineChart(qs('#ch-chart',r),[{name:'ΔS observations',x:F.LECTURE_CROSS_HEDGE_DF,y:F.LECTURE_CROSS_HEDGE_DS},{name:'Regression',x:[Math.min(...F.LECTURE_CROSS_HEDGE_DF),Math.max(...F.LECTURE_CROSS_HEDGE_DF)],y:[Math.min(...F.LECTURE_CROSS_HEDGE_DF),Math.max(...F.LECTURE_CROSS_HEDGE_DF)].map(z=>reg.intercept+reg.h*z)}],{xLabel:'ΔF',yLabel:'ΔS'});
        qs('#ch-reg',r).innerHTML=interpretation(`Lecture regression: ΔS ≈ ${reg.intercept.toFixed(4)} + ${reg.h.toFixed(4)} ΔF; ρ=${reg.rho.toFixed(4)}, R²=${reg.R2.toFixed(4)}. The futures direction uses both the economic exposure and the sign of h*.`);
      });
      bindNums(r,['ch-rho','ch-sS','ch-sF','ch-QA','ch-QF'],update);r.querySelector('#ch-exp').onchange=update;update();
    }
  });
}
