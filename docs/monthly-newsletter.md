# Monthly Film of the Month newsletter
The homepage interest form retains the original Netlify form name (film-of-the-week) to preserve existing registrations; its visible copy is monthly. It does not send emails or confirm subscriptions yet.

1. Create a Brevo account, authenticate the sending domain, set the sender name/address, create a monthly newsletter list and test list, and create a hosted signup form with explicit consent and double opt-in. Use the hosted URL to replace the interest form in a subsequent site change. Invite existing consented interest registrants to confirm subscription; do not add unconfirmed addresses to production sends.
2. Create an OpenAI API project/key with billing and budget alerts, and a Make account. Keep keys in Make connections, never in browser code or Git.
3. Create a monthly Make scenario: HTTP GET https://theorthodoxlens.org/api/newsletter-films; stop if response is not 200 or films is empty. The feed includes only published, editor-checked, approved Edifying reviews with suitable age and existing Scripture/question fields. Do not use subscriber information in AI prompts.
4. Select one eligible film, excluding previously sent film IDs using Make Data Store; stop if none. Check its canonical URL responds successfully. OpenAI drafts a short newsletter from its provided review fields, with no new facts, ratings, quotations or claims. Use structured output and a separate validation step; stop on unsupported claims or mismatched film ID. Insert the known film title, age, source URL and Scripture reference directly into a fixed Brevo template, not AI-generated links or HTML.
5. Create a Brevo email campaign targeting the test list first. Include unsubscribe and required sender/address information. Test double opt-in, content, link, mobile rendering, delivery and unsubscribe. Only switch to the confirmed subscriber list and automatic campaign sending after testing and explicit owner approval.
6. Configure monthly schedule (e.g. first day 10 AM America/New_York). Use a durable issue key YYYY-MM to prevent duplicate campaigns and store film IDs/campaign IDs and send status. On API failure or uncertain send state, stop and notify the owner; check campaign status before any retry. Keep draft-only mode until verified.
7. Brevo free plan has a daily send cap; upgrade if your confirmed list exceeds your available daily allowance. OpenAI API billing is separate from ChatGPT. Weekly sending is retired; no live automation is configured by this PR.

References: https://help.brevo.com/hc/en-us/articles/208771869-Create-a-sign-up-form-in-Brevo
https://apps.make.com/sendinblue
https://help.make.com/schedule-a-scenario
https://platform.openai.com/api-keys
