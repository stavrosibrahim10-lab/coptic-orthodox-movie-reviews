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
