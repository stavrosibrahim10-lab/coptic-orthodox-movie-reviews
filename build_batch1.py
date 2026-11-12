import json,re
from pathlib import Path
p=Path(__file__).parent/'public'
source=p/'seed-reviews.js'
raw=source.read_text().strip().removeprefix('const seedReviews = ').rstrip(';\n')
existing=json.loads(raw)
# Each record: title, release year, genre, MPAA rating, source path, verdict, age, synopsis,
# moral rationale, age rationale, (theme, type, score, portrayal, evidence), warnings, reflection, scripture, questions.
D=[]
def add(title,year,genre,rating,slug,verdict,age,synopsis,rationale,agewhy,themes,warnings,reflection,verses,questions,runtime=''):
    D.append(dict(title=title,year=year,genre=genre,rating=rating,slug=slug,verdict=verdict,age=age,synopsis=synopsis,rationale=rationale,agewhy=agewhy,themes=themes,warnings=warnings,reflection=reflection,verses=verses,questions=questions,runtime=runtime))
# t tuple: title,positive/harmful,score,portrayal, specific grounded evidence; warnings: name,severity,description
add('The Prince of Egypt',1998,'Animation · Biblical','PG','the-prince-of-egypt','edifying','10+',
'An animated retelling of Moses’ life, from his upbringing in Pharaoh’s household to the Exodus.',
'The story foregrounds God’s call, solidarity with oppressed people, costly obedience, and deliverance. It is edifying, although a dramatized biblical adaptation should be checked against Exodus rather than treated as Scripture itself.',
'Portrayals of slavery, abuse, the deaths of children, and frightening plagues call for mature discussion.',
[('Faith and trust in God','positive',5,'affirmed','Moses responds to a divine summons to confront Pharaoh.'),('Courage and hope','positive',5,'affirmed','Moses risks his privileged position to seek freedom for his people.'),('Compassion and service','positive',4,'affirmed','The enslavement of the Hebrews is depicted as a grave injustice.'),('Violence and cruelty','harmful',3,'condemned','Hebrew slaves are beaten and infant killings are represented.')],
[('Slavery and brutality','Moderate','Enslaved people are whipped, struck, and mistreated.'),('Infant deaths and plagues','Strong','The story includes the killing of children and frightening biblical plagues.')],
'Moses’ concern for those who suffer offers a way to discuss obedience to God and the spiritual meaning of freedom. Compare the film’s details with the biblical book, including what was invented for dramatic effect.',
['Exodus 3:7–12','Exodus 12:31–42'],['What does Moses surrender by answering God’s call?','Where does the movie differ from Exodus, and why does that matter?'])
add('The Lion King',1994,'Animation · Adventure','G','the-lion-king-1994','edifying','7+',
'A young lion flees his responsibilities after his father’s death and eventually faces the truth about his family and kingdom.',
'The film strongly commends responsible leadership, courage, and returning to duties one has tried to escape. Its emphasis on guilt and identity invites discussion, but some ancestor-spirit imagery is fictional storytelling rather than Christian doctrine.',
'A parental death, predatory threats, and intense animal confrontations may distress younger viewers.',
[('Family and responsibility','positive',5,'affirmed','Simba eventually chooses duty over avoidance.'),('Courage and hope','positive',4,'affirmed','He returns to confront the destruction of the Pride Lands.'),('Truthfulness and integrity','positive',3,'affirmed','The deception behind Mufasa’s death is uncovered.'),('Violence and cruelty','harmful',3,'condemned','A deadly stampede, sinister hyenas, and animal fights are central to the conflict.')],
[('Death and grief','Strong','Mufasa dies during a stampede; Simba experiences intense sorrow.'),('Threat and animal violence','Moderate','Hyenas threaten cubs and lions fight; mild insults occur.')],
'Responsibility is not the absence of fear. The Christian call to repentance involves turning from avoidance and accepting the tasks entrusted to us.',
['Luke 15:17–24','Galatians 6:5'],['What prevents Simba from returning sooner?','How can we tell the difference between guilt that paralyzes and repentance that changes us?'])
add('Finding Nemo',2003,'Animation · Family','G','finding-nemo','edifying','7+',
'A protective clownfish travels across the ocean to rescue his son, learning about trust and courage along the way.',
'The film prizes parental love, perseverance, friendship, and respect for the dignity of a child with a disability. It also shows that care for children must grow with their maturity rather than become control.',
'A frightening opening loss and repeated encounters with predators could unsettle young children.',
[('Family and responsibility','positive',5,'affirmed','Marlin searches tirelessly for his missing son.'),('Love and self-sacrifice','positive',5,'affirmed','Marlin repeatedly risks himself to bring Nemo home.'),('Courage and hope','positive',4,'affirmed','Nemo and his father persist through danger.'),('Violence and cruelty','harmful',2,'descriptive','Predators, sharp-toothed creatures, and ocean hazards threaten the fish.')],
[('Parental loss','Moderate','A predator kills Nemo’s mother and most of the eggs in the opening.'),('Ocean peril','Moderate','Sharks, jellyfish, and other creatures create frightening sequences.')],
'Parental love is a gift, yet it is meant to help a child mature. Families can discuss protective responsibility alongside the humility to trust others.',
['1 Corinthians 13:4–7','Ephesians 6:4'],['When is Marlin’s fear understandable, and when does it become limiting?','How does Nemo show courage without pretending danger is absent?'])
add('Toy Story',1995,'Animation · Comedy','G','toy-story','edifying','7+',
'A cowboy doll fears being replaced by a new space-ranger toy but learns loyalty and friendship through shared danger.',
'Jealousy gives way to humility, cooperation, and care for someone previously viewed as a rival. The movie offers a concrete picture of how friendship requires overcoming pride.',
'A child who destroys toys and some threatening dog sequences may frighten sensitive viewers.',
[('Humility and repentance','positive',4,'affirmed','Woody must confront his jealousy toward Buzz.'),('Forgiveness and reconciliation','positive',4,'affirmed','The rival toys learn to help one another.'),('Family and responsibility','positive',3,'affirmed','The toys’ concern for their child motivates their actions.'),('Violence and cruelty','harmful',2,'condemned','Sid mutilates toys and toys endure tense chases.')],
[('Scary toy imagery','Moderate','Sid’s altered toys, threatening dog, and rockets may worry children.'),('Insults and rough behavior','Mild','Occasional name-calling and comic fighting appear.')],
'Envy can transform a companion into a rival. Woody’s growth invites conversation about rejoicing in others’ gifts instead of treating them as threats.',
['James 3:16','Philippians 2:3–4'],['What makes Woody jealous?','What changes when Woody begins to care about Buzz?'])
add('Toy Story 3',2010,'Animation · Adventure','G','toy-story-3','edifying','10+',
'As Andy grows up, the toys encounter a seemingly welcoming daycare and face difficult decisions about loyalty and belonging.',
'Loyalty, teamwork, forgiveness, and sacrificial friendship remain central. The story resists bitterness and shows that love can endure significant transitions.',
'Sustained peril, bullying by toys, and an intense incinerator sequence justify an older recommended age.',
[('Love and self-sacrifice','positive',5,'affirmed','The friends remain together during severe danger.'),('Courage and hope','positive',4,'affirmed','The toys cooperate to escape oppression and peril.'),('Forgiveness and reconciliation','positive',3,'affirmed','Characters are invited to move beyond resentment.'),('Violence and cruelty','harmful',3,'condemned','A cruel daycare hierarchy and the incinerator sequence create sustained threat.')],
[('Intense peril','Strong','A prolonged junkyard/incinerator sequence suggests the toys may die.'),('Bullying and confinement','Moderate','Antagonistic toys imprison, intimidate, and mistreat others.')],
'The story is an invitation to think about faithful friendship during life transitions and the freedom that comes from refusing to let fear dictate our conduct.',
['John 15:13','Romans 12:10'],['What does loyalty look like when circumstances change?','How do the characters respond differently to being abandoned?'])
add('Frozen II',2019,'Animation · Fantasy','PG','frozen-2','neutral','10+',
'Anna and Elsa investigate a mysterious past while their kingdom faces threats connected to an enchanted forest.',
'Love between sisters, perseverance, and setting right previous wrongs are constructive. The central explanation for events, however, uses elemental spirits and enchanted powers that belong to the film’s fantasy mythology, not Orthodox spiritual teaching.',
'Elemental attacks, peril, bereavement, and frightening giants can be intense.',
[('Love and self-sacrifice','positive',4,'affirmed','The sisters act to protect one another and their community.'),('Courage and hope','positive',4,'affirmed','Anna perseveres through grief and uncertainty.'),('Occult or misleading spirituality','harmful',3,'descriptive','Elemental spirits and magical powers shape the fantasy cosmology.'),('Violence and cruelty','harmful',2,'descriptive','Giants, battles, waves, and threats to a kingdom create danger.')],
[('Fantasy spiritual system','Moderate','Elemental spirits, enchanted powers, and supernatural guardians are key plot devices.'),('Threat and grief','Moderate','Battles, near-deaths, parental loss, and intense peril.')],
'Parents can affirm the virtues of perseverance and responsibility while explaining why fictional spirit-world explanations should not be confused with the Christian understanding of God, creation, and prayer.',
['James 1:12','1 John 4:1'],['How do the sisters respond to uncertainty?','Which spiritual ideas in the story are fictional rather than Christian teaching?'])
add('Encanto',2021,'Animation · Family','PG','encanto','edifying','7+',
'In a family gifted with extraordinary powers, a daughter without a special ability tries to hold her relatives together.',
'The movie critiques achievement-based worth and discovers the value of reconciliation, honesty, and love within families. Its enchanted-house premise is fantasy rather than a claim about spiritual reality.',
'Tense family confrontations, frightening flashbacks, and danger during a collapsing house may upset younger children.',
[('Family and responsibility','positive',5,'affirmed','The narrative centers on healing strained family bonds.'),('Forgiveness and reconciliation','positive',5,'affirmed','Family members acknowledge wounds and seek restoration.'),('Humility and repentance','positive',4,'affirmed','Relatives must reconsider how they have judged one another.'),('Occult or misleading spirituality','harmful',2,'descriptive','Miraculous family gifts and a magical house are fictional plot conventions.')],
[('Family pressure and distress','Moderate','Characters fear disappointment, rejection, and the loss of the family home.'),('Fantasy magic and peril','Mild','Enchanted powers and tense physical danger shape the plot.')],
'The Christian understanding of personal worth does not depend on talents, accomplishments, or family prestige. The story offers a helpful conversation about love that makes room for weakness.',
['1 Corinthians 12:22–26','Ephesians 4:32'],['Why does Mirabel feel overlooked?','How can family members express love without measuring one another by achievement?'])
add('Coco',2017,'Animation · Family','PG','coco','neutral','10+',
'A young musician enters a fantastical realm of the dead while investigating his family history.',
'Family fidelity, honoring elders, truth, and remembering loved ones are meaningful strengths. However, the story’s imaginative afterlife and encounters with deceased ancestors do not represent Orthodox teaching about death, the soul, or prayer for the departed.',
'Skeleton imagery, threats of spiritual disappearance, poisoning, and bereavement can be emotionally intense.',
[('Family and responsibility','positive',5,'affirmed','Miguel comes to value family relationships and memory.'),('Truthfulness and integrity','positive',4,'affirmed','A hidden betrayal is eventually exposed.'),('Love and self-sacrifice','positive',4,'affirmed','The resolution honors care for older family members.'),('Occult or misleading spirituality','harmful',4,'descriptive','The Land of the Dead and communication with ancestors dominate the plot.'),('Violence and cruelty','harmful',2,'condemned','A character is poisoned and there are perilous confrontations.')],
[('Non-Christian afterlife imagery','Strong','Deceased relatives, spirit guides, and rules for the world of the dead are central.'),('Death and frightening imagery','Moderate','Skeletons, threats of fading away, and a poisoning revelation may disturb children.')],
'It is good to honor our departed loved ones and remember them in prayer. Families should clearly distinguish this imaginative folk-cosmology from the Orthodox understanding of the resurrection and departed souls.',
['John 11:25–26','1 Thessalonians 4:13–14'],['What does the story get right about family remembrance?','How does the Christian hope of resurrection differ from the movie’s invented afterlife?'])
add('Inside Out',2015,'Animation · Family','PG','inside-out','edifying','7+',
'Personified emotions help a young girl navigate a move, loneliness, and family change.',
'The film encourages honesty, empathy, compassion, and the recognition that sadness can help people ask for care. Its portrayal of inner life is a useful metaphor, not a complete Christian anthropology.',
'Emotional distress, several frightening scenes, and the loss of an imaginary friend may upset young viewers.',
[('Truthfulness and integrity','positive',4,'affirmed','Riley’s healing involves acknowledging how she truly feels.'),('Family and responsibility','positive',4,'affirmed','Communication reconnects her with her parents.'),('Compassion and service','positive',4,'affirmed','Empathy grows when sadness is heard rather than suppressed.'),('Violence and cruelty','harmful',1,'descriptive','Adventure peril and scary fantasy images punctuate the mind-world story.')],
[('Sadness and emotional distress','Moderate','The film depicts isolation, family conflict, and upsetting imagined loss.'),('Fantasy peril','Mild','Emotions encounter frightening chases and dark imagined spaces.')],
'Our emotional life is part of the human person, not an enemy of faith. The film offers a starting point for talking about honest feelings alongside prayer, reason, and loving communication.',
['Psalm 42:11','Romans 12:15'],['Why does listening to sadness help Riley?','How can we pray honestly when we feel overwhelmed?'])
add('Zootopia',2016,'Animation · Adventure','PG','zootopia','edifying','10+',
'An idealistic rabbit police officer and a cynical fox investigate a mystery in a city divided by stereotypes.',
'The film condemns prejudice and encourages courage, repentance, friendship, and seeing each person fairly. These are strong moral themes, though some adult humor and crime-story peril require discretion.',
'Intense predator attacks, kidnapping, threatened torture, and chase sequences may frighten younger children.',
[('Truthfulness and integrity','positive',4,'affirmed','The investigation exposes deception and unfair assumptions.'),('Forgiveness and reconciliation','positive',4,'affirmed','Central characters reassess harmful stereotypes and repair trust.'),('Courage and hope','positive',4,'affirmed','Judy perseveres despite discouragement.'),('Violence and cruelty','harmful',3,'condemned','Predator attacks, threats, chases, and intimidation are part of the mystery.')],
[('Scary predator attacks','Moderate','Several predators become threatening; characters experience jump scares and peril.'),('Crime and intimidation','Moderate','Mob imagery, kidnapping, and threats of violence occur.')],
'Christians are called to judge with justice rather than appearances. The story provides an accessible way to talk about repentance when we discover prejudice in ourselves.',
['James 2:1–4','John 7:24'],['How do stereotypes injure friendships?','What does genuine repentance look like when someone has judged unfairly?'])
add('Moana',2016,'Animation · Adventure','PG','moana','neutral','10+',
'A young island leader sails beyond familiar waters to restore her community’s wellbeing in a mythological adventure.',
'Her commitment to serving her people, courage, and perseverance are praiseworthy. The film’s demigod, spirit-guide, and creation-myth elements belong to a non-Christian mythic worldview and should not be confused with Christian teaching.',
'Monsters, ocean storms, death of an elder, and recurring supernatural threats can be intense.',
[('Courage and hope','positive',5,'affirmed','Moana undertakes repeated risks to help her people.'),('Family and responsibility','positive',4,'affirmed','Protecting the island community motivates her quest.'),('Humility and repentance','positive',3,'affirmed','Maui learns to move beyond his boastful self-concern.'),('Occult or misleading spirituality','harmful',4,'descriptive','A demigod, nature spirits, and an ancestral spirit guide are central to the mythology.'),('Violence and cruelty','harmful',2,'descriptive','Storms, a lava creature, and other monsters threaten the heroes.')],
[('Mythological spirituality','Strong','The story features a demigod, ancestral guiding spirit, and supernatural powers.'),('Scary monsters and peril','Moderate','Giant monsters, pirates, and dangerous ocean sequences recur.')],
'It is possible to admire courage and service while recognizing that a fictional mythological account of divine action differs from faith in the one God revealed in Christ.',
['Joshua 1:9','1 John 4:1'],['What motivates Moana to help her neighbors?','What does the movie teach about spirits, and how is that different from Orthodoxy?'])
add('The Incredibles',2004,'Animation · Superhero','PG','the-incredibles','edifying','10+',
'A family of superheroes must overcome secrecy and disagreements to face a dangerous enemy together.',
'Love, loyalty, self-sacrifice, and cooperation make the family the heart of the story. The film also exposes the danger of secretiveness and pride within a marriage and family.',
'Extended action violence, guns, explosions, implied deaths, and a brief suicide-related incident warrant a careful age recommendation.',
[('Family and responsibility','positive',5,'affirmed','Family members protect one another and learn to cooperate.'),('Love and self-sacrifice','positive',4,'affirmed','The heroes repeatedly risk their safety to protect others.'),('Truthfulness and integrity','positive',3,'mixed','Secrecy strains the parents’ marriage before trust is restored.'),('Violence and cruelty','harmful',4,'condemned','The plot includes repeated attacks, weapons, deaths, and torture threats.')],
[('Action violence','Strong','Gunfire, explosions, deaths, and sustained battles occur.'),('Mature family and self-harm themes','Moderate','A marital infidelity suspicion and a stopped suicide attempt are depicted or referenced.')],
'Power becomes morally valuable when it serves love. The family’s greatest strength is not exceptional ability but solidarity and responsibility for one another.',
['1 Corinthians 12:25–26','Philippians 2:4'],['When does secrecy harm family trust?','How is using strength for service different from seeking admiration?'])
add('Tangled',2010,'Animation · Fairy Tale','PG','tangled','edifying','10+',
'A young woman raised in isolation ventures beyond her tower and learns the truth about her controlling guardian.',
'The story exposes manipulation and the misuse of affection as a form of control. It honors courage, honest love, and choosing truth over fear, although its magical healing premise is fantasy.',
'Sustained danger, manipulative emotional abuse, stabbing, and a character’s death call for age caution.',
[('Courage and hope','positive',4,'affirmed','Rapunzel begins making responsible choices outside enforced isolation.'),('Truthfulness and integrity','positive',4,'affirmed','She uncovers lies used to control her.'),('Love and self-sacrifice','positive',4,'affirmed','The story’s resolution turns on love placed ahead of self-interest.'),('Violence and cruelty','harmful',3,'condemned','A stabbing, swordplay, and threatening pursuit occur.'),('Occult or misleading spirituality','harmful',2,'descriptive','Magical hair and healing powers are fantasy devices.')],
[('Threat and injury','Moderate','Knives, pursuit, apparent death, and frightening transformations appear.'),('Manipulation and emotional cruelty','Moderate','Mother Gothel isolates and deceives Rapunzel to maintain control.')],
'Love does not require someone to remain imprisoned by another person’s selfishness. Families can discuss the difference between protective guidance and manipulative control.',
['1 Corinthians 13:4–6','Ephesians 4:15'],['How does Gothel twist the meaning of love?','Why is truth important even when it is frightening?'])
add('WALL-E',2008,'Animation · Science Fiction','G','wall-e','edifying','7+',
'A solitary cleanup robot discovers a connection that challenges humanity’s passive and wasteful way of life.',
'The film critiques unchecked consumption and distraction while celebrating care, persistence, service, and renewed attention to the world around us. Its environmental message offers an opening for Christian stewardship.',
'Robot fighting, laser blasts, explosions, and mild peril may unsettle some children.',
[('Compassion and service','positive',4,'affirmed','WALL-E consistently helps and protects others.'),('Love and self-sacrifice','positive',4,'affirmed','The robot risks himself for EVE and others.'),('Greed and materialism','harmful',4,'condemned','Human society is shown as dominated by consumption and corporate convenience.'),('Violence and cruelty','harmful',2,'descriptive','Robots clash; explosions and laser threats appear.')],
[('Robot action and peril','Mild','Laser fire, explosions, and robot fights occur.'),('Materialism and screen dependence','Moderate','The story depicts a society absorbed in consumption and electronic entertainment.')],
'Stewardship is not only about protecting material creation; it is also about refusing to allow comfort and possessions to replace relationships and gratitude.',
['Genesis 2:15','Luke 12:15'],['What happens when convenience replaces attention to other people?','How can our family practice grateful stewardship?'])
add('Beauty and the Beast',1991,'Animation · Fairy Tale','G','beauty-and-the-beast','neutral','10+',
'A young woman becomes involved in the life of an enchanted prince whose anger and pride have isolated him.',
'The film explores kindness, self-sacrifice, and moral transformation, but the romantic development within a captivity-and-intimidation scenario deserves careful discussion. It should not be used to teach that abuse is cured by a partner’s love.',
'Angry outbursts, wolf attacks, imprisonment, and weapon violence are notable concerns.',
[('Love and self-sacrifice','positive',4,'affirmed','Belle cares for others despite personal cost.'),('Humility and repentance','positive',4,'affirmed','The Beast gradually confronts pride and learns care for others.'),('Pride and self-glorification','harmful',3,'condemned','Gaston’s vanity and the Beast’s early aggression create conflict.'),('Violence and cruelty','harmful',3,'mixed','Imprisonment, wolf attacks, weapons, and threatening behavior appear.')],
[('Fear and aggression','Moderate','The Beast has angry outbursts; wolves attack; the castle setting can be frightening.'),('Romance and coercive dynamics','Moderate','The romance develops after captivity and requires careful discussion of healthy boundaries.')],
'Christian love is never the same as tolerating coercion. A useful family conversation can distinguish freely given forgiveness from pressure to remain in a harmful relationship.',
['1 Corinthians 13:4–7','Colossians 3:19'],['What must change before the Beast can love responsibly?','Why are forgiveness and boundaries both important?'])
add('The Chronicles of Narnia: The Lion, the Witch and the Wardrobe',2005,'Fantasy · Christian Allegory','PG','the-chronicles-of-narnia-the-lion-the-witch-and-the-wardrobe','edifying','10+',
'Four siblings enter a magical kingdom where a sacrificial lion confronts the power of an evil queen.',
'The story’s Christian allegorical structure strongly emphasizes sacrifice, betrayal, forgiveness, and restoration. The powerful parallels to Christ are worth discussing without treating fictional details as biblical history.',
'War imagery, frightening creatures, a sacrificial killing, and a large battle sequence may distress younger children.',
[('Love and self-sacrifice','positive',5,'affirmed','Aslan accepts death to save a traitor.'),('Forgiveness and reconciliation','positive',4,'affirmed','The story gives betrayal a path toward forgiveness.'),('Courage and hope','positive',4,'affirmed','The children stand with others against tyranny.'),('Occult or misleading spirituality','harmful',2,'descriptive','A witch, spell, and magical world appear within a Christian allegory.'),('Violence and cruelty','harmful',3,'condemned','The story depicts betrayal, torture, weapons, and a major battle.')],
[('Battle violence','Moderate','Weapon combat, war peril, and a sacrificial death appear.'),('Witchcraft in fantasy','Moderate','The White Witch uses hostile supernatural power; it is presented as evil.')],
'Aslan is a literary Christ-figure, not a substitute for Christ. Compare the allegory’s themes with the Lord’s self-giving love and victorious resurrection.',
['John 15:13','1 Corinthians 15:20–22'],['How does sacrificial love undo betrayal?','What are the limits of comparing a fictional figure with Christ?'])
add('The Lord of the Rings: The Fellowship of the Ring',2001,'Fantasy · Adventure','PG-13','the-lord-of-the-rings-the-fellowship-of-the-ring','edifying','13+',
'A humble hobbit joins a fellowship seeking to destroy a powerful ring that corrupts those who desire it.',
'The narrative repeatedly places humility, fidelity, courage, and sacrifice against lust for dominion. Its fantasy magic is literary world-building, while the moral conflict provides rich Christian discussion.',
'Sword battles, frightening creatures, repeated peril, deaths, and pipe-smoking make this better suited to older children and teenagers.',
[('Humility and repentance','positive',5,'affirmed','The burden falls to a humble protagonist rather than a ruler seeking power.'),('Love and self-sacrifice','positive',5,'affirmed','Members of the fellowship repeatedly protect one another at personal cost.'),('Courage and hope','positive',5,'affirmed','The characters persist against overwhelming danger.'),('Greed and materialism','harmful',4,'condemned','The Ring reveals the temptation to possess and dominate.'),('Violence and cruelty','harmful',4,'condemned','Sword fights, creature attacks, and deaths recur.')],
[('Fantasy violence and terror','Strong','Intense combat, terrifying riders, and the deaths of characters appear.'),('Magic and pipe-smoking','Moderate','Wizards and supernatural fantasy powers are present, and hobbits smoke pipes.')],
'Temptation often offers the illusion that power can achieve goodness through corrupt means. Frodo’s weakness and the fellowship’s fidelity invite reflection on humility and mutual aid.',
['Mark 8:36','Galatians 6:2'],['Why can the desire for power corrupt a good goal?','What does each companion give up to help the fellowship?'])
add('Harry Potter and the Sorcerer’s Stone',2001,'Fantasy · Adventure','PG','harry-potter-and-the-sorcerers-stone','neutral','10+',
'An orphan discovers a hidden wizarding school and forms friendships while confronting a threat connected to his parents’ deaths.',
'The story praises friendship, loyalty, courage, and resistance to cruelty. Yet the magical training and spells form the desirable center of its imaginative world; Orthodox parents may want to distinguish fantasy from real-world occult practices and religious teaching.',
'An intimidating villain, fantasy monsters, remembered murder, and dark encounters could frighten younger children.',
[('Courage and hope','positive',4,'affirmed','Harry and friends face danger for others.'),('Love and self-sacrifice','positive',4,'affirmed','Friendship and protective love are presented as powerful goods.'),('Occult or misleading spirituality','harmful',4,'mixed','Spells, wands, wizard training, and magical conflict are central and often presented positively.'),('Violence and cruelty','harmful',2,'condemned','Trolls, a three-headed dog, and the villain threaten children.')],
[('Wizardry-centered fantasy','Strong','Magic lessons, spells, and supernatural conflicts drive the story.'),('Scary creatures and death themes','Moderate','A frightening villain, peril, and a parental murder backstory appear.')],
'The appeal of the film’s friendship and bravery can be discussed separately from its fictional magical worldview. Parents should articulate that the Church’s rejection of occult practice is not a judgment on every fantasy device in literature.',
['Proverbs 3:5–6','1 Thessalonians 5:21'],['What makes the friends loyal?','What is the difference between fantasy stories and seeking supernatural power in real life?'])
add('Puss in Boots: The Last Wish',2022,'Animation · Fantasy','PG','puss-in-boots-the-last-wish','edifying','10+',
'A boastful adventurer frightened by mortality seeks a magical wish but discovers the worth of the life and relationships he already has.',
'The arc moves decisively from pride and self-preservation toward gratitude, courage, and relational love. The personification of Death is a fantasy device, not a presentation of Christian teaching about death.',
'Frightening pursuit by a wolf representing death, weapons, panic, and rude language warrant older-child guidance.',
[('Humility and repentance','positive',5,'affirmed','Puss confronts his self-importance and changes priorities.'),('Love and self-sacrifice','positive',4,'affirmed','He places companions ahead of personal fame and fear.'),('Courage and hope','positive',4,'affirmed','He gradually faces mortality rather than escaping it.'),('Violence and cruelty','harmful',3,'condemned','Sword fights, repeated threats, and a ruthless antagonist occur.'),('Profanity and blasphemy','harmful',2,'descriptive','Mild profanity and rude expressions occur.')],
[('Frightening Death figure','Strong','A whistling wolf pursues Puss and threatens his last life.'),('Violence and rude language','Moderate','Weapon fights, death jokes, insulting language, and brief drunkenness.')],
'Mortality reminds us that life is a gift and that worldly acclaim cannot substitute for love. The film’s change of heart provides a doorway to discussing the difference between fear and repentance.',
['Psalm 90:12','Luke 12:15'],['How does Puss’s definition of a good life change?','What matters more than fame when life is short?'])
add('Turning Red',2022,'Animation · Coming of Age','PG','turning-red','neutral','13+',
'A teenage girl navigates family expectations, puberty, friendship, and a fantastical transformation into a red panda.',
'The story values communication and reconciliation, but mixes those strengths with lying, rebellion, and a family spiritual ritual portrayed positively. Orthodox families may see it as a conversation starter rather than a clearly edifying narrative.',
'Puberty, suggestive humor, family conflict, spiritual ritual imagery, and a destructive transformation may be better for tweens/teens.',
[('Family and responsibility','positive',4,'mixed','Family love is central, but obedience and honesty are strained.'),('Forgiveness and reconciliation','positive',4,'affirmed','Mother and daughter begin to understand one another.'),('Dishonesty and betrayal','harmful',3,'mixed','Mei repeatedly hides significant choices from her parents.'),('Occult or misleading spirituality','harmful',3,'descriptive','An ancestral supernatural transformation and family ritual drive the story.'),('Sexual content and immodesty','harmful',2,'descriptive','Puberty and crush-related material, including suggestive humor, are discussed.')],
[('Puberty and suggestive humor','Moderate','Periods, crushes, and body changes are part of the central premise.'),('Family conflict and mystical rituals','Moderate','A tense mother-daughter relationship and ancestral ritual imagery occur.')],
'Growing up requires honest dialogue and a conscience formed by love. Parents can support healthy emotional growth without equating every act of independence or rebellion with maturity.',
['Ephesians 4:25','Colossians 3:20–21'],['When should Mei have spoken honestly with her parents?','How can parents guide growing independence without shame or control?'])
add('Luca',2021,'Animation · Family','PG','luca','edifying','7+',
'Two young sea creatures secretly explore life in an Italian seaside village, where friendship and trust are tested.',
'The film encourages hospitality, loyalty, compassion toward outsiders, and courage. It presents deceit and parental disobedience as part of a larger coming-of-age conflict rather than as a virtue in itself.',
'Chase scenes, bullying, and fear of being discovered may be intense for some younger viewers.',
[('Compassion and service','positive',4,'affirmed','Friends care for one another and resist prejudice.'),('Courage and hope','positive',4,'affirmed','Luca risks rejection to grow and help his friends.'),('Family and responsibility','positive',3,'mixed','Family conflict eventually gives way to understanding.'),('Dishonesty and betrayal','harmful',2,'mixed','The boys hide their identities and disobey parental instructions.')],
[('Bullying and threats','Mild','Characters face prejudice and threats of being captured.'),('Fantasy adventure peril','Mild','Chases, risky swimming, and moments of fear occur.')],
'The obligation to love a neighbor extends to those who appear unfamiliar or strange. The story can help children practice compassion while discussing when secrecy damages trust.',
['Luke 10:33–37','Romans 12:10'],['Why do the villagers fear the unfamiliar?','How can we be welcoming without abandoning truth?'])
add('Soul',2020,'Animation · Philosophical Fantasy','PG','soul','neutral','10+',
'A jazz musician caught between life and death reevaluates his ambition through an imagined realm of souls.',
'The film affirms gratitude, ordinary joy, human relationships, and the dignity of daily life. However, its portrayal of unborn souls and the afterlife is a fictional cosmology incompatible with Orthodox doctrine; treat it as philosophical fiction, not catechesis.',
'Questions about death, existence, and the body–soul relationship can confuse or upset younger viewers.',
[('Compassion and service','positive',4,'affirmed','Joe learns that other people matter beyond his career ambition.'),('Humility and repentance','positive',3,'affirmed','The protagonist reconsiders an overly narrow view of success.'),('Greed and materialism','harmful',2,'condemned','Obsessive ambition is challenged as an insufficient source of meaning.'),('Occult or misleading spirituality','harmful',5,'descriptive','The imagined pre-life, soul assignment system, and afterlife are foundational to the plot.')],
[('Fictional afterlife theology','Strong','Unborn souls, a Great Before, and disembodied journeys dominate the story.'),('Death and existential anxiety','Moderate','The protagonist seemingly dies; intense philosophical questions recur.')],
'Everyday life can become an occasion of thanksgiving, but the Church teaches that the human person is created by God, not assembled through the movie’s imagined pre-life program. Discuss gratitude without absorbing the invented theology.',
['Psalm 139:13–16','James 1:17'],['What makes a life meaningful beyond career success?','How is the film’s picture of souls different from Orthodox teaching?'])
add('Kung Fu Panda',2008,'Animation · Martial Arts','PG','kung-fu-panda','edifying','10+',
'An unlikely panda martial-arts student grows through discipline and friendship to defend his valley.',
'The film rewards perseverance, humility, self-control, and taking responsibility rather than indulging vanity. Its mystical mentor imagery should be understood as part of a stylized fantasy rather than Christian spiritual guidance.',
'Fast-paced fights, weapons, an intimidating prison escape, and body-based insults may trouble younger children.',
[('Humility and repentance','positive',4,'affirmed','Po and his teacher learn to revise unfair assumptions.'),('Courage and hope','positive',4,'affirmed','Po persists in training despite ridicule.'),('Truthfulness and integrity','positive',3,'affirmed','Growth requires accepting responsibility rather than shortcuts.'),('Violence and cruelty','harmful',3,'condemned','Repeated martial-arts battles and intimidating villain scenes occur.'),('Pride and self-glorification','harmful',2,'condemned','Tai Lung’s entitlement and resentment are destructive forces.')],
[('Martial-arts violence','Moderate','Repeated hand-to-hand combat, weapons, and explosions occur.'),('Body-shaming insults','Moderate','Po is mocked for his size and appearance.')],
'Discipline is a way of directing our gifts toward good rather than worshiping personal achievement. Children can also discuss why mockery of someone’s appearance is never a proper measure of worth.',
['1 Timothy 4:8','Philippians 2:3'],['What is the difference between discipline and pride?','How can teammates correct someone without humiliating them?'])
add('The Star',2017,'Animation · Biblical','PG','the-star','edifying','7+',
'An animated Nativity retelling follows animals who become involved in Mary and Joseph’s journey to Bethlehem.',
'The story clearly celebrates the birth of Christ, trust in God, compassion, and sacrificial help. Its animal-centered comedy and invented episodes should be separated from the Gospel narrative.',
'Pursuit, intimidation, and occasional peril make it better suited for children who can handle mild tension.',
[('Faith and trust in God','positive',5,'affirmed','The Nativity and obedience to God are central.'),('Compassion and service','positive',4,'affirmed','Animals and human companions help one another on the journey.'),('Courage and hope','positive',4,'affirmed','The characters persevere despite threats.'),('Violence and cruelty','harmful',2,'condemned','Threatening soldiers and chase scenes create peril.')],
[('Threat and pursuit','Mild','Chases and brief violence occur during the journey.'),('Biblical dramatization','Mild','Talking animals and imaginary incidents are added to the Nativity story.')],
'The Nativity is about the Incarnation of the Son of God, not merely a touching event in a stable. Use the film to open the Gospel accounts and speak about who Christ is.',
['Luke 2:1–20','Matthew 1:18–25'],['Which parts of the film are in the Gospels?','Why does the birth of Christ matter for our salvation?'])
add('Klaus',2019,'Animation · Holiday','PG','klaus','edifying','10+',
'A selfish postman’s friendship with a grieving toymaker gradually changes a community divided by a bitter feud.',
'The film strongly affirms generosity, reconciliation, friendship, and service. It offers positive moral lessons while telling an invented Santa origin story rather than presenting the historical life of St. Nicholas.',
'Feuding families use weapons, traps, and threatening behavior; there is some sad bereavement and mild language.',
[('Compassion and service','positive',5,'affirmed','Small acts of giving transform the community.'),('Forgiveness and reconciliation','positive',5,'affirmed','Long-held family hostilities gradually weaken.'),('Humility and repentance','positive',4,'affirmed','Jesper changes from self-interest to generosity.'),('Violence and cruelty','harmful',2,'condemned','Feuding families threaten one another with traps and weapons.')],
[('Community violence and peril','Moderate','Feuds, threatening weapons, traps, and a near-fatal fall occur.'),('Mild language and emotional loss','Mild','Insults and a story of bereavement are included.')],
'True giving should not be performed merely to earn praise or a reward. Families can contrast the fictional Santa backstory with the generosity associated with the historical St. Nicholas.',
['Matthew 6:3–4','Ephesians 4:32'],['What transforms Jesper’s motives?','How can a small act of kindness begin to heal a long disagreement?'])

