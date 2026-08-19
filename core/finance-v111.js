export * from './finance.js';
import * as Base from './finance.js';
import { Complex, I } from './complex.js';
import { adaptiveSimpson, logGamma } from './special.js';
import { makeRng } from './random.js';
import * as V from './validation.js';

export const fellerMargin=(k,theta,sigma)=>{V.positive('k',k);V.positive('theta',theta);V.positive('sigma',sigma);return 2*k*theta-sigma*sigma};

export function hestonCharacteristic(u,S,r,T,nu0,k,theta,sigma,rho){
  V.positive('S',S);V.finite('r',r);V.positive('T',T);V.positive('nu0',nu0);V.positive('k',k);V.positive('theta',theta);V.positive('sigma',sigma);V.probabilityLikeCorrelation('rho',rho);
  const uc=Complex.of(u),iu=I.mul(uc),kappaTerm=new Complex(k,0).sub(iu.scale(rho*sigma));
  let d=kappaTerm.mul(kappaTerm).add(uc.mul(uc).add(iu).scale(sigma*sigma)).sqrt();if(d.re<0)d=d.neg();
  const g=kappaTerm.sub(d).div(kappaTerm.add(d)),emd=d.scale(-T).exp(),one=new Complex(1,0);
  const logTerm=one.sub(g.mul(emd)).div(one.sub(g)).log();
  const C=iu.scale(r*T).add(kappaTerm.sub(d).scale(T).sub(logTerm.scale(2)).scale(k*theta/(sigma*sigma)));
  const D=kappaTerm.sub(d).scale(1/(sigma*sigma)).mul(one.sub(emd).div(one.sub(g.mul(emd))));
  return C.add(D.scale(nu0)).add(iu.scale(Math.log(S))).exp();
}

function integrateHestonTail(fn,{minimumUpper=100,maxUpper=500,segment=1,tol=5e-11}={}){
  let total=0,quiet=0,lastAbs=Infinity;
  const start=1e-8;
  for(let a=start;a<maxUpper;a+=segment){
    const b=Math.min(maxUpper,a+segment),piece=adaptiveSimpson(fn,a,b,tol,18);total+=piece;
    const mag=Math.abs(piece);quiet=(a>=minimumUpper&&mag<tol*15&&mag<=lastAbs*1.5)?quiet+1:0;lastAbs=mag;
    if(quiet>=12)return total;
  }
  return total;
}
function hestonPriceAttempt(S,K,r,T,nu0,k,theta,sigma,rho,settings){
  const logK=Math.log(K),phiMinusI=new Complex(S*Math.exp(r*T),0);
  function p2int(u){const uc=new Complex(u,0),phi=hestonCharacteristic(uc,S,r,T,nu0,k,theta,sigma,rho),num=I.scale(-u*logK).exp().mul(phi),den=I.scale(u);return num.div(den).re;}
  function p1int(u){const shifted=new Complex(u,-1),phi=hestonCharacteristic(shifted,S,r,T,nu0,k,theta,sigma,rho),num=I.scale(-u*logK).exp().mul(phi).div(phiMinusI),den=I.scale(u);return num.div(den).re;}
  const P1=0.5+integrateHestonTail(p1int,settings)/Math.PI,P2=0.5+integrateHestonTail(p2int,settings)/Math.PI;
  return {callPrice:S*P1-K*Math.exp(-r*T)*P2,P1,P2};
}
export function hestonCallPrice(S,K,r,T,nu0,k,theta,sigma,rho,lambdaV=0,integrationUpper=100){
  V.positive('S',S);V.positive('K',K);V.finite('r',r);V.positive('T',T);V.positive('nu0',nu0);V.positive('k',k);V.positive('theta',theta);V.positive('sigma',sigma);V.probabilityLikeCorrelation('rho',rho);V.positive('Integration upper bound',integrationUpper);
  if(lambdaV!==0)throw new Error('The web lab preserves the lecture convention lambda_v=0; non-zero lambda_v is not exposed.');
  const lower=Math.max(S-K*Math.exp(-r*T),0),upper=S,scale=Math.max(1,S,K*Math.exp(-r*T));
  const attempts=[{minimumUpper:Math.max(100,integrationUpper),maxUpper:Math.max(400,4*integrationUpper),segment:1,tol:5e-11},{minimumUpper:Math.max(180,1.5*integrationUpper),maxUpper:Math.max(800,8*integrationUpper),segment:.5,tol:1e-11}];
  let last=null;
  for(const settings of attempts){
    const out=hestonPriceAttempt(S,K,r,T,nu0,k,theta,sigma,rho,settings);last=out;const boundTol=2e-8*scale,pTol=2e-7;
    if(Number.isFinite(out.callPrice)&&Number.isFinite(out.P1)&&Number.isFinite(out.P2)&&out.callPrice>=lower-boundTol&&out.callPrice<=upper+boundTol&&out.P1>=-pTol&&out.P1<=1+pTol&&out.P2>=-pTol&&out.P2<=1+pTol){
      const callPrice=out.callPrice<lower?lower:out.callPrice>upper?upper:out.callPrice;return {...out,callPrice,integrationUpperUsed:settings.minimumUpper,noArbitrageLower:lower,noArbitrageUpper:upper};
    }
  }
  throw new Error(`Heston numerical integration failed the no-arbitrage check (computed ${last?.callPrice}). Try a less extreme parameter combination; the model inputs were not silently clipped.`);
}

