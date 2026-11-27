// Local Windows-compatible preview server for the same Netlify Function handlers.
// Production deploys the functions in netlify/functions directly.
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import studioHandler from './netlify/functions/studio.mjs';
import reviewsHandler from './netlify/functions/reviews.mjs';
import eventsHandler from './netlify/functions/events.mjs';
import interestHandler from './netlify/functions/newsletter-interest.mjs';
import posterHandler from './netlify/functions/poster.mjs';
import newsletterFilmsHandler from './netlify/functions/newsletter-films.mjs';
import suggestionsHandler from './netlify/functions/suggestions.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
const publicRoot=path.join(root,'public');
const PORT=Number(process.env.PORT||3000);
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.json':'application/json; charset=utf-8','.ico':'image/x-icon','.png':'image/png','.webp':'image/webp'};
const respond=(res,status,obj)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(obj));};
async function invoke(req,res,handler){
  const chunks=[];let length=0;
  if(['POST','PUT','PATCH'].includes(req.method))for await(const c of req){length+=c.length;if(length>200000){respond(res,413,{error:'Request too large'});return;}chunks.push(c)}
  const headers=new Headers();for(const [k,v] of Object.entries(req.headers))if(v!=null)headers.set(k,Array.isArray(v)?v.join(','):v);
  const origin=`http://${req.headers.host||`localhost:${PORT}`}`;
  const request=new Request(new URL(req.url,origin),{method:req.method,headers,...(chunks.length?{body:Buffer.concat(chunks)}:{})});
  const response=await handler(request);
  res.writeHead(response.status,Object.fromEntries(response.headers.entries()));
  res.end(Buffer.from(await response.arrayBuffer()));
}
const server=http.createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,`http://${req.headers.host||`localhost:${PORT}`}`);
    const api={'/api/studio':studioHandler,'/api/reviews':reviewsHandler,'/api/events':eventsHandler,'/api/newsletter-interest':interestHandler,'/api/poster':posterHandler,'/api/suggestions':suggestionsHandler,'/api/newsletter-films':newsletterFilmsHandler};
    if(api[url.pathname])return await invoke(req,res,api[url.pathname]);
    if(url.pathname.startsWith('/api/admin/'))return respond(res,410,{error:'The previous single-password admin API was retired. Use /studio/.'});
    if(url.pathname.startsWith('/api/'))return respond(res,404,{error:'Unknown API route'});
    if(!['GET','HEAD'].includes(req.method))return respond(res,405,{error:'Method not allowed'});
    const pathname=url.pathname==='/'?'/index.html':url.pathname==='/studio/'?'/studio/index.html':url.pathname.endsWith('/')?decodeURIComponent(url.pathname)+'index.html':decodeURIComponent(url.pathname);
    const filePath=path.resolve(publicRoot,'.'+pathname);
    if(!filePath.startsWith(publicRoot+path.sep))return respond(res,403,{error:'Forbidden'});
    const content=await fs.readFile(filePath);
    res.writeHead(200,{'Content-Type':mime[path.extname(filePath)]||'application/octet-stream','Cache-Control':pathname.startsWith('/studio/')?'no-store':'public, max-age=60','X-Content-Type-Options':'nosniff'});
    res.end(req.method==='HEAD'?undefined:content);
  }catch(error){respond(res,error?.code==='ENOENT'?404:500,{error:error?.code==='ENOENT'?'Not found':'Unexpected server error'});}
});
server.listen(PORT,()=>console.log(`The Orthodox Lens: http://localhost:${PORT}/ | Editorial Studio: http://localhost:${PORT}/studio/`));
