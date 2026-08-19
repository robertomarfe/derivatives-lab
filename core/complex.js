export class Complex {
  constructor(re = 0, im = 0) { this.re = re; this.im = im; }
  static of(x) { return x instanceof Complex ? x : new Complex(x, 0); }
  add(z) { z = Complex.of(z); return new Complex(this.re + z.re, this.im + z.im); }
  sub(z) { z = Complex.of(z); return new Complex(this.re - z.re, this.im - z.im); }
  mul(z) { z = Complex.of(z); return new Complex(this.re * z.re - this.im * z.im, this.re * z.im + this.im * z.re); }
  div(z) { z = Complex.of(z); const d = z.re * z.re + z.im * z.im; return new Complex((this.re * z.re + this.im * z.im) / d, (this.im * z.re - this.re * z.im) / d); }
  neg() { return new Complex(-this.re, -this.im); }
  scale(a) { return new Complex(this.re * a, this.im * a); }
  abs() { return Math.hypot(this.re, this.im); }
  exp() { const e = Math.exp(this.re); return new Complex(e * Math.cos(this.im), e * Math.sin(this.im)); }
  log() { return new Complex(Math.log(this.abs()), Math.atan2(this.im, this.re)); }
  sqrt() {
    const x = this.re, y = this.im;
    if (y === 0) return x >= 0 ? new Complex(Math.sqrt(x), 0) : new Complex(0, Math.sqrt(-x));
    const r = Math.hypot(x, y);
    let a, b;
    if (x >= 0) {
      a = Math.sqrt((r + x) / 2);
      b = y / (2 * a);
    } else {
      b = Math.sign(y) * Math.sqrt((r - x) / 2);
      a = y / (2 * b);
    }
    return new Complex(a, b);
  }
}
export const I = new Complex(0, 1);
