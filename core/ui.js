export function html(strings,...vals){return strings.reduce((s,x,i)=>s+x+(i<vals.length?vals[i]:''),'')}
export function qs(sel,root=document){return root.querySelector(sel)}
export function qsa(sel,root=document){return [...root.querySelectorAll(sel)]}
export function money(x,d=2){return Number(x).toLocaleString(undefined,{minimumFractionDigits:d,maximumFractionDigits:d})}
export function pct(x,d=2){return `${(100*x).toFixed(d)}%`}
export function num(x,d=4){return Number(x).toLocaleString(undefined,{maximumFractionDigits:d})}
export function escapeHtml(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
export function setMain(htmlText){document.querySelector('#module-root').innerHTML=htmlText}
export function metric(label,value,sub=''){return `<div class="metric"><div class="metric-label">${escapeHtml(label)}</div><div class="metric-value">${value}</div>${sub?`<div class="metric-sub">${escapeHtml(sub)}</div>`:''}</div>`}
export function theoryCard(sub){const fs=(sub.formulas||[]).map(f=>`<div class="formula">${escapeHtml(f)}</div>`).join('');return `<section class="theory-card"><div class="theory-title">Theory</div><p>${escapeHtml(sub.theory)}</p><p class="howto"><strong>How to use this section.</strong> ${escapeHtml(sub.how_to)}</p>${fs?`<details><summary>Key formula(s)</summary>${fs}</details>`:''}</section>`}
export function field(label,id,value,opts={}){const step=opts.step??'any',min=opts.min??'',max=opts.max??'',suffix=opts.suffix?`<span class="field-suffix">${escapeHtml(opts.suffix)}</span>`:'';return `<label class="field"><span>${escapeHtml(label)}</span><div class="field-row"><input id="${id}" type="number" value="${value}" step="${step}" min="${min}" max="${max}">${suffix}</div></label>`}
export function rangeField(label,id,value,min,max,step,suffix=''){return `<label class="field range-field"><span>${escapeHtml(label)}</span><div class="range-wrap"><input id="${id}" type="range" value="${value}" min="${min}" max="${max}" step="${step}"><output id="${id}-out">${value}${suffix}</output></div></label>`}
export function selectField(label,id,options,value){return `<label class="field"><span>${escapeHtml(label)}</span><select id="${id}">${options.map(o=>`<option ${o===value?'selected':''}>${escapeHtml(o)}</option>`).join('')}</select></label>`}
export function tabs(items,active){return `<div class="tabs">${items.map(([id,label])=>`<button class="tab ${id===active?'active':''}" data-tab="${id}">${escapeHtml(label)}</button>`).join('')}</div>`}
export function table(headers,rows){return `<div class="table-scroll"><table><thead><tr>${headers.map(h=>`<th>${escapeHtml(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(v=>`<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`}
export function downloadCsv(filename,headers,rows){const data=[headers,...rows].map(r=>r.map(v=>`"${String(v).replaceAll('"','""')}"`).join(',')).join('\n');const blob=new Blob([data],{type:'text/csv'}),url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
export function bindRange(id,cb){const e=qs(`#${id}`),o=qs(`#${id}-out`);if(!e)return;e.addEventListener('input',()=>{if(o)o.value=e.value;cb?.()})}
export function getn(id){return Number(qs(`#${id}`).value)}
export function getv(id){return qs(`#${id}`).value}
export function toast(msg,kind='ok'){const e=document.createElement('div');e.className=`toast ${kind}`;e.textContent=msg;document.body.appendChild(e);setTimeout(()=>e.remove(),2600)}
export function moduleHero(m){return `<header class="module-hero"><div class="eyebrow">Laboratory ${m.number} · Derivatives</div><h1>${escapeHtml(m.title)}</h1><p>${escapeHtml(m.subtitle)}</p><div class="chips">${m.objectives.map(x=>`<span>${escapeHtml(x)}</span>`).join('')}</div><div class="source-anchor">Lecture-note anchor: ${escapeHtml(m.source)}</div></header>`}
export function interpretation(text){return `<div class="interpretation"><strong>Interpretation.</strong> ${escapeHtml(text)}</div>`}
export function errorBox(text){return `<div class="error-box">${escapeHtml(text)}</div>`}
