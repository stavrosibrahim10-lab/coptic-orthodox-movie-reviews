import {readFileSync, readdirSync} from 'node:fs';
import {marvelCatalog, catalogFilmKey} from '../public/marvel-catalog.js';
import {supplementalReviews, supplementalContentEvidenceById} from '../public/family-review-ratings.js';
import {getLgbtqTheme, withLgbtqTheme} from '../public/lgbtq-audit.js';
import {scriptureQuotes} from '../public/scripture-quotes.js';
import {sourceUrl, validateReview} from '../netlify/functions/_shared/core.mjs';

function readLegacyJson(path, declaration) {
  const text = readFileSync(new URL(path, import.meta.url), 'utf8').trimEnd();
  const start = text.indexOf(declaration);
  if (start === -1 || !text.endsWith(';')) throw new Error('Unexpected format in ' + path);
  return JSON.parse(text.slice(start + declaration.length, -1));
}

const seedReviews = readLegacyJson('../public/seed-reviews.js', 'const seedReviews = ');
const seedEvidence = readLegacyJson('../public/content-evidence.js', 'const contentEvidenceById = ');
const proposals = new Map();
const editorialDir = new URL('../editorial/', import.meta.url);
for (const file of readdirSync(editorialDir).filter(name => /^review-drafts-.*\.json$/.test(name)).sort()) {
  for (const proposal of JSON.parse(readFileSync(new URL(file, editorialDir), 'utf8'))) {
    if (proposals.has(proposal.id)) throw new Error('Duplicate proposal for ' + proposal.id);
    validateReview(proposal);
    proposals.set(proposal.id, {proposal, file});
  }
}

const screening = new Map();
const stage4 = new Map();
function addScreening(records, scoreKey, provenance, sourceCheck) {
  for (const record of records) {
    const score = record[scoreKey];
    if (Number.isInteger(score) && score >= 0 && score <= 5 && sourceCheck(record)) {
      screening.set(record.movie_id, {score, provenance});
    }
  }
}
const readEditorial = name => JSON.parse(readFileSync(new URL(name, editorialDir), 'utf8'));
const rollingArg = process.argv.find(arg => arg.startsWith('--rolling='));
{
  const rolling = rollingArg
    ? JSON.parse(readFileSync(rollingArg.slice('--rolling='.length), 'utf8'))
    : readEditorial('lgbtq-audit-checkpoint.json');
  for (const batch of rolling.stage4_batches ?? []) {
    for (const film of batch.films) stage4.set(film.movie_id, `batch ${batch.number}: ${film.status}`);
  }
  addScreening(rolling.batches.flatMap(batch => batch.films), 'proposed_score', 'rolling_proposal',
    record => record.sources?.some(sourceUrl));
}
addScreening(readEditorial('lgbtq-screening-2026-11-25.json'), 'studio_score', 'prior_studio_snapshot_pr_13',
  record => record.screening_status === 'numeric_score_verified_in_studio' && sourceUrl(record.source));
addScreening(readEditorial('lgbtq-screening-follow-up.json'), 'recommended_score', 'prior_studio_snapshot_pr_14',
  record => record.studio_status === 'saved_and_verified' && record.sources?.some(sourceUrl));

const films = new Map();
for (const film of [...seedReviews, ...supplementalReviews]) {
  if (films.has(film.id)) throw new Error('Duplicate review id ' + film.id);
  films.set(film.id, {film, review: film, type: seedReviews.includes(film) ? 'seed' : 'supplemental'});
}
for (const film of marvelCatalog) {
  if (!films.has(film.id)) films.set(film.id, {film, review: null, type: 'marvel_addition'});
  else if (catalogFilmKey(films.get(film.id).film) !== catalogFilmKey(film)) {
    throw new Error('Retained catalog film identity mismatch ' + film.id);
  }
}

const keys = ['sexual_content', 'language', 'violence', 'spiritual_material', 'substance_use', 'moral_themes'];
const hasText = value => typeof value === 'string' && value.trim().length > 0;
const sourceBackedCategory = category => {
  const source = category?.evidence?.some(entry => sourceUrl(entry.url));
  if (source && category.status === 'specific_findings_verified' && category.findings?.some(hasText)) return 'finding';
  if (source && category.status === 'source_reports_not_present') return 'scoped_absence';
  return 'open';
};

