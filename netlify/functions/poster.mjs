// Authenticated TMDB poster lookup for the Coptic Orthodox Movie Reviews frontend.
// Exposed at /api/poster by Netlify's function route configuration.
const normalize = value => String(value ?? '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim();
const response = (payload, status=200) => new Response(JSON.stringify(payload), {
  status, headers: {'Content-Type':'application/json; charset=utf-8','Cache-Control':'public, max-age=86400','X-Content-Type-Options':'nosniff'}
});
export const config = {path:'/api/poster'};
export default async function handler(request) {
  if (request.method !== 'GET') return response({error:'Method not allowed'},405);
  const input=new URL(request.url);
  const title=(input.searchParams.get('title')||'').trim();
  const year=Number(input.searchParams.get('year'));
  if (!title || title.length>150 || !Number.isInteger(year) || year<1880 || year>2100) return response({error:'Invalid title/year'},400);
  const credential=(globalThis.Netlify?.env?.get('TMDB_API_KEY') || process.env.TMDB_API_KEY || '').trim();
  if (!credential) return response({posterUrl:null,reason:'TMDB_API_KEY not configured'},503);
  const endpoint=new URL('https://api.themoviedb.org/3/search/movie');
  endpoint.searchParams.set('query',title);
  endpoint.searchParams.set('include_adult','false');
  endpoint.searchParams.set('language','en-US');
  const isToken=credential.startsWith('eyJ') || credential.includes('.');
  if (!isToken) endpoint.searchParams.set('api_key',credential);
  try {
    const result=await fetch(endpoint, {
      headers:{'Accept':'application/json', ...(isToken?{'Authorization':`Bearer ${credential}`}:{})},
      signal:AbortSignal.timeout(9000)
    });
    if (!result.ok) return response({posterUrl:null,reason:'TMDB request failed'},502);
    const body=await result.json();
    // Require a matching title and a year within one year for alternate release dates.
    const matches=(body.results||[]).filter(m=>m.poster_path &&
      (normalize(m.title)===normalize(title) || normalize(m.original_title)===normalize(title)) &&
      Math.abs(Number((m.release_date||'').slice(0,4))-year)<=1);
    matches.sort((a,b)=>{
      const exactA=Number((a.release_date||'').slice(0,4))===year?1:0;
      const exactB=Number((b.release_date||'').slice(0,4))===year?1:0;
      return exactB-exactA || (b.popularity||0)-(a.popularity||0);
    });
    const film=matches[0];
    if (!film) return response({posterUrl:null,reason:'No reliably matched poster'},200);
    return response({posterUrl:`https://image.tmdb.org/t/p/w500${film.poster_path}`,provider:'TMDB',providerUrl:'https://www.themoviedb.org',tmdbId:film.id});
  }catch(e){return response({posterUrl:null,reason:'Poster lookup unavailable'},502);}
}
