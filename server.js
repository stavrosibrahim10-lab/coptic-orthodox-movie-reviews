import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const root = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(root, 'public');
const dataFile = path.resolve(root, process.env.DATA_FILE || './data/reviews.json');
const PORT = Number(process.env.PORT || 3000);
const posterCache = new Map();
const normalizeFilmTitle = s => String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
async function findPoster(title, year) {
  if(!process.env.TMDB_API_KEY) return {posterUrl:null, reason:'TMDB_API_KEY not configured'};
  const key=normalizeFilmTitle(title)+'|'+String(year);
  if(posterCache.has(key)) return posterCache.get(key);
  const u=new URL('https://api.themoviedb.org/3/search/movie');
  u.searchParams.set('query',title);u.searchParams.set('include_adult','false');u.searchParams.set('language','en-US');
  const credential=process.env.TMDB_API_KEY;
  if(!credential.includes('.')) u.searchParams.set('api_key',credential);
  const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),8000);
  try {
    const resp=await fetch(u,{headers:{...(credential.includes('.')?{Authorization:'Bearer '+credential}:{}),accept:'application/json'},signal:controller.signal});
    if(!resp.ok) return {posterUrl:null,reason:'Poster provider unavailable'};
    const data=await resp.json();
    const choices=(data.results||[]).filter(x=>x.poster_path&&Math.abs(Number((x.release_date||'').slice(0,4))-Number(year))<=1);
    choices.sort((a,b)=>{
      const matchA=normalizeFilmTitle(a.title)===normalizeFilmTitle(title)?1:0;
      const matchB=normalizeFilmTitle(b.title)===normalizeFilmTitle(title)?1:0;
      const yearA=(a.release_date||'').slice(0,4)===String(year)?1:0;
      const yearB=(b.release_date||'').slice(0,4)===String(year)?1:0;
      return (matchB-matchA)*100+(yearB-yearA)*10;
    });
    const chosen=choices.find(x=>normalizeFilmTitle(x.title)===normalizeFilmTitle(title));
    const result={posterUrl:chosen?'https://image.tmdb.org/t/p/w500'+chosen.poster_path:null,provider:'TMDB',providerUrl:'https://www.themoviedb.org'};
    posterCache.set(key,result);return result;
  } catch {return {posterUrl:null,reason:'Poster lookup failed'};} finally {clearTimeout(timeout)}
}

const MAX_BODY = 160_000;
const allowedStatus = new Set(['pending_review', 'published']);
const verdicts = new Set(['edifying', 'neutral', 'destructive']);
const ages = new Set(['All Ages','7+','10+','13+','16+','18+','Not Recommended']);
const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
const json = (res, status, payload) => { res.writeHead(status, headers); res.end(JSON.stringify(payload)); };
const safeStr = (v,n=5000) => typeof v === 'string' ? v.trim().slice(0,n) : '';
const randomId = () => crypto.randomUUID();

