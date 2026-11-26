// Shared discovery and presentation helpers. No private Studio data is used.
export const SITE='https://theorthodoxlens.org';
export const escapeHtml=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function movieSlug(movie){
  const title=String(movie.title||'').normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  return (title||'film')+'-'+String(movie.year||'unknown').replace(/[^a-z0-9]/gi,'');
}
export const moviePath=movie=>'/movies/'+movieSlug(movie)+'/';
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
  if(key==='lent')return (movie.themes||[]).some(t=>t.type==='positive'&&t.score>=3&&/repentan|forgiv|sacrifice|humility|prayer|faith|service|generosity/i.test(t.name));
  return false;
}
export function guidanceKey(){
  return '<section class="section guidance-key"><div class="container"><h2>Understand the ratings</h2><p><strong>Age guidance:</strong> All Ages, 7+, 10+, 13+, 16+ and 18+ are suggested minimum ages, not official classifications or guarantees. “Not Recommended” indicates a strong editorial caution.</p><p><strong>Content advisories:</strong> '+Object.values(warningCategories).map(escapeHtml).join(' · ')+'. A missing finding is not evidence that a film is free of that content.</p><p><strong>Theme scores:</strong> 0–5 describe prominence, not quality; unverified items are not scored. <a class="text-link" href="/#about/approach">Read the full method →</a></p></div></section>';
}
export function faithPrompts(){
  return '<section class="section faith-discovery"><div class="container"><div class="eyebrow">Beyond content warnings</div><h2>Watch. Reflect. Grow.</h2><p>Use these general prompts after a film, alongside its film-specific Scripture reflections and family questions.</p><div class="method-grid"><article class="method-card"><h3>Repentance &amp; forgiveness</h3><p>Luke 15:11–32 · Where did a character acknowledge wrongdoing? What would a genuine change of heart look like?</p></article><article class="method-card"><h3>Sacrifice &amp; love</h3><p>John 15:13 · Who chose another person’s good over their own comfort? How can we practice self-giving love?</p></article><article class="method-card"><h3>Virtue &amp; discernment</h3><p>Philippians 4:8 · What did the story invite us to admire? Is it consistent with truth, purity, and goodness?</p></article></div></div></section>';
}
export function newsletter(){
  return '<section class="section newsletter-section" aria-labelledby="newsletter-title"><div class="container"><div class="paper-panel"><div class="eyebrow">Film of the week</div><h2 id="newsletter-title">A thoughtful movie night, in your inbox.</h2><p>Register your interest in a future weekly email with a film recommendation, Scripture reflection and family question. Sending has not started yet.</p><form name="film-of-the-week" method="POST" action="/newsletter-thanks/" data-netlify="true" netlify-honeypot="bot-field" class="newsletter-form"><input type="hidden" name="form-name" value="film-of-the-week"><p hidden><label>Leave blank <input name="bot-field" tabindex="-1" autocomplete="off"></label></p><label for="newsletter-email">Email address</label><input id="newsletter-email" name="email" type="email" autocomplete="email" required maxlength="254"><label class="newsletter-consent"><input type="checkbox" name="consent" value="yes" required> I agree to receive Orthodox Lens film emails when the newsletter launches.</label><button class="btn gold" type="submit">Join the interest list</button></form><p class="muted">Your email is collected for this newsletter only. No account is required.</p></div></div></section>';
}
export function shareLinks(movie){
  const url=SITE+moviePath(movie), title=movie.title+' | The Orthodox Lens';
  return '<div class="review-share" aria-label="Share this review"><strong>Share review</strong><button type="button" class="small-btn" data-share-url="'+escapeHtml(url)+'" data-share-title="'+escapeHtml(title)+'">Share / copy link</button><a class="small-btn" href="mailto:?subject='+encodeURIComponent(title)+'&amp;body='+encodeURIComponent(url)+'">Email</a><span role="status" id="share-status"></span></div>';
}
