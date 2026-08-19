import { normCdf, normPdf, mean, sampleStd, quantile, clamp, adaptiveSimpson } from './special.js';
import { Complex, I } from './complex.js';
import { makeRng } from './random.js';

export const LECTURE_CROSS_HEDGE_DF = [0.021,0.035,-0.046,0.001,0.044,-0.029,-0.026,-0.029,0.048,-0.006,-0.036,-0.011,0.019,-0.027,0.029];
export const LECTURE_CROSS_HEDGE_DS = [0.029,0.020,-0.044,0.008,0.026,-0.019,-0.010,-0.007,0.043,0.011,-0.036,-0.018,0.009,-0.032,0.023];
export const LECTURE_SP500_FUTURES_PRICES = [1100.00,1027.99,1037.88,1073.23,1048.78,1090.32,1106.94,1110.98,1024.74,1007.30,1011.65];

function requirePositive(name, x) { if (!(x > 0)) throw new Error(`${name} must be strictly positive.`); }

// ---------- Forward contracts ----------
export function fairForwardPrice(S0, r, delta, T) {
  requirePositive('S0', S0); if (T < 0) throw new Error('T must be non-negative.');
  return S0 * Math.exp((r - delta) * T);
}
export const longForwardPayoff = (ST, F0T, q=1) => q * (ST - F0T);
export const shortForwardPayoff = (ST, F0T, q=1) => q * (F0T - ST);
export const combinedTerminalPayoff = (ST, F0T, qS=0, qF=0) => qS * ST + qF * (ST - F0T);
export function diagnoseForwardArbitrage(S0, marketForward, r, delta, T, tolerance=1e-10) {
  const fair = fairForwardPrice(S0,r,delta,T), gap = marketForward - fair, tail = Math.exp(-delta*T);
  if (Math.abs(gap) <= tolerance) return {marketForward,fairForward:fair,relation:'fair',maturityProfitPerUnit:0,strategy:['No arbitrage trade: market and fair forward prices coincide.']};
  if (gap > 0) return {marketForward,fairForward:fair,relation:'market_above_fair',maturityProfitPerUnit:gap,strategy:[`Buy tailed stock position: ${tail.toFixed(6)} units.`,`Borrow S0 exp(-delta T) = ${(S0*tail).toFixed(6)}.`,'Short one forward contract.','At T, deliver the stock into the forward and repay the loan.']};
  return {marketForward,fairForward:fair,relation:'market_below_fair',maturityProfitPerUnit:-gap,strategy:[`Short tailed stock position: ${tail.toFixed(6)} units.`,`Lend S0 exp(-delta T) = ${(S0*tail).toFixed(6)}.`,'Go long one forward contract.','At T, use the forward delivery to close the stock position.']};
}

