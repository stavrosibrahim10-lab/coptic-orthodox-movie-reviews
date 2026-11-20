const source = (label, url) => ({label, url});
const theme = (name, type, score, portrayal, evidence, ...references) => ({
  name, type, score, portrayal, evidence, references
});

const lucaGuide = source('Plugged In', 'https://www.pluggedin.com/movie-reviews/luca-2021/');
const lucaInterview = source('Enrico Casarosa interview', 'https://www.slashfilm.com/581561/luca-director-interview/');
const redGuide = source('Plugged In', 'https://www.pluggedin.com/movie-reviews/turning-red-2022/');
const redInterview = source('Domee Shi interview', 'https://www.slantmagazine.com/film/domee-shi-lindsey-turning-red-interview/');
const lightyearGuide = source('Common Sense Media', 'https://www.commonsensemedia.org/movie-reviews/lightyear');
const onwardGuide = source('Common Sense Media', 'https://www.commonsensemedia.org/movie-reviews/onward');
const nimonaGuide = source('Common Sense Media', 'https://www.commonsensemedia.org/movie-reviews/nimona');
const forgeGuide = source('Plugged In', 'https://www.pluggedin.com/movie-reviews/forge-2024/');
const hoppersGuide = source('Common Sense Media', 'https://www.commonsensemedia.org/movie-reviews/hoppers');
const emojiGuide = source('Common Sense Media', 'https://www.commonsensemedia.org/movie-reviews/the-emoji-movie');
const emojiFamilyGuide = source('Plugged In', 'https://www.pluggedin.com/movie-reviews/emoji-movie-2017/');
const emojiInterview = source('Tony Leondis interview', 'https://www.animationscoop.com/interview-director-tony-leondis-on-the-emoji-movie/');
const emojiSynopsis = source('Sony Pictures', 'https://www.sonypictures.com/movies/theemojimovie');
const emojiPlot = source('IMDb plot summary', 'https://www.imdb.com/title/tt4877122/plotsummary/');

