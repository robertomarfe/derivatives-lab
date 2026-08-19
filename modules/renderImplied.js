import { CONTENT } from '../content.js';
import * as F from '../core/finance.js';
import { linspace } from '../core/special.js';
import { lineChart, heatmap } from '../core/charts.js';
import { field, selectField, metric, interpretation, qs, getn, getv, money, pct, num } from '../core/ui.js';
import { st, tabbed, controlGrid, chartBox, section, safeUpdate } from './common.js';

function parseStrip(text){
  const rows=text.split(/\n+/).map(x=>x.trim()).filter(Boolean).map((row,i)=>{
    const z=row.split(/[;,\s]+/).filter(Boolean).map(Number);
    if(z.length!==3||z.some(v=>!Number.isFinite(v)))throw new Error(`Strip row ${i+1} must contain exactly three finite values: K, put, call.`);
    return z;
  });
  if(rows.length<2)throw new Error('The supplied strip must contain at least two strikes.');
  rows.sort((a,b)=>a[0]-b[0]);
  return {K:rows.map(z=>z[0]),puts:rows.map(z=>z[1]),calls:rows.map(z=>z[2])};
}

export function renderImplied(root){
  const m=CONTENT.modules.implied_vol,s=st('implied_vol',{S:100,K:90,r:.08,T:1,delta:.05,market:18.25,type:'call',sigma:.22});
  tabbed('implied_vol',root,[['iv','Implied volatility'],['surface','Volatility surface'],['vix','VIX / variance']],(t,r)=>{
    if(t==='iv'){
      const sub=m.submodules.iv;
      r.innerHTML=section(sub,controlGrid(
        field('$S$','iv-S',s.S,{min:.000001})+field('$K$','iv-K',s.K,{min:.000001})+field('$r$','iv-r',s.r,{step:.005})+
        field('$\\delta$','iv-d',s.delta,{step:.005})+field('$T$','iv-T',s.T,{step:.25,min:.000001})+field('Market option price','iv-p',s.market,{step:.1,min:0})+
        selectField('Option','iv-type',['call','put'],s.type)
      ),`<div id="iv-metrics" class="metric-grid"></div>${chartBox('iv-chart','Black-Scholes price as a function of σ')}`);
      const update=safeUpdate(r,()=>{
        s.S=getn('iv-S');s.K=getn('iv-K');s.r=getn('iv-r');s.delta=getn('iv-d');s.T=getn('iv-T');s.market=getn('iv-p');s.type=getv('iv-type');
        const x=F.impliedVolatility(s.market,s.S,s.K,s.r,s.T,s.delta,s.type);
        qs('#iv-metrics',r).innerHTML=metric('Implied volatility',pct(x.sigma,4))+metric('Repriced option',money(x.modelPrice,6))+metric('Lower bound',money(x.lowerBound,4))+metric('Upper bound',money(x.upperBound,4));
        const maxSig=Math.max(.8,x.sigma*1.8,.05),sig=linspace(.001,maxSig,160),p=sig.map(z=>F.blackScholesPrice(s.S,s.K,s.r,z,s.T,s.delta,s.type));
        lineChart(qs('#iv-chart',r),[{name:'BS model price',x:sig.map(z=>100*z),y:p},{name:'Market price',x:[0,100*maxSig],y:[s.market,s.market]}],{xLabel:'σ (%)',yLabel:'Option price'});
      });
      ['iv-S','iv-K','iv-r','iv-d','iv-T','iv-p','iv-type'].forEach(id=>r.querySelector(`#${id}`)?.addEventListener('input',update));update();
    }

    else if(t==='surface'){
      const sub=m.submodules.surface;
      r.innerHTML=section(sub,
        `${controlGrid(field('$S$','vs-S',100,{min:.000001})+field('$r$','vs-r',.02,{step:.005})+field('$\\delta$','vs-d',0,{step:.005})+field('Constant BS $\\sigma$','vs-sig',s.sigma,{step:.01,min:0}))}
        <label class="field" for="vs-csv"><span>Optional market price grid</span><textarea id="vs-csv" rows="7" aria-describedby="vs-help" placeholder="Leave blank for the flat Black-Scholes benchmark.\nRows = maturities 0.25, 0.5, 1; columns = strikes 80, 90, 100, 110, 120"></textarea></label>
        <div id="vs-help" class="small-note">The default is deliberately a flat Black-Scholes benchmark; the app does not invent a market smile. Paste observed or supplied call prices to invert a non-flat surface.</div><button id="vs-run" class="primary full">Build surface</button>`,
        `<div id="vs-metrics" class="metric-grid"></div>${chartBox('vs-heat','Implied-volatility surface (heatmap)')}${chartBox('vs-slices','Implied-volatility maturity slices')}`);
      qs('#vs-run',r).onclick=safeUpdate(r,()=>{
        const S=getn('vs-S'),rr=getn('vs-r'),dd=getn('vs-d'),sig=getn('vs-sig'),K=[80,90,100,110,120],T=[.25,.5,1],txt=qs('#vs-csv',r).value.trim();
        let prices;
        if(txt){
          const rows=txt.split(/\n+/).map(z=>z.split(/[;,\s]+/).filter(Boolean).map(Number));
          if(rows.length!==T.length||rows.some(z=>z.length!==K.length||z.some(v=>!Number.isFinite(v)||v<0)))throw new Error('Expected a 3 × 5 grid of finite non-negative call prices.');
          prices=rows;
        } else prices=T.map(tt=>K.map(kk=>F.blackScholesPrice(S,kk,rr,sig,tt,dd,'call')));
        const iv=T.map((tt,i)=>K.map((kk,j)=>100*F.impliedVolatility(prices[i][j],S,kk,rr,tt,dd,'call').sigma));
        heatmap(qs('#vs-heat',r),T,K,iv,{rowLabel:'T',colLabel:'K'});
        lineChart(qs('#vs-slices',r),T.map((tt,i)=>({name:`T=${tt}`,x:K,y:iv[i]})),{xLabel:'Strike K',yLabel:'Implied volatility (%)'});
        const flat=iv.flat();qs('#vs-metrics',r).innerHTML=metric('Minimum IV',`${Math.min(...flat).toFixed(2)}%`)+metric('Maximum IV',`${Math.max(...flat).toFixed(2)}%`)+metric('Data source',txt?'Supplied price grid':'Black-Scholes benchmark');
      });
      qs('#vs-run',r).click();
    }

    else {
      const sub=m.submodules.vix;
      r.innerHTML=section(sub,
        `${controlGrid(field('$S_0$','vx-S',100,{min:.000001})+field('$r$','vx-r',.02,{step:.005})+field('$T$ (years)','vx-T',30/365,{step:.005,min:.000001})+field('Benchmark $\\sigma$','vx-sig',.20,{step:.01,min:0}))}
        <label class="field" for="vx-strip"><span>Optional supplied strip: K, put, call</span><textarea id="vx-strip" rows="7" aria-describedby="vx-help" placeholder="Leave blank for the dense Black-Scholes benchmark.\nExample row: 90, 0.75, 10.90"></textarea></label>
        <div id="vx-help" class="small-note">When a strip is supplied, strikes are sorted and the lecture single-maturity discrete replication is applied directly. No unshown CBOE filtering or maturity interpolation rules are added.</div>`,
        `<div id="vx-metrics" class="metric-grid"></div>${chartBox('vx-chart','OTM option-strip contribution')}<div id="vx-note"></div>`);
      const update=safeUpdate(r,()=>{
        const S=getn('vx-S'),rr=getn('vx-r'),T=getn('vx-T'),sig=getn('vx-sig'),Fw=S*Math.exp(rr*T),txt=qs('#vx-strip',r).value.trim();
        let K,puts,calls,source;
        if(txt){({K,puts,calls}=parseStrip(txt));source='Supplied strip';}
        else {K=linspace(40,200,161);puts=K.map(k=>F.blackScholesPrice(S,k,rr,sig,T,0,'put'));calls=K.map(k=>F.blackScholesPrice(S,k,rr,sig,T,0,'call'));source='Black-Scholes benchmark';}
        const x=F.discreteVixVariance(K,puts,calls,Fw,rr,T);
        qs('#vx-metrics',r).innerHTML=metric('Forward $F_{0,T}$',money(Fw,4))+metric('$K_0$',money(x.K0,2))+metric('Replicated variance',num(x.variance,6))+metric('Volatility',pct(x.volatility,3))+metric('VIX-style level',num(x.vixLevel,3))+metric('Data source',source);
        lineChart(qs('#vx-chart',r),[{name:'ΔK·Q(K)/K²',x:K,y:x.contribution}],{xLabel:'Strike K',yLabel:'Contribution'});
        qs('#vx-note',r).innerHTML=interpretation(txt?'The displayed value is the lecture single-maturity discrete option-strip approximation using the supplied prices. The lab deliberately does not add exchange-production rules that are not shown in the course material.':`With a broad dense Black-Scholes strip, the discrete option replication approximates the benchmark variance $\\sigma^2=${(sig*sig).toFixed(6)}$. This is a numerical teaching benchmark, not a live VIX feed.`);
      });
      ['vx-S','vx-r','vx-T','vx-sig','vx-strip'].forEach(id=>r.querySelector(`#${id}`)?.addEventListener('input',update));update();
    }
  });
}