// ---------- Payoffs ----------
export function callPayoff(ST,K){return Math.max(ST-K,0)}
export function putPayoff(ST,K){return Math.max(K-ST,0)}
export function legPayoff(ST,leg){
  if(leg.instrument==='underlying') return leg.quantity*ST;
  if(leg.strike==null) throw new Error('Option legs require a strike.');
  return leg.quantity*(leg.instrument==='call'?callPayoff(ST,leg.strike):putPayoff(ST,leg.strike));
}
export function portfolioPayoff(ST,legs){return legs.reduce((s,l)=>s+legPayoff(ST,l),0)}
export function strategyPreset(name,Klow,KATM,Khigh,ratioN=2){
  if(!(Klow<KATM&&KATM<Khigh)) throw new Error('Require K_low < K_ATM < K_high.');
  const P={
    'Bull Spread':[{instrument:'call',quantity:1,strike:KATM,label:'Buy Call(K_ATM)'},{instrument:'call',quantity:-1,strike:Khigh,label:'Sell Call(K_high)'}],
    'Collar':[{instrument:'put',quantity:1,strike:Klow,label:'Buy Put(K_low)'},{instrument:'call',quantity:-1,strike:Khigh,label:'Sell Call(K_high)'}],
    'Collared Stock':[{instrument:'underlying',quantity:1,strike:null,label:'Own stock'},{instrument:'put',quantity:1,strike:Klow,label:'Buy Put(K_low)'},{instrument:'call',quantity:-1,strike:Khigh,label:'Sell Call(K_high)'}],
    'Straddle':[{instrument:'call',quantity:1,strike:KATM,label:'Buy Call(K_ATM)'},{instrument:'put',quantity:1,strike:KATM,label:'Buy Put(K_ATM)'}],
    'Strangle':[{instrument:'put',quantity:1,strike:Klow,label:'Buy Put(K_low)'},{instrument:'call',quantity:1,strike:Khigh,label:'Buy Call(K_high)'}],
    'Butterfly Spread':[{instrument:'call',quantity:1,strike:Klow,label:'Buy Call(K_low)'},{instrument:'call',quantity:-2,strike:KATM,label:'Sell 2 Call(K_ATM)'},{instrument:'call',quantity:1,strike:Khigh,label:'Buy Call(K_high)'}],
    'Ratio Spread':[{instrument:'call',quantity:1,strike:KATM,label:'Buy Call(K_ATM)'},{instrument:'call',quantity:-ratioN,strike:Khigh,label:`Sell ${ratioN} Call(K_high)`}]
  };
  if(!P[name]) throw new Error(`Unknown strategy preset: ${name}`); return P[name];
}
export const terminalProfitFromNetCost=(payoff,netCost,r,T)=>payoff-netCost*Math.exp(r*T);

// ---------- Futures ----------
export function marginAccountPath(prices, contractMultiplier, nContracts, marginRate, r, periodsPerYear, maintenanceRatio, position='long'){
  if(prices.length<2||prices.some(x=>x<=0)) throw new Error('Invalid futures price path.');
  const q=contractMultiplier*nContracts, initialNotional=prices[0]*q, initialMargin=marginRate*initialNotional, maintenanceMargin=maintenanceRatio*initialMargin;
  const dt=1/periodsPerYear, sign=position==='long'?1:-1, growth=Math.exp(r*dt);
  const changes=[null], interest=[0], mtm=[0], balance=[initialMargin], marginCall=[false];
  for(let t=1;t<prices.length;t++){
    changes[t]=prices[t]-prices[t-1]; interest[t]=balance[t-1]*(growth-1); mtm[t]=sign*q*changes[t]; balance[t]=balance[t-1]+interest[t]+mtm[t]; marginCall[t]=balance[t]<maintenanceMargin;
  }
  const horizon=(prices.length-1)/periodsPerYear;
  return {periods:prices.map((_,i)=>i),futuresPrices:[...prices],priceChanges:changes,interestEarned:interest,markToMarket:mtm,marginBalance:balance,marginCall,totalMultiplier:q,initialNotional,initialMargin,maintenanceMargin,futuresProfit:balance.at(-1)-initialMargin*Math.exp(r*horizon),forwardProfit:sign*q*(prices.at(-1)-prices[0])};
}
export const minimumVarianceHedgeRatio=(rho,sigmaS,sigmaF)=>rho*sigmaS/sigmaF;
export const hedgeEffectiveness=rho=>rho*rho;
export const optimalNumberFuturesContracts=(h,QA,QF)=>Math.abs(h)*QA/QF;
export function crossHedge(rho,sigmaS,sigmaF,QA,QF,exposure='will_purchase'){
  const h=minimumVarianceHedgeRatio(rho,sigmaS,sigmaF), n=optimalNumberFuturesContracts(h,QA,QF);
  return {rho,sigmaS,sigmaF,hedgeRatio:h,hedgeEffectiveness:hedgeEffectiveness(rho),QA,QF,optimalContracts:n,roundedContracts:Math.floor(n+0.5),recommendedFuturesPosition:exposure==='will_purchase'?'Long futures':'Short futures'};
}
export function estimateCrossHedgeFromChanges(deltaS,deltaF){
  const n=deltaS.length, ms=mean(deltaS), mf=mean(deltaF), sigmaS=sampleStd(deltaS), sigmaF=sampleStd(deltaF);
  let cov=0; for(let i=0;i<n;i++) cov+=(deltaS[i]-ms)*(deltaF[i]-mf); cov/=n-1;
  const rho=cov/(sigmaS*sigmaF), h=minimumVarianceHedgeRatio(rho,sigmaS,sigmaF), intercept=ms-h*mf;
  return {intercept,h,rho,sigmaS,sigmaF,R2:rho*rho};
}

