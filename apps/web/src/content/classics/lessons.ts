import type { LessonContent, ClassicsTrackSlug } from "@shared/index";

export const classicsLessons: LessonContent[] = [
  {
    id: "greek-history-city-states",
    track: "greek-history",
    title: "Why the Greek world was a patchwork of city-states",
    description: "Understand why poleis like Athens and Sparta developed distinct political identities.",
    order: 1,
    estimatedMinutes: 6,
    overview: "Ancient Greece was not one unified kingdom. It was a network of independent communities called poleis, usually translated as city-states.",
    body: [
      "Mountains and islands divided mainland Greece into many separate regions. This geography made local independence easier to maintain than centralized rule.",
      "Each polis had its own laws, cults, customs, and military priorities. Athens became famous for naval power and public debate, while Sparta built a society centered on military discipline.",
      "The Greek sense of shared identity came from language, religion, festivals, and stories, not from one ruler controlling the whole region.",
    ],
    keyTakeaways: [
      "A polis was an independent political community, not just a city.",
      "Geography encouraged local autonomy in the Greek world.",
      "Greek unity was cultural more than political.",
    ],
    checkpoints: [
      {
        id: "g1-q1",
        prompt: "What Greek term is usually translated as 'city-state'?",
        acceptedAnswers: ["polis", "poleis"],
        hint: "It begins with 'pol-'.",
        explanation: "Polis is the singular form. Poleis is the plural.",
      },
      {
        id: "g1-q2",
        prompt: "Name one reason Greece did not unify early under a single ruler.",
        acceptedAnswers: ["mountains", "islands", "geography", "terrain"],
        hint: "Think about the landscape.",
        explanation: "Mountainous terrain and island geography helped keep communities separate.",
      },
    ],
  },
  {
    id: "greek-history-persian-wars",
    track: "greek-history",
    title: "Why the Persian Wars mattered",
    description: "See how conflict with Persia shaped Greek identity and Athenian confidence.",
    order: 2,
    estimatedMinutes: 6,
    overview: "The Persian Wars were a series of conflicts in the early fifth century BCE between the Persian Empire and Greek city-states.",
    body: [
      "Persia was a massive empire with greater resources than any individual Greek polis. Greek resistance therefore became a story of survival against overwhelming odds.",
      "Victories such as Marathon, Salamis, and Plataea gave Athens and Sparta prestige, but they also changed the balance of power between the Greek states.",
      "After the wars, Athens used its naval strength to build an empire of its own, which later contributed to tensions with Sparta.",
    ],
    keyTakeaways: [
      "The Persian Wars helped define a shared Greek identity.",
      "Athenian naval power grew sharply after Salamis.",
      "Victory over Persia did not create lasting Greek unity.",
    ],
    checkpoints: [
      {
        id: "g2-q1",
        prompt: "Which battle is best known as a major Greek naval victory over Persia?",
        acceptedAnswers: ["salamis", "battle of salamis"],
        hint: "The battle took place at sea.",
        explanation: "Salamis is the decisive naval victory most often emphasized in survey courses.",
      },
    ],
  },
  {
    id: "roman-history-republic",
    track: "roman-history",
    title: "How the Roman Republic balanced power",
    description: "Learn the basic institutions that kept Roman politics from resting in one pair of hands.",
    order: 1,
    estimatedMinutes: 6,
    overview: "The Roman Republic divided authority among magistrates, the Senate, and popular assemblies so that no single office defined the whole state.",
    body: [
      "Two consuls were elected each year and could check one another. This prevented the most visible executive office from becoming a monarchy in all but name.",
      "The Senate, though technically advisory, carried enormous prestige and influence through elite networks and long experience in governance.",
      "Assemblies of Roman citizens elected officials and passed laws, even though wealth and status shaped who had the most influence in practice.",
    ],
    keyTakeaways: [
      "Roman republican politics was built around shared and limited offices.",
      "The Senate was central even without being a modern legislature.",
      "Roman politics still favored elite influence despite formal citizen participation.",
    ],
    checkpoints: [
      {
        id: "r1-q1",
        prompt: "How many consuls were elected each year in the Roman Republic?",
        acceptedAnswers: ["2", "two"],
        explanation: "The consulship was deliberately shared between two officeholders.",
      },
      {
        id: "r1-q2",
        prompt: "What body held great advisory prestige in the Republic?",
        acceptedAnswers: ["senate", "the senate"],
        explanation: "The Senate was not merely ceremonial; it was one of the Republic's main centers of power.",
      },
    ],
  },
  {
    id: "roman-history-augustus",
    track: "roman-history",
    title: "Why Augustus mattered",
    description: "Understand how Augustus ended the cycle of civil wars while keeping republican language alive.",
    order: 2,
    estimatedMinutes: 5,
    overview: "Augustus is the figure who stabilized Rome after civil war and created the system modern historians call the Principate.",
    body: [
      "He did not simply announce himself as king. Instead, he preserved republican offices and titles while concentrating real power in his own hands.",
      "This political arrangement let Rome present continuity on the surface while operating under a new imperial reality.",
      "Augustus became the model for later emperors because he showed how personal rule could coexist with old republican traditions.",
    ],
    keyTakeaways: [
      "Augustus concentrated power without openly declaring monarchy.",
      "The Principate preserved republican appearances.",
      "His settlement shaped the imperial system for generations.",
    ],
    checkpoints: [
      {
        id: "r2-q1",
        prompt: "What is the modern name for Augustus's political system?",
        acceptedAnswers: ["principate", "the principate"],
        explanation: "Historians use Principate to describe the early imperial system established by Augustus.",
      },
    ],
  },
  {
    id: "mythology-olympians",
    track: "mythology",
    title: "Meet the Olympians",
    description: "Start with the gods who dominate most Greek myth narratives.",
    order: 1,
    estimatedMinutes: 5,
    overview: "The Olympian gods are the major divine figures associated with Mount Olympus and central myth cycles.",
    body: [
      "Zeus rules as king of the gods, but Greek myth does not portray a tidy or morally perfect divine system. The gods compete, feud, and take sides.",
      "Each Olympian has areas of influence: Athena with wisdom and strategy, Poseidon with the sea, Aphrodite with desire, and so on.",
      "Roman writers often identified their own gods with Greek ones, which is why many students learn paired names like Zeus and Jupiter.",
    ],
    keyTakeaways: [
      "Olympian gods have distinct domains and personalities.",
      "Greek myth often explains divine conflict rather than divine perfection.",
      "Greek and Roman divine names often align but are not identical traditions.",
    ],
    checkpoints: [
      {
        id: "m1-q1",
        prompt: "Who is the Greek king of the gods?",
        acceptedAnswers: ["zeus"],
        explanation: "Zeus is the chief Olympian in Greek myth.",
      },
      {
        id: "m1-q2",
        prompt: "Which Roman god is commonly paired with Zeus?",
        acceptedAnswers: ["jupiter"],
        explanation: "Roman Jupiter is commonly identified with Greek Zeus.",
      },
    ],
  },
  {
    id: "mythology-heroes",
    track: "mythology",
    title: "What makes a hero in Greek myth",
    description: "Look at how heroes differ from ordinary people and from the gods.",
    order: 2,
    estimatedMinutes: 5,
    overview: "Greek heroes are not just brave people. They are often larger-than-life figures whose actions affect whole communities and stories.",
    body: [
      "Heroes such as Heracles, Achilles, and Odysseus are remembered for extreme strength, intelligence, or fame, but they also have destructive flaws.",
      "Hero stories often explore mortality. Unlike the gods, heroes are vulnerable, and their reputations must survive them.",
      "A hero in myth is defined as much by narrative significance and cult memory as by moral goodness.",
    ],
    keyTakeaways: [
      "Greek heroes are exceptional but flawed.",
      "Mortality is central to heroic identity.",
      "Heroism in myth is not the same as modern moral perfection.",
    ],
    checkpoints: [
      {
        id: "m2-q1",
        prompt: "Name one famous Greek hero.",
        acceptedAnswers: ["heracles", "achilles", "odysseus", "theseus", "perseus"],
        explanation: "Several answers work here because the goal is recognizing the hero tradition.",
      },
    ],
  },
  {
    id: "famous-figures-alexander",
    track: "famous-figures",
    title: "Alexander the Great in context",
    description: "Place Alexander within Macedonian power and Hellenistic expansion.",
    order: 1,
    estimatedMinutes: 5,
    overview: "Alexander the Great did not emerge from nowhere. He inherited a strong Macedonian kingdom built by Philip II.",
    body: [
      "Philip II reorganized Macedon and expanded its influence over Greece. Alexander inherited this power base and launched campaigns against Persia.",
      "Alexander's conquests spread Greek language and culture widely, but they also created new mixed political worlds rather than a purely Greek empire.",
      "After his death, successor kingdoms divided his empire, shaping the Hellenistic age.",
    ],
    keyTakeaways: [
      "Philip II prepared the ground for Alexander's campaigns.",
      "Alexander's conquests transformed the eastern Mediterranean and Near East.",
      "The Hellenistic world emerged after the fragmentation of his empire.",
    ],
    checkpoints: [
      {
        id: "f1-q1",
        prompt: "Who was Alexander the Great's father?",
        acceptedAnswers: ["philip ii", "philip", "philip the second"],
        explanation: "Philip II of Macedon built the political and military foundation Alexander inherited.",
      },
    ],
  },
  {
    id: "famous-figures-cicero",
    track: "famous-figures",
    title: "Why Cicero still matters",
    description: "Use Cicero to connect Roman politics, rhetoric, and philosophy.",
    order: 2,
    estimatedMinutes: 5,
    overview: "Cicero is one of the most important surviving voices from the late Roman Republic.",
    body: [
      "He was a statesman, lawyer, philosopher, and master of rhetoric. Because so much of his writing survives, he gives historians a detailed window into Roman political life.",
      "Cicero's speeches show how public persuasion worked in Rome, while his letters reveal the anxieties of the Republic's collapse.",
      "He also became enormously influential on later European thought through his Latin prose and political ideas.",
    ],
    keyTakeaways: [
      "Cicero is central because his works survive in unusual quantity.",
      "He helps modern readers understand Roman rhetoric and politics.",
      "His influence continued long after the Republic ended.",
    ],
    checkpoints: [
      {
        id: "f2-q1",
        prompt: "Which Roman statesman is especially famous for rhetoric and surviving letters?",
        acceptedAnswers: ["cicero", "marcus tullius cicero"],
        explanation: "Cicero is the late republican figure most associated with Roman eloquence.",
      },
    ],
  },
  {
    id: "vocabulary-core-nouns",
    track: "vocabulary",
    title: "Core Latin nouns for beginners",
    description: "Start with a small set of high-utility words that appear constantly in beginner texts.",
    order: 1,
    estimatedMinutes: 4,
    overview: "Vocabulary learning works best when small sets are repeated in context. Start with words you will see repeatedly.",
    body: [
      "Roman authors write about families, war, cities, and public life constantly. That makes a few core nouns especially useful early on.",
      "Instead of trying to memorize huge lists, connect each word to a concrete image or scenario.",
      "Words become easier to retain when you revisit them in lessons and quizzes on related topics.",
    ],
    keyTakeaways: [
      "Start small and repeat often.",
      "Concrete associations help memory.",
      "Vocabulary should connect to history and culture rather than stand alone.",
    ],
    checkpoints: [
      {
        id: "v1-q1",
        prompt: "What does the Latin word 'rex' mean?",
        acceptedAnswers: ["king", "a king"],
        explanation: "Rex means king.",
      },
      {
        id: "v1-q2",
        prompt: "What does the Latin word 'urbs' mean?",
        acceptedAnswers: ["city", "a city"],
        explanation: "Urbs means city.",
      },
    ],
  },
  {
    id: "vocabulary-core-verbs",
    track: "vocabulary",
    title: "Core Latin verbs for beginners",
    description: "Add a few essential actions that appear across lessons and quizzes.",
    order: 2,
    estimatedMinutes: 4,
    overview: "Verbs make sentences move. A small set of common verbs gives you leverage quickly.",
    body: [
      "Latin classroom reading often begins with verbs like amo, video, and habeo because they recur so often and anchor simple sentences.",
      "When you learn a verb, connect it to a subject and an object rather than treating it as an isolated glossary item.",
      "Vocabulary review becomes more durable when the same words appear again in cultural and historical contexts.",
    ],
    keyTakeaways: [
      "Verb learning should happen in phrases, not isolated lists.",
      "A small core set is enough for an MVP vocabulary track.",
      "Recycling vocabulary across the site reinforces memory.",
    ],
    checkpoints: [
      {
        id: "v2-q1",
        prompt: "What does the Latin verb 'amo' mean?",
        acceptedAnswers: ["love", "i love", "to love"],
        explanation: "Amo is commonly glossed as I love or to love, depending on the level of analysis.",
      },
    ],
  },
];

export function getLessonsForTrack(track: ClassicsTrackSlug): LessonContent[] {
  return classicsLessons
    .filter((lesson) => lesson.track === track)
    .sort((a, b) => a.order - b.order);
}

export function getLessonById(track: ClassicsTrackSlug, lessonId: string): LessonContent | undefined {
  return classicsLessons.find((lesson) => lesson.track === track && lesson.id === lessonId);
}
