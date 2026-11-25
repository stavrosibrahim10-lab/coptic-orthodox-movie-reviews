// Orthodox Lens catalog-wide editorial screening starter. The score is PROMINENCE,
// not an objective measure of a person's moral worth or evidence of advocacy.
// Only film-specific, sourced on-screen observations receive a numeric score.
export const LGBTQ_THEME_NAME = 'LGBTQ Themes & Messaging';
export const LGBTQ_SCORING_GUIDE = [
  '0/5 — Screened; no verified on-screen LGBTQ finding (N/A for this category)',
  '1/5 — Brief reference, introduction, or incidental scene (Neutral for this category)',
  '2/5 — Minor relationship or occasional references (Destructive under site policy)',
  '3/5 — Recurring relationship or significant secondary storyline (Destructive under site policy)',
  '4/5 — Major character relationship or prominent theme (Destructive under site policy)',
  '5/5 — Central storyline or sustained explicit advocacy (Destructive under site policy)'
];
export const LGBTQ_UNVERIFIED = 'Not Verified — film-specific screening is pending. No absence claim is made.';

// Verified on-screen specifics. Film IDs mirror the V13 Studio canonical IDs.
// Keep source, observation, and score together; interpretive/off-screen comments
// do not on their own qualify for a numeric on-screen score.
export const LGBTQ_VERIFIED_STARTERS = Object.freeze({
  'v8-2023-elemental': {
    score:1,
    note:'During a family dinner Wade introduces Lake and Lake’s girlfriend, Ghibli. This is a brief relationship reference; it is not a central plotline.',
    source:'https://www.pluggedin.com/movie-reviews/elemental-2023/',
    sourceLabel:'Plugged In parental guide'
  },
  'catalog-2020-onward': {
    score:1,
    note:'Officer Specter briefly mentions her girlfriend during a conversation. This is an incidental line.',
    source:'https://www.pluggedin.com/movie-reviews/onward-2020/',
    sourceLabel:'Plugged In parental guide'
  },
  'v8-2021-the-mitchells-vs--the-machines': {
    score:1,
    note:'Near the ending Katie’s mother asks about Katie and Jade dating. The relationship is stated briefly rather than developed as a main plotline.',
    source:'https://aslc.union.fsu.edu/stargazer/mitchells',
    sourceLabel:'FSU film commentary'
  },
  'v8-2023-spider-man--across-the-spider-verse': {
    score:1,
    note:'A background poster uses a transgender pride flag and reads “Protect Trans Lives.” This is a brief explicit on-screen message, not confirmation of a character’s gender identity.',
    source:'https://www.commonsensemedia.org/movie-reviews/spider-man-across-the-spider-verse',
    sourceLabel:'Common Sense Media parental guide'
  },
  'catalog-2022-lightyear': {
    score:2,
    note:'Alisha Hawthorne tells Buzz about marrying Kiko; their relationship and a brief kiss appear within the repeated time-passing family montage. The marriage is secondary to Buzz’s main mission.',
    source:'https://www.pluggedin.com/movie-reviews/lightyear-2022/',
    sourceLabel:'Plugged In parental guide'
  },
  'catalog-2022-strangeworld': {
    score:3,
    note:'Ethan’s romantic interest in Diazo recurs during the adventure, including conversations about asking him out and an ending that presents them as a couple. This is a secondary storyline.',
    source:'https://www.commonsensemedia.org/movie-reviews/strange-world',
    sourceLabel:'Common Sense Media parental guide'
  },
  'catalog-2023-nimona': {
    score:4,
    note:'Ballister and Ambrosius are principal characters in an established romantic relationship and share a kiss; their relationship materially informs their central conflict.',
    source:'https://www.pluggedin.com/movie-reviews/nimona-2023/',
    sourceLabel:'Plugged In parental guide'
  }
});

// Place only film-specific LGBTQ-related notes alongside the LGBTQ rating.
// Creator inspiration and allegorical interpretation are context, not proof of
// an on-screen depiction, and never set the 0–5 score by themselves.
export function isLgbtqRelatedAdvisory(type, note){
  if(!note || typeof note.details!=='string' || !note.details.trim())return false;
  if(type==='representation')return true;
  if(type!=='interpretation' && type!=='advocacy')return false;
  return /\b(?:LGBTQ(?:IA)?\+?|LGBT|gay|lesbian|bisexual|queer|transgender|non[- ]?binary|same[- ]sex|sexual orientation|gender identity|coming[- ]out)\b/i.test(note.details);
}

export function getLgbtqTheme(review){
  return (review?.themes||[]).find(t=>t.name===LGBTQ_THEME_NAME);
}
export function lgbtqImpact(score){
  if(score===null||score===undefined)return 'not_verified';
  if(score===0)return 'not_applicable';
  if(score===1)return 'neutral';
  if(Number.isInteger(score)&&score>=2&&score<=5)return 'destructive';
  return 'invalid';
}
export function starterLgbtqTheme(movieId){
  const finding=LGBTQ_VERIFIED_STARTERS[movieId];
  return {
    name:LGBTQ_THEME_NAME,
    type:'context',
    score:finding?.score??null,
    portrayal:finding?'descriptive':'unverified',
    evidence:finding?.note||LGBTQ_UNVERIFIED,
    references:finding?[{label:finding.sourceLabel,url:finding.source}]:[]
  };
}
export function withLgbtqTheme(review,{proposeVerdict=false}={}){
  if(!review||!Array.isArray(review.themes))return review;
  if(getLgbtqTheme(review))return review; // Never overwrite editor-saved scoring.
  const finding=LGBTQ_VERIFIED_STARTERS[review.id];
  const out={...review,themes:[starterLgbtqTheme(review.id),...review.themes]};
  if(proposeVerdict&&finding){
    const impact=lgbtqImpact(finding.score);
    // The specified site policy changes the suggested verdict for known on-screen content.
    // All other scores are left untouched; approved/published copies aren't auto-modified.
    if(impact==='destructive' || (impact==='neutral' && review.verdict==='edifying')){
      out.verdict=impact;
      const desc=`Under The Orthodox Lens editorial policy, the documented LGBTQ Themes & Messaging rating of ${finding.score}/5 is ${impact==='neutral'?'neutral under this criterion':'classified Destructive to Spiritual Wellness'}. ${finding.note}`;
      out.verdictRationale=desc+' '+(review.verdictRationale||'');
    }
  }
  return out;
}