// ---------- Black-Scholes ----------
export function d1d2(S,K,r,sigma,T,delta=0){
  requirePositive('S',S); requirePositive('K',K); if(!(sigma>0&&T>0)) throw new Error('d1 and d2 require sigma>0 and T>0.');
  const d1=(Math.log(S/K)+(r-delta+0.5*sigma*sigma)*T)/(sigma*Math.sqrt(T)); return [d1,d1-sigma*Math.sqrt(T)];
}
export function blackScholesPrice(S,K,r,sigma,T,delta=0,optionType='call'){
  requirePositive('S',S); requirePositive('K',K); if(sigma<0||T<0) throw new Error('Invalid sigma/T.');
  if(T===0) return optionType==='call'?Math.max(S-K,0):Math.max(K-S,0);
  if(sigma===0){const STq=S*Math.exp((r-delta)*T),pay=optionType==='call'?Math.max(STq-K,0):Math.max(K-STq,0); return Math.exp(-r*T)*pay;}
  const [d1,d2]=d1d2(S,K,r,sigma,T,delta), dq=Math.exp(-delta*T), dr=Math.exp(-r*T);
  return optionType==='call'?S*dq*normCdf(d1)-K*dr*normCdf(d2):K*dr*normCdf(-d2)-S*dq*normCdf(-d1);
}
export function blackScholesGreeks(S,K,r,sigma,T,delta=0,optionType='call'){
  if(!(T>0&&sigma>0)) throw new Error('Greeks require T>0 and sigma>0.');
  const price=blackScholesPrice(S,K,r,sigma,T,delta,optionType), [d1,d2]=d1d2(S,K,r,sigma,T,delta), root=Math.sqrt(T),dq=Math.exp(-delta*T),dr=Math.exp(-r*T),pdf=normPdf(d1);
  const gamma=dq*pdf/(S*sigma*root),vegaRaw=S*dq*pdf*root; let D,theta,rho,psi;
  if(optionType==='call'){D=dq*normCdf(d1);theta=-S*dq*pdf*sigma/(2*root)-r*K*dr*normCdf(d2)+delta*S*dq*normCdf(d1);rho=K*T*dr*normCdf(d2);psi=-S*T*dq*normCdf(d1);} else {D=dq*(normCdf(d1)-1);theta=-S*dq*pdf*sigma/(2*root)+r*K*dr*normCdf(-d2)-delta*S*dq*normCdf(-d1);rho=-K*T*dr*normCdf(-d2);psi=S*T*dq*normCdf(-d1);}
  return {price,delta:D,gamma,elasticity:Math.abs(price)<1e-14?NaN:D*S/price,vegaPer1Pct:vegaRaw/100,thetaPerDay:theta/365,rhoPer1Pct:rho/100,psiPer1Pct:psi/100,d1,d2};
}

