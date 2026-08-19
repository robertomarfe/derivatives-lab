let worker=null,seq=1,pending=new Map();
const DEFAULT_TIMEOUT_MS=45000;

function rejectAll(err){
  for(const {reject,timer} of pending.values()){clearTimeout(timer);reject(err);}
  pending.clear();
}

function resetWorker(err){
  if(err) rejectAll(err);
  try{worker?.terminate();}catch{}
  worker=null;
}

function ensureWorker(){
  if(worker)return worker;
  worker=new Worker('./worker.js',{type:'module'});
  worker.onmessage=e=>{
    const p=pending.get(e.data?.id);if(!p)return;
    clearTimeout(p.timer);pending.delete(e.data.id);
    e.data.error?p.reject(new Error(e.data.error)):p.resolve(e.data.result);
  };
  worker.onerror=e=>resetWorker(new Error(`Simulation worker failed: ${e.message||'unknown worker error'}`));
  worker.onmessageerror=()=>resetWorker(new Error('Simulation worker returned an unreadable message.'));
  return worker;
}

export function runWorker(type,args,{timeoutMs=DEFAULT_TIMEOUT_MS}={}){
  const w=ensureWorker(),id=seq++;
  return new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>{
      pending.delete(id);
      reject(new Error(`Simulation timed out after ${Math.round(timeoutMs/1000)} seconds.`));
      resetWorker(new Error('Simulation worker was reset after a timeout.'));
    },timeoutMs);
    pending.set(id,{resolve,reject,timer});
    try{w.postMessage({id,type,args});}
    catch(err){clearTimeout(timer);pending.delete(id);reject(err);resetWorker(new Error('Simulation worker was reset after a messaging failure.'));}
  });
}

export function terminateWorker(){resetWorker(new Error('Simulation worker was reset.'));}
