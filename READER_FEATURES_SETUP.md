# The Orthodox Lens — Biblical Parallels, Reader Suggestions & First-Visit Guide

## Features

1. **Homepage:** a three-step "How to use The Orthodox Lens" guide appears immediately below the hero introduction, before verdict summaries and film collections. It explains editorial verdicts, 0–5 scores, content notes and the difference between reader suggestions and official ratings.
2. **Movie pages:** "Biblical parallels & Gospel reflections" displays film-specific, editorially reviewed connections (or the existing Scripture connection if the new entries have not yet been created). It clearly states that an analogy is *not* a claim of filmmakers' intent. Editors add scene details, Bible reference, explanation, and film-specific HTTPS source in Studio; saving resets sign-offs as usual.
3. **Public suggestions:** `#suggest` accepts a film request, biblical parallel, Gospel reflection, content correction or general site feedback. No visitor account or email address is required. Suggestions are private until approved; approved film-specific reader ideas appear on movie pages separately labeled from editorial review. Suggested ideas never automatically change ratings, verdicts, or review text.

## Deployment order — IMPORTANT

**The SQL migration must be applied before enabling visitor submissions.**

1. Review and run `supabase/migrations/20261125_reader_suggestions.sql` and then `supabase/migrations/20261126_reader_suggestions_title_only.sql` in the **existing** Supabase project's SQL Editor. The second migration enables title-only requests and refreshes the REST schema cache. It creates `studio_suggestions` with RLS, denies browser-side database access, and permits only service-role access from the existing Netlify function. No changes to existing movie review records are made.
2. Merge the GitHub PR after CI and Netlify Deploy Preview pass.
3. Sign in at `/studio/`, open **Reader suggestions** in the left navigation, and confirm the empty moderation queue loads.
4. On the public site, follow **Suggest an idea** and submit a short test idea. Confirm it appears as **pending** in Studio and is *not* public.
5. Approve the test idea in Studio and revisit its movie page. The reader contribution should now appear below the Gospel section, distinctly labeled.
6. Open a movie draft in Studio, add a Biblical Parallels entry (title, film moment, Bible passage, Gospel explanation, film-specific HTTPS supporting source), save and obtain the normal factual, age and spiritual sign-offs before publishing.

### Security and moderation behavior

- No unauthenticated moderation endpoints. Only active owner/editor roles can approve or reject suggestions. Reviewers may read queue but not moderate.
- The public API exposes only approved, film-linked suggestions and excludes internal notes and hashes.
- User prose and URLs are HTML-escaped on public pages. Source URLs must be HTTPS.
- Public submissions are capped at 1,800 characters; the API includes a honeypot, duplicate-content hash and a site-wide 60-per-10-minute submission cap. These are basic abuse controls, **not a complete anti-spam or DDoS solution**; use host-level protections if volume grows.
- No visitor sign-in or email requested, and the application does not persist IP addresses or form analytics. Hosting infrastructure may keep its own security logs.
- No existing published review or editorial approval is modified by this feature rollout. Saving a new Gospel parallel through Studio follows the existing approval-reset policy.

### Site URLs

- `/#suggest` — public suggestion page
- `/#suggest/<movie-id>` — same page with the film selected
- `/studio/` → **Reader suggestions** — moderation queue
- `/api/suggestions?action=approved&movie_id=<movie-id>` — public, approved suggestions only

## Validation

Run `npm test` (Node.js 22+). Tests cover submission validation, public/private separation, duplicates, same-origin restrictions, moderation roles and replay, biblical-parallel review validation, and public interface wiring.
