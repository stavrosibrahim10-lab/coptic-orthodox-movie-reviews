import {catalogFilmKey, marvelCatalog} from '../../public/marvel-catalog.js';
import {environment,ApiError,reply,safeError,originAllowed,jsonBody,supabase,rows,patch,insert,authenticate,validateReview,str,sourceUrl,canEdit,canPublish,canSpiritual,requireLgbtqVerification} from './_shared/core.mjs';
import {applyFamilyReviewRecommendation,supplementalReviews} from '../../public/family-review-ratings.js';
import {withLgbtqTheme,getLgbtqTheme} from '../../public/lgbtq-audit.js';
export const config={path:'/api/studio'};
const recentCols='movie_id,title,release_year,verdict,suggested_age,workflow,revision,facts_by,age_by,spiritual_by,published_at,updated_at,published';
const normalizeId=id=>str(id,120).replace(/[^a-zA-Z0-9_-]/g,'');
const roleAllows=(role,action)=>action==='approve_spiritual'?canSpiritual(role):action==='publish'?canPublish(role):canEdit(role);
async function movie(movie_id){const r=await rows('studio_reviews',{where:{movie_id:'eq.'+movie_id},limit:1});if(!r[0])throw new ApiError('Movie not found',404);return r[0];}
async function issuesFor(id){return rows('studio_issues',{where:{movie_id:'eq.'+id},order:'created_at.asc',limit:100});}
async function record(actor,action,movie_id,detail=''){await insert('studio_activity',{actor_id:actor,action,movie_id,detail:str(detail,700)});}
async function snapshot(row,actor,action){await insert('studio_revisions',{movie_id:row.movie_id,revision:row.revision,action,snapshot:row.draft,actor_id:actor});}
function rowSummary(r){return {...r,has_live_version:!!r.published,published:undefined}}
function dashboardReviews(){
  return rows('studio_reviews',{select:recentCols,order:'updated_at.desc',limit:1000});
}
async function registerReleaseDrafts(list){
  const existingIds=new Set(list.map(row=>row.movie_id));
  const existingFilms=new Set(list.map(row=>catalogFilmKey({title:row.title,year:row.release_year})));
  const missing=supplementalReviews.filter(review=>!existingIds.has(review.id));
  const missingMarvel=marvelCatalog.filter(film=>!existingIds.has(film.id)&&!existingFilms.has(catalogFilmKey(film)));
  if(!missing.length&&!missingMarvel.length)return list;
  const drafts=missing.map(review=>{
    const draft=validateReview(withLgbtqTheme(applyFamilyReviewRecommendation(review),{proposeVerdict:true}));
    return {
      movie_id:draft.id,
      title:draft.title,
      release_year:draft.year,
      verdict:draft.verdict,
      suggested_age:draft.age,
      draft,
      workflow:'draft',
      revision:1
    };
  });
  for(const film of missingMarvel){
    drafts.push({movie_id:film.id,title:film.title,release_year:film.year,verdict:null,suggested_age:null,
      draft:withLgbtqTheme({...film,themes:[],warnings:[],questions:[]}),workflow:'draft',revision:1});
  }
  // Only released files supply new drafts. A concurrent import preserves the saved copy.
  await insert('studio_reviews',drafts,{ignore:true});
  return dashboardReviews();
}
async function initializeLgbtqBatch(b,actor,role){
  if(role!=='owner')throw new ApiError('Only the owner may initialize the catalog-wide rating',403);
  if(!Array.isArray(b.movie_ids)||!b.movie_ids.length||b.movie_ids.length>10)
    throw new ApiError('Select 1–10 existing movie IDs per batch');
  const ids=[...new Set(b.movie_ids.map(normalizeId))];
  const results=[];
  // Each movie is separately guarded by revision for safe retry after interruptions.
  for(const id of ids){
    try{
      const row=await movie(id);
      if(getLgbtqTheme(row.draft)){results.push({movie_id:id,state:'already_present'});continue}
      const draft=validateReview(withLgbtqTheme(row.draft,{proposeVerdict:true}));
      const next=await updateReview(row,row.revision,{
        draft,verdict:draft.verdict,suggested_age:draft.age,workflow:'draft',
        facts_by:null,facts_at:null,age_by:null,age_at:null,
        spiritual_by:null,spiritual_at:null,updated_by:actor
      });
      // Do not change the published copy or silently close/open unrelated flags.
      await snapshot(next,actor,'initialized LGBTQ rating');
      await record(actor,'initialized LGBTQ rating',id,'Added source-backed starter or Not Verified screening field; previous sign-offs cleared');
      results.push({movie_id:id,state:'saved',revision:next.revision,score:getLgbtqTheme(draft).score});
    }catch(err){results.push({movie_id:id,state:'error',reason:err instanceof ApiError?err.message:'Unable to save draft'})}
  }
  return {results};
}
function assertMember(role,action){if(!roleAllows(role,action))throw new ApiError('Your role cannot perform this action',403)}
async function updateReview(row,expected,fields){
  if(!Number.isInteger(expected)||expected!==row.revision)throw new ApiError('This review changed since you opened it. Reload it before saving.',409);
  const updated=await patch('studio_reviews',{movie_id:'eq.'+row.movie_id,revision:'eq.'+expected},{...fields,revision:expected+1,updated_at:new Date().toISOString()});
  if(!updated.length)throw new ApiError('Another editor changed this review. Reload the latest version.',409);
  return updated[0];
}
async function login(b){
  const email=str(b.email,320).toLowerCase();const password=str(b.password,2000);
  if(!email||!password)throw new ApiError('Enter email and password');
  const session=await supabase('/auth/v1/token',{admin:false,method:'POST',query:'?grant_type=password',body:{email,password}});
  const user=session.user;
  if(!user?.id)throw new ApiError('Authentication unsuccessful',401);
  const membership=await rows('studio_members',{where:{user_id:'eq.'+user.id},limit:1});
  if(!membership[0]?.active)throw new ApiError('This user is not an active member of the editorial team',403);
  return {access_token:session.access_token,refresh_token:session.refresh_token,expires_in:session.expires_in,member:membership[0],email:user.email};
}
async function refresh(b){
  const token=str(b.refresh_token,2048);if(!token)throw new ApiError('Refresh token missing',401);
  const session=await supabase('/auth/v1/token',{admin:false,method:'POST',query:'?grant_type=refresh_token',body:{refresh_token:token}});
  const m=await rows('studio_members',{where:{user_id:'eq.'+session.user?.id},limit:1});
  if(!m[0]?.active)throw new ApiError('Editorial access has been revoked',403);
  return {access_token:session.access_token,refresh_token:session.refresh_token,expires_in:session.expires_in,member:m[0],email:session.user?.email};
}
function ensureDraftIdentity(b,row){
  const r=b.review;
  if(!r||r.id!==row.movie_id||r.title!==row.title||Number(r.year)!==row.release_year)throw new ApiError('Movie title, year and canonical ID cannot be changed here');
  return validateReview(r);
}
async function getItem(id){const row=await movie(id);const [issues,history]=await Promise.all([issuesFor(id),rows('studio_revisions',{where:{movie_id:'eq.'+id},select:'id,revision,action,actor_id,created_at',order:'created_at.desc',limit:40})]);return {row,issues,history};}
async function actionReview(action,b,actor,role){
  const id=normalizeId(b.movie_id);if(!id)throw new ApiError('Movie id required');
  const row=await movie(id);const expected=Number(b.revision);
  if(action==='save'){
    assertMember(role,'save');const draft=ensureDraftIdentity(b,row);
    const next=await updateReview(row,expected,{draft,verdict:draft.verdict,suggested_age:draft.age,workflow:'draft',facts_by:null,facts_at:null,age_by:null,age_at:null,spiritual_by:null,spiritual_at:null,updated_by:actor});
    await patch('studio_issues',{movie_id:'eq.'+id,state:'neq.open'},{state:'open',resolution_note:'',resolved_by:null,resolved_at:null});
    await snapshot(next,actor,'saved draft');await record(actor,'saved draft',id,'Review edited; previous approvals cleared');
    return {row:next};
  }
  if(action==='approve_facts'||action==='approve_age'||action==='approve_spiritual'){
    assertMember(role,action);validateReview(row.draft);requireLgbtqVerification(row.draft);
    const updates={updated_by:actor};const now=new Date().toISOString();
    if(action==='approve_facts'){updates.facts_by=actor;updates.facts_at=now;}
    if(action==='approve_age'){updates.age_by=actor;updates.age_at=now;}
    if(action==='approve_spiritual'){updates.spiritual_by=actor;updates.spiritual_at=now;}
    const complete=(updates.facts_by||row.facts_by)&&(updates.age_by||row.age_by)&&(updates.spiritual_by||row.spiritual_by);
    updates.workflow=complete?'ready':'in_review';
    const next=await updateReview(row,expected,updates);await snapshot(next,actor,action);await record(actor,action,id);
    return {row:next};
  }
  if(action==='publish'){
    assertMember(role,'publish');validateReview(row.draft);
    if(!row.facts_by||!row.age_by||!row.spiritual_by)throw new ApiError('Facts, age guidance, and spiritual assessment must all be signed off');
    const pending=(await issuesFor(id)).filter(i=>i.state==='open');
    if(pending.length)throw new ApiError(`Resolve or document a waiver for the ${pending.length} outstanding audit issue(s) first`);
    requireLgbtqVerification(row.draft);
    const draft={...row.draft,contentVerification:'editor_checked',theologicalApproval:'approved',editorialStatus:'published'};
    const next=await updateReview(row,expected,{draft,published:draft,workflow:'published',published_at:new Date().toISOString(),published_by:actor,updated_by:actor});
    await snapshot(next,actor,'published');await record(actor,'published',id,'New public version released');
    return {row:next};
  }
  if(action==='rollback'){
    assertMember(role,'rollback');
    const version=Number(b.history_id);if(!Number.isInteger(version)||version<=0)throw new ApiError('Invalid history id');
    const records=await rows('studio_revisions',{where:{id:'eq.'+version,movie_id:'eq.'+id},limit:1});
    if(!records.length)throw new ApiError('Version not found',404);
    const draft=validateReview(records[0].snapshot);
    const next=await updateReview(row,expected,{draft,verdict:draft.verdict,suggested_age:draft.age,workflow:'draft',facts_by:null,facts_at:null,age_by:null,age_at:null,spiritual_by:null,spiritual_at:null,updated_by:actor});
    await patch('studio_issues',{movie_id:'eq.'+id,state:'neq.open'},{state:'open',resolution_note:'',resolved_by:null,resolved_at:null});
    await snapshot(next,actor,'restored older draft');await record(actor,'restored older draft',id,'Review approvals cleared; live version unchanged');return {row:next};
  }
  throw new ApiError('Unknown review action',404);
}
async function changeIssue(b,actor,role){
  assertMember(role,'issue');const id=str(b.issue_id,50);const matches=await rows('studio_issues',{where:{id:'eq.'+id},limit:1});
  const target=matches[0];if(!target)throw new ApiError('Issue not found',404);
  const state=str(b.state,20);if(!['open','resolved','waived'].includes(state))throw new ApiError('Invalid issue state');
  if(state==='waived'&&role!=='owner')throw new ApiError('Only the owner may waive a verification item',403);
  const note=str(b.resolution_note,3000);if(state!=='open'&&note.length<12)throw new ApiError('Explain the evidence checked or reason for waiver (at least 12 characters)');
  const updated=await patch('studio_issues',{id:'eq.'+id},{state,resolution_note:note,resolved_by:state==='open'?null:actor,resolved_at:state==='open'?null:new Date().toISOString()});
  await record(actor,state==='open'?'reopened issue':state+' issue',target.movie_id,target.title+': '+note);return {issue:updated[0]};
}
async function aiDraft(b){
  const key=process.env.OPENAI_API_KEY;
  if(!key)throw new ApiError('OPENAI_API_KEY not configured; AI drafting is disabled',503);
  const evidence=str(b.evidence,25000);if(evidence.length<150)throw new ApiError('Provide at least 150 characters of sourced observations');
  const r=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.OPENAI_MODEL||'gpt-4.1-mini',temperature:0.2,response_format:{type:'json_object'},messages:[{role:'system',content:'You are a research assistant for an independent Orthodox-informed Christian family movie review publication. Use ONLY supplied documentary evidence, do not assert you viewed the film, invent scenes, infer absence from silence, or invent citations/Church Fathers quotes. Return JSON {proposed_verdict, verdict_rationale, proposed_age, age_rationale, theme_suggestions, discussion_questions, verification_gaps}. Theme suggestions have name,type,score,portrayal,evidence,source_url; where no direct supporting source URL is supplied, write null for score and source_url. Three verdicts: edifying, neutral, destructive. Age recommendations are independent. This is a draft suggestion, never approval.'},{role:'user',content:JSON.stringify({film:str(b.title,160),year:b.year,evidence,source_urls:str(b.source_urls,3500)})}]})});
  const data=await r.json().catch(()=>({}));if(!r.ok)throw new ApiError(data.error?.message||'AI drafting unavailable',502);
  try{return {proposal:JSON.parse(data.choices[0].message.content),disclaimer:'AI proposal only. It is not saved or approved. Verify all claims and links independently.'}}catch{throw new ApiError('AI returned malformed structured output',502)}
}
function studioRedirect(req){return (process.env.STUDIO_PUBLIC_URL||new URL(req.url).origin+'/studio/').replace(/\/$/,'')+'/';}
async function invite(b,actor,req){
  const email=str(b.email,320).toLowerCase();const role=str(b.role,20);const name=str(b.display_name,120);
  if(!/^\S+@\S+\.\S+$/.test(email)||!['editor','reviewer'].includes(role))throw new ApiError('Enter an email and choose editor or reviewer');
  const users=await supabase('/auth/v1/invite',{method:'POST',query:'?redirect_to='+encodeURIComponent(studioRedirect(req)),body:{email,data:{invited_by_project:'The Orthodox Lens'}}});
  if(!users?.id)throw new ApiError('Invite did not return a user identifier',502);
  await insert('studio_members',{user_id:users.id,display_name:name||email,role,active:true},{upsert:true});
  await record(actor,'invited team member',null,email+' ('+role+')');
  return {invited:email,role};
}
async function teamRole(b,actor){
  const id=str(b.user_id,80);const role=str(b.role,20);const active=b.active===true;
  if(!['owner','editor','reviewer'].includes(role))throw new ApiError('Invalid role');
  if(id===actor&&!active)throw new ApiError('You cannot deactivate your own account');
  if(id===actor&&role!=='owner')throw new ApiError('You cannot demote yourself');
  const all=await rows('studio_members',{where:{user_id:'eq.'+id},limit:1});if(!all.length)throw new ApiError('Team member not found',404);
  if(all[0].role==='owner'&&(!active||role!=='owner')){
    const owners=await rows('studio_members',{where:{role:'eq.owner',active:'eq.true'},select:'user_id',limit:100});
    if(owners.length<=1)throw new ApiError('Cannot deactivate the last owner');
  }
  const changed=await patch('studio_members',{user_id:'eq.'+id},{role,active,updated_at:new Date().toISOString()});
  await record(actor,'changed team role',null,`${id}: ${role}, active=${active}`);return {member:changed[0]};
}
export default async function handler(req){
  if(req.method!=='GET'&&req.method!=='POST')return reply({error:'Method not allowed'},405);
  if(!originAllowed(req))return reply({error:'Invalid origin'},403);
  const method=req.method;const query=new URL(req.url).searchParams;
  try{
    if(method==='GET'&&query.get('action')==='config')return reply({connected:environment().ready,name:'The Orthodox Lens Editorial Studio',authentication:'Supabase Auth',version:'13.0'});
    if(!environment().ready)throw new ApiError('Studio is not connected to a Supabase project. Follow SETUP_STUDIO.md',503);
    const b=method==='POST'?await jsonBody(req):{};
    const action=method==='POST'?str(b.action,40):str(query.get('action'),40);
    if(method==='POST'&&action==='login')return reply(await login(b));
    if(method==='POST'&&action==='refresh')return reply(await refresh(b));
    if(method==='POST'&&action==='password_reset'){
      const email=str(b.email,320).toLowerCase();if(!/^\S+@\S+\.\S+$/.test(email))throw new ApiError('Enter a valid email address');
      await supabase('/auth/v1/recover',{admin:false,method:'POST',query:'?redirect_to='+encodeURIComponent(studioRedirect(req)),body:{email}});
      return reply({ok:true,message:'If this is a registered account, the password reset instructions have been sent.'});
    }
    const {user,member}=await authenticate(req);
    const role=member.role;const actor=user.id;
    if(method==='POST'&&action==='set_password'){
      const password=str(b.password,250);if(password.length<12)throw new ApiError('Use a strong password of at least 12 characters');
      const token=(req.headers.get('authorization')||'').replace(/^Bearer\s+/i,'');
      await supabase('/auth/v1/user',{admin:false,method:'PUT',token,body:{password}});
      await record(actor,'changed account password',null,'Via secure Studio invite/recovery flow');
      return reply({ok:true});
    }
    if(method==='POST'&&action==='logout'){
      try{await supabase('/auth/v1/logout',{admin:false,method:'POST',token:(req.headers.get('authorization')||'').replace(/^Bearer\s+/i,'')});}catch{}
      return reply({signed_out:true});
    }
    if(action==='bootstrap'){
      let [list,issues,members,activity]=await Promise.all([
        dashboardReviews(),
        rows('studio_issues',{select:'id,movie_id,kind,state,title,detail,source_url,resolution_note',limit:2000}),
        rows('studio_members',{select:'user_id,display_name,role,active,created_at',limit:100}),
        rows('studio_activity',{select:'action,movie_id,detail,created_at,actor_id',order:'created_at.desc',limit:15})]);
      let releaseDraftsPending=false;
      if(method==='POST'){
        try { list=await registerReleaseDrafts(list); }
        catch { releaseDraftsPending=true; }
      }
      return reply({user:{id:actor,email:user.email,role,display_name:member.display_name},reviews:list.map(rowSummary),issues,members,activity,releaseDraftsPending});
    }
    if(method==='GET'&&action==='item')return reply(await getItem(normalizeId(query.get('id'))));
    if(method==='GET'&&action==='metrics'){
      const days=Math.min(365,Math.max(1,Number(query.get('days'))||30));
      const r=await supabase('/rest/v1/rpc/studio_analytics_snapshot',{method:'POST',body:{p_days:days}});
      return reply({days,...r});
    }
    if(method==='GET'&&action==='export'){
      if(role!=='owner')throw new ApiError('Only the owner may export all editorial content',403);
      const all=await rows('studio_reviews',{limit:1000});return reply({exported_at:new Date().toISOString(),reviews:all});
    }
    if(method!=='POST')throw new ApiError('Unknown API action',404);
    if(['save','approve_facts','approve_age','approve_spiritual','publish','rollback'].includes(action))return reply(await actionReview(action,b,actor,role));
    if(action==='issue')return reply(await changeIssue(b,actor,role));
    if(action==='lgbtq_initialize')return reply(await initializeLgbtqBatch(b,actor,role));
    if(action==='ai'){assertMember(role,'save');return reply(await aiDraft(b));}
    if(action==='invite'){if(role!=='owner')throw new ApiError('Only the owner can invite editors',403);return reply(await invite(b,actor,req));}
    if(action==='team_role'){if(role!=='owner')throw new ApiError('Only the owner can change roles',403);return reply(await teamRole(b,actor));}
    throw new ApiError('Unknown API action',404);
  }catch(err){return safeError(err)}
}