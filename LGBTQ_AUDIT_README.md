# The Orthodox Lens — LGBTQ Themes & Messaging Scoring Update

**Prepared:** November 25, 2026  
**Status:** Local implementation tested; **not deployed**; **not applied to live Supabase drafts**.  
**Basis:** V13 Editorial Studio project plus the cumulative Emoji Movie, visible notes, and Studio Sync overlays.  
**Scope:** 200 seeded movie reviews + 1 supplemental *The Emoji Movie* review = **201** movie records.

## Editorial scale

| Score | Interpretation | Category disposition |
| --- | --- | --- |
| Not Verified | Film-specific screening has not yet established enough evidence | Pending; NOT 0/5 |
| 0/5 | Reviewed; no verified on-screen LGBTQ themes or messaging | N/A for this category |
| 1/5 | Brief reference, incidental depiction or brief explicit message | Neutral under this criterion |
| 2/5 | Minor relationship or occasional references | Destructive under the site's policy |
| 3/5 | Recurring relationship or significant secondary storyline | Destructive under the site's policy |
| 4/5 | Major character relationship or prominent theme | Destructive under the site's policy |
| 5/5 | Central storyline or sustained explicit advocacy | Destructive under the site's policy |

All values measure prominence of sourced on-screen content, not moral worth of people. Separate film-specific notes explain *what* appears. Off-screen comments and disputed readings are context, **not enough for a numeric finding**. Age guidance is a separate decision, and 1/5 does not override concerns independently supported by other categories.

## Catalog audit status

- **201 records** individually included in `data/lgbtq-audit-queue.json`, each with a review state.
- **7 source-backed proposed on-screen scores** prepared for editor confirmation.
- **194 titles Not Verified**: their score is intentionally `null`; no claim of no LGBTQ content is made.
- **0 proven 0/5 scores:** no comprehensive absence finding has been independently established in this pass.
- **0 published decisions or completed sign-offs**; no live Supabase account access was used.

| Score | Number of sourced proposed films |
| --- | ---: |
| 1/5 (Neutral category) | 4 |
| 2/5 (Destructive category) | 1 |
| 3/5 (Destructive category) | 1 |
| 4/5 (Destructive category) | 1 |
| 5/5 | 0 |
| Not Verified | 194 |

### Initial supported proposals

| Film | Proposed score | Category | Evidence |
| --- | --- | --- | --- |
| The Mitchells vs. the Machines (2021) | 1/5 | Neutral | [Film-specific evidence](https://aslc.union.fsu.edu/stargazer/mitchells) |
| Elemental (2023) | 1/5 | Neutral | [Film-specific evidence](https://www.pluggedin.com/movie-reviews/elemental-2023/) |
| Spider-Man: Across the Spider-Verse (2023) | 1/5 | Neutral | [Film-specific evidence](https://www.commonsensemedia.org/movie-reviews/spider-man-across-the-spider-verse) |
| Nimona (2023) | 4/5 | Destructive | [Film-specific evidence](https://www.pluggedin.com/movie-reviews/nimona-2023/) |
| Onward (2020) | 1/5 | Neutral | [Film-specific evidence](https://www.pluggedin.com/movie-reviews/onward-2020/) |
| Lightyear (2022) | 2/5 | Destructive | [Film-specific evidence](https://www.pluggedin.com/movie-reviews/lightyear-2022/) |
| Strange World (2022) | 3/5 | Destructive | [Film-specific evidence](https://www.commonsensemedia.org/movie-reviews/strange-world) |

**Source nuance:** *Spider-Man: Across the Spider-Verse* shows a background trans-pride flag message. The source supports that visible text but **not** a claim about Gwen's gender identity. *Zootopia 2* has an off-screen director statement about Bucky and Pronk, but the cited parental guide says the on-screen dialogue does not reveal a romance; the film remains **Not Verified** for on-screen scoring. [Source](https://www.pluggedin.com/movie-reviews/zootopia-2-2025/).

## Technical work completed

- Created a permanent `LGBTQ Themes & Messaging` rating with **Not Verified** display and an always-visible source note beneath the rating.
- Added the seven proposed scores as **provisional, source-linked starters**; 194 other movies display **Not Verified** instead of inaccurate `0/5`.
- Server validates that a score 2–5 can only save with **Destructive to Spiritual Wellness** as the overall verdict. Score 1 is Neutral **under that category**, and 0 is N/A **under that category**.
- Server blocks facts/age/spiritual sign-off and publication when the new category is missing or still **Not Verified**.
- Added a **one-click Studio initialization** for the owner that processes up to ten reviews per API request, resumes safely, preserves existing editor notes, ratings, other fields, closed flags, and existing published copies. Drafts that change lose prior signatures and return to review.
- Tests cover all 201, N/V handling, role restrictions, verdict enforcement, source requirements, preservation of published reviews, and safe retries.

## Loading into the live Editorial Studio

1. Deploy the ZIP **over a current V13 Studio Sync-based release** using your usual Codespace → GitHub PR → Netlify workflow. The ZIP contains only new/replaced application files and this audit report; it is not the complete source repository.
2. As the **Studio owner**, open **Editorial overview → LGBTQ Themes & Messaging — catalog scoring**, then click **Add 0–5 category to all Studio drafts**. This intentionally asks for confirmation because affected drafts lose prior sign-offs.
3. Let the on-screen progress complete, and check that it reports **0 errors**. If interrupted, pressing it again skips records that already have the category.
4. Open any seven scored films and check the source, 0–5 score, and verdict narrative. The other 194 remain in a research queue and **cannot be signed off until their film-specific screening is done**.
5. The public page refreshes from **published** Supabase review content after approval. Publishing is intentionally separate; no automatic public publication occurs.

**Limitations:** This is a full 201-record *catalog coverage and triage* pass, not a falsely claimed scene-by-scene verification of all 201 films. Detailed screening of the 194 queued films remains to be performed. There is no direct authenticated GitHub, Netlify, or Supabase connection in this runtime, so no remote production changes have been made.