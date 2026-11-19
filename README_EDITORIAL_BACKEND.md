# The Orthodox Lens — V13 Editorial Studio

This release starts from the latest **V12 Stage 4 Quality Review, 18 November 2026** project ZIP. The existing homepage, About page, public review layout, 200 seeded movie assessments, 1,200 category slots of Stage 3 content evidence, and poster integration remain present. It adds a private editorial workflow at `/studio/`.

**Quick preview:** `node server.js` and open `http://localhost:3000/studio/`, then choose **Explore read-only preview**.

**To go live:** read **[SETUP_STUDIO.md](SETUP_STUDIO.md)**; create Supabase tables and owner Auth account, add credentials to Netlify, import 200 unapproved drafts/241 flags, and redeploy the existing GitHub-connected site. No secret credentials are stored in this ZIP.

New files: `supabase/migrations/*`, `netlify/functions/studio.mjs`, `netlify/functions/events.mjs`, `netlify/functions/_shared/core.mjs`, `public/studio/*`, `bootstrap/studio-import.json`, `scripts/seed-studio.mjs`, `tests/*`, `.env.example`.

**Stage 4:** technical preparation complete; 200/200 editor approvals pending. **Stage 5 not started.** No official Church endorsement claimed.
