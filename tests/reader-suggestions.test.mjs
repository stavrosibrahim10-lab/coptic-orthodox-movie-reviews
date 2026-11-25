import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import handler,{validateSuggestion} from '../netlify/functions/suggestions.mjs';
import {validateReview,ApiError} from '../netlify/functions/_shared/core.mjs';

const originalFetch=globalThis.fetch;
const keys=['SUPABASE_URL','SUPABASE_PUBLISHABLE_KEY','SUPABASE_SECRET_KEY'];
const saved=Object.fromEntries(keys.map(k=>[k,process.env[k]]));
Object.assign(process.env,{SUPABASE_URL:'https://fake-project.supabase.co',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_mock',SUPABASE_SECRET_KEY:'sb_secret_mock'});
const seed=JSON.parse(fs.readFileSync(new URL('../bootstrap/studio-import.json',import.meta.url),'utf8'));
const sampleMovie=seed.reviews[0];
const editorId='ab1a1212-1212-1212-1212-121212121212';
const submissions=[];
let editorRole='owner';
const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json'}});
function select(items,url){
 const where=url.searchParams;
 return items.filter(x=>{
  for(const k of ['id','movie_id','state']){
   const v=where.get(k);if(v?.startsWith('eq.')&&String(x[k]??'')!==v.slice(3))return false;
  }
  if(where.get('created_at')?.startsWith('gte.')){
   const date=where.get('created_at').slice(4);if(x.created_at<date)return false;
  }
  return true;
 });
}
globalThis.fetch=async (url,opt={})=>{
 const u=new URL(url),method=opt.method||'GET';
 if(u.pathname==='/auth/v1/user')return reply({id:editorId,email:'moderator@orthodox.example'});
 if(u.pathname==='/rest/v1/studio_members')return reply([{user_id:editorId,active:true,role:editorRole}]);
 if(u.pathname==='/rest/v1/studio_reviews')return reply([{movie_id:sampleMovie.id,title:sampleMovie.title}]);
 if(u.pathname==='/rest/v1/studio_activity')return reply([{}],201);
 if(u.pathname==='/rest/v1/studio_suggestions'){
  if(method==='GET'){
    const items=select(submissions,u);
    return reply(items.slice(0,Number(u.searchParams.get('limit'))||300).map(x=>{
      if(!u.searchParams.get('select')||u.searchParams.get('select')==='*')return x;
      return Object.fromEntries(u.searchParams.get('select').split(',').map(k=>[k,x[k]]));
    }));
  }
  if(method==='POST'){
    const body=JSON.parse(opt.body);
    if(submissions.some(x=>x.content_hash===body.content_hash))return reply({message:'duplicate key violates unique constraint studio_suggestions_content_hash_key'},409);
    const x={id:'6fabe83c-949d-4a45-bd56-29dce59e60'+String(submissions.length+10),created_at:new Date().toISOString(),...body};
    submissions.push(x);return reply([x],201);
  }
  if(method==='PATCH'){
    const x=select(submissions,u)[0];if(!x)return reply([]);
    Object.assign(x,JSON.parse(opt.body));return reply([x]);
  }
 }
 return reply({message:'Unexpected '+method+' '+u.pathname},500);
};
function call(method,action,data={},token=false,origin='https://orthodox.example'){
 const url='https://orthodox.example/api/suggestions'+(method==='GET'?`?action=${encodeURIComponent(action)}${data.movie_id?'&movie_id='+encodeURIComponent(data.movie_id):''}`:'');
 return new Request(url,{method,headers:{...(token?{authorization:'Bearer test-session-token'}:{}),...(method==='POST'?{'Content-Type':'application/json'}:{}),...(origin?{origin}: {})},...(method==='POST'?{body:JSON.stringify({action,...data})}:{})});
}
async function send(req){const r=await handler(req);return {status:r.status,body:await r.json()}}
const valid={kind:'biblical_parallel',movie_id:sampleMovie.id,scripture_reference:'Luke 15:11–32',details:'The father’s response to his son is worth comparing with the parable in Luke 15.',source_url:'https://example.org/guide'};

test('visitor can submit a biblical parallel without account, but it is not publicly visible pending approval',async()=>{
 const r=await send(call('POST','submit',valid));assert.equal(r.status,202);assert.equal(r.body.received,true);
 assert.equal(submissions.length,1);assert.equal(submissions[0].state,'pending');
 const publicList=await send(call('GET','approved',{movie_id:sampleMovie.id}));
 assert.equal(publicList.status,200);assert.deepEqual(publicList.body.suggestions,[]);
 const privateList=await send(call('GET','queue'));
 assert.equal(privateList.status,401);
});
test('submission needs a valid type, reasonable length, and safe HTTPS links',()=>{
 assert.throws(()=>validateSuggestion({...valid,source_url:'javascript:alert(1)'}),ApiError);
 assert.throws(()=>validateSuggestion({...valid,details:'short'}),ApiError);
 assert.throws(()=>validateSuggestion({...valid,scripture_reference:''}),ApiError);
 assert.throws(()=>validateSuggestion({...valid,kind:'malicious_kind'}),ApiError);
});
test('duplicate submission does not produce duplicate rows or disclose previous moderation',async()=>{
 const r=await send(call('POST','submit',valid));assert.equal(r.status,202);assert.equal(submissions.length,1);
});
test('honeypot and different-origin posts do not create content',async()=>{
 const trap=await send(call('POST','submit',{...valid,website:'a spammer value'}));assert.equal(trap.status,202);
 const badOrigin=await send(call('POST','submit',valid,false,'https://not-this-site.example'));assert.equal(badOrigin.status,403);
 assert.equal(submissions.length,1);
});
test('editors must authenticate; owner approves and only then public feed exposes sanitized fields',async()=>{
 editorRole='reviewer';const reviewer=await send(call('POST','moderate',{id:submissions[0].id,decision:'approved'},true));assert.equal(reviewer.status,403);
 editorRole='owner';const queue=await send(call('GET','queue',{},true));assert.equal(queue.status,200);assert.equal(queue.body.suggestions[0].state,'pending');
 const approval=await send(call('POST','moderate',{id:submissions[0].id,decision:'approved',moderator_note:'Sources reviewed.'},true));assert.equal(approval.status,200);
 const feed=await send(call('GET','approved',{movie_id:sampleMovie.id}));assert.equal(feed.status,200);assert.equal(feed.body.suggestions.length,1);
 assert.equal(feed.body.suggestions[0].details,valid.details);
 assert.equal(feed.body.suggestions[0].moderator_note,undefined);
 assert.equal(feed.body.suggestions[0].content_hash,undefined);
 const repeat=await send(call('POST','moderate',{id:submissions[0].id,decision:'approved'},true));assert.equal(repeat.status,409);
});
test('biblical parallels in reviews require an identifiable film scene, Scripture and source',()=>{
 const base=structuredClone(sampleMovie);
 base.biblicalParallels=[{title:'Parable of mercy',filmMoment:'The character returns and is welcomed despite prior wrongdoing.',scriptureReference:'Luke 15:11–32',reflection:'The story offers a discussion of repentance and mercy, without claiming the filmmakers intended a Gospel retelling.',sourceUrl:'https://example.com/parent-guide'}];
 assert.doesNotThrow(()=>validateReview(base));
 base.biblicalParallels[0].sourceUrl='';assert.throws(()=>validateReview(base),/film-specific HTTPS source/);
});
test('homepage onboarding, review connection editor and navigation routes exist',()=>{
 const app=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
 const studio=fs.readFileSync(new URL('../public/studio/studio.js',import.meta.url),'utf8');
 const html=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
 assert.ok(app.indexOf('${howToUse()}')<app.indexOf('${summaryStrip()}'));
 assert.ok(app.includes('How to use The Orthodox Lens'));
 assert.ok(app.includes('function renderBiblicalParallels'));
 assert.ok(app.includes('hash===\'suggest\'?suggestionPage()'));
 assert.ok(studio.includes("['suggestions','✉','Reader suggestions']"));
 assert.ok(studio.includes('biblicalParallels'));
 assert.match(html,/href="#suggest"/);
});
process.on('exit',()=>{globalThis.fetch=originalFetch;for(const [k,v] of Object.entries(saved)){if(v===undefined)delete process.env[k];else process.env[k]=v}});
