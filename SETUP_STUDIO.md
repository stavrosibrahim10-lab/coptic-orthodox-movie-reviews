# The Orthodox Lens — Editorial Studio deployment & approval guide

**Build:** V13 Editorial Studio over the latest November 18 V12 Stage 4 quality-review frontend, with the original Stage 3 six-category evidence ledger intact. **The backend code is built, but no live database, accounts or deployment are connected in this ZIP.** None of the 200 reviews has been automatically approved or published.

## 0. See the interface now (no accounts required)

On Windows, extract this ZIP completely. Install Node.js **22+** if needed. Open the extracted folder containing `server.js`, click the address bar in File Explorer, type `cmd` and press Enter, then run:

```cmd
node server.js
```

Open **http://localhost:3000/studio/** and select **Explore read-only preview**. This displays the real 200-film draft library and the 241 outstanding audit flags. Preview actions cannot save, sign off or publish. Visit **http://localhost:3000/** to see the unchanged public review site and Stage 3 content warnings. Leave the terminal open while using the local website.

You no longer need the old single-password `ADMIN_PASSWORD` editor. The old `/api/admin/...` endpoints are disabled in this release.

## 1. Create the production database and owner login

1. Create a new project at **https://supabase.com/dashboard** (or select a project you control). Choose a strong database password and protect the Supabase account with MFA. Use **Project URL** `https://<project-ref>.supabase.co`.
2. In Supabase **SQL Editor**, run the entire file `supabase/migrations/20261118_editorial_studio.sql`. This creates `studio_reviews`, `studio_members`, `studio_issues`, `studio_revisions`, `studio_events`, and `studio_activity`, with Row Level Security enabled and no anonymous/editor direct table permissions. The API is accessed only through Netlify Functions.
3. In **Authentication → Providers → Email**, use email/password auth. **Disable public signups** for this invite-only studio. Then in **Authentication → Users**, create/invite *your own* email account and set a strong password through the resulting invite flow. Verify your email first.
4. In SQL Editor, run this separate statement after you have an Auth user. Replace only `YOUR_EMAIL@example.com` with the email you used and choose a display name:

```sql
insert into public.studio_members (user_id,display_name,role)
select id,'Editor-in-Chief','owner'
from auth.users
where lower(email)=lower('YOUR_EMAIL@example.com')
on conflict(user_id) do update set role='owner',active=true;
```

5. In **Authentication → URL Configuration**, set the **Site URL** to your actual published `/studio/` address and add it to the allowed redirect URL list. This lets emailed team invitations and password reset links return to the Studio, where editors can set their password.
6. Verify the statement affected **one row**. If it affected zero, the Auth user does not yet exist or the email is incorrect. Do not enable open public signup to solve this.

**Current Supabase key guidance (2026):** use a publishable key (`sb_publishable_...`) and a secret key (`sb_secret_...`), not the legacy anon/service-role JWT keys. **Do not paste the secret key in chat or put it into a public file or GitHub.**

## 2. Configure Netlify environment variables

In your existing Netlify site, go to **Site configuration → Environment variables** (UI wording may differ) and add:

| Key | Source | Visibility |
|---|---|---|
| `SUPABASE_URL` | Supabase Project URL | Server only |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase API Keys | Safe public key, but stored server-side here |
| `SUPABASE_SECRET_KEY` | Supabase API Keys | **Secret. Functions only.** |
| `STUDIO_PUBLIC_URL` | Existing production Studio URL, such as `https://YOUR_SITE.netlify.app/studio/` | Public URL, stored server-side |
| `TMDB_API_KEY` | Existing TMDB secret/token | **Secret. Functions only.** |
| `OPENAI_API_KEY` | Optional key for *AI Assistant* | **Secret. Functions only.** |
| `OPENAI_MODEL` | Optional model name, default `gpt-4.1-mini` | Server configuration |

Environment variables must be configured through Netlify's UI/CLI, not in `netlify.toml`; Netlify Functions do not receive values defined there as runtime secrets. Redeploy after changing the environment variables.

## 3. Import the original 200 reviews and Stage 4 flags

This is required **once**, after the database tables exist. The importer is **idempotent and non-destructive**: running it again skips existing movie IDs and issue keys rather than overwriting editorial changes.

On your own computer in the extracted project folder:

1. Copy `.env.example` to `.env.local`. Add the **three Supabase values** from step 2 to `.env.local`. Keep this file private and **never commit it**.
2. In Command Prompt, run:

```cmd
npm run studio:seed
```

The importer reads `bootstrap/studio-import.json` and creates **200 unapproved review drafts** and **241 open audit flags**, consisting of **165 source-to-claim reviews and 76 age-suitability checks**.

It does **not** mark the reviews published, overwrite the existing public website or grant any human approvals. The original Stage 3 six-category evidence remains in `public/content-evidence.js`, where the editor and public frontend display it.

## 4. Deploy this upgrade to the existing website

This ZIP is a replacement project directory, **not a deployment**. Preserve your existing GitHub repository and Netlify connection. From the repository checkout, copy the updated project files into the working tree, **excluding your `.env.local` and all personal secrets**, then commit and push the change. For example, if you already have Git configured:

```cmd
git status
git add -A
git commit -m "Add secure Orthodox Lens Editorial Studio"
git push
```

