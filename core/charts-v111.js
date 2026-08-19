export * from './charts.js';
function el(tag,attrs={}){const x=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const[k,v]of Object.entries(attrs))x.setAttribute(k,v);return x;}
export function binomialTreeChart(container,result,maxSteps=5){
  const n=Math.min(result.stockTree.length-1,maxSteps),W=820,H=440,pad=46;container.innerHTML='';const svg=el('svg',{viewBox:`0 0 ${W} ${H}`});svg.classList.add('chart-svg','tree-svg');
  const xpos=i=>pad+i*(W-2*pad)/Math.max(1,n),ypos=(i,j)=>H/2+(i/2-j)*(H-2*pad)/Math.max(1,n+1);
  for(let i=0;i<n;i++)for(let j=0;j<=i;j++){const x=xpos(i),y=ypos(i,j);[[j,xpos(i+1),ypos(i+1,j)],[j+1,xpos(i+1),ypos(i+1,j+1)]].forEach(([,xx,yy])=>svg.appendChild(el('line',{x1:x,y1:y,x2:xx,y2:yy,class:'tree-edge'})));}
  for(let i=0;i<=n;i++)for(let j=0;j<=i;j++){
    const x=xpos(i),y=ypos(i,j),exercise=result.exerciseTree[i]?.[j];const node=exercise?el('polygon',{points:`${x},${y-8} ${x+8},${y} ${x},${y+8} ${x-8},${y}`,class:'tree-node exercise'}):el('circle',{cx:x,cy:y,r:6,class:'tree-node'});
    const cont=result.continuationTree[i]?.[j],intr=result.intrinsicTree[i]?.[j],delta=result.deltaTree[i]?.[j],bond=result.bondTree[i]?.[j],title=document.createElementNS('http://www.w3.org/2000/svg','title');
    const parts=[`Step i=${i}, node j=${j}`,`S=${result.stockTree[i][j].toFixed(6)}`,`V=${result.optionTree[i][j].toFixed(6)}`];if(Number.isFinite(cont))parts.push(`Continuation=${cont.toFixed(6)}`);if(Number.isFinite(intr))parts.push(`Intrinsic=${intr.toFixed(6)}`);if(Number.isFinite(delta))parts.push(`Delta=${delta.toFixed(6)}`);if(Number.isFinite(bond))parts.push(`B=${bond.toFixed(6)}`);parts.push(exercise?'Decision=Exercise':'Decision=Continue');title.textContent=parts.join(' · ');node.appendChild(title);svg.appendChild(node);
    const st=el('text',{x:x+10,y:y-5,class:'tree-text'});st.textContent=`S ${result.stockTree[i][j].toFixed(2)}`;svg.appendChild(st);const ov=el('text',{x:x+10,y:y+10,class:'tree-text secondary'});ov.textContent=`V ${result.optionTree[i][j].toFixed(3)}`;svg.appendChild(ov);
  }
  container.appendChild(svg);
}
