import {schedule,selectReviews,aiRequest,parseAi,renderEdition,hashContent,safeToSend} from './_shared/monthly-newsletter.mjs';
export const config={schedule:'0 * * * *'};
const validId=x=>Number.isSafeInteger(x)&&x>0;
const email=x=>typeof x==='string'&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x);
export function settings(env){
  const mode=env.NEWSLETTER_MODE||'off';
  if(mode==='off')return {mode};
  if(!['test','draft','auto'].includes(mode))throw Error('Invalid newsletter mode');
  const liveList=Number(env.BREVO_LIST_ID),testList=Number(env.NEWSLETTER_TEST_LIST_ID);
  const url=(env.SUPABASE_URL||'').trim().replace(/\/$/,'');
  const sender='newsletter@theorthodoxlens.org',replyTo=(env.NEWSLETTER_REPLY_TO||'').trim(),address=(env.NEWSLETTER_POSTAL_ADDRESS||'').trim();
  if(!validId(liveList)||!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url)||!env.SUPABASE_SECRET_KEY||!env.BREVO_API_KEY||!env.OPENAI_API_KEY||!env.NEWSLETTER_AI_MODEL||!email(replyTo)||address.length<10||address.length>500||/[<>{}]/.test(address))throw Error('Newsletter configuration incomplete');
  if(mode==='test'&&(!validId(testList)||testList===liveList))throw Error('Separate test list required');
  return {mode,liveList,list:mode==='test'?testList:liveList,url,sender,replyTo,address,model:env.NEWSLETTER_AI_MODEL,secret:env.SUPABASE_SECRET_KEY,brevo:env.BREVO_API_KEY,openai:env.OPENAI_API_KEY};
}
function clients(s,fetcher){
  async function request(url,headers,method='GET',body,ms=4000){
    const res=await fetcher(url,{method,headers:{Accept:'application/json',...headers,...(body!==undefined?{'Content-Type':'application/json'}:{})},...(body!==undefined?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(ms)});
    if(!res.ok)throw Error('Upstream HTTP '+res.status);
    const raw=await res.text();return raw?JSON.parse(raw):null;
  }
  const db=(path,method='GET',body,headers={})=>request(s.url+'/rest/v1/'+path,{apikey:s.secret,...(s.secret.startsWith('eyJ')?{Authorization:'Bearer '+s.secret}:{}),...headers},method,body);
  const brevo=(path,method='GET',body)=>request('https://api.brevo.com/v3/'+path,{'api-key':s.brevo},method,body);
  const keyFilter=key=>'newsletter_editions?edition_key=eq.'+encodeURIComponent(key);
  return {
    async get(key){const rows=await db(keyFilter(key)+'&select=*');return rows[0]||null;},
    claim(row){return db('newsletter_editions','POST',row,{Prefer:'resolution=ignore-duplicates,return=representation'});},
    change(key,expected,body){return db(keyFilter(key)+'&state=eq.'+expected,'PATCH',{...body,updated_at:new Date().toISOString()},{Prefer:'return=representation'});},
    reviews(){return db('studio_reviews?select=movie_id,published,published_at&published=not.is.null&order=published_at.desc&limit=1000');},
    generate(selected,period){return request('https://api.openai.com/v1/responses',{Authorization:'Bearer '+s.openai},'POST',aiRequest(selected,period,s.model),12000);},
    create(payload){return brevo('emailCampaigns','POST',payload);},
    report(id){return brevo('emailCampaigns/'+id);},
    send(id){return brevo('emailCampaigns/'+id+'/sendNow','POST');}
  };
}
const json=(status,message)=>new Response(JSON.stringify({message}),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
export function createHandler(env=process.env,fetcher=globalThis.fetch,clock=()=>new Date(),makeClients=clients){
  return async function handler(){
    try{
      const s=settings(env);if(s.mode==='off')return json(200,'Disabled');
      const when=schedule(clock());
      const test=s.mode==='test';
      if(!test&&(when.hour!==9||when.days>7))return json(200,'Outside newsletter window');
      const key=(test?'test:':'live:')+when.period,api=makeClients(s,fetcher);
      const existing=await api.get(key);
      if(!test&&when.days===0){
        if(s.mode!=='auto'||!existing||existing.state!=='draft'||existing.audience_id!==s.liveList||!validId(existing.campaign_id))return json(200,'No automatic send');
        const report=await api.report(existing.campaign_id);
        if(report.status==='sent'){await api.change(key,'draft',{state:'sent'});return json(200,'Already sent');}
        if(!safeToSend(report,existing,s))return json(409,'Campaign changed; review manually');
        const current=await api.reviews();
        // Prevent dispatch if an included review was withdrawn or edited after the draft.
        const map=new Map(current.map(x=>[x.movie_id,hashContent(JSON.stringify(x.published))]));
        if(!Array.isArray(existing.review_ids)||!existing.review_ids.length||existing.review_ids.some(x=>map.get(x.id)!==x.hash))return json(409,'Review changed; review manually');
        const claimed=await api.change(key,'draft',{state:'sending'});
        if(claimed.length!==1)return json(200,'Send already claimed');
        // No automatic retry after an ambiguous send; reconcile in Brevo.
        try{await api.send(existing.campaign_id);await api.change(key,'sending',{state:'sent'});}
        catch{console.warn('[monthly-newsletter] Send requires manual reconciliation');return json(502,'Send requires review');}
        return json(200,'Campaign send accepted');
      }
      if(existing)return json(200,'Edition already reserved');
      const source=await api.reviews(),selected=selectReviews(source,when.period);
      if(!selected)return json(200,'No eligible published family review');
      const ai=parseAi(await api.generate(selected,when.period));
      const html=renderEdition(when.period,selected,ai,s.address);
      const reviewIds=[selected.featured,...selected.family,...selected.recent].map(x=>({id:x.id,hash:hashContent(JSON.stringify(source.find(y=>y.movie_id===x.id).published))}));
      const claim=await api.claim({edition_key:key,period:when.period,audience_id:s.list,state:'creating',review_ids:reviewIds});
      if(claim.length!==1)return json(200,'Edition already reserved');
      // Reservation is never automatically deleted after the external side effect.
      try{
        const draft=await api.create({name:(test?'TEST — ':'')+'TOL Monthly Lens '+when.period,subject:'The Orthodox Lens | '+new Intl.DateTimeFormat('en-US',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(when.period+'-01T00:00:00Z')),sender:{name:'The Orthodox Lens',email:s.sender},replyTo:s.replyTo,recipients:{listIds:[s.list]},htmlContent:html,previewText:'Film recommendations and family reflections',tag:'tol-monthly-newsletter'});
        if(!validId(draft?.id))throw Error('Campaign ID unavailable');
        // Store the ID before retrieving the canonical Brevo HTML for future integrity checks.
        const saved=await api.change(key,'creating',{campaign_id:draft.id});
        if(saved.length!==1)throw Error('Campaign reservation missing');
        const report=await api.report(draft.id);
        if(report.status!=='draft'||typeof report.htmlContent!=='string'||!report.htmlContent.includes('Unsubscribe'))throw Error('Campaign requires review');
        const recorded=await api.change(key,'creating',{state:'draft',content_hash:hashContent(report.htmlContent)});
        if(recorded.length!==1)throw Error('Campaign reservation missing');
        return json(200,'Draft created');
      }catch{console.warn('[monthly-newsletter] Draft requires manual reconciliation');return json(502,'Draft requires review');}
    }catch{console.warn('[monthly-newsletter] Configuration or upstream error');return json(503,'Newsletter automation unavailable');}
  };
}
export default createHandler();
