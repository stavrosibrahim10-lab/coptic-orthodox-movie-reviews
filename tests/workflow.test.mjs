import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import handler from '../netlify/functions/studio.mjs';
const seed=JSON.parse(fs.readFileSync(new URL('../bootstrap/studio-import.json',import.meta.url),'utf8'));
const originalFetch=globalThis.fetch;
const configKeys=['SUPABASE_URL','SUPABASE_PUBLISHABLE_KEY','SUPABASE_SECRET_KEY'];
const originalEnv=Object.fromEntries(configKeys.map(k=>[k,process.env[k]]));
for(const [k,v] of Object.entries({SUPABASE_URL:'https://fake-project.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_mock',SUPABASE_SECRET_KEY:'sb_secret_mock'}))process.env[k]=v;
const movieId=seed.reviews[0].id;
const draft=JSON.parse(JSON.stringify(seed.reviews[0]));
let working={movie_id:movieId,title:draft.title,release_year:draft.year,revision:1,draft,workflow:'draft',facts_by:null,age_by:null,spiritual_by:null,published:null};
let issue={id:'7b05fbbe-c324-4d80-a9d6-a47dc1315159',movie_id:movieId,kind:'source',state:'open',title:'Issue',detail:'Must verify'};
let role='owner';
const parseFilter=(params,key,attr)=>{const filter=params.get(key);return !filter||filter===`eq.${attr}`};
function wrap(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json'}})}
globalThis.fetch=async (url,opt={})=>{
 const u=new URL(url);const p=u.pathname,method=opt.method||'GET';
 if(p==='/auth/v1/user')return wrap({id:'ab1a1212-1212-1212-1212-121212121212',email:'editor@test.com'});
 if(p==='/rest/v1/studio_members')return wrap([{user_id:'ab1a1212-1212-1212-1212-121212121212',active:true,role,display_name:'Test'}]);
 if(p==='/rest/v1/studio_reviews'){
  if(method==='PATCH'){
   const body=JSON.parse(opt.body);if(Number(u.searchParams.get('revision')?.replace('eq.',''))!==working.revision)return wrap([]);
   working={...working,...body};return wrap([working]);
  }
  return wrap([working]);
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
 const d={...working.draft,verdictRationale:working.draft.verdictRationale+' Additional editor explanation.'};
 const r=await status('save',{movie_id:movieId,revision:working.revision,review:d});
 assert.equal(r.status,200);assert.equal(r.body.row.facts_by,null);assert.equal(r.body.row.spiritual_by,null);
 assert.equal(issue.state,'open');assert.ok(r.body.row.published,'Previous public version should remain unchanged');
});
process.on('exit',()=>{globalThis.fetch=originalFetch;for(const [k,v] of Object.entries(originalEnv))if(v===undefined)delete process.env[k];else process.env[k]=v});
