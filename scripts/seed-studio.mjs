// Idempotent initial import: creates only missing movies/issue keys and NEVER overwrites edits.
// Run: node --env-file-if-exists=.env.local scripts/seed-studio.mjs
import fs from 'node:fs/promises';
import {environment,rows,insert,validateReview} from '../netlify/functions/_shared/core.mjs';
import {applyFamilyReviewRecommendation, supplementalReviews} from '../public/family-review-ratings.js';
const env=environment();if(!env.ready){console.error('Missing or invalid SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY or SUPABASE_SECRET_KEY');process.exit(1)}
const seed=JSON.parse(await fs.readFile(new URL('../bootstrap/studio-import.json',import.meta.url),'utf8'));
const existing=await rows('studio_reviews',{select:'movie_id',limit:1000});const seen=new Set(existing.map(x=>x.movie_id));
const toCreate=[...seed.reviews, ...supplementalReviews].filter(r=>!seen.has(r.id))
 .map(applyFamilyReviewRecommendation).map(validateReview).map(r=>({movie_id:r.id,title:r.title,release_year:r.year,verdict:r.verdict,suggested_age:r.age,draft:r,workflow:'draft',revision:1}));
for(let i=0;i<toCreate.length;i+=20){await insert('studio_reviews',toCreate.slice(i,i+20),{ignore:true});console.log(`Inserted movie batch ${Math.min(i+20,toCreate.length)} of ${toCreate.length}`)}
const existingIssues=await rows('studio_issues',{select:'issue_key',limit:3000});const issueKeys=new Set(existingIssues.map(x=>x.issue_key));
const toCreateIssues=seed.issues.filter(i=>!issueKeys.has(i.issue_key));
for(let i=0;i<toCreateIssues.length;i+=30){await insert('studio_issues',toCreateIssues.slice(i,i+30),{ignore:true});console.log(`Inserted issue batch ${Math.min(i+30,toCreateIssues.length)} of ${toCreateIssues.length}`)}
console.log(`DONE: ${existing.length+toCreate.length} movie records; ${existingIssues.length+toCreateIssues.length} evidence/age flags. All imported drafts are unapproved and unpublished.`);
