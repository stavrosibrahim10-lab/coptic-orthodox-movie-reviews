// Shared backend helpers. No third-party dependencies; compatible with Netlify Functions / Node 22.
export function environment(){
  const url=(process.env.SUPABASE_URL||'').trim().replace(/\/$/,'');
  const pub=(process.env.SUPABASE_PUBLISHABLE_KEY||'').trim();
  const secret=(process.env.SUPABASE_SECRET_KEY||'').trim();
  return {url,pub,secret,ready:!!(url&&pub&&secret)&&/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url)};
}
export function reply(data,status=200,extra={}){
  return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin',...extra}});
}
export class ApiError extends Error{constructor(message,status=400){super(message);this.status=status;}}
export const str=(v,max=1000)=>typeof v==='string'?v.trim().slice(0,max):'';
export function sourceUrl(url){try {const u=new URL(url);return u.protocol==='https:'&&!u.username&&!u.password&&url.length<=1000;}catch{return false}}
export function originAllowed(req){const origin=req.headers.get('origin');return !origin || origin===new URL(req.url).origin;}
export async function jsonBody(req,max=160000){
  if(!/^(application\/json|text\/plain)(;|$)/i.test(req.headers.get('content-type')||''))throw new ApiError('Expected JSON request',415);
  const raw=await req.text();if(raw.length>max)throw new ApiError('Request too large',413);
  try{return JSON.parse(raw||'{}')}catch{throw new ApiError('Malformed JSON')}
}
export async function supabase(path,{method='GET',body,admin=true,token,query='',headers={}}={}){
  const env=environment();if(!env.ready)throw new ApiError('Supabase has not been connected. See SETUP_STUDIO.md',503);
  const url=env.url+path+query;
  const k=admin?env.secret:env.pub;
  const h={'apikey':k,'Accept':'application/json',...headers};
  if(token) h.Authorization=`Bearer ${token}`;
  if(body!==undefined) h['Content-Type']='application/json';
  const r=await fetch(url,{method,headers:h,body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(20000)});
  const text=await r.text();let data;try{data=text?JSON.parse(text):null}catch{data={message:'Non-JSON database response'}}
  if(!r.ok)throw new ApiError((data?.msg||data?.error_description||data?.message||data?.error||`Database request failed ${r.status}`).slice(0,300),r.status===401?401:r.status===403?403:r.status===409?409:502);
  return data;
}
export async function rows(table,{select='*',where={},order,limit=300}={}){
  const q=new URLSearchParams({select});for(const [key,value] of Object.entries(where))q.set(key,value);
  if(order)q.set('order',order);if(limit!==null)q.set('limit',String(limit));
  return supabase('/rest/v1/'+table,{query:'?'+q});
}
export async function patch(table,where,body){
  const q=new URLSearchParams();for(const [key,value] of Object.entries(where))q.set(key,value);
  return supabase('/rest/v1/'+table,{method:'PATCH',query:'?'+q,body,headers:{Prefer:'return=representation'}});
}
export async function insert(table,body,{upsert=false,ignore=false}={}){
  return supabase('/rest/v1/'+table,{method:'POST',body,headers:{Prefer:(upsert?'resolution=merge-duplicates,':ignore?'resolution=ignore-duplicates,':'')+'return=representation'}});
}
export async function authenticate(req,allowed=['owner','editor','reviewer']){
  const bearer=req.headers.get('authorization')||'';
  const token=bearer.match(/^Bearer\s+(.+)$/i)?.[1];if(!token)throw new ApiError('Sign in to access the Editorial Studio',401);
  // Verify token with Supabase Auth, never trust a browser-supplied identity/role.
  const user=await supabase('/auth/v1/user',{admin:false,token});if(!user?.id)throw new ApiError('Invalid session',401);
  const members=await rows('studio_members',{where:{user_id:'eq.'+user.id},limit:1});
  const member=members[0];if(!member?.active)throw new ApiError('Your account has not been invited to the editorial team',403);
  if(!allowed.includes(member.role))throw new ApiError('You do not have permission for this action',403);
  return {user,member};
}
export const canEdit=r=>['owner','editor'].includes(r);
export const canPublish=r=>r==='owner';
export const canSpiritual=r=>['owner','reviewer'].includes(r);
export function validateReview(review){
  if(!review || typeof review!=='object' || Array.isArray(review))throw new ApiError('A review object is required');
  if(!str(review.id,120)||!str(review.title,160)||!Number.isInteger(Number(review.year)))throw new ApiError('Movie id, title and year required');
  if(!['edifying','neutral','destructive'].includes(review.verdict))throw new ApiError('Choose one of the three spiritual verdicts');
  if(!['All Ages','7+','10+','13+','16+','18+','Not Recommended'].includes(review.age))throw new ApiError('Choose an age recommendation');
  if(str(review.verdictRationale).length<20||str(review.ageRationale).length<20)throw new ApiError('Explain the verdict and age recommendation');
  if(!Array.isArray(review.themes)||review.themes.length<4||review.themes.length>40)throw new ApiError('Provide at least four meaningful themes');
  if(!review.themes.every(t=>typeof t.name==='string'&&t.name.trim()&&['positive','harmful','context'].includes(t.type)&&Number.isInteger(t.score)&&t.score>=0&&t.score<=5&&['affirmed','condemned','criticized','mixed','descriptive','unverified'].includes(t.portrayal)&&str(t.evidence).length>=8&&Array.isArray(t.references)&&t.references.some(s=>sourceUrl(s.url))))throw new ApiError('Every theme needs a 0–5 score, rationale, portrayal and HTTPS source');
  if(!Array.isArray(review.sources)||!review.sources.some(s=>sourceUrl(s.url)))throw new ApiError('A film-specific HTTPS source is required');
  if(!Array.isArray(review.questions)||review.questions.length<5||review.questions.some(q=>str(q).length<10))throw new ApiError('Provide five useful discussion questions');
  if (review.familyAdvisories !== undefined) {
    const advisories = review.familyAdvisories;
    if (!advisories || typeof advisories !== 'object' || Array.isArray(advisories)) {
      throw new ApiError('Family content advisories must be an object');
    }
    for (const [type, advisory] of Object.entries(advisories)) {
      if (!['representation', 'advocacy', 'interpretation', 'parentalAuthority', 'familyPortrayal', 'comingOfAge'].includes(type)
          || !str(advisory?.details) || advisory.details.length > 800 || !sourceUrl(advisory.url)) {
        throw new ApiError('Each family content advisory needs a description of up to 800 characters and an HTTPS source');
      }
    }
  }
  return review;
}
export function safeError(err){return reply({error:err instanceof ApiError?err.message:'Unexpected server error'},err instanceof ApiError?err.status:500)}
export function publicReview(row){return {...row.published,id:row.movie_id,reviewType:'published',theologicalApproval:'approved',contentVerification:'editor_checked',editorialStatus:'published',publishedAt:row.published_at}}