function poissonPairs(mu,tailTol=1e-12){
  V.nonNegative('Poisson mean',mu);V.bounded('Tail tolerance',tailTol,0,1,{openMin:true,openMax:true});if(mu===0)return {pairs:[{j:0,weight:1}],omitted:0};
  const mode=Math.floor(mu),w0=Math.exp(-mu+mode*Math.log(mu)-logGamma(mode+1));if(!(w0>0)||!Number.isFinite(w0))throw new Error('Could not initialize Poisson mixture weights.');
  const pairs=[{j:mode,weight:w0}];let sum=w0,leftJ=mode,rightJ=mode,leftW=w0,rightW=w0;
  for(let iter=0;iter<200000;iter++){
    if(leftJ>0){leftW*=leftJ/mu;leftJ--;pairs.push({j:leftJ,weight:leftW});sum+=leftW;}
    rightJ++;rightW*=mu/rightJ;pairs.push({j:rightJ,weight:rightW});sum+=rightW;
    const nextLeft=leftJ>0?leftW*leftJ/mu:0,leftRatio=leftJ>1?(leftJ-1)/mu:0,leftBound=nextLeft>0?nextLeft/Math.max(1e-16,1-leftRatio):0;
    const nextRight=rightW*mu/(rightJ+1),rightRatio=mu/(rightJ+2),rightBound=nextRight>0?nextRight/Math.max(1e-16,1-rightRatio):0;
    if(leftBound+rightBound<=tailTol)break;if(iter===199999)throw new Error('Poisson mixture truncation did not converge.');
  }
  pairs.sort((a,b)=>a.j-b.j);return {pairs,omitted:Math.max(0,1-sum)};
}
export function mertonCallPrice(S,K,r,T,sigma,lam,m,delta,formulation='eq35',tailTol=1e-12){
  V.positive('S',S);V.positive('K',K);V.finite('r',r);V.positive('T',T);V.nonNegative('Diffusion sigma',sigma);V.nonNegative('Jump intensity lambda',lam);V.finite('m',m);V.nonNegative('Jump-size standard deviation delta',delta);V.oneOf('Formulation',formulation,['eq35','eq36']);
  const kj=Base.jumpCompensator(m,delta);if(lam===0){const bs=Base.blackScholesPrice(S,K,r,sigma,T,0,'call');return {callPrice:bs,terms:[{j:0,weight:1,conditionalSigma:sigma,conditionalSpot:S,conditionalRate:r,conditionalBsPrice:bs,contribution:bs}],omittedProbabilityMass:0,jumpCompensatorK:kj};}
  const intensity=formulation==='eq35'?lam:lam*(1+kj),{pairs,omitted}=poissonPairs(intensity*T,tailTol),terms=[];let total=0;
  for(const {j,weight} of pairs){const sigmaJ=Math.sqrt(sigma*sigma+j*delta*delta/T);let spotJ,rateJ;if(formulation==='eq35'){spotJ=S*Math.exp(j*m+0.5*j*delta*delta-lam*T*Math.exp(m+0.5*delta*delta)+lam*T);rateJ=r;}else{spotJ=S;rateJ=r-lam*kj+j*Math.log(1+kj)/T;}if(!Number.isFinite(spotJ)||!(spotJ>0)||!Number.isFinite(rateJ))throw new Error('Merton conditional parameters overflowed numerically for this extreme input combination.');const bs=Base.blackScholesPrice(spotJ,K,rateJ,sigmaJ,T,0,'call'),contribution=weight*bs;total+=contribution;terms.push({j,weight,conditionalSigma:sigmaJ,conditionalSpot:spotJ,conditionalRate:rateJ,conditionalBsPrice:bs,contribution});}
  const lower=Math.max(S-K*Math.exp(-r*T),0),upper=S,boundTol=5e-10*Math.max(1,S,K*Math.exp(-r*T));if(!Number.isFinite(total)||total<lower-boundTol||total>upper+boundTol)throw new Error(`Merton Poisson mixture failed the no-arbitrage check (computed ${total}).`);const callPrice=total<lower?lower:total>upper?upper:total;return {callPrice,terms,omittedProbabilityMass:omitted,jumpCompensatorK:kj};
}

export function simulateHestonPaths(S0,r,T,nu0,k,theta,sigma,rho,nPaths=1000,nSteps=126,seed=12345){
  V.positive('S0',S0);V.finite('r',r);V.positive('T',T);V.positive('nu0',nu0);V.positive('k',k);V.positive('theta',theta);V.positive('sigma',sigma);V.probabilityLikeCorrelation('rho',rho);V.positiveInteger('Paths',nPaths);V.positiveInteger('Steps',nSteps);V.finite('Seed',seed);
  const rng=makeRng(seed),dt=T/nSteps,times=Array.from({length:nSteps+1},(_,i)=>i*dt),stockPaths=[],variancePaths=[],ek=Math.exp(-k*dt),C=4*k/(sigma*sigma*(1-ek)),df=4*k*theta/(sigma*sigma),orth=Math.sqrt(Math.max(0,1-rho*rho));
  for(let p=0;p<nPaths;p++){let v=nu0,logS=Math.log(S0),srow=[S0],vrow=[v];for(let t=0;t<nSteps;t++){const nonc=C*ek*v,vnew=rng.noncentralChiSquare(df,nonc)/C,iv=0.5*dt*(v+vnew),y=rng.normal();logS=logS+r*dt+(rho/sigma)*(vnew-v-k*theta*dt)+(k*rho/sigma-0.5)*iv+orth*Math.sqrt(Math.max(iv,0))*y;v=vnew;srow.push(Math.exp(logS));vrow.push(v);}stockPaths.push(srow);variancePaths.push(vrow);}return {times,stockPaths,variancePaths};
}
