export const SQRT2PI = Math.sqrt(2 * Math.PI);

export function normPdf(x) {
  return Math.exp(-0.5 * x * x) / SQRT2PI;
}

// Abramowitz-Stegun-style erf approximation; max error is ample for teaching/pricing UI.
export function erf(x) {
  const sign = x < 0 ? -1 : 1;
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const ax = Math.abs(x);
  const t = 1 / (1 + p * ax);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-ax * ax);
  return sign * y;
}

export function normCdf(x) {
  return 0.5 * (1 + erf(x / Math.SQRT2));
}

export function mean(xs) {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

export function sampleStd(xs) {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  let s = 0;
  for (const x of xs) s += (x - m) ** 2;
  return Math.sqrt(s / (xs.length - 1));
}

export function quantile(xs, q) {
  if (!xs.length) return NaN;
  const a = Array.from(xs).sort((x, y) => x - y);
  const pos = (a.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  if (lo === hi) return a[lo];
  const w = pos - lo;
  return a[lo] * (1 - w) + a[hi] * w;
}

export function linspace(a, b, n) {
  if (n <= 1) return [a];
  const out = new Array(n);
  const h = (b - a) / (n - 1);
  for (let i = 0; i < n; i++) out[i] = a + i * h;
  return out;
}

export function geomspace(a, b, n) {
  const la = Math.log(a), lb = Math.log(b);
  return linspace(la, lb, n).map(Math.exp);
}

export function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }

export function adaptiveSimpson(f, a, b, tol = 1e-7, maxDepth = 18) {
  const fa = f(a), fb = f(b), c = 0.5 * (a + b), fc = f(c);
  const whole = (b - a) * (fa + 4 * fc + fb) / 6;
  function rec(a0, b0, fa0, fb0, fc0, whole0, depth) {
    const c0 = 0.5 * (a0 + b0);
    const l = 0.5 * (a0 + c0), r = 0.5 * (c0 + b0);
    const fl = f(l), fr = f(r);
    const left = (c0 - a0) * (fa0 + 4 * fl + fc0) / 6;
    const right = (b0 - c0) * (fc0 + 4 * fr + fb0) / 6;
    const delta = left + right - whole0;
    if (depth <= 0 || Math.abs(delta) <= 15 * tol) return left + right + delta / 15;
    return rec(a0, c0, fa0, fc0, fl, left, depth - 1) + rec(c0, b0, fc0, fb0, fr, right, depth - 1);
  }
  return rec(a, b, fa, fb, fc, whole, maxDepth);
}

// Lanczos log-Gamma. Stable for the positive arguments used by Poisson PMFs.
export function logGamma(z) {
  if (!(z > 0) || !Number.isFinite(z)) throw new Error('logGamma requires a positive finite argument.');
  const p=[
    0.99999999999980993,
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.9843695780195716e-6,
    1.5056327351493116e-7,
  ];
  if (z < 0.5) return Math.log(Math.PI) - Math.log(Math.sin(Math.PI*z)) - logGamma(1-z);
  z -= 1;
  let x=p[0];
  for(let i=1;i<p.length;i++) x += p[i]/(z+i);
  const t=z+7.5;
  return 0.5*Math.log(2*Math.PI)+(z+0.5)*Math.log(t)-t+Math.log(x);
}
