import { linspace } from './special.js';

function el(tag, attrs={}) {
  const e=document.createElementNS('http://www.w3.org/2000/svg',tag);
  for(const [k,v] of Object.entries(attrs)) e.setAttribute(k,String(v));
  return e;
}
function finite(vals){return vals.filter(Number.isFinite)}
function extent(vals){const a=finite(vals); if(!a.length)return [0,1]; let mn=Math.min(...a),mx=Math.max(...a); if(mn===mx){mn-=1;mx+=1;} return [mn,mx];}
function fmt(x){const ax=Math.abs(x); if(ax>=1000)return x.toLocaleString(undefined,{maximumFractionDigits:0}); if(ax>=10)return x.toFixed(1); if(ax>=1)return x.toFixed(2); return x.toFixed(3);}

export function lineChart(container, series, opts={}) {
  const W=760,H=360,m={l:58,r:20,t:24,b:48}; container.innerHTML='';
  const svg=el('svg',{viewBox:`0 0 ${W} ${H}`,role:'img','aria-label':opts.ariaLabel||'Chart'}); svg.classList.add('chart-svg');
  const xs=series.flatMap(s=>s.x), ys=series.flatMap(s=>s.y);
  let [xmin,xmax]=opts.xDomain||extent(xs),[ymin,ymax]=opts.yDomain||extent(ys); const py=0.08*(ymax-ymin);ymin-=py;ymax+=py;
  const X=x=>m.l+(x-xmin)/(xmax-xmin)*(W-m.l-m.r),Y=y=>H-m.b-(y-ymin)/(ymax-ymin)*(H-m.t-m.b);
  const grid=el('g',{class:'chart-grid'}); svg.appendChild(grid);
  for(const t of linspace(xmin,xmax,5)){const xx=X(t);grid.appendChild(el('line',{x1:xx,y1:m.t,x2:xx,y2:H-m.b}));const tx=el('text',{x:xx,y:H-17,'text-anchor':'middle'});tx.textContent=fmt(t);svg.appendChild(tx);}
  for(const t of linspace(ymin,ymax,5)){const yy=Y(t);grid.appendChild(el('line',{x1:m.l,y1:yy,x2:W-m.r,y2:yy}));const tx=el('text',{x:m.l-9,y:yy+4,'text-anchor':'end'});tx.textContent=fmt(t);svg.appendChild(tx);}
  svg.appendChild(el('line',{x1:m.l,y1:H-m.b,x2:W-m.r,y2:H-m.b,class:'axis'}));svg.appendChild(el('line',{x1:m.l,y1:m.t,x2:m.l,y2:H-m.b,class:'axis'}));
  if(ymin<0&&ymax>0)svg.appendChild(el('line',{x1:m.l,y1:Y(0),x2:W-m.r,y2:Y(0),class:'zero-line'}));
  series.forEach((s,idx)=>{let d='';s.x.forEach((x,i)=>{const y=s.y[i];if(!Number.isFinite(x)||!Number.isFinite(y))return;d+=(d?'L':'M')+`${X(x).toFixed(2)},${Y(y).toFixed(2)} `;});const p=el('path',{d,fill:'none',class:`series series-${idx}`});svg.appendChild(p);});
  if(opts.xLabel){const t=el('text',{x:(m.l+W-m.r)/2,y:H-2,'text-anchor':'middle',class:'axis-label'});t.textContent=opts.xLabel;svg.appendChild(t);} if(opts.yLabel){const t=el('text',{x:14,y:(m.t+H-m.b)/2,transform:`rotate(-90 14 ${(m.t+H-m.b)/2})`,'text-anchor':'middle',class:'axis-label'});t.textContent=opts.yLabel;svg.appendChild(t);}
  container.appendChild(svg);
  const legend=document.createElement('div');legend.className='chart-legend';series.forEach((s,i)=>{const item=document.createElement('span');item.innerHTML=`<i class="legend-dot series-bg-${i}"></i>${s.name||`Series ${i+1}`}`;legend.appendChild(item)});container.appendChild(legend);
}

export function histogram(container, values, bins=36, opts={}) {
  const vals=finite(Array.from(values)); if(!vals.length){container.innerHTML='<div class="empty">No data.</div>';return;}
  let [mn,mx]=extent(vals);const h=(mx-mn)/bins,counts=Array(bins).fill(0);for(const v of vals){let i=Math.floor((v-mn)/h);if(i===bins)i--;counts[Math.max(0,Math.min(bins-1,i))]++;}
  const x=counts.map((_,i)=>mn+(i+0.5)*h); barChart(container,x,counts,{...opts,xLabel:opts.xLabel||'Value',yLabel:opts.yLabel||'Frequency'});
}

