# Review completion audit

Snapshot refreshed November 26, 2026 against catalog commit `14d9bd48a9e37d1094237a43e4882292537e2409`.

| Check | Films |
| --- | ---: |
| Unique catalog entries | 315 |
| Newly added Marvel entries | 113 |
| Existing review records in the repository | 202 |
| New Marvel review drafts attached to this audit | 40 |
| Catalog titles still missing a review record | 73 |
| Records passing the Studio draft validator | 242 |
| Records with a source-linked entry in each of six content categories | 238 |
| Records with one or more open content categories | 77 |
| Entries with a numeric LGBTQ score in the files or prior Studio ledgers | 16 |
| Entries with open LGBTQ screening in the audited material | 299 |
| Records needing a film-specific biblical parallel | 275 |
| Records needing an exact or otherwise verified Church Fathers quotation | 275 |
| Records with a Stage 4 evidence audit proposal | 50 |
| Records passing every repository checklist item | 3 |

[Film-by-film results](review-completion.tsv) · [Marvel draft batch 1](review-drafts-marvel-batch-01.json) · [Marvel draft batch 2](review-drafts-marvel-batch-02.json) · [Marvel draft batch 3](review-drafts-marvel-batch-03.json) · [Marvel draft batch 4](review-drafts-marvel-batch-04.json) · [Marvel draft batch 5](review-drafts-marvel-batch-05.json) · [Marvel draft batch 6](review-drafts-marvel-batch-06.json)

The Studio draft validator checks required fields and rubric constraints. The content columns show whether the repository links an observation or an explicitly scoped absence in the six categories. They do not certify that reviewers watched every scene. The exact quotation field in the batch uses the existing KJV source table. Biblical parallels are editorial comparisons and carry their corresponding film source.

The numeric-score column distinguishes the new draft, the prior Studio snapshots in PRs [#13](https://github.com/stavrosibrahim10-lab/coptic-orthodox-movie-reviews/pull/13) and [#14](https://github.com/stavrosibrahim10-lab/coptic-orthodox-movie-reviews/pull/14), and the [rolling audit](https://github.com/stavrosibrahim10-lab/coptic-orthodox-movie-reviews/blob/editorial/lgbtq-audit-rolling/editorial/lgbtq-audit-checkpoint.json). Open scores stay open. Earlier Studio saves were recorded by those audits and did not constitute editorial approval.

The Stage 4 column links these rows to the [rolling checkpoint](https://github.com/stavrosibrahim10-lab/coptic-orthodox-movie-reviews/blob/0a38ec7947ce0f6f092b7bf7f5e0848b77405340/editorial/lgbtq-audit-checkpoint.json) by batch number. It records a saved proposal and leaves the original draft and verified-score columns intact. Run with `--rolling` to include these audits.

## Live evidence

The connected public `/api/reviews` endpoint returned HTTP 200 and zero Studio-published reviews. Legacy reviews can still display from the bundled public catalog. Current private Studio drafts and approval flags require an authorized Studio session or owner export. The 40 proposals are stored in this branch and have no live-save or sign-off claim.

## Reproduce

Run `node scripts/audit-review-completion.mjs --summary` from a checkout of this branch. To include the rolling branch’s checkpoint in the count, pass `--rolling=/path/to/lgbtq-audit-checkpoint.json`. Omit `--summary` to generate the TSV. Each subsequent draft batch belongs in `editorial/review-drafts-*.json` so the same audit includes it and rejects duplicate film proposals.