const identities = new Set();
const rows = [];
for (const [id, {film, review: baseline, type}] of films) {
  const identity = catalogFilmKey(film);
  if (identities.has(identity)) throw new Error('Duplicate title and year ' + identity);
  identities.add(identity);
  const proposal = proposals.get(id);
  if (proposal && catalogFilmKey(proposal.proposal) !== identity) throw new Error('Proposal identity mismatch ' + id);

  const review = proposal?.proposal ?? baseline;
  const warnings = proposal?.proposal.contentEvidence ?? supplementalContentEvidenceById[id] ?? seedEvidence[id];
  const categories = Object.fromEntries(keys.map(key => [key, sourceBackedCategory(warnings?.content_categories?.[key])]));
  const issues = [];
  if (!review) {
    issues.push('review_missing');
  } else {
    try {
      validateReview(withLgbtqTheme(review, {proposeVerdict: true}));
    } catch (error) {
      issues.push(error.message);
    }
  }
  const draftChecks = issues.length === 0;
  const rubricScore = getLgbtqTheme(withLgbtqTheme(review ?? {id, themes: []}))?.score ?? null;
  const prior = screening.get(id);
  const score = proposal && rubricScore !== null ? rubricScore : prior?.score ?? rubricScore;
  const screeningSource = proposal && rubricScore !== null ? 'new_proposal'
    : prior?.provenance ?? (rubricScore !== null ? 'repository_starter' : 'open');
  const scriptureRef = review?.themeScripture?.reference?.replaceAll('–', '-');
  const kjv = hasText(scriptureQuotes[scriptureRef]);
  const patristic = proposal
    ? hasText(review.patristic?.text) && sourceUrl(review.patristic?.url) ? 'quotation_proposed' : 'open'
    : sourceUrl(review?.patristic?.url) ? 'attribution_requires_exact_text_check' : 'open';
  if (Object.values(categories).includes('open')) issues.push('content_evidence_open');
  if (score === null) issues.push('on_screen_lgbtq_screening_open');
  if (!hasText(review?.reflection)) issues.push('reflection_missing');
  if (!kjv) issues.push('kjv_text_missing');
  if (!review?.biblicalParallels?.length) issues.push('film_specific_biblical_parallel_missing');
  if (patristic === 'open' || patristic === 'attribution_requires_exact_text_check') issues.push('patristic_quote_requires_review');
  rows.push({id, title: film.title, year: Number(film.year), type,
    draft: proposal?.file ?? (baseline ? 'repository_baseline' : 'missing'),
    draftChecks, lgbtqScore: score, screeningSource, kjv, patristic, categories, issues});
}
for (const id of proposals.keys()) if (!films.has(id)) throw new Error('Proposal has unknown id ' + id);

const counts = {
  catalog: rows.length,
  marvelAdditions: rows.filter(row => row.type === 'marvel_addition').length,
  proposedDrafts: proposals.size,
  hasReviewRecord: rows.filter(row => row.draft !== 'missing').length,
  noReviewRecord: rows.filter(row => row.draft === 'missing').length,
  failuresOfDraftValidation: rows.filter(row => row.draft !== 'missing' && !row.draftChecks).length,
  allSixCategoriesSourceLinked: rows.filter(row => !Object.values(row.categories).includes('open')).length,
  missingAnyContentCategory: rows.filter(row => Object.values(row.categories).includes('open')).length,
  noLgbtqScoreInAuditedFiles: rows.filter(row => row.lgbtqScore === null).length,
  priorRecordedStudioScores: rows.filter(row => row.screeningSource.startsWith('prior_studio_snapshot')).length,
  filmSpecificBiblicalParallelMissing: rows.filter(row => row.issues.includes('film_specific_biblical_parallel_missing')).length,
  patristicQuoteRequiresReview: rows.filter(row => row.issues.includes('patristic_quote_requires_review')).length,
  stage4EvidenceAuditRecorded: rows.filter(row => stage4.has(row.id)).length,
  allRepositoryChecksPass: rows.filter(row => row.issues.length === 0).length,
};

if (process.argv.includes('--summary')) {
  process.stdout.write(JSON.stringify(counts, null, 2) + '\n');
} else {
  const columns = ['id', 'title', 'year', 'catalog_group', 'draft', 'studio_draft_validator', 'lgbtq_score', 'lgbtq_record', 'kjv_guiding_text', 'patristic', ...keys, 'open_checks', 'stage4_evidence_audit'];
  const lines = rows.map(row => [row.id, row.title, row.year, row.type, row.draft,
    row.draftChecks ? 'pass' : 'open', row.lgbtqScore ?? 'unverified', row.screeningSource, row.kjv ? 'available' : 'open',
    row.patristic, ...keys.map(key => row.categories[key]), row.issues.join(' | '), stage4.get(row.id) ?? '']);
  process.stdout.write([columns, ...lines].map(line => line.join('\t')).join('\n') + '\n');
}
