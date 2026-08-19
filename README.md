# Derivatives Lab

Interactive, lecture-grounded web application for a Master-level Derivatives course.

Current public release: **v1.1.1**.

The application contains ten laboratories covering forward strategies, futures margins and hedging, option strategies, binomial pricing, Black-Scholes and Monte Carlo, delta/gamma hedging, implied volatility and VIX, Heston, Merton jump diffusion, and Merton structural credit risk.

## Learning modes

- **Explore** — change parameters and inspect results interactively.
- **Step-by-step** — follow a guided sequence tied to the lecture logic.
- **Challenge** — solve short numerical or conceptual exercises with feedback.

## Architecture

This edition is fully client-side: HTML, CSS and JavaScript only. It requires no Python runtime, backend, database, paid API, or server-side computation. Heavier simulations use a Web Worker so the interface remains responsive.

The static distribution is also configured as a Progressive Web App and is responsive for desktop, tablet and mobile use. Mathematical notation is rendered locally with KaTeX/MathML; no runtime CDN is required.

## Validation

v1.1.1 is checked against the validated Python reference implementation and the lecture benchmarks. The current suite contains **54 numerical/content regression tests**, plus a real-click browser smoke test covering all ten modules, every submodule tab, error recovery, and responsive widths 390/768/820/1024/1440 px. A separate browser smoke test validates local KaTeX rendering for inline and display mathematics with MathML and local fonts.

The v1.1.1 corrective release also adds explicit Heston no-arbitrage numerical guards, exact Poisson sampling for the CIR noncentral-chi-square transition, robust high-intensity Merton Poisson-mixture pricing, expanded binomial node diagnostics, and the post-release pedagogical/UI corrections identified in the v1.1 audit.

## GitHub Pages

Publishing target: `https://robertomarfe.github.io/derivatives-lab/`

The site is published from the `main` branch, repository root.
