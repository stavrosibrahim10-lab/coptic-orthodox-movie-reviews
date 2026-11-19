import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import {validateReview,environment} from '../netlify/functions/_shared/core.mjs';
const seed=JSON.parse(fs.readFileSync(new URL('../bootstrap/studio-import.json',import.meta.url),'utf8'));
test('200 unique movie drafts with complete Stage 4 review structure',()=>{
 assert.equal(seed.reviews.length,200);
 assert.equal(new Set(seed.reviews.map(r=>r.id)).size,200);
 for(const review of seed.reviews){assert.equal(validateReview(review),review);assert.ok(review.questions.length>=5);}
 assert.equal(seed.reviews.reduce((n,r)=>n+r.themes.length,0),857);
});
test('241 flagged concerns attached to the 200 imported movies',()=>{
 assert.equal(seed.issues.length,241);
 const valid=new Set(seed.reviews.map(r=>r.id));for(const issue of seed.issues)assert.ok(valid.has(issue.movie_id));
 assert.equal(seed.issues.filter(i=>i.kind==='source').length,165);
 assert.equal(seed.issues.filter(i=>i.kind==='age').length,76);
 assert.equal(new Set(seed.issues.map(i=>i.issue_key)).size,241);
});
test('Stage 3 six-category evidence is retained for all 200 review identities',()=>{
 const code=fs.readFileSync(new URL('../public/content-evidence.js',import.meta.url),'utf8');
 const ctx={};vm.runInNewContext(code+'\nthis.__ledger=contentEvidenceById;',ctx);
 for(const movie of seed.reviews){
   const evidence=ctx.__ledger[movie.id];assert.ok(evidence,`Missing Stage 3 source: ${movie.title}`);
   for(const field of ['sexual_content','language','violence','spiritual_material','substance_use','moral_themes'])assert.ok(evidence.content_categories[field],`${movie.title}: ${field}`);
 }
});
test('environment requires an HTTPS Supabase project URL and both key types',()=>{
 const old=Object.fromEntries(['SUPABASE_URL','SUPABASE_PUBLISHABLE_KEY','SUPABASE_SECRET_KEY'].map(x=>[x,process.env[x]]));
 try{process.env.SUPABASE_URL='http://example.com';process.env.SUPABASE_PUBLISHABLE_KEY='sb_publishable_demo';process.env.SUPABASE_SECRET_KEY='sb_secret_demo';assert.equal(environment().ready,false);
 process.env.SUPABASE_URL='https://example.supabase.co';assert.equal(environment().ready,true)}finally{for(const [k,v] of Object.entries(old))if(v===undefined)delete process.env[k];else process.env[k]=v}
});
