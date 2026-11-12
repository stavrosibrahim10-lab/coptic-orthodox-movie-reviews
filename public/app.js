let published=[];
let adminReviews=[];
let adminPassword='';
let currentDraft=null;
let currentSearch='';
let currentVerdict='all';
let currentAge='all';
let currentGenre='all';
let mobileOpen=false;

const app=document.getElementById('content');
document.getElementById('year').textContent=new Date().getFullYear();

const esc=(x)=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const verdictLabel=(x)=>({edifying:'Edifying',neutral:'Neutral',destructive:'Destructive to Spiritual Wellness'})[x]||'Review Pending';
const icon=(v)=>({edifying:'✦',neutral:'◌',destructive:'⚑'})[v]||'○';
const pill=(v)=>`<span class="pill ${esc(v||'pending')}">${icon(v)} ${esc(verdictLabel(v))}</span>`;
const routeLink=(r)=>`#review/${encodeURIComponent(r.id)}`;
const coverClass=(r,i=0)=>r.posterClass||`p${(i%6)+1}`;
const posterLookups=new Map();
const officialAges=['All Ages','7+','10+','13+','16+','18+','Not Recommended'];

function sourceSearchLinks(r){
  const q=encodeURIComponent(`${r.title} ${r.year||''}`.trim());
  return [
    {label:'IMDb',url:`https://www.imdb.com/find/?q=${q}`},
    {label:'Common Sense Media',url:`https://www.commonsensemedia.org/search/${encodeURIComponent(r.title)}`},
    {label:'Dove',url:`https://dove.org/?s=${encodeURIComponent(r.title)}`}
  ];
}

function normalizedCatalog(){
  return (movieCatalog||[]).map((m,i)=>({
    ...m,
    genre:m.genre||'Film',
    posterClass:coverClass(m,i),
    status:m.status||'awaiting_research',
    sourceLinks:m.sourceLinks||sourceSearchLinks(m)
  }));
}

function reviewedItems(){
  const pub=(published||[]).map((r,i)=>({...r,posterClass:coverClass(r,i),sourceLinks:r.sourceLinks||sourceSearchLinks(r),reviewType:'published'}));
  const seeded=(seedReviews||[])
    .filter(r=>!pub.some(p=>p.title.toLowerCase()===r.title.toLowerCase()&&p.year===r.year))
    .map((r,i)=>({...r,posterClass:coverClass(r,i),sourceLinks:r.sourceLinks||sourceSearchLinks(r),reviewType:'seed'}));
  return [...pub,...seeded];
}

function allMovies(){
  const reviewed=reviewedItems();
  const catalog=normalizedCatalog().filter(c=>!reviewed.some(r=>r.title.toLowerCase()===c.title.toLowerCase()&&r.year===c.year));
  return [...reviewed,...catalog];
}

function reviewedCount(){return reviewedItems().length;}
function pendingCount(){return normalizedCatalog().filter(c=>!reviewedItems().some(r=>r.title.toLowerCase()===c.title.toLowerCase()&&r.year===c.year)).length;}

function renderCover(r,{large=false}={}){
  const sizeClass=large?' large':'';
  const cls=coverClass(r);
  const genre=((r.genre||'Film').split('·')[0]||'Film').trim();
  const statusBadge=r.verdict?verdictLabel(r.verdict):'Research Queue';
  const imageUrl=r.posterUrl||((typeof posterManifest!=='undefined')?posterManifest[`${r.title}|${r.year}`]:null);
  return `<div data-poster-title="${esc(r.title)}" data-poster-year="${esc(r.year)}" class="poster ${cls}${sizeClass}${imageUrl?' poster-image':''}">
    ${imageUrl?`<img loading="lazy" src="${esc(imageUrl)}" alt="${esc(r.title)} published movie poster" onerror="this.parentNode.classList.remove('poster-image');this.remove()">`: ''}
    <div class="poster-meta"><small>${esc(r.year||'')}</small><span>${esc(r.title)}</span><em>${esc(genre)} · ${esc(statusBadge)}</em></div>
  </div>`;
}

