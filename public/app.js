import {movieSlug,moviePath,reviewStatus,warningCategories,warningFinding,inCollection,guidanceKey,faithPrompts,newsletter,shareLinks} from './discovery.js';
import {catalogFilmKey, marvelCatalog} from './marvel-catalog.js';
import {scriptureQuotes} from './scripture-quotes.js';
import {applyFamilyReviewRecommendation, supplementalReviews, supplementalContentEvidenceById} from './family-review-ratings.js';
import {LGBTQ_THEME_NAME,withLgbtqTheme,lgbtqImpact,starterLgbtqTheme,getLgbtqTheme,isLgbtqRelatedAdvisory} from './lgbtq-audit.js';

const provisionalReviews = [...seedReviews, ...supplementalReviews].map(applyFamilyReviewRecommendation).map(r=>withLgbtqTheme(r,{proposeVerdict:true}));
const catalogEntries=[...movieCatalog, ...marvelCatalog];
const marvelKeys=new Set(marvelCatalog.map(catalogFilmKey));
let published=[];
let adminReviews=[];
let currentDraft=null;
let currentSearch='';
let currentVerdict='all';
let currentAge='all';
let currentGenre='all';
let currentTheme='all',currentWarning='all',currentCollection='all';
let mobileOpen=false;

const browser=typeof document!=='undefined';
const app=browser?document.getElementById('content'):null;
if(browser)document.getElementById('year').textContent=new Date().getFullYear();

const esc=(x)=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const verdictLabel=(x)=>({edifying:'Edifying',neutral:'Neutral',destructive:'Destructive to Spiritual Wellness'})[x]||'Review Pending';
const icon=(v)=>({edifying:'✦',neutral:'◌',destructive:'⚑'})[v]||'○';
const pill=(v)=>`<span class="pill ${esc(v||'pending')}">${icon(v)} ${esc(verdictLabel(v))}</span>`;
const routeLink=moviePath;
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
  return catalogEntries.map((m,i)=>({
    ...m,
    genre:m.genre||'Film',
    posterClass:coverClass(m,i),
    status:m.status||'awaiting_research',
    sourceLinks:m.sourceLinks||sourceSearchLinks(m)
  }));
}

function reviewedItems(){
  const catalogIds = new Map([...provisionalReviews, ...catalogEntries].map(movie => [filmKey(movie), movie.id]));
  const pub=(published||[]).map((r,i)=>({...((getLgbtqTheme(r)||!Array.isArray(r.themes))?r:{...r,themes:[starterLgbtqTheme('unreviewed-published'),...r.themes]}),contentEvidenceId:catalogIds.get(filmKey(r)),posterClass:coverClass(r,i),sourceLinks:r.sourceLinks||sourceSearchLinks(r),reviewType:'published'}));
  const seeded=provisionalReviews
    .filter(r=>!pub.some(p=>filmKey(p)===filmKey(r)))
    .map((r,i)=>({...r,posterClass:coverClass(r,i),sourceLinks:r.sourceLinks||sourceSearchLinks(r),reviewType:'seed'}));
  return [...pub,...seeded];
}

function filmKey(movie) {
  return catalogFilmKey(movie);
}

function allMovies(){
  const reviewed=reviewedItems();
  const catalog=normalizedCatalog().filter(c=>!reviewed.some(r=>filmKey(r)===filmKey(c)));
  return [...reviewed,...catalog];
}

function pendingCount(){return normalizedCatalog().filter(c=>!reviewedItems().some(r=>filmKey(r)===filmKey(c))).length;}

function renderCover(r,{large=false}={}){
  const sizeClass=large?' large':'';
  const cls=coverClass(r);
  const genre=((r.genre||'Film').split('·')[0]||'Film').trim();
  const statusBadge=r.verdict?verdictLabel(r.verdict):'';
  const imageUrl=r.posterUrl||((typeof posterManifest!=='undefined')?posterManifest[`${r.title}|${r.year}`]:null);
  return `<div data-poster-title="${esc(r.title)}" data-poster-year="${esc(r.year)}" class="poster ${cls}${sizeClass}${imageUrl?' poster-image':''}">
    ${imageUrl?`<img loading="lazy" decoding="async" src="${esc(imageUrl)}" alt="${esc(r.title)} published movie poster" onerror="this.parentNode.classList.remove('poster-image');this.remove()">`: ''}
    <div class="poster-meta"><small>${esc(r.year||'')}</small><span>${esc(r.title)}</span><em>${esc(genre)}${statusBadge?' · '+esc(statusBadge):''}</em></div>
  </div>`;
}

function card(r){
  const reviewed=!!r.verdict;
  return `<a class="movie-card" href="${routeLink(r)}">
    ${renderCover(r)}
    <div class="movie-card-body">
      ${reviewed?'<div class="card-topline">'+pill(r.verdict)+(r.age?'<span class="age-chip">'+esc(r.age)+'</span>':'')+'</div>':''}
      <h3>${esc(r.title)}</h3>
      <p>${esc(r.year)} · ${esc(r.genre||'Film')}</p>
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
  <div class="quickstart-grid"><article class="quickstart-step"><span>01</span><h3>Find your movie</h3><p>Search above or browse the library to open a movie review.</p><a href="/#browse" class="text-link">Browse movies →</a></article>
  <article class="quickstart-step"><span>02</span><h3>Read the verdict and scores</h3><p>Edifying, Neutral, or Destructive describes the site's spiritual judgment. A 0–5 theme score describes how prominent that theme is—not a vote from visitors.</p><a href="/#about/approach" class="text-link">How we evaluate films →</a></article>
  <article class="quickstart-step"><span>03</span><h3>Check the details and discuss</h3><p>Review age guidance, “Before you watch,” Bible connections, and family questions.</p></article></div></div></section>`;
}

