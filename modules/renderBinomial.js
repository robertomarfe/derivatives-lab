import { CONTENT } from '../content.js';
import * as F from '../core/finance.js';
import { lineChart, binomialTreeChart } from '../core/charts-v111.js';
import { field, selectField, table, metric, interpretation, qs, getn, getv, num, money } from '../core/ui.js';
import { st, tabbed, controlGrid, chartBox, section, safeUpdate } from './common.js';

export function renderBinomial(root){
  const m=CONTENT.modules.binomial,s=st('binomial',{S:41,K:40,r:.08,sigma:.30,T:1,n:2,delta:0,type:'call',style:'european',maxn:40});
  tabbed('binomial',root,[['tree','Tree & replication'],['convergence','Convergence']],(t,r)=>{
    if(t==='tree'){
      const sub=m.submodules.tree;
      r.innerHTML=section(sub,controlGrid(
        field('$S_0$','bi-S',s.S,{min:.000001})+field('$K$','bi-K',s.K,{min:.000001})+
        field('$r$','bi-r',s.r,{step:.005})+field('$\\sigma$','bi-sig',s.sigma,{step:.01,min:.000001})+
        field('$T$','bi-T',s.T,{step:.25,min:.000001})+field('$n$ periods','bi-n',s.n,{step:1,min:1,max:25})+
        field('$\\delta$','bi-d',s.delta,{step:.005})+selectField('Option','bi-type',['call','put'],s.type)+selectField('Exercise','bi-style',['european','american'],s.style)
      ),`<div id="bi-metrics" class="metric-grid"></div>${chartBox('bi-tree','Recombining tree (first 5 steps)')}<div id="bi-node"></div>`);

      const update=safeUpdate(r,()=>{
        s.S=getn('bi-S');s.K=getn('bi-K');s.r=getn('bi-r');s.sigma=getn('bi-sig');s.T=getn('bi-T');s.n=Math.round(getn('bi-n'));s.delta=getn('bi-d');s.type=getv('bi-type');s.style=getv('bi-style');
        const b=F.priceBinomial(s.S,s.K,s.r,s.sigma,s.T,s.n,s.delta,s.type,s.style);
        qs('#bi-metrics',r).innerHTML=metric('Option price',money(b.price,6))+metric('$u$',num(b.u,6))+metric('$d$',num(b.d,6))+metric('$p^*$',num(b.p,6))+metric('Root $\\Delta$',Number.isFinite(b.deltaTree[0][0])?num(b.deltaTree[0][0],6):'exercise')+metric('Root $B$',Number.isFinite(b.bondTree[0][0])?money(b.bondTree[0][0],6):'exercise');
        binomialTreeChart(qs('#bi-tree',r),b,5);
        const rows=[];for(let i=0;i<Math.min(s.n,4);i++)for(let j=0;j<=i;j++)rows.push([i,j,money(b.stockTree[i][j],3),money(b.optionTree[i][j],4),Number.isFinite(b.continuationTree[i][j])?money(b.continuationTree[i][j],4):'—',money(b.intrinsicTree[i][j],4),Number.isFinite(b.deltaTree[i][j])?num(b.deltaTree[i][j],5):'—',Number.isFinite(b.bondTree[i][j])?money(b.bondTree[i][j],5):'—',b.exerciseTree[i][j]?'Exercise':'Continue']);
        qs('#bi-node',r).innerHTML=table(['$i$','$j$','$S$','$V$','Continuation','Intrinsic','$\\Delta$','$B$','Decision'],rows,'First nodes of the binomial tree');
      });
      ['bi-S','bi-K','bi-r','bi-sig','bi-T','bi-n','bi-d','bi-type','bi-style'].forEach(id=>r.querySelector(`#${id}`)?.addEventListener('input',update));
      update();
    } else {
      const sub=m.submodules.convergence;
      r.innerHTML=section(sub,controlGrid(
        field('$S_0$','bc-S',s.S,{min:.000001})+field('$K$','bc-K',s.K,{min:.000001})+field('$r$','bc-r',s.r,{step:.005})+
        field('$\\sigma$','bc-sig',s.sigma,{step:.01,min:.000001})+field('$T$','bc-T',s.T,{step:.25,min:.000001})+field('$\\delta$','bc-d',s.delta,{step:.005})+
        field('Maximum $n$','bc-max',s.maxn,{step:1,min:2,max:200})
      ),`${chartBox('bc-chart','Binomial convergence')}<div id="bc-note"></div>`);

      const update=safeUpdate(r,()=>{
        s.S=getn('bc-S');s.K=getn('bc-K');s.r=getn('bc-r');s.sigma=getn('bc-sig');s.T=getn('bc-T');s.delta=getn('bc-d');s.maxn=Math.round(getn('bc-max'));
        const ns=Array.from({length:s.maxn},(_,i)=>i+1),vals=ns.map(n=>F.priceBinomial(s.S,s.K,s.r,s.sigma,s.T,n,s.delta,'call','european').price),bs=F.blackScholesPrice(s.S,s.K,s.r,s.sigma,s.T,s.delta,'call');
        lineChart(qs('#bc-chart',r),[{name:'Binomial',x:ns,y:vals},{name:'Black-Scholes',x:ns,y:ns.map(()=>bs)}],{xLabel:'Number of periods n',yLabel:'Call price'});
        qs('#bc-note',r).innerHTML=interpretation('The lecture emphasizes oscillating rather than necessarily monotone convergence toward the Black-Scholes value.');
      });
      ['bc-S','bc-K','bc-r','bc-sig','bc-T','bc-d','bc-max'].forEach(id=>r.querySelector(`#${id}`)?.addEventListener('input',update));
      update();
    }
  });
}