function card(r){
  const reviewed=!!r.verdict;
  const label=reviewed?(r.reviewType==='seed'?'SOURCE-BASED · PROVISIONAL':'EDITOR REVIEWED'):'RESEARCH PAGE READY';
  const labelClass=reviewed?(r.reviewType==='seed'?'seed-flag':'tiny'):'catalog-flag';
  return `<a class="movie-card" href="${routeLink(r)}">
    ${renderCover(r)}
    <div class="movie-card-body">
      <div class="card-topline">${pill(r.verdict)}<span class="age-chip">${esc(r.age||'—')}</span></div>
      <h3>${esc(r.title)}</h3>
      <p>${esc(r.year)} · ${esc(r.genre||'Film')}</p>
      <span class="${labelClass}">${esc(label)}</span>
    </div>
  </a>`;
}

function featuredRecent(){
  return allMovies()
    .filter(r=>Number(r.year)>=2024)
    .sort((a,b)=>{
      const ra=(a.verdict?1:0), rb=(b.verdict?1:0);
      return rb-ra || Number(b.year)-Number(a.year) || a.title.localeCompare(b.title);
    })
    .slice(0,6);
}

function reviewedHighlights(){
  return reviewedItems().sort((a,b)=>Number(b.year)-Number(a.year)).slice(0,8);
}

function summaryStrip(){
  return `<section class="summary-strip">
    <article class="summary-card edifying"><div class="summary-icon">✦</div><div><h4>Edifying</h4><p>Stories that inspire virtue, faith, love, and spiritual growth.</p></div></article>
    <article class="summary-card neutral"><div class="summary-icon">◌</div><div><h4>Neutral</h4><p>Entertainment best approached with thoughtful discernment.</p></div></article>
    <article class="summary-card destructive"><div class="summary-icon">⚑</div><div><h4>Destructive to Spiritual Wellness</h4><p>Content or messages that raise serious spiritual concerns.</p></div></article>
  </section>`;
}

function home(){
  const recent=featuredRecent();
  const reviewed=reviewedHighlights();
  return `<section class="hero"><div class="hero-inner"><div class="eyebrow">✣ &nbsp; Faithful discernment for the whole family</div><h1>Stories shape us.<br><em>Choose them wisely.</em></h1><p class="hero-lede">Explore movies through a distinctly Coptic Orthodox perspective, with thoughtful spiritual guidance, clear content warnings, and practical advice for Christian families.</p><form class="hero-search" id="heroSearch"><span class="search-ico">⌕</span><input id="heroInput" placeholder="Search movies, genres, and themes..." aria-label="Search movies" autocomplete="off"><button class="btn gold" type="submit">Explore movies →</button></form><div class="hero-note"><span class="dot"></span> Built for Coptic Orthodox families · Useful for all Christian families</div></div></section>
  ${summaryStrip()}
  <section class="section recent-section"><div class="container"><div class="section-header"><div><div class="eyebrow">Fresh recommendations</div><h2>Best recent movies</h2><p>Recent films selected for family consideration, with Coptic Orthodox spiritual guidance and parental content information. A film's inclusion is not an endorsement.</p></div><a href="#browse" class="text-link">Browse all movies →</a></div><div class="movie-grid recent-feature">${recent.map(card).join('')}</div><p class="recent-note">We display authentic published movie posters when available through our verified poster sources. If a poster is unavailable, a text cover is shown instead; no AI-generated substitute is used.</p></div></section>
  <section class="section"><div class="container"><div class="section-header"><div><div class="eyebrow">Actively reviewed</div><h2>Coptic Orthodox review library</h2><p>These pages already include a preliminary spiritual verdict, age guidance, and source-based content notes.</p></div><a href="#method" class="text-link">Read our framework →</a></div><div class="movie-grid">${reviewed.map(card).join('')}</div></div></section>
  <section class="steps-dark section"><div class="container"><div class="section-header"><div><div class="eyebrow">How the site grows</div><h2>From research queue to finished review</h2><p>The build now supports every movie page. The remaining work is deeper content verification, fuller source capture, and editor approval.</p></div></div><div class="steps"><article class="step"><div class="step-num">01</div><h3>Research the film</h3><p>Start with source pages like IMDb, Common Sense Media, Dove, BBFC, studio summaries, and trusted parental guides.</p></article><article class="step"><div class="step-num">02</div><h3>Draft the review</h3><p>Use the editorial studio to draft an evidence-constrained review, then inspect the verdict, age guidance, and theme ratings carefully.</p></article><article class="step"><div class="step-num">03</div><h3>Approve and publish</h3><p>Once the facts and Coptic Orthodox interpretation are solid, publish the full review and it appears automatically across the site.</p></article></div></div></section>`;
}