If you do not have a local Git checkout, use GitHub Desktop to clone and push your existing repository rather than creating a second Netlify site. Your existing Netlify GitHub integration should deploy the update after the push; check the Netlify deploy log for errors.

Open **https://YOUR_EXISTING_NETLIFY_DOMAIN/studio/**. Sign in with your Supabase user email and password. The Studio should show 200 films. The public site remains at `/` and the original `/api/poster` TMDB function is preserved. Do not change the current domain just to add the Studio.

**Security before launch:** test with two browsers/accounts that an anonymous visitor cannot read `/api/studio?action=bootstrap`, that non-owners cannot publish, and that your Netlify Function logs never print credentials. Consider enabling Supabase MFA and adding an MFA-enrollment flow before broader team use; this release implements secure password authentication and roles, **not in-app MFA enrollment**.

## 5. Your actual approval workflow

1. Open **Editorial Studio → Approval queue**. Filter for **With open issues**.
2. Open a film. The review editor shows the current provisional verdict, age recommendation, theme scores, sources, family questions, and the unchanged Stage 3 evidence findings.
3. In **Stage 4 evidence queue**, open each source or age flag, inspect the underlying film-specific material, then enter a **written explanation** and click **Mark resolved**. Owners alone can **waive with reason**; do not waive a genuine factual uncertainty just to empty the queue.
4. Edit the review as needed. Click **Save draft**. This deliberately clears old fact/age/spiritual approvals and reopens any previously resolved flags for the film, so the changed review is checked again.
5. Sign off separately on **Content & factual review**, **Age guidance review**, and **Spiritual interpretation**. Editors can sign facts and age; reviewers can sign the spiritual judgment; the owner can sign all three (though a second reviewer adds independence).
6. The owner clicks **Publish approved version** only when all three are signed, every flagged check is resolved/justifiably waived, and required source-backed fields pass validation. This adds a published record to the database; the public `/api/reviews` endpoint overlays that approved version over the existing provisional site review, usually within the 60-second cache window.
7. Use **Revision history → Restore draft** if necessary. Restoring creates a new unapproved draft and **does not immediately change the live published review**. The previous live version stays in place until a revised draft is reapproved and republished.

**Important:** all 200 imported reviews retain the label *provisional* until they pass the review process. The Studio is a management tool, not a substitute for personally viewing the correct film cut where necessary and confirming that the spiritual judgment is sound. It does not convey Church/Synod approval.

## 6. Dashboard, analytics, team and AI drafting

- **Overview:** movie count, published progress, unresolved claims and age flags, provisional verdict mix, recent editorial activity.
- **Approval queue & Movie Library:** searchable catalog and individual editing forms, including sources, theme evidence, age guidance, warnings, Scripture, and family questions.
- **Research & Sources:** exactly 241 imported Stage 4 priority flags, each requiring recorded disposition.
- **Analytics:** movie pageview counts, search-event counts, zero-result queries, top movies and popular search phrases over 7/30/90 days. Custom events contain no visitor IP, account ID or cookies. These figures represent *events*, not unique people, and may be affected by bots/ad blockers. Analytics start at zero and only accumulate after deployment. Search terms may contain sensitive text; avoid sensitive user queries and follow applicable privacy obligations.
- **Team:** the owner can invite editors or spiritual reviewers; email invitations and password reset links return to the `/studio/` page to set a password. The owner can change account roles and active status. Editors cannot publish. There is no public registration.
- **AI Assistant:** optional `OPENAI_API_KEY` lets an editor request a **draft suggestion from evidence they supply**. The AI does not browse films, auto-approve or publish. Applying proposed language loads it as unsaved edits; all human sign-offs still apply.
- **Backup:** owner can export current draft and published review records as private JSON. Keep backups secure; this export does not automatically include the full source-audit event log.

## 7. Production checklist

- [ ] Supabase migrations applied successfully.
- [ ] Auth account created and owner role assigned; sign-in works.
- [ ] 200 records and 241 flags imported; `studio:seed` can be rerun without duplicate writes.
- [ ] Netlify Functions have required environment variables; no secret committed to Git.
- [ ] Site deployed on *existing* domain and poster integration checked.
- [ ] Owner can edit/save a draft, resolve flags, and add fact/age/spiritual sign-offs.
- [ ] Reviewer permissions checked using a secondary account; only owner may publish.
- [ ] A signed-off test review publishes and appears on its public movie page.
- [ ] Analytics show test movie views and search events (no unique visitor claim).
- [ ] One saved draft restored from revision history without silently replacing its published version.
- [ ] All 200 editorial approvals completed before declaring Stage 4 **publication-approved**.

## Known boundaries

This package has not been connected to your Supabase account or deployed to GitHub/Netlify. Database migration, mail delivery, Netlify runtime environment, actual end-user credentials, and live published-page changes require deployment and live tests. Website structural tests can pass without providing the independent source review and theological approval you still need.

### Official docs used for architecture

- Supabase current API keys: https://supabase.com/docs/guides/getting-started/api-keys
- Supabase RLS: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase Auth getUser: https://supabase.com/docs/reference/javascript/auth-getuser
- Netlify Functions: https://docs.netlify.com/build/functions/get-started/
- Netlify Function environment: https://docs.netlify.com/build/functions/environment-variables/
