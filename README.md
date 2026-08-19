# Derivatives Lab

Interactive, lecture-grounded web application for a Master-level Derivatives course.

The application contains ten laboratories covering forward strategies, futures margins and hedging, option strategies, binomial pricing, Black-Scholes and Monte Carlo, delta/gamma hedging, implied volatility and VIX, Heston, Merton jump diffusion, and Merton structural credit risk.

## Learning modes

- **Explore** — change parameters and inspect results interactively.
- **Step-by-step** — follow a guided sequence tied to the lecture logic.
- **Challenge** — solve short numerical or conceptual exercises with feedback.

## Architecture

This edition is fully client-side: HTML, CSS and JavaScript only. It requires no Python runtime, backend, database, paid API, or server-side computation. Heavier simulations use a Web Worker so the interface remains responsive.

The static distribution is also configured as a Progressive Web App and is responsive for desktop, tablet and mobile use.

## Validation

The web implementation is checked against the validated Python reference implementation and lecture benchmarks. The current automated suite contains 32 numerical/structural tests, plus a browser smoke test covering all ten modules, all submodule tabs, and mobile overflow.

## GitHub Pages

Publishing target: `https://robertomarfe.github.io/derivatives-lab/`

The site should be published from the `main` branch, repository root.
