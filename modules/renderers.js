import { renderForward } from './renderForward.js';
import { renderFutures } from './renderFutures.js';
import { renderStrategies } from './renderStrategies.js';
import { renderBinomial } from './renderBinomial.js';
import { renderBlackScholes } from './renderBlackScholes.js';
import { renderHedging } from './renderHedging.js';
import { renderImplied } from './renderImplied.js';
import { renderHeston } from './renderHeston.js';
import { renderMertonJump } from './renderMertonJump.js';
import { renderMertonCredit } from './renderMertonCredit.js';
import { state, activeTab } from './common.js';
import { errorBox } from '../core/ui.js';
export function resetModuleState(id){ delete state[id]; delete activeTab[id]; }
export function renderModule(id,root){const map={forward:renderForward,futures:renderFutures,strategies:renderStrategies,binomial:renderBinomial,black_scholes:renderBlackScholes,hedging:renderHedging,implied_vol:renderImplied,heston:renderHeston,merton_jump:renderMertonJump,merton_credit:renderMertonCredit};(map[id]||(()=>{root.innerHTML=errorBox('Unknown module.')}))(root);}
