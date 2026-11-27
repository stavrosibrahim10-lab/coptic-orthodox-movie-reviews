// Newsletter sign-ups use Brevo's double opt-in endpoint; no campaign sends here.
import {createNewsletterClaims} from './_shared/newsletter-claims.mjs';
export const config = {path:'/api/newsletter',rateLimit:{windowLimit:5,windowSize:60,aggregateBy:['ip','domain']}};
const site = 'https://theorthodoxlens.org';
const headers = {'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'none'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; base-uri 'none'; frame-ancestors 'none'"};
function page(message,status=200){
  return new Response('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Newsletter | The Orthodox Lens</title><link rel="stylesheet" href="/styles.css"><main class="section"><div class="container"><div class="paper-panel"><div class="eyebrow">The Orthodox Lens</div><h1>Monthly newsletter</h1><p>'+message+'</p><a href="/#newsletter" class="btn gold">Return to website</a></div></div></main></html>',{status,headers});
}
const success = () => page('If your request is eligible, check your inbox for a confirmation email. If you have already subscribed or requested a confirmation recently, you do not need to sign up again. You will only join the newsletter after confirming.');
export function createHandler(env=process.env,send=globalThis.fetch,claims=createNewsletterClaims(env,send)){
  return async function handler(req){
    if(req.method!=='POST')return page('Please use the newsletter form on our website.',405);
    if(![site,'https://www.theorthodoxlens.org'].includes(req.headers.get('origin')))return page('Please submit the form directly from our website.',403);
    if(!/^application\/x-www-form-urlencoded(?:;|$)/i.test(req.headers.get('content-type')||''))return page('Please use the newsletter form on our website.',415);
    let raw;
    try{raw=await req.text();}catch{return page('We could not read your request.',400);}
    if(raw.length>4096)return page('The request is too large.',413);
    const form=new URLSearchParams(raw);
    if(form.get('bot-field'))return success();
    const email=(form.get('email')||'').trim().toLowerCase();
    if(form.get('consent')!=='yes'||email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return page('Please enter a valid email address and consent to the newsletter.',400);
    const list=Number(env.BREVO_LIST_ID),template=Number(env.BREVO_DOI_TEMPLATE_ID);
    if(!env.BREVO_API_KEY||!Number.isSafeInteger(list)||list<1||!Number.isSafeInteger(template)||template<1)return page('Newsletter registration is not yet available. Please check back later.',503);
    try{
      const apiHeaders={'api-key':env.BREVO_API_KEY,'Content-Type':'application/json','Accept':'application/json'};
      // Brevo remains the source of truth for membership and opt-outs.
      const contact=await send('https://api.brevo.com/v3/contacts/'+encodeURIComponent(email)+'?identifierType=email',{headers:apiHeaders,signal:AbortSignal.timeout(5000)});
      if(contact.ok){
        const info=await contact.json();
        if(!Array.isArray(info?.listIds)||typeof info?.emailBlacklisted!=='boolean')throw new Error('Invalid contact response');
        if(info.emailBlacklisted||info.listIds.includes(list)||info.listUnsubscribed?.includes(list))return success();
      }else if(contact.status!==404){
        console.warn('[newsletter] Brevo contact lookup rejected',{status:contact.status});
        return page('Registration is temporarily unavailable. Please try again later.',503);
      }
      // Atomic database claim prevents simultaneous requests across devices/functions.
      // Failed storage is fail-closed; no emails are sent without a claim.
      const claim=await claims.claim(email,list);
      if(!claim)return success();
      const response=await send('https://api.brevo.com/v3/contacts/doubleOptinConfirmation',{
        method:'POST',headers:apiHeaders,
        body:JSON.stringify({email,includeListIds:[list],templateId:template,redirectionUrl:site+'/newsletter-confirmed/'}),signal:AbortSignal.timeout(10000)
      });
      if(response.ok)return success();
      const info=await response.json().catch(()=>({}));
      if(response.status===400&&info?.code==='duplicate_parameter')return success();
      // A definitive rejection can be retried; ambiguous failures retain the 24h claim.
      if([400,401,403,404,422,429].includes(response.status)){try{await claims.release(claim);}catch{console.warn('[newsletter] Could not release failed request claim');}}
      // Log only fixed categories and numeric HTTP status, never upstream text or contact data.
      const detail=typeof info?.message==='string'?info.message:'';
      const reason=/ip address|whitelist|allowlist|unauthorized ip/i.test(detail)?'ip-restriction':
        /permission|scope|access right/i.test(detail)?'permission':
        /template|double.opt.in|DOIurl/i.test(detail)?'template':
        /sender|domain/i.test(detail)?'sender':
        /list/i.test(detail)?'list':
        response.status===401?'authentication':
        response.status===403?'forbidden':'other';
      console.warn('[newsletter] Brevo rejected DOI request', {status:response.status,reason});
      if(response.status===429)return page('Registration is busy. Please try again later.',429);
      return page('Registration is temporarily unavailable. Please try again later.',503);
    }catch(error){console.warn('[newsletter] Brevo request failed', {reason:error?.name==='TimeoutError'?'timeout':'network-or-runtime'});return page('Registration is temporarily unavailable. Please try again later.',503);}
  };
}
// Explicit launch switch: old links cannot start sending confirmation emails while paused.
export default async function handler(req){if(process.env.NEWSLETTER_LAUNCH_ENABLED!=='true')return page('Newsletter registration is paused. Register interest on our website instead.',503);return createHandler()(req);}
