// Public, subscriber-free feed for a monthly newsletter automation.
import reviewsHandler from './reviews.mjs';
import {moviePath,SITE} from '../../public/discovery.js';
export const config={path:'/api/newsletter-films'};
export default async function handler(req){
  const reply=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
  if(req.method!=='GET')return reply({error:'Method not allowed'},405);
  try{
    const response=await reviewsHandler(req);
    if(!response.ok)return reply({error:'Published reviews unavailable'},503);
    const data=await response.json();
    if(!data.connected)return reply({error:'Published review service not connected'},503);
    const films=(data.reviews||[]).filter(r=>r.theologicalApproval==='approved'&&r.contentVerification==='editor_checked'&&r.verdict==='edifying'&&['All Ages','7+','10+','13+'].includes(r.age)&&r.title&&r.year&&r.reflection&&r.themeScripture?.reference&&r.themeScripture?.connection&&r.questions?.length).map(r=>({
      id:r.id,title:r.title,year:r.year,age:r.age,verdict:r.verdict,url:SITE+moviePath(r),synopsis:r.synopsis||'',reflection:r.reflection,scripture:{reference:r.themeScripture.reference,connection:r.themeScripture.connection},questions:r.questions.slice(0,3),publishedAt:r.publishedAt||null
    }));
    films.sort((a,b)=>String(b.publishedAt||'').localeCompare(String(a.publishedAt||''))||a.id.localeCompare(b.id));
    return reply({films:films.slice(0,30),eligibleCount:films.length});
  }catch{return reply({error:'Newsletter feed unavailable'},503);}
}
