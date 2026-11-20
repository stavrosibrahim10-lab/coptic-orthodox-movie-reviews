import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import {validateReview,environment} from '../netlify/functions/_shared/core.mjs';
import {applyFamilyReviewRecommendation, supplementalReviews, supplementalContentEvidenceById} from '../public/family-review-ratings.js';
const seed=JSON.parse(fs.readFileSync(new URL('../bootstrap/studio-import.json',import.meta.url),'utf8'));
test('200 unique movie drafts with complete Stage 4 review structure',()=>{
 assert.equal(seed.reviews.length,200);
 assert.equal(new Set(seed.reviews.map(r=>r.id)).size,200);
 for(const review of seed.reviews){assert.equal(validateReview(review),review);assert.ok(review.questions.length>=5);}
 assert.equal(seed.reviews.reduce((n,r)=>n+r.themes.length,0),857);
});
test('recommended ratings fit the review schema without duplicating themes',()=>{
 const all=[...seed.reviews, ...supplementalReviews];
 assert.equal(new Set(all.map(r=>r.id)).size,all.length);
 for(const review of all){
   const updated=applyFamilyReviewRecommendation(review);
   assert.equal(validateReview(updated),updated);
   if(updated!==review){
     assert.equal(new Set(updated.themes.map(t=>t.name)).size,updated.themes.length);
     assert.equal(applyFamilyReviewRecommendation(updated),updated);
   }
 }
 const luca=applyFamilyReviewRecommendation(all.find(r=>r.id==='batch1-2021-luca'));
 assert.equal(luca.verdict,'neutral');
 assert.ok(luca.themes.some(t=>t.type==='context'&&t.name==='Hidden identity and acceptance'));
 assert.ok(!luca.themes.some(t=>t.name==='Dishonesty and betrayal'));
});
test('The Emoji Movie has a sourced Destructive review and can update a prior draft',()=>{
 const review=supplementalReviews.find(r=>r.title==='The Emoji Movie');
 assert.equal(review.verdict,'destructive');
 assert.equal(review.theologicalApproval,'pending');
 assert.ok(review.patristic.url.startsWith('https://'));
 assert.ok(review.themes.some(t=>t.type==='context'&&t.score===5));
 const categories=supplementalContentEvidenceById[review.id].content_categories;
 for(const category of ['sexual_content','language','violence','spiritual_material','substance_use','moral_themes']){
   assert.ok(categories[category].findings.length>0);
   assert.ok(categories[category].evidence.some(item=>item.url.startsWith('https://')));
 }
 const old={...review,verdict:'neutral',themeScripture:undefined,editorNote:'Retain the editor note.'};
 const revised=applyFamilyReviewRecommendation(old);
 assert.equal(revised.verdict,'destructive');
 assert.deepEqual(revised.themeScripture,review.themeScripture);
 assert.equal(revised.editorNote,old.editorNote);
 assert.equal(applyFamilyReviewRecommendation(revised),revised);
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
