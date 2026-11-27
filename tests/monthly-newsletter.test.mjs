import test from 'node:test';
import assert from 'node:assert/strict';
import {schedule,selectReviews,parseAi,renderEdition,hashContent,safeToSend} from '../netlify/functions/_shared/monthly-newsletter.mjs';
import {createHandler,settings} from '../netlify/functions/monthly-newsletter.mjs';
const env={NEWSLETTER_MODE:'draft',BREVO_LIST_ID:'3',NEWSLETTER_TEST_LIST_ID:'9',SUPABASE_URL:'https://example.supabase.co',SUPABASE_SECRET_KEY:'fake-secret',BREVO_API_KEY:'fake-brevo',OPENAI_API_KEY:'fake-ai',NEWSLETTER_AI_MODEL:'example-model',NEWSLETTER_REPLY_TO:'reply@example.com',NEWSLETTER_POSTAL_ADDRESS:'123 Example Street, Example City'};
const source=[{movie_id:'film-one',published_at:'2026-11-26T10:00:00Z',published:{title:'Film One',year:2020,age:'7+',verdict:'edifying',verdictRationale:'An approved review of a family movie.',questions:['What did the story teach?']}},{movie_id:'draft',published:null,published_at:null}];
const ai={status:'completed',output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({intro:'Welcome to another month of thoughtful family viewing.',reflection:'Consider which virtues we can encourage through family conversations.'})}]}]};
test('first Saturday calculation crosses months and respects Eastern DST',()=>{
  assert.deepEqual(schedule(new Date('2026-11-28T14:00:00Z')),{period:'2026-12',days:7,hour:9,date:'2026-11-28'});
  assert.equal(schedule(new Date('2026-12-05T14:00:00Z')).days,0);
  assert.equal(schedule(new Date('2027-07-03T13:00:00Z')).hour,9);
  assert.equal(schedule(new Date('2026-12-31T14:00:00Z')).period,'2027-01');
});
test('only published family-eligible reviews are used for recommendations',()=>{
  const selected=selectReviews(source,'2026-12');
  assert.equal(selected.featured.id,'film-one');
  assert.equal(selected.family.length,0);
  assert.equal(selectReviews(source.slice(1),'2026-12'),null);
});
test('renders approved title, age, canonical URL and unsubscribe link',()=>{
  const html=renderEdition('2026-12',selectReviews(source,'2026-12'),parseAi(ai),env.NEWSLETTER_POSTAL_ADDRESS);
  assert.match(html,/Film One/);assert.match(html,/7\+/);assert.match(html,/https:\/\/theorthodoxlens.org\/movies\/film-one-2020\//);
  assert.match(html,/href="{{ unsubscribe }}"/);
  assert.doesNotMatch(html,/fake-secret|fake-ai/);
  assert.throws(()=>parseAi({status:'incomplete'}));
});
test('defaults off and rejects test list equal to live list',()=>{
  assert.equal(settings({}).mode,'off');
  assert.throws(()=>settings({...env,NEWSLETTER_MODE:'test',NEWSLETTER_TEST_LIST_ID:'3'}));
});
function fixture(){
  const db=new Map(),campaigns=new Map();let creations=0,sends=0;
  const api={
    async get(k){return db.get(k)||null;},
    async claim(row){if(db.has(row.edition_key))return [];db.set(row.edition_key,{...row});return [row];},
    async change(k,expected,body){const prev=db.get(k);if(!prev||prev.state!==expected)return [];const next={...prev,...body};db.set(k,next);return [next];},
    async reviews(){return source;},async generate(){return ai;},
    async create(p){const id=++creations;campaigns.set(id,{...p,id,status:'draft',recipients:{lists:p.recipients.listIds}});return {id};},
    async report(id){return campaigns.get(id);},
    async send(id){sends++;campaigns.get(id).status='sent';}
  };
  return {db,campaigns,api,count:()=>({creations,sends})};
}
const run=(env,fixture,stamp)=>createHandler(env,()=>assert.fail('Unexpected HTTP request'),()=>new Date(stamp),()=>fixture.api)();
test('disabled mode never calls external services',async()=>{
  const h=createHandler({},()=>assert.fail('Unexpected HTTP request'),()=>new Date(),()=>assert.fail('Unexpected client'));
  assert.equal((await h()).status,200);
});
test('concurrent draft creation creates just one campaign and never sends',async()=>{
  const f=fixture();
  await Promise.all([run(env,f,'2026-11-28T14:00:00Z'),run(env,f,'2026-11-28T14:00:00Z')]);
  assert.deepEqual(f.count(),{creations:1,sends:0});
  assert.equal(f.db.get('live:2026-12').state,'draft');
  assert.equal(f.campaigns.get(1).recipients.lists[0],3);
  await run(env,f,'2026-12-05T14:00:00Z');
  assert.equal(f.count().sends,0);
});
test('test mode creates a separate draft and never sends',async()=>{
  const f=fixture();
  await run({...env,NEWSLETTER_MODE:'test'},f,'2026-11-27T19:00:00Z');
  assert.equal(f.db.get('test:2026-12').state,'draft');
  assert.equal(f.campaigns.get(1).recipients.lists[0],9);
  await run({...env,NEWSLETTER_MODE:'test'},f,'2026-12-05T14:00:00Z');
  assert.equal(f.count().sends,0);
});
test('auto mode sends at most once at the correct local time',async()=>{
  const f=fixture(),auto={...env,NEWSLETTER_MODE:'auto'};
  await run(env,f,'2026-11-28T14:00:00Z');
  await run(auto,f,'2026-12-05T13:00:00Z');
  assert.equal(f.count().sends,0);
  await Promise.all([run(auto,f,'2026-12-05T14:00:00Z'),run(auto,f,'2026-12-05T14:00:00Z')]);
  assert.equal(f.count().sends,1);
  assert.equal(f.db.get('live:2026-12').state,'sent');
});
test('changed recipients or content prevents auto sending',async()=>{
  const f=fixture(),auto={...env,NEWSLETTER_MODE:'auto'};
  await run(env,f,'2026-11-28T14:00:00Z');
  f.campaigns.get(1).recipients.lists=[3,9];
  assert.equal((await run(auto,f,'2026-12-05T14:00:00Z')).status,409);
  f.campaigns.get(1).recipients.lists=[3];f.campaigns.get(1).htmlContent+='edited';
  assert.equal((await run(auto,f,'2026-12-05T14:00:00Z')).status,409);
  assert.equal(f.count().sends,0);
});
test('ambiguous send is held for reconciliation, not retried',async()=>{
  const f=fixture(),auto={...env,NEWSLETTER_MODE:'auto'};let attempted=0;
  await run(env,f,'2026-11-28T14:00:00Z');
  f.api.send=async()=>{attempted++;throw Error('timeout');};
  assert.equal((await run(auto,f,'2026-12-05T14:00:00Z')).status,502);
  await run(auto,f,'2026-12-05T14:00:00Z');
  assert.equal(attempted,1);assert.equal(f.db.get('live:2026-12').state,'sending');
});