export function barChart(container, x, y, opts={}) {
  const W=760,H=340,m={l:58,r:20,t:24,b:48};container.innerHTML='';const svg=el('svg',{viewBox:`0 0 ${W} ${H}`});svg.classList.add('chart-svg');const [xmin,xmax]=extent(x),[,ymax0]=extent([0,...y]),ymax=ymax0*1.08||1;const X=z=>m.l+(z-xmin)/(xmax-xmin)*(W-m.l-m.r),Y=z=>H-m.b-z/ymax*(H-m.t-m.b),bw=(W-m.l-m.r)/x.length*0.82;
  const grid=el('g',{class:'chart-grid'});svg.appendChild(grid);for(const t of linspace(0,ymax,5)){const yy=Y(t);grid.appendChild(el('line',{x1:m.l,y1:yy,x2:W-m.r,y2:yy}));const tx=el('text',{x:m.l-8,y:yy+4,'text-anchor':'end'});tx.textContent=fmt(t);svg.appendChild(tx)}
  y.forEach((v,i)=>svg.appendChild(el('rect',{x:X(x[i])-bw/2,y:Y(v),width:bw,height:H-m.b-Y(v),class:'bar'})));svg.appendChild(el('line',{x1:m.l,y1:H-m.b,x2:W-m.r,y2:H-m.b,class:'axis'}));
  for(const t of linspace(xmin,xmax,5)){const xx=X(t);const tx=el('text',{x:xx,y:H-18,'text-anchor':'middle'});tx.textContent=fmt(t);svg.appendChild(tx)}
  container.appendChild(svg);
}

export function heatmap(container, rows, cols, values, opts={}) {
  const W=760,H=380,m={l:70,r:80,t:24,b:58};container.innerHTML='';const svg=el('svg',{viewBox:`0 0 ${W} ${H}`});svg.classList.add('chart-svg');const flat=values.flat().filter(Number.isFinite),mn=Math.min(...flat),mx=Math.max(...flat);const cw=(W-m.l-m.r)/cols.length,ch=(H-m.t-m.b)/rows.length;
  function color(v){const z=(v-mn)/(mx-mn||1);const hue=235-190*z;return `hsl(${hue} 68% ${62-12*z}%)`;}
  values.forEach((row,i)=>row.forEach((v,j)=>{const r=el('rect',{x:m.l+j*cw,y:m.t+i*ch,width:cw+0.5,height:ch+0.5,fill:color(v)});const title=document.createElementNS('http://www.w3.org/2000/svg','title');title.textContent=`${opts.rowLabel||'T'}=${rows[i]}, ${opts.colLabel||'K'}=${cols[j]}: ${fmt(v)}`;r.appendChild(title);svg.appendChild(r)}));
  cols.forEach((c,j)=>{if(j%(Math.ceil(cols.length/7))===0||j===cols.length-1){const t=el('text',{x:m.l+(j+0.5)*cw,y:H-24,'text-anchor':'middle'});t.textContent=fmt(c);svg.appendChild(t)}});rows.forEach((r,i)=>{const t=el('text',{x:m.l-10,y:m.t+(i+0.5)*ch+4,'text-anchor':'end'});t.textContent=fmt(r);svg.appendChild(t)});
  const grad=el('defs');const lg=el('linearGradient',{id:'hmgrad',x1:'0%',x2:'0%',y1:'100%',y2:'0%'});for(let i=0;i<=10;i++)lg.appendChild(el('stop',{offset:`${i*10}%`,'stop-color':color(mn+(mx-mn)*i/10)}));grad.appendChild(lg);svg.appendChild(grad);svg.appendChild(el('rect',{x:W-48,y:m.t,width:14,height:H-m.t-m.b,fill:'url(#hmgrad)'}));
  const lo=el('text',{x:W-30,y:H-m.b,'text-anchor':'start'});lo.textContent=fmt(mn);svg.appendChild(lo);const hi=el('text',{x:W-30,y:m.t+8,'text-anchor':'start'});hi.textContent=fmt(mx);svg.appendChild(hi);container.appendChild(svg);
}

export function binomialTreeChart(container, result, maxSteps=5) {
  const n=Math.min(result.stockTree.length-1,maxSteps),W=820,H=440,pad=46;container.innerHTML='';const svg=el('svg',{viewBox:`0 0 ${W} ${H}`});svg.classList.add('chart-svg','tree-svg');
  const xpos=i=>pad+i*(W-2*pad)/Math.max(1,n), ypos=(i,j)=>H/2+(i/2-j)*(H-2*pad)/Math.max(1,n+1);
  for(let i=0;i<n;i++)for(let j=0;j<=i;j++){const x=xpos(i),y=ypos(i,j);[[j,xpos(i+1),ypos(i+1,j)],[j+1,xpos(i+1),ypos(i+1,j+1)]].forEach(([,xx,yy])=>svg.appendChild(el('line',{x1:x,y1:y,x2:xx,y2:yy,class:'tree-edge'})));}
  for(let i=0;i<=n;i++)for(let j=0;j<=i;j++){const x=xpos(i),y=ypos(i,j),exercise=result.exerciseTree[i]?.[j];svg.appendChild(el(exercise?'rect':'circle',exercise?{x:x-7,y:y-7,width:14,height:14,rx:2,class:'tree-node exercise'}:{cx:x,cy:y,r:6,class:'tree-node'}));const t=el('text',{x:x+10,y:y-5,class:'tree-text'});t.textContent=`S ${result.stockTree[i][j].toFixed(2)}`;svg.appendChild(t);const v=el('text',{x:x+10,y:y+10,class:'tree-text secondary'});v.textContent=`V ${result.optionTree[i][j].toFixed(3)}`;svg.appendChild(v);}
  container.appendChild(svg);
}
