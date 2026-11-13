# The Orthodox Lens — V12

A Netlify-ready independent Christian film-review site informed by the historic Orthodox tradition, **not** an official publication or endorsement of any Church or synod.

See [V12_RELEASE_NOTES.md](V12_RELEASE_NOTES.md) for audited counts and important publication limitations.

- **200** nonduplicate movie entries with authentic poster lookup via TMDB
- **105** provisional, source-linked review pages with Scripture, ratings, age suggestions, warnings, and five discussion questions
- **95** film research pages without an assigned spiritual verdict or age rating; no unverified absence claims
- St. Basil patristic paraphrase with source for selected films
- About page, Philippians 4:8, pastoral direction, and preservation of existing visual design

## Deployment
Link the project root to the existing Netlify GitHub repository, with `netlify.toml` in the repository root. The public website files are in `public`; the poster endpoint is `netlify/functions/poster.mjs`. The TMDB v3 key must be defined in Netlify's server environment as `TMDB_API_KEY`, not committed to code.

## Preview
Standalone HTML preview of this build is distributed separately. It displays the real reviews and styled fallback covers. Dynamic poster lookup is available on Netlify because it requires the server-side TMDB function and configured secret.

## Editorial review
All verdicts remain preliminary. IMDb, Common Sense Media, and Dove are useful starting points but do not grant permission to reproduce full reviews. Only use authorized summaries and source-specific factual observations. Full theological sign-off, cross-checking of content warnings, and production AI editorial workflows are additional work.
