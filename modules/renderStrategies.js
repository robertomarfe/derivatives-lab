import { CONTENT } from '../content.js';
import * as F from '../core/finance.js';
import { linspace } from '../core/special.js';
import { lineChart } from '../core/charts.js';
import { field, selectField, table, interpretation, qs, getn, getv, money } from '../core/ui.js';
import { st, tabbed, controlGrid, chartBox, section, safeUpdate, adaptiveDomainFromStrikes } from './common.js';

export function renderStrategies(root){
  const m=CONTENT.modules.strategies;
  const s=st('strategies',{preset:'Straddle',kl:90,ka:100,kh:110,ratio:2,netCost:8,r:.03,T:1,legs:[
    {instrument:'call',quantity:1,strike:100},
    {instrument:'put',quantity:1,strike:100},
    {instrument:'underlying',quantity:0,strike:100},
  ]});

  tabbed('strategies',root,[['presets','Lecture strategies'],['custom','Custom portfolio'],['profit','Payoff vs profit']],(t,r)=>{
    if(t==='presets'){
      const sub=m.submodules.presets;
      r.innerHTML=section(sub,controlGrid(
        selectField('Preset','st-preset',['Bull Spread','Collar','Collared Stock (extension)','Straddle','Strangle','Butterfly Spread','Ratio Spread'],s.preset)+
        field('$K_{low}$','st-kl',s.kl,{min:.000001})+
        field('$K_{ATM}$','st-ka',s.ka,{min:.000001})+
        field('$K_{high}$','st-kh',s.kh,{min:.000001})+
        field('Ratio $n$','st-ratio',s.ratio,{step:1,min:1})
      ),`<div id="st-legs"></div>${chartBox('st-chart','Expiration payoff')}`);

      const update=safeUpdate(r,()=>{
        s.preset=getv('st-preset');s.kl=getn('st-kl');s.ka=getn('st-ka');s.kh=getn('st-kh');s.ratio=Math.round(getn('st-ratio'));
        const presetName=s.preset==='Collared Stock (extension)'?'Collared Stock':s.preset;
        const legs=F.strategyPreset(presetName,s.kl,s.ka,s.kh,s.ratio);
        const strikes=legs.filter(l=>l.instrument!=='underlying').map(l=>l.strike);
        const [lo,hi]=adaptiveDomainFromStrikes(strikes,{fallback:s.ka,pad:.8,minFloor:0});
        const x=linspace(lo,hi,241);
        qs('#st-legs',r).innerHTML=table(['Leg','Quantity','Strike'],legs.map(l=>[l.label,l.quantity,l.strike??'—']),'Strategy legs');
        lineChart(qs('#st-chart',r),[{name:s.preset,x,y:x.map(ST=>F.portfolioPayoff(ST,legs))}],{xLabel:'S_T',yLabel:'Payoff'});
      });
      ['st-preset','st-kl','st-ka','st-kh','st-ratio'].forEach(id=>r.querySelector(`#${id}`)?.addEventListener('input',update));
      update();
    }

    else if(t==='custom'){
      const sub=m.submodules.custom;
      const legRows=s.legs.map((l,i)=>`<div class="leg-row">${selectField(`Leg ${i+1}`,`leg-i-${i}`,['call','put','underlying'],l.instrument)}${field('Quantity',`leg-q-${i}`,l.quantity,{step:.5})}${field('Strike $K$',`leg-k-${i}`,l.strike,{step:1,min:.000001})}</div>`).join('');
      r.innerHTML=section(sub,`<div class="panel-title">Portfolio legs</div>${legRows}`,`${chartBox('custom-chart','Custom expiration payoff')}<div id="custom-table"></div>`);

      const update=safeUpdate(r,()=>{
        s.legs=s.legs.map((_,i)=>({instrument:getv(`leg-i-${i}`),quantity:getn(`leg-q-${i}`),strike:getn(`leg-k-${i}`)}));
        // Underlying legs do not use strike economically; an entered strike is retained only as UI state.
        const strikes=s.legs.filter(l=>l.instrument!=='underlying').map(l=>l.strike);
        const [lo,hi]=adaptiveDomainFromStrikes(strikes,{fallback:100,pad:.8,minFloor:0});
        const x=linspace(lo,hi,241);
        lineChart(qs('#custom-chart',r),[{name:'Portfolio',x,y:x.map(ST=>F.portfolioPayoff(ST,s.legs))}],{xLabel:'S_T',yLabel:'Payoff'});
        qs('#custom-table',r).innerHTML=table(['Instrument','Quantity','Strike'],s.legs.map(l=>[l.instrument,l.quantity,l.instrument==='underlying'?'—':l.strike]),'Custom portfolio legs');
      });
      s.legs.forEach((_,i)=>['i','q','k'].forEach(z=>r.querySelector(`#leg-${z}-${i}`)?.addEventListener('input',update)));
      update();
    }

    else {
      const sub=m.submodules.profit;
      r.innerHTML=section(sub,controlGrid(
        selectField('Preset','pf-preset',['Bull Spread','Collar','Collared Stock (extension)','Straddle','Strangle','Butterfly Spread','Ratio Spread'],s.preset)+
        field('Net initial cost $C_0$','pf-cost',s.netCost,{step:.5})+
        field('Risk-free rate $r$','pf-r',s.r,{step:.005})+
        field('Maturity $T$','pf-T',s.T,{step:.25,min:0})
      ),`${chartBox('profit-chart','Payoff versus profit at T')}<div id="profit-note"></div>`);

      const update=safeUpdate(r,()=>{
        s.preset=getv('pf-preset');s.netCost=getn('pf-cost');s.r=getn('pf-r');s.T=getn('pf-T');
        const presetName=s.preset==='Collared Stock (extension)'?'Collared Stock':s.preset;
        const legs=F.strategyPreset(presetName,s.kl,s.ka,s.kh,s.ratio);
        const strikes=legs.filter(l=>l.instrument!=='underlying').map(l=>l.strike);
        const [lo,hi]=adaptiveDomainFromStrikes(strikes,{fallback:s.ka,pad:.8,minFloor:0});
        const x=linspace(lo,hi,241),pay=x.map(ST=>F.portfolioPayoff(ST,legs));
        const profit=pay.map(v=>F.terminalProfitFromNetCost(v,s.netCost,s.r,s.T));
        lineChart(qs('#profit-chart',r),[{name:'Payoff',x,y:pay},{name:'Profit',x,y:profit}],{xLabel:'S_T',yLabel:'Value at T'});
        qs('#profit-note',r).innerHTML=interpretation(`The time-0 net cost grows to ${money(s.netCost*Math.exp(s.r*s.T),2)} at T and shifts the entire payoff curve by that amount.`);
      });
      ['pf-preset','pf-cost','pf-r','pf-T'].forEach(id=>r.querySelector(`#${id}`)?.addEventListener('input',update));
      update();
    }
  });
}
