import json,re,datetime, pathlib
P=pathlib.Path('/mnt/data/orthodox-lens/public')
seed=P/'seed-reviews.js'
text=seed.read_text()
original=json.loads(text.removeprefix('const seedReviews = ').removesuffix(';\n').strip().rstrip(';'))
movies=[
# title year genre runtime BBFC url synopsis age verdict age reason rationale spiritual reflection scripture warnings theme1/2 topic
('Finding Dory',2016,'Animation · Adventure','1h 37m','https://www.bbfc.co.uk/release/finding-dory-q29sbgvjdglvbjpwwc00mzq5ndm',
 'Dory searches for her long-lost parents with the help of friends.','7+','edifying',
 'BBFC identifies occasional mild threat, a chase by a squid, and emotional distress over separation from parents.',
 'The desire for family reunion and steady friendship makes loyalty and hope central. The distress is not glorified and its resolution is reassuring.',
 'Dory’s perseverance gives parents a chance to discuss how patient love continues even when circumstances are confusing.',
 ['Romans 12:12','Philippians 2:4'],
 [('Mild peril','Mild','A chase by a large squid and a dangerous current are described by BBFC.'),('Family separation','Moderate','Dory fears she will never see her parents again.'),('Language','Very mild','BBFC reports mild exclamations and wordplay.')],
 ('Family and responsibility',4),('Courage and hope',4),('Violence and cruelty',1),('Profanity and blasphemy',1),
 'What does Dory’s persistence teach us about loving our families?'),
('Incredibles 2',2018,'Animation · Action','1h 53m','https://www.bbfc.co.uk/release/incredibles-2-q29sbgvjdglvbjpwwc0zotq4nzq',
 'A superhero family balances family duties and public trust while facing a new villain.','10+','neutral',
 'BBFC documents stylized combat, dangerous situations, mild language and very mild sexual references; younger viewers may find some peril tense.',
 'Family teamwork and protecting others offer positive discussion material, but the film is chiefly a fast-paced superhero adventure with mixed choices.',
 'Being strong or talented is not the same as being humble. Families can consider how heroism includes patience and responsibility at home.',
 ['Mark 10:43','Philippians 2:3'],
 [('Animated violence','Moderate','BBFC reports punches, kicks and an electrical attack.'),('Mild language','Mild','BBFC documents mild language and irreverent exclamations.'),('Peril','Moderate','Characters face threats including a plane emergency.'),('Romance and adult references','Very mild','Brief adult remarks and implied romance.')],
 ('Family and responsibility',4),('Love and self-sacrifice',3),('Violence and cruelty',3),('Profanity and blasphemy',2),
 'When does wanting to be admired make us less attentive to our family?'),
('Cars',2006,'Animation · Comedy','1h 56m','https://www.bbfc.co.uk/release/cars-q29sbgvjdglvbjpwwc00mtc2mjc',
 'An ambitious racing car becomes stranded in a small town and discovers the value of friendship.','7+','edifying',
 'BBFC records mild bad language and some dangerous car-racing incidents, including a crash and near collisions.',
 'The central change from vanity and status-seeking toward friendship and community responsibility strongly supports humble service.',
 'A person’s worth does not come from applause, speed, or winning. Look for the difference between excellence and pride.',
 ['Philippians 2:3-4','Proverbs 16:18'],
 [('Language','Mild','BBFC documents a mild insult and a wordplay joke.'),('Vehicle danger','Mild','Near collisions and a racing crash occur without severe injuries.')],
 ('Humility and repentance',4),('Compassion and service',4),('Pride and self-glorification',3),('Violence and cruelty',1),
 'How does Lightning McQueen become more generous as the story unfolds?'),
('The Secret Life of Pets',2016,'Animation · Comedy','1h 23m','https://www.bbfc.co.uk/release/the-secret-life-of-pets-q29sbgvjdglvbjpwwc00mzuwmdy',
 'Two dogs who initially clash must cooperate after getting lost in the city.','7+','neutral',
 'BBFC identifies mild action, rude humor, frightening animals and brief peril; there is also a brief smoking depiction.',
 'Cooperation and loyalty are good messages, although most of the film is mischievous comedy rather than sustained moral reflection.',
 'Jealousy can distort how we see newcomers. Discuss welcoming others without ignoring the need for sensible boundaries.',
 ['Romans 12:10','James 3:16'],
 [('Action and threat','Mild','Comic animal fights, chases and danger in a sinking van.'),('Rude humor','Mild','BBFC notes scatological jokes.'),('Smoking','Brief','A character is briefly shown smoking.')],
 ('Family and responsibility',3),('Compassion and service',2),('Pride and self-glorification',2),('Violence and cruelty',2),
 'How does jealousy change the way Max treats Duke at first?'),
('Shrek',2001,'Animation · Fantasy','1h 30m','https://www.bbfc.co.uk/release/shrek-q29sbgvjdglvbjpwwc0zndmxnte',
 'A misunderstood ogre reluctantly journeys to rescue a princess.','10+','neutral',
 'BBFC records mild fantasy fights, frightening moments, coarse language, rude humor, and mild romantic innuendo.',
 'The story encourages looking past appearances and valuing loyalty, yet contains coarse humor and an inconsistent model of speech.',
 'People should not be judged by outward appearance, but humor and words should also be evaluated through the lens of kindness.',
 ['1 Samuel 16:7','Ephesians 4:29'],
 [('Language','Mild','BBFC notes insults and mild profanities.'),('Violence and peril','Mild','Comic wrestling, a dragon and fantasy chases.'),('Innuendo and rude humor','Mild','BBFC identifies mild sexual jokes and bodily-function humor.'),('Smoking and drinking','Brief','Fantasy characters smoke and drink.')],
 ('Compassion and service',3),('Truthfulness and integrity',2),('Profanity and blasphemy',2),('Violence and cruelty',2),
 'How do characters judge others based on how they look?'),
('The Lego Movie',2014,'Animation · Adventure','1h 40m','https://www.bbfc.co.uk/release/the-lego-movie-q29sbgvjdglvbjpwwc0zota2mdu',
 'An ordinary builder joins imaginative heroes to resist a controlling villain.','7+','neutral',
 'BBFC reports mild toy-figure fantasy fighting, harmless separable-figure injuries and very mild language.',
 'Creativity, cooperation, and courage are useful virtues; the story is primarily an inventive fantasy with little specifically spiritual teaching.',
 'The movie offers a way to discuss the value of every person, without implying that being unique means we need no guidance.',
 ['1 Corinthians 12:12','Romans 12:4-5'],
 [('Fantasy action','Mild','LEGO figures fight with toy-like blows, lasers and comic crashes.'),('Language','Very mild','BBFC notes words such as darn and heck.'),('Comic imagery','Very mild','Toy figures occasionally lose detachable heads or appear unclothed.')],
 ('Courage and hope',3),('Family and responsibility',2),('Violence and cruelty',2),('Profanity and blasphemy',1),
 'What makes someone important when they are not famous or exceptional?'),
('Brave',2012,'Animation · Fantasy','1h 30m','https://www.bbfc.co.uk/release/brave-q29sbgvjdglvbjpwwc0znzu1mtk',
 'A Scottish princess resists expectations and must repair damage in her family.','10+','neutral',
 'BBFC identifies threatening bears, emotionally intense family peril and some mild crude visual jokes.',
 'Repairing a strained mother-daughter relationship is positive, but impulsive choices and magical plot devices invite careful conversation.',
 'True freedom is not the absence of responsibility. The story can open a conversation about honoring parents while learning to communicate.',
 ['Ephesians 6:1-3','James 1:19'],
 [('Scary animal peril','Moderate','Fierce bears threaten characters, including a climactic battle.'),('Emotional distress','Moderate','A princess fears losing her mother.'),('Rude humor','Mild','Brief comic exposure of characters’ bottoms.')],
 ('Forgiveness and reconciliation',4),('Family and responsibility',4),('Occult or misleading spirituality',2),('Violence and cruelty',2),
 'Where could Merida and her mother have listened to each other sooner?'),
('Up',2009,'Animation · Adventure','1h 32m','https://www.bbfc.co.uk/release/up-q29sbgvjdglvbjpwwc00mja2nde',
 'A widower begins a balloon-borne adventure and finds new friendship.','7+','edifying',
 'BBFC describes mild threat. The story also addresses bereavement and grief.',
 'Acts of kindness and responsibility shift the protagonist away from isolation and toward caring for a child and others.',
 'Grief deserves compassion; our memories can be honored while we remain willing to love the people God places before us.',
 ['Romans 12:15','James 1:27'],
 [('Threat and action','Mild','BBFC reports brief mild peril in the adventure.'),('Bereavement','Moderate','The premise includes the death of a spouse and enduring grief.')],
 ('Love and self-sacrifice',4),('Compassion and service',4),('Courage and hope',3),('Violence and cruelty',1),
 'How does Carl’s love grow beyond holding on to his old plans?'),
('Shrek 2',2004,'Animation · Comedy','1h 33m','https://www.bbfc.co.uk/release/shrek-2-q29sbgvjdglvbjpwwc0zndc3odc',
 'Shrek and Fiona face pressure from relatives and outsiders after their marriage.','10+','neutral',
 'BBFC reports mild language, comic fighting, innuendo, crude jokes, drinking and a comic drug allusion.',
 'Loyalty within marriage is worth discussing; however, comic deception, coarse language, and bodily jokes need discernment.',
 'The approval of others is not the ultimate measure of a marriage or friendship. Discuss truthfulness and sacrificial love.',
 ['Ephesians 4:25','1 Corinthians 13:4-7'],
 [('Mild language','Mild','BBFC documents coarse expressions.'),('Comic violence','Mild','Slapstick fighting and brief danger.'),('Innuendo and crude humor','Mild','Mild romantic innuendo and bodily jokes.'),('Drug and drinking references','Brief','Catnip and a drinking establishment appear in jokes.')],
 ('Family and responsibility',3),('Love and self-sacrifice',3),('Profanity and blasphemy',2),('Violence and cruelty',2),
 'Whose approval are Shrek and Fiona trying to win, and why?'),
('The Lego Batman Movie',2017,'Animation · Action','1h 44m','https://www.bbfc.co.uk/release/the-lego-batman-movie-q29sbgvjdglvbjpwwc0zodu4mji',
 'A solitary superhero learns to accept a team and new family relationships.','7+','neutral',
 'BBFC notes many mild toy-figure action scenes, coarse jokes and very mild language.',
 'Batman’s movement from loneliness toward partnership and family is constructive, though the movie is mostly broad superhero comedy.',
 'Humility includes knowing that we need others. The story can help families discuss how pride gets in the way of belonging.',
 ['Ecclesiastes 4:9-10','Philippians 2:3'],
 [('Toy-like action violence','Mild','LEGO figures punch, kick and encounter fantastical explosions.'),('Rude humor','Mild','BBFC cites bathroom jokes.'),('Very mild language','Very mild','Words such as heck and butts.')],
 ('Family and responsibility',3),('Humility and repentance',3),('Violence and cruelty',2),('Profanity and blasphemy',1),
 'Why does Batman have trouble accepting friendship?'),
('Monsters University',2013,'Animation · Comedy','1h 39m','https://www.bbfc.co.uk/release/monsters-university-q29sbgvjdglvbjpwwc00mjk0njg',
 'Two college-age monsters move from rivalry to friendship while facing challenges.','7+','neutral',
 'BBFC records mild comic scares, slapstick, very mild language, and a party game resembling beer pong.',
 'Friendship and humility grow as competition is reassessed, but status-seeking and careless college humor provide mixed examples.',
 'Success need not look the same for everyone. Discuss talents, ambition, and how friends can help one another grow.',
 ['Romans 12:10','Philippians 2:3'],
 [('Mild scares','Mild','Students practice frightening others in a comic fantasy setting.'),('Slapstick','Mild','Falls and animated action.'),('Language','Very mild','An insult such as jerk.'),('Party drinking reference','Brief','BBFC notes a party game similar to beer pong.')],
 ('Humility and repentance',3),('Courage and hope',3),('Pride and self-glorification',2),('Violence and cruelty',1),
 'When does wanting to win start hurting a friendship?'),
('The Little Mermaid',2023,'Fantasy · Musical','2h 10m','https://www.bbfc.co.uk/release/the-little-mermaid-q29sbgvjdglvbjpwwc0xmda3ndk4',
 'A young mermaid makes a risky bargain in pursuit of life on land and romance.','10+','neutral',
 'BBFC documents danger from sea creatures and a sea witch, romantic references, injury detail, and background drinking.',
 'Personal longing, obedience, and risky choices deserve discussion; the witchcraft is a fictional device, not an example to imitate.',
 'A strong desire can be sincere while the means chosen to achieve it are unwise. Parents can discuss trust and honest conversation.',
 ['Proverbs 3:5-6','Ephesians 6:1-3'],
 [('Fantasy threat','Moderate','A sea witch attacks characters; shark and sea danger occur.'),('Romance','Mild','Kissing and romantic references.'),('Injury','Very mild','A brief glimpse of blood.'),('Drinking','Brief','Sailors drink during a celebration.')],
 ('Family and responsibility',3),('Truthfulness and integrity',2),('Occult or misleading spirituality',2),('Violence and cruelty',2),
 'How might Ariel have pursued her hopes without accepting a dangerous bargain?'),
]
now='2026-11-11'
new=[]
for title,year,genre,runtime,url,synopsis,age,verdict,ageRationale,verdictRationale,reflection,scripture,warnings,pos1,pos2,neg1,neg2,question in movies:
 if any(r['title'].casefold()==title.casefold() and r['year']==year for r in original): continue
 slug=re.sub('[^a-z0-9]+','-',title.lower()).strip('-')
 def theme(spec,typ):
  name,score=spec
  return {'name':name,'type':typ,'score':score,'portrayal':'affirmed' if typ=='positive' else 'descriptive',
          'evidence':'Independent provisional narrative interpretation; see cited BBFC plot summary and content advice.' if typ=='positive' else 'BBFC content advice for this film; prominence score is provisional.'}
 ts=[theme(pos1,'positive'),theme(pos2,'positive'),theme(neg1,'harmful'),theme(neg2,'harmful')]
 # Never portray occult as present if source not actually confirms it (magic context from story only; make explicit plot-only note)
 for t in ts:
  if t['name']=='Occult or misleading spirituality':t['evidence']='Fantastical magical plot premise; not a documented real-world religious practice. Severity and theological interpretation require editorial assessment.'
 qs=[question,
    'Which choices in the story were loving, honest, or courageous—and which were not?',
    'Did the film invite us to admire any behavior that conflicts with Christian virtue?',
    'How did the consequences of the characters’ choices shape the message?',
    'What would you have done differently if you were trying to act with humility and love?']
 new.append({'id':f'bbfc-{year}-{slug}','title':title,'year':year,'genre':genre,'runtime':runtime,'officialRating':'BBFC content advice linked','synopsis':synopsis,
 'verdict':verdict,'verdictRationale':'Provisional Coptic Orthodox interpretation: '+verdictRationale,'age':age,'ageRationale':ageRationale,'themes':ts,
 'warnings':[{'name':n,'severity':s,'details':d} for n,s,d in warnings], 'reflection':reflection,'scripture':scripture,'questions':qs,
 'sources':[{'label':'BBFC — official UK film content classification and parental advice','url':url,'notes':'BBFC supports the film content notes, not the independent Coptic Orthodox ratings.'}],
 'status':'provisional','isSeed':True,'reviewType':'seed','contentVerification':'partial_official_guidance','theologicalApproval':'pending','checkedAt':now,
 'contentCoverage':{'violence':'reported_in_bbfc','language':'source_check_required','sexual_content':'source_check_required','spiritual_content':'interpretive','substance_use':'source_check_required'},'editorNote':'Official BBFC content guidance supports listed cautions only. Missing categories have not been confirmed absent. Theological assessment awaits qualified Coptic Orthodox editor.'})