const recommendations = {
  'batch1-2021-luca': {
    verdict: 'neutral',
    verdictRationale: 'Hospitality and loyalty give this story real warmth. Luca’s parents are loving, and Massimo’s care for Alberto shows the value of a father figure. At the same time, running away opens the adventure, and Luca gains the freedom he sought as his parents reconsider their rules. That leaves the film’s lesson about obedience and trust mixed. The hidden-identity story also invites a discussion about acceptance, including the coming-out reading the director welcomed. Taken together, these are reasons to discuss the film as a family, and the balance is Neutral.',
    themes: {
      'Family and responsibility': theme('Family responsibility and father figures', 'positive', 3, 'affirmed',
        'Luca’s parents look for him together, and Giulia’s father Massimo offers care and stability to Alberto, who begins the story living alone.', lucaGuide),
      'Dishonesty and betrayal': theme('Parental authority, obedience and trust', 'harmful', 4, 'mixed',
        'Luca hides his trips to the surface and runs away when his parents plan to send him away. The story shows strain and danger, then gives Luca more freedom as his parents reconsider their rules.', lucaGuide),
      'Hidden identity and acceptance': theme('Hidden identity and acceptance', 'context', 5, 'descriptive',
        'Concealing and revealing the boys’ sea-monster identity drives the story. Casarosa welcomed a coming-out interpretation and described his own starting point as childhood friendship and feeling like an outsider.', lucaInterview)
    }
  },
  'batch1-2022-turning-red': {
    verdict: 'neutral',
    verdictRationale: 'Jin’s quiet care and the reconciliation between Mei and Ming model patience and love. Mei’s decision to hide her concert plans strains trust, while the ending affirms more independence for her. The positively portrayed ancestral ritual also warrants discussion from an Orthodox perspective. The frank treatment of puberty and crushes informs the suggested age. Those mixed lessons about family authority and spiritual practice support a Neutral verdict.',
    themes: {
      'Family and responsibility': theme('Family responsibility and father figures', 'positive', 4, 'affirmed',
        'Mei lives with both parents. Jin cooks for the family and offers counsel at a decisive moment when Mei feels ashamed of her panda side.', redInterview),
      'Dishonesty and betrayal': theme('Parental authority, obedience and trust', 'harmful', 4, 'mixed',
        'Mei proceeds with her concert plan in secret after Ming forbids it. The film shows damaged trust and eventually favors giving Mei more independence.', redGuide),
      'Sexual content and immodesty': theme('Puberty, crushes and romantic humor', 'context', 4, 'descriptive',
        'The panda transformation is a puberty metaphor. The film includes talk about periods, menstrual pads, crushes and suggestive drawings.', redGuide)
    }
  },
  'catalog-2022-lightyear': {
    verdict: 'neutral',
    verdictRationale: 'Buzz’s humility and willingness to trust his crew give the film constructive lessons. The life montage also warmly presents Alisha’s marriage to another woman, a portrayal families using a traditional Orthodox understanding of marriage may wish to discuss. The blend of personal growth, action and that portrayal supports a Neutral verdict.',
    themes: {
      'Same-sex marriage and affection': theme('Same-sex marriage and affection', 'context', 2, 'affirmed',
        'A short montage follows Alisha’s family life and includes a brief kiss with her wife. The marriage is portrayed affectionately within Buzz’s longer story about loss and time.', lightyearGuide)
    }
  },
  'catalog-2020-onward': {
    verdict: 'edifying',
    verdictRationale: 'Ian’s longing for his late father helps him recognize the love and guidance Barley has given him. Brotherly sacrifice and gratitude carry the story and support an Edifying verdict. A fantasy ritual to contact the dead merits discussion about Christian hope, and a brief same-sex relationship reference is part of the viewing guidance.',
    themes: {
      'Same-sex relationship reference': theme('Same-sex relationship reference', 'context', 1, 'descriptive',
        'A police officer mentions her girlfriend in passing.', onwardGuide)
    }
  },
  'catalog-2023-nimona': {
    verdict: 'neutral',
    verdictRationale: 'The film asks viewers to show mercy to an outsider and to question stories used to justify cruelty. These strengths sit alongside comic mayhem, serious emotional distress and an affectionate same-sex romance involving two major characters. The mixture calls for a family discussion and supports a Neutral verdict.',
    themes: {
      'Same-sex romance': theme('Same-sex romance', 'context', 3, 'affirmed',
        'Ballister and Ambrosius are central characters whose relationship includes a kiss and matters to how they respond to one another during the conflict.', nimonaGuide)
    }
  },
  'film-the-forge': {
    verdict: 'edifying',
    verdictRationale: 'The film openly advocates Christian discipleship and shows what it asks of Isaiah through prayer, repentance, mentorship and responsibility at home. Its sustained call to those virtues supports an Edifying verdict. Families may want to discuss differences in how Christian traditions present discipleship.',
    themes: {
      'Faith and trust in God': theme('Explicit advocacy for Christian discipleship', 'positive', 5, 'affirmed',
        'Isaiah’s mentor invites him to follow Christ. Prayer, repentance and the discipline of mentoring drive Isaiah’s transformation.', forgeGuide)
    }
  },
  'film-hoppers': {
    verdict: 'edifying',
    verdictRationale: 'The film actively makes a case for protecting vulnerable animal habitats. Read as stewardship and care for creation, that message carries the story and supports an Edifying verdict. Mabel’s impulsive choices also give families examples of how a good aim can be pursued unwisely.',
    themes: {
      'Compassion and service': theme('Explicit advocacy for habitat protection', 'positive', 5, 'affirmed',
        'Mabel organizes animals to oppose a development project that threatens their glade. Protecting the habitat is the central conflict.', hoppersGuide)
    }
  }
};

