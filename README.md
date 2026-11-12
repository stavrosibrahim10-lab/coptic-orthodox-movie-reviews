# Coptic Orthodox Movie Reviews — working MVP

A deployable, dependency-free Node.js web application. Includes a responsive movie browsing website, three spiritual-wellness verdicts, 0–5 theme ratings, independent age guidance, full review pages, and a password-protected AI editorial drafting workflow.

## Run locally

Requires **Node.js 20+**.

```bash
cd orthodox-lens
cp .env.example .env  # reference only; the server DOES NOT automatically load this file
export ADMIN_PASSWORD='a-very-long-unique-secret'
export OPENAI_API_KEY='your-openai-api-key'
export OPENAI_MODEL='gpt-4.1-mini'
node server.js
```

Open **http://localhost:3000**.

Windows PowerShell:

```powershell
$env:ADMIN_PASSWORD='a-very-long-unique-secret'
$env:OPENAI_API_KEY='your-openai-api-key'
node server.js
```

For a production host, configure the same values as environment variables in the hosting dashboard. The `.env.example` file shows required configuration, but `server.js` intentionally reads environment variables only. This avoids accidentally committing secrets.

## Pages

- `#home` — homepage, search, classifications, featured review previews.
- `#browse` — responsive movie catalog with search and filters.
- `#review/<id>` — verdict, age guidance, theme breakdown, content guide, Orthodox reflection, discussion prompts, and sources.
- `#method` — complete editorial methodology.
- `#admin` — password-protected editorial tools; create drafts with OpenAI, edit JSON, save pending, or approve/publish.

## Research-backed catalog (November 2026)

The static catalog contains movie identification records without invented spiritual ratings.
The `public/seed-reviews.js` file now includes **81 provisional movie reviews**, including **8 additional original drafts** based on the film metadata and parental content guidance from **Common Sense Media, IMDb, Dove.org, and BBFC**, where available.

- Each source is listed at the bottom of the specific review page.
- The 0–5 scores, site age guidance, Orthodox reflections, and overall verdicts are **independent, provisional editorial interpretations**, NOT ratings assigned by the source websites or authoritative declarations of the Coptic Orthodox Church.
- Do not copy another publisher's review text or artwork. Obtain permission or a suitable license for movie posters and commercial reuse of API datasets.
- An external source being linked does **not** mean its entire parental-content taxonomy has been exhaustively verified. An omitted warning is not evidence that a category has zero content.
- This website does **not** automatically crawl IMDb, Dove.org or Common Sense Media. Editorial staff must research and cite additional movies or integrate licensed APIs.

## How AI drafting works

1. The editor enters title and release year, at least 120 characters of checked evidence, and source labels.
2. `POST /api/admin/generate` submits *only that evidence* to OpenAI. `OPENAI_API_KEY` stays server-side.
3. The model follows the balanced 35/30/25/10 editorial rubric and returns a structured draft, explicitly marking uncertain themes as `null`.
4. The human editor checks details, adds complete source citations/URLs in the JSON editor, and saves to a pending state.
5. The editor must deliberately click **Approve & publish**. Basic structural checks prevent completely unsupported publication.

**Limitations:** The application does not watch films, automatically license transcripts, or pull verified parental guides. AI cannot reliably identify every scene from plot summaries. Editors must independently check and verify claims; the code validates structure but not whether a source truly supports a claim. The theological library and expert editorial approval are not yet implemented. This is an independent resource, not an official Church publication.

## Backend endpoints

- `GET /api/reviews`: published movie reviews (public).
- `GET /api/admin/reviews`: all reviews, requires `X-Admin-Password`.
- `POST /api/admin/generate`: grounded AI review draft, requires admin password.
- `POST /api/admin/save`: save pending or published review, requires admin password.

Reviews are saved atomically to `data/reviews.json`. **Use a persistent writable disk on the host**. Many serverless deployments have ephemeral filesystems, so they are unsuitable without changing storage to a database. This demo is for a single administrator, not simultaneous editing. For a full public launch, add a database, stronger identity/session management, abuse protection/rate limits, source provenance validation, and a production privacy/security review.

## Publishing

Deploy to a Node.js-capable host with a persistent volume (for example a VPS). Set the start command to `npm start`, environment variables `ADMIN_PASSWORD`, `OPENAI_API_KEY`, and a persistent `DATA_FILE` path. Place behind HTTPS. The included app is **not automatically deployed** and does not come with a domain.

## Optional offline preview

The included `public/index.html` uses local relative JS/CSS paths. For the closest accurate preview, start the Node server. You may open the separately supplied `website-preview.html` in a browser to see a static offline preview of the homepage, browse and review UI; AI generation and publishing require the backend.

