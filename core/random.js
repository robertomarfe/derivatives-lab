// Deterministic browser/Node RNG so experiments are reproducible across devices.
export function makeRng(seed = 12345) {
  let x = (seed >>> 0) || 1;
  let spare = null;
  function uniform() {
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    return ((x >>> 0) + 0.5) / 4294967296;
  }
  function normal() {
    if (spare !== null) { const z = spare; spare = null; return z; }
    let u = 0, v = 0;
    while (u <= Number.EPSILON) u = uniform();
    v = uniform();
    const r = Math.sqrt(-2 * Math.log(u));
    const theta = 2 * Math.PI * v;
    spare = r * Math.sin(theta);
    return r * Math.cos(theta);
  }
  function poisson(lambda) {
    if (lambda <= 0) return 0;
    if (lambda < 30) {
      const L = Math.exp(-lambda);
      let k = 0, p = 1;
      do { k++; p *= uniform(); } while (p > L);
      return k - 1;
    }
    let k;
    do { k = Math.floor(lambda + Math.sqrt(lambda) * normal() + 0.5); } while (k < 0);
    return k;
  }
  function gamma(shape) {
    if (shape <= 0) throw new Error('Gamma shape must be positive');
    if (shape < 1) {
      const u = uniform();
      return gamma(shape + 1) * Math.pow(u, 1 / shape);
    }
    const d = shape - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);
    while (true) {
      const z = normal();
      const v = Math.pow(1 + c * z, 3);
      if (v <= 0) continue;
      const u = uniform();
      if (u < 1 - 0.0331 * z ** 4) return d * v;
      if (Math.log(u) < 0.5 * z * z + d * (1 - v + Math.log(v))) return d * v;
    }
  }
  function chiSquare(df) { return 2 * gamma(df / 2); }
  function noncentralChiSquare(df, nonc) {
    const n = poisson(nonc / 2);
    return chiSquare(df + 2 * n);
  }
  return { uniform, normal, poisson, gamma, chiSquare, noncentralChiSquare };
}
