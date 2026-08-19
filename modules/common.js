import { tabs, theoryCard, escapeHtml, errorBox } from '../core/ui.js';
import { renderModule } from './renderers.js';

export const activeTab={};
export const state={};
export function st(id,defaults){return state[id]??=(structuredClone(defaults));}

export function tabbed(moduleId,root,items,renderTab){
  const a=activeTab[moduleId]||items[0][0];activeTab[moduleId]=a;
  const panelId=`tabpanel-${moduleId}`;
  root.innerHTML=tabs(items,a,moduleId)+`<div id="${panelId}" role="tabpanel" aria-labelledby="tab-${moduleId}-${a}"></div>`;
  const tabButtons=[...root.querySelectorAll('[data-tab]')];
  const activate=id=>{activeTab[moduleId]=id;renderModule(moduleId,root)};
  tabButtons.forEach((b,i)=>{
    b.addEventListener('click',()=>activate(b.dataset.tab));
    b.addEventListener('keydown',e=>{
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
      e.preventDefault();let j=i;
      if(e.key==='ArrowLeft')j=(i-1+tabButtons.length)%tabButtons.length;
      if(e.key==='ArrowRight')j=(i+1)%tabButtons.length;
      if(e.key==='Home')j=0;if(e.key==='End')j=tabButtons.length-1;
      activate(tabButtons[j].dataset.tab);
      queueMicrotask(()=>root.querySelector(`[data-tab="${tabButtons[j].dataset.tab}"]`)?.focus());
    });
  });
  renderTab(a,root.querySelector(`#${panelId}`));
}
export function controlGrid(inner){return `<div class="control-grid">${inner}</div>`}
export function outputGrid(inner){return `<div class="metric-grid">${inner}</div>`}
export function chartBox(id,title=''){return `<section class="chart-card" aria-labelledby="${id}-title">${title?`<div id="${id}-title" class="chart-title">${escapeHtml(title)}</div>`:''}<div id="${id}" class="chart" role="img" tabindex="0" aria-label="${escapeHtml(title||'Chart')}"></div></section>`}
export function section(sub,controls,outputs,extra=''){return `${theoryCard(sub)}<div class="runtime-error-slot" aria-live="polite"></div><div class="lab-layout"><section class="panel"><div class="panel-title">Inputs</div>${controls}</section><section class="workspace">${outputs}${extra}</section></div>`}
export function bindNums(root,ids,fn){ids.forEach(id=>root.querySelector(`#${id}`)?.addEventListener('input',fn));}
export function loading(btn,on,label='Running…'){if(!btn)return;btn.disabled=on;btn.setAttribute('aria-busy',String(on));btn.dataset.old??=btn.textContent;btn.textContent=on?label:btn.dataset.old;}
export function showRuntimeError(root,err){let slot=root.querySelector('.runtime-error-slot');if(!slot){slot=document.createElement('div');slot.className='runtime-error-slot';slot.setAttribute('aria-live','polite');root.prepend(slot);}slot.innerHTML=errorBox(err?.message||String(err));}
export function clearRuntimeError(root){const slot=root.querySelector('.runtime-error-slot');if(slot)slot.innerHTML='';}
export function safeUpdate(root,fn){return (...args)=>{try{clearRuntimeError(root);return fn(...args);}catch(err){showRuntimeError(root,err);return undefined;}};}
export function safeAsync(root,fn){return async(...args)=>{try{clearRuntimeError(root);return await fn(...args);}catch(err){showRuntimeError(root,err);return undefined;}};}
export function adaptiveDomainFromStrikes(strikes,{fallback=100,pad=.45,minFloor=0}={}){
  const xs=strikes.filter(Number.isFinite).filter(x=>x>0);
  if(!xs.length)return [Math.max(minFloor,fallback*.45),fallback*1.55];
  const loK=Math.min(...xs),hiK=Math.max(...xs),span=Math.max(hiK-loK,.25*Math.max(hiK,1));
  const lo=Math.max(minFloor,loK-pad*span),hi=Math.max(hiK+pad*span,loK*1.5,hiK*1.15);
  return lo<hi?[lo,hi]:[Math.max(minFloor,loK*.5),loK*1.5];
}
