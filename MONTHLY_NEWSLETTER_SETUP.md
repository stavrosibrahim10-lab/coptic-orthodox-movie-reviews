# TOL Monthly Lens — setup and operating guide

This feature is separate from the subscription popup and Stage 4. It is disabled unless NEWSLETTER_MODE is explicitly set. Do not enable automatic sending before checking a private test campaign. Do not put subscriber addresses, credentials, or API keys into GitHub.

## 1. Database
Run supabase/newsletter_editions.sql in the same Supabase project as Editorial Studio. It creates a private ledger with a unique key per month/audience, and no subscriber data. Check RLS and that anon/authenticated have no table access.

## 2. Brevo
Keep the existing opt-in subscriber list (BREVO_LIST_ID=3) and verified sender newsletter@theorthodoxlens.org. Create a new separate list called TOL Newsletter Test, containing only addresses controlled by the owner and explicitly consenting to the test. Note its ID. Ensure your existing key includes Email campaigns All and Contacts All. No modifications to the confirmation template.

## 3. Netlify production Functions variables
Reuse BREVO_API_KEY, BREVO_LIST_ID, SUPABASE_URL, SUPABASE_SECRET_KEY.
Add:
- OPENAI_API_KEY: production-only secret, created in the owner's OpenAI API project; separate API billing applies.
- NEWSLETTER_AI_MODEL: an available Responses API text model supporting JSON schema, e.g. gpt-6.2-sol if available in your API project.
- NEWSLETTER_REPLY_TO: real monitored reply-to email address.
- NEWSLETTER_POSTAL_ADDRESS: valid public mailing address of the newsletter sender (use a business address or legitimate PO box; do not put a private home address into GitHub).
- NEWSLETTER_TEST_LIST_ID: separate Brevo list ID, never 3.
- NEWSLETTER_MODE: initially test, or off until all configuration is complete.

Deploy after variable changes. Do not expose secrets to preview builds. The scheduled function is production-only, runs hourly; in test mode it creates at most one private test draft per upcoming month. A test list campaign is never automatically sent. Check Brevo Marketing > Campaigns for TEST — TOL Monthly Lens YYYY-MM. Manually preview/test-send only to your controlled addresses; verify the rendered content, links, footer, unsubscribe and sender. If the approved review source is empty the function skips generation; no seed/provisional review fallback.

## 4. Live draft
After test approval set NEWSLETTER_MODE=draft and redeploy. At 9am Eastern on any of the seven days before the first Saturday, the function creates the upcoming live draft if not already reserved. In draft mode it never sends. Inspect the campaign in Brevo; the first issue can be sent manually after checking its exact recipient list. Do not send an unreviewed edition.

## 5. Automatic delivery (optional after explicit owner activation)
Set NEWSLETTER_MODE=auto and redeploy after reviewing the test and confirming the account's sending quota. On the first Saturday at 9am Eastern, the function sends only the existing untouched live draft for that month, only if the configured list, sender, reply-to, content and published review snapshots still match. It does not create/send a late edition if the scheduled window is missed. Campaigns edited in Brevo, changed/withdrawn source reviews, missing draft or ambiguous results require manual review. Brevo handles opt-outs. 'sent' means Brevo accepted the send; delivery statistics are separate. Set NEWSLETTER_MODE=off to disable future runs; redeploy. An in-flight campaign cannot be recalled by changing the variable.

## 6. Reconciliation and analytics
Use Netlify Cloud compute > Functions > monthly-newsletter to inspect execution logs. Check the newsletter_editions table via Supabase SQL Editor and Brevo Marketing > Campaigns. 'creating' or 'sending' can mean an ambiguous API outcome; check the exact campaign name and ID in Brevo before taking any manual action. Never delete or reset a ledger row to retry without confirming whether the corresponding campaign exists or was sent. Do not manually duplicate monthly campaigns. Campaign report and subscriber analytics remain available in Brevo; a separate TOL dashboard is not implemented.

## Tests and limitations
Run npm test and npm run build before merging. Verify test draft in actual Brevo and the private list before enabling live delivery. The test suite uses mocked services and does not prove live API or database behavior. The scheduled runtime is bounded; timeouts fail closed or require reconciliation. AI writes only the introduction and general Christian reflection; movie details and age guidance are copied from published approved reviews; no invented citations, no user emails passed to AI. Automated checks cannot guarantee theological accuracy; review the first edition and use draft mode if per-issue editorial approval is desired. Website updates are intentionally omitted until an approved release-notes feed exists.
