// Newsletter sign-ups use Brevo's double opt-in endpoint; no campaign sends here.
export const config = {path:'/api/newsletter',rateLimit:{windowLimit:5,windowSize:60,aggregateBy:['ip','domain']}};
const site = 'https://theorthodoxlens.org';
const headers = {'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'none'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; base-uri 'none'; frame-ancestors 'none'"};
function page(message,status=200){
  return new Response('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Newsletter | The Orthodox Lens</title><link rel="stylesheet" href="/styles.css"><main class="section"><div class="container"><div class="paper-panel"><div class="eyebrow">The Orthodox Lens</div><h1>Monthly newsletter</h1><p>'+message+'</p><a href="/#newsletter" class="btn gold">Return to website</a></div></div></main></html>',{status,headers});
}
const success = () => page('If your request is eligible, check your inbox for a confirmation email. You will only join the newsletter after confirming.');
export function createHandler(env=process.env,send=globalThis.fetch){
  return async function handler(req){
    if(req.method!=='POST')return page('Please use the newsletter form on our website.',405);
    if(![site,'https://www.theorthodoxlens.org'].includes(req.headers.get('origin')))return page('Please submit the form directly from our website.',403);
    if(!/^application\/x-www-form-urlencoded(?:;|$)/i.test(req.headers.get('content-type')||''))return page('Please use the newsletter form on our website.',415);
    let raw;
    try{raw=await req.text();}catch{return page('We could not read your request.',400);}
    if(raw.length>4096)return page('The request is too large.',413);
    const form=new URLSearchParams(raw);
    if(form.get('bot-field'))return success();
    const email=(form.get('email')||'').trim();
    if(form.get('consent')!=='yes'||email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return page('Please enter a valid email address and consent to the newsletter.',400);
    const list=Number(env.BREVO_LIST_ID),template=Number(env.BREVO_DOI_TEMPLATE_ID);
    if(!env.BREVO_API_KEY||!Number.isSafeInteger(list)||list<1||!Number.isSafeInteger(template)||template<1)return page('Newsletter registration is not yet available. Please check back later.',503);
    try{
      const response=await send('https://api.brevo.com/v3/contacts/doubleOptinConfirmation',{
        method:'POST',headers:{'api-key':env.BREVO_API_KEY,'Content-Type':'application/json','Accept':'application/json'},
        body:JSON.stringify({email,includeListIds:[list],templateId:template,redirectionUrl:site+'/'}),signal:AbortSignal.timeout(10000)
      });
      if(response.ok)return success();
      if(response.status===400){
        // Do not disclose existing subscription status or upstream personal data.
        const info=await response.json().catch(()=>({}));
        if(info.code==='duplicate_parameter')return success();
      }
      if(response.status===429)return page('Registration is busy. Please try again later.',429);
      return page('Registration is temporarily unavailable. Please try again later.',503);
    }catch{return page('Registration is temporarily unavailable. Please try again later.',503);}
  };
}
export default createHandler();
