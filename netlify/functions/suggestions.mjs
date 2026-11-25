// Public reader suggestions + authenticated editorial moderation.
// No visitor account, email address, cookie or IP address is collected or stored.
import {createHash} from 'node:crypto';
import {ApiError,reply,safeError,originAllowed,jsonBody,environment,rows,insert,patch,authenticate,sourceUrl,str} from './_shared/core.mjs';

export const config={path:'/api/suggestions'};
const kinds=['film_request','biblical_parallel','gospel_reflection','review_correction','general_feedback'];
const movieId=id=>str(id,120).replace(/[^a-zA-Z0-9_-]/g,'');
const pageParams=req=>new URL(req.url).searchParams;
const hashSuggestion=value=>createHash('sha256').update(value).digest('hex');

export function validateSuggestion(body){
  if(!body||typeof body!=='object'||Array.isArray(body))throw new ApiError('A suggestion is required');
  const kind=str(body.kind,40);
  const details=str(body.details,1801);
  const title=str(body.movie_title,161);
  const id=movieId(body.movie_id);
  const scripture=str(body.scripture_reference,141);
  const url=str(body.source_url,1001);
  if(!kinds.includes(kind))throw new ApiError('Choose a suggestion type');
  if(!id && (title.length<2 || title.length>160))throw new ApiError('Enter a movie title of 2–160 characters');
  if((kind!=='film_request' && details.length<25) || details.length>1800)throw new ApiError('Describe your suggestion in 25–1800 characters');
  if((kind==='biblical_parallel'||kind==='gospel_reflection') && scripture.length<3)throw new ApiError('Provide the Bible passage for this reflection');
  if(url&&!sourceUrl(url))throw new ApiError('Source links must use HTTPS');
  return {kind,details,movie_id:id||null,movie_title:title,scripture_reference:scripture,source_url:url};
}
async function submit(body){
  if(str(body.website,200))return {received:true}; // Hidden honeypot field.
  const x=validateSuggestion(body);
  if(x.movie_id){
    const matches=await rows('studio_reviews',{where:{movie_id:'eq.'+x.movie_id},select:'movie_id,title',limit:1});
    if(!matches.length)throw new ApiError('Movie not found; enter its title instead',404);
    x.movie_title=matches[0].title;
  }
  // Anonymous, site-wide quota and de-duplication reduce spam without storing personal data.
  const since=new Date(Date.now()-10*60*1000).toISOString();
  const recent=await rows('studio_suggestions',{where:{created_at:'gte.'+since},select:'id',limit:61});
  if(recent.length>=60)throw new ApiError('Suggestions are busy. Please try again later.',429);
  const fingerprint=hashSuggestion([x.movie_id||x.movie_title.toLowerCase(),x.kind,x.details.toLowerCase()].join('|'));
  try{await insert('studio_suggestions',{...x,content_hash:fingerprint,state:'pending'});}
  catch(e){
    // Repeated exact submissions do not leak earlier moderation status.
    if(e instanceof ApiError&&/duplicate|unique|content_hash/i.test(e.message))return {received:true};
    throw e;
  }
  return {received:true};
}
async function publicApproved(id){
  const safe=movieId(id);
  if(!safe)throw new ApiError('Movie ID is required');
  const items=await rows('studio_suggestions',{
    select:'id,movie_id,kind,details,scripture_reference,source_url,moderated_at',
    where:{movie_id:'eq.'+safe,state:'eq.approved'},
    order:'moderated_at.desc',limit:25
  });
  return {suggestions:items};
}
async function pendingQueue(){
  const items=await rows('studio_suggestions',{
    select:'id,movie_id,movie_title,kind,details,scripture_reference,source_url,state,created_at,moderated_at,moderator_note',
    order:'created_at.desc',limit:200
  });
  return {suggestions:items,has_more:items.length===200};
}
async function moderate(body,actor,role){
  if(!['owner','editor'].includes(role))throw new ApiError('Only an editor may review visitor submissions',403);
  const id=str(body.id,50);
  if(!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(id))throw new ApiError('Invalid suggestion ID');
  const decision=str(body.decision,20);
  if(!['approved','rejected'].includes(decision))throw new ApiError('Choose approve or reject');
  const note=str(body.moderator_note,800);
  if(decision==='rejected'&&note.length<8)throw new ApiError('Record a brief reason for rejection');
  const changed=await patch('studio_suggestions',{id:'eq.'+id,state:'eq.pending'},{state:decision,moderator_note:note,reviewed_by:actor,moderated_at:new Date().toISOString()});
  if(!changed.length)throw new ApiError('This suggestion was already reviewed; reload the queue',409);
  await insert('studio_activity',{actor_id:actor,action:decision+' visitor suggestion',movie_id:changed[0].movie_id,detail:changed[0].kind+' · '+id});
  return {suggestion:changed[0]};
}
export default async function handler(req){
  if(!['GET','POST'].includes(req.method))return reply({error:'Method not allowed'},405);
  if(!originAllowed(req))return reply({error:'Invalid origin'},403);
  try{
    if(!environment().ready)throw new ApiError('Suggestions are not configured yet',503);
    const q=pageParams(req);
    const body=req.method==='POST'?await jsonBody(req,6000):{};
    const action=req.method==='GET'?str(q.get('action'),30):str(body.action,30);
    if(req.method==='POST'&&action==='submit')return reply(await submit(body),202);
    if(req.method==='GET'&&action==='approved')return reply(await publicApproved(q.get('movie_id')));
    const {user,member}=await authenticate(req);
    if(req.method==='GET'&&action==='queue')return reply(await pendingQueue());
    if(req.method==='POST'&&action==='moderate')return reply(await moderate(body,user.id,member.role));
    throw new ApiError('Unknown action',404);
  }catch(error){
    if(error instanceof ApiError && /studio_suggestions.*schema cache/i.test(error.message)){
      return reply({error:'Reader suggestions are temporarily unavailable. Please try again later.'},503);
    }
    return safeError(error);
  }
}
