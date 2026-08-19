export const CONTENT = {
  "modules": {
    "forward": {
      "number": 1,
      "title": "Forward Strategies",
      "subtitle": "Long and short forwards, combinations with the underlying, and no-arbitrage pricing.",
      "source": "Lecture 01 — Forward Contracts; Payoff of a Forward Contract; Pricing a Forward Contract.",
      "objectives": [
        "Read long and short forward payoff diagrams.",
        "Separate a terminal payoff/value from a profit calculation.",
        "Use no-arbitrage to understand the fair forward price and arbitrage direction."
      ],
      "submodules": {
        "payoff": {
          "title": "Payoff builder",
          "theory": "A forward fixes today the price F₀,T at which the underlying will be exchanged at T. At expiration, a long forward pays S_T − F₀,T and a short forward pays F₀,T − S_T. A forward entered at its fair price has zero value at inception, so its expiration payoff is also its profit. Once the underlying is added, the plotted quantity is a terminal payoff/value unless the initial stock cost is also carried to T and subtracted.",
          "how_to": "Set F₀,T and the quantities q_S and q_F. Positive q_F is long and negative q_F is short. Move the S_T inspector to verify the payoff of each leg and the combined position.",
          "formulas": [
            "\\Pi_T^{long}=S_T-F_{0,T}",
            "\\Pi_T^{short}=F_{0,T}-S_T"
          ]
        },
        "pricing": {
          "title": "Fair forward price and arbitrage",
          "theory": "With a continuously compounded risk-free rate r and continuous dividend yield δ, no-arbitrage implies F₀,T = S₀ exp[(r−δ)T]. The lecture derives this relation with a tailed stock position exp(−δT), whose reinvested dividends produce one share at T. A market forward above the no-arbitrage price gives a cash-and-carry opportunity; a price below it gives reverse cash-and-carry.",
          "how_to": "Choose S₀, r, δ and T to compute the fair forward. Then enter a hypothetical market forward. The lab reports whether the price is fair and, if not, the direction and maturity profit of the arbitrage trade.",
          "formulas": [
            "F_{0,T}=S_0 e^{(r-\\delta)T}"
          ]
        }
      },
      "steps": [
        [
          "Start from the contract",
          "Set F₀,T and read the long/short payoff at several values of S_T."
        ],
        [
          "Combine positions",
          "Change q_S and q_F and look for combinations that remove exposure to S_T."
        ],
        [
          "Price by no-arbitrage",
          "Move to fair pricing and compute F₀,T from S₀, r, δ and T."
        ],
        [
          "Diagnose mispricing",
          "Move the market forward above and below fair value and explain the arbitrage direction before reading the answer."
        ]
      ]
    },
    "futures": {
      "number": 2,
      "title": "Futures: Margins & Hedging",
      "subtitle": "Marking-to-market, margin accounts, futures cash-flow timing, and minimum-variance cross hedging.",
      "source": "Lecture 01 — Forward Contracts vs Futures Contracts; S&P 500 Futures Contract; Lecture 01 Addendum — Cross Hedging.",
      "objectives": [
        "Follow the margin account through marking-to-market.",
        "Understand why futures and forward profits can differ when cash flows arrive at different dates.",
        "Compute the minimum-variance hedge ratio and optimal number of futures contracts."
      ],
      "submodules": {
        "margin": {
          "title": "Margin account",
          "theory": "Futures are resettled through marking-to-market. Gains and losses are credited or debited to the margin account as futures prices change. The initial margin is collateral, while the maintenance margin is the threshold below which a margin call is triggered. Because intermediate gains and losses can earn or cost interest, a futures position can have a slightly different horizon profit from an otherwise comparable forward position.",
          "how_to": "Use the lecture price path or enter your own settlement prices. Set contract size, number of contracts, margin rates and r. Read each mark-to-market cash flow, the evolving balance, and the dates on which the balance crosses the maintenance threshold.",
          "formulas": [
            "M_t=e^{r\\Delta t}M_{t-1}+q(F_t-F_{t-1})\\quad\\text{(long)}"
          ]
        },
        "cross_hedge": {
          "title": "Cross hedging",
          "theory": "Cross hedging uses a derivative on one asset to hedge exposure to another asset. The lecture estimates the linear relation ΔS = a + h*ΔF + ε. The minimum-variance hedge ratio is h* = ρ σ_S/σ_F and hedge effectiveness is R² = ρ². The number of contracts is N* = h*Q_A/Q_F; the economic exposure determines whether those contracts should be long or short.",
          "how_to": "Use the jet-fuel/heating-oil observations to reproduce the lecture regression, or enter σ_S, σ_F and ρ directly. Then specify the exposure size Q_A and futures contract size Q_F and compare N* with its nearest whole-contract implementation.",
          "formulas": [
            "h^*=\\rho\\frac{\\sigma_S}{\\sigma_F}",
            "R^2=\\rho^2",
            "N^*=h^*\\frac{Q_A}{Q_F}"
          ]
        }
      },
      "steps": [
        [
          "Read marking-to-market",
          "Use the lecture path and follow the first two settlement cash flows by hand."
        ],
        [
          "Locate margin calls",
          "Compare the balance with the maintenance margin and identify when the threshold is crossed."
        ],
        [
          "Compare forward and futures",
          "Explain the difference using the timing of intermediate cash flows and interest."
        ],
        [
          "Build a cross hedge",
          "Recover h*, R² and N* and then select the correct futures direction for the exposure."
        ]
      ]
    },
    "strategies": {
      "number": 3,
      "title": "Option Strategy Builder",
      "subtitle": "Combine calls, puts, and the underlying and read the resulting expiration payoff.",
      "source": "Lecture 01 — Call Options; Put Options; Options are Insurance; Various Strategies: Payoffs, Positions, Rationales.",
      "objectives": [
        "Build option strategies leg by leg.",
        "Recognize how strikes and position signs shape payoff regions.",
        "Keep payoff and profit conceptually separate."
      ],
      "submodules": {
        "presets": {
          "title": "Lecture strategies",
          "theory": "Option strategies combine nonlinear call and put payoffs to reshape exposure to S_T. The lecture uses payoff diagrams to explain spreads, collars, straddles, strangles, butterflies and ratio spreads. A long option contributes a positive payoff function and a short option contributes the negative of that payoff. The underlying contributes q_S S_T.",
          "how_to": "Choose a lecture preset, set the relevant strikes, and inspect both each leg and the total payoff. Use the rationale shown by the app to connect the graph to the economic view embedded in the strategy.",
          "formulas": [
            "C_T=(S_T-K)^+",
            "P_T=(K-S_T)^+"
          ]
        },
        "custom": {
          "title": "Custom portfolio",
          "theory": "Any static strategy in this lab is the sum of its component payoffs. Quantity determines scale and its sign determines long versus short. This linear aggregation is useful for testing whether two apparently different constructions generate the same terminal payoff.",
          "how_to": "Choose the number of legs, instrument, long/short sign, quantity and strike. Check each leg before interpreting the aggregate payoff.",
          "formulas": [
            "\\Pi_T=\\sum_i q_i\\,\\Pi_T^{(i)}"
          ]
        },
        "profit": {
          "title": "Payoff versus profit",
          "theory": "A payoff diagram ignores the time-0 premium paid or received. To obtain profit at T, the net initial cost must be carried to T and subtracted from terminal payoff. This distinction matters particularly for option strategies because option premiums are generally non-zero at inception.",
          "how_to": "Open the profit section only after the payoff is understood. Enter the net time-0 cost, r and T, then compare the payoff and profit curves.",
          "formulas": [
            "Profit_T=Payoff_T-C_0e^{rT}"
          ]
        }
      },
      "steps": [
        [
          "Read one option payoff",
          "Start from one long call or put and identify its zero-payoff and positive-payoff regions."
        ],
        [
          "Add a second leg",
          "Use a spread or collar and explain which slope changes are created by each strike."
        ],
        [
          "Build from scratch",
          "Replicate one preset with the custom portfolio and compare the total payoff."
        ],
        [
          "Convert to profit",
          "Only after the payoff is clear, include the net initial cost and observe the shifted break-even points."
        ]
      ]
    },
    "binomial": {
      "number": 4,
      "title": "Binomial Option Lab",
      "subtitle": "European and American option pricing by replication and backward induction on a recombining tree.",
      "source": "Lecture 03 — Binomial Option Pricing; Lecture 03 Addendum — Efficient Coding; Lecture 04 — Limiting Case of the Binomial Formula.",
      "objectives": [
        "Price options by backward induction under the lecture tree convention.",
        "Interpret Δ and B as the local replicating portfolio.",
        "Identify early exercise for American options and study convergence to Black-Scholes."
      ],
      "submodules": {
        "tree": {
          "title": "Tree, replication, and exercise",
          "theory": "The binomial model lets the stock move to only two values per period. At each node the option can be replicated by Δ shares and a bond position B. No-arbitrage therefore equates the option value to the cost of the replicating portfolio. Multi-period prices are obtained by working backward through a recombining tree. For an American option, node value is the maximum of intrinsic value and continuation value.",
          "how_to": "Choose option type, exercise style and n. For small n, hover over nodes to read S, option value, continuation value, intrinsic value, Δ and B. Diamond markers indicate nodes where immediate exercise is optimal.",
          "formulas": [
            "p^*=\\frac{e^{(r-\\delta)h}-d}{u-d}",
            "V=e^{-rh}[p^*V^u+(1-p^*)V^d]"
          ]
        },
        "convergence": {
          "title": "Convergence to Black-Scholes",
          "theory": "As the number of periods increases, the binomial distribution approaches the continuous-time lognormal setting underlying Black-Scholes. The lecture emphasizes that numerical convergence can oscillate with n rather than being monotone.",
          "how_to": "Use a European option, raise the maximum number of periods, and compare the binomial sequence with the horizontal Black-Scholes benchmark.",
          "formulas": []
        }
      },
      "steps": [
        [
          "One period",
          "Set n=1 and verify terminal option payoffs before reading the time-0 price."
        ],
        [
          "Replication",
          "Read Δ and B and verify that the portfolio reproduces both terminal option payoffs."
        ],
        [
          "Backward induction",
          "Increase n and follow values backward from maturity."
        ],
        [
          "American exercise",
          "Switch to an American put and compare intrinsic with continuation value at each node."
        ],
        [
          "Continuous-time limit",
          "Return to a European option and study the oscillating convergence toward Black-Scholes."
        ]
      ]
    },
    "black_scholes": {
      "number": 5,
      "title": "Black-Scholes & Monte Carlo",
      "subtitle": "European option prices, Greeks, GBM simulation, and risk-neutral Monte Carlo valuation.",
      "source": "Lecture 04 — Black-Scholes Formula and the Greeks; Lecture 04 Addendum A — Risk-Neutral Measure.",
      "objectives": [
        "Understand the inputs and sensitivities of the Black-Scholes price.",
        "Distinguish physical-measure simulation from risk-neutral valuation.",
        "See Monte Carlo estimates converge toward the analytical price."
      ],
      "submodules": {
        "greeks": {
          "title": "Price and Greeks",
          "theory": "Black-Scholes values a European option using S, K, σ, r, T and the continuous dividend yield δ. Delta is first-order sensitivity to S and Gamma is second-order sensitivity. The lecture also reports elasticity, Vega, Theta, Rho and Psi using specific scaling conventions.",
          "how_to": "Change one input at a time and watch both price and Greeks. Compare the option value before expiration with the terminal payoff curve.",
          "formulas": [
            "C=S e^{-\\delta T}N(d_1)-Ke^{-rT}N(d_2)",
            "d_2=d_1-\\sigma\\sqrt{T}"
          ]
        },
        "gbm": {
          "title": "GBM paths",
          "theory": "Under the physical measure P, the stock drift is μ. Under the risk-neutral measure Q, the ex-dividend stock drift becomes r−δ. The diffusion volatility σ is unchanged by the change of measure. Keeping P and Q separate prevents using a physical expected return in an arbitrage-free pricing expectation.",
          "how_to": "Switch between P and Q, keep all other inputs fixed, and compare path distributions. Use a fixed seed when you want parameter comparisons to use the same random shocks.",
          "formulas": [
            "dS_t=\\mu S_tdt+\\sigma S_tdW_t^P",
            "dS_t=(r-\\delta)S_tdt+\\sigma S_tdW_t^Q"
          ]
        },
        "mc": {
          "title": "Monte Carlo pricing",
          "theory": "Risk-neutral valuation prices the option as the discounted Q-expectation of its payoff. A Monte Carlo estimator replaces that expectation with a sample average. Sampling error falls as the number of simulated paths grows, while the Black-Scholes formula provides an exact benchmark in this model.",
          "how_to": "Increase the number of paths and compare the Monte Carlo estimate, standard error, confidence interval and analytical Black-Scholes value.",
          "formulas": [
            "V_0=e^{-rT}\\mathbb{E}^Q[Payoff_T]"
          ]
        }
      },
      "steps": [
        [
          "Price analytically",
          "Choose a call or put and read d₁, d₂ and the Black-Scholes price."
        ],
        [
          "Interpret sensitivities",
          "Move S and σ separately and observe Delta, Gamma and Vega."
        ],
        [
          "Separate P from Q",
          "Simulate paths under both measures and identify which drift changes."
        ],
        [
          "Price by simulation",
          "Use Q in Monte Carlo and compare the estimate with Black-Scholes as the sample size grows."
        ]
      ]
    },
    "hedging": {
      "number": 6,
      "title": "Delta & Gamma Hedging",
      "subtitle": "Discrete dynamic hedging of a sold call, with transaction costs and an optional second option for Gamma control.",
      "source": "Lecture 04 Addendum D — Delta-Gamma Hedging.",
      "objectives": [
        "Connect option Greeks to dynamic hedge positions.",
        "Measure discrete-hedging risk through the final bank balance.",
        "Understand the trade-off between more frequent rebalancing and transaction costs."
      ],
      "submodules": {
        "distribution": {
          "title": "P&L distributions",
          "theory": "A trader who sells a call receives P, buys Delta shares and carries the residual in a bank account. In discrete time, the hedge is rebalanced only at selected dates, so the final balance b_n is random. Delta-gamma hedging adds a second option so that the portfolio has both zero Delta and zero Gamma at rebalancing times.",
          "how_to": "Start with ε=0 and the Black-Scholes charge. Compare mean, standard deviation and the 5% percentile of delta and delta-gamma hedging using the same random seed.",
          "formulas": [
            "b_0=P-\\Delta_0S_0",
            "b_t=e^{r\\Delta t}b_{t-1}-(\\Delta_t-\\Delta_{t-1})S_t"
          ]
        },
        "path": {
          "title": "One path step-by-step",
          "theory": "The hedge is self-financing apart from the initial option premium and explicit transaction costs. At each rebalancing date the bank account finances the change in stock and, for delta-gamma hedging, the change in the second option.",
          "how_to": "Use one fixed simulated path and follow S_t, hedge quantities, transaction costs and bank balance date by date. Switch strategies without changing the seed to isolate the hedge-design effect.",
          "formulas": [
            "q_t^2=\\Gamma_t^1/\\Gamma_t^2",
            "q_t^S=\\Delta_t^1-\\Delta_t^2q_t^2"
          ]
        },
        "frequency": {
          "title": "Rebalancing frequency and transaction costs",
          "theory": "Without transaction costs, finer rebalancing reduces the discretization error and approaches continuous-time replication. With proportional costs ε, more frequent trading also consumes more wealth, so the effect of rebalancing frequency on P&L risk need not be monotone.",
          "how_to": "Run the frequency comparison first with ε=0, then with the lecture-style positive transaction cost. Compare both P&L standard deviation and the 5% percentile.",
          "formulas": [
            "C_t=\\epsilon|\\Delta_t-\\Delta_{t-1}|S_t"
          ]
        }
      },
      "steps": [
        [
          "Set the sold option",
          "Use the lecture parameters and price the customer charge with Black-Scholes."
        ],
        [
          "Observe discrete hedge risk",
          "Run delta hedging and inspect the terminal P&L distribution."
        ],
        [
          "Add Gamma control",
          "Compare the same simulated paths with the second option included."
        ],
        [
          "Follow one path",
          "Track the stock, hedge quantities and bank balance rebalancing by rebalancing."
        ],
        [
          "Add frictions",
          "Introduce ε and study why increasing the number of trades no longer has a one-directional effect."
        ]
      ]
    },
    "implied_vol": {
      "number": 7,
      "title": "Implied Volatility & VIX",
      "subtitle": "Invert Black-Scholes prices, study smile/smirk patterns, and connect option strips to variance and the VIX formula.",
      "source": "Lecture 04 Addendum B — Hedging and Pricing Volatility; Lecture 04 Addendum C — Computing the VIX.",
      "objectives": [
        "Recover implied volatility from an observed option price.",
        "Read implied volatility across strike and maturity.",
        "Understand the log-contract replication logic behind the option-strip variance formula."
      ],
      "submodules": {
        "iv": {
          "title": "Implied volatility",
          "theory": "Implied volatility is the value of σ that makes the Black-Scholes price equal the observed market option price. It is therefore an inversion of the pricing formula, not a separate historical volatility estimator.",
          "how_to": "Enter S, K, r, δ, T and the observed option price. The solver returns σ such that the Black-Scholes price matches the input price. Use the lecture example to verify 31.73%.",
          "formulas": [
            "C^{mkt}=BSCall(S,K,\\sigma^{IV},r,T,\\delta)"
          ]
        },
        "surface": {
          "title": "Volatility surface",
          "theory": "If Black-Scholes were exact with constant σ, implied volatility would be flat across strike and maturity. The lecture shows instead smile/smirk patterns and time variation. A volatility surface organizes implied volatilities as Σ(T,K).",
          "how_to": "Load or edit option prices across strikes and maturities, invert each price, and inspect slices or the three-dimensional surface. Treat missing or inconsistent prices as data problems rather than forcing a volatility value.",
          "formulas": [
            "\\Sigma=\\Sigma(T,K)"
          ]
        },
        "vix": {
          "title": "Log contract and VIX",
          "theory": "The log contract links its value to variance. Carr-Madan and Demeterfi-Derman-Kamal-Zou show that its payoff can be replicated with a continuum of out-of-the-money puts and calls. The VIX calculation uses a discrete strike approximation to this option-strip variance formula, with a correction when the forward is not exactly an available strike.",
          "how_to": "Enter a strip of strikes and OTM option prices around the forward F₀,T. Check K₀ and ΔK_i, then read each strike contribution and the final annualized variance estimate.",
          "formulas": [
            "\\sigma^2\\approx\\frac{2e^{rT}}{T}\\sum_i\\frac{\\Delta K_i}{K_i^2}Q(K_i)-\\frac{1}{T}\\left(\\frac{F_{0,T}}{K_0}-1\\right)^2"
          ]
        }
      },
      "steps": [
        [
          "Invert one price",
          "Reproduce the lecture implied-volatility example before changing inputs."
        ],
        [
          "Move across strike",
          "Build a smile/smirk slice and compare it with a flat Black-Scholes volatility."
        ],
        [
          "Add maturity",
          "Interpret Σ(T,K) as a surface rather than a single number."
        ],
        [
          "Move from volatility to variance",
          "Use the log-contract/VIX tab and inspect the contribution of each OTM option strike."
        ]
      ]
    },
    "heston": {
      "number": 8,
      "title": "Heston Model",
      "subtitle": "Risk-neutral stochastic variance, European option pricing, implied-volatility effects, and simulation.",
      "source": "Lecture 05 — Heston Model: Dynamics, Pricing, Simulation.",
      "objectives": [
        "Interpret ν_t as stochastic instantaneous variance.",
        "Understand the roles of k, θ, σ and ρ.",
        "Connect stochastic variance to option prices, skew and simulated paths."
      ],
      "submodules": {
        "dynamics": {
          "title": "Dynamics and parameters",
          "theory": "Heston replaces constant Black-Scholes variance with a square-root mean-reverting process ν_t, which is the instantaneous variance. The stock and variance shocks are correlated by ρ. θ is the long-run mean of variance, k controls mean reversion, σ is the scale parameter (volatility of volatility), and negative ρ can generate negative return skewness and an asymmetric implied-volatility smile. The lecture states the positivity condition 2kθ > σ².",
          "how_to": "Change one variance parameter at a time. Use the displayed positivity-condition check as a model diagnostic, then relate ρ and σ to changes in the implied-volatility shape.",
          "formulas": [
            "dS_t=rS_tdt+\\sqrt{\\nu_t}S_tdW_t^S",
            "d\\nu_t=k(\\theta-\\nu_t)dt+\\sigma\\sqrt{\\nu_t}dW_t^\\nu"
          ]
        },
        "pricing": {
          "title": "Pricing and implied-volatility smile",
          "theory": "The Heston European call price is written in the lecture as S P₁ − K e^{-rT}P₂, with P₁ and P₂ obtained from Fourier-integral expressions. Because variance is stochastic and correlated with returns, the prices imply a non-flat Black-Scholes volatility curve.",
          "how_to": "Choose strikes and Heston parameters, compute call prices, and invert those prices back to Black-Scholes implied volatilities. Compare the resulting curve with a flat volatility benchmark.",
          "formulas": [
            "C=S P_1-Ke^{-rT}P_2"
          ]
        },
        "simulation": {
          "title": "Simulation",
          "theory": "The lecture simulates the variance process and then integrates the log stock price using the correlated variance shock plus an independent Brownian component. The path display makes mean reversion, stochastic variance and the return/variance correlation visible.",
          "how_to": "Fix a seed, simulate stock and variance paths, then vary k, θ, σ or ρ one at a time. Compare the variance path first and only then interpret the stock-path response.",
          "formulas": []
        }
      },
      "steps": [
        [
          "Start from Black-Scholes",
          "Set ν₀ and θ close to a constant variance benchmark and identify what Heston adds."
        ],
        [
          "Read mean reversion",
          "Change k and θ separately and distinguish speed from long-run level."
        ],
        [
          "Create asymmetry",
          "Move ρ into negative values and inspect the implied-volatility skew."
        ],
        [
          "Simulate the states",
          "Compare stock and instantaneous-variance paths using a fixed seed."
        ]
      ]
    },
    "merton_jump": {
      "number": 9,
      "title": "Merton Jump Diffusion",
      "subtitle": "Continuous diffusion plus compound-Poisson jumps, European option pricing, smile effects, and simulation.",
      "source": "Lecture 05 — Merton Model: Dynamics, Pricing, Calibration, Time-series, Simulation.",
      "objectives": [
        "Interpret jump intensity and jump-size parameters.",
        "Price a European call as a Poisson mixture of Black-Scholes prices.",
        "Connect jumps to heavy tails, asymmetry and implied-volatility smile/smirk patterns."
      ],
      "submodules": {
        "dynamics": {
          "title": "Dynamics",
          "theory": "Merton adds a compound-Poisson jump component to Black-Scholes diffusion. N_t counts jumps with intensity λ, while the jump multiplier Y is positive and lognormal in the lecture specification. The drift contains the compensator λk so that the risk-neutral expected return remains consistent with r.",
          "how_to": "Change λ, m and δ one at a time. Interpret λ as expected jump frequency, m as the mean log jump size and δ as jump-size dispersion.",
          "formulas": [
            "dS_t=(r-\\lambda k)S_tdt+\\sigma S_tdW_t+S_{t-}dQ_t",
            "k=e^{m+\\delta^2/2}-1"
          ]
        },
        "pricing": {
          "title": "Pricing",
          "theory": "Conditional on j jumps, the Merton terminal distribution is lognormal with adjusted parameters. The European call is therefore a Poisson-weighted sum of Black-Scholes call prices. The lecture presents two equivalent representations of this mixture.",
          "how_to": "Compute the call price and open the contribution table. Read the Poisson weight, conditional volatility and contribution of j=0,1,2,… jumps.",
          "formulas": [
            "C^{Merton}=\\sum_{j=0}^{\\infty}Pr(N_T=j)\\,C_{BS}^{(j)}"
          ]
        },
        "smile": {
          "title": "Implied-volatility smile",
          "theory": "The lecture motivates jumps by heavy tails, asymmetry and option smile/smirk patterns that constant-volatility Black-Scholes cannot reproduce. Jump parameters add short-horizon distributional flexibility, which is especially relevant at short and medium maturities.",
          "how_to": "Generate Merton prices across strike and invert them to implied volatility. Then set λ toward zero to see the curve collapse toward the flat Black-Scholes benchmark.",
          "formulas": []
        },
        "simulation": {
          "title": "Simulation",
          "theory": "A simulated path combines a continuous Gaussian diffusion with a random number of jumps. Conditional on n jumps over a step, the sum of n log jump sizes is Normal with mean nm and variance nδ².",
          "how_to": "Use a fixed seed, compare paths and terminal log returns with the Black-Scholes normal benchmark, and check that the mean realized jump count is close to λT in a large simulation.",
          "formulas": []
        }
      },
      "steps": [
        [
          "Turn jumps off",
          "Set λ=0 and verify that pricing reduces to Black-Scholes."
        ],
        [
          "Add jump frequency",
          "Increase λ and inspect the Poisson weights in the pricing decomposition."
        ],
        [
          "Shape jump sizes",
          "Change m and δ and connect them to asymmetry and tail thickness."
        ],
        [
          "Read the smile",
          "Invert Merton prices to implied volatility across strikes."
        ],
        [
          "Simulate jumps",
          "Compare realized jump counts with λT and inspect the terminal return distribution."
        ]
      ]
    },
    "merton_credit": {
      "number": 10,
      "title": "Merton Credit Risk",
      "subtitle": "Structural credit risk: equity as a call on firm value, risky debt, default probability, and KMV-style inversion.",
      "source": "Lecture 06 — Structural Model of Credit Risk; Merton's Model (1974); KMV Model; Implied Credit Spread.",
      "objectives": [
        "Map the firm's capital structure into option payoffs.",
        "Distinguish physical EDF from risk-neutral default probability.",
        "Infer unobserved firm value and firm volatility from observed equity data."
      ],
      "submodules": {
        "capital": {
          "title": "Capital structure and option interpretation",
          "theory": "The firm is financed by equity and zero-coupon senior debt: V(t)=E(t)+D(t). At T, shareholders receive max[V(T)−D,0], so equity is a call on firm value with strike equal to debt face value D. Debtholders receive min[V(T),D], which is equivalent to risk-free debt minus a put. Default occurs at T when V(T)<D.",
          "how_to": "Use the payoff diagram to identify the default region V(T)<D and compare how value is divided between equity and debt on each side of D.",
          "formulas": [
            "E(T)=\\max[V(T)-D,0]",
            "D(T)=\\min[V(T),D]"
          ]
        },
        "known": {
          "title": "Known firm value and firm volatility",
          "theory": "When V₀ and σ_V are known, Black-Scholes option pricing gives equity value and hence risky debt D₀=V₀−E₀. The physical distance-to-default uses the firm drift α; the risk-neutral default probability uses r instead. The two probabilities answer different questions and should not be mixed.",
          "how_to": "Enter V₀, σ_V, D, r, T and α. Compare equity, debt, risk-neutral N(−d₂), physical distance-to-default and physical EDF.",
          "formulas": [
            "E_0=V_0N(d_1)-De^{-rT}N(d_2)",
            "Pr^Q(V_T<D)=N(-d_2)"
          ]
        },
        "kmv": {
          "title": "KMV-style inversion",
          "theory": "Firm value and firm volatility are not directly observed. The lecture therefore solves two equations in V₀ and σ_V: the Merton equity-value equation and the equity-volatility relation N(d₁)σ_VV₀=σ_EE₀. Once V₀ and σ_V are inferred, the model gives risky debt value, default probability and the continuously compounded debt yield and credit spread.",
          "how_to": "Enter observed E₀ and σ_E together with D, r and T. Use the lecture benchmark E₀=3, σ_E=0.8, D=10, r=5%, T=1 to verify the inversion before experimenting.",
          "formulas": [
            "N(d_1)\\sigma_VV_0=\\sigma_EE_0",
            "Spread=y-r"
          ]
        }
      },
      "steps": [
        [
          "Read the capital structure",
          "Locate the default boundary D and identify equity and debt payoffs on both sides."
        ],
        [
          "Price equity as an option",
          "Treat V as the underlying and D as the strike."
        ],
        [
          "Separate probability measures",
          "Compare physical EDF using α with risk-neutral default probability using r."
        ],
        [
          "Invert market observables",
          "Use E₀ and σ_E to infer V₀ and σ_V and verify the lecture example."
        ],
        [
          "Read the spread",
          "Translate risky debt value into its continuously compounded yield and subtract r."
        ]
      ]
    }
  },
  "challenges": {
    "forward": [
      {
        "id": "forward_payoff",
        "module_id": "forward",
        "title": "Long-forward payoff",
        "prompt": "A long forward has F₀,T = 50. If S_T = 55, what is the payoff at T?",
        "kind": "numeric",
        "answer": 5.0,
        "tolerance": 1e-09,
        "options": [],
        "unit": "currency units",
        "hint": "Use S_T − F₀,T.",
        "solution": "55 − 50 = 5.",
        "source_anchor": "Lecture 01 — Payoff of a Forward Contract."
      },
      {
        "id": "forward_direction",
        "module_id": "forward",
        "title": "Arbitrage direction",
        "prompt": "If the observed market forward is above S₀exp[(r−δ)T], which lecture strategy is indicated?",
        "kind": "choice",
        "answer": "Cash-and-carry",
        "tolerance": 1e-06,
        "options": [
          "Cash-and-carry",
          "Reverse cash-and-carry",
          "No arbitrage trade"
        ],
        "unit": "",
        "hint": "The forward is expensive relative to its replicating cost.",
        "solution": "Buy the tailed stock/finance it and short the overpriced forward: cash-and-carry.",
        "source_anchor": "Lecture 01 — Pricing a Forward Contract."
      }
    ],
    "futures": [
      {
        "id": "futures_cross_hedge",
        "module_id": "futures",
        "title": "Jet-fuel cross hedge",
        "prompt": "Using ρ=0.9284, σ_S=0.0263, σ_F=0.0313, Q_A=2,000,000 and Q_F=42,000, what is N* before rounding?",
        "kind": "numeric",
        "answer": 37.14729955880116,
        "tolerance": 0.02,
        "options": [],
        "unit": "contracts",
        "hint": "First compute h*=ρσ_S/σ_F, then N*=h*Q_A/Q_F.",
        "solution": "h*=0.7801; N*=37.15, so the lecture rounds to 37 contracts.",
        "source_anchor": "Lecture 01 Addendum — Cross Hedging Example."
      },
      {
        "id": "futures_direction",
        "module_id": "futures",
        "title": "Hedge direction",
        "prompt": "An airline will purchase jet fuel in the future. Which futures direction hedges a price increase?",
        "kind": "choice",
        "answer": "Long futures",
        "tolerance": 1e-06,
        "options": [
          "Long futures",
          "Short futures"
        ],
        "unit": "",
        "hint": "The exposure loses when the purchase price rises.",
        "solution": "A long futures position gains when the futures price rises and offsets a more expensive future purchase.",
        "source_anchor": "Lecture 01 — Hedging with futures."
      }
    ],
    "strategies": [
      {
        "id": "strategy_straddle",
        "module_id": "strategies",
        "title": "Identify the strategy",
        "prompt": "Which strategy combines a long call and a long put with the same strike to gain from a sufficiently large move in either direction?",
        "kind": "choice",
        "answer": "Straddle",
        "tolerance": 1e-06,
        "options": [
          "Bull Spread",
          "Straddle",
          "Collar",
          "Butterfly Spread"
        ],
        "unit": "",
        "hint": "Both options share the same strike, so the terminal payoff increases when S_T moves sufficiently far in either direction.",
        "solution": "A long call plus a long put at the same strike is a straddle.",
        "source_anchor": "Lecture 01 — Various Strategies."
      },
      {
        "id": "strategy_butterfly",
        "module_id": "strategies",
        "title": "Butterfly middle leg",
        "prompt": "In the call butterfly used in the lab, what is the quantity of the middle-strike call?",
        "kind": "numeric",
        "answer": -2.0,
        "tolerance": 1e-09,
        "options": [],
        "unit": "calls",
        "hint": "The standard lecture construction buys the low/high strikes and sells twice the middle strike.",
        "solution": "The middle-strike quantity is −2: two calls are sold.",
        "source_anchor": "Lecture 01 — Various Strategies."
      }
    ],
    "binomial": [
      {
        "id": "binomial_one_step",
        "module_id": "binomial",
        "title": "One-period call",
        "prompt": "For S₀=41, K=40, r=8%, σ=30%, T=1, δ=0 and n=1 using the lecture tree convention, what is the European call price?",
        "kind": "numeric",
        "answer": 7.838580426945479,
        "tolerance": 0.002,
        "options": [],
        "unit": "currency units",
        "hint": "Work backward from the two terminal call payoffs using p*.",
        "solution": "The lecture benchmark is about 7.839; the implemented tree gives 7.838580.",
        "source_anchor": "Lecture 03 — A Simple Example."
      },
      {
        "id": "binomial_american",
        "module_id": "binomial",
        "title": "American node value",
        "prompt": "At an American-option node, which value determines the option price?",
        "kind": "choice",
        "answer": "max(intrinsic value, continuation value)",
        "tolerance": 1e-06,
        "options": [
          "continuation value only",
          "intrinsic value only",
          "max(intrinsic value, continuation value)"
        ],
        "unit": "",
        "hint": "American exercise adds a choice that a European holder does not have.",
        "solution": "Backward induction compares immediate exercise with continuation and takes the larger value.",
        "source_anchor": "Lecture 03 — American options."
      }
    ],
    "black_scholes": [
      {
        "id": "bs_call",
        "module_id": "black_scholes",
        "title": "Lecture Black-Scholes call",
        "prompt": "For S=41, K=40, σ=30%, r=8%, T=1 and δ=0, what is the European call price?",
        "kind": "numeric",
        "answer": 6.960998922548743,
        "tolerance": 0.002,
        "options": [],
        "unit": "currency units",
        "hint": "Use the lecture Black-Scholes formula with d₁ and d₂.",
        "solution": "The lecture reports about 6.961; the implemented formula gives 6.960999.",
        "source_anchor": "Lecture 04 — Black-Scholes Formula for a European Call Option."
      },
      {
        "id": "bs_measure",
        "module_id": "black_scholes",
        "title": "Pricing measure",
        "prompt": "Which drift is used for the ex-dividend stock when Monte Carlo is used for arbitrage-free option pricing?",
        "kind": "choice",
        "answer": "r − δ",
        "tolerance": 1e-06,
        "options": [
          "μ",
          "r − δ",
          "σ"
        ],
        "unit": "",
        "hint": "Risk-neutral pricing removes the physical expected return from the discounted price process.",
        "solution": "Under Q the ex-dividend stock drift is r−δ.",
        "source_anchor": "Lecture 04 Addendum A — Risk-neutral measure."
      }
    ],
    "hedging": [
      {
        "id": "hedging_gamma",
        "module_id": "hedging",
        "title": "Gamma-neutral quantity",
        "prompt": "If Γ₁=0.020 for the sold call and Γ₂=0.010 for the hedge call, what q² makes portfolio Gamma zero?",
        "kind": "numeric",
        "answer": 2.0,
        "tolerance": 1e-09,
        "options": [],
        "unit": "hedge calls",
        "hint": "Use q²=Γ₁/Γ₂ because q¹=−1.",
        "solution": "q² = 0.020/0.010 = 2.",
        "source_anchor": "Lecture 04 Addendum D — equations (8)-(10)."
      },
      {
        "id": "hedging_costs",
        "module_id": "hedging",
        "title": "Rebalancing with costs",
        "prompt": "With positive proportional transaction costs, is P&L risk guaranteed to improve monotonically as rebalancing becomes more frequent?",
        "kind": "choice",
        "answer": "No",
        "tolerance": 1e-06,
        "options": [
          "Yes",
          "No"
        ],
        "unit": "",
        "hint": "More rebalancing reduces discretization error but also creates more transactions.",
        "solution": "No. The lecture emphasizes a non-monotone effect once transaction costs are present.",
        "source_anchor": "Lecture 04 Addendum D — transaction costs vs rebalancing frequency."
      }
    ],
    "implied_vol": [
      {
        "id": "iv_example",
        "module_id": "implied_vol",
        "title": "Lecture implied volatility",
        "prompt": "A call has S=100, K=90, r=8%, δ=5%, T=1 and market price 18.25. What is its Black-Scholes implied volatility in percent?",
        "kind": "numeric",
        "answer": 31.731661024886332,
        "tolerance": 0.03,
        "options": [],
        "unit": "%",
        "hint": "Find σ such that BSCall(100,90,σ,0.08,1,0.05)=18.25.",
        "solution": "σ^IV = 31.7317%, matching the lecture value 31.73%.",
        "source_anchor": "Lecture 04 Addendum B — Implied Volatility example."
      },
      {
        "id": "iv_flat",
        "module_id": "implied_vol",
        "title": "Black-Scholes benchmark",
        "prompt": "If the constant-volatility Black-Scholes model were exactly correct for all strikes and maturities, what would its implied-volatility surface look like?",
        "kind": "choice",
        "answer": "Flat at σ",
        "tolerance": 1e-06,
        "options": [
          "Flat at σ",
          "Always U-shaped",
          "Always decreasing in strike"
        ],
        "unit": "",
        "hint": "Implied volatility is the σ that inverts the same pricing model.",
        "solution": "It would be flat at the model's constant σ; smile/smirk patterns reveal departures from that benchmark.",
        "source_anchor": "Lecture 04 Addendum B; Lecture 05 — Black-Scholes limitations."
      }
    ],
    "heston": [
      {
        "id": "heston_feller",
        "module_id": "heston",
        "title": "Variance positivity condition",
        "prompt": "With k=2, θ=0.04 and σ=0.30, compute 2kθ−σ². Is the lecture condition 2kθ>σ² satisfied? Enter the difference.",
        "kind": "numeric",
        "answer": 0.07,
        "tolerance": 1e-09,
        "options": [],
        "unit": "",
        "hint": "Positive 2kθ−σ² means the stated condition holds.",
        "solution": "2·2·0.04−0.30² = 0.07 > 0, so the lecture positivity condition is satisfied.",
        "source_anchor": "Lecture 05 — Heston dynamics."
      },
      {
        "id": "heston_rho",
        "module_id": "heston",
        "title": "Correlation and skew",
        "prompt": "According to the lecture, what does a negative ρ tend to induce in the return distribution?",
        "kind": "choice",
        "answer": "Negative skewness",
        "tolerance": 1e-06,
        "options": [
          "Negative skewness",
          "Positive skewness",
          "No asymmetry"
        ],
        "unit": "",
        "hint": "Lower returns tend to be accompanied by higher volatility when ρ is negative.",
        "solution": "Negative ρ induces negative skewness and helps generate an asymmetric implied-volatility smile.",
        "source_anchor": "Lecture 05 — Heston parameter intuition."
      }
    ],
    "merton_jump": [
      {
        "id": "merton_k",
        "module_id": "merton_jump",
        "title": "Jump compensator",
        "prompt": "For m=−0.10 and δ=0.20, what is k=E[Y−1]=exp(m+δ²/2)−1?",
        "kind": "numeric",
        "answer": -0.07688365361336424,
        "tolerance": 1e-06,
        "options": [],
        "unit": "",
        "hint": "Compute m+δ²/2 before exponentiating.",
        "solution": "k = exp(−0.10+0.20²/2)−1 = -0.076884.",
        "source_anchor": "Lecture 05 — Merton dynamics and compensator."
      },
      {
        "id": "merton_lambda_zero",
        "module_id": "merton_jump",
        "title": "Black-Scholes limit",
        "prompt": "What happens to the Merton jump-diffusion pricing model when λ=0?",
        "kind": "choice",
        "answer": "It reduces to Black-Scholes",
        "tolerance": 1e-06,
        "options": [
          "It reduces to Black-Scholes",
          "It becomes Heston",
          "The stock stops moving"
        ],
        "unit": "",
        "hint": "λ is the jump intensity.",
        "solution": "With zero jump intensity, the compound-Poisson component disappears and the model reduces to the diffusion benchmark.",
        "source_anchor": "Lecture 05 — Merton dynamics."
      }
    ],
    "merton_credit": [
      {
        "id": "credit_kmv",
        "module_id": "merton_credit",
        "title": "Lecture KMV-style inversion",
        "prompt": "For E₀=3, σ_E=0.80, D=10, r=5% and T=1, what firm value V₀ is inferred by the two-equation Merton inversion?",
        "kind": "numeric",
        "answer": 12.395387188639633,
        "tolerance": 0.02,
        "options": [],
        "unit": "currency units",
        "hint": "Solve the equity value equation jointly with N(d₁)σ_VV₀=σ_EE₀.",
        "solution": "V₀=12.3954, which rounds to the lecture value 12.40.",
        "source_anchor": "Lecture 06 — KMV Model numerical example."
      },
      {
        "id": "credit_default",
        "module_id": "merton_credit",
        "title": "Default boundary",
        "prompt": "In the one-period Merton structural model used in the lecture, when does default occur at maturity?",
        "kind": "choice",
        "answer": "V(T) < D",
        "tolerance": 1e-06,
        "options": [
          "V(T) < D",
          "V(T) > D",
          "E(T) > D"
        ],
        "unit": "",
        "hint": "D is the face value promised to debtholders.",
        "solution": "Default occurs when firm value at T is insufficient to cover debt face value: V(T)<D.",
        "source_anchor": "Lecture 06 — Relation to Option Pricing: Merton's Model."
      }
    ]
  }
};
