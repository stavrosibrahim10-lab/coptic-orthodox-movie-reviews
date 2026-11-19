import fs from 'node:fs/promises';
const path=new URL('../public/app.js',import.meta.url);
let s=await fs.readFile(path,'utf8');
const before=s.indexOf('function studio(){');const after=s.indexOf('function updateNav(){');
if(before<0||after<0)throw Error('Unexpected original V12 frontend structure');
s=s.slice(0,before)+`// Private approval backend lives at /studio/. The old client-side password editor was retired.
async function api(url){
 const r=await fetch(url,{cache:'no-store'});
 const data=await r.json().catch(()=>({error:'Invalid API response'}));
 if(!r.ok)throw Error(data.error||'Unable to fetch published reviews');
 return data;
}
async function refreshPublished(){
 try{
  const data=await api('/api/reviews');
  published=(data.reviews||[]).map((r,i)=>({...r,posterClass:coverClass(r,i),sourceLinks:r.sourceLinks||sourceSearchLinks(r)}));
 }catch(e){published=[];console.warn('Published reviews unavailable',e.message);}
}
let metricTimer;
function trackPublicEvent(evt){
 if(location.protocol==='file:'||!navigator.onLine)return;
 fetch('/api/events',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(evt),keepalive:true,credentials:'omit'}).catch(()=>{});
}
`+s.slice(after);
s=s.replace("let adminPassword='';\n",'');
s=s.replace("  if(location.hash.startsWith('#admin')) wireStudio();",`  // Public app has no editing capability. The dedicated Studio is in /studio/.
  const search=document.getElementById('searchFilter');
  if(search)search.addEventListener('input',()=>{
    clearTimeout(metricTimer);
    metricTimer=setTimeout(()=>{
      const q=search.value.trim();if(q.length>=2&&q.length<=60){
       const count=allMovies().filter(matchesFilters).length;
       trackPublicEvent({kind:'search',query_term:q,result_count:count});
      }
    },1300);
  });`);
s=s.replace("  app.innerHTML=hash==='home'?home():hash==='browse'?browse():hash==='method'?method():hash==='about'?about():hash==='admin'?studio():hash.startsWith('review/')?detail(hash.slice(7)):home();",`  if(hash==='admin'){location.replace('/studio/');return;}
  app.innerHTML=hash==='home'?home():hash==='browse'?browse():hash==='method'?method():hash==='about'?about():hash.startsWith('review/')?detail(hash.slice(7)):home();
  if(hash.startsWith('review/')){
    const id=hash.slice(7);const movie=allMovies().find(x=>x.id===id||x.contentEvidenceId===id);
    if(movie)trackPublicEvent({kind:'movie_view',movie_id:movie.id,movie_title:movie.title});
  }`);
s=s.replace("<a href=\"#admin\">Editorial studio</a>","<a href=\"/studio/\">Editorial studio</a>");
s=s.replace("const label=reviewed?(r.reviewType==='seed'?'SOURCE-BASED · PROVISIONAL':'PROVISIONAL · CHECK SOURCES'):'SPIRITUAL REVIEW PENDING';",`const label=reviewed?(r.reviewType==='published'?'EDITORIALLY APPROVED':r.reviewType==='seed'?'SOURCE-BASED · PROVISIONAL':'PROVISIONAL · CHECK SOURCES'):'SPIRITUAL REVIEW PENDING';`);
s=s.replace("All theological approvals remain pending.","Unapproved assessments remain labeled provisional.");
await fs.writeFile(path,s);
const htmlPath=new URL('../public/index.html',import.meta.url);
let html=await fs.readFile(htmlPath,'utf8');html=html.replaceAll('href="#admin"','href="/studio/"');await fs.writeFile(htmlPath,html);