## Editorial meaning

- **Edifying:** strongly encourages Christian virtue and spiritual growth.
- **Neutral:** mixed or primarily recreational; may still have age concerns.
- **Destructive to Spiritual Wellness:** dominant message glorifies serious wrongdoing, persistently undercuts Christian virtue, or severe content warrants overriding spiritual concern.
- **Review Pending:** internal uncertainty state, **not** a fourth spiritual verdict.

Theme scores: 0 verified absent, 1 minimal, 2 limited, 3 significant, 4 strong, 5 defining, `null` unverified. Scores describe intensity/prominence and are **not** moral approval. Content framing is assessed separately. Suggested ages: All Ages, 7+, 10+, 13+, 16+, 18+, Not Recommended.


## Real-film starter catalog (November 11, 2026 update)

The source file `public/seed-reviews.js` includes **68 real films** (2024–2026) with BBFC content guidance, preliminary spiritual theme analysis, suggested ages, Scripture reflection prompts, and source links. Real-film seed reviews are **provisional** editorial work, **not human-approved theological evaluations**, and they must be reviewed before public production launch.

The home page includes **Best recent movies for family consideration**, a curated shelf based on recent family-film coverage and the website's faith-centered discussion goals. It is not a quantitative critic-score ranking. The label 'Best' means editor-selected recent films worth considering, not necessarily all classified as edifying.

The public catalog shows seeded real films (instead of the former fictional demo films). The six fictional demos remain in source only as test fixtures but do not appear on the live browsing pages. A published editorial record supersedes a seeded film with the same name and year.

BBFC classification content and independent spiritual interpretation are displayed distinctly. Other useful reading: https://www.timeout.com/film/best-family-movies-of-2026-so-far and https://www.rogerebert.com/collections/the-best-family-films-of-2026. Reconfirm movie facts and sources when publishing.

## Catalog backfill (November 2026)

`public/movie-catalog.js` contains **141 actual movie title/year entries** created for discovery and staged research. These are **not verified content reviews**, and they have no spiritual verdicts, content assessments, or age guidance. Existing 10 sourced, provisional movie reviews are preserved and take precedence over catalog placeholders. Published editor-approved reviews supersede both.

The homepage 'Best Recent Movies to Consider' shelf is curated from the source-linked provisional review set, not derived from a numeric critic ranking. It can be updated by changing `featured` and movie order in `public/seed-reviews.js`. This version does **not** automatically refresh external film rankings and should not be described as live.

### Posters and licensing

The site uses custom typographic placeholder cards rather than copying copyrighted posters. TMDB permits noncommercial API access with attribution, including their required notice and logo, but commercial use requires arranging a license directly with TMDB. See https://developer.themoviedb.org/docs/faq. Do not add third-party posters without checking the terms.

### Next launch phases

1. Integrate a legally authorized movie metadata/poster provider, with attribution.
2. Add a durable database and editorial workflow to work through the research queue.
3. Source parental content facts for each entry and generate AI drafts from that evidence, marking uncertain data unverified.
4. Have an informed Coptic Orthodox editor approve each verdict, age recommendation, and Scripture application.
5. Deploy to HTTPS with domain, metrics and privacy policy; add scheduled editor-run updates for the recent shelf.

## Version 7: 68 provisional reviews and automatic movie posters

- `public/seed-reviews.js` now contains **68 provisional, original Coptic Orthodox assessments**.
- 25 new preliminary reviews from 2025–2026 were added in `public/batch2-review-data.json`. Their linked sources often support **only the film premise and broad concerns**, not a complete scene-by-scene review. These are explicitly marked *preliminary*. 0–5 scores in this batch reflect *provisional theme interpretations*, and unknown content categories remain N/V (`score: null`). Human editorial verification is necessary before public claims of completeness.
- Every poster tile attempts a real movie poster from **TMDB** on the live Node server, lazily as it approaches the viewport. Search requires **exact title + year** matching and refuses unmatched candidates rather than showing the wrong artwork. A styled fallback remains when there is no safe match.
- Configure `TMDB_API_KEY` in the server environment for the poster lookup. Both TMDB API v3 keys and v4 read-access tokens are supported. Example: `export TMDB_API_KEY='your-key-or-read-access-token'`.
- Film posters are loaded from TMDB's CDN at runtime, **not copied, bundled, or redistributed**. TMDB requires attribution and permits its developer API for *noncommercial* applications subject to its terms. If the website is commercial, arrange the appropriate commercial license before activating this source. See https://developer.themoviedb.org/docs/faq. Artwork rights may have additional constraints.
- The standalone file preview is fully usable for search/reviews offline but intentionally uses the designed fallback cover tiles; it does not have a configured TMDB backend.
- The app footer now includes TMDB attribution. This product is **not endorsed or certified by TMDB**.

