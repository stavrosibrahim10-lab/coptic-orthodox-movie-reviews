const familyAdvisoryLabels = {
  representation: 'LGBTQ characters & relationships',
  advocacy: 'Explicit advocacy',
  interpretation: 'Interpretive note',
  parentalAuthority: 'Parental authority & obedience',
  familyPortrayal: 'Family structure & father figures',
  comingOfAge: 'Puberty & coming-of-age topics'
};

// Source-linked notes for selected titles, including older reviews without this field.
const defaultFamilyAdvisories = {
  'catalog-2022-lightyear': {
    representation: {
      details: 'Alisha Hawthorne announces her engagement. A later anniversary scene shows her and her wife holding hands and briefly kissing.',
      url: 'https://www.commonsensemedia.org/movie-reviews/lightyear'
    }
  },
  'catalog-2020-onward': {
    representation: {
      details: 'A female police officer briefly mentions her girlfriend in conversation.',
      url: 'https://www.pluggedin.com/movie-reviews/onward-2020/'
    }
  },
  'catalog-2023-nimona': {
    representation: {
      details: 'Ballister and Ambrosius, two male characters central to the story, are shown in a romantic relationship and kiss.',
      url: 'https://www.commonsensemedia.org/movie-reviews/nimona'
    }
  },
  'batch1-2021-luca': {
    interpretation: {
      details: 'The boys hide that they are sea monsters and eventually let the town see them as they are. Director Enrico Casarosa welcomed a coming-out reading and described the story’s starting point as his own childhood experience of friendship and feeling like an outsider.',
      url: 'https://www.slashfilm.com/581561/luca-director-interview/'
    },
    parentalAuthority: {
      details: 'Luca breaks his parents’ rule to stay away from the surface and runs away when they plan to send him to live with his uncle. His parents reconsider their restrictions by the end. Families may want to discuss which fears were justified and what the story teaches about running away when parents make a decision a child thinks is unfair.',
      url: 'https://www.pluggedin.com/movie-reviews/luca-2021/'
    },
    familyPortrayal: {
      details: 'Luca lives with his mother, father and grandmother. His dad, Lorenzo, is played for laughs as distractible and joins his wife in looking for their son. Alberto starts out living alone. Giulia’s protective father, Massimo, eventually becomes a father figure to him.',
      url: 'https://www.pluggedin.com/movie-reviews/luca-2021/'
    }
  },
  'batch1-2022-turning-red': {
    parentalAuthority: {
      details: 'When Ming forbids the concert, Mei hides her plans and goes anyway. Mei ultimately keeps the panda, and her mother accepts that choice. The story favors giving Mei more independence and also shows how secrecy strains trust with her family and friends.',
      url: 'https://www.pluggedin.com/movie-reviews/turning-red-2022/'
    },
    familyPortrayal: {
      details: 'Mei lives with her mother, Ming, and father, Jin. Jin has a quiet supporting role. He cares for the family and uses a video of Mei dancing with friends to help her see a side of herself she had been ashamed of.',
      url: 'https://www.slantmagazine.com/film/domee-shi-lindsey-turning-red-interview/'
    },
    comingOfAge: {
      details: 'The panda transformation is a metaphor for puberty. Mei’s mother thinks she has started her period and brings menstrual pads. The film also includes crushes, infatuation with a boy band and drawings of Mei embracing an apparently shirtless crush.',
      url: 'https://www.pluggedin.com/movie-reviews/turning-red-2022/'
    }
  },
  'catalog-2017-the-emoji-movie': {
    interpretation: {
      details: 'Textopolis expects each emoji to make a single expression. Smiler targets Gene for making several, and Gene first looks for a way to change himself. The story ultimately celebrates his range of expressions. Director Tony Leondis said his experience growing up gay helped inspire this broader allegory about exclusion and belonging.',
      url: 'https://www.animationscoop.com/interview-director-tony-leondis-on-the-emoji-movie/'
    },
    familyPortrayal: {
      details: 'Gene’s mother and father, Mary and Mel, look for him and try to protect him. Mel identifies with his son’s struggle to express himself. The parents apologize to each other and express affection after a disagreement.',
      url: 'https://www.pluggedin.com/movie-reviews/emoji-movie-2017/'
    }
  },
  'film-the-forge': {
    advocacy: {
      details: 'The film encourages Christian discipleship. Isaiah’s mentor invites him to follow Christ, and the story portrays prayer, repentance, and mentoring as part of his change.',
      url: 'https://www.pluggedin.com/movie-reviews/forge-2024/'
    }
  },
  'film-hoppers': {
    advocacy: {
      details: 'The film makes a case for protecting animal habitats. Mabel organizes animals to oppose a development project that threatens a local glade.',
      url: 'https://www.commonsensemedia.org/movie-reviews/hoppers'
    }
  }
};

function getFamilyAdvisories(review) {
  // An explicitly empty object lets an editor remove the starter notes.
  const filmId = review.contentEvidenceId || review.id;
  return review.familyAdvisories ?? (Object.hasOwn(defaultFamilyAdvisories, filmId)
    ? defaultFamilyAdvisories[filmId] : {});
}