function browse(){
  const genres=[...new Set(allMovies().map(x=>(x.genre||'Film').split('·')[0].trim()))].sort();
  return `<section class="page-hero"><div class="container"><div class="eyebrow">Search the catalog</div><h1>Browse movies</h1><p>Filter finished reviews and research-ready movie pages by verdict, age guidance, genre, or title. Every title has a page; completed reviews are clearly separated from the research queue.</p></div></section><section class="section"><div class="container"><div class="filters"><input id="searchFilter" class="field" placeholder="Search title or genre..." value="${esc(currentSearch)}"><select id="verdictFilter"><option value="all">All verdicts</option><option value="edifying" ${currentVerdict==='edifying'?'selected':''}>Edifying</option><option value="neutral" ${currentVerdict==='neutral'?'selected':''}>Neutral</option><option value="destructive" ${currentVerdict==='destructive'?'selected':''}>Destructive</option><option value="pending" ${currentVerdict==='pending'?'selected':''}>Review pending</option></select><select id="ageFilter"><option value="all">All ages</option>${officialAges.map(a=>`<option value="${esc(a)}" ${currentAge===a?'selected':''}>${esc(a)}</option>`).join('')}</select><select id="genreFilter"><option value="all">All genres</option>${genres.map(g=>`<option value="${esc(g)}" ${currentGenre===g?'selected':''}>${esc(g)}</option>`).join('')}</select></div><div id="filteredResults"></div></div></section>`;
}

function matchesFilters(r){
  const hay=`${r.title} ${r.genre||''} ${r.synopsis||''}`.toLowerCase();
  const genre=((r.genre||'Film').split('·')[0]||'Film').trim();
  if(currentSearch && !hay.includes(currentSearch.toLowerCase())) return false;
  if(currentVerdict==='pending' && r.verdict) return false;
  if(currentVerdict!=='all' && currentVerdict!=='pending' && r.verdict!==currentVerdict) return false;
  if(currentAge!=='all' && (r.age||'')!==currentAge) return false;
  if(currentGenre!=='all' && genre!==currentGenre) return false;
  return true;
}

function drawFiltered(){
  const target=document.getElementById('filteredResults'); if(!target) return;
  const items=allMovies().filter(matchesFilters).sort((a,b)=>Number(b.year)-Number(a.year)||a.title.localeCompare(b.title));
  target.innerHTML=`<div class="result-count">Showing ${items.length} of ${allMovies().length} movie pages</div>${items.length?`<div class="movie-grid">${items.map(card).join('')}</div>`:`<div class="nothing"><h3>No movies matched your filters</h3><p>Try removing a filter or searching with fewer keywords.</p></div>`}`;
}

function renderRatings(r,type){
  const list=(r.themes||[]).filter(t=>t.type===type);
  if(!list.length) return `<p class="muted">No ${type==='positive'?'positive':'harmful'} theme ratings have been published yet.</p>`;
  return list.map(t=>{
    const score=(t.score===null||t.score===undefined)?'N/V':`${t.score}/5`;
    const fill=(typeof t.score==='number'&&t.score>=0)?(t.score/5)*100:0;
    return `<div class="rating-row"><div><strong>${esc(t.name)}</strong><small>${esc(t.portrayal||'unverified')} · ${esc(t.evidence||'Evidence note pending')}</small></div><div class="rating-track"><div class="rating-fill ${type==='positive'?'positive':'harmful'}" style="width:${fill}%"></div></div><div class="score">${esc(score)}</div></div>`;
  }).join('');
}

function researchLinksBlock(r){
  const links=r.sourceLinks||sourceSearchLinks(r);
  return `<div class="source-buttons">${links.map(s=>`<a class="small-btn" target="_blank" rel="noopener noreferrer" href="${esc(s.url)}">${esc(s.label)}</a>`).join('')}</div>`;
}