// ---------- Binomial ----------
export function lectureTreeParameters(r,delta,sigma,h){const u=Math.exp((r-delta)*h+sigma*Math.sqrt(h)),d=Math.exp((r-delta)*h-sigma*Math.sqrt(h)),g=Math.exp((r-delta)*h); if(!(d<g&&g<u))throw new Error('No-arbitrage condition violated.'); return {u,d,p:(g-d)/(u-d)};}
export function priceBinomial(S0,K,r,sigma,T,n,delta=0,optionType='call',style='european'){
  const h=T/n,{u,d,p}=lectureTreeParameters(r,delta,sigma,h),disc=Math.exp(-r*h); const stockTree=[],intrinsicTree=[];
  const intr=s=>optionType==='call'?Math.max(s-K,0):Math.max(K-s,0);
  for(let i=0;i<=n;i++){const S=[];for(let j=0;j<=i;j++)S.push(S0*u**j*d**(i-j));stockTree.push(S);intrinsicTree.push(S.map(intr));}
  const optionTree=Array(n+1),continuationTree=Array(n+1),exerciseTree=Array(n+1),deltaTree=Array(n+1),bondTree=Array(n+1);
  optionTree[n]=[...intrinsicTree[n]];continuationTree[n]=Array(n+1).fill(NaN);exerciseTree[n]=Array(n+1).fill(false);deltaTree[n]=Array(n+1).fill(NaN);bondTree[n]=Array(n+1).fill(NaN);
  for(let i=n-1;i>=0;i--){const cont=[],ex=[],vals=[],deltas=[],bonds=[];for(let j=0;j<=i;j++){const cd=optionTree[i+1][j],cu=optionTree[i+1][j+1],c=disc*((1-p)*cd+p*cu),exercise=style==='american'&&intrinsicTree[i][j]>c+1e-12&&intrinsicTree[i][j]>0; cont.push(c);ex.push(exercise);vals.push(exercise?intrinsicTree[i][j]:c); const de=Math.exp(-delta*h)*(cu-cd)/(stockTree[i][j]*(u-d));const B=disc*(u*cd-d*cu)/(u-d);deltas.push(exercise?NaN:de);bonds.push(exercise?NaN:B);} optionTree[i]=vals;continuationTree[i]=cont;exerciseTree[i]=ex;deltaTree[i]=deltas;bondTree[i]=bonds;}
  return {price:optionTree[0][0],u,d,p,h,stockTree,optionTree,continuationTree,intrinsicTree,exerciseTree,deltaTree,bondTree};
}

// ---------- Implied volatility ----------
export function noArbitrageBounds(S,K,r,T,delta=0,optionType='call'){const ds=S*Math.exp(-delta*T),dk=K*Math.exp(-r*T);return optionType==='call'?[Math.max(ds-dk,0),ds]:[Math.max(dk-ds,0),dk];}
export function impliedVolatility(marketPrice,S,K,r,T,delta=0,optionType='call'){
  const [lower,upper]=noArbitrageBounds(S,K,r,T,delta,optionType),tol=1e-10*Math.max(1,Math.abs(upper)); if(marketPrice<lower-tol||marketPrice>upper+tol)throw new Error('Market price is outside admissible bounds.');
  const zero=blackScholesPrice(S,K,r,0,T,delta,optionType);if(Math.abs(marketPrice-zero)<=tol)return {sigma:0,modelPrice:zero,marketPrice,lowerBound:lower,upperBound:upper};
  const f=s=>blackScholesPrice(S,K,r,s,T,delta,optionType)-marketPrice;let lo=1e-12,hi=10;while(f(hi)<0&&hi<100)hi*=2;if(f(lo)>0||f(hi)<0)throw new Error('Could not bracket implied volatility.');
  for(let i=0;i<160;i++){const mid=0.5*(lo+hi),fm=f(mid);if(Math.abs(fm)<1e-12){lo=hi=mid;break;}if(fm>0)hi=mid;else lo=mid;}const sigma=0.5*(lo+hi);return {sigma,modelPrice:blackScholesPrice(S,K,r,sigma,T,delta,optionType),marketPrice,lowerBound:lower,upperBound:upper};
}

