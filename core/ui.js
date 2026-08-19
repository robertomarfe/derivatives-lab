import { mathBlock, richText, escapeHtml } from './math.js';

export { escapeHtml, richText, mathBlock };
export function html(strings,...vals){return strings.reduce((s,x,i)=>s+x+(i<vals.length?vals[i]:''),'')}
export function qs(sel,root=document){return root.querySelector(sel)}
export function qsa(sel,root=document){return [...root.querySelectorAll(sel)]}
export function money(x,d=2){return Number(x).toLocaleString(undefined,{minimumFractionDigits:d,maximumFractionDigits:d})}
export function pct(x,d=2){return `${(100*x).toFixed(d)}%`}
export function num(x,d=4){return Number(x).toLocaleString(undefined,{maximumFractionDigits:d})}
export function setMain(htmlText){const root=document.querySelector('#module-root');root.innerHTML=htmlText;root.focus?.({preventScroll:true})}
export function metric(label,value,sub=''){return `<div class="metric"><div class="metric-label">${richText(label)}</div><div class="metric-value">${value}</div>${sub?`<div class="metric-sub">${richText(sub)}</div>`:''}</div>`}
export function theoryCard(sub){
  const fs=(sub.formulas||[]).map(f=>mathBlock(f)).join('');
  return `<section class="theory-card" aria-label="Theory"><div class="theory-title">Theory</div><p>${richText(sub.theory)}</p><p class="howto"><strong>How to use this section.</strong> ${richText(sub.how_to)}</p>${fs?`<details><summary>Key formula(s)</summary><div class="formula-list">${fs}</div></details>`:''}</section>`;
}
export function field(label,id,value,opts={}){
  const step=opts.step??'any',min=opts.min??'',max=opts.max??'',suffix=opts.suffix?`<span class="field-suffix">${escapeHtml(opts.suffix)}</span>`:'';
  const inputMode=opts.inputmode??'decimal';
  return `<label class="field" for="${id}"><span>${richText(label)}</span><div class="field-row"><input id="${id}" type="number" value="${value}" step="${step}" min="${min}" max="${max}" inputmode="${inputMode}" aria-describedby="${id}-error">${suffix}</div><span id="${id}-error" class="field-error" aria-live="polite"></span></label>`;
}
export function rangeField(label,id,value,min,max,step,suffix=''){return `<label class="field range-field" for="${id}"><span>${richText(label)}</span><div class="range-wrap"><input id="${id}" type="range" value="${value}" min="${min}" max="${max}" step="${step}"><output id="${id}-out" for="${id}">${value}${suffix}</output></div></label>`}
export function selectField(label,id,options,value){return `<label class="field" for="${id}"><span>${richText(label)}</span><select id="${id}">${options.map(o=>`<option ${o===value?'selected':''}>${escapeHtml(o)}</option>`).join('')}</select></label>`}
export function tabs(items,active,groupId='module'){
  const panelId=`tabpanel-${groupId}`;
  return `<div class="tabs" role="tablist" aria-label="Laboratory sections">${items.map(([id,label])=>`<button id="tab-${groupId}-${id}" class="tab ${id===active?'active':''}" role="tab" aria-selected="${id===active?'true':'false'}" aria-controls="${panelId}" tabindex="${id===active?'0':'-1'}" data-tab="${id}">${escapeHtml(label)}</button>`).join('')}</div>`;
}
let tableCounter=0;
export function table(headers,rows,caption=''){
  const capId=caption?`table-caption-${++tableCounter}`:'';
  return `<div class="table-scroll" tabindex="0">${caption?`<div class="sr-only" id="${capId}">${escapeHtml(caption)}</div>`:''}<table${caption?` aria-describedby="${capId}"`:''}><thead><tr>${headers.map(h=>`<th scope="col">${richText(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(v=>`<td>${escapeHtml(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
export function downloadCsv(filename,headers,rows){const data=[headers,...rows].map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(',')).join('\n');const blob=new Blob([data],{type:'text/csv'}),url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
export function bindRange(id,cb){const e=qs(`#${id}`),o=qs(`#${id}-out`);if(!e)return;e.addEventListener('input',()=>{if(o)o.value=e.value;cb?.()})}
export function getn(id){const el=qs(`#${id}`);if(!el)throw new Error(`Input ${id} is unavailable.`);const x=Number(el.value);if(!Number.isFinite(x))throw new Error(`${el.closest('label')?.querySelector(':scope > span')?.textContent||id} must be a finite number.`);return x}
export function getv(id){const el=qs(`#${id}`);if(!el)throw new Error(`Input ${id} is unavailable.`);return el.value}
export function toast(msg,kind='ok'){const e=document.createElement('div');e.className=`toast ${kind}`;e.setAttribute('role','status');e.setAttribute('aria-live','polite');e.textContent=msg;document.body.appendChild(e);setTimeout(()=>e.remove(),2600)}
export function moduleHero(m){return `<header class="module-hero"><div class="eyebrow">Laboratory ${m.number} · Derivatives</div><h1>${escapeHtml(m.title)}</h1><p>${richText(m.subtitle)}</p><div class="chips">${m.objectives.map(x=>`<span>${richText(x)}</span>`).join('')}</div><div class="source-anchor">Lecture-note anchor: ${escapeHtml(m.source)}</div></header>`}
export function interpretation(text){return `<div class="interpretation"><strong>Interpretation.</strong> ${richText(text)}</div>`}
export function errorBox(text){return `<div class="error-box" role="alert">${escapeHtml(text)}</div>`}