# Convert authored entries into ready-to-render seed review data without guessing categories absent.
new=[]
for i,d in enumerate(D):
    safe_id=re.sub(r'[^a-z0-9]+','-',d['title'].lower()).strip('-')
    new.append({
        'id':f'batch1-{d["year"]}-{safe_id}',
        'title':d['title'],'year':d['year'],'genre':d['genre'],'runtime':d['runtime'],
        'officialRating':d['rating'],'synopsis':d['synopsis'],'verdict':d['verdict'],
        'verdictRationale':'Provisional Coptic Orthodox interpretation: '+d['rationale'],
        'age':d['age'],'ageRationale':d['agewhy'],
        'themes':[{'name':n,'type':typ,'score':score,'portrayal':portrayal,'evidence':evidence} for n,typ,score,portrayal,evidence in d['themes']],
        'warnings':[{'name':n,'severity':severity,'details':details} for n,severity,details in d['warnings']],
        'reflection':d['reflection'],'scripture':d['verses'],'questions':d['questions'],
        'sources':[{'label':'Common Sense Media — parental content guide','url':'https://www.commonsensemedia.org/movie-reviews/'+d['slug'],
                    'notes':'The source supports factual content context. Theme scores, age guidance, and spiritual verdicts are independent provisional Coptic Orthodox assessments.'}],
        'isSeed':True,'isDemo':False,'status':'provisional','featured':d['verdict']=='edifying',
        'posterClass':f'p{(i%6)+1}','reviewBatch':'Batch 1 — Classic Family Favorites',
        'editorialConfidence':'provisional-source-informed'
    })

assert len(new)==25,len(new)
keys={(x['title'].lower(),x['year']) for x in existing}
assert not any((x['title'].lower(),x['year']) in keys for x in new)
all_reviews=existing+new
source.write_text('const seedReviews = '+json.dumps(all_reviews,ensure_ascii=False,indent=2)+';\n')
(p/'batch1-review-data.json').write_text(json.dumps(new,ensure_ascii=False,indent=2)+'\n')
print('Added',len(new),'reviews. Total',len(all_reviews))
print('\n'.join(x['title'] for x in new))
