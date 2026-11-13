from pathlib import Path
p=Path(__file__).parent/'public/app.js'; s=p.read_text()
# Tighten counters and clearly communicate evidence status.
s=s.replace('const reviewed=!!r.verdict;', 'const reviewed=!!r.verdict;')
s=s.replace("'EDITOR REVIEWED'", "'PROVISIONAL · CHECK SOURCES'")
s=s.replace('RESEARCH PAGE READY','CONTENT RESEARCH PENDING')
s=s.replace('Recent films selected for family consideration, with Christian moral reflection and parental content information. A film\'s inclusion is not an endorsement.','A selection of recent releases to research and discuss. Inclusion is not an endorsement; reviews and age suggestions are provisional.')
s=s.replace('These pages include a preliminary spiritual verdict, age guidance, and source-based content notes.','105 provisional reviews with age guidance, Scripture references, family questions, and source links. All theological approvals remain pending.')
s=s.replace('The build now supports every movie page. The remaining work is deeper content verification, fuller source capture, and editor approval.','The 200-title library has no duplicate film records. Some pages have provisional assessments; other titles still need complete, film-specific content research and editorial approval.')
s=s.replace('a full Coptic Orthodox review has not been completed yet','a film-specific content review has not been completed yet').replace('evidence-backed Coptic Orthodox review','evidence-backed review')
s=s.replace('discuss the story through a Coptic Orthodox perspective','discuss the story through Christian spiritual discernment')
# Use live data for count rather than fragile hardcoded quantity.
s=s.replace('105 provisional reviews with age guidance', '${reviewedCount()} provisional reviews with age guidance')
# Patristic renderer; verified paraphrase with link, no invented quotation marks.
pos='function reviewedDetail(r){'
pat='''function faithReferences(r){
  const verse=r.themeScripture;
  const fathers=r.patristic;
  return `${verse?`<div class="faith-panel"><div class="eyebrow">Guiding Scripture</div><h3>${esc(verse.reference)}</h3><p>${esc(verse.connection||'Read this passage in its biblical context and discuss the relation to the film.')}</p><small>Reference and commentary, not a claim that the film teaches Scripture.</small></div>`:''}
  ${fathers?`<div class="faith-panel patristic"><div class="eyebrow">Wisdom from the Church Fathers</div><h3>${esc(fathers.author)}</h3><p>${esc(fathers.text)}</p><small>Paraphrase of <a href="${esc(fathers.url)}" rel="noopener noreferrer" target="_blank">${esc(fathers.work)}${fathers.section?' ('+esc(fathers.section)+')':''}</a> — not an exact quotation.</small></div>`:''}`;
}

'''
assert pos in s;s=s.replace(pos,pat+pos)
needle="${r.scripture?.length?`<div class=\"tag-row\">${r.scripture.map(s=>`<span class=\"tag\">${esc(s)}</span>`).join('')}</div>`:''}<h3 style=\"margin:27px 0 12px\">"
assert needle in s
s=s.replace(needle,"${r.scripture?.length?`<div class=\"tag-row\">${r.scripture.map(s=>`<span class=\"tag\">${esc(s)}</span>`).join('')}</div>`:''}${faithReferences(r)}<h3 style=\"margin:27px 0 12px\">")
# Add preliminary questions and scripture to review-pending pages, clearly labelled discussion prompts only.
needle='<p class="muted">Use the source links above as a starting point. Once enough evidence is gathered, draft the review in the editorial studio and publish it.</p></div></div>'
replacement='''<p class="muted">Use the source links above as a starting point. These are discovery links, not verified content references. Never treat an unlisted warning as evidence of absence.</p></div><div class="paper-panel detail-section"><div class="eyebrow">After watching · discussion starter</div><h2>Five questions for families</h2><p class="muted">These are general discernment prompts, not questions claiming knowledge of scenes we have not researched.</p>${(r.questions||[]).map((q,i)=>`<div class="q-item"><strong>${i+1}.</strong> ${esc(q)}</div>`).join('')}<div class="faith-panel"><div class="eyebrow">A starting Scripture</div><h3>Philippians 4:8</h3><p>Reflect together on what the story asks viewers to admire, and consider that message alongside this passage.</p></div></div></div>'''
assert needle in s;s=s.replace(needle,replacement)
# Honest review distinction on homepage; don't call everything researched.
s=s.replace('The Orthodox Lens review library','The Orthodox Lens review library')
# TMDB logo/attribution resource and source provenance explanation in About.
needle='<a class="text-link" href="#method">Learn how we evaluate movies →</a></div></div></section>`;'
replacement='''<a class="text-link" href="#method">Learn how we evaluate movies →</a></div><div class="paper-panel" style="margin-top:24px"><div class="eyebrow">Artwork and sources</div><h2>Original movie posters</h2><p>Movie-cover images are loaded from TMDB when a film can be reliably matched. This product uses the TMDB API but is not endorsed or certified by TMDB. <a class="text-link" href="https://www.themoviedb.org/" target="_blank" rel="noopener noreferrer">The Movie Database (TMDB)</a>.</p><p>Film-content references and our spiritual interpretations are separate. Content warnings must be verified with film-specific sources; Scripture and Church-Father citations are never presented as official Church judgments.</p><p class="muted">Verified patristic paraphrases link to the underlying text. We do not fabricate quotations. The complete 200-title library includes provisional reviews and research-pending titles; a page's presence does not mean that its review is approved.</p></div></div></section>`;'''
assert needle in s;s=s.replace(needle,replacement)
s=s.replace('This site primarily serves Christian families while remaining useful to all Christian families.','This site serves Christian families from diverse traditions and is not affiliated with a church or synod.')
p.write_text(s)

css=Path(__file__).parent/'public/styles.css';css.write_text(css.read_text()+'''\n/* V12: theological citations, minimal styling; original layout unchanged */\n.faith-panel{border-left:3px solid #b59a69;background:#f5f5ee;padding:16px 18px;margin-top:19px;border-radius:4px}.faith-panel h3{font-size:18px;margin:7px 0 9px}.faith-panel p{margin:0 0 8px}.faith-panel small{font-size:11px;color:#58665f}.faith-panel a{color:#285f4b;text-decoration:underline}.faith-panel.patristic{border-color:#618a76;background:#eef3ed}\n''')
print('patched',p)