function pendingDetail(r){
  return `<div class="container review-back"><a class="back-link" href="#browse">← Back to movies</a><div class="review-layout"><div><div class="paper-panel"><div class="review-banner">${renderCover(r,{large:true})}<div><div class="eyebrow">Coptic Orthodox movie research page</div><h1>${esc(r.title)}</h1><div class="meta">${esc(r.year)} · ${esc(r.genre||'Film')}</div>${pill(null)}<div class="tag-row"><span class="tag">Full verdict pending</span><span class="tag">Cover-ready page</span></div><p>This page is ready for backfilling, but a full Coptic Orthodox review has not been completed yet. No spiritual verdict, age guidance, or detailed content warnings have been assigned for this title.</p>${researchLinksBlock(r)}</div></div></div><div class="paper-panel detail-section"><div class="eyebrow">What still needs to be reviewed</div><h2>Research checklist</h2><div class="check-grid"><div class="check-item">Violence, peril, and disturbing imagery</div><div class="check-item">Language and blasphemy</div><div class="check-item">Sexual content and immodesty</div><div class="check-item">Occult, superstition, or spiritual confusion</div><div class="check-item">Family themes, sacrifice, forgiveness, repentance</div><div class="check-item">What the story ultimately asks viewers to admire</div></div><p class="muted">Use the source links above as a starting point. Once enough evidence is gathered, draft the review in the editorial studio and publish it.</p></div></div><aside><div class="paper-panel"><div class="eyebrow">Editorial transparency</div><h3 class="side-title">Current page state</h3><ul class="source-list"><li>Movie page created</li><li>Cover tile ready</li><li>Research links attached</li><li>Awaiting evidence-backed Coptic Orthodox review</li></ul><div class="disclaimer">This page intentionally avoids guessing. A missing warning or missing age rating does <strong>not</strong> mean the movie is safe.</div><div class="pastoral-guidance">These reviews are suggestions. For personal discernment, consult your father of confession or parish priest.</div></div><div class="paper-panel detail-section"><div class="eyebrow">Quick links</div><h3 class="side-title">Research sources</h3>${researchLinksBlock(r)}<p class="muted" style="margin-top:12px">IMDb helps with basic film identity and credits. Common Sense Media and Dove can help with parental concerns and content direction. Use them as inputs, not as substitutes for your own Coptic Orthodox assessment.</p></div></aside></div></div>`;
}

