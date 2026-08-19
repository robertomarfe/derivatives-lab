export function finite(name, x) {
  if (!Number.isFinite(x)) throw new Error(`${name} must be a finite number.`);
  return x;
}

export function positive(name, x) {
  finite(name, x);
  if (!(x > 0)) throw new Error(`${name} must be strictly positive.`);
  return x;
}

export function nonNegative(name, x) {
  finite(name, x);
  if (x < 0) throw new Error(`${name} must be non-negative.`);
  return x;
}

export function bounded(name, x, min, max, {openMin=false, openMax=false}={}) {
  finite(name, x);
  const lowOk = openMin ? x > min : x >= min;
  const highOk = openMax ? x < max : x <= max;
  if (!(lowOk && highOk)) {
    const left = openMin ? '(' : '[';
    const right = openMax ? ')' : ']';
    throw new Error(`${name} must lie in ${left}${min}, ${max}${right}.`);
  }
  return x;
}

export function probabilityLikeCorrelation(name, x) {
  return bounded(name, x, -1, 1);
}

export function positiveInteger(name, x) {
  positive(name, x);
  if (!Number.isInteger(x)) throw new Error(`${name} must be a positive integer.`);
  return x;
}

export function oneOf(name, x, values) {
  if (!values.includes(x)) throw new Error(`${name} must be one of: ${values.join(', ')}.`);
  return x;
}

export function finiteArray(name, xs, {minLength=1}={}) {
  if (!Array.isArray(xs) || xs.length < minLength) throw new Error(`${name} must contain at least ${minLength} observations.`);
  xs.forEach((x, i) => finite(`${name}[${i}]`, x));
  return xs;
}

export function nonNegativeArray(name, xs, opts={}) {
  finiteArray(name, xs, opts);
  xs.forEach((x, i) => nonNegative(`${name}[${i}]`, x));
  return xs;
}

export function positiveArray(name, xs, opts={}) {
  finiteArray(name, xs, opts);
  xs.forEach((x, i) => positive(`${name}[${i}]`, x));
  return xs;
}

export function sameLength(namedArrays) {
  const entries = Object.entries(namedArrays);
  if (!entries.length) return;
  const n = entries[0][1].length;
  for (const [name, xs] of entries) {
    if (!Array.isArray(xs) || xs.length !== n) throw new Error(`${name} must have length ${n}.`);
  }
}

export function strictlyIncreasing(name, xs) {
  finiteArray(name, xs, {minLength:2});
  for (let i=1;i<xs.length;i++) if (!(xs[i] > xs[i-1])) throw new Error(`${name} must be strictly increasing.`);
  return xs;
}

export function requireAtLeast(name, x, lower) {
  finite(name, x);
  if (x < lower) throw new Error(`${name} must be at least ${lower}.`);
  return x;
}
