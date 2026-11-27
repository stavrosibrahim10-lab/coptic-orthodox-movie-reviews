// Shared discovery and presentation helpers. No private Studio data is used.
export const SITE='https://theorthodoxlens.org';
export const escapeHtml=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function movieSlug(movie){
  const title=String(movie.title||'').normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  return (title||'film')+'-'+String(movie.year||'unknown').replace(/[^a-z0-9]/gi,'');
}
export const moviePath=movie=>'/movies/'+movieSlug(movie)+'/';
// Expand a known short catalog synopsis without overwriting newer editorial copy.
export function publicSynopsis(movie){
  const synopsis=movie.synopsis||'';
  if(movieSlug(movie)==='the-king-of-kings-2025' && synopsis==='Charles Dickens narrates the life of Jesus Christ to his young son in an animated retelling.'){
    return 'Charles Dickens tells his young son the story of Jesus Christ in this animated retelling of the Gospel. Through the life, teachings and miracles of Jesus, the boy encounters a story of faith, love and sacrifice that leads to the Crucifixion and Resurrection.';
  }
  return synopsis;
}
export const warningCategories={
  sexual_content:'Sexual content',language:'Language & blasphemy',violence:'Violence & peril',
  spiritual_material:'Occult / spiritual material',substance_use:'Alcohol, drugs & smoking',moral_themes:'Moral themes'
};
export function reviewStatus(movie){
  if(movie.reviewType==='published'&&movie.theologicalApproval==='approved')return 'Published editorial review';
  return movie.verdict?'Provisional assessment — human editorial and theological approval pending':'Research pending — no verdict or age recommendation';
}
export function warningFinding(movie,key,evidence){
  const entry=evidence?.content_categories?.[key];
  if(entry?.status==='specific_findings_verified'&&entry.findings?.length)return true;
  const aliases={sexual_content:/sexual|nudity|sensual/,language:/language|profanity|blasphemy/,violence:/violence|peril|gore/,spiritual_material:/occult|witchcraft|spiritual|magic/,substance_use:/alcohol|drugs|smoking|substance/,moral_themes:/moral/};
  return (movie.warnings||[]).some(w=>aliases[key]?.test(String(w.name||'').toLowerCase())&&w.details&& !/^(none|no |not verified)/i.test(w.details));
}
export function inCollection(movie,key){
  if(key==='all')return true;
  if(movie.verdict!=='edifying')return false;
  if(key==='family')return ['All Ages','7+','10+'].includes(movie.age);
  return false;
}
export function guidanceKey(){
  return '<section class="section guidance-key"><div class="container"><h2>Understand the ratings</h2><p><strong>Age guidance:</strong> All Ages, 7+, 10+, 13+, 16+ and 18+ are suggested minimum ages, not official classifications or guarantees. “Not Recommended” indicates a strong editorial caution.</p><p><strong>Content advisories:</strong> '+Object.values(warningCategories).map(escapeHtml).join(' · ')+'. A missing finding is not evidence that a film is free of that content.</p><p><strong>Theme scores:</strong> 0–5 describe prominence, not quality; unverified items are not scored. <a class="text-link" href="/#about/approach">Read the full method →</a></p></div></section>';
}
export function faithPrompts(){
  return '<section class="section faith-discovery"><div class="container"><div class="eyebrow">Beyond content warnings</div><h2>Watch. Reflect. Grow.</h2><p>Use these general prompts after a film, alongside its film-specific Scripture reflections and family questions.</p><div class="method-grid"><article class="method-card"><h3>Repentance &amp; forgiveness</h3><p>Luke 15:11–32 · Where did a character acknowledge wrongdoing? What would a genuine change of heart look like?</p></article><article class="method-card"><h3>Sacrifice &amp; love</h3><p>John 15:13 · Who chose another person’s good over their own comfort? How can we practice self-giving love?</p></article><article class="method-card"><h3>Virtue &amp; discernment</h3><p>Philippians 4:8 · What did the story invite us to admire? Is it consistent with truth, purity, and goodness?</p></article></div></div></section>';
}
export function newsletter(){
  return '<section class="section newsletter-section newsletter-prompt" id="newsletter" aria-labelledby="newsletter-title"><div class="container"><div class="paper-panel"><div><div class="eyebrow">Film of the month</div><h2 id="newsletter-title">A thoughtful movie night, in your inbox.</h2><p>Monthly recommendations, Scripture reflections and family discussion questions.</p></div><a class="btn gold" href="/newsletter-signup/" data-newsletter-open>Subscribe to the newsletter →</a></div></div></section>';
}
export function shareLinks(movie){
  const url=SITE+moviePath(movie), title=movie.title+' | The Orthodox Lens';
  return '<div class="review-share"><button type="button" class="share-control" data-share-url="'+escapeHtml(url)+'" data-share-title="'+escapeHtml(title)+'" aria-label="Share '+escapeHtml(movie.title)+'" title="Share movie"><svg aria-hidden="true" focusable="false" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15V3m-4 4 4-4 4 4M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg></button><span role="status" aria-live="polite" aria-atomic="true" id="share-status" class="share-status"></span></div>';
}