async function readDB() { try { const x=JSON.parse(await fs.readFile(dataFile,'utf8')); return Array.isArray(x)?x:[]; } catch(e) { if(e.code==='ENOENT') return []; throw e; } }
async function writeDB(db) { await fs.mkdir(path.dirname(dataFile),{recursive:true}); const temp = dataFile + '.' + randomId() + '.tmp'; await fs.writeFile(temp,JSON.stringify(db,null,2)); await fs.rename(temp,dataFile); }
function adminOK(req) { const password=process.env.ADMIN_PASSWORD; if(!password || password==='replace-with-a-long-random-secret') return false; const given=req.headers['x-admin-password']; if(typeof given!=='string') return false; const a=Buffer.from(given), b=Buffer.from(password); return a.length===b.length && crypto.timingSafeEqual(a,b); }
function readBody(req) { return new Promise((resolve,reject)=>{ let data=''; req.on('data',chunk=>{ data+=chunk; if(data.length>MAX_BODY){reject(Error('Request too large')); req.destroy();}}); req.on('end',()=>{try{resolve(JSON.parse(data||'{}'))}catch{reject(Error('Invalid JSON'))}});req.on('error',reject); }); }
const validTheme = t => t && typeof t.name==='string' && ['positive','harmful'].includes(t.type) && (t.score===null||(Number.isInteger(t.score)&&t.score>=0&&t.score<=5)) && ['affirmed','condemned','mixed','descriptive','unverified'].includes(t.portrayal);
function normalizeReview(x, status='pending_review') {
  if(!x || !safeStr(x.title,150) || !Number.isInteger(Number(x.year)) || Number(x.year)<1880 || Number(x.year)>2100) throw Error('Title and release year are required');
  const themes=Array.isArray(x.themes)?x.themes.slice(0,40):[];
  if(!themes.every(validTheme)) throw Error('Theme ratings must be 0–5 or null with an appropriate portrayal');
  if(![...verdicts,null].includes(x.verdict ?? null)) throw Error('Invalid verdict');
  if(x.age && !ages.has(x.age)) throw Error('Invalid suggested age');
  const sources=Array.isArray(x.sources)?x.sources.slice(0,25).map(s=>({label:safeStr(s.label,200),url:safeStr(s.url,500),notes:safeStr(s.notes,600)})):[];
  return {id:safeStr(x.id,100)||randomId(),title:safeStr(x.title,150),year:Number(x.year),genre:safeStr(x.genre,150),runtime:safeStr(x.runtime,30),officialRating:safeStr(x.officialRating,30),synopsis:safeStr(x.synopsis,1200),verdict:x.verdict??null,verdictRationale:safeStr(x.verdictRationale,2000),age:x.age||null,ageRationale:safeStr(x.ageRationale,1200),themes:themes.map(t=>({name:safeStr(t.name,100),type:t.type,score:t.score,portrayal:t.portrayal,evidence:safeStr(t.evidence,800)})),warnings:Array.isArray(x.warnings)?x.warnings.slice(0,20).map(w=>({name:safeStr(w.name,100),severity:safeStr(w.severity,40),details:safeStr(w.details,700)})):[],reflection:safeStr(x.reflection,2500),scripture:Array.isArray(x.scripture)?x.scripture.slice(0,10).map(s=>safeStr(s,150)):[],questions:Array.isArray(x.questions)?x.questions.slice(0,8).map(q=>safeStr(q,300)):[],sources,editorNote:safeStr(x.editorNote,1200),contentVerification:safeStr(x.contentVerification,80)||'not_verified',theologicalApproval:safeStr(x.theologicalApproval,80)||'pending',theologicalApprovedBy:safeStr(x.theologicalApprovedBy,150),contentCoverage:(x.contentCoverage&&typeof x.contentCoverage==='object')?Object.fromEntries(Object.entries(x.contentCoverage).slice(0,12).map(([k,v])=>[safeStr(k,70),safeStr(v,100)])):{},status:allowedStatus.has(status)?status:'pending_review',updatedAt:new Date().toISOString()};
}
function hasVerifiedEvidence(x) {
  return x.sources.some(s=>s.label && /^https:\/\//.test(s.url)) && !!x.verdictRationale && !!x.ageRationale && x.themes.some(t=>t.score!==null && t.evidence) && x.verdict && x.age;
}
const systemPrompt=`You are an evidence-constrained assistant drafting movie reviews from a distinctly Coptic Orthodox Christian perspective for Coptic Orthodox families, also useful to other Christian families. You are not an official Church authority. Return ONLY valid JSON. Use ONLY evidence supplied by the editor; do not use prior film knowledge to fill gaps, invent scenes, profanity, nudity, dialogue, or claim to have watched the film. If evidence does not establish a fact, mark its theme score null and portrayal unverified, and say evidence is incomplete. Do NOT assign a spiritual verdict or suggested age if evidence is too sparse. The spiritual verdict may be 'edifying', 'neutral', 'destructive', or null if insufficient evidence. Balanced decision: weigh the overall moral message (35%), portrayal of virtue and sin (30%), severity/exposure (25%), and reflection potential (10%), with serious-content overrides requiring manual review. Sin depicted and condemned differs from sin glorified. Theme score 0 means confirmed absent; 1 minimal; 2 limited; 3 significant; 4 strong; 5 defining. Score measures prevalence/intensity, not moral endorsement. Portrayal is affirmed, condemned, mixed, descriptive, or unverified. Consider virtues and harms independently. Age guidance independent of spiritual verdict, one of All Ages, 7+, 10+, 13+, 16+, 18+, Not Recommended, or null. Do not fabricate Scripture quotes or citations. Produce JSON object with keys: title,year,genre,runtime,officialRating,synopsis,verdict,verdictRationale,age,ageRationale,themes (array of objects name,type ['positive'|'harmful'],score [0..5 or null],portrayal,evidence),warnings (array of name,severity,details),reflection,scripture (array of references only),questions (array of strings),editorNote. No other keys. For any uncertain claim say what needs checking in editorNote. Limit to 8-15 themes, prioritize relevant ones. Your output is a draft requiring editorial approval.`;
async function generateDraft(input) {
  const apiKey=process.env.OPENAI_API_KEY;
  if(!apiKey) throw Object.assign(Error('OPENAI_API_KEY is not configured on the server'),{status:503});
  const evidence=safeStr(input.evidence,20000);
  if(evidence.length<120) throw Object.assign(Error('Provide at least 120 characters of sourced movie evidence before drafting'),{status:400});
  const title=safeStr(input.title,150),year=Number(input.year);
  if(!title||!Number.isInteger(year)||year<1880||year>2100) throw Object.assign(Error('A valid movie title and year are required'),{status:400});
  const prompt=JSON.stringify({title,year,evidence,sourceLabels:safeStr(input.sourceLabels,2000),instructions:'Use only supplied evidence. Draft safely; mark uncertainty.'});
  const controller = new AbortController();
  const timeout=setTimeout(()=>controller.abort(),60000);
  try {
    const response=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',signal:controller.signal,headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.OPENAI_MODEL||'gpt-4.1-mini',temperature:0.2,response_format:{type:'json_object'},messages:[{role:'system',content:systemPrompt},{role:'user',content:prompt}]})});
    const payload=await response.json().catch(()=>({}));
    if(!response.ok) throw Object.assign(Error(payload.error?.message||'AI request failed'),{status:502});
    const draft=JSON.parse(payload.choices?.[0]?.message?.content||'{}');
    draft.title=title;draft.year=year;
    draft.sources=(safeStr(input.sourceLabels,2000)||'Editor-provided evidence — verify references').split('\n').filter(Boolean).slice(0,15).map(label=>({label,url:'',notes:''}));
    return normalizeReview(draft);
  } finally {clearTimeout(timeout)}
}
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.json':'application/json; charset=utf-8','.ico':'image/x-icon'};
const server=http.createServer(async(req,res)=>{
  try {
    const url=new URL(req.url,`http://${req.headers.host||'localhost'}`);
    if(url.pathname.startsWith('/api/')) {
      if(req.method==='GET'&&url.pathname==='/api/poster') {
        const title=safeStr(url.searchParams.get('title'),150);const year=Number(url.searchParams.get('year'));
        if(!title||!Number.isInteger(year)||year<1880||year>2100)return json(res,400,{error:'Invalid title/year'});
        return json(res,200,await findPoster(title,year));
      }
      if(req.method==='GET'&&url.pathname==='/api/reviews') {const db=await readDB();return json(res,200,{reviews:db.filter(x=>x.status==='published')});}
      if(req.method==='GET'&&url.pathname==='/api/admin/reviews') {if(!adminOK(req))return json(res,401,{error:'Admin authentication required'});return json(res,200,{reviews:await readDB()});}
      if(req.method==='POST'&&url.pathname==='/api/admin/generate') {if(!adminOK(req))return json(res,401,{error:'Admin authentication required'});const draft=await generateDraft(await readBody(req));return json(res,200,{review:draft});}
      if(req.method==='POST'&&url.pathname==='/api/admin/save') {
        if(!adminOK(req))return json(res,401,{error:'Admin authentication required'});
        const input=await readBody(req);const status=input.status==='published'?'published':'pending_review';
        const review=normalizeReview(input.review,status);
        if(status==='published'&&!hasVerifiedEvidence(review))return json(res,400,{error:'Publication requires linked sources, rationale, age justification, and evidence-backed theme scores.'});
        if(status==='published'&&!(review.contentVerification==='editor_checked'&&review.theologicalApproval==='approved'&&review.theologicalApprovedBy.length>=3))return json(res,400,{error:'Before publication, an editor must confirm contentVerification=editor_checked, theologicalApproval=approved, and record theologicalApprovedBy (the qualified reviewer).'});
        const db=await readDB();const i=db.findIndex(r=>r.id===review.id);if(i>=0)db[i]=review;else db.push(review);await writeDB(db);return json(res,200,{review});
      }
      return json(res,404,{error:'Not found'});
    }
    if(req.method!=='GET'&&req.method!=='HEAD')return json(res,405,{error:'Method not allowed'});
    const requestPath=decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname);
    const filePath=path.resolve(publicDir, '.'+requestPath);
    if(!filePath.startsWith(publicDir+path.sep))return json(res,403,{error:'Forbidden'});
    const file=await fs.readFile(filePath);
    res.writeHead(200,{'Content-Type':mime[path.extname(filePath)]||'application/octet-stream','X-Content-Type-Options':'nosniff','Cache-Control':'public, max-age=300'});
    if(req.method==='HEAD')res.end();else res.end(file);
  } catch(e) {if(e.code==='ENOENT')return json(res,404,{error:'Not found'});json(res,e.status||500,{error:e.message||'Unexpected server error'});}
});
server.listen(PORT,()=>console.log(`Coptic Orthodox Movie Reviews running at http://localhost:${PORT}`));
