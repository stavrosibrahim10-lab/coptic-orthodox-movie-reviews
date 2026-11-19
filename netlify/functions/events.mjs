import {environment,jsonBody,reply,safeError,insert,str,originAllowed,ApiError} from './_shared/core.mjs';
export const config={path:'/api/events'};
export default async function handler(req){
  if(req.method!=='POST')return reply({error:'Method not allowed'},405);
  if(!originAllowed(req))return reply({error:'Invalid origin'},403);
  if(!environment().ready)return reply({accepted:false});
  try{
    const e=await jsonBody(req,1200);
    if(!['movie_view','search'].includes(e.kind))throw new ApiError('Invalid event');
    const payload={kind:e.kind,movie_id:str(e.movie_id,120)||null,movie_title:str(e.movie_title,160)||null,query_term:e.kind==='search'?str(e.query_term,60).toLowerCase().replace(/[\r\n\t]/g,' '):null,result_count:e.kind==='search'?Math.max(0,Math.min(2000,Number(e.result_count)||0)):null};
    if(e.kind==='movie_view'&&!payload.movie_id)throw new ApiError('Movie required');
    if(e.kind==='search'&&(!payload.query_term||payload.query_term.length<2))throw new ApiError('Search phrase required');
    await insert('studio_events',payload);return reply({accepted:true},202);
  }catch(e){return safeError(e)}
}
