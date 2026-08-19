import { CONTENT } from '../content.js';
import * as F from '../core/finance.js';
import { linspace } from '../core/special.js';
import { lineChart } from '../core/charts.js';
import { field, metric, interpretation, qs, getn, money, pct, num } from '../core/ui.js';
import { st, tabbed, controlGrid, chartBox, section, safeUpdate } from './common.js';

export function renderMertonCredit(root){
  const m=CONTENT.modules.merton_credit,s=st('merton_credit',{V:12.4,D:10,r:.05,sigmaV:.2123,T:1,alpha:.08,E:3,sigmaE:.8});
  tabbed('merton_credit',root,[['capital','Capital structure'],['known','Known firm value'],['kmv','KMV-style inversion']],(t,r)=>{
    if(t==='capital'){
      const sub=m.submodules.capital;
      r.innerHTML=section(sub,controlGrid(field('Debt face value $D$','cr-D',s.D,{min:.000001})+field('Max $V(T)$ in chart','cr-max',25,{min:.000001})),`${chartBox('cr-cap','Equity and debt payoffs at maturity')}<div id="cr-cap-note"></div>`);
      const update=safeUpdate(r,()=>{
        s.D=getn('cr-D');const mx=getn('cr-max');if(mx<=0)throw new Error('Maximum firm value in the chart must be strictly positive.');
        const x=linspace(0,mx,180),eq=x.map(v=>Math.max(v-s.D,0)),debt=x.map(v=>Math.min(v,s.D));
        lineChart(qs('#cr-cap',r),[{name:'Equity E(T)',x,y:eq},{name:'Debt D(T)',x,y:debt}],{xLabel:'Firm value V(T)',yLabel:'Payoff'});
        qs('#cr-cap-note',r).innerHTML=interpretation(`Default occurs at maturity when $V(T)<D=${money(s.D,2)}$. Equity is the payoff of a long call on firm value.`);
      });
      ['cr-D','cr-max'].forEach(id=>r.querySelector(`#${id}`)?.addEventListener('input',update));update();
    }

    else if(t==='known'){
      const sub=m.submodules.known;
      r.innerHTML=section(sub,controlGrid(
        field('Firm value $V_0$','ck-V',s.V,{min:.000001})+field('Debt face $D$','ck-D',s.D,{min:.000001})+field('$r$','ck-r',s.r,{step:.005})+
        field('$\\sigma_V$','ck-sv',s.sigmaV,{step:.01,min:.000001})+field('$T$','ck-T',s.T,{step:.25,min:.000001})+field('Physical drift $\\alpha$','ck-a',s.alpha,{step:.01})
      ),`<div id="ck-metrics" class="metric-grid"></div><div id="ck-note"></div>`);
      const update=safeUpdate(r,()=>{
        s.V=getn('ck-V');s.D=getn('ck-D');s.r=getn('ck-r');s.sigmaV=getn('ck-sv');s.T=getn('ck-T');s.alpha=getn('ck-a');
        const z=F.evaluateKnownFirm(s.V,s.D,s.r,s.sigmaV,s.T),dd=F.distanceToDefault(s.V,s.D,s.alpha,s.sigmaV,s.T),edf=F.expectedDefaultFrequency(s.V,s.D,s.alpha,s.sigmaV,s.T);
        qs('#ck-metrics',r).innerHTML=metric('Equity $E_0$',money(z.equityValue,5))+metric('Risky debt $D_0$',money(z.debtValue,5))+metric('Risk-neutral PD',pct(z.riskNeutralDefaultProbability,3))+metric('Physical distance to default',num(dd,4))+metric('Physical EDF',pct(edf,3))+metric('Credit spread',pct(z.creditSpread,3));
        qs('#ck-note',r).innerHTML=interpretation('The physical EDF uses $\\alpha$, while the risk-neutral default probability uses $r$. They are different objects and are reported separately.');
      });
      ['ck-V','ck-D','ck-r','ck-sv','ck-T','ck-a'].forEach(id=>r.querySelector(`#${id}`)?.addEventListener('input',update));update();
    }

    else {
      const sub=m.submodules.kmv;
      r.innerHTML=section(sub,controlGrid(
        field('Observed equity $E_0$','km-E',s.E,{min:.000001})+field('Observed equity volatility $\\sigma_E$','km-se',s.sigmaE,{step:.05,min:.000001})+
        field('Debt face $D$','km-D',s.D,{min:.000001})+field('$r$','km-r',s.r,{step:.005})+field('$T$','km-T',s.T,{step:.25,min:.000001})
      ),`<div id="km-metrics" class="metric-grid"></div><div id="km-note"></div>`);
      const update=safeUpdate(r,()=>{
        s.E=getn('km-E');s.sigmaE=getn('km-se');s.D=getn('km-D');s.r=getn('km-r');s.T=getn('km-T');
        const z=F.inferFirmValueFromEquity(s.E,s.sigmaE,s.D,s.r,s.T);
        qs('#km-metrics',r).innerHTML=metric('Inferred $V_0$',money(z.V0,5))+metric('Inferred $\\sigma_V$',num(z.sigmaV,6))+metric('Risk-neutral PD',pct(z.riskNeutralDefaultProbability,3))+metric('Risky debt value',money(z.debtValue,5))+metric('Debt yield',pct(z.debtYieldContinuous,3))+metric('Credit spread',pct(z.creditSpread,3));
        const lectureBenchmark=Math.abs(s.E-3)<1e-12&&Math.abs(s.sigmaE-.8)<1e-12&&Math.abs(s.D-10)<1e-12&&Math.abs(s.r-.05)<1e-12&&Math.abs(s.T-1)<1e-12;
        qs('#km-note',r).innerHTML=interpretation(lectureBenchmark?'The lecture benchmark gives $V_0\\approx12.40$ and $\\sigma_V\\approx0.2123$. Using the lecture-rounded risky debt value $D_0=9.40$ gives a credit spread of about 1.19%; using the internally consistent unrounded debt value from the inversion gives about 1.2366%. The difference is rounding, not a different model.':'The inversion solves the lecture equity-value and equity-volatility equations jointly; risky debt, risk-neutral default probability, debt yield and spread are then derived from the inferred firm value and volatility.');
      });
      ['km-E','km-se','km-D','km-r','km-T'].forEach(id=>r.querySelector(`#${id}`)?.addEventListener('input',update));update();
    }
  });
}
