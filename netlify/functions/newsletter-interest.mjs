import {environment,insert} from './_shared/core.mjs';
export const config={path:'/api/newsletter-interest',rateLimit:{windowLimit:5,windowSize:60,aggregateBy:['ip','domain']}};
const result=(message,status=200)=>new Response('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Newsletter interest | The Orthodox Lens</title><link rel="stylesheet" href="/styles.css"><main class="section"><div class="container"><div class="paper-panel"><div class="eyebrow">The Orthodox Lens</div><h1>Newsletter interest</h1><p>'+message+'</p><a href="/" class="btn gold">Return to website</a></div></div></main></html>',{status,headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'none'; style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; frame-ancestors 'none'; base-uri 'none'"}});
const success=()=>new Response(null,{status:303,headers:{Location:'/newsletter-thanks/','Cache-Control':'no-store'}});
export function createInterestHandler({ready=()=>environment().ready,save=email=>insert('newsletter_interest',{email},{ignore:true})}={}){
 return async req=>{
  if(req.method!=='POST')return result('Please use our interest form.',405);
  if(!['https://theorthodoxlens.org','https://www.theorthodoxlens.org',new URL(req.url).origin].includes(req.headers.get('origin')))return result('Please submit directly from our website.',403);
  if(!/^application\/x-www-form-urlencoded(?:;|$)/i.test(req.headers.get('content-type')||''))return result('Please use our interest form.',415);
  let raw;try{raw=await req.text();}catch{return result('Invalid request.',400);}
  if(raw.length>4096)return result('Request too large.',413);
  const f=new URLSearchParams(raw);if(f.get('bot-field'))return success();
  const email=(f.get('email')||'').trim().toLowerCase();
  if(f.get('consent')!=='yes'||email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return result('A valid email and your permission are required.',400);
  if(!ready())return result('Interest registration is temporarily unavailable. Please try again later.',503);
  try{await save(email);return success();}catch{console.warn('[newsletter-interest] storage unavailable');return result('Interest registration is temporarily unavailable. Please try again later.',503);}
 };
}
export default createInterestHandler();