for r in original:
 r['contentVerification']='partial_external_guidance'
 r['theologicalApproval']='pending'
 r['checkedAt']=r.get('checkedAt',None)
 r['contentCoverage']={k:'not_exhaustively_verified' for k in ['violence','language','sexual_content','spiritual_content','substance_use']}
 r['editorNote']=r.get('editorNote','') or 'Existing provisional review: linked sources not exhaustively independently audited. Theological approval pending.'
 if len(r.get('questions',[]))<5:
  ext=['Which choices showed humility, honesty, and sacrificial love?',
       'How did the movie portray the consequences of wrongdoing?',
       'Did the story make anything admirable that our Orthodox faith would ask us to question?',
       'What can we take from this film to practice Christian love this week?']
  for q in ext:
   if len(r['questions'])>=5:break
   if q not in r['questions']:r['questions'].append(q)
allr=original+new
seed.write_text('const seedReviews = '+json.dumps(allr,ensure_ascii=False,indent=2)+';\n')
(P/'v10-source-audit.json').write_text(json.dumps({'version':10,'auditDate':now,'existingReviews':len(original),'addedReviews':len(new),'provisionalReviews':len(allr),'theologicallyApproved':0,'officialBBFCnew':len(new),'unverifiedExisting':len(original),'posterSource':'TMDB runtime if configured, plus eight remote manifest URLs','remainingWarning':'External evidence does not verify every absent content category. Provisional review verdicts cannot be called final.'},indent=2))
print('V10',len(original),len(new),len(allr));print('new names', [r['title'] for r in new]);
