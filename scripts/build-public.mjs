import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {SITE,moviePath,escapeHtml as esc,reviewStatus} from '../public/discovery.js';
import reviewsHandler from '../netlify/functions/reviews.mjs';
const root=fileURLToPath(new URL('../public/',import.meta.url));
// Load the same trusted repository scripts as the browser, in the same order.
for(const [file,names] of [
  ['seed-reviews.js',['seedReviews']],['movie-catalog.js',['movieCatalog']],
  ['poster-manifest.js',['posterManifest']],['content-evidence.js',['contentEvidenceById']],
  ['family-advisories.js',['familyAdvisoryLabels','getFamilyAdvisories']]
]){
  const code=await fs.readFile(path.join(root,file),'utf8');
  vm.runInThisContext(code+'\n;Object.assign(globalThis,{'+names.join(',')+'});',{filename:file});
}
const {allMovies,home,reviewedDetail,pendingDetail,setPublishedForBuild}=await import('../public/app.js');
try{
  const response=await reviewsHandler(new Request(SITE+'/api/reviews'));
  if(response.ok){const result=await response.json();if(result.connected)setPublishedForBuild(result.reviews);}
  else console.warn('Published reviews unavailable at build; provisional labels retained.');
}catch{console.warn('Published review service not configured; building from public catalog.');}
const movies=allMovies();
const template=await fs.readFile(path.join(root,'index.html'),'utf8');
function main(html,body){return html.replace(/<main id="content"[^>]*>[\s\S]*?<\/main>/,()=>'<main id="content" tabindex="-1">'+body+'</main>');}
function meta(html,key,value,attribute='name'){
  const pattern=new RegExp('<meta '+attribute+'="'+key+'" content="[^"]*"\\s*/?>');
  return html.replace(pattern,()=>'<meta '+attribute+'="'+key+'" content="'+esc(value)+'">');
}
const homeHtml=main(template,home());
await fs.writeFile(path.join(root,'index.html'),homeHtml);
const seen=new Set(),indexable=[SITE+'/'];
for(const movie of movies){
  const route=moviePath(movie);
  if(seen.has(route))throw new Error('Duplicate movie URL: '+route);
  seen.add(route);
  const url=SITE+route,title=movie.title+' ('+movie.year+') | Christian Movie Review | The Orthodox Lens';
  const description=(movie.verdict?'Christian movie review of '+movie.title+' ('+movie.year+'). '+(movie.age?'Suggested age: '+movie.age+'. ':'')+reviewStatus(movie)+'. ':movie.title+' ('+movie.year+'): research pending. ')+(movie.synopsis||'');
  let html=main(template,movie.verdict?reviewedDetail(movie):pendingDetail(movie));
  html=html.replace(/<title>[\s\S]*?<\/title>/,()=>'<title>'+esc(title)+'</title>').replace(/<link rel="canonical" href="[^"]*"\s*\/?\s*>/,()=>'<link rel="canonical" href="'+esc(url)+'">');
  for(const [key,value,attr] of [['description',description.slice(0,230),'name'],['og:title',title,'property'],['og:description',description.slice(0,230),'property'],['og:url',url,'property'],['og:type','article','property'],['twitter:title',title,'name'],['twitter:description',description.slice(0,230),'name']])html=meta(html,key,value,attr);
  // Research-only records remain reachable but are not presented as finished search results.
  if(!movie.verdict)html=meta(html,'robots','noindex, follow');
  else indexable.push(url);
  const schema={'@context':'https://schema.org','@type':'WebPage',name:title,url,description:description.slice(0,230),about:{'@type':'Movie',name:movie.title,datePublished:String(movie.year)}};
  const json=JSON.stringify(schema).replace(/</g,'\\u003c');
  html=html.replace('</head>',()=>'<script type="application/ld+json">'+json+'</script></head>');
  const target=path.join(root,route.slice(1),'index.html');
  await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,html);
}
await fs.writeFile(path.join(root,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+indexable.map(u=>'  <url><loc>'+esc(u)+'</loc></url>').join('\n')+'\n</urlset>\n');
console.log('Generated '+seen.size+' unique movie pages; '+indexable.length+' indexable URLs.');
