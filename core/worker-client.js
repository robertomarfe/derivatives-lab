let worker=null,seq=1,pending=new Map();
export function runWorker(type,args){
  if(!worker){worker=new Worker('./worker.js',{type:'module'});worker.onmessage=e=>{const p=pending.get(e.data.id);if(!p)return;pending.delete(e.data.id);e.data.error?p.reject(new Error(e.data.error)):p.resolve(e.data.result)};}
  const id=seq++;return new Promise((resolve,reject)=>{pending.set(id,{resolve,reject});worker.postMessage({id,type,args})});
}
