// The Orthodox Lens Editorial Studio. Admin mutations always go through protected Netlify API.
const el=document.getElementById('studio-root');
const escapeHtml=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const h=escapeHtml;
const years=new Date().getFullYear();
const verdictLabels={edifying:'Edifying',neutral:'Neutral',destructive:'Destructive to Spiritual Wellness'};
const tabs=[['overview','◫','Overview'],['queue','☷','Approval queue'],['library','▦','Movie library'],['sources','♧','Research & sources'],['analytics','▥','Analytics'],['assistant','✦','AI assistant'],['team','♙','Settings & team']];
let S={connected:false,demo:false,token:sessionStorage.getItem('tol_access')||'',refresh:sessionStorage.getItem('tol_refresh')||'',role:'',email:'',member:null,tab:'overview',data:{reviews:[],issues:[],members:[],activity:[]},selected:null,metric:null,metricDays:30,filter:'',status:'all',issueFilter:'open',notice:null,proposal:null,aiEvidence:'',lastSaved:''};
function note(text,kind='info'){S.notice={text,kind};const old=document.querySelector('#banner');if(old)old.outerHTML=noticeHtml();}
function noticeHtml(){return S.notice?`<div id="banner" class="alert ${h(S.notice.kind)}">${h(S.notice.text)}</div>`:'<div id="banner"></div>'}
async function api(action,payload=null,method='GET',auth=true){
  const url='/api/studio'+(method==='GET'?'?action='+encodeURIComponent(action)+(payload?.id?'&id='+encodeURIComponent(payload.id):'')+(payload?.days?'&days='+encodeURIComponent(payload.days):''):'');
  const init={method,headers:{...(auth&&S.token?{Authorization:'Bearer '+S.token}:{}),...(method==='POST'?{'Content-Type':'application/json'}:{})},cache:'no-store'};
  if(method==='POST')init.body=JSON.stringify({action,...payload});
  let response=await fetch(url,init);let result=await response.json().catch(()=>({error:'Server returned an invalid response'}));
  if(response.status===401&&auth&&action!=='refresh'&&S.refresh&&S.connected){
    const refreshed=await api('refresh',{refresh_token:S.refresh},'POST',false).catch(()=>null);
    if(refreshed?.access_token){setSession(refreshed);init.headers.Authorization='Bearer '+S.token;response=await fetch(url,init);result=await response.json().catch(()=>({error:'Server returned an invalid response'}));}
  }
  if(!response.ok)throw Error(result.error||`Request failed (${response.status})`);
  return result;
}
function setSession(x){S.token=x.access_token||'';S.refresh=x.refresh_token||'';sessionStorage.setItem('tol_access',S.token);sessionStorage.setItem('tol_refresh',S.refresh);S.role=x.member?.role||S.role;S.email=x.email||S.email;}
function clearSession(){S.token='';S.refresh='';S.role='';S.demo=false;S.selected=null;sessionStorage.removeItem('tol_access');sessionStorage.removeItem('tol_refresh');}
function demoBootstrap(){const source=typeof seedReviews!=='undefined'?seedReviews:[];return {user:{email:'Preview Mode',role:'owner',display_name:'Editor preview'},members:[],activity:[],reviews:source.map(r=>({movie_id:r.id,title:r.title,release_year:r.year,workflow:'draft',verdict:r.verdict,suggested_age:r.age,revision:1,has_live_version:false,facts_by:null,age_by:null,spiritual_by:null,updated_at:null})),issues:typeof demoIssues!=='undefined'?demoIssues:[]};}
async function bootstrap(){
  if(S.demo){S.data=demoBootstrap();S.role='owner';S.email='Preview mode';render();return;}
  const data=await api('bootstrap');S.data=data;S.role=data.user.role;S.email=data.user.email;S.member=data.user;render();
}
const review=(id)=>S.data.reviews.find(r=>r.movie_id===id);
const issues=(id)=>S.data.issues.filter(i=>i.movie_id===id);
const outstanding=(id)=>issues(id).filter(i=>i.state==='open');
const statusText=r=>r.workflow==='published'?'Published':r.workflow==='ready'?'Ready to publish':r.workflow==='in_review'?'In review':'Draft';
function cleanTitle(t){return String(t||'').toLowerCase()}
function stage3(r){return typeof contentEvidenceById!=='undefined'?contentEvidenceById[r?.movie_id||r?.id]||null:null}
function countBy(k){return S.data.reviews.filter(r=>r.workflow===k).length}
function countOpen(kind){return S.data.issues.filter(i=>i.state==='open'&&(!kind||i.kind===kind)).length}
function pct(n,d){return d?Math.round(n/d*100):0}
function smallBtn(text,action,attrs='',cls='secondary'){return `<button type="button" class="btn small ${cls}" data-action="${h(action)}" ${attrs}>${h(text)}</button>`}
function issueChip(kind){return `<span class="chip ${kind==='open'?'open':kind}">${h(kind)}</span>`}
function stateChip(state){return `<span class="chip ${h(state)}">${h(({draft:'Draft',in_review:'In review',ready:'Ready',published:'Published'})[state]||state)}</span>`}
function shell(content){
  const current=tabs.find(t=>t[0]===S.tab);
  const nav=tabs.map(([key,icon,label])=>`<button class="nav-btn ${S.tab===key?'active':''}" data-action="nav" data-tab="${key}"><span>${icon}</span><span class="nav-label">${label}</span></button>`).join('');
  el.innerHTML=`${S.demo?'<div class="preview-flag">READ-ONLY PREVIEW — this is the real 200-film dataset, but nothing can be saved until Supabase is connected.</div>':''}<div class="shell"><aside class="rail"><div class="rail-brand"><span class="mark">✣</span><div><strong>THE ORTHODOX LENS</strong><small>EDITORIAL STUDIO</small></div></div>${nav}<div class="rail-bottom"><div>${S.demo?'Preview mode':h(S.email)}<br>${h(S.role.toUpperCase())}</div><a href="/">← Back to public website</a><button class="btn small secondary" data-action="logout">${S.demo?'Exit preview':'Sign out'}</button></div></aside><div class="workspace"><div class="mobile-top">${tabs.map(t=>`<button data-action="nav" data-tab="${t[0]}" class="${S.tab===t[0]?'active':''}">${t[2]}</button>`).join('')}</div><header class="topbar"><div class="crumb">Editorial Studio <span class="muted"> / ${h(current?.[2]||'Review')}</span></div><div class="right-meta"><span class="muted">${S.demo?'Read-only preview':h(S.email)}</span><span class="chip">${h(S.role)}</span><div class="avatar">✣</div></div></header><main class="main">${noticeHtml()}${content}<footer class="footer-note">The Orthodox Lens is an independent Christian family-review project, not an official Church publication. Editorial approval is not ecclesiastical endorsement.</footer></main></div></div>`;
}
function header(title,description,controls=''){return `<div class="pagehead"><div><div class="eyebrow">The Orthodox Lens · Editorial management</div><h1>${title}</h1><p>${description}</p></div>${controls?`<div class="actions">${controls}</div>`:''}</div>`}
function stat(title,value,sub=''){return `<div class="stat"><small>${h(title)}</small><strong>${h(value)}</strong><em>${h(sub)}</em></div>`}
function tableReviewRows(list){
  if(!list.length)return `<tr><td colspan="6" class="empty">No movies match these filters.</td></tr>`;
  return list.map(r=>`<tr><td><strong>${h(r.title)}</strong><div class="muted tiny">${h(r.release_year)} · ${h(r.movie_id)}</div></td><td>${stateChip(r.workflow)}</td><td>${r.facts_by?'✓':'—'} / ${r.age_by?'✓':'—'} / ${r.spiritual_by?'✓':'—'}</td><td>${outstanding(r.movie_id).length?`<span class="chip open">${outstanding(r.movie_id).length} flags</span>`:'<span class="chip resolved">Clear</span>'}</td><td class="tiny muted">${r.updated_at?new Date(r.updated_at).toLocaleDateString():'Imported'}</td><td>${smallBtn('Open review','open',`data-id="${h(r.movie_id)}"`)}</td></tr>`).join('');
}
function listMatches(r){const q=cleanTitle(S.filter.trim());return (!q||cleanTitle(r.title).includes(q)||cleanTitle(r.movie_id).includes(q))&&(S.status==='all'||r.workflow===S.status||(S.status==='flagged'&&outstanding(r.movie_id).length>0)||(S.status==='pending'&&r.workflow!=='published'));}
function movieTable(rows){return `<div class="table-scroll"><table class="data-table"><thead><tr><th>Movie</th><th>Workflow</th><th>Facts / Age / Spirit</th><th>Open issues</th><th>Modified</th><th></th></tr></thead><tbody id="movieRows">${tableReviewRows(rows)}</tbody></table></div>`}
function statusFilters(){return `<div class="filter-row"><input id="movieSearch" class="control" placeholder="Search 200 movie titles…" value="${h(S.filter)}"><select id="statusFilter" class="control"><option value="all">All statuses</option>${[['pending','Unpublished'],['draft','Draft'],['in_review','In review'],['ready','Ready'],['published','Published'],['flagged','With open issues']].map(([v,t])=>`<option value="${v}" ${v===S.status?'selected':''}>${t}</option>`).join('')}</select><span class="muted tiny" id="visibleCount">${S.data.reviews.filter(listMatches).length} movies</span></div>`}
function overview(){
  const total=S.data.reviews.length;const done=countBy('published');const needs=S.data.reviews.filter(r=>r.workflow!=='published'&&outstanding(r.movie_id).length).sort((a,b)=>outstanding(b.movie_id).length-outstanding(a.movie_id).length).slice(0,7);
  const verdicts=S.data.reviews.reduce((acc,r)=>{if(r.verdict)acc[r.verdict]=(acc[r.verdict]||0)+1;return acc},{edifying:0,neutral:0,destructive:0});
  return header('Editorial overview','One workspace for reviews, approval decisions, research and publication.',`<a class="btn secondary" href="/" target="_blank">View public site ↗</a>`)+
  `<div class="stats-grid">${stat('Movie records',total,'Stage 4 library imported')}${stat('Published',done,`${pct(done,total)}% editorial approvals complete`)}${stat('Open source claims',countOpen('source'),'Verify exact content and interpretation')}${stat('Age guidance flags',countOpen('age'),'Prioritize sensitive recommendations')}</div>
  <div class="two-col sectiongap"><section class="box"><div class="title-row"><h2>Stage 4 approval progress</h2><span class="chip">${done} / ${total}</span></div><div class="bar-bg"><div class="bar-fg" style="width:${pct(done,total)}%"></div></div><div class="progress-steps"><span class="done">✓ 200 drafts</span><span>Review claims</span><span>Approve decisions</span><span>Publish</span></div><p class="note" style="margin-top:17px">Every movie has a provisional assessment. Research and editorial sign-off must be completed before publication. A review is not marked approved just because an external guide has been linked.</p><div class="actions">${smallBtn('Open approval queue','nav','data-tab="queue"')}${smallBtn('View source flags','nav','data-tab="sources"')}</div></section><section class="box"><div class="title-row"><h2>Provisional verdict mix</h2><span class="muted tiny">Imported reviews</span></div>${Object.entries(verdicts).map(([type,n])=>`<div class="metric-line"><span>${h(verdictLabels[type])}</span><div class="actions"><div class="pill-bar"><span style="width:${pct(n,total)}%"></span></div><strong>${n}</strong></div></div>`).join('')}<div class="callout" style="margin-top:15px">Verdicts are independent Christian editorial assessments, not official Church teaching.</div></section></div>
  <div class="two-col sectiongap"><section class="box"><div class="title-row"><h2>Priority approval queue</h2>${smallBtn('All movies','nav','data-tab="queue"')}</div>${needs.length?movieTable(needs):'<p class="note">No open issues in this workspace.</p>'}</section><section class="box"><div class="title-row"><h2>Recent team activity</h2></div>${S.data.activity.length?S.data.activity.slice(0,9).map(a=>`<div class="metric-line"><span><strong>${h(a.action)}</strong><br><span class="muted tiny">${h(a.movie_id||a.detail)}</span></span><span class="muted tiny">${new Date(a.created_at).toLocaleDateString()}</span></div>`).join(''):'<div class="empty"><strong>No recorded actions yet</strong>Actions will appear after the database is connected.</div>'}</section></div>`;
}
function library(queue=false){
  const list=S.data.reviews.filter(r=>queue?r.workflow!=='published':true).filter(listMatches);
  return header(queue?'Approval queue':'Movie library',queue?'Examine reviews, clear audit issues, record approval decisions, and publish when ready.':'Search all 200 movies and edit their evidence-backed assessments.')+
  `<div class="box">${statusFilters()}${movieTable(list)}</div><div class="callout sectiongap">Facts, age guidance and spiritual interpretation have separate approval checkpoints. Publishing requires all three and no unresolved evidence flags.</div>`;
}
function sources(){
  const items=S.data.issues.filter(i=>S.issueFilter==='all'||i.state===S.issueFilter).filter(i=>!S.filter||cleanTitle(review(i.movie_id)?.title).includes(cleanTitle(S.filter))||cleanTitle(i.title).includes(cleanTitle(S.filter)));
  return header('Research & source verification','Prioritized evidence claims and age-suitability checks carried forward from Stage 4.')+
   `<div class="stats-grid">${stat('Source findings',S.data.issues.filter(i=>i.kind==='source').length,'Film-specific interpretation checks')}${stat('Age flags',S.data.issues.filter(i=>i.kind==='age').length,'Recommended age may need adjustment')}${stat('Still open',countOpen(),'Requires an editorial decision')}${stat('Resolved / waived',S.data.issues.filter(i=>i.state!=='open').length,'A documented disposition')}</div>
   <div class="box sectiongap"><div class="filter-row"><input class="control" id="issueSearch" value="${h(S.filter)}" placeholder="Filter by movie…"><select class="control" id="issueState"><option value="open" ${S.issueFilter==='open'?'selected':''}>Open issues</option><option value="all" ${S.issueFilter==='all'?'selected':''}>All issues</option><option value="resolved" ${S.issueFilter==='resolved'?'selected':''}>Resolved</option><option value="waived" ${S.issueFilter==='waived'?'selected':''}>Waived</option></select></div><div class="table-scroll"><table class="data-table"><thead><tr><th>Film</th><th>Category</th><th>Question to verify</th><th>State</th><th></th></tr></thead><tbody>${items.slice(0,250).map(i=>`<tr><td><strong>${h(review(i.movie_id)?.title||i.movie_id)}</strong></td><td>${h(i.kind)}</td><td>${h(i.title)}<p class="muted tiny">${h(i.detail).slice(0,200)}</p></td><td>${issueChip(i.state)}</td><td>${smallBtn('Review','open',`data-id="${h(i.movie_id)}"`)}</td></tr>`).join('')||'<tr><td colspan="5">No issues match these filters.</td></tr>'}</tbody></table></div></div>`;
}
function analytics(){
  const a=S.metric||{totals:{views:0,searches:0,no_results:0},daily:[],top_movies:[],top_searches:[]};const totals=a.totals||{};
  const d=a.daily||[];const max=Math.max(1,...d.map(x=>Number(x.views)||0));
  const chart=d.map(x=>`<div class="chart-day" title="${h(x.day)}: ${h(x.views)} page views" style="height:${Math.max(2,Math.round((Number(x.views)||0)/max*100))}%"></div>`).join('');
  return header('Analytics','Privacy-conscious pageview and search-event reporting, not unique-user tracking.',`<select class="control" id="metricDays"><option value="7" ${S.metricDays===7?'selected':''}>Last 7 days</option><option value="30" ${S.metricDays===30?'selected':''}>Last 30 days</option><option value="90" ${S.metricDays===90?'selected':''}>Last 90 days</option></select>`)+
    `<div class="stats-grid">${stat('Movie pageviews',totals.views||0,'Tracked page openings')}${stat('Movie searches',totals.searches||0,'Search-event total')}${stat('No-result searches',totals.no_results||0,'Discover missing movie coverage')}${stat('Publishing progress',countBy('published')+'/'+S.data.reviews.length,'Approved public updates')}</div>
    <div class="two-col sectiongap"><div class="box"><h2>Movie views over time</h2><div class="chart" style="margin-top:32px">${chart||'<div class="empty" style="width:100%">Traffic will appear after deployment and visitor activity.</div>'}</div><div class="legend"><span>▣ Movie views</span><span>UTC · ${S.metricDays} days</span></div></div><div class="box"><h2>Most viewed movies</h2>${(a.top_movies||[]).map((x,i)=>`<div class="metric-line"><span>${i+1}. ${h(x.title||x.movie_id)}</span><strong>${h(x.views)}</strong></div>`).join('')||'<div class="empty">No movie views recorded yet.</div>'}</div></div>
    <div class="two-col sectiongap"><div class="box"><h2>Top searches</h2>${(a.top_searches||[]).map(x=>`<div class="metric-line"><span>${h(x.term)}</span><span><strong>${h(x.count)}</strong> <span class="muted tiny">(${h(x.no_results)} no result)</span></span></div>`).join('')||'<div class="empty">No searches recorded yet.</div>'}</div><div class="box"><h2>Privacy and interpretation</h2><p class="note">This custom dashboard stores movie IDs, search phrases, result counts and event times. It does not store visitor email, account identity, IP address, or tracking cookies in the analytics table. These are raw events, not verified human visitors or unique users. Bots and ad blockers can affect counts.</p><p class="note">Netlify and Supabase may separately keep security and access logs under their own policies. Sensitive search terms should not be entered.</p></div></div>`;
}
function team(){
  return header('Settings & team','Invite editors, manage access, export data, and review publication safeguards.')+`<div class="two-col"><section class="box"><h2>Team members</h2><p class="note">Only the Editor-in-Chief can invite or change roles.</p><div class="table-scroll"><table class="data-table"><thead><tr><th>Member</th><th>Role</th><th>Status</th><th></th></tr></thead><tbody>${S.data.members.map(m=>`<tr><td>${h(m.display_name||m.user_id)}<div class="muted tiny mono">${h(m.user_id.slice(0,8))}…</div></td><td>${h(m.role)}</td><td>${m.active?'<span class="chip resolved">Active</span>':'<span class="chip open">Inactive</span>'}</td><td>${S.role==='owner'&&!S.demo?`<select data-role-id="${h(m.user_id)}" class="control"><option ${m.role==='owner'?'selected':''} value="owner">Owner</option><option ${m.role==='editor'?'selected':''} value="editor">Editor</option><option ${m.role==='reviewer'?'selected':''} value="reviewer">Reviewer</option></select>${smallBtn('Save role','save-team-role',`data-id=\"${h(m.user_id)}\"`)} ${smallBtn(m.active?'Deactivate':'Activate','toggle-team',`data-id="${h(m.user_id)}" data-active="${m.active}"`)}`:''}</td></tr>`).join('')||'<tr><td colspan="4">No members loaded in preview.</td></tr>'}</tbody></table></div></section><section class="box"><h2>Invite a team member</h2><div class="field"><label>Email</label><input class="control" type="email" id="inviteEmail" placeholder="editor@example.com" autocomplete="off"></div><div class="field"><label>Display name</label><input class="control" id="inviteName" placeholder="Reviewer name"></div><div class="field"><label>Permission</label><select class="control" id="inviteRole"><option value="editor">Editor — edit, check facts/age</option><option value="reviewer">Reviewer — spiritual sign-off</option></select></div><div class="actions">${smallBtn('Send invitation','invite',S.role!=='owner'||S.demo?'disabled':'','') }</div><p class="note">Invite-only: create accounts through Supabase Auth. The owner remains accountable for final publication.</p></section></div>
  <div class="two-col sectiongap"><section class="box"><h2>Backup and restore</h2><p class="note">Export all draft and published reviews as a JSON backup. Revision history is also retained in the database, so older drafts can be restored without automatically changing the live version.</p>${smallBtn('Export full JSON backup','export',S.role!=='owner'||S.demo?'disabled':'')}</section><section class="box"><h2>Approval rules</h2><p class="note">Factual evidence ✓ · independent age guidance ✓ · spiritual interpretation ✓ · no open audit flags ✓. Edits invalidate earlier sign-offs. Publishing requires an owner and never happens automatically after an AI draft.</p><div class="chip ready">Secure server-side permissions</div></section></div>`;
}
function assistant(){
 return header('AI research assistant','Prepare a revision from editor-supplied evidence. AI never approves, publishes, or invents film-source claims.')+`<div class="two-col"><section class="box"><div class="field"><label>Movie to research</label><select class="control" id="aiFilm"><option value="">Select an existing movie</option>${S.data.reviews.slice().sort((a,b)=>a.title.localeCompare(b.title)).map(r=>`<option value="${h(r.movie_id)}" ${S.selected?.movie_id===r.movie_id?'selected':''}>${h(r.title)} (${r.release_year})</option>`).join('')}</select></div><div class="field"><label>Verified film observations and moral conflict</label><textarea class="control" id="aiEvidence" style="min-height:220px" placeholder="Describe film-specific plot events, wrongdoing, positive virtues, concerning content and verified source observations; cite URLs. 150 characters minimum.">${h(S.aiEvidence)}</textarea></div><div class="field"><label>Source URLs (one per line)</label><textarea class="control" id="aiSources" placeholder="https://..." style="min-height:88px"></textarea></div><div class="actions">${smallBtn('✦ Prepare AI revision','ai-generate',S.demo?'disabled':'','')}${S.selected?smallBtn('Return to movie','open',`data-id="${h(S.selected.movie_id)}"`):''}</div><p class="note">The model is instructed to use only the observations you provide. Every conclusion must still be independently verified by an editor.</p></section><section class="box"><h2>AI proposal</h2><div id="aiResult">${S.proposal?`<pre class="mono" style="white-space:pre-wrap;font-size:11px;max-height:600px;overflow:auto">${h(JSON.stringify(S.proposal,null,2))}</pre>${smallBtn('Apply narrative to selected review','apply-ai',!S.selected?'disabled':'')}`:'<div class="empty"><strong>No proposed changes yet</strong>Evidence-based AI suggestions will appear here. They are not saved automatically.</div>'}</div></section></div>`;
}
function field(label,id,value,kind='textarea',cls=''){return `<div class="field ${cls}"><label for="${h(id)}">${h(label)}</label>${kind==='textarea'?`<textarea class="control" id="${h(id)}">${h(value)}</textarea>`:`<input class="control" id="${h(id)}" value="${h(value)}">`}</div>`}
const options=(values,selected)=>values.map(x=>`<option ${x===selected?'selected':''} value="${h(x)}">${h(x)}</option>`).join('');
function themeEditor(t,i){
  return `<div class="mini-theme" data-theme-row="${i}"><div class="mini-theme-top"><div class="field"><label>Theme name</label><input class="control theme-name" value="${h(t.name)}"></div><div class="field"><label>Type</label><select class="control theme-type">${options(['positive','harmful'],t.type)}</select></div><div class="field"><label>Intensity (0–5)</label><select class="control theme-score">${options(['0','1','2','3','4','5'],String(t.score??0))}</select></div><div class="field"><label>Portrayal</label><select class="control theme-portrayal">${options(['affirmed','condemned','criticized','mixed','descriptive','unverified'],t.portrayal)}</select></div><div style="padding-top:21px">${smallBtn('×','remove-theme',`data-index="${i}"`,'danger')}</div></div><div class="field"><label>Why this score? Which verified detail supports it?</label><textarea class="control theme-evidence">${h(t.evidence)}</textarea></div><div class="field"><label>Evidence source URLs — one per line (mandatory)</label><textarea class="control theme-refs" style="min-height:64px">${h((t.references||[]).map(s=>s.url).join('\n'))}</textarea></div></div>`;
}
function stage3Panel(id){const ev=stage3({movie_id:id});if(!ev)return '<p class="note">No linked Stage 3 evidence was found. Verify the film identity before editing.</p>';
 const labels={sexual_content:'Sexual content',language:'Language & blasphemy',violence:'Violence / peril',spiritual_material:'Occult / spiritual material',substance_use:'Substance use',moral_themes:'Moral themes'};
 return Object.entries(labels).map(([key,label])=>{
  const item=ev.content_categories?.[key];if(!item)return '';
  const links=(item.evidence||[]).slice(0,4).filter(s=>/^https:\/\//.test(s.url||'')).map(s=>`<a href="${h(s.url)}" target="_blank" rel="noopener noreferrer">${h(s.provider)}</a>`).join(' · ');
  return `<div class="audit-finding"><strong>${h(label)} <span class="chip">${h((item.status||'unverified').replaceAll('_',' '))}</span></strong>${(item.findings||[]).slice(0,5).map(f=>`<p>${h(f)}</p>`).join('')}${item.research_note?`<p>${h(item.research_note)}</p>`:''}<div>${links}</div></div>`;
 }).join('');
}
function issueEditor(i){return `<div class="issue ${h(i.state)}"><div class="title-row" style="margin:0"><h4>${h(i.kind.toUpperCase())} · ${h(i.title)}</h4>${issueChip(i.state)}</div><p>${h(i.detail)}</p>${i.source_url&&/^https:\/\//.test(i.source_url)?`<a class="tiny" href="${h(i.source_url)}" target="_blank" rel="noopener noreferrer">Open supporting source ↗</a>`:''}${i.state!=='open'?`<p><strong>Disposition:</strong> ${h(i.resolution_note)}</p>`:''}${S.demo?'':`<textarea id="issue-note-${h(i.id)}" class="control" placeholder="Describe what you verified or why the issue is being waived…">${h(i.resolution_note||'')}</textarea><div class="actions">${i.state==='open'?smallBtn('Mark resolved','issue-resolve',`data-id="${h(i.id)}"`):smallBtn('Reopen','issue-reopen',`data-id="${h(i.id)}"`)}${S.role==='owner'&&i.state==='open'?smallBtn('Waive with reason','issue-waive',`data-id="${h(i.id)}"`):''}</div>`}</div>`}
function historyEditor(hist){return hist.map(x=>`<div class="history-row"><span><strong>Revision ${h(x.revision)}</strong><br><span class="muted">${h(x.action)} · ${new Date(x.created_at).toLocaleString()}</span></span>${smallBtn('Restore draft','restore',`data-history="${h(x.id)}"`, 'secondary')}</div>`).join('')||'<p class="note">History will appear after the first saved edit.</p>'}
function reviewEditor(){
 const selected=S.selected;if(!selected)return overview();
 const r=selected.row.draft||{};const meta=selected.row;const issuesList=selected.issues||[];
 const canWrite=!S.demo&&['owner','editor'].includes(S.role);
 const approved=[['facts','Content & factual review',meta.facts_by],['age','Age guidance review',meta.age_by],['spiritual','Spiritual interpretation',meta.spiritual_by]];
 const approvedCount=approved.filter(x=>x[2]).length;
 const btnDisabled=S.demo?'disabled':'';
 return header('Review: '+h(meta.title),`${meta.release_year} · ${h(meta.movie_id)} · Revision ${meta.revision}`,
     `${smallBtn('← Back to queue','nav','data-tab="queue"')}${smallBtn('Open public page','public-review',`data-id="${h(meta.movie_id)}"`)}`)+
 `<div class="stats-grid" style="margin-bottom:18px">${stat('Approval checkpoints',`${approvedCount} / 3`,'Facts · Age · Spiritual')}${stat('Open issues',issuesList.filter(i=>i.state==='open').length,'Each requires resolution or waiver')}${stat('Draft revision',meta.revision,`Updated ${meta.updated_at?new Date(meta.updated_at).toLocaleDateString():'on import'}`)}${stat('Public version',meta.published?'Exists':'Not yet published',meta.published_at?new Date(meta.published_at).toLocaleDateString():'Current site still shows provisional seed')}</div>
 <div class="review-layout"><div><section class="box"><div class="title-row"><h2>Edit review</h2>${stateChip(meta.workflow)}</div><div class="callout" style="margin-bottom:20px">Edits invalidate all three earlier approvals. Save first, then review and approve the updated text. Movie identity is locked to keep the Stage 3 content guide attached to the correct title.</div>
 <div class="review-fields"><div class="field"><label>Spiritual verdict</label><select id="fVerdict" class="control" ${canWrite?'':'disabled'}>${[['edifying','Edifying'],['neutral','Neutral'],['destructive','Destructive to Spiritual Wellness']].map(([x,label])=>`<option value="${x}" ${r.verdict===x?'selected':''}>${label}</option>`).join('')}</select></div><div class="field"><label>Suggested viewing age (independent)</label><select id="fAge" class="control" ${canWrite?'':'disabled'}>${options(['All Ages','7+','10+','13+','16+','18+','Not Recommended'],r.age)}</select></div>
 ${field('Why this spiritual verdict?','fVerdictReason',r.verdictRationale,'textarea','full')}${field('Why this age? Explain violence, language, sexual content, fear, maturity.','fAgeReason',r.ageRationale,'textarea','full')}${field('Spiritual reflection','fReflection',r.reflection,'textarea','full')}${field('Scripture references (one per line)','fScripture',(r.scripture||[]).join('\n'),'textarea','full')}${field('Five family discussion questions (one per line)','fQuestions',(r.questions||[]).join('\n'),'textarea','full')}</div>
 <div class="divider"></div><div class="title-row"><h2>Theme ratings</h2>${canWrite?smallBtn('+ Add theme','add-theme'):''}</div><p class="note">Four or more well-supported themes; each 0–5 score has a specific rationale and HTTPS reference. An absent content advisory is not proof of a zero.</p><div id="themeRows">${(r.themes||[]).map(themeEditor).join('')}</div>
 <div class="divider"></div><h2>Sources, content notes & warnings</h2><p class="note">Each source on its own line: <code>Label | https://link | Notes</code>. Warnings use: <code>Category | Severity | Details</code>.</p>
 ${field('Film-specific source links','fSources',(r.sources||[]).map(s=>`${s.label||''} | ${s.url||''} | ${s.notes||''}`).join('\n'))}${field('Content warnings','fWarnings',(r.warnings||[]).map(w=>`${w.name||''} | ${w.severity||''} | ${w.details||''}`).join('\n'))}${field('Editor notes','fEditorNote',r.editorNote)}
 ${familyAdvisoryEditor(r,canWrite)}
 <div class="actions" style="margin-top:20px">${smallBtn('Save draft & reset approvals','save',canWrite?'':'disabled','')}${smallBtn('Preview edits','preview-edits')}${smallBtn('AI revision suggestions','nav','data-tab="assistant"')}</div><div id="editPreview"></div></section>
 <section class="box sectiongap"><div class="title-row"><h2>Record approvals</h2><span class="muted tiny">Three independent checkpoints</span></div><p class="note">Approving attests to your editorial review of that dimension. It does not claim official ecclesiastical endorsement.</p>${approved.map(([key,label,who])=>`<div class="metric-line"><span><strong>${label}</strong><br><span class="muted tiny">${who?'Signed by '+who.slice(0,8)+'…':'Awaiting qualified review'}</span></span>${who?'<span class="chip resolved">✓ Signed</span>':smallBtn('Sign off','approve',`data-part="${key}" ${S.demo||(key==='spiritual'&&!['owner','reviewer'].includes(S.role))||(key!=='spiritual'&&!canWrite)?'disabled':''}`)}</div>`).join('')}<div class="divider"></div><div class="actions">${smallBtn('Publish approved version','publish',S.demo||S.role!=='owner'||approvedCount!==3||issuesList.some(i=>i.state==='open')?'disabled':'','')}${meta.published?'<span class="chip published">Previous public version preserved</span>':''}</div><p class="note">Publishing is blocked server-side unless the draft has all three sign-offs, required fields, and no open issues.</p></section>
 <section class="box sectiongap"><div class="title-row"><h2>Revision history</h2></div>${historyEditor(selected.history||[])}</section></div>
 <aside class="sticky-side"><section class="box"><div class="title-row"><h2>Stage 4 evidence queue</h2><span class="chip open">${issuesList.filter(i=>i.state==='open').length} open</span></div>${issuesList.length?issuesList.map(issueEditor).join(''):'<p class="note">No flagged issues for this movie; reviewers should still verify content and interpretations.</p>'}</section><section class="box sectiongap"><div class="title-row"><h2>Stage 3 parent content guide</h2></div><p class="note">Original six-category evidence ledger preserved, with source-scoped observations. Reported absence is not independent absence certification.</p>${stage3Panel(meta.movie_id)}</section><section class="box sectiongap"><h2>Review notes</h2><p class="note">Spiritual verdicts examine what the film asks viewers to admire and how it depicts wrongdoing. The same verdict may carry a mature age recommendation. Ask a father of confession or parish priest for individual pastoral discernment.</p></section></aside></div>`;
}
function familyAdvisoryEditor(review, canWrite){
  const advisories = getFamilyAdvisories(review);
  const fields = Object.entries(familyAdvisoryLabels).map(([type, label]) => {
    const advisory = advisories[type];
    return field(label, 'advisory-' + type, advisory?.details)
      + field(label + ' source URL', 'advisory-source-' + type, advisory?.url, 'text');
  }).join('');
  return `<div class="divider"></div><h2>Family content advisories</h2>
  <p class="note">Describe the scenes and their consequences. For parental authority, explain which choices the story rewards or criticizes. For family portrayal, name the caregivers and describe how the story treats fathers and father figures. For puberty, name the specific topics or scenes.</p>
  <p class="note">Use Explicit advocacy when the film makes a case for a real-world position or urges action. Use Interpretive note for subtext or creative inspiration and attribute it to its source. Each note needs a film-specific HTTPS source.</p>
  <fieldset style="border:0;padding:0;margin:0;min-width:0" ${canWrite?'':'disabled'}>${fields}</fieldset>`;
}

function collectDraft(){
 const s=S.selected;if(!s)throw Error('Open a movie first');const r=JSON.parse(JSON.stringify(s.row.draft));
 const v=id=>document.getElementById(id)?.value||'';
 r.verdict=v('fVerdict');r.age=v('fAge');r.verdictRationale=v('fVerdictReason').trim();r.ageRationale=v('fAgeReason').trim();r.reflection=v('fReflection').trim();r.scripture=v('fScripture').split('\n').map(x=>x.trim()).filter(Boolean);r.questions=v('fQuestions').split('\n').map(x=>x.trim()).filter(Boolean);
 r.editorNote=v('fEditorNote').trim();
 r.sources=v('fSources').split('\n').map(line=>{const [label,url,...notes]=line.split('|').map(x=>x.trim());return {label,url,notes:notes.join(' | ')}}).filter(s=>s.url);
 r.warnings=v('fWarnings').split('\n').map(line=>{const [name,severity,...detail]=line.split('|').map(x=>x.trim());return {name,severity,details:detail.join(' | ')}}).filter(s=>s.name);
 const currentAdvisories = getFamilyAdvisories(r);
 const advisories = {};
 let advisoryChanged = false;
 for (const type of Object.keys(familyAdvisoryLabels)) {
  const details = v('advisory-' + type).trim();
  const url = v('advisory-source-' + type).trim();
  if (details || url) advisories[type] = {details, url};
  const current = currentAdvisories[type];
  if (details !== (current?.details || '') || url !== (current?.url || '')) advisoryChanged = true;
 }
 if (advisoryChanged) r.familyAdvisories = advisories;
 r.themes=[...document.querySelectorAll('[data-theme-row]')].map(tr=>{
  const name=tr.querySelector('.theme-name').value.trim(),type=tr.querySelector('.theme-type').value,score=Number(tr.querySelector('.theme-score').value),portrayal=tr.querySelector('.theme-portrayal').value,evidence=tr.querySelector('.theme-evidence').value.trim();
  const old=(S.selected.row.draft.themes||[]).find(t=>t.name===name);
  const references=tr.querySelector('.theme-refs').value.split('\n').map(url=>url.trim()).filter(Boolean).map(url=>(old?.references||[]).find(x=>x.url===url)||{label:'Film-specific source',url});
  return {name,type,score,portrayal,evidence,references};
 });
 return r;
}
function editPreview(){try{const r=collectDraft();document.getElementById('editPreview').innerHTML=`<div class="preview-card"><div class="eyebrow">Unpublished editor preview</div><h2>${h(r.title)} · ${h(verdictLabels[r.verdict])}</h2><p><strong>Recommended age: ${h(r.age)}</strong></p><p>${h(r.verdictRationale)}</p><p>${h(r.ageRationale)}</p><h3>Theme ratings</h3>${r.themes.map(t=>`<p class="tiny"><strong>${h(t.name)}: ${h(t.score)}/5</strong> · ${h(t.portrayal)} — ${h(t.evidence)}</p>`).join('')}${Object.entries(getFamilyAdvisories(r)).map(([type, advisory])=>advisory.details?`<p><strong>${h(familyAdvisoryLabels[type])}</strong> ${h(advisory.details)}</p>`:'').join('')}<h3>Family questions</h3>${r.questions.map((q,i)=>`<p class="tiny">${i+1}. ${h(q)}</p>`).join('')}</div>`;}catch(e){note(e.message,'bad')}}
async function openFilm(id){
  if(!id)return;try{
    let data;if(S.demo){const r=seedReviews.find(x=>x.id===id);if(!r)throw Error('Movie missing from preview data');data={row:{movie_id:r.id,title:r.title,release_year:r.year,revision:1,workflow:'draft',draft:JSON.parse(JSON.stringify(r)),published:null},issues:issues(id),history:[]};}
    else data=await api('item',{id});
    S.selected=data;S.tab='review';S.notice=null;render();
  }catch(e){note(e.message,'bad')}
}
function render(){
  let content;
  switch(S.tab){case 'overview':content=overview();break;case 'queue':content=library(true);break;case 'library':content=library(false);break;case 'sources':content=sources();break;case 'analytics':content=analytics();break;case 'team':content=team();break;case 'assistant':content=assistant();break;case 'review':content=reviewEditor();break;default:content=overview();}
  shell(content);
}
function loginPage(message=''){
  el.innerHTML=`<div class="signin-bg"><div class="signin"><div class="mark">✣</div><span class="eyebrow">Private publishing workspace</span><h1>The Orthodox Lens</h1><p>Editorial Studio · Sign in to review, edit, and approve movie assessments.</p>${S.notice?`<div class="alert ${h(S.notice.kind)}">${h(S.notice.text)}</div>`:""}${message?`<div class="alert bad">${h(message)}</div>`:''}<form id="loginForm"><div class="field"><label for="loginEmail">Email address</label><input id="loginEmail" class="control" type="email" autocomplete="username" required placeholder="editor@example.com"></div><div class="field"><label for="loginPassword">Password</label><input id="loginPassword" class="control" type="password" autocomplete="current-password" required placeholder="••••••••"></div><button type="submit" class="btn" style="width:100%">Sign in securely →</button></form><p><button class="btn subtle" data-action="forgot-password" style="width:100%">Forgot password?</button></p><div class="divider"></div><div class="note">Invite-only accounts. No public sign-up. For setup, see <strong>SETUP_STUDIO.md</strong> in the downloaded project.</div><button class="btn subtle" data-action="demo" style="width:100%;margin-top:15px">Preview dashboard without connecting</button><p class="note" style="margin-top:15px;text-align:center"><a href="/">← Return to public reviews</a></p></div></div>`;
}
function setupPage(){
  el.innerHTML=`<div class="signin-bg"><div class="signin"><div class="mark">✣</div><div class="eyebrow">Backend build ready · Connection required</div><h1>Connect Editorial Studio</h1><p>This release includes the live approval system, but no Supabase project credentials have been supplied yet.</p><ol class="steps"><li>Create a Supabase project.</li><li>Run <strong>supabase/migrations/20261118_editorial_studio.sql</strong> in its SQL Editor.</li><li>Add project URL, publishable key and secret key to Netlify environment variables.</li><li>Create your invited Supabase Auth account and make it the owner.</li><li>Import the existing 200 films with <strong>npm run studio:seed</strong>.</li></ol><div class="actions" style="margin-top:20px"><button class="btn" data-action="demo">Explore read-only preview →</button><a class="btn secondary" href="/">Public site ↗</a></div><div class="callout" style="margin-top:15px">No reviews are published or approved during setup. Secrets must be entered in Netlify, never into the website or chat.</div></div></div>`;
}

function passwordSetupPage(){
 el.innerHTML=`<div class="signin-bg"><div class="signin"><div class="mark">✣</div><div class="eyebrow">Secure account setup</div><h1>Choose your new password</h1><p>Your invite or recovery link has been verified. Set a strong password to finish signing in.</p><form id="passwordSetupForm"><div class="field"><label>New password (12+ characters)</label><input type="password" class="control" id="newPassword" autocomplete="new-password" minlength="12" required></div><div class="field"><label>Confirm password</label><input type="password" class="control" id="confirmPassword" autocomplete="new-password" minlength="12" required></div><button type="submit" class="btn" style="width:100%">Set password and open Studio</button></form><div id="banner"></div></div></div>`;
}
async function finishPassword(e){
 e.preventDefault();const pass=document.getElementById('newPassword').value;
 if(pass!==document.getElementById('confirmPassword').value){note('Passwords do not match','bad');return}
 try{await post('set_password',{password:pass});S.notice={text:'Password set. Welcome to the Editorial Studio.',kind:'good'};await bootstrap()}
 catch(err){note(err.message,'bad')}
}

async function login(e){e.preventDefault();const submit=e.target.querySelector('button[type=submit]');submit.disabled=true;submit.textContent='Signing in…';try{const result=await api('login',{email:document.getElementById('loginEmail').value,password:document.getElementById('loginPassword').value},'POST',false);setSession(result);S.demo=false;await bootstrap();}catch(err){loginPage(err.message)}finally{if(submit.isConnected){submit.disabled=false;submit.textContent='Sign in securely →'}}}
async function reloadAfterUpdate(id){await bootstrap();await openFilm(id);note('Changes saved securely.','good')}
async function post(action,data){return api(action,data,'POST')}
function saveFile(filename,value){const blob=new Blob([JSON.stringify(value,null,2)],{type:'application/json'});const a=document.createElement('a');const url=URL.createObjectURL(blob);a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000)}
async function handle(action,node){
  if(action==='forgot-password'){
    const email=document.getElementById('loginEmail')?.value||prompt('Enter your account email address:');
    if(!email)return;
    await api('password_reset',{email},'POST',false);
    S.notice={text:'If the account exists, a reset link has been sent to the email address.',kind:'info'};
    loginPage();return;
  }
  if(action==='demo'){S.demo=true;S.tab='overview';S.metric=null;S.notice=null;await bootstrap();return}
  if(action==='logout'){if(!S.demo&&S.token)await post('logout',{}).catch(()=>{});clearSession();S.demo=false;loginPage();return}
  if(action==='nav'){
    if(S.tab==='review'&&S.selected&&!S.demo){try{if(JSON.stringify(collectDraft())!==JSON.stringify(S.selected.row.draft)&&!confirm('You have unsaved edits. Leave this review?'))return}catch{}}
    S.tab=node.dataset.tab;S.notice=null;
    if(S.tab==='analytics'&&!S.demo)S.metric=await api('metrics',{days:S.metricDays});render();return;
  }
  if(action==='open'){await openFilm(node.dataset.id);return}
  if(action==='public-review'){window.open('/#review/'+encodeURIComponent(node.dataset.id),'_blank','noopener');return}
  if(action==='add-theme'){
    const r=collectDraft();r.themes.push({name:'',type:'positive',score:1,portrayal:'affirmed',evidence:'',references:[]});S.selected.row.draft=r;render();return;
  }
  if(action==='remove-theme'){
    const r=collectDraft();r.themes.splice(Number(node.dataset.index),1);S.selected.row.draft=r;render();return;
  }
  if(action==='preview-edits'){editPreview();return}
  if(S.demo)throw Error('Read-only preview. Connect Supabase and sign in to save or approve.');
  if(action==='save'){const draft=collectDraft();await post('save',{movie_id:S.selected.row.movie_id,revision:S.selected.row.revision,review:draft});await reloadAfterUpdate(S.selected.row.movie_id);return}
  if(action==='approve'){
    const part=node.dataset.part;const label={facts:'factual source and content claims',age:'age suitability',spiritual:'spiritual verdict and interpretation'}[part];
    if(!confirm(`Have you personally reviewed and verified the ${label}?\n\nThis records your editorial sign-off.`))return;
    await post('approve_'+part,{movie_id:S.selected.row.movie_id,revision:S.selected.row.revision});await reloadAfterUpdate(S.selected.row.movie_id);return;
  }
  if(action==='publish'){
    if(!confirm('Publish this fully approved review to the public website? This replaces only the public version of this movie.'))return;
    await post('publish',{movie_id:S.selected.row.movie_id,revision:S.selected.row.revision});await reloadAfterUpdate(S.selected.row.movie_id);note('Review published! Public page will load the approved version shortly.','good');return;
  }
  if(action.startsWith('issue-')){
    const issue_id=node.dataset.id;const state=action==='issue-resolve'?'resolved':action==='issue-waive'?'waived':'open';const resolution_note=document.getElementById('issue-note-'+issue_id)?.value||'';
    await post('issue',{issue_id,state,resolution_note});await reloadAfterUpdate(S.selected.row.movie_id);note('Issue disposition recorded.','good');return;
  }
  if(action==='restore'){
    if(!confirm('Restore this older draft? All current approvals will be cleared. The live public version remains untouched.'))return;
    await post('rollback',{movie_id:S.selected.row.movie_id,revision:S.selected.row.revision,history_id:Number(node.dataset.history)});await reloadAfterUpdate(S.selected.row.movie_id);return;
  }
  if(action==='invite'){
    const email=document.getElementById('inviteEmail').value,display_name=document.getElementById('inviteName').value,role=document.getElementById('inviteRole').value;
    await post('invite',{email,display_name,role});await bootstrap();note(`Invitation created for ${email}.`,'good');return;
  }
  if(action==='save-team-role'){
    const id=node.dataset.id;const old=S.data.members.find(x=>x.user_id===id);
    const role=document.querySelector(`[data-role-id=\"${CSS.escape(id)}\"]`)?.value||old.role;
    if(!confirm(`Change ${old.display_name}'s role from ${old.role} to ${role}?`))return;
    await post('team_role',{user_id:id,role,active:old.active});await bootstrap();note('Team role updated.','good');return;
  }
  if(action==='toggle-team'){
    const id=node.dataset.id;const old=S.data.members.find(x=>x.user_id===id);const role=document.querySelector(`[data-role-id="${CSS.escape(id)}"]`)?.value||old.role;
    if(!confirm(`Set ${old.display_name} to ${role} and ${old.active?'deactivate':'activate'}?`))return;
    await post('team_role',{user_id:id,role,active:!old.active});await bootstrap();note('Team permissions updated.','good');return;
  }
  if(action==='export'){const data=await api('export');saveFile('orthodox-lens-editorial-backup-'+new Date().toISOString().slice(0,10)+'.json',data);note('Private backup exported. Store it securely.','good');return}
  if(action==='ai-generate'){
    const movie_id=document.getElementById('aiFilm').value;const r=review(movie_id);if(!r)throw Error('Choose a movie');
    S.aiEvidence=document.getElementById('aiEvidence').value;
    node.disabled=true;node.textContent='Preparing suggestion…';
    const res=await post('ai',{title:r.title,year:r.release_year,evidence:S.aiEvidence,source_urls:document.getElementById('aiSources').value});S.proposal=res.proposal;render();note('AI suggestion ready. It is not verified, saved, or approved.','good');return;
  }
  if(action==='apply-ai'){
    if(!S.selected||!S.proposal)throw Error('Open a movie first');const p=S.proposal;const r=S.selected.row.draft;
    if(p.proposed_verdict&&verdictLabels[p.proposed_verdict])r.verdict=p.proposed_verdict;
    if(typeof p.verdict_rationale==='string')r.verdictRationale=p.verdict_rationale;
    if(typeof p.age_rationale==='string')r.ageRationale=p.age_rationale;
    if(typeof p.proposed_age==='string'&&['All Ages','7+','10+','13+','16+','18+','Not Recommended'].includes(p.proposed_age))r.age=p.proposed_age;
    if(Array.isArray(p.discussion_questions)&&p.discussion_questions.length>=5)r.questions=p.discussion_questions.slice(0,8);
    S.tab='review';render();note('AI suggested narrative loaded into the editor, but not saved. Review sources before saving.','info');return;
  }
}
document.addEventListener('submit',e=>{if(e.target.id==='loginForm'){login(e)}if(e.target.id==='passwordSetupForm'){finishPassword(e)}});
document.addEventListener('click',async e=>{
 const target=e.target.closest('[data-action]');if(!target)return;e.preventDefault();
 const action=target.dataset.action;target.disabled=true;
 try{await handle(action,target)}catch(err){note(err.message||'Operation failed','bad');if(!document.getElementById('banner'))alert(err.message||'Operation failed')}
 finally{if(target.isConnected)target.disabled=false}
});
document.addEventListener('input',e=>{
 if(e.target.id==='movieSearch'||e.target.id==='statusFilter'){
   S.filter=document.getElementById('movieSearch')?.value||'';
   S.status=document.getElementById('statusFilter')?.value||'all';
   const list=S.data.reviews.filter(r=>S.tab==='queue'?r.workflow!=='published':true).filter(listMatches);
   const tbody=document.getElementById('movieRows');if(tbody)tbody.innerHTML=tableReviewRows(list);
   const count=document.getElementById('visibleCount');if(count)count.textContent=list.length+' movies';
 }
});
document.addEventListener('change',async e=>{
 if(e.target.id==='statusFilter')e.target.dispatchEvent(new Event('input',{bubbles:true}));
 if(e.target.id==='issueState'){S.issueFilter=e.target.value;render()}
 if(e.target.id==='issueSearch'){S.filter=e.target.value;render()}
 if(e.target.id==='metricDays'){S.metricDays=Number(e.target.value);if(!S.demo){try{S.metric=await api('metrics',{days:S.metricDays})}catch(err){note(err.message,'bad')}}render()}
});
(async function start(){
  try{const config=await api('config',null,'GET',false);S.connected=config.connected;
    const hash=new URLSearchParams(location.hash.replace(/^#/,''));
    if(config.connected&&hash.get('access_token')&&hash.get('refresh_token')&&['invite','recovery','signup','magiclink'].includes(hash.get('type')||'')){
      setSession({access_token:hash.get('access_token'),refresh_token:hash.get('refresh_token')});
      history.replaceState(null,'',location.pathname+location.search);
      passwordSetupPage();return;
    }
    if(!config.connected){setupPage();return}
    if(S.token){try{await bootstrap();return}catch{clearSession()}}
    loginPage();
  }catch{setupPage()}
})();