function home(){
  const recent=featuredRecent();
  const reviewed=reviewedHighlights();
  return `<section class="hero"><div class="hero-inner"><div class="eyebrow">✣ &nbsp; Faithful discernment for the whole family</div><h1>Stories shape us.<br><em>Choose them wisely.</em></h1><p class="hero-lede">The Orthodox Lens is an independent movie review site for families, written from a Coptic Orthodox Christian perspective. Each review helps parents explore a film’s content, reflect on Scripture, and start a conversation after watching.</p><div class="theme-verse"><span class="theme-verse-ref">PHILIPPIANS 4:8</span><span>${esc(scriptureQuotes["Philippians 4:8"])}</span><small>King James Version (KJV)</small></div><form class="hero-search" id="heroSearch"><span class="search-ico">⌕</span><input id="heroInput" placeholder="Search movies, genres, and themes..." aria-label="Search movies" autocomplete="off"><button class="btn gold" type="submit">Explore movies →</button></form><div class="hero-note"><span class="dot"></span> Independent guidance for Christian families</div></div></section>
  <section class="section featured-discovery"><div class="container"><div class="section-header"><div><div class="eyebrow">Start exploring</div><h2>Featured family reviews</h2><p>See suggested ages and editorial verdicts before choosing a film.</p></div><a href="/#browse" class="text-link">View all →</a></div><div class="movie-grid">${reviewedItems().filter(r=>r.verdict==='edifying').slice(0,4).map(card).join('')}</div></div></section>
  ${howToUse()}
  ${summaryStrip()}
  ${guidanceKey()}
  <section class="section"><div class="container"><h2>Find a film for the occasion</h2><div class="method-grid"><a class="method-card" href="/#browse/family"><h3>Family movie night →</h3><p>Edifying films with suggested ages 10+ or younger. Check each review first.</p></a></div></div></section>
  <section class="section recent-section"><div class="container"><div class="section-header"><div><div class="eyebrow">Fresh recommendations</div><h2>Best recent movies</h2><p>Explore recent releases and see what families can discuss together.</p></div><a href="/#browse" class="text-link">Browse all movies →</a></div><div class="movie-grid recent-feature">${recent.map(card).join('')}</div><p class="recent-note">We display authentic published movie posters when available through our verified poster sources. If a poster is unavailable, a text cover is shown instead; no AI-generated substitute is used.</p></div></section>
  <section class="section"><div class="container"><div class="section-header"><div><div class="eyebrow">Actively reviewed</div><h2>The Orthodox Lens review library</h2><p>${allMovies().length} films in the catalog. Explore reviews with age guidance, Scripture references, and family discussion questions.</p></div><a href="/#about/approach" class="text-link">Read our framework →</a></div><div class="movie-grid">${reviewed.map(card).join('')}</div></div></section>
  ${faithPrompts()}${newsletter()}
  <section class="section"><div class="container"><h2>All movie pages</h2><details><summary>Open the full alphabetical movie directory (${allMovies().length})</summary><ul class="film-directory">${[...allMovies()].sort((a,b)=>a.title.localeCompare(b.title)||a.year-b.year).map(m=>`<li><a href="${esc(moviePath(m))}">${esc(m.title)} (${esc(m.year)})</a></li>`).join('')}</ul></details></div></section>
  `;
}

function browse(){
  const genres=[...new Set(allMovies().map(x=>(x.genre||'Film').split('·')[0].trim()))].sort();
  const themes=[...new Set(allMovies().flatMap(r=>(r.themes||[]).filter(t=>t.type==='positive'&&t.score>0).map(t=>t.name)))].sort();
  return `<section class="page-hero"><div class="container"><div class="eyebrow">Search the catalog</div><h1>Browse movies</h1><p>Find a film by title, age guidance, verdict, genre, or collection.</p></div></section><section class="section"><div class="container"><div class="filters"><input id="searchFilter" aria-label="Search movie catalog" class="field" placeholder="Search title or genre..." value="${esc(currentSearch)}"><select id="verdictFilter" aria-label="Spiritual verdict"><option value="all">All verdicts</option><option value="edifying" ${currentVerdict==='edifying'?'selected':''}>Edifying</option><option value="neutral" ${currentVerdict==='neutral'?'selected':''}>Neutral</option><option value="destructive" ${currentVerdict==='destructive'?'selected':''}>Destructive</option><option value="pending" ${currentVerdict==='pending'?'selected':''}>No verdict</option></select><select id="ageFilter" aria-label="Suggested age"><option value="all">All ages</option>${officialAges.map(a=>`<option value="${esc(a)}" ${currentAge===a?'selected':''}>${esc(a)}</option>`).join('')}</select><select id="genreFilter" aria-label="Genre"><option value="all">All genres</option>${genres.map(g=>`<option value="${esc(g)}" ${currentGenre===g?'selected':''}>${esc(g)}</option>`).join('')}</select><select id="themeFilter" aria-label="Positive theme"><option value="all">All positive themes</option>${themes.map(t=>`<option ${currentTheme===t?'selected':''} value="${esc(t)}">${esc(t)}</option>`).join('')}</select><select id="warningFilter" aria-label="Documented content advisory"><option value="all">All content advisories</option>${Object.entries(warningCategories).map(([k,v])=>`<option ${currentWarning===k?'selected':''} value="${esc(k)}">Contains: ${esc(v)}</option>`).join('')}</select><select id="collectionFilter" aria-label="Collection"><option value="all">All collections</option><option value="family" ${currentCollection==='family'?'selected':''}>Family movie night</option></select></div><p class="muted">Advisory filters show documented findings, not proof of absence. Collections include provisional assessments.</p><div id="filteredResults" aria-live="polite"></div></div></section>`;
}