function reviewedDetail(r){
  return `<div class="container review-back"><a href="#browse" class="back-link">← Back to all movies</a><div class="review-layout"><div><div class="paper-panel"><div class="review-banner">${renderCover(r,{large:true})}<div><div class="eyebrow">Coptic Orthodox movie review</div><h1>${esc(r.title)}</h1><div class="meta">${esc(r.year)} · ${esc(r.genre||'Film')} · ${esc(r.runtime||'Runtime unverified')} · ${esc(r.officialRating||'Rating unverified')}</div>${pill(r.verdict)}<div class="tag-row"><span class="tag">Suggested age: ${esc(r.age||'Not verified')}</span><span class="tag">${r.theologicalApproval==='approved'?'Theologically reviewed':'Provisional · theology pending'}</span></div><p>${esc(r.synopsis||'Synopsis unavailable.')}</p>${researchLinksBlock(r)}</div></div></div><div class="paper-panel detail-section"><div class="eyebrow">The spiritual assessment</div><h2>Our Coptic Orthodox verdict</h2><p>${esc(r.verdictRationale||'Editorial review pending.')}</p><h3 style="margin:28px 0 8px">Why this age guidance?</h3><p>${esc(r.ageRationale||'Age guidance not verified.')}</p></div><div class="paper-panel detail-section"><div class="eyebrow">Look beneath the surface</div><h2>Spiritual theme ratings</h2><p class="muted">0 = confirmed absent; 5 = defining. A high score describes prominence, not automatic moral approval. N/V means not verified.</p><div class="rating-header">Virtues & positive themes</div>${renderRatings(r,'positive')}<div class="rating-header">Content & harmful themes</div>${renderRatings(r,'harmful')}</div><div class="paper-panel detail-section"><div class="eyebrow">For thoughtful conversation</div><h2>Orthodox spiritual reflection</h2><p>${esc(r.reflection||'Reflection pending editorial review.')}</p>${r.scripture?.length?`<div class="tag-row">${r.scripture.map(s=>`<span class="tag">${esc(s)}</span>`).join('')}</div>`:''}<h3 style="margin:27px 0 12px">${r.verdict==='neutral'?'After watching: Discuss as a family':'Discuss as a family'}</h3>${r.verdict==='neutral'?'<p class="muted">A Neutral classification does not mean every message is spiritually beneficial. If you choose to watch, use these questions afterward to discuss the story through a Coptic Orthodox perspective.</p>':''}${r.questions?.length?r.questions.map((q,i)=>`<div class="q-item"><strong>${i+1}.</strong> ${esc(q)}</div>`).join(''):'<p class="muted">Questions pending review.</p>'}</div></div><aside><div class="paper-panel"><div class="eyebrow">Before you watch</div><h3 class="side-title">Parent content guide</h3>${r.warnings?.length?r.warnings.map(w=>`<div class="warning-item"><div class="warning-name"><span>${esc(w.name)}</span><span class="muted">${esc(w.severity)}</span></div><p>${esc(w.details)}</p></div>`).join(''):'<p class="muted">No detailed warnings were supplied. This does not establish that concerning content is absent.</p>'}<p class="muted" style="font-size:12px"><strong>Other categories:</strong> Unless explicitly verified, unlisted content (including sexuality, profanity, substances, and spiritual practices) remains not verified—not confirmed absent.</p><div class="disclaimer">The suggested age is independent of spiritual classification. Parents should still evaluate their child's maturity and sensitivities.</div><div class="pastoral-guidance"><strong>Spiritual guidance:</strong> These reviews and age recommendations are suggestions, not spiritual direction. For personal discernment, seek the guidance of your father of confession or parish priest.</div></div><div class="paper-panel detail-section"><div class="eyebrow">Editorial transparency</div><h3 class="side-title">Evidence & sources</h3>${r.sources?.length?`<ul class="source-list">${r.sources.map(s=>`<li>${s.url&&/^https?:\/\//.test(s.url)?`<a href="${esc(s.url)}" rel="noopener noreferrer" target="_blank">${esc(s.label||s.url)}</a>`:esc(s.label||'Unlinked source')}${s.notes?`<br><span class="muted">${esc(s.notes)}</span>`:''}</li>`).join('')}</ul>`:'<p class="muted">Source list unavailable.</p>'}<div class="disclaimer"><strong>Verification status:</strong> ${esc(r.contentVerification||'Limited external guidance')}; theological review: ${esc(r.theologicalApproval||'pending')}. Content warnings reflect reported findings and do not constitute an exhaustive absence check.<br><br>${r.reviewType==='seed'?'Source-based preliminary spiritual assessment. The linked parental guides and film databases support factual context, not our independent spiritual interpretation.':'Independent AI-assisted review, approved by a human editor.'}</div></div><div class="paper-panel detail-section"><h3 class="side-title">The meaning behind the verdict</h3><p class="muted">A film's depiction of wrongdoing is not the same as an endorsement of it. We evaluate the full moral message, the presentation of virtue and sin, the severity of content, and opportunities for spiritual growth.</p><a class="text-link" href="#method">Read our methodology →</a></div></aside></div></div>`;
}

function detail(id){
  const r=allMovies().find(x=>x.id===id);
  if(!r) return `<div class="container section"><h1>Review not found</h1><p><a class="text-link" href="#browse">Browse movies →</a></p></div>`;
  return r.verdict ? reviewedDetail(r) : pendingDetail(r);
}

