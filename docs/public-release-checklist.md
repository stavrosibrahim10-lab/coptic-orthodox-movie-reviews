# Public discovery and trust release

## Verify before merge
- Node 22+: run npm test and npm run build. Build must generate unique movie URLs and sitemap entries; open several generated pages with JavaScript disabled.
- Check direct movie URL and legacy #review links, browser back, browse filters, sharing, mobile navigation and the skip link.
- Test at 320, 375, 768 and desktop widths; run Lighthouse accessibility/performance and inspect color contrast, keyboard focus, poster fallback and loading.
- Netlify deploy preview: confirm /movies/title-year/ returns 200, /sitemap.xml lists reviewed films, pending films are noindex, metadata/canonical URL are per-film, and Studio is not linked publicly. Confirm Studio APIs still require existing auth.
- Enable Netlify Forms and submit a real test registration; verify the submission in Netlify and consent value. Configure an email service, unsubscribe mechanism and privacy policy before any recurring sends.
- Confirm named editorial and theological reviewer identities, roles and consent before adding public credits. Do not describe provisional reviews as approved.
- Existing Stage 4 review data and approval queue are not changed by this release. Scripture examples on the homepage are general prompts, not new verified film-specific reviews.

## Deployment
Build command: npm run build; publish public. For local preview, run npm run build then npm start. Pre-rendered pages include the public catalog and, if the configured published-review API is available at build, approved review snapshots. Newly published reviews require a rebuild for refreshed static metadata and new URLs. Review-only pending pages are intentionally omitted from sitemap and marked noindex. After deployment, submit sitemap.xml in Google Search Console; crawling/indexing is not guaranteed.