## V8 poster handling and review updates

- The **original header, layout, spacing, and review design have been preserved**.
- `public/poster-manifest.js` adds direct external links to **eight verified published promotional posters** (not AI-generated artwork). These URLs load over the internet and may go offline or block hotlinking. Review the applicable artwork permissions before distributing or monetizing the site.
- The built-in `/api/poster` endpoint remains available for the **rest of the catalog** when `TMDB_API_KEY` is set on the server. It matches title and year before supplying TMDB's actual published poster artwork. No image is fabricated. For live use, display TMDB's required attribution and confirm license eligibility, especially if the website is commercial.
- The standalone HTML preview uses the verified URLs in the poster manifest. Without a configured TMDB key and running Node server, other films show a neutral fallback cover; do not mistake it for official art.
- Eight additional original, provisional, evidence-linked reviews were added: The Mitchells vs. the Machines, Wonka, Elemental, Transformers One, Spider-Man: Across the Spider-Verse, The Garfield Movie, Migration, and The Magician's Elephant. That brings the included provisional reviews to **76**. The new film summaries are independently paraphrased from linked Common Sense Media guidance and require editorial review before public publication.
- Individual content categories that have not been comprehensively verified remain `null` (N/V), never silently marked absent.


## Version 9 editorial and display updates

- Preserves the existing light header, hero, typography, movie card layout, and review structure.
- Restores three spiritual-wellness classification cards on the homepage instead of catalog-count cards.
- Removes the oversized provisional notice from the top of movie reviews while retaining transparency in each review's Evidence & Sources panel.
- Adds pastoral guidance recommending consultation with one's father of confession or parish priest. All assessments are suggestions, not spiritual direction.
- Enlarges every Neutral movie's post-viewing discussion prompts to five, with questions on values, moral framing, and Orthodox discernment.
- Adds five BBFC-researched, original provisional movie reviews: The Bad Guys (2022), Sing 2 (2021), Ratatouille (2007), Despicable Me (2010), A Bug's Life (1998).
- Uses **authentic published movie posters** rather than AI-generated artwork where available, with eight verified poster URLs in `public/poster-manifest.js`; optional TMDB lookups for other films require `TMDB_API_KEY`. Offline HTML cannot call the poster API, but URLs from the manifest will load where the browser permits remote images. Unavailable posters get branded text placeholders, not fabricated movie art. Poster copyright and image licensing must be reviewed before commercial publication.

All film verdicts and ages are proposed independent editorial judgments, not an official Coptic Orthodox Church assessment.

## Version 10 — editorial verification and expanded source-backed reviews

- Preserves Version 9's exact header, homepage spiritual-classification cards, page structure and visual styling.
- Adds **12 original provisional reviews** linked to film-specific official BBFC content-classification pages: Finding Dory, Incredibles 2, Cars, The Secret Life of Pets, Shrek, The Lego Movie, Brave, Up, Shrek 2, The Lego Batman Movie, Monsters University, and The Little Mermaid (2023 Disney live action). New reviews contain balanced provisional verdicts, 0–5 theme scores, explicit source-identified content cautions, age guidance, Scripture references and 5 family discussion questions.
- **93 provisional reviews** across **172 unique movie pages**, with **79 catalog-only pages awaiting review**. None is yet recorded as theologically approved.
- Adds `public/v10-source-audit.json` recording verification limits. Existing 81 reviews are marked `partial_external_guidance` and `theologicalApproval: pending`, NOT finalized. Official BBFC evidence supports the notes that are actually documented, not the absence of every other type of content.
- Administrative publishing now requires `contentVerification: "editor_checked"`, `theologicalApproval: "approved"`, and `theologicalApprovedBy` naming the qualified Coptic Orthodox reviewer, as well as source URLs and review evidence. These fields must reflect real checks, not a formality. Drafts may remain pending until verification is completed.
- Site parent guidance explicitly states unlisted content categories are **not verified** rather than absent.
- Published movie posters are only used via the existing direct external manifest (8 selected movie posters, subject to rights and hotlink availability) or the TMDB search endpoint when `TMDB_API_KEY` is configured. The included offline HTML cannot perform API lookups. No image-generation substitutes or scraped poster downloads were added. TMDB requires attribution and permits its developer API for noncommercial purposes; commercial use requires a commercial license, and third-party artwork may have its own rights.

**Not completed by V10:** all 79 outstanding reviews, full content-category verification for all films, permanent poster coverage without TMDB credentials, or qualified human theological approval. These cannot be claimed as verified solely from public snippets or an automated script. The website remains a working development version rather than an ecclesiastically approved guide.
