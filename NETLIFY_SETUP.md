# Netlify poster deployment — Coptic Orthodox Movie Reviews

This package preserves the V10 site and adds Netlify Functions for `/api/poster` and `/api/reviews`.

## Existing Netlify project
1. Leave `TMDB_API_KEY` in Netlify's Environment variables under the Functions scope.
2. Put **the contents of this folder** at the root of a GitHub repository (ensure `netlify.toml`, `public/`, and `netlify/functions/` are at the top level; do not nest the entire project in another folder).
3. In Netlify, open the **existing** site, then under Project configuration → Build & deploy / Continuous deployment, connect that GitHub repository (labels may vary). Do not create a new site if you want to retain the existing `.netlify.app` address.
4. Confirm publish directory `public` and Functions directory `netlify/functions` (both are in `netlify.toml`). Trigger a deploy on the existing project.
5. Visit `https://YOUR-SITE.netlify.app/api/poster?title=Elio&year=2025`. Expected: JSON with `posterUrl` pointing to `image.tmdb.org`. Do not share the private API key; it never appears in this endpoint.
6. Visit the homepage and scroll to movie cards. Posters load lazily. If a title cannot be matched reliably, the branded cover stays.

## Limitations
- The site's existing static seed reviews work. The Node `server.js` admin studio and server-side AI draft APIs are NOT ported to Netlify; they require separate database/API integration. Do not imply the editor can save reviews in this Netlify version.
- A standalone HTML preview cannot use the Netlify Function. Test the deployed site instead.
- TMDB poster artwork is subject to its API/image terms and the original rights holders. Provide TMDB's attribution and applicable logo. Confirm licensing before commercial use.
- Git-based deployment is the recommended way to ensure the Netlify Function is built. A simple upload of the standalone HTML file does NOT deploy a Function.