// ---------- VIX / variance replication ----------
export function logContractValue(S0,K,r,sigma,T){return Math.exp(-r*T)*(Math.log(S0/K)+(r-0.5*sigma*sigma)*T)}
export function varianceFromForwardLogContract(L0,r,T){return 2*Math.exp(r*T)*(-L0)/T}
export function strikeSpacings(k){const n=k.length,dk=Array(n);dk[0]=k[1]-k[0];dk[n-1]=k[n-1]-k[n-2];for(let i=1;i<n-1;i++)dk[i]=0.5*(k[i+1]-k[i-1]);return dk;}
export function discreteVixVariance(strikes,puts,calls,forwardPrice,r,T){let idx=-1;for(let i=0;i<strikes.length;i++)if(strikes[i]<forwardPrice)idx=i;if(idx<0)throw new Error('Need a strike below forward.');const K0=strikes[idx],dk=strikeSpacings(strikes),q=strikes.map((K,i)=>K<=K0?puts[i]:calls[i]),contribution=strikes.map((K,i)=>dk[i]*q[i]/(K*K));let variance=2*Math.exp(r*T)/T*contribution.reduce((a,b)=>a+b,0)-(1/T)*(forwardPrice/K0-1)**2;if(variance<-1e-10)throw new Error('Negative variance from strip.');variance=Math.max(0,variance);const vol=Math.sqrt(variance);return {variance,volatility:vol,vixLevel:100*vol,K0,deltaK:dk,selectedOptionPrices:q,contribution};}

// ---------- Heston ----------
export const fellerMargin=(k,theta,sigma)=>2*k*theta-sigma*sigma;
export function hestonCharacteristic(u,S,r,T,nu0,k,theta,sigma,rho){
  const uc=Complex.of(u), iu=I.mul(uc), kappaTerm=new Complex(k,0).sub(iu.scale(rho*sigma));
  let d=kappaTerm.mul(kappaTerm).add(uc.mul(uc).add(iu).scale(sigma*sigma)).sqrt();
  if(d.re<0)d=d.neg();
  const g=kappaTerm.sub(d).div(kappaTerm.add(d));
  const emd=d.scale(-T).exp(), one=new Complex(1,0);
  const logTerm=one.sub(g.mul(emd)).div(one.sub(g)).log();
  const C=iu.scale(r*T).add(kappaTerm.sub(d).scale(T).sub(logTerm.scale(2)).scale(k*theta/(sigma*sigma)));
  const D=kappaTerm.sub(d).scale(1/(sigma*sigma)).mul(one.sub(emd).div(one.sub(g.mul(emd))));
  return C.add(D.scale(nu0)).add(iu.scale(Math.log(S))).exp();
}
export function hestonCallPrice(S,K,r,T,nu0,k,theta,sigma,rho,lambdaV=0,integrationUpper=100){
  if(lambdaV!==0) throw new Error('The web lab preserves the lecture convention lambda_v=0; non-zero lambda_v is not exposed.');
  const logK=Math.log(K), phiMinusI=hestonCharacteristic(new Complex(0,-1),S,r,T,nu0,k,theta,sigma,rho);
  function p2int(u){const uc=new Complex(u,0),phi=hestonCharacteristic(uc,S,r,T,nu0,k,theta,sigma,rho),num=I.scale(-u*logK).exp().mul(phi),den=I.scale(u);return num.div(den).re;}
  function p1int(u){const shifted=new Complex(u,-1),phi=hestonCharacteristic(shifted,S,r,T,nu0,k,theta,sigma,rho),num=I.scale(-u*logK).exp().mul(phi).div(phiMinusI),den=I.scale(u);return num.div(den).re;}
  function integrateSegmented(fn){let total=0;const a0=1e-8,step=2;for(let a=a0;a<integrationUpper;a+=step){const b=Math.min(integrationUpper,a+step);total+=adaptiveSimpson(fn,a,b,2e-10,16);}return total;}
  const P1=0.5+integrateSegmented(p1int)/Math.PI;
  const P2=0.5+integrateSegmented(p2int)/Math.PI;
  const callPrice=S*P1-K*Math.exp(-r*T)*P2;
  return {callPrice,P1,P2};
}