export function applyFamilyReviewRecommendation(review) {
  if (review.id === emojiMovieReview.id) {
    const revised = {...review, ...emojiMovieReview};
    return JSON.stringify(revised) === JSON.stringify(review) ? review : revised;
  }
  if (!Object.hasOwn(recommendations, review.id)) return review;
  const recommendation = recommendations[review.id];
  const updates = new Map();
  for (const [originalName, item] of Object.entries(recommendation.themes)) {
    updates.set(originalName, item);
    updates.set(item.name, item);
  }
  const remaining = new Set(updates.values());
  const themes = [];
  for (const item of review.themes || []) {
    const update = updates.get(item.name);
    if (!update) themes.push(item);
    else if (remaining.delete(update)) themes.push(update);
  }
  themes.push(...remaining);
  const next = {...review, verdict: recommendation.verdict, verdictRationale: recommendation.verdictRationale, themes};
  return JSON.stringify(next) === JSON.stringify(review) ? review : next;
}

const emojiMovieReview = {
  id: 'catalog-2017-the-emoji-movie',
  title: 'The Emoji Movie',
  year: 2017,
  genre: 'Animation · Family',
  runtime: '86 min',
  officialRating: 'PG',
  verdict: 'destructive',
  verdictRationale: 'Gene’s parents protect him, and the film rightly condemns Smiler’s cruelty. The decisive scene makes Gene a hero when his unusual range of expressions wins approval and saves Textopolis. From our Orthodox perspective, the concern is the larger lesson the ending can leave with children. Expressing yourself and being accepted settle the conflict, with little room to ask which impulses should be guided by truth, self-control, and responsibility to others. The director connected the allegory to his experience growing up gay and to the wider experience of exclusion. The film’s emphasis on self-expression as the answer to the conflict, reinforced by recurring crude humor and extensive app promotion, outweighs its positive examples of loyalty and care in our assessment.',
  age: '7+',
  ageRationale: 'For content maturity, seven and older is a starting point for a parent-led viewing decision. Laser chases and the threat of deletion can frighten younger children. The film includes recurring bathroom humor, interrupted profanity, mild innuendo, flirting, a kiss, and a brief bar setting. The spiritual verdict takes the film’s message into account.',
  synopsis: 'Each emoji in Textopolis is assigned a single expression, but Gene, a young Meh emoji, has many. When his first day on the job goes wrong and the city’s leader sends bots to delete him, Gene turns to Hi-5 and Jailbreak to find a way to rewrite his code. His parents set out to help him as the entire phone faces a reset.',
  reflection: 'Mel and Mary show how parents can stand beside a child who is ashamed or afraid. Their care gives families a place to start. From an Orthodox perspective, every person has dignity as an image-bearer of God, and Christian maturity involves bringing our emotions, choices, and desires to Christ. Ephesians 4 points toward truth spoken in love. Romans 12 invites us to renew our minds so we can discern what is good. Ask how Gene’s community could welcome him before he proves useful, and how a family can show love while helping someone examine a choice honestly.',
  scripture: ['Genesis 1:27', 'Ephesians 4:15–16', 'Romans 12:2'],
  themeScripture: {
    reference: 'Ephesians 4:15–16',
    url: 'https://www.biblegateway.com/passage/?search=Ephesians%204%3A15-16&version=NKJV',
    connection: 'Paul links maturity to speaking truth in love and growing together into Christ.'
  },
  patristic: {
    author: 'St. John Chrysostom',
    work: 'Homily 11 on Ephesians',
    section: 'On Ephesians 4:15–16',
    url: 'https://www.newadvent.org/fathers/230111.htm',
    text: 'Chrysostom explains that Christ nourishes each member according to its capacity so the whole body grows together in love. A person’s gifts find their purpose in serving and building up others.'
  },
  questions: [
    'Why does Smiler treat Gene’s many expressions as a threat? Which of her actions are cruel or unfair?',
    'How do Mel and Mary respond when Gene is in danger? What does Mel admit about himself?',
    'Would Gene deserve care if his expressions had never saved the city? Why?',
    'When is expressing a feeling honest and helpful? When might love call for patience or self-control?',
    'How would speaking the truth in love change the way both Gene and the people of Textopolis deal with their disagreement?'
  ],
  sources: [emojiSynopsis, emojiGuide, emojiFamilyGuide, emojiInterview, emojiPlot],
  sourceLinks: [emojiSynopsis, emojiGuide, emojiFamilyGuide, emojiInterview, emojiPlot],
  warnings: [
    {name: 'Mild innuendo and romance', severity: 'Mild', details: 'Flirting, a kiss, and brief suggestive jokes.'},
    {name: 'Crude humor and language', severity: 'Mild', details: 'Repeated bathroom jokes, insults, and cut-off profanity.'},
    {name: 'Animated peril', severity: 'Mild', details: 'Laser chases and a reset that threatens the characters with deletion.'},
    {name: 'Alcohol references', severity: 'Brief', details: 'A bar setting contains bottles and a parody liquor name.'},
    {name: 'Product placement', severity: 'Recurring', details: 'Real-world apps and games appear repeatedly as settings and plot devices.'}
  ],
  contentVerification: 'Six-category source-linked parent guide and director interview',
  theologicalApproval: 'pending',
  themes: [
    theme('Family responsibility and father figures', 'positive', 3, 'affirmed',
      'Gene’s parents look for him and try to protect him. His father Mel recognizes the same struggle in himself, and the parents reconcile after a disagreement.', emojiFamilyGuide),
    theme('Friendship over popularity', 'positive', 3, 'affirmed',
      'Hi-5 initially wants to regain fans and status. Helping Gene teaches him to value friends over popularity.', emojiFamilyGuide),
    theme('Self-expression and belonging', 'context', 5, 'affirmed',
      'Gene first seeks reprogramming. At the climax his multiple expressions help save Textopolis and the city embraces him. The director linked the allegory to growing up gay and to the broader experience of exclusion.', emojiSynopsis, emojiPlot, emojiInterview),
    theme('Scapegoating and coercion', 'harmful', 4, 'condemned',
      'Smiler treats a difference in how Gene expresses himself as a defect and sends bots to remove him. The story presents her response as unjust and dangerous.', emojiGuide, emojiFamilyGuide),
    theme('Commercial app promotion', 'harmful', 4, 'descriptive',
      'Recognizable services and games, including Candy Crush, Just Dance and Dropbox, appear as worlds the characters repeatedly use.', emojiGuide),
    theme('Peril and threats of deletion', 'harmful', 2, 'descriptive',
      'Bots pursue Gene and his friends, and the characters face the possible deletion of their world.', emojiGuide),
    theme('Crude humor and mild language', 'harmful', 2, 'descriptive',
      'The film includes bathroom humor, insults and cut-off profanity.', emojiGuide)
  ]
};

