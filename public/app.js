import {applyFamilyReviewRecommendation, supplementalReviews, supplementalContentEvidenceById} from './family-review-ratings.js';
import {LGBTQ_THEME_NAME,withLgbtqTheme,lgbtqImpact,starterLgbtqTheme,getLgbtqTheme,isLgbtqRelatedAdvisory} from './lgbtq-audit.js';

const provisionalReviews = [...seedReviews, ...supplementalReviews].map(applyFamilyReviewRecommendation).map(r=>withLgbtqTheme(r,{proposeVerdict:true}));
let published=[];
let adminReviews=[];
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
const reviewAliases=new Map([['catalog-2025-theminecraftmovie','film-minecraft-movie']]);
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
  const catalogIds = new Map([...provisionalReviews, ...movieCatalog].map(movie => [filmKey(movie), movie.id]));
  const pub=(published||[]).map((r,i)=>({...((getLgbtqTheme(r)||!Array.isArray(r.themes))?r:{...r,themes:[starterLgbtqTheme('unreviewed-published'),...r.themes]}),contentEvidenceId:catalogIds.get(filmKey(r)),posterClass:coverClass(r,i),sourceLinks:r.sourceLinks||sourceSearchLinks(r),reviewType:'published'}));
  const seeded=provisionalReviews
    .filter(r=>!pub.some(p=>p.title.toLowerCase()===r.title.toLowerCase()&&p.year===r.year))
    .map((r,i)=>({...r,posterClass:coverClass(r,i),sourceLinks:r.sourceLinks||sourceSearchLinks(r),reviewType:'seed'}));
  return [...pub,...seeded];
}

