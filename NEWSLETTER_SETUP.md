# Newsletter integration (first phase)
The existing homepage interest form is replaced on this branch by a native form posting to /api/newsletter. The function requests Brevo double opt-in and does not send marketing campaigns.

## Before merging
- Verify authenticated domain and sender in Brevo; use a monitored reply-to address.
- Configure BREVO_API_KEY (secret, production Functions only), BREVO_LIST_ID=3, and BREVO_DOI_TEMPLATE_ID (the active Brevo double opt-in email template ID) in Netlify. Use a confirmation template with the DOI link from Brevo's API documentation: https://developers.brevo.com/reference/create-doi-contact.
- Check that the template works with the API key permissions. No additional permission is assumed.
- Confirm existing Netlify interest form submissions separately; do not import or resubscribe people without appropriate consent.
- Run npm test and npm run build. Verify the production form with an address you control; confirm the address is added to list 3 only after clicking the email, check repeated submissions and previously unsubscribed contacts, and verify Netlify enforces the rate limit on the actual plan. If not, implement a supported anti-abuse alternative before enabling public registration.
- Verify privacy disclosures, unsubscribe behavior, mailing address, and sender/reply-to configuration before sending any newsletter.

## Follow-up phase
Build an AI draft generator from explicitly approved reviews, an editorial preview, a monthly scheduling mechanism with idempotency, opt-out checks, campaign analytics, and a disabled-by-default send switch. No automated campaign delivery is enabled by this PR. Test with a private list before allowing real sends.

## Newsletter popup and duplicate safeguards
Before merging the popup PR, run [supabase/newsletter_dedup.sql](supabase/newsletter_dedup.sql) once in the SQL editor of the Supabase project already connected to TOL. Verify both RPC functions exist and are callable only by service_role. Do not expose Supabase secrets or grant access to anonymous users. The production function needs the existing SUPABASE_URL and SUPABASE_SECRET_KEY values in its Functions scope. If storage is missing, signup fails closed rather than sending unprotected confirmation emails.

The signup checks normalized email membership and opt-out status in Brevo first. For eligible contacts, an atomic per-email/list claim prevents repeat DOI requests for 24 hours, even across devices and concurrent invocations. A definite upstream rejection releases its claim; ambiguous errors retain the claim. Old confirmation requests made before this deployment have no stored claim. Claims use an HMAC keyed by the existing Supabase secret (rotating it resets the cooldown keys). No plaintext email is stored in the cooldown table; expired claims older than seven days are cleaned during normal signup traffic. The popup opens after 12 seconds on the homepage, is dismissible, suppresses automatic prompts for seven days after viewing/dismissal or 30 days after submitting on that browser, and can always be opened from the footer or home CTA. It uses a native dialog with a standalone form fallback. Browser suppression is not the server duplicate safeguard.

Before enabling: run npm test and npm run build, check mobile and keyboard behavior, test two simultaneous requests for a fresh controlled address (including capitalization variations), confirm one email arrives, then confirm and submit again. Verify list #3 still has one record and no new confirmation is sent. Check existing unsubscribed contacts are not silently resubscribed. Verify the dedicated confirmation redirect still works. The mocked concurrency test does not prove the deployed SQL transaction works; validate it in the real database too. If Supabase configuration is unavailable, keep the existing production deployment until the migration is ready.