function method(){
  return `<section class="page-hero"><div class="container"><div class="eyebrow">How we review films</div><h1>Our approach</h1><p>We classify movies according to their relationship to spiritual wellness from a distinctly Coptic Orthodox perspective: <strong>Edifying</strong>, <strong>Neutral</strong>, or <strong>Destructive to Spiritual Wellness</strong>. This site primarily serves Coptic Orthodox families while remaining useful to all Christian families.</p></div></section><section class="section"><div class="container"><div class="two-col"><div class="method-card"><div class="eyebrow">Balanced classification</div><h2>Three verdicts</h2><p><strong>Edifying</strong> films encourage Christian virtue and spiritual reflection. <strong>Neutral</strong> films may be mostly recreational or morally mixed. <strong>Destructive</strong> films substantially glorify sin, undermine virtue, or expose viewers to severe harmful content that outweighs any positive moral value.</p></div><div class="method-card"><div class="eyebrow">A consistent framework</div><h2>Theme ratings, 0–5</h2><p>We rate each theme's prominence and intensity separately from whether the movie affirms or condemns it.</p></div></div><div style="overflow:auto"><table class="rubric"><thead><tr><th>Score</th><th>Definition</th><th>Meaning</th></tr></thead><tbody>${[['0/5','Absent','Verified as not present in adequate evidence'],['1/5','Minimal','Brief or incidental'],['2/5','Limited','Noticeable but secondary'],['3/5','Significant','Repeated or influential'],['4/5','Strong','Prominent or especially impactful'],['5/5','Defining','Central or extraordinarily intense'],['N/V','Not verified','Cannot determine from available evidence']].map(x=>`<tr>${x.map(z=>`<td>${esc(z)}</td>`).join('')}</tr>`).join('')}</tbody></table></div><div class="method-grid top-gap"><div class="method-card"><h3>We weigh four dimensions</h3><p><strong>35%</strong> Overall moral message<br><strong>30%</strong> Portrayal of virtue and sin<br><strong>25%</strong> Severity and exposure<br><strong>10%</strong> Spiritual reflection potential</p><p>These percentages guide discussion rather than mechanically deciding a spiritual verdict. Severe content triggers closer human review.</p></div><div class="method-card"><h3>Age guidance is separate</h3><p>All Ages · 7+ · 10+ · 13+ · 16+ · 18+ · Not Recommended</p><p>A story can be edifying for a mature teenager while unsuitable for a younger child. Parents have the final decision.</p></div><div class="method-card"><h3>Explicitly Coptic Orthodox</h3><p>Scripture, the Church Fathers, and vetted Coptic Orthodox teaching inform our spiritual reflections. The AI must not fabricate quotations or present personal interpretations as official doctrine.</p></div><div class="method-card"><h3>Transparency by design</h3><p>AI drafts require evidence, sources, content checks, and human editorial approval before publication. Unverified categories are marked N/V, never assigned zero.</p></div></div></div></section>`;
}

function studio(){
  return `<section class="page-hero"><div class="container"><div class="eyebrow">Private editorial workflow</div><h1>Editorial studio</h1><p>Draft reviews from documented movie evidence. AI-generated reviews are never published automatically. A server-side admin password and OpenAI API key are required.</p></div></section><section class="section"><div class="container"><div class="studio-grid"><aside class="paper-panel"><h3>Admin access</h3><p class="muted" style="font-size:12px">Password is sent only to your server; OpenAI keys never appear in browser code.</p><div class="form-group"><label for="adminPass">Server admin password</label><input id="adminPass" type="password" autocomplete="off" placeholder="Enter admin password" value="${esc(adminPassword)}"></div><button class="btn ghost" id="loadAdmin">Load saved reviews</button><div id="savedArea" class="editor-saved"></div></aside><div class="paper-panel"><div class="eyebrow">Step 1 · Gather evidence</div><h2 style="font-size:25px;margin:10px 0 22px">Create a review draft</h2><div class="form-row"><div class="form-group"><label for="draftTitle">Movie title *</label><input id="draftTitle" placeholder="Movie title"></div><div class="form-group"><label for="draftYear">Release year *</label><input id="draftYear" inputmode="numeric" placeholder="2026"></div></div><div class="form-group"><label for="draftSources">Evidence source labels (one per line)</label><textarea id="draftSources" style="min-height:90px" placeholder="IMDb, Common Sense Media, Dove, BBFC, official synopsis, checked parental guide..."></textarea><div class="form-help">Include working source URLs in the review JSON before publication.</div></div><div class="form-group"><label for="draftEvidence">Verified plot, scenes, and content observations *</label><textarea id="draftEvidence" style="min-height:185px" placeholder="Paste reliable plot details, documented content observations, and what each source establishes. The AI must not infer unseen scenes."></textarea><div class="form-help">At least 120 characters of evidence. Use material you are authorized to use and avoid copying protected text extensively.</div></div><button class="btn" id="generateBtn">✦ &nbsp; Draft with AI</button><div id="studioStatus"></div><div id="draftArea"></div></div></div></div></section>`;
}