function filmKey(movie) {
  return `${movie.title.toLowerCase()}|${movie.year}`;
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
  const label=reviewed?(r.reviewType==='published'?'EDITORIALLY APPROVED':r.reviewType==='seed'?'SOURCE-BASED · PROVISIONAL':'PROVISIONAL · CHECK SOURCES'):'SPIRITUAL REVIEW PENDING';
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

function howToUse(){
  return `<section class="quickstart-section section" aria-labelledby="quickstart-title"><div class="container"><div class="section-header"><div><div class="eyebrow">New here? Start here</div><h2 id="quickstart-title">How to use The Orthodox Lens</h2><p>Find a film and learn how to read its review.</p></div></div>
  <div class="quickstart-grid"><article class="quickstart-step"><span>01</span><h3>Find your movie</h3><p>Search above or browse the library to open a movie review.</p><a href="#browse" class="text-link">Browse movies →</a></article>
  <article class="quickstart-step"><span>02</span><h3>Read the verdict and scores</h3><p>Edifying, Neutral, or Destructive describes the site's spiritual judgment. A 0–5 theme score describes how prominent that theme is—not a vote from visitors. “Not Verified” means research is still pending.</p><a href="#about/approach" class="text-link">How we evaluate films →</a></article>
  <article class="quickstart-step"><span>03</span><h3>Check the details and discuss</h3><p>Review age guidance, “Before you watch,” Bible connections, and family questions.</p></article></div></div></section>`;
}

function home(){
  const recent=featuredRecent();
  const reviewed=reviewedHighlights();
  return `<section class="hero"><div class="hero-inner"><div class="eyebrow">✣ &nbsp; Faithful discernment for the whole family</div><h1>Stories shape us.<br><em>Choose them wisely.</em></h1><p class="hero-lede">Explore movies through a Christian perspective informed by the historic Orthodox tradition, with thoughtful spiritual guidance, clear content warnings, and practical advice for Christian families.</p><div class="theme-verse"><span class="theme-verse-ref">PHILIPPIANS 4:8</span><span>Reflect on what is true, honorable, just, pure, lovely, and worthy of praise.</span><small>Scripture theme · paraphrase</small></div><form class="hero-search" id="heroSearch"><span class="search-ico">⌕</span><input id="heroInput" placeholder="Search movies, genres, and themes..." aria-label="Search movies" autocomplete="off"><button class="btn gold" type="submit">Explore movies →</button></form><div class="hero-note"><span class="dot"></span> Independent guidance for Christian families</div></div></section>
  ${howToUse()}
  ${summaryStrip()}
  <section class="section recent-section"><div class="container"><div class="section-header"><div><div class="eyebrow">Fresh recommendations</div><h2>Best recent movies</h2><p>A selection of recent releases to research and discuss. Inclusion is not an endorsement; reviews and age suggestions are provisional.</p></div><a href="#browse" class="text-link">Browse all movies →</a></div><div class="movie-grid recent-feature">${recent.map(card).join('')}</div><p class="recent-note">We display authentic published movie posters when available through our verified poster sources. If a poster is unavailable, a text cover is shown instead; no AI-generated substitute is used.</p></div></section>
  <section class="section"><div class="container"><div class="section-header"><div><div class="eyebrow">Actively reviewed</div><h2>The Orthodox Lens review library</h2><p>${reviewedCount()} provisional reviews with age guidance, Scripture references, family questions, and source links. Unapproved assessments remain labeled provisional.</p></div><a href="#about/approach" class="text-link">Read our framework →</a></div><div class="movie-grid">${reviewed.map(card).join('')}</div></div></section>
  <section class="steps-dark section"><div class="container"><div class="section-header"><div><div class="eyebrow">How the site grows</div><h2>From research queue to finished review</h2><p>Browse movie pages with source-linked content findings. Spiritual verdicts and age guidance are provisional or pending editorial review.</p></div></div><div class="steps"><article class="step"><div class="step-num">01</div><h3>Research the film</h3><p>Start with source pages like IMDb, Common Sense Media, Dove, BBFC, studio summaries, and trusted parental guides.</p></article><article class="step"><div class="step-num">02</div><h3>Draft the review</h3><p>Use the editorial studio to draft an evidence-constrained review, then inspect the verdict, age guidance, and theme ratings carefully.</p></article><article class="step"><div class="step-num">03</div><h3>Approve and publish</h3><p>Once the facts and Christian interpretation are solid, publish the full review and it appears automatically across the site.</p></article></div></div></section>`;
}

function browse(){
  const genres=[...new Set(allMovies().map(x=>(x.genre||'Film').split('·')[0].trim()))].sort();
  return `<section class="page-hero"><div class="container"><div class="eyebrow">Search the catalog</div><h1>Browse movies</h1><p>Filter movies by verdict, age guidance, genre, or title. Every title has a source-linked content guide and a provisional spiritual review. All verdicts await independent editorial approval.</p></div></section><section class="section"><div class="container"><div class="filters"><input id="searchFilter" class="field" placeholder="Search title or genre..." value="${esc(currentSearch)}"><select id="verdictFilter"><option value="all">All verdicts</option><option value="edifying" ${currentVerdict==='edifying'?'selected':''}>Edifying</option><option value="neutral" ${currentVerdict==='neutral'?'selected':''}>Neutral</option><option value="destructive" ${currentVerdict==='destructive'?'selected':''}>Destructive</option><option value="pending" ${currentVerdict==='pending'?'selected':''}>Review pending</option></select><select id="ageFilter"><option value="all">All ages</option>${officialAges.map(a=>`<option value="${esc(a)}" ${currentAge===a?'selected':''}>${esc(a)}</option>`).join('')}</select><select id="genreFilter"><option value="all">All genres</option>${genres.map(g=>`<option value="${esc(g)}" ${currentGenre===g?'selected':''}>${esc(g)}</option>`).join('')}</select></div><div id="filteredResults"></div></div></section>`;
}

function matchesFilters(r){
  const alternateTitle=r.id==='film-minecraft-movie'?'The Minecraft Movie':'';
  const hay=`${r.title} ${alternateTitle} ${r.genre||''} ${r.synopsis||''}`.toLowerCase();
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

const advisoryTypesByTheme = new Map([
  ['Family responsibility and father figures', 'familyPortrayal'],
  ['Family and responsibility', 'familyPortrayal'],
  ['Parental authority, obedience and trust', 'parentalAuthority'],
  ['Hidden identity and acceptance', 'interpretation'],
  ['Self-expression and belonging', 'interpretation'],
  ['Self-acceptance and belonging', 'interpretation'],
  ['Puberty, crushes and romantic humor', 'comingOfAge'],
  ['Same-sex marriage and affection', 'representation'],
  ['Same-sex relationship reference', 'representation'],
  ['Same-sex romance', 'representation'],
  ['Explicit advocacy for Christian discipleship', 'advocacy'],
  ['Explicit advocacy for habitat protection', 'advocacy']
]);

function renderLgbtqContextNotes(remainingAdvisories,sources){
  return ['representation','interpretation','advocacy'].map(type=>{
    const note=remainingAdvisories.get(type);
    if(!isLgbtqRelatedAdvisory(type,note))return '';
    remainingAdvisories.delete(type);
    const label=familyAdvisoryLabels[type];
    const qualifier=type==='interpretation'
      ? '<small>Attributed interpretation or creator background, not a verified on-screen LGBTQ depiction. This note does not set the 0–5 score.</small>'
      : '';
    return `<div class="rating-note"><strong>${esc(label)}</strong>${renderAdvisoryText(note,label,sources)}${qualifier}</div>`;
  }).join('');
}

function renderRatings(r,type,remainingAdvisories){
  const list=(r.themes||[]).filter(t=>t.type===type);
  if(!list.length) return `<p class="muted">No ${type==='positive'?'positive':'harmful'} theme ratings have been published yet.</p>`;
  return list.map(t=>{
    const score=(t.score===null||t.score===undefined)?'Not Verified':`${t.score}/5`;
    const fill=(typeof t.score==='number'&&t.score>=0)?(t.score/5)*100:0;
    const sources = (t.references || []).filter(source => /^https:\/\//i.test(source?.url));
    const refs = sources
      .map(source => `<a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.label)}</a>`)
      .join(' · ');
    const impact=t.name===LGBTQ_THEME_NAME?lgbtqImpact(t.score):null;
    const impactNote=t.name!==LGBTQ_THEME_NAME?null:(impact==='not_verified'?'Screening pending; no claim of absence':impact==='not_applicable'?'N/A for this category':impact==='neutral'?'Neutral under this criterion':'Destructive under site policy');
    const advisoryType = advisoryTypesByTheme.get(t.name);
    const candidate = remainingAdvisories.get(advisoryType);
    const groupUnderLgbtq = (r.themes||[]).some(theme=>theme.name===LGBTQ_THEME_NAME)
      && isLgbtqRelatedAdvisory(advisoryType,candidate);
    const advisory = groupUnderLgbtq ? null : candidate;
    const label = familyAdvisoryLabels[advisoryType];
    if (advisory) remainingAdvisories.delete(advisoryType);
    const lgbtqNotes=t.name===LGBTQ_THEME_NAME?renderLgbtqContextNotes(remainingAdvisories,sources):'';
    return `<div class="rating-row"><div><strong>${esc(t.name)}</strong><small>${esc(t.portrayal||'unverified')} · ${esc(t.evidence||'Evidence note pending')}${refs ? `<br>${refs}` : ''}</small></div><div class="rating-track"><div class="rating-fill ${esc(type)}" style="width:${fill}%"></div></div><div class="score">${esc(score)}</div>
      ${impactNote?`<div class="rating-note"><strong>Editorial category: ${esc(impactNote)}</strong><small>Prominence score and source note above; other content is assessed separately.</small></div>`:''}
      ${lgbtqNotes}
      ${advisory ? `<div class="rating-note"><strong>${esc(label)}</strong>${renderAdvisoryText(advisory, label, sources)}</div>` : ''}</div>`;
  }).join('');
}

function renderReviewRatings(review){
  const advisories = new Map(Object.entries(getFamilyAdvisories(review))
    .filter(([type, note]) => Object.hasOwn(familyAdvisoryLabels, type) && note?.details));
  const ratings = review.verdict ? `
    <p class="muted">Scores show prominence, not moral worth. For LGBTQ Themes &amp; Messaging, 0/5 = N/A, 1/5 = Neutral under this criterion, 2–5/5 = Destructive under this site's editorial policy; Not Verified means screening remains open. Portrayal describes how the film treats a theme.</p>
    <div class="rating-header">Virtues & positive themes</div>${renderRatings(review,'positive',advisories)}
    <div class="rating-header">Content & harmful themes</div>${renderRatings(review,'harmful',advisories)}
    ${(review.themes||[]).some(t=>t.type==='context')
      ? '<div class="rating-header">Family and cultural themes</div>'+renderRatings(review,'context',advisories) : ''}`
    : '<p class="muted">Theme ratings and age guidance are pending.</p>';
  const otherNotes = [...advisories].map(([type, note]) => {
    const label = familyAdvisoryLabels[type];
    return `<div class="evidence-category"><strong>${esc(label)}</strong>${renderAdvisoryText(note,label)}</div>`;
  }).join('');
  const evidence = renderContentEvidence(review);
  const warnings = review.reviewType === 'published' && Array.isArray(review.warnings)
    ? review.warnings.filter(warning => warning?.name).map(warning => `
      <div class="warning-item">
        <div class="warning-name"><span>${esc(warning.name)}</span><span>${esc(warning.severity)}</span></div>
        ${warning.details ? `<p>${esc(warning.details)}</p>` : ''}
      </div>`).join('')
    : '';
  return `<section class="paper-panel detail-section" aria-labelledby="theme-ratings-title">
    <h2 id="theme-ratings-title">Spiritual theme ratings (0–5)</h2>
    ${ratings}
    <section class="viewing-notes" aria-labelledby="viewing-notes-title">
      <h3 id="viewing-notes-title">Before you watch</h3>
      ${otherNotes}
      ${warnings ? `<div class="content-evidence"><h4>Editorial content notes</h4>${warnings}</div>` : ''}
      ${evidence}
      ${review.age ? '<p class="muted viewing-age-note">The suggested age reflects content maturity. Consider your child’s individual sensitivities.</p>' : ''}
      <div class="pastoral-guidance">For personal spiritual discernment, seek the guidance of your father of confession or parish priest.</div>
    </section>
  </section>`;
}

function researchLinksBlock(r){
  const links=r.sourceLinks||sourceSearchLinks(r);
  return `<div class="source-buttons">${links.map(s=>`<a class="small-btn" target="_blank" rel="noopener noreferrer" href="${esc(s.url)}">${esc(s.label)}</a>`).join('')}</div>`;
}

function pendingDetail(r){
  return `<div class="container review-back"><a class="back-link" href="#browse">← Back to movies</a><div class="review-layout"><div><div class="paper-panel"><div class="review-banner">${renderCover(r,{large:true})}<div><div class="eyebrow">independent Christian movie research page</div><h1>${esc(r.title)}</h1><div class="meta">${esc(r.year)} · ${esc(r.genre||'Film')}</div>${pill(null)}<div class="tag-row"><span class="tag">Full verdict pending</span></div><p>This movie’s spiritual verdict, theme scores, and age guidance are pending. See Before you watch in the theme ratings panel for available findings and sources.</p>${researchLinksBlock(r)}</div></div></div><div class="paper-panel detail-section"><div class="eyebrow">Editorial review</div><h2>What the full review considers</h2><div class="check-grid"><div class="check-item">Violence, peril, and disturbing imagery</div><div class="check-item">Language and blasphemy</div><div class="check-item">Sexual content and immodesty</div><div class="check-item">Occult, superstition, or spiritual confusion</div><div class="check-item">Family themes, sacrifice, forgiveness, repentance</div><div class="check-item">What the story ultimately asks viewers to admire</div></div><p class="muted">The ratings panel links to sources for checked findings. Unlisted concerns may still be present.</p></div>${renderReviewRatings(r)}<div class="paper-panel detail-section"><div class="eyebrow">After watching · discussion starter</div><h2>Five questions for families</h2><p class="muted">Use these prompts after watching together. <a href="#suggest/${encodeURIComponent(r.id)}">Suggest a Gospel parallel</a> for editorial review.</p>${(r.questions||[]).map((q,i)=>`<div class="q-item"><strong>${i+1}.</strong> ${esc(q)}</div>`).join('')}<div class="faith-panel"><div class="eyebrow">A starting Scripture</div><h3>Philippians 4:8</h3><p>Reflect together on what the story asks viewers to admire, and consider that message alongside this passage.</p></div></div></div><aside><div class="paper-panel"><div class="eyebrow">Quick links</div><h3 class="side-title">Research sources</h3>${researchLinksBlock(r)}<p class="muted" style="margin-top:12px">IMDb helps with basic film identity and credits. Common Sense Media and Dove can help with parental concerns and content direction. Use them as inputs, not as substitutes for your own independent Christian assessment.</p></div></aside></div></div>`;
}

function faithReferences(r){
  const verse=r.themeScripture;
  const fathers=r.patristic;
  const verseTitle = /^https:\/\//i.test(verse?.url || '')
    ? `<a href="${esc(verse.url)}" target="_blank" rel="noopener noreferrer">${esc(verse.reference)}</a>`
    : esc(verse?.reference);
  return `${verse?`<div class="faith-panel"><div class="eyebrow">Guiding Scripture</div><h3>${verseTitle}</h3><p>${esc(verse.connection||'Read this passage in its biblical context and discuss the relation to the film.')}</p><small>Reference and commentary, not a claim that the film teaches Scripture.</small></div>`:''}
  ${fathers?`<div class="faith-panel patristic"><div class="eyebrow">Wisdom from the Church Fathers</div><h3>${esc(fathers.author)}</h3><p>${esc(fathers.text)}</p><small>Paraphrase of <a href="${esc(fathers.url)}" rel="noopener noreferrer" target="_blank">${esc(fathers.work)}${fathers.section?' ('+esc(fathers.section)+')':''}</a> — not an exact quotation.</small></div>`:''}`;
}

function renderContentEvidence(r){
  const id = r.contentEvidenceId || r.id;
  const rec = supplementalContentEvidenceById[id] || contentEvidenceById[id];
  if(!rec)return '';
  const labels={sexual_content:'Sexual content',language:'Language & blasphemy',violence:'Violence & peril',spiritual_material:'Occult / spiritual material',substance_use:'Alcohol, drugs & smoking',moral_themes:'Moral themes'};
  const renderSources = (sources = []) => [...new Map(sources
    .filter(source => /^https:\/\//i.test(source?.url))
    .map(source => [source.url, source])).values()]
    .map(source => `<a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">Source: ${esc(source.provider)}</a>`)
    .join(' · ');
  const advisories = (rec.special_advisories || []).map(advisory =>
    `<div class="evidence-category"><strong>${esc(advisory.name)}</strong><small>Source-checked advisory</small><p>${esc(advisory.details)}</p>${renderSources(advisory.sources || [advisory.evidence])}</div>`).join('');
  const cells = Object.entries(labels).map(([key, label]) => {
    const cell = rec.content_categories[key];
    const notes = cell?.research_note ? `<p>${esc(cell.research_note)}</p>${renderSources(cell.sources_consulted)}` : '';
    if (!cell || cell.status === 'not_verified') {
      return `<div class="evidence-category"><strong>${esc(label)}</strong><small>Not verified</small>${notes}</div>`;
    }
    const labelText = cell.status === 'source_reports_not_present'
      ? 'Guide reports no flagged content in its scope' : 'Specific findings checked';
    const categorySources = renderSources(cell.evidence.filter(source => !source.supports));
    const findings = cell.findings.map(finding => {
      const sources = cell.evidence.filter(source => source.supports === finding);
      return `<li>${esc(finding)}${sources.length ? `<br>${renderSources(sources)}` : ''}</li>`;
    }).join('');
    return `<div class="evidence-category"><strong>${esc(label)}</strong><small>${labelText}</small><ul>${findings}</ul>${categorySources}${notes}</div>`;
  }).join('');
  return `<div class="content-evidence"><h4>Checked content findings</h4><p class="muted">Findings reflect the scenes, themes, and dialogue covered by the cited guides.</p>${advisories}${cells}</div>`;
}
function renderAdvisoryText(note,label,listedSources=[]){
  const source = /^https:\/\//i.test(note.url || '') && !listedSources.some(item=>item.url===note.url)
    ? `<a href="${esc(note.url)}" target="_blank" rel="noopener noreferrer" aria-label="Supporting source for ${esc(label)}">Supporting source</a>` : '';
  return `<p>${esc(note.details)}</p>${source}`;
}

function renderBiblicalParallels(r){
  const proposed=Array.isArray(r.biblicalParallels)?r.biblicalParallels.filter(p=>p?.title&&p?.reflection):[];
  const material=proposed.length?proposed:(r.themeScripture?.connection ? [{
    title:'A Scripture connection', filmMoment:'Reflect on the film’s choices and main message.',
    scriptureReference:r.themeScripture.reference,reflection:r.themeScripture.connection,
    scriptureUrl:r.themeScripture.url
  }] : []);
  const items=material.map(p=>`<article class="gospel-parallel"><h3>${esc(p.title)}</h3>
    ${p.filmMoment?`<p><strong>In the story:</strong> ${esc(p.filmMoment)}</p>`:''}
    <p><strong>Biblical connection:</strong> ${/^https:\/\//i.test(p.scriptureUrl||'')?`<a href="${esc(p.scriptureUrl)}" target="_blank" rel="noopener noreferrer">${esc(p.scriptureReference)}</a>`:esc(p.scriptureReference)}</p>
    <p>${esc(p.reflection)}</p>${/^https:\/\//i.test(p.sourceUrl||'')?`<small><a href="${esc(p.sourceUrl)}" target="_blank" rel="noopener noreferrer">Film-specific supporting source</a></small>`:''}
  </article>`).join('');
  return `<section class="paper-panel detail-section gospel-parallels" aria-labelledby="gospel-parallels-title"><h2 id="gospel-parallels-title">Biblical Parallels &amp; Gospel Reflections</h2><p class="muted">These are editorial comparisons for family discussion, not claims that the filmmakers intended to teach the Gospel. Read passages in context.</p>
    ${items||'<p class="muted">Film-specific connections are awaiting editorial research.</p>'}
  </section>`;
}
function renderCommunityIdeas(items){
  if(!items.length)return '';
  return `<section class="paper-panel detail-section" aria-labelledby="reader-ideas-title"><h2 id="reader-ideas-title">Reader Contributions</h2><p class="muted">Ideas shared by readers and approved by the editorial team.</p>`+
    items.map(s=>`<article class="reader-idea"><strong>${esc(({biblical_parallel:'Biblical parallel',gospel_reflection:'Gospel reflection',review_correction:'Review suggestion',general_feedback:'Family observation'})[s.kind]||'Reader suggestion')}</strong>${s.scripture_reference?`<small>Scripture: ${esc(s.scripture_reference)}</small>`:''}<p>${esc(s.details)}</p>${/^https:\/\//i.test(s.source_url||'')?`<a href="${esc(s.source_url)}" target="_blank" rel="noopener noreferrer">Supporting source</a>`:''}</article>`).join('')+'</section>';
}
async function loadCommunityIdeas(id){
  const place=document.querySelector('#communityIdeas[data-movie]');if(!place||place.dataset.movie!==id)return;
  try{
    const response=await fetch('/api/suggestions?action=approved&movie_id='+encodeURIComponent(id),{cache:'no-store'});
    if(!response.ok)return; // Migration may not be applied yet; main site remains usable.
    const data=await response.json();
    if(place.isConnected&&place.dataset.movie===id)place.innerHTML=renderCommunityIdeas(data.suggestions||[]);
  }catch{} // Optional feature must not break movie reviews.
}
function suggestionPage(preselectedId=''){
  const available=allMovies().filter(m=>m.title&&m.id).sort((a,b)=>a.title.localeCompare(b.title));
  return `<section class="page-hero"><div class="container"><h1>Reader Suggestions</h1><p>Share a film to review, a biblical parallel, a content correction, or a family discussion idea. Every submission goes to our private editorial queue first.</p></div></section>
  <section class="section"><div class="container suggestion-layout"><div class="paper-panel"><h2>Submit a suggestion</h2><p class="muted">You do not need an account. Please do not include private contact information. If approved, your suggestion may appear publicly without a name.</p>
   <form id="suggestionForm" class="suggestion-form">
    <label for="ideaKind">What are you suggesting?</label><select id="ideaKind" required><option value="biblical_parallel">A biblical parallel</option><option value="gospel_reflection">A Gospel reflection</option><option value="review_correction">A review correction or content warning</option><option value="film_request">A movie for us to review</option><option value="general_feedback">Other website feedback</option></select>
    <label for="ideaMovie">Movie already in our library (optional)</label><select id="ideaMovie"><option value="">Choose a movie, or enter a title below</option>${available.map(m=>`<option value="${esc(m.id)}" ${m.id===preselectedId?'selected':''}>${esc(m.title)} (${esc(m.year)})</option>`).join('')}</select>
    <label for="ideaTitle">Movie title (for a film not listed)</label><input id="ideaTitle" maxlength="160" placeholder="Movie title if not in our library">
    <label for="ideaScripture">Bible passage (for a biblical parallel or Gospel reflection)</label><input id="ideaScripture" maxlength="140" placeholder="e.g., Luke 15:11–32">
    <label for="ideaDetails">What did you notice, and why does it matter?</label><textarea id="ideaDetails" minlength="25" maxlength="1800" rows="7" required placeholder="Describe the scene, your suggested connection, or the correction. Please be specific."></textarea>
    <label for="ideaSource">Supporting source URL (optional, HTTPS)</label><input id="ideaSource" type="url" placeholder="https://…" maxlength="1000">
    <div class="form-trap" aria-hidden="true"><label for="ideaWebsite">Leave this blank</label><input id="ideaWebsite" tabindex="-1" autocomplete="off"></div>
    <button class="btn gold" type="submit">Send for review →</button><p id="suggestionStatus" class="suggestion-status" role="status" aria-live="polite"></p>
   </form></div><aside class="paper-panel"><div class="eyebrow">How suggestions work</div><h2>Reviewed before publication</h2><p><strong>1.</strong> You send your idea.</p><p><strong>2.</strong> The editorial team checks evidence, Scripture context, and the review's existing findings.</p><p><strong>3.</strong> Editors approve or decline it. Approved ideas may be shared with readers, separately labeled from the site's own assessments.</p><p class="muted">Submitting does not change a film's rating or verdict. Editorial sign-offs remain separate.</p></aside></div></section>`;
}

function reviewedDetail(r){
  return `<div class="container review-back"><a href="#browse" class="back-link">← Back to all movies</a><div class="review-layout"><div><div class="paper-panel"><div class="review-banner">${renderCover(r,{large:true})}<div><div class="eyebrow">independent Christian movie review</div><h1>${esc(r.title)}</h1><div class="meta">${esc(r.year)} · ${esc(r.genre||'Film')} · ${esc(r.runtime||'Runtime unverified')} · ${esc(r.officialRating||'Rating unverified')}</div>${pill(r.verdict)}<div class="tag-row"><span class="tag">Suggested age: ${esc(r.age||'Not verified')}</span><span class="tag">${r.theologicalApproval==='approved'?'Theologically reviewed':'Provisional · theology pending'}</span></div><p>${esc(r.synopsis||'Synopsis unavailable.')}</p>${researchLinksBlock(r)}</div></div></div><div class="paper-panel detail-section"><div class="eyebrow">The spiritual assessment</div><h2>Our independent Christian verdict</h2><p>${esc(r.verdictRationale||'Editorial review pending.')}</p><h3 style="margin:28px 0 8px">Why this age guidance?</h3><p>${esc(r.ageRationale||'Age guidance not verified.')}</p></div>${renderReviewRatings(r)}<div class="paper-panel detail-section"><div class="eyebrow">For thoughtful conversation</div><h2>Orthodox spiritual reflection</h2><p>${esc(r.reflection||'Reflection pending editorial review.')}</p>${r.scripture?.length?`<div class="tag-row">${r.scripture.map(s=>`<span class="tag">${esc(s)}</span>`).join('')}</div>`:''}${faithReferences(r)}<h3 style="margin:27px 0 12px">${r.verdict==='neutral'?'After watching: Discuss as a family':'Discuss as a family'}</h3>${r.verdict==='neutral'?'<p class="muted">A Neutral classification does not mean every message is spiritually beneficial. If you choose to watch, use these questions afterward to discuss the story through Christian spiritual discernment.</p>':''}${r.questions?.length?r.questions.map((q,i)=>`<div class="q-item"><strong>${i+1}.</strong> ${esc(q)}</div>`).join(''):'<p class="muted">Questions pending review.</p>'}</div>
    ${renderBiblicalParallels(r)}
    <div id="communityIdeas" data-movie="${esc(r.id)}" aria-live="polite"></div>
    </div><aside><div class="paper-panel"><div class="eyebrow">Editorial transparency</div><h3 class="side-title">Evidence & sources</h3>${r.sources?.length?`<ul class="source-list">${r.sources.map(s=>`<li>${s.url&&/^https?:\/\//.test(s.url)?`<a href="${esc(s.url)}" rel="noopener noreferrer" target="_blank">${esc(s.label||s.url)}</a>`:esc(s.label||'Unlinked source')}${s.notes?`<br><span class="muted">${esc(s.notes)}</span>`:''}</li>`).join('')}</ul>`:'<p class="muted">Source list unavailable.</p>'}<div class="disclaimer"><strong>Verification status:</strong> ${esc(r.contentVerification||'Limited external guidance')}; theological review: ${esc(r.theologicalApproval||'pending')}. Content warnings reflect reported findings and do not constitute an exhaustive absence check.<br><br>${r.reviewType==='published'?'This review has completed the editorial approval process.':'Provisional spiritual assessment. The verdict and age guidance are The Orthodox Lens’s editorial judgments.'}</div></div><div class="paper-panel detail-section"><h3 class="side-title">The meaning behind the verdict</h3><p class="muted">A film's depiction of wrongdoing is not the same as an endorsement of it. We evaluate the full moral message, the presentation of virtue and sin, the severity of content, and opportunities for spiritual growth.</p><a class="text-link" href="#about/approach">Read our methodology →</a></div></aside></div></div>`;
}

function detail(id){
  const canonicalId=reviewAliases.get(id)??id;
  const r=allMovies().find(x=>x.id===canonicalId || x.contentEvidenceId===canonicalId);
  if(!r) return `<div class="container section"><h1>Review not found</h1><p><a class="text-link" href="#browse">Browse movies →</a></p></div>`;
  return r.verdict ? reviewedDetail(r) : pendingDetail(r);
}

function about(){
  return `<section class="page-hero"><div class="container"><h1>About The Orthodox Lens</h1><p>Helping families choose entertainment with discernment, virtue, and thoughtful conversation.</p><a class="text-link" href="#about/approach">How we review films →</a></div></section>
  <section class="section"><div class="container"><div class="method-grid">
    <article class="method-card"><div class="eyebrow">Our mission</div><h2>Watch with discernment.</h2><p>The Orthodox Lens is an independent Christian movie-review resource for parents and families. Our goal is not to forbid entertainment, but to help viewers recognize virtue, evaluate difficult messages, and discuss what they watch.</p><p>We consider whether a film is edifying, neutral, or destructive to spiritual wellness, alongside separate age recommendations and documented content warnings.</p></article>
    <article class="method-card"><div class="eyebrow">Our foundations</div><h2>Faithful, not official.</h2><p>Our perspective is informed by Scripture and the historic Orthodox Christian tradition, including teachings of the Church Fathers where relevant. We welcome Christians from different traditions.</p><p><strong>We are not an official publication or representative of any Orthodox Church, bishop, synod, or religious institution.</strong> Our evaluations are independent editorial opinions.</p></article>
    <article class="method-card"><div class="eyebrow">For families</div><h2>Discuss, don't merely rate.</h2><p>Neutral movies in particular can open meaningful conversations about truthfulness, humility, courage, relationships, and the difference between portraying wrongdoing and endorsing it.</p><p>Our post-viewing questions are intended to support parents and children in thoughtful conversation, not to replace a family's judgment.</p></article>
    <article class="method-card"><div class="eyebrow">A pastoral reminder</div><h2>Spiritual guidance belongs in relationship.</h2><p>Reviews and age recommendations on this website are suggestions, not spiritual direction. For personal discernment, families should seek the guidance of their father of confession or parish priest.</p><p>AI assists research and drafting, while final approval requires human verification of film facts, citations, and the theological interpretation. A provisional review is labeled accordingly.</p></article>
  </div><div class="paper-panel" style="margin-top:24px"><div class="eyebrow">Our guiding Scripture</div><h2>Philippians 4:8</h2><p>We seek to give thoughtful attention to what is true, honorable, just, pure, lovely, and worthy of praise. This is the guiding principle behind our approach to entertainment.</p><p class="muted">Paraphrase of Philippians 4:8; consult your preferred Bible translation for the full verse.</p></div><div class="paper-panel" style="margin-top:24px"><div class="eyebrow">Artwork and sources</div><h2>Original movie posters</h2><p>Movie-cover images are loaded from TMDB when a film can be reliably matched. This product uses the TMDB API but is not endorsed or certified by TMDB. <a class="text-link" href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer">The Movie Database (TMDB)</a>.</p><p>Film-content references and our spiritual interpretations are separate. Content warnings must be verified with film-specific sources; Scripture and Church-Father citations are never presented as official Church judgments.</p><p class="muted">Verified patristic paraphrases link to the underlying text. We do not fabricate quotations. Check each movie page for the editorial status of its spiritual assessment.</p></div></div></section>${reviewApproach()}`;
}

function reviewApproach(){
  return `<section id="review-approach" class="section" aria-labelledby="review-approach-title"><div class="container"><h2 id="review-approach-title">How we review films</h2><div class="two-col"><div class="method-card"><div class="eyebrow">Balanced classification</div><h2>Three verdicts</h2><p><strong>Edifying</strong> films encourage Christian virtue and spiritual reflection. <strong>Neutral</strong> films may be mostly recreational or morally mixed. <strong>Destructive</strong> films substantially glorify sin, undermine virtue, or expose viewers to severe harmful content that outweighs any positive moral value.</p></div><div class="method-card"><div class="eyebrow">A consistent framework</div><h2>Theme ratings, 0–5</h2><p>Scores from 0 to 5 show each theme’s prominence. The portrayal describes whether the film affirms, criticizes, or simply shows it. We consider family and cultural themes alongside virtues and concerns when deciding the spiritual verdict.</p></div></div><div style="overflow:auto"><table class="rubric"><thead><tr><th>Score</th><th>Definition</th><th>Meaning</th></tr></thead><tbody>${[['0/5','Absent','Verified as not present in adequate evidence'],['1/5','Minimal','Brief or incidental'],['2/5','Limited','Noticeable but secondary'],['3/5','Significant','Repeated or influential'],['4/5','Strong','Prominent or especially impactful'],['5/5','Defining','Central or extraordinarily intense'],['N/V','Not verified','Cannot determine from available evidence']].map(x=>`<tr>${x.map(z=>`<td>${esc(z)}</td>`).join('')}</tr>`).join('')}</tbody></table></div><div class="method-grid top-gap"><div class="method-card"><h3>We weigh four dimensions</h3><p><strong>35%</strong> Overall moral message<br><strong>30%</strong> Portrayal of virtue and sin<br><strong>25%</strong> Severity and exposure<br><strong>10%</strong> Spiritual reflection potential</p><p>These percentages guide discussion rather than mechanically deciding a spiritual verdict. Severe content triggers closer human review.</p></div><div class="method-card"><h3>Age guidance is separate</h3><p>All Ages · 7+ · 10+ · 13+ · 16+ · 18+ · Not Recommended</p><p>A story can be edifying for a mature teenager while unsuitable for a younger child. Parents have the final decision.</p></div><div class="method-card"><h3>Informed by Orthodox Christianity</h3><p>Scripture, the Church Fathers, and vetted historic Orthodox Christian teaching inform our spiritual reflections. The AI must not fabricate quotations or present personal interpretations as official doctrine.</p></div><div class="method-card"><h3>Family content advisories</h3><p>The ratings and verdict can consider the film’s portrayal of relationships, parental authority, father figures, mature coming-of-age topics and advocacy. We attribute interpretations of subtext and creative inspiration to their sources. The theme ratings link to the scenes and evidence behind the assessment. Before you watch groups the additional content findings in the same panel.</p></div><div class="method-card"><h3>Transparency by design</h3><p>AI drafts require evidence, sources, content checks, and human editorial approval before publication. Unverified categories are marked N/V, never assigned zero.</p></div></div></div></section>`;
}

// Private approval backend lives at /studio/. The old client-side password editor was retired.
async function api(url){
 const r=await fetch(url,{cache:'no-store'});
 const data=await r.json().catch(()=>({error:'Invalid API response'}));
 if(!r.ok)throw Error(data.error||'Unable to fetch published reviews');
 return data;
}
async function refreshPublished(){
 try{
  const data=await api('/api/reviews');
  published=(data.reviews||[]).map((r,i)=>({...r,posterClass:coverClass(r,i),sourceLinks:r.sourceLinks||sourceSearchLinks(r)}));
 }catch(e){published=[];console.warn('Published reviews unavailable',e.message);}
}
let metricTimer;
function trackPublicEvent(evt){
 if(location.protocol==='file:'||!navigator.onLine)return;
 fetch('/api/events',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(evt),keepalive:true,credentials:'omit'}).catch(()=>{});
}
function updateNav(hash){
  document.querySelectorAll('[data-nav]').forEach(a=>a.classList.toggle('active',hash.split('/')[0]===a.dataset.nav));
}

async function sendSuggestion(event){
  event.preventDefault();
  const button=event.target.querySelector('button[type="submit"]');
  const status=document.getElementById('suggestionStatus');
  button.disabled=true;status.textContent='Submitting your suggestion…';status.className='suggestion-status';
  const payload={action:'submit',kind:document.getElementById('ideaKind').value,movie_id:document.getElementById('ideaMovie').value,
    movie_title:document.getElementById('ideaTitle').value.trim(),scripture_reference:document.getElementById('ideaScripture').value.trim(),
    details:document.getElementById('ideaDetails').value.trim(),source_url:document.getElementById('ideaSource').value.trim(),website:document.getElementById('ideaWebsite').value};
  try{
    const response=await fetch('/api/suggestions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),credentials:'omit'});
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw Error(data.error||'Unable to send the suggestion.');
    status.textContent='Thank you! Your idea was received and is awaiting editorial review. It has not been published.';
    status.classList.add('good');event.target.reset();
  }catch(error){status.textContent=error.message;status.classList.add('bad')}
  finally{button.disabled=false}
}
function wire(){
  document.getElementById('suggestionForm')?.addEventListener('submit',sendSuggestion);
  document.getElementById('heroSearch')?.addEventListener('submit',e=>{e.preventDefault();currentSearch=document.getElementById('heroInput').value;location.hash='#browse';if(location.hash==='#browse') render();});
  if(document.getElementById('filteredResults')){
    for(const [id,setter] of [['searchFilter',v=>currentSearch=v],['verdictFilter',v=>currentVerdict=v],['ageFilter',v=>currentAge=v],['genreFilter',v=>currentGenre=v]]){
      document.getElementById(id).addEventListener(id==='searchFilter'?'input':'change',e=>{setter(e.target.value);drawFiltered();});
    }
    drawFiltered();
  }
  // Public app has no editing capability. The dedicated Studio is in /studio/.
  const search=document.getElementById('searchFilter');
  if(search)search.addEventListener('input',()=>{
    clearTimeout(metricTimer);
    metricTimer=setTimeout(()=>{
      const q=search.value.trim();if(q.length>=2&&q.length<=60){
       const count=allMovies().filter(matchesFilters).length;
       trackPublicEvent({kind:'search',query_term:q,result_count:count});
      }
    },1300);
  });
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
  const route=decodeURIComponent(location.hash.slice(1)||'home');
  const hash=route==='method'?'about/approach':route;
  if(hash==='admin'){location.replace('/studio/');return;}
  app.innerHTML=hash==='home'?home():hash==='browse'?browse():(hash==='about'||hash==='about/approach')?about():hash==='suggest'?suggestionPage():hash.startsWith('suggest/')?suggestionPage(hash.slice(8)):hash.startsWith('review/')?detail(hash.slice(7)):home();
  if(hash.startsWith('review/')){
    const id=hash.slice(7);const movie=allMovies().find(x=>x.id===id||x.contentEvidenceId===id);
    if(movie){trackPublicEvent({kind:'movie_view',movie_id:movie.id,movie_title:movie.title});loadCommunityIdeas(movie.id)}
  }
  updateNav(hash);
  wire();
  loadPosters();
  if(hash==='about/approach') document.getElementById('review-approach').scrollIntoView();
  else window.scrollTo(0,0);
}

document.getElementById('mobileNav').onclick=()=>{
  mobileOpen=!mobileOpen;
  let nav=document.getElementById('mobileMenu');
  if(!nav){
    nav=document.createElement('div');
    nav.id='mobileMenu';
    nav.className='mobile-menu';
    nav.innerHTML='<a href="#home">Home</a><a href="#browse">Browse movies</a><a href="#about">About &amp; Our Approach</a><a href="#suggest">Reader Suggestions</a><a href="/studio/">Editorial studio</a>';
    document.querySelector('.nav').append(nav);
  }
  nav.style.display=mobileOpen?'flex':'none';
};

window.addEventListener('hashchange',()=>{mobileOpen=false;document.getElementById('mobileMenu')?.remove();render();});
await refreshPublished();
render();