export const supplementalReviews = [emojiMovieReview];

function checkedFindings(findings, ...guides) {
  return {
    status: 'specific_findings_verified',
    findings,
    evidence: guides.map(guide => ({
      provider: guide.label,
      url: guide.url,
      checked_at: '2026-11-20',
      scope: 'film_specific_content_guide'
    })),
    absence_verified: false
  };
}

export const supplementalContentEvidenceById = {
  [emojiMovieReview.id]: {
    content_categories: {
      sexual_content: checkedFindings([
        'There is brief flirting and a kiss. Gags include pepperoni placed on Gene’s chest and a suggestive lyric.'
      ], emojiGuide, emojiFamilyGuide),
      language: checkedFindings([
        'There are insults, cut-off profanity, and recurring bathroom jokes.'
      ], emojiGuide, emojiFamilyGuide),
      violence: checkedFindings([
        'Bots pursue the characters with lasers. Digital characters can disappear when hit, and a phone reset threatens all of Textopolis.'
      ], emojiGuide, emojiFamilyGuide),
      spiritual_material: checkedFindings([
        'A devil emoji is used in a short gag. Hi-5 jokes about angels and a digital afterlife when his friends find him in the trash bin.'
      ], emojiFamilyGuide),
      substance_use: checkedFindings([
        'One app is depicted as a bar with bottles and a parody liquor reference. Plugged In reports no characters drinking.'
      ], emojiGuide, emojiFamilyGuide),
      moral_themes: checkedFindings([
        'Smiler treats Gene as a malfunction and tries to remove him. The story celebrates Gene’s ability to express more than one emotion.',
        'Gene’s parents try to protect him, and they apologize to one another after an argument.',
        'Several real apps and games are prominently featured throughout the adventure.'
      ], emojiGuide, emojiFamilyGuide)
    }
  }
};