function status(text,type='info'){
  const x=document.getElementById('studioStatus');
  if(x) x.innerHTML=`<div class="status-box ${type}">${esc(text)}</div>`;
}

async function api(url,{method='GET',body,admin=false}={}){
  const r=await fetch(url,{method,headers:{...(body?{'Content-Type':'application/json'}:{}),...(admin?{'x-admin-password':adminPassword}:{})},body:body?JSON.stringify(body):undefined,cache:'no-store'});
  const d=await r.json().catch(()=>({error:'Server did not return JSON'}));
  if(!r.ok) throw Error(d.error||`Request failed (${r.status})`);
  return d;
}

async function refreshPublished(){
  try{
    const d=await api('/api/reviews');
    published=(d.reviews||[]).map((r,i)=>({...r,posterClass:coverClass(r,i),sourceLinks:r.sourceLinks||sourceSearchLinks(r)}));
  }catch(e){
    published=[];
    console.warn('Could not load published reviews',e.message);
  }
}

function draftPanel(){
  const target=document.getElementById('draftArea');
  if(!target||!currentDraft) return;
  target.innerHTML=`<div class="detail-section"><div class="eyebrow">Step 2 · Editor review</div><h3 style="margin:10px 0">Inspect & edit draft JSON</h3><p class="muted" style="font-size:12px">Check the actual film sources, content claims, theme evidence, age guidance, and theological reflections before approving.</p><textarea id="reviewJson" class="draft-editor" spellcheck="false">${esc(JSON.stringify(currentDraft,null,2))}</textarea><div class="draft-actions"><button class="btn ghost" id="saveDraft">Save as pending</button><button class="btn" id="publishDraft">Approve & publish</button></div><div class="form-help" style="margin-top:8px">Publishing requires a verdict, source URLs, age rationale, evidence-backed themes, contentVerification=editor_checked, theologicalApproval=approved, and theologicalApprovedBy set to the qualified reviewer. Never certify unchecked claims.</div></div>`;
  async function save(publish){
    try{
      const review=JSON.parse(document.getElementById('reviewJson').value);
      const out=await api('/api/admin/save',{method:'POST',admin:true,body:{review,status:publish?'published':'pending_review'}});
      currentDraft=out.review;
      status(publish?'Review approved and published.':'Draft saved as pending editorial review.','good');
      draftPanel();
      await refreshPublished();
      await loadAdmin();
    }catch(e){status(e.message,'bad');}
  }
  document.getElementById('saveDraft').onclick=()=>save(false);
  document.getElementById('publishDraft').onclick=()=>save(true);
}

async function loadAdmin(){
  const target=document.getElementById('savedArea');
  if(!target) return;
  try{
    const d=await api('/api/admin/reviews',{admin:true});
    adminReviews=d.reviews||[];
    target.innerHTML=`<div class="eyebrow">Saved reviews (${adminReviews.length})</div>${adminReviews.length?adminReviews.map(r=>`<div class="saved-item"><span><strong style="font-size:12px">${esc(r.title)}</strong><br><span class="tiny">${r.status==='published'?'Published':'Pending review'}</span></span><button class="small-btn" data-edit-id="${esc(r.id)}">Edit</button></div>`).join(''):'<p class="muted" style="font-size:12px">No server reviews yet.</p>'}`;
    target.querySelectorAll('[data-edit-id]').forEach(b=>b.onclick=()=>{currentDraft=adminReviews.find(r=>r.id===b.dataset.editId);draftPanel();document.getElementById('draftArea').scrollIntoView({behavior:'smooth'});});
    status('Editor access confirmed.','good');
  }catch(e){target.innerHTML='';status(e.message,'bad');}
}

