import katex from '../vendor/katex/katex.mjs';

const KATEX_OPTIONS = Object.freeze({
  throwOnError: false,
  strict: 'warn',
  trust: false,
  output: 'htmlAndMathml',
});

export function escapeHtml(s){
  return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

export function mathHtml(tex, displayMode=false){
  return katex.renderToString(String(tex), {...KATEX_OPTIONS, displayMode});
}

/**
 * Render trusted course prose containing inline math delimited by $...$ or \(...\).
 * Everything outside math delimiters is HTML-escaped; KaTeX trust remains disabled.
 */
export function richText(text){
  const src=String(text??'');
  const re=/\\\((.+?)\\\)|\$([^$\n]+?)\$/g;
  let out='', last=0, m;
  while((m=re.exec(src))){
    out+=escapeHtml(src.slice(last,m.index));
    out+=`<span class="math-inline">${mathHtml(m[1]??m[2],false)}</span>`;
    last=re.lastIndex;
  }
  out+=escapeHtml(src.slice(last));
  return out;
}

export function mathBlock(tex){
  return `<div class="formula math-block" data-tex="${escapeHtml(tex)}">${mathHtml(tex,true)}</div>`;
}