// ---------- Merton jump diffusion ----------
export const jumpCompensator=(m,delta)=>Math.exp(m+0.5*delta*delta)-1;
function poissonTerms(mu,tailTol=1e-12){const out=[];let w=Math.exp(-mu),sum=0,j=0;while(j<10000){out.push(w);sum+=w;if(1-sum<tailTol&&j>mu)break;j++;w*=mu/j;}return {weights:out,omitted:Math.max(0,1-sum)};}
export function mertonCallPrice(S,K,r,T,sigma,lam,m,delta,formulation='eq35',tailTol=1e-12){const kj=jumpCompensator(m,delta);if(lam===0){const bs=blackScholesPrice(S,K,r,sigma,T,0,'call');return {callPrice:bs,terms:[{j:0,weight:1,conditionalSigma:sigma,conditionalSpot:S,conditionalRate:r,conditionalBsPrice:bs,contribution:bs}],omittedProbabilityMass:0,jumpCompensatorK:kj};}const intensity=formulation==='eq35'?lam:lam*(1+kj),{weights,omitted}=poissonTerms(intensity*T,tailTol),terms=[];let total=0;for(let j=0;j<weights.length;j++){const weight=weights[j],sigmaJ=Math.sqrt(sigma*sigma+j*delta*delta/T);let spotJ,rateJ;if(formulation==='eq35'){spotJ=S*Math.exp(j*m+0.5*j*delta*delta-lam*T*Math.exp(m+0.5*delta*delta)+lam*T);rateJ=r;}else{spotJ=S;rateJ=r-lam*kj+j*Math.log(1+kj)/T;}const bs=blackScholesPrice(spotJ,K,rateJ,sigmaJ,T,0,'call'),contribution=weight*bs;total+=contribution;terms.push({j,weight,conditionalSigma:sigmaJ,conditionalSpot:spotJ,conditionalRate:rateJ,conditionalBsPrice:bs,contribution});}return {callPrice:total,terms,omittedProbabilityMass:omitted,jumpCompensatorK:kj};}

// ---------- Merton structural credit ----------
export function mertonD1D2(V0,D,r,sigmaV,T){const root=Math.sqrt(T),d1=(Math.log(V0/D)+(r+0.5*sigmaV*sigmaV)*T)/(sigmaV*root);return [d1,d1-sigmaV*root];}
export function equityValueMerton(V0,D,r,sigmaV,T){const[d1,d2]=mertonD1D2(V0,D,r,sigmaV,T);return V0*normCdf(d1)-D*Math.exp(-r*T)*normCdf(d2);}
export function equityVolatilityFromFirm(V0,E0,D,r,sigmaV,T){const[d1]=mertonD1D2(V0,D,r,sigmaV,T);return (V0/E0)*normCdf(d1)*sigmaV;}
export function riskNeutralDefaultProbability(V0,D,r,sigmaV,T){const[,d2]=mertonD1D2(V0,D,r,sigmaV,T);return normCdf(-d2);}
export function distanceToDefault(V0,D,alpha,sigmaV,T){return (Math.log(V0/D)+(alpha-0.5*sigmaV*sigmaV)*T)/(sigmaV*Math.sqrt(T));}
export function expectedDefaultFrequency(V0,D,alpha,sigmaV,T){return normCdf(-distanceToDefault(V0,D,alpha,sigmaV,T));}
export function evaluateKnownFirm(V0,D,r,sigmaV,T){const E=equityValueMerton(V0,D,r,sigmaV,T),debt=V0-E,[d1,d2]=mertonD1D2(V0,D,r,sigmaV,T),y=-Math.log(debt/D)/T;return {V0,sigmaV,equityValue:E,debtValue:debt,d1,d2,riskNeutralDefaultProbability:normCdf(-d2),debtYieldContinuous:y,creditSpread:y-r};}
export function inferFirmValueFromEquity(E0,sigmaE,D,r,T){let x=Math.log(E0+D*Math.exp(-r*T)),y=Math.log(Math.max(1e-4,sigmaE*E0/Math.exp(x)));
  function residual(x0,y0){const V=Math.exp(x0),sv=Math.exp(y0),[d1,d2]=mertonD1D2(V,D,r,sv,T),Em=V*normCdf(d1)-D*Math.exp(-r*T)*normCdf(d2);return [(Em-E0)/E0,(normCdf(d1)*sv*V-sigmaE*E0)/(sigmaE*E0)];}
  let success=false;for(let iter=0;iter<80;iter++){const f=residual(x,y),err=Math.max(Math.abs(f[0]),Math.abs(f[1]));if(err<1e-11){success=true;break;}const h=1e-5,fx=residual(x+h,y),fy=residual(x,y+h),J00=(fx[0]-f[0])/h,J10=(fx[1]-f[1])/h,J01=(fy[0]-f[0])/h,J11=(fy[1]-f[1])/h,det=J00*J11-J01*J10;if(Math.abs(det)<1e-14)break;let dx=(-f[0]*J11+J01*f[1])/det,dy=(-J00*f[1]+J10*f[0])/det;let step=1,best=err,bx=x,by=y;for(let k=0;k<16;k++){const nx=x+step*dx,ny=y+step*dy,nf=residual(nx,ny),ne=Math.max(Math.abs(nf[0]),Math.abs(nf[1]));if(ne<best){best=ne;bx=nx;by=ny;break;}step*=0.5;}x=bx;y=by;}
  const V0=Math.exp(x),sigmaV=Math.exp(y),base=evaluateKnownFirm(V0,D,r,sigmaV,T),rr=residual(x,y);success=success||Math.max(Math.abs(rr[0]),Math.abs(rr[1]))<1e-7;if(!success)throw new Error('Merton solver did not converge.');return {...base,observedEquityValue:E0,observedEquityVolatility:sigmaE,solverSuccess:true,solverMessage:'Damped Newton converged'};}