function wireStudio(){
  document.getElementById('adminPass').addEventListener('input',e=>adminPassword=e.target.value);
  document.getElementById('loadAdmin').onclick=loadAdmin;
  document.getElementById('generateBtn').onclick=async()=>{
    const btn=document.getElementById('generateBtn');
    btn.disabled=true;
    status('Generating an evidence-constrained draft...');
    try{
      const input={title:document.getElementById('draftTitle').value,year:document.getElementById('draftYear').value,evidence:document.getElementById('draftEvidence').value,sourceLabels:document.getElementById('draftSources').value};
      const out=await api('/api/admin/generate',{method:'POST',admin:true,body:input});
      currentDraft=out.review;
      status('AI draft created. Verify every claim before approval.','good');
      draftPanel();
    }catch(e){status(e.message,'bad');}
    finally{btn.disabled=false;}
  };
}

function updateNav(){
  document.querySelectorAll('[data-nav]').forEach(a=>a.classList.toggle('active',location.hash.startsWith('#'+a.dataset.nav)));
}

function wire(){
  document.getElementById('heroSearch')?.addEventListener('submit',e=>{e.preventDefault();currentSearch=document.getElementById('heroInput').value;location.hash='#browse';if(location.hash==='#browse') render();});
  if(document.getElementById('filteredResults')){
    for(const [id,setter] of [['searchFilter',v=>currentSearch=v],['verdictFilter',v=>currentVerdict=v],['ageFilter',v=>currentAge=v],['genreFilter',v=>currentGenre=v]]){
      document.getElementById(id).addEventListener(id==='searchFilter'?'input':'change',e=>{setter(e.target.value);drawFiltered();});
    }
    drawFiltered();
  }
  if(location.hash.startsWith('#admin')) wireStudio();
}

function loadPosters(){
  if(location.protocol==='file:') return;
  const elems=Array.from(document.querySelectorAll('.poster[data-poster-title]:not(.poster-image)'));
  const observer=new IntersectionObserver(entries=>{
    for(const entry of entries){
      if(!entry.isIntersecting) continue;
      observer.unobserve(entry.target);
      const el=entry.target,title=el.dataset.posterTitle,year=el.dataset.posterYear;
      const key=title.toLowerCase()+'|'+year;
      if(!posterLookups.has(key))posterLookups.set(key,fetch('/api/poster?title='+encodeURIComponent(title)+'&year='+encodeURIComponent(year)).then(r=>r.ok?r.json():{}).catch(()=>({})));
      posterLookups.get(key).then(data=>{
        if(!data.posterUrl||!el.isConnected) return;
        const img=document.createElement('img');img.loading='lazy';img.alt=title+' movie poster';img.referrerPolicy='no-referrer';
        img.onerror=()=>{img.remove();el.classList.remove('poster-image')};
        img.src=data.posterUrl;el.classList.add('poster-image');el.prepend(img);
      });
    }
  },{rootMargin:'350px'});
  elems.forEach(el=>observer.observe(el));
}

function render(){
  const hash=decodeURIComponent(location.hash.slice(1)||'home');
  app.innerHTML=hash==='home'?home():hash==='browse'?browse():hash==='method'?method():hash==='admin'?studio():hash.startsWith('review/')?detail(hash.slice(7)):home();
  updateNav();
  wire();
  loadPosters();
  window.scrollTo(0,0);
}

document.getElementById('mobileNav').onclick=()=>{
  mobileOpen=!mobileOpen;
  let nav=document.getElementById('mobileMenu');
  if(!nav){
    nav=document.createElement('div');
    nav.id='mobileMenu';
    nav.className='mobile-menu';
    nav.innerHTML='<a href="#home">Home</a><a href="#browse">Browse movies</a><a href="#method">Our approach</a><a href="#admin">Editorial studio</a>';
    document.querySelector('.nav').append(nav);
  }
  nav.style.display=mobileOpen?'flex':'none';
};

window.addEventListener('hashchange',()=>{mobileOpen=false;document.getElementById('mobileMenu')?.remove();render();});
await refreshPublished();
render();
