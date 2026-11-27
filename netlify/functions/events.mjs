import {environment,jsonBody,reply,safeError,insert,str,originAllowed,ApiError} from './_shared/core.mjs';
export const config={path:'/api/events',rateLimit:{windowLimit:120,windowSize:60,aggregateBy:['ip','domain']}};
const allowed=['movie_view','search','page_view','share','suggestion','interest_prompt','interest_submit'];
const uuid=v=>typeof v==='string'&&/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(v)?v:null;
const choice=(v,options)=>options.includes(v)?v:null;
export function eventPayload(e){
 if(!e||!allowed.includes(e.kind))throw new ApiError('Invalid event');
 let q=e.kind==='search'?str(e.query_term,60).toLowerCase().replace(/[\r\n\t]/g,' '):null;
 if(q&&(/@|https?:|\b\d{7,}\b|(?:\d[ .()-]*){10}/i.test(q)))q=null;
 const payload={kind:e.kind,movie_id:e.kind==='movie_view'?str(e.movie_id,120)||null:null,movie_title:e.kind==='movie_view'?str(e.movie_title,160)||null:null,query_term:q,result_count:e.kind==='search'?Math.floor(Math.max(0,Math.min(2000,Number(e.result_count)||0))):null,visitor_id:uuid(e.visitor_id),session_id:uuid(e.session_id),page:choice(e.page,['home','browse','movie','about','suggestions']),source:choice(e.source,['direct','search','social','referral','internal']),device:choice(e.device,['mobile','desktop'])};
 if(e.kind==='movie_view'&&!payload.movie_id)throw new ApiError('Movie required');
 if(e.kind==='search'&&(!q||q.length<2))throw new ApiError('Search phrase required');
 if(e.kind==='page_view'&&!payload.page)throw new ApiError('Page required');
 return payload;
}
export default async function handler(req){
 if(req.method!=='POST')return reply({error:'Method not allowed'},405);
 if(!originAllowed(req))return reply({error:'Invalid origin'},403);
 if(!environment().ready)return reply({accepted:false});
 try{const e=await jsonBody(req,1600);await insert('studio_events',eventPayload(e));return reply({accepted:true},202);}
 catch(e){return safeError(e);}
}
