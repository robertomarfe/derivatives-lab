import { CONTENT } from './content.js';
import { moduleHero, setMain, escapeHtml, richText, toast, errorBox } from './core/ui.js';
import { renderModule, resetModuleState } from './modules/renderers.js';
import { terminateWorker } from './core/worker-client.js';

const MODULE_ORDER=['forward','futures','strategies','binomial','black_scholes','hedging','implied_vol','heston','merton_jump','merton_credit'];
const LABELS={forward:'1. Forward Strategies',futures:'2. Futures: Margins & Hedging',strategies:'3. Option Strategy Builder',binomial:'4. Binomial Option Lab',black_scholes:'5. Black-Scholes & Monte Carlo',hedging:'6. Delta & Gamma Hedging',implied_vol:'7. Implied Volatility & VIX',heston:'8. Heston Model',merton_jump:'9. Merton Jump Diffusion',merton_credit:'10. Merton Credit Risk'};
let current=(location.hash||'#home').slice(1), mode=localStorage.getItem('dl-mode')||'Explore';
if(current!=='home'&&!MODULE_ORDER.includes(current))current='home';
if(!['Explore','Step-by-step','Challenge'].includes(mode))mode='Explore';
let stepIndex={};

function buildNav(){
  const nav=document.querySelector('#nav-list');
  nav.innerHTML=`<button class="nav-item ${current==='home'?'active':''}" data-id="home" ${current==='home'?'aria-current="page"':''}><span class="nav-num">⌂</span><span>Home</span></button>`+MODULE_ORDER.map(id=>`<button class="nav-item ${current===id?'active':''}" data-id="${id}" ${current===id?'aria-current="page"':''}><span class="nav-num">${CONTENT.modules[id].number}</span><span>${escapeHtml(CONTENT.modules[id].title)}</span></button>`).join('');
  nav.querySelectorAll('.nav-item').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.id)));
}
function closeNav(){document.body.classList.remove('nav-open');const b=document.querySelector('#menu-btn');b?.setAttribute('aria-expanded','false');b?.setAttribute('aria-label','Open navigation');}
function openNav(){document.body.classList.add('nav-open');const b=document.querySelector('#menu-btn');b?.setAttribute('aria-expanded','true');b?.setAttribute('aria-label','Close navigation');setTimeout(()=>document.querySelector('#nav-list .nav-item')?.focus(),0);}
function navigate(id){current=id;location.hash=id;closeNav();render();window.scrollTo({top:0,behavior:'smooth'});}

function modePanel(id){
  const m=CONTENT.modules[id];
  if(mode==='Explore')return `<section class="mode-panel explore"><div><strong>Explore.</strong> Change inputs freely and connect the numerical result to the lecture-note formulas.</div></section>`;
  if(mode==='Step-by-step'){
    const idx=stepIndex[id]||0, steps=m.steps;
    return `<section class="mode-panel step"><div class="mode-head"><div><strong>Step-by-step.</strong> Follow the lecture logic in sequence.</div><div class="step-actions"><button id="step-prev" aria-label="Previous step" ${idx===0?'disabled':''}>←</button><span>${idx+1}/${steps.length}</span><button id="step-next" aria-label="Next step" ${idx===steps.length-1?'disabled':''}>→</button></div></div><div class="step-card"><span class="step-no">${idx+1}</span><div><strong>${richText(steps[idx][0])}</strong><p>${richText(steps[idx][1])}</p></div></div></section>`;
  }
  const cs=CONTENT.challenges[id];
  return `<section class="mode-panel challenge"><div><strong>Challenge.</strong> Answer before opening the hint or solution.</div><div class="challenge-grid">${cs.map(c=>challengeCard(c)).join('')}</div></section>`;
}
function challengeCard(c){
  const input=c.kind==='choice'?`<select id="ch-${c.id}" aria-label="Answer for ${escapeHtml(c.title)}"><option value="">Choose…</option>${c.options.map(o=>`<option>${escapeHtml(o)}</option>`).join('')}</select>`:`<input id="ch-${c.id}" type="number" step="any" inputmode="decimal" aria-label="Answer for ${escapeHtml(c.title)}" placeholder="Your answer${c.unit?` (${escapeHtml(c.unit)})`:''}">`;
  return `<article class="challenge-card"><div class="challenge-title">${richText(c.title)}</div><p>${richText(c.prompt)}</p>${input}<div class="challenge-actions"><button class="primary" data-check="${c.id}">Check answer</button><details><summary>Hint</summary><p>${richText(c.hint)}</p></details><details><summary>Solution</summary><p>${richText(c.solution)}</p></details></div><div id="fb-${c.id}" class="challenge-feedback" aria-live="polite"></div><div class="source-mini">${escapeHtml(c.source_anchor)}</div></article>`;
}
function bindModePanel(id){
  if(mode==='Step-by-step'){
    document.querySelector('#step-prev')?.addEventListener('click',()=>{stepIndex[id]=Math.max(0,(stepIndex[id]||0)-1);render()});
    document.querySelector('#step-next')?.addEventListener('click',()=>{stepIndex[id]=Math.min(CONTENT.modules[id].steps.length-1,(stepIndex[id]||0)+1);render()});
  }
  if(mode==='Challenge') for(const c of CONTENT.challenges[id]) document.querySelector(`[data-check="${c.id}"]`)?.addEventListener('click',()=>{
    const raw=document.querySelector(`#ch-${c.id}`).value;let ok=false;
    if(c.kind==='choice')ok=raw.trim()===String(c.answer).trim();
    else{const x=Number(raw),t=Number(c.answer);ok=Number.isFinite(x)&&Math.abs(x-t)<=c.tolerance;}
    const fb=document.querySelector(`#fb-${c.id}`);fb.className=`challenge-feedback ${ok?'ok':'bad'}`;fb.textContent=ok?'Correct.':'Not yet. Re-check the notation and use the hint if useful.';
  });
}