function matchesFilters(r){
  const alternateTitle=r.id==='film-minecraft-movie'?'The Minecraft Movie':'';
  const hay=`${r.title} ${alternateTitle} ${r.genre||''} ${r.synopsis||''} ${(r.themes||[]).map(t=>t.name).join(' ')} ${marvelKeys.has(filmKey(r))?'Marvel':''}`.toLowerCase();
  const genre=((r.genre||'Film').split('·')[0]||'Film').trim();
  const isMarvel=marvelKeys.has(filmKey(r));
  if(!inCollection(r,currentCollection))return false;
  if(currentTheme!=='all'&&!(r.themes||[]).some(t=>t.name===currentTheme&&t.type==='positive'&&t.score>0))return false;
  if(currentWarning!=='all'&&!warningFinding(r,currentWarning,supplementalContentEvidenceById[r.contentEvidenceId||r.id]||contentEvidenceById[r.contentEvidenceId||r.id]))return false;
  if(currentSearch && !hay.includes(currentSearch.toLowerCase())) return false;
  if(currentVerdict==='pending' && r.verdict) return false;
  if(currentVerdict!=='all' && currentVerdict!=='pending' && r.verdict!==currentVerdict) return false;
  if(currentAge!=='all' && (r.age||'')!==currentAge) return false;
  if(currentGenre==='Marvel' ? !isMarvel : currentGenre!=='all' && genre!==currentGenre) return false;
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

function isVisibleRating(theme){
  return Number.isFinite(theme.score) && (theme.name !== LGBTQ_THEME_NAME || theme.score > 0);
}

function renderRatings(r,type,remainingAdvisories){
  const list=(r.themes||[]).filter(t=>t.type===type&&isVisibleRating(t));
  if(!list.length) return '';
  return list.map(t=>{
    const score=`${t.score}/5`;
    const fill=(typeof t.score==='number'&&t.score>=0)?(t.score/5)*100:0;
    const sources = (t.references || []).filter(source => /^https:\/\//i.test(source?.url));
    const refs = sources
      .map(source => `<a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.label)}</a>`)
      .join(' · ');
    const impact=t.name===LGBTQ_THEME_NAME?lgbtqImpact(t.score):null;
    const impactNote=t.name!==LGBTQ_THEME_NAME?null:(impact==='not_applicable'?'N/A for this category':impact==='neutral'?'Neutral under this criterion':'Destructive under site policy');
    const advisoryType = advisoryTypesByTheme.get(t.name);
    const candidate = remainingAdvisories.get(advisoryType);
    const groupUnderLgbtq = (r.themes||[]).some(theme=>theme.name===LGBTQ_THEME_NAME&&isVisibleRating(theme))
      && isLgbtqRelatedAdvisory(advisoryType,candidate);
    const advisory = groupUnderLgbtq ? null : candidate;
    const label = familyAdvisoryLabels[advisoryType];
    if (advisory) remainingAdvisories.delete(advisoryType);
    const lgbtqNotes=t.name===LGBTQ_THEME_NAME?renderLgbtqContextNotes(remainingAdvisories,sources):'';
    return `<div class="rating-row"><div><strong>${esc(t.name)}</strong><small>${esc(t.portrayal||'unverified')} · ${esc(t.evidence||'')}${refs ? `<br>${refs}` : ''}</small></div><div class="rating-track"><div class="rating-fill ${esc(type)}" style="width:${fill}%"></div></div><div class="score">${esc(score)}</div>
      ${impactNote?`<div class="rating-note"><strong>Editorial category: ${esc(impactNote)}</strong><small>Prominence score and source note above; other content is assessed separately.</small></div>`:''}
      ${lgbtqNotes}
      ${advisory ? `<div class="rating-note"><strong>${esc(label)}</strong>${renderAdvisoryText(advisory, label, sources)}</div>` : ''}</div>`;
  }).join('');
}

function reviewGuidance(review){
  const advisories = new Map(Object.entries(getFamilyAdvisories(review))
    .filter(([type, note]) => Object.hasOwn(familyAdvisoryLabels, type) && note?.details));
  const ratingCount=(review.themes||[]).filter(isVisibleRating).length;
  const ratings = ratingCount ? `
    <p class="muted">Scores show prominence, not moral worth. Portrayal describes how the film treats a theme.</p>
    ${[['positive','Virtues & positive themes'],['harmful','Content & harmful themes'],['context','Family and cultural themes']]
      .map(([type,label])=>{
        const rows=renderRatings(review,type,advisories);
        return rows?`<div class="rating-header">${label}</div>${rows}`:'';
      }).join('')}` : '';
  const otherNotes = [...advisories].map(([type, note]) => {
    const label = familyAdvisoryLabels[type];
    return `<div class="evidence-category"><strong>${esc(label)}</strong>${renderAdvisoryText(note,label)}</div>`;
  }).join('');
  const {details:evidence, highlights}=renderContentEvidence(review);
  const warnings = review.reviewType === 'published' && Array.isArray(review.warnings)
    ? review.warnings.filter(warning => warning?.name).map(warning => `
      <div class="warning-item">
        <div class="warning-name"><span>${esc(warning.name)}</span><span>${esc(warning.severity)}</span></div>
        ${warning.details ? `<p>${esc(warning.details)}</p>` : ''}
      </div>`).join('')
    : '';
  const warningHighlights=(review.reviewType==='published'?review.warnings||[]:[])
    .filter(warning=>warning?.name).slice(0,3).map(warning=>({
      label:warning.name, finding:warning.details||warning.severity
    }));
  const highlightsToShow=warningHighlights.length?warningHighlights:highlights;
  const before=(otherNotes||warnings||evidence||review.age)?`<section id="before-watch" class="paper-panel detail-section review-target" tabindex="-1">
    <h2>Before you watch</h2>
    ${highlightsToShow.length?`<ul class="review-highlights">${highlightsToShow.map(({label,finding})=>
      `<li><strong>${esc(label)}</strong>${finding?' · '+esc(finding):''}</li>`).join('')}</ul>`:''}
    ${otherNotes||warnings||evidence?`<details class="review-details"><summary>Content details and sources</summary>
      ${otherNotes}${warnings ? `<div class="content-evidence"><h3>Editorial content notes</h3>${warnings}</div>` : ''}${evidence}
    </details>`:''}
    ${review.age?'<p class="muted viewing-age-note">Consider your child’s individual sensitivities alongside the suggested age.</p>':''}
    <div class="pastoral-guidance">For personal spiritual discernment, seek the guidance of your father of confession or parish priest.</div>
  </section>`:'';
  const themes=ratings?`<section id="theme-ratings" class="paper-panel detail-section review-target" tabindex="-1">
    <details class="review-details theme-breakdown"><summary>All spiritual theme ratings (${ratingCount})<span class="theme-chevron" aria-hidden="true"></span></summary>${ratings}</details>
  </section>`:'';
  return {before,themes};
}

function researchLinksBlock(r){
  const links=r.sourceLinks||sourceSearchLinks(r);
  return `<div class="source-buttons">${links.map(s=>`<a class="small-btn" target="_blank" rel="noopener noreferrer" href="${esc(s.url)}">${esc(s.label)}</a>`).join('')}</div>`;
}

function reviewBanner(r){
  const metadata=[r.year,r.genre||'Film',r.runtime,r.officialRating].filter(value=>value&&!/unverified/i.test(String(value)));
  return `<div class="paper-panel"><div class="review-banner">${renderCover(r,{large:true})}<div>
    <h1>${esc(r.title)}</h1><p class="meta">${metadata.map(esc).join(' · ')}</p>
    ${r.verdict?pill(r.verdict):''}<p class="review-status">${esc(reviewStatus(r))}</p>${shareLinks(r)}
    ${r.age?`<div class="tag-row"><span class="tag">Suggested age: ${esc(r.age)}</span></div>`:''}
    ${r.synopsis?`<p>${esc(r.synopsis)}</p>`:''}
  </div></div>${r.verdict ? themeRatingPreview(r) : ''}</div>`;
}

function pendingDetail(r){
  return `<div class="container review-back"><a class="back-link" href="/#browse">← Back to movies</a>
    <div class="review-layout"><div>${reviewBanner(r)}${reviewGuidance(r).before}</div>
    <aside>${reviewSources(r)}</aside></div>
  </div>`;
}

const patristicQuotes = {
  "www.tertullian.org/fathers/basil_litterature01.htm": "So we, if wise, shall take from heathen books whatever befits us and is allied to the truth, and shall pass over the rest.",
  "www.newadvent.org/fathers/200179.htm": "For the covering of a roof, for a garment, for bread, for cold water, for visiting, for going into the prison.",
  "www.newadvent.org/fathers/230121.htm": "as many do by disinheriting them, and disowning them, and treating them overbearingly, not as free, but as slaves.",
  "www.newadvent.org/fathers/200149.htm": "He was teaching them humility, and temperance, and charity, and to be of like mind one towards another, and to account all things common.",
  "www.newadvent.org/fathers/230111.htm": "Each one edifies, each one perfects, each one ministers.",
  "ccel.org/ccel/athanasius/incarnation/incarnation.iv.html": "His bodily acts still declare Him to be not man only, but the Power and Word of God."
};

function scriptureUrl(reference){
  return 'https://www.biblegateway.com/passage/?search='+encodeURIComponent(reference)+'&version=KJV';
}

function scriptureQuotation(reference){
  const text=scriptureQuotes[reference?.replaceAll('–','-')];
  if(!text)return '';
  const quote=`<blockquote><p>${esc(text)}</p><cite>King James Version (KJV)</cite></blockquote>`;
  return text.length>700?`<details><summary>Read ${esc(reference)}</summary>${quote}</details>`:quote;
}

function faithReferences(r){
  const verse=r.themeScripture;
  const fathers=r.patristic;
  const patristicKey=fathers?.url?.replace(/^https:\/\//i,'');
  const patristicQuote=patristicQuotes[patristicKey];
  const patristicUrl=patristicKey==='ccel.org/ccel/athanasius/incarnation/incarnation.iv.html'
    ?'https://ccel.org/ccel/athanasius/incarnation/formats/On_the_Incarnation.pdf':fathers?.url;
  return `${verse?`<div class="faith-panel"><div class="eyebrow">Guiding Scripture</div><h3><a href="${esc(scriptureUrl(verse.reference))}" target="_blank" rel="noopener noreferrer">${esc(verse.reference)}</a></h3>${scriptureQuotation(verse.reference)}<p>${esc(verse.connection||'Read this passage in context and consider how it relates to the film.')}</p></div>`:''}
  ${patristicQuote?`<div class="faith-panel patristic"><div class="eyebrow">Wisdom from the Church Fathers</div><h3>${esc(fathers.author)}</h3><blockquote><p>${esc(patristicQuote)}</p><cite><a href="${esc(patristicUrl)}" rel="noopener noreferrer" target="_blank">${esc(fathers.work)}${fathers.section?' ('+esc(fathers.section)+')':''}</a></cite></blockquote></div>`:''}`;
}

function renderContentEvidence(r){
  const id = r.contentEvidenceId || r.id;
  const rec = supplementalContentEvidenceById[id] || contentEvidenceById[id];
  if(!rec)return {details:'',highlights:[]};
  const labels={sexual_content:'Sexual content',language:'Language & blasphemy',violence:'Violence & peril',spiritual_material:'Occult / spiritual material',substance_use:'Alcohol, drugs & smoking',moral_themes:'Moral themes'};
  const renderSources = (sources = []) => [...new Map(sources
    .filter(source => /^https:\/\//i.test(source?.url))
    .map(source => [source.url, source])).values()]
    .map(source => `<a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">Source: ${esc(source.provider)}</a>`)
    .join(' · ');
  const advisories = (rec.special_advisories || []).map(advisory =>
    `<div class="evidence-category"><strong>${esc(advisory.name)}</strong><small>Source-checked advisory</small><p>${esc(advisory.details)}</p>${renderSources(advisory.sources || [advisory.evidence])}</div>`).join('');
  const highlights=[];
  const cells = Object.entries(labels).map(([key, label]) => {
    const cell = rec.content_categories[key];
    if(!cell || cell.status==='not_verified')return '';
    if(cell.status!=='source_reports_not_present'&&cell.findings?.[0])highlights.push({label,finding:cell.findings[0]});
    const labelText = cell.status === 'source_reports_not_present'
      ? 'Guide reports no flagged content in its scope' : 'Specific findings checked';
    const categorySources = renderSources(cell.evidence.filter(source => !source.supports));
    const findings = cell.findings.map(finding => {
      const sources = cell.evidence.filter(source => source.supports === finding);
      return `<li>${esc(finding)}${sources.length ? `<br>${renderSources(sources)}` : ''}</li>`;
    }).join('');
    return `<div class="evidence-category"><strong>${esc(label)}</strong><small>${labelText}</small><ul>${findings}</ul>${categorySources}</div>`;
  }).join('');
  const details=advisories||cells?`<div class="content-evidence"><h3>Content findings</h3><p class="muted">Findings reflect the scenes and dialogue covered by the cited guides.</p>${advisories}${cells}</div>`:'';
  return {details,highlights:highlights.slice(0,3)};
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
    <p><strong>Biblical connection:</strong> <a href="${esc(scriptureUrl(p.scriptureReference))}" target="_blank" rel="noopener noreferrer">${esc(p.scriptureReference)}</a></p>
    ${scriptureQuotation(p.scriptureReference)}<p>${esc(p.reflection)}</p>${/^https:\/\//i.test(p.sourceUrl||'')?`<small><a href="${esc(p.sourceUrl)}" target="_blank" rel="noopener noreferrer">Film-specific supporting source</a></small>`:''}
  </article>`).join('');
  if(!items)return '';
  return `<section id="gospel-parallels" class="paper-panel detail-section gospel-parallels review-target" tabindex="-1" aria-labelledby="gospel-parallels-title"><h2 id="gospel-parallels-title">Biblical Parallels &amp; Gospel Reflections</h2><p class="muted">These are editorial comparisons for family discussion, not claims that the filmmakers intended to teach the Gospel. Read passages in context.</p>
    ${items}
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
  <section class="section"><div class="container suggestion-layout"><div class="paper-panel"><h2>Submit a suggestion</h2><p>To request a review, choose “A movie for us to review” and enter the film title. Everything else is optional.</p><p class="muted">You do not need an account. Please do not include private contact information. If approved, your suggestion may appear publicly without a name.</p>
   <form id="suggestionForm" class="suggestion-form">
    <label for="ideaKind">What are you suggesting?</label><select id="ideaKind" required><option value="film_request">A movie for us to review</option><option value="biblical_parallel">A biblical parallel</option><option value="gospel_reflection">A Gospel reflection</option><option value="review_correction">A review correction or content warning</option><option value="general_feedback">Other website feedback</option></select>
    <label for="ideaMovie">Movie already in our library (optional)</label><select id="ideaMovie"><option value="">Choose a movie, or enter a title below</option>${available.map(m=>`<option value="${esc(m.id)}" ${m.id===preselectedId?'selected':''}>${esc(m.title)} (${esc(m.year)})</option>`).join('')}</select>
    <label for="ideaTitle">Movie title (for a film not listed)</label><input id="ideaTitle" maxlength="160" placeholder="Movie title if not in our library">
    <label for="ideaScripture">Bible passage (for a biblical parallel or Gospel reflection)</label><input id="ideaScripture" maxlength="140" placeholder="e.g., Luke 15:11–32">
    <label for="ideaDetails">Details <span id="ideaDetailsOptional">(optional for film requests)</span></label><textarea id="ideaDetails" maxlength="1800" rows="7" placeholder="Describe the scene, your suggested connection, or the correction. Please be specific."></textarea>
    <label for="ideaSource">Supporting source URL (optional, HTTPS)</label><input id="ideaSource" type="url" placeholder="https://…" maxlength="1000">
    <div class="form-trap" aria-hidden="true"><label for="ideaWebsite">Leave this blank</label><input id="ideaWebsite" tabindex="-1" autocomplete="off"></div>
    <button class="btn gold" type="submit">Send for review →</button><p id="suggestionStatus" class="suggestion-status" role="status" aria-live="polite"></p>
   </form></div><aside class="paper-panel"><div class="eyebrow">How suggestions work</div><h2>Reviewed before publication</h2><p><strong>1.</strong> You send your idea.</p><p><strong>2.</strong> The editorial team checks evidence, Scripture context, and the review's existing findings.</p><p><strong>3.</strong> Editors approve or decline it. Approved ideas may be shared with readers, separately labeled from the site's own assessments.</p><p class="muted">Submitting does not change a film's rating or verdict. Editorial sign-offs remain separate.</p></aside></div></section>`;
}

function reviewSources(r){
  const links=(r.sources||[]).filter(source=>/^https:\/\//i.test(source?.url||''));
  return `<section id="review-sources" class="paper-panel detail-section review-target" tabindex="-1">
    <h2>Sources</h2>
    ${links.length?`<ul class="source-list">${links.map(source=>
      `<li><a href="${esc(source.url)}" rel="noopener noreferrer" target="_blank">${esc(source.label||source.url)}</a></li>`).join('')}</ul>`:''}
    ${researchLinksBlock(r)}
  </section>`;
}

function publicReviewText(value){
  return String(value||'')
    .replace(/^Provisional(?: Coptic Orthodox interpretation)?:\s*/i,'')
    .replace(/^Conservative provisional site suggestion/i,'Conservative age suggestion')
    .replace(/\s*This classification is based on the documented premise and major themes, not a full scene-by-scene verification; further content research could change it\./g,
      ' The assessment draws on the documented premise and major themes.')
    .replace(/\s*Complete content verification may require a different age recommendation\./g,'')
    .trimStart()
    .replace(/^[a-z]/, letter => letter.toUpperCase());
}

function themeRatingPreview(review){
  const themes = (review.themes || []).filter(isVisibleRating);
  const leaders = ['positive', 'harmful', 'context'].map(type =>
    themes.filter(theme => theme.type === type && theme.score > 0).sort((a, b) => b.score - a.score)[0]
  ).filter(Boolean);
  const ordered = [...new Set([...leaders, ...themes])];
  if (!ordered.length) return '';
  const arrow = (direction, label) => `<button type="button" class="theme-arrow" data-step="${direction}"
    aria-label="${label}" aria-controls="theme-track" hidden><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="${direction < 0 ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'}"/></svg></button>`;
  return `<section class="theme-preview" aria-labelledby="theme-preview-heading">
    <header class="theme-preview-header">
      <h2 id="theme-preview-heading">Spiritual theme ratings</h2>
      <button type="button" data-review-jump="theme-ratings" aria-label="View all spiritual theme ratings">View all <span aria-hidden="true">↓</span></button>
    </header>
    <div class="theme-slider">
      ${arrow(-1, 'Previous theme ratings')}
      <ul id="theme-track" class="theme-preview-list" aria-label="Spiritual theme scores">${ordered.map(theme =>
        `<li><div><strong>${esc(theme.name)}</strong>${theme.portrayal ? `<small>${esc(theme.portrayal)}</small>` : ''}</div>
          <b class="theme-preview-score">${esc(theme.score)}<small>/5</small></b></li>`
      ).join('')}</ul>
      ${arrow(1, 'Next theme ratings')}
    </div>
    <small class="theme-position" aria-live="polite" aria-atomic="true"></small>
  </section>`;
}

function wireThemeSlider(track){
  const panel = track.closest('.theme-preview');
  const items = Array.from(track.children);
  const arrows = panel.querySelectorAll('.theme-arrow');
  const position = panel.querySelector('.theme-position');
  function layout(){
    const perPage = getComputedStyle(track).getPropertyValue('--themes-per-page').trim() === '1' ? 1 : 2;
    const last = Math.max(0, items.length - perPage);
    const stride = items.length > 1 ? items[1].offsetLeft - items[0].offsetLeft : 1;
    const first = Math.min(last, Math.max(0, Math.round(track.scrollLeft / (stride || 1))));
    return {first, last, perPage, stride};
  }
  function update(){
    const {first, last, perPage} = layout();
    for (const arrow of arrows){
      arrow.hidden = last === 0;
      arrow.setAttribute('aria-disabled', String(Number(arrow.dataset.step) < 0 ? first === 0 : first === last));
    }
    track.tabIndex = last ? 0 : -1;
    const range = perPage === 1 ? String(first + 1) : `${first + 1}–${first + perPage}`;
    const label = last ? `${range} of ${items.length}` : '';
    if (position.textContent !== label) position.textContent = label;
  }
  function move(step){
    const {first, last, perPage, stride} = layout();
    const next = Math.max(0, Math.min(last, first + step * perPage));
    track.scrollTo({left: next * stride, behavior: 'instant'});
    update();
  }
  for (const arrow of arrows) arrow.addEventListener('click', () => move(Number(arrow.dataset.step)));
  track.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    move(event.key === 'ArrowLeft' ? -1 : 1);
  });
  track.addEventListener('scroll', update, {passive: true});
  if('ResizeObserver' in window)new ResizeObserver(update).observe(track);
  update();
}

function reviewedDetail(r){
  const {before,themes}=reviewGuidance(r);
  const parallels=renderBiblicalParallels(r);
  const reflection=r.reflection||r.themeScripture||r.patristic?`<section id="spiritual-reflection" class="paper-panel detail-section review-target" tabindex="-1">
    <h2>Orthodox spiritual reflection</h2>
    ${r.reflection?`<p>${esc(publicReviewText(r.reflection))}</p>`:''}
    ${faithReferences(r)}
  </section>`:'';
  const discussion=r.questions?.length?`<section id="family-discussion" class="paper-panel detail-section review-target" tabindex="-1">
    <h2>After watching: Discuss as a family</h2>
    <ol class="review-questions">${r.questions.map(question=>`<li>${esc(question)}</li>`).join('')}</ol>
  </section>`:'';
  const destinations=[
    [before,'before-watch','Before you watch'],[reflection,'spiritual-reflection','Spiritual reflection'],
    [parallels,'gospel-parallels','Biblical parallels'],[discussion,'family-discussion','Family discussion'],
    [themes,'theme-ratings','Theme ratings'],[true,'review-sources','Sources']
  ];
  return `<div class="container review-back">
    <a href="/#browse" class="back-link">← Back to all movies</a>
    <div class="review-layout review-page"><div>
      ${reviewBanner(r)}
      <nav class="review-jump" aria-label="Jump to a review section">
        <span>Jump to</span>
        ${destinations.filter(([exists])=>exists).map(([,id,label])=>
          `<button type="button" class="small-btn" data-review-jump="${id}">${label}</button>`).join('')}
      </nav>
      <section class="paper-panel detail-section">
        <h2>Our independent Christian verdict</h2>
        ${r.verdictRationale?`<p>${esc(publicReviewText(r.verdictRationale))}</p>`:''}
        ${r.ageRationale?`<h3>Why this age guidance?</h3><p>${esc(publicReviewText(r.ageRationale))}</p>`:''}
      </section>
      ${reflection}${parallels}${discussion}${themes}
      <div id="communityIdeas" data-movie="${esc(r.id)}" aria-live="polite"></div>
    </div><aside class="review-sidebar">${before}${reviewSources(r)}</aside></div>
  </div>`;
}

function detail(id){
  const canonicalId=reviewAliases.get(id)??id;
  const r=allMovies().find(x=>x.id===canonicalId || x.contentEvidenceId===canonicalId);
  if(!r) return `<div class="container section"><h1>Review not found</h1><p><a class="text-link" href="/#browse">Browse movies →</a></p></div>`;
  return r.verdict ? reviewedDetail(r) : pendingDetail(r);
}

function about(){
  return `<section class="page-hero"><div class="container"><h1>About The Orthodox Lens</h1><p>Helping families choose entertainment with discernment, virtue, and thoughtful conversation.</p><a class="text-link" href="/#about/approach">How we review films →</a></div></section>
  <section class="section"><div class="container"><div class="method-grid">
    <article class="method-card"><div class="eyebrow">Editorial accountability</div><h2>Who prepares the reviews?</h2><p>AI-assisted drafts are prepared for independent editorial review. Named reviewer and theological reviewer credits will be added once their participation and consent are confirmed. A provisional assessment is not a clergy-approved review.</p><p>We consult film-specific sources such as BBFC, IMDb parental guides, Common Sense Media and Plugged In, where available. We distinguish documented findings from interpretation, retain source links, and do not treat missing evidence as proof of absence.</p></article><article class="method-card"><div class="eyebrow">Our mission</div><h2>Watch with discernment.</h2><p>The Orthodox Lens is an independent Christian movie-review resource for parents and families. Our goal is not to forbid entertainment, but to help viewers recognize virtue, evaluate difficult messages, and discuss what they watch.</p><p>We consider whether a film is edifying, neutral, or destructive to spiritual wellness, alongside separate age recommendations and documented content warnings.</p></article>
    <article class="method-card"><div class="eyebrow">Our foundations</div><h2>Faithful, not official.</h2><p>Our perspective is informed by Scripture and the historic Orthodox Christian tradition, including teachings of the Church Fathers where relevant. We welcome Christians from different traditions.</p><p><strong>We are not an official publication or representative of any Orthodox Church, bishop, synod, or religious institution.</strong> Our evaluations are independent editorial opinions.</p></article>
    <article class="method-card"><div class="eyebrow">For families</div><h2>Discuss, don't merely rate.</h2><p>Neutral movies in particular can open meaningful conversations about truthfulness, humility, courage, relationships, and the difference between portraying wrongdoing and endorsing it.</p><p>Our post-viewing questions are intended to support parents and children in thoughtful conversation, not to replace a family's judgment.</p></article>
    <article class="method-card"><div class="eyebrow">A pastoral reminder</div><h2>Spiritual guidance belongs in relationship.</h2><p>Reviews and age recommendations on this website are suggestions, not spiritual direction. For personal discernment, families should seek the guidance of their father of confession or parish priest.</p><p>AI assists research and drafting, while final approval requires human verification of film facts, citations, and the theological interpretation.</p></article>
  </div><div class="paper-panel" style="margin-top:24px"><div class="eyebrow">Our guiding Scripture</div><h2>Philippians 4:8</h2>${scriptureQuotation("Philippians 4:8")}</div><div class="paper-panel" style="margin-top:24px"><div class="eyebrow">Artwork and sources</div><h2>Original movie posters</h2><p>Movie-cover images are loaded from TMDB when a film can be reliably matched. This product uses the TMDB API but is not endorsed or certified by TMDB. <a class="text-link" href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer">The Movie Database (TMDB)</a>.</p><p>Film-content references and our spiritual interpretations are separate. Content warnings must be verified with film-specific sources; Scripture and Church-Father citations are never presented as official Church judgments.</p><p class="muted">Scripture and Church Fathers quotations are sourced. Check each movie page for the editorial status of its spiritual assessment.</p></div></div></section>${reviewApproach()}`;
}

function reviewApproach(){
  return `<section id="review-approach" class="section" aria-labelledby="review-approach-title"><div class="container"><h2 id="review-approach-title">How we review films</h2><div class="two-col"><div class="method-card"><div class="eyebrow">Balanced classification</div><h2>Three verdicts</h2><p><strong>Edifying</strong> films encourage Christian virtue and spiritual reflection. <strong>Neutral</strong> films may be mostly recreational or morally mixed. <strong>Destructive</strong> films substantially glorify sin, undermine virtue, or expose viewers to severe harmful content that outweighs any positive moral value.</p></div><div class="method-card"><div class="eyebrow">A consistent framework</div><h2>Theme ratings, 0–5</h2><p>Scores from 0 to 5 show each theme’s prominence. The portrayal describes whether the film affirms, criticizes, or simply shows it. We consider family and cultural themes alongside virtues and concerns when deciding the spiritual verdict.</p></div></div><div style="overflow:auto"><table class="rubric"><thead><tr><th>Score</th><th>Definition</th><th>Meaning</th></tr></thead><tbody>${[['0/5','Absent','Verified as not present in adequate evidence'],['1/5','Minimal','Brief or incidental'],['2/5','Limited','Noticeable but secondary'],['3/5','Significant','Repeated or influential'],['4/5','Strong','Prominent or especially impactful'],['5/5','Defining','Central or extraordinarily intense'],['N/V','Not verified','Cannot determine from available evidence']].map(x=>`<tr>${x.map(z=>`<td>${esc(z)}</td>`).join('')}</tr>`).join('')}</tbody></table></div><div class="method-grid top-gap"><div class="method-card"><h3>We weigh four dimensions</h3><p><strong>35%</strong> Overall moral message<br><strong>30%</strong> Portrayal of virtue and sin<br><strong>25%</strong> Severity and exposure<br><strong>10%</strong> Spiritual reflection potential</p><p>These percentages guide discussion rather than mechanically deciding a spiritual verdict. Severe content triggers closer human review.</p></div><div class="method-card"><h3>Age guidance is separate</h3><p>All Ages · 7+ · 10+ · 13+ · 16+ · 18+ · Not Recommended</p><p>A story can be edifying for a mature teenager while unsuitable for a younger child. Parents have the final decision.</p></div><div class="method-card"><h3>Informed by Orthodox Christianity</h3><p>Scripture, the Church Fathers, and vetted historic Orthodox Christian teaching inform our spiritual reflections. The AI must not fabricate quotations or present personal interpretations as official doctrine.</p></div><div class="method-card"><h3>Family content advisories</h3><p>The ratings and verdict can consider the film’s portrayal of relationships, parental authority, father figures, mature coming-of-age topics and advocacy. We attribute interpretations of subtext and creative inspiration to their sources. The theme ratings link to the scenes and evidence behind the assessment. Before you watch groups the additional content findings in the same panel.</p></div><div class="method-card"><h3>Transparency by design</h3><p>AI drafts require evidence, sources, content checks, and human editorial approval before publication. We link to documented findings and show theme scores when the evidence supports them.</p></div></div></div></section>`;
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
  app.querySelectorAll('[data-share-url]').forEach(button=>button.addEventListener('click',async()=>{const status=document.getElementById('share-status');try{if(navigator.share)await navigator.share({title:button.dataset.shareTitle,url:button.dataset.shareUrl});else{await navigator.clipboard.writeText(button.dataset.shareUrl);status.textContent='Link copied.';const label=button.querySelector('[data-share-label]');if(label){label.textContent='Copied!';clearTimeout(button.shareReset);button.shareReset=setTimeout(()=>{label.textContent='Share';status.textContent='';},2000);}}}catch(error){if(error.name!=='AbortError')status.textContent='Copy this URL: '+button.dataset.shareUrl;}}));
  const track = document.getElementById('theme-track');
  if (track) wireThemeSlider(track);
  app.querySelectorAll('[data-review-jump]').forEach(button=>button.addEventListener('click',()=>{
    const section=document.getElementById(button.dataset.reviewJump);
    if(!section)return;
    if (section.id === 'theme-ratings') section.querySelector('details').open = true;
    section.focus({preventScroll:true});
    section.scrollIntoView({block:'start'});
  }));
  const suggestionForm=document.getElementById('suggestionForm');
  if(suggestionForm){
    const kind=document.getElementById('ideaKind');
    const details=document.getElementById('ideaDetails');
    const scripture=document.getElementById('ideaScripture');
    const configureFields=()=>{
      const filmRequest=kind.value==='film_request';
      details.required=!filmRequest;
      document.getElementById('ideaDetailsOptional').hidden=!filmRequest;
      details.minLength=filmRequest?0:25;
      scripture.required=['biblical_parallel','gospel_reflection'].includes(kind.value);
      const scriptureVisible=scripture.required;
      scripture.hidden=!scriptureVisible;
      suggestionForm.querySelector('label[for="ideaScripture"]').hidden=!scriptureVisible;
    };
    kind.addEventListener('change',configureFields);
    suggestionForm.addEventListener('reset',()=>queueMicrotask(configureFields));
    suggestionForm.addEventListener('submit',sendSuggestion);
    configureFields();
  }
  document.getElementById('heroSearch')?.addEventListener('submit',e=>{e.preventDefault();currentSearch=document.getElementById('heroInput').value;location.hash='#browse';if(location.hash==='#browse') render();});
  if(document.getElementById('filteredResults')){
    for(const [id,setter] of [['searchFilter',v=>currentSearch=v],['verdictFilter',v=>currentVerdict=v],['ageFilter',v=>currentAge=v],['genreFilter',v=>currentGenre=v],['themeFilter',v=>currentTheme=v],['warningFilter',v=>currentWarning=v],['collectionFilter',v=>currentCollection=v]]){
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
  if(!('IntersectionObserver' in window))return;
  const observer=new IntersectionObserver(entries=>{
    for(const entry of entries){
      if(!entry.isIntersecting) continue;
      observer.unobserve(entry.target);
      const el=entry.target,title=el.dataset.posterTitle,year=el.dataset.posterYear;
      const key=title.toLowerCase()+'|'+year;
      if(!posterLookups.has(key))posterLookups.set(key,fetch('/api/poster?title='+encodeURIComponent(title)+'&year='+encodeURIComponent(year)).then(r=>r.ok?r.json():{}).catch(()=>({})));
      posterLookups.get(key).then(data=>{
        if(!data.posterUrl||!el.isConnected) return;
        const img=document.createElement('img');img.loading='lazy';img.decoding='async';img.alt=title+' movie poster';img.referrerPolicy='no-referrer';
        img.onerror=()=>{img.remove();el.classList.remove('poster-image')};
        img.src=data.posterUrl;el.classList.add('poster-image');el.prepend(img);
      });
    }
  },{rootMargin:'350px'});
  elems.forEach(el=>observer.observe(el));
}

function render(){
  if(location.hash==='#content'){app.focus();return;}
  const slug=location.pathname.match(/^\/movies\/([^/]+)\/?$/)?.[1];
  const routeMovie=slug?allMovies().find(m=>movieSlug(m)===slug):null;
  let route=location.hash.slice(1)||(slug?(routeMovie?'review/'+routeMovie.id:'review/not-found'):'home');
  try{route=decodeURIComponent(route)}catch{route='review/not-found'}
  if(route.startsWith('browse/'))currentCollection=route.slice(7)==='family'?'family':'all';
  else if(route==='browse')currentCollection='all';
  const hash=route==='method'?'about/approach':route;
  if(hash==='admin'){location.replace('/studio/');return;}
  if(slug&&!routeMovie&&!location.hash&&app.querySelector('.review-back')){wire();loadPosters();return;}
  app.innerHTML=hash==='home'?home():(hash==='browse'||hash.startsWith('browse/'))?browse():(hash==='about'||hash==='about/approach')?about():hash==='suggest'?suggestionPage():hash.startsWith('suggest/')?suggestionPage(hash.slice(8)):hash.startsWith('review/')?detail(hash.slice(7)):home();
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

if(browser){
document.getElementById('mobileNav').onclick=()=>{
  mobileOpen=!mobileOpen;
  document.getElementById('mobileNav').setAttribute('aria-expanded',String(mobileOpen));
  let nav=document.getElementById('mobileMenu');
  if(!nav){
    nav=document.createElement('div');
    nav.id='mobileMenu';
    nav.className='mobile-menu';
    nav.innerHTML='<a href="/#home">Home</a><a href="/#browse">Browse movies</a><a href="/#about">About &amp; Our Approach</a><a href="/#suggest">Reader Suggestions</a>';
    document.querySelector('.nav').append(nav);
  }
  nav.style.display=mobileOpen?'flex':'none';
};

window.addEventListener('hashchange',()=>{mobileOpen=false;document.getElementById('mobileNav').setAttribute('aria-expanded','false');document.getElementById('mobileMenu')?.remove();render();});
await refreshPublished();
render();
}
export {allMovies,home,reviewedDetail,pendingDetail};
export function setPublishedForBuild(reviews){published=reviews||[];}
