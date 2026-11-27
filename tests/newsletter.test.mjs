import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHandler} from '../netlify/functions/newsletter.mjs';
import {createNewsletterClaims} from '../netlify/functions/_shared/newsletter-claims.mjs';
const env={BREVO_API_KEY:'fake-secret',BREVO_LIST_ID:'3',BREVO_DOI_TEMPLATE_ID:'42'};
function req(fields={email:'reader@example.com',consent:'yes'},origin='https://theorthodoxlens.org'){
  return new Request('https://theorthodoxlens.org/api/newsletter',{method:'POST',headers:{origin,'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams(fields)});
}
function claims(){const keys=new Set();return {async claim(email,list){const k=list+':'+email;if(keys.has(k))return null;keys.add(k);return k;},async release(k){keys.delete(k);}};}
const missing=()=>new Response(null,{status:404});
const contact=(listIds=[],emailBlacklisted=false,listUnsubscribed=[])=>Response.json({listIds,emailBlacklisted,listUnsubscribed});
test('normalizes email and preserves confirmation redirect',async()=>{
  let calls=0;
  const run=createHandler(env,async(url,options)=>{
    if(!options.method){assert.match(url,/reader%40example.com/);return missing();}
    calls++;
    assert.equal(url,'https://api.brevo.com/v3/contacts/doubleOptinConfirmation');
    assert.equal(options.headers['api-key'],'fake-secret');
    assert.deepEqual(JSON.parse(options.body),{email:'reader@example.com',includeListIds:[3],templateId:42,redirectionUrl:'https://theorthodoxlens.org/newsletter-confirmed/'});
    return new Response(null,{status:201});
  },claims());
  const result=await run(req({email:' Reader@EXAMPLE.COM ',consent:'yes'}));
  assert.equal(result.status,200);assert.match(await result.text(),/after confirming/);assert.equal(calls,1);
});
test('confirmed or opted-out contacts never get another confirmation',async()=>{
  for(const data of [()=>contact([3]),()=>contact([],true),()=>contact([],false,[3])]){
    const run=createHandler(env,async(url,options)=>{assert.equal(options.method,undefined);return data();}, {claim(){assert.fail('No claim');}});
    assert.equal((await run(req())).status,200);
  }
});
test('concurrent same-email requests produce one DOI request',async()=>{
  let sends=0;const run=createHandler(env,async(url,o)=>{if(!o.method)return missing();sends++;return new Response(null,{status:201});},claims());
  const results=await Promise.all([run(req()),run(req({email:'READER@example.com',consent:'yes'})),run(req())]);
  assert.deepEqual(results.map(r=>r.status),[200,200,200]);assert.equal(sends,1);
});
test('storage unavailable fails closed',async()=>{
  let sends=0;const run=createHandler(env,async(url,o)=>{if(!o.method)return missing();sends++;}, {async claim(){throw Error('db unavailable');}});
  assert.equal((await run(req())).status,503);assert.equal(sends,0);
});
test('definitive API rejection releases claim while ambiguous failures retain it',async()=>{
  for(const status of [400,503]){
    let sends=0;const run=createHandler(env,async(url,o)=>{if(!o.method)return missing();sends++;return new Response('{}',{status});},claims());
    assert.equal((await run(req())).status,503);await run(req());assert.equal(sends,status===400?2:1);
  }
});
test('requires consent, valid email and same origin',async()=>{
  const run=createHandler(env,()=>assert.fail('No upstream calls'),claims());
  assert.equal((await run(req({email:'reader@example.com'}))).status,400);
  assert.equal((await run(req({email:'bad',consent:'yes'}))).status,400);
  assert.equal((await run(req(undefined,'https://other.example'))).status,403);
  assert.equal((await run(new Request('https://theorthodoxlens.org/api/newsletter'))).status,405);
});
test('missing template fails closed; honeypot never contacts Brevo',async()=>{
  const run=createHandler({...env,BREVO_DOI_TEMPLATE_ID:''},()=>assert.fail('No upstream calls'),claims());
  assert.equal((await run(req())).status,503);
  assert.equal((await run(req({email:'reader@example.com',consent:'yes','bot-field':'spam'}))).status,200);
});
test('upstream errors do not expose credentials or subscriber information',async()=>{
  const run=createHandler(env,async(url,o)=>o.method?new Response('private details',{status:401}):missing(),claims());
  const response=await run(req());assert.equal(response.status,503);assert.doesNotMatch(await response.text(),/fake-secret|private details|reader@example.com/);
});
test('database RPC receives only a pseudonymous key and token',async()=>{
  let calls=0;
  const storage=createNewsletterClaims({SUPABASE_URL:'https://example.supabase.co',SUPABASE_SECRET_KEY:'fake-secret'},async(url,o)=>{
    calls++;assert.match(url,/\/rpc\/(claim|release)_newsletter_email$/);const body=JSON.parse(o.body);
    assert.match(body.p_key,/^[a-f0-9]{64}$/);assert.match(body.p_token,/^[a-f0-9-]{36}$/);assert.doesNotMatch(o.body,/reader@example.com/);
    return url.includes('/claim_')?Response.json(true):new Response(null,{status:204});
  });
  const token=await storage.claim('reader@example.com',3);await storage.release(token);assert.equal(calls,2);
});
test('confirmation destination exists and is not indexable',async()=>{
  const html=await readFile(new URL('../public/newsletter-confirmed/index.html',import.meta.url),'utf8');
  assert.match(html,/You're subscribed!/);assert.match(html,/name="robots" content="noindex,follow"/);assert.match(html,/href="\/#browse"/);
});
test('popup has accessible dialog, consent and fallback',async()=>{
  const html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
  assert.match(html,/<dialog id="newsletter-dialog" aria-labelledby="newsletter-dialog-title"/);
  assert.match(html,/name="consent" value="yes" required/);assert.match(html,/href="\/newsletter-signup\/" data-newsletter-open/);
  const fallback=await readFile(new URL('../public/newsletter-signup/index.html',import.meta.url),'utf8');
  assert.match(fallback,/method="POST" action="\/api\/newsletter"/);
});
