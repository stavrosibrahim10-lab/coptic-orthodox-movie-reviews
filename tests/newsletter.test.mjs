import test from 'node:test';
import assert from 'node:assert/strict';
import {createHandler} from '../netlify/functions/newsletter.mjs';
const env={BREVO_API_KEY:'fake-secret',BREVO_LIST_ID:'3',BREVO_DOI_TEMPLATE_ID:'42'};
function req(fields={email:'reader@example.com',consent:'yes'},origin='https://theorthodoxlens.org'){
  return new Request('https://theorthodoxlens.org/api/newsletter',{method:'POST',headers:{origin,'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams(fields)});
}
test('DOI payload contains only the intended list and template',async()=>{
  let calls=0;
  const run=createHandler(env,async(url,options)=>{
    calls++;
    assert.equal(url,'https://api.brevo.com/v3/contacts/doubleOptinConfirmation');
    assert.equal(options.headers['api-key'],'fake-secret');
    assert.deepEqual(JSON.parse(options.body),{email:'reader@example.com',includeListIds:[3],templateId:42,redirectionUrl:'https://theorthodoxlens.org/'});
    return new Response(null,{status:201});
  });
  const result=await run(req());
  assert.equal(result.status,200); assert.match(await result.text(),/after confirming/);assert.equal(calls,1);
});
test('requires consent and valid email and same origin',async()=>{
  const run=createHandler(env,()=>assert.fail('No upstream calls'));
  assert.equal((await run(req({email:'reader@example.com'}))).status,400);
  assert.equal((await run(req({email:'bad',consent:'yes'}))).status,400);
  assert.equal((await run(req(undefined,'https://other.example'))).status,403);
  assert.equal((await run(new Request('https://theorthodoxlens.org/api/newsletter'))).status,405);
});
test('missing template fails closed; honeypot never contacts Brevo',async()=>{
  const run=createHandler({...env,BREVO_DOI_TEMPLATE_ID:''},()=>assert.fail('No upstream calls'));
  assert.equal((await run(req())).status,503);
  assert.equal((await run(req({email:'reader@example.com',consent:'yes','bot-field':'spam'}))).status,200);
});
test('upstream errors do not expose credentials or subscriber information',async()=>{
  const run=createHandler(env,async()=>new Response('private details',{status:401}));
  const response=await run(req());
  assert.equal(response.status,503);assert.doesNotMatch(await response.text(),/fake-secret|private details|reader@example.com/);
});
