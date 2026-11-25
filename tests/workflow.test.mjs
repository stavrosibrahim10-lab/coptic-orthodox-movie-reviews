import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import handler from '../netlify/functions/studio.mjs';
import publishedHandler from '../netlify/functions/reviews.mjs';
import {withLgbtqTheme,getLgbtqTheme,LGBTQ_THEME_NAME,lgbtqImpact,LGBTQ_VERIFIED_STARTERS} from '../public/lgbtq-audit.js';
import {validateReview,requireLgbtqVerification} from '../netlify/functions/_shared/core.mjs';
const seed=JSON.parse(fs.readFileSync(new URL('../bootstrap/studio-import.json',import.meta.url),'utf8'));
const originalFetch=globalThis.fetch;
const configKeys=['SUPABASE_URL','SUPABASE_PUBLISHABLE_KEY','SUPABASE_SECRET_KEY'];
const originalEnv=Object.fromEntries(configKeys.map(k=>[k,process.env[k]]));
for(const [k,v] of Object.entries({SUPABASE_URL:'https://fake-project.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_mock',SUPABASE_SECRET_KEY:'sb_secret_mock'}))process.env[k]=v;
const movieId=seed.reviews[0].id;
const draft=withLgbtqTheme(JSON.parse(JSON.stringify(seed.reviews[0])));
// Synthetic verified-test fixture; not a real claim about this film.
getLgbtqTheme(draft).score=0;
getLgbtqTheme(draft).evidence='Synthetic test-only screening note; not used in the actual movie catalog.';
getLgbtqTheme(draft).references=[{label:'Fixture',url:'https://example.com/test-fixture'}];
let working={movie_id:movieId,title:draft.title,release_year:draft.year,revision:1,draft,workflow:'draft',facts_by:null,age_by:null,spiritual_by:null,published:null};
let issue={id:'7b05fbbe-c324-4d80-a9d6-a47dc1315159',movie_id:movieId,kind:'source',state:'open',title:'Issue',detail:'Must verify'};
let role='owner';
const releaseDrafts=new Map();
let releaseInsertAttempts=0;
let releaseImportBlocked=false;
const parseFilter=(params,key,attr)=>{const filter=params.get(key);return !filter||filter===`eq.${attr}`};
function wrap(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json'}})}
globalThis.fetch=async (url,opt={})=>{
 const u=new URL(url);const p=u.pathname,method=opt.method||'GET';
 if(p==='/auth/v1/user')return wrap({id:'ab1a1212-1212-1212-1212-121212121212',email:'editor@test.com'});
 if(p==='/rest/v1/studio_members')return wrap([{user_id:'ab1a1212-1212-1212-1212-121212121212',active:true,role,display_name:'Test'}]);
 if(p==='/rest/v1/studio_reviews'){
  if(method==='POST'){
   assert.match(opt.headers.Prefer,/resolution=ignore-duplicates/);
   releaseInsertAttempts++;
   if(releaseImportBlocked)return wrap({message:'Test import failure'},500);
   const created=[];
   for(const row of JSON.parse(opt.body)){
    if(row.movie_id===movieId||releaseDrafts.has(row.movie_id))continue;
    const record={...row,published:null};
    releaseDrafts.set(row.movie_id,record);
    created.push(record);
   }
   return wrap(created,201);
  }
  if(method==='PATCH'){
   const body=JSON.parse(opt.body);if(Number(u.searchParams.get('revision')?.replace('eq.',''))!==working.revision)return wrap([]);
   working={...working,...body};return wrap([working]);
  }
  const records=[working,...releaseDrafts.values()]
   .filter(row=>parseFilter(u.searchParams,'movie_id',row.movie_id));
  return wrap(u.searchParams.get('published')==='not.is.null'?records.filter(row=>row.published):records);
 }
 if(p==='/rest/v1/studio_issues'){
  if(method==='PATCH'){issue={...issue,...JSON.parse(opt.body)};return wrap([issue]);}
  return wrap([issue]);
 }
 if(['/rest/v1/studio_revisions','/rest/v1/studio_activity'].includes(p))return wrap([{}]);
 return wrap({message:'Unexpected '+method+' '+p},500);
};
function req(action,data,auth=true){return new Request('https://orthodox.example/api/studio',{method:'POST',headers:{'content-type':'application/json',...(auth?{authorization:'Bearer trusted-test-token'}:{})},body:JSON.stringify({action,...data})});}
async function status(action,data,auth=true){const r=await handler(req(action,data,auth));return {status:r.status,body:await r.json()}}
async function publicFeed(){
 const response=await publishedHandler(new Request('https://orthodox.example/api/reviews'));
 assert.equal(response.status,200);
 assert.equal(response.headers.get('Cache-Control'),'no-store');
 return (await response.json()).reviews;
}
test('opening Studio registers released films as drafts and preserves existing review data',async()=>{
 const emojiId='catalog-2017-the-emoji-movie';
 const anonymous=await status('bootstrap',{},false);
 assert.equal(anonymous.status,401);
 assert.equal(releaseInsertAttempts,0);
 releaseImportBlocked=true;
 const partial=await status('bootstrap',{});
 assert.equal(partial.status,200);
 assert.equal(partial.body.releaseDraftsPending,true);
 assert.ok(partial.body.reviews.some(review=>review.movie_id===movieId));
 releaseImportBlocked=false;
 const loaded=await status('bootstrap',{review:{id:'client-supplied-review'}});
 assert.equal(loaded.status,200);
 assert.equal(loaded.body.releaseDraftsPending,false);
 assert.equal(releaseDrafts.size,1);
 assert.equal(loaded.body.reviews.find(review=>review.movie_id===emojiId)?.workflow,'draft');
 assert.equal(releaseDrafts.get(emojiId).draft.verdict,'destructive');
 assert.equal(releaseDrafts.get(emojiId).published,null);
 assert.ok(!(await publicFeed()).some(review=>review.id===emojiId));
 const prior=releaseDrafts.get(emojiId);
 prior.draft.editorNote='Saved notes from the editor.';
 prior.revision=3;
 const attemptsBefore=releaseInsertAttempts;
 const again=await status('bootstrap',{});
 assert.equal(again.status,200);
 assert.equal(again.body.reviews.find(review=>review.movie_id===emojiId).revision,3);
 assert.equal(releaseInsertAttempts,attemptsBefore);
 assert.equal(releaseDrafts.get(emojiId).draft.editorNote,'Saved notes from the editor.');
});
test('auth required for reviewing drafts',async()=>{
 const r=await status('publish',{movie_id:movieId,revision:1},false);assert.equal(r.status,401);
});
test('editor cannot publish',async()=>{
 role='editor';const r=await status('publish',{movie_id:movieId,revision:1});assert.equal(r.status,403);role='owner';
});
test('owner cannot publish without three signoffs',async()=>{
 const r=await status('publish',{movie_id:movieId,revision:1});assert.equal(r.status,400);assert.match(r.body.error,/signed off/);
});
test('owner cannot publish when a source flag remains open',async()=>{
 working.facts_by=working.age_by=working.spiritual_by='ab1a1212-1212-1212-1212-121212121212';
 const r=await status('publish',{movie_id:movieId,revision:1});assert.equal(r.status,400);assert.match(r.body.error,/outstanding audit/);
});
test('owner publishes verified, signed draft after source issue is resolved',async()=>{
 issue.state='resolved';const r=await status('publish',{movie_id:movieId,revision:1});assert.equal(r.status,200);
 assert.equal(r.body.row.workflow,'published');assert.ok(r.body.row.published);assert.equal(r.body.row.published.theologicalApproval,'approved');
});
test('saving changes resets signatures and reopens resolved flags',async()=>{
 const familyAdvisories = {
  advocacy: {details:'The film encourages habitat conservation.',url:'https://example.com/film-review'},
  parentalAuthority: {details:'The story shows the consequences of leaving home without permission.',url:'https://example.com/film-review'},
  familyPortrayal: {details:'The father helps his child talk through a disagreement.',url:'https://example.com/film-review'},
  comingOfAge: {details:'Two friends discuss puberty and crushes.',url:'https://example.com/film-review'}
 };
 const contextTheme={name:'Family and cultural themes',type:'context',score:3,portrayal:'mixed',
  evidence:'The central conflict tests the family’s trust.',references:[{label:'Guide',url:'https://example.com/film-review'}]};
 const warnings=[{name:'Intense peril',severity:'Moderate',details:'This is the new viewing note from the editor.'}];
 const d={...working.draft,verdictRationale:working.draft.verdictRationale+' Additional editor explanation.',
  familyAdvisories,themes:[...working.draft.themes,contextTheme],warnings};
 const r=await status('save',{movie_id:movieId,revision:working.revision,review:d});
 assert.equal(r.status,200);assert.equal(r.body.row.facts_by,null);assert.equal(r.body.row.spiritual_by,null);
 assert.equal(issue.state,'open');assert.ok(r.body.row.published,'Previous public version should remain unchanged');
 assert.deepEqual(r.body.row.draft.familyAdvisories, familyAdvisories);
 assert.equal(r.body.row.published.familyAdvisories, undefined);
 const beforePublish=(await publicFeed()).find(review=>review.id===movieId);
 assert.ok(!beforePublish.warnings?.some(warning=>warning.name==='Intense peril'));
 working.facts_by=working.age_by=working.spiritual_by='ab1a1212-1212-1212-1212-121212121212';
 issue.state='resolved';
 const published = await status('publish', {movie_id:movieId,revision:working.revision});
 assert.equal(published.status,200);
 assert.deepEqual(published.body.row.published.familyAdvisories,familyAdvisories);
 assert.deepEqual(published.body.row.published.themes.at(-1),contextTheme);
 const afterPublish=(await publicFeed()).find(review=>review.id===movieId);
 assert.deepEqual(afterPublish.warnings,warnings);
 assert.deepEqual(afterPublish.familyAdvisories,familyAdvisories);
 assert.deepEqual(afterPublish.themes.at(-1),contextTheme);
});
test('saving an advisory requires an HTTPS source',async()=>{
 const review={...working.draft,familyAdvisories:{representation:{details:'A brief reference in dialogue.',url:''}}};
 const r=await status('save',{movie_id:movieId,revision:working.revision,review});
 assert.equal(r.status,400);
 assert.match(r.body.error,/HTTPS source/);
});
process.on('exit',()=>{globalThis.fetch=originalFetch;for(const [k,v] of Object.entries(originalEnv))if(v===undefined)delete process.env[k];else process.env[k]=v});

test('201 library entries have one non-invented LGBTQ rating, seven sourced and the remainder Not Verified', async()=>{
 const all=[...seed.reviews,...(await import('../public/family-review-ratings.js')).supplementalReviews];
 assert.equal(all.length,201);
 assert.equal(Object.keys(LGBTQ_VERIFIED_STARTERS).length,7);
 let verified=0,pending=0;
 for(const raw of all){
   const review=withLgbtqTheme(raw,{proposeVerdict:true});
   const themes=review.themes.filter(t=>t.name===LGBTQ_THEME_NAME);
   assert.equal(themes.length,1);
   const t=themes[0];
   if(t.score===null){pending++;assert.equal(t.references.length,0)}
   else {verified++;assert.equal(t.references.length,1);assert.ok(t.references[0].url.startsWith('https://'))}
   validateReview(review);
 }
 assert.equal(verified,7); assert.equal(pending,194);
 assert.equal(lgbtqImpact(0),'not_applicable');
 assert.equal(lgbtqImpact(1),'neutral');
 for(let i=2;i<=5;i++)assert.equal(lgbtqImpact(i),'destructive');
 assert.equal(lgbtqImpact(null),'not_verified');
});
test('LGBTQ 2–5 forces a destructive verdict, and unverified cannot be signed off',()=>{
 const notVerified=withLgbtqTheme(JSON.parse(JSON.stringify(seed.reviews[1])));
 assert.equal(getLgbtqTheme(notVerified).score,null);
 assert.doesNotThrow(()=>validateReview(notVerified));
 assert.throws(()=>requireLgbtqVerification(notVerified),/Complete the film-specific LGBTQ/);
 const sourceTheme=getLgbtqTheme(notVerified);
 sourceTheme.score=2;sourceTheme.portrayal='descriptive';sourceTheme.evidence='Synthetic film scene evidence for this test only.';
 sourceTheme.references=[{label:'Fixture',url:'https://example.com/test-fixture'}];
 notVerified.verdict='neutral';
 assert.throws(()=>validateReview(notVerified),/rating 2–5 requires Destructive/);
 notVerified.verdict='destructive';assert.doesNotThrow(()=>validateReview(notVerified));
 assert.doesNotThrow(()=>requireLgbtqVerification(notVerified));
});
test('owner batch initialization preserves editor text and the published version, and can be retried',async()=>{
 const originalPublished=structuredClone(working.published);
 const userText='Pre-existing editorial observations must survive this new category.';
 working.draft.editorNote=userText;
 working.draft.themes=working.draft.themes.filter(t=>t.name!==LGBTQ_THEME_NAME);
 const previousRevision=working.revision;
 const response=await status('lgbtq_initialize',{movie_ids:[movieId]});
 assert.equal(response.status,200);
 assert.deepEqual(response.body.results.map(r=>r.state),['saved']);
 assert.equal(working.revision,previousRevision+1);
 assert.equal(working.draft.editorNote,userText);
 assert.equal(getLgbtqTheme(working.draft).score,null);
 assert.equal(working.workflow,'draft');
 assert.equal(working.facts_by,null);
 assert.deepEqual(working.published,originalPublished);
 const second=await status('lgbtq_initialize',{movie_ids:[movieId]});
 assert.equal(second.status,200);
 assert.deepEqual(second.body.results.map(r=>r.state),['already_present']);
 assert.equal(working.revision,previousRevision+1);
});
test('only the owner can batch-initialize and batches are size limited',async()=>{
 role='editor';
 const forbidden=await status('lgbtq_initialize',{movie_ids:[movieId]});
 assert.equal(forbidden.status,403);
 role='owner';
 const oversized=await status('lgbtq_initialize',{movie_ids:Array.from({length:11},(_,i)=>'test-'+i)});
 assert.equal(oversized.status,400);
});