function home(){
  setMain(`<section class="home-hero"><div class="eyebrow">Master in Quantitative Finance and Insurance · Interactive course companion</div><h1>Derivatives Lab</h1><p>A browser-based interactive laboratory for the Derivatives course taught by Roberto Marfè.<br>Each module is grounded in the course lecture notes. Three navigation modes are available: Explore, Step-by-step, and Challenge. No installation, no Python runtime, and no server-side computation are required.</p><div class="home-badges"><span>10 laboratories</span><span>Explore / Step-by-step / Challenge</span><span>Desktop · Tablet · Mobile</span><span>Runs client-side</span></div></section><section class="home-section"><div class="section-title"><div><h2>Choose a laboratory</h2><p>Each module uses the notation, terminology, and economic framing of the lecture notes.</p></div></div><div class="lab-grid">${MODULE_ORDER.map(id=>{const m=CONTENT.modules[id];return `<button class="lab-card" data-home-lab="${id}"><span class="lab-number">${m.number}</span><div><h3>${escapeHtml(m.title)}</h3><p>${richText(m.subtitle)}</p><span class="open-label">Open laboratory →</span></div></button>`}).join('')}</div></section><section class="home-section validation-strip"><div><strong>Reference implementation</strong><p>The web formulas are regression-tested against the validated Python v0.6 implementation and the lecture benchmarks.</p></div><div><strong>Zero-backend architecture</strong><p>All calculations run in the student's browser; simulation-heavy tasks use Web Workers.</p></div><div><strong>Portable static build</strong><p>The same files can be hosted on any static host without a paid database, server, or API.</p></div></section>`);
  document.querySelectorAll('[data-home-lab]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.homeLab)));
}

function render(){
  try{
    buildNav();
    document.querySelectorAll('[data-mode]').forEach(b=>{
      const active=b.dataset.mode===mode;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));
      b.onclick=()=>{mode=b.dataset.mode;localStorage.setItem('dl-mode',mode);render();};
    });
    if(current==='home'){home();document.title='Derivatives Lab';return;}
    const m=CONTENT.modules[current];document.title=`${m.number}. ${m.title} · Derivatives Lab`;
    setMain(`${moduleHero(m)}${modePanel(current)}<div id="module-body"></div>`);
    bindModePanel(current);renderModule(current,document.querySelector('#module-body'));
  }catch(err){
    console.error(err);setMain(`<section class="fatal-card"><h1>Derivatives Lab</h1>${errorBox(err?.message||String(err))}<p>Please reset the current module or reload the page. The error has not changed any saved course data.</p></section>`);
  }
}

window.addEventListener('hashchange',()=>{current=(location.hash||'#home').slice(1);if(current!=='home'&&!MODULE_ORDER.includes(current))current='home';render()});
const menuBtn=document.querySelector('#menu-btn');menuBtn.setAttribute('aria-expanded','false');menuBtn.setAttribute('aria-controls','nav-list');menuBtn.addEventListener('click',()=>document.body.classList.contains('nav-open')?closeNav():openNav());
document.querySelector('#close-nav').addEventListener('click',closeNav);
document.querySelector('#scrim').addEventListener('click',closeNav);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('nav-open')){closeNav();menuBtn.focus();}});
document.querySelector('#reset-btn').addEventListener('click',()=>{if(current!=='home'){resetModuleState(current);terminateWorker();}toast('Module inputs reset.');render();});
document.querySelector('#fullscreen-link').addEventListener('click',()=>{window.open(location.href,'_blank','noopener')});
window.addEventListener('unhandledrejection',e=>{console.error(e.reason);toast(e.reason?.message||'Unexpected asynchronous error.','error')});
render();

if('serviceWorker' in navigator && location.protocol.startsWith('http')){
  navigator.serviceWorker.register('./service-worker.js').then(reg=>reg.update()).catch(err=>console.warn('Service worker registration failed',err));
}