// ---------- Simulations (also used by Web Worker) ----------
export function simulateGbmPaths(S0,drift,sigma,T,nPaths,nSteps,seed=12345){const rng=makeRng(seed),dt=T/nSteps,times=Array.from({length:nSteps+1},(_,i)=>i*dt),paths=[];for(let p=0;p<nPaths;p++){const row=[S0];let logS=Math.log(S0);for(let t=0;t<nSteps;t++){logS+=(drift-0.5*sigma*sigma)*dt+sigma*Math.sqrt(dt)*rng.normal();row.push(Math.exp(logS));}paths.push(row);}return {times,paths};}
export function monteCarloEuropeanPrice(S0,K,r,sigma,T,delta,optionType,nPaths,seed=12345){const rng=makeRng(seed),disc=Math.exp(-r*T),xs=[];for(let i=0;i<nPaths;i++){const z=rng.normal(),ST=S0*Math.exp((r-delta-0.5*sigma*sigma)*T+sigma*Math.sqrt(T)*z),pay=optionType==='call'?Math.max(ST-K,0):Math.max(K-ST,0);xs.push(disc*pay);}const estimate=mean(xs),se=sampleStd(xs)/Math.sqrt(nPaths);return {estimate,standardError:se,ci95Low:estimate-1.96*se,ci95High:estimate+1.96*se,exactBlackScholes:blackScholesPrice(S0,K,r,sigma,T,delta,optionType)};}
function bsArrays(K,tau,S,r,sigma){if(tau<=0)return {price:Math.max(S-K,0),delta:S>K?1:0,gamma:0};const root=Math.sqrt(tau),d1=(Math.log(S/K)+(r+0.5*sigma*sigma)*tau)/(sigma*root),d2=d1-sigma*root;return {price:S*normCdf(d1)-K*Math.exp(-r*tau)*normCdf(d2),delta:normCdf(d1),gamma:normPdf(d1)/(S*sigma*root)};}
export function simulateHedging(charge,K,T,S0,r,mu,sigma,nPaths,nSteps,TC=0,gammaHedge=false,K2=115,T2=1,seed=12345){const rng=makeRng(seed),dt=T/nSteps,growth=Math.exp(r*dt),GH=gammaHedge?1:0,final=[];for(let p=0;p<nPaths;p++){let S=S0;const g1=blackScholesGreeks(S0,K,r,sigma,T,0,'call'),p20=blackScholesPrice(S0,K2,r,sigma,T2,0,'call'),g2=blackScholesGreeks(S0,K2,r,sigma,T2,0,'call');let q2=GH*clamp(g1.gamma/g2.gamma,-100,100),qS=g1.delta-q2*g2.delta,balance=charge-qS*S0-GH*q2*p20-TC*(Math.abs(qS)*S0+GH*Math.abs(q2)*p20);for(let t=0;t<nSteps-1;t++){S*=Math.exp((mu-0.5*sigma*sigma)*dt+sigma*Math.sqrt(dt)*rng.normal());const tau1=T-(t+1)*dt,tau2=T2-(t+1)*dt,b1=bsArrays(K,tau1,S,r,sigma),b2=bsArrays(K2,tau2,S,r,sigma),newQ2=GH*clamp(Math.abs(b2.gamma)>1e-15?b1.gamma/b2.gamma:0,-100,100),newQS=b1.delta-newQ2*b2.delta,stockCost=(newQS-qS)*S,optionCost=GH*(newQ2-q2)*b2.price,tc=TC*(Math.abs(newQS-qS)*S+GH*Math.abs(newQ2-q2)*b2.price);balance=growth*balance-stockCost-optionCost-tc;qS=newQS;q2=newQ2;}S*=Math.exp((mu-0.5*sigma*sigma)*dt+sigma*Math.sqrt(dt)*rng.normal());const p2f=bsArrays(K2,T2-T,S,r,sigma).price;balance=growth*balance+qS*S+GH*q2*p2f-Math.max(S-K,0);final.push(balance);}return {finalBalance:final,mean:mean(final),std:sampleStd(final),percentile5:quantile(final,0.05)};}
export function simulateHestonPaths(S0,r,T,nu0,k,theta,sigma,rho,nPaths=1000,nSteps=126,seed=12345){const rng=makeRng(seed),dt=T/nSteps,times=Array.from({length:nSteps+1},(_,i)=>i*dt),stockPaths=[],variancePaths=[],ek=Math.exp(-k*dt),C=4*k/(sigma*sigma*(1-ek)),df=4*k*theta/(sigma*sigma),orth=Math.sqrt(Math.max(0,1-rho*rho));for(let p=0;p<nPaths;p++){let v=nu0,logS=Math.log(S0),srow=[S0],vrow=[v];for(let t=0;t<nSteps;t++){const nonc=C*ek*v,vnew=rng.noncentralChiSquare(df,nonc)/C,iv=0.5*dt*(v+vnew),y=rng.normal();logS=logS+r*dt+(rho/sigma)*(vnew-v-k*theta*dt)+(k*rho/sigma-0.5)*iv+orth*Math.sqrt(Math.max(iv,0))*y;v=vnew;srow.push(Math.exp(logS));vrow.push(v);}stockPaths.push(srow);variancePaths.push(vrow);}return {times,stockPaths,variancePaths};}
export function simulateMertonPaths(S0,r,T,sigma,lam,m,delta,nPaths=1000,nSteps=126,seed=12345){const rng=makeRng(seed),dt=T/nSteps,times=Array.from({length:nSteps+1},(_,i)=>i*dt),stockPaths=[],jumpCounts=[],kj=jumpCompensator(m,delta);for(let p=0;p<nPaths;p++){let logS=Math.log(S0),cum=0,srow=[S0],jrow=[0];for(let t=0;t<nSteps;t++){const n=rng.poisson(lam*dt),jump=n*m+Math.sqrt(n)*delta*rng.normal();logS+=(r-lam*kj-0.5*sigma*sigma)*dt+sigma*Math.sqrt(dt)*rng.normal()+jump;cum+=n;srow.push(Math.exp(logS));jrow.push(cum);}stockPaths.push(srow);jumpCounts.push(jrow);}return {times,stockPaths,jumpCounts};}
