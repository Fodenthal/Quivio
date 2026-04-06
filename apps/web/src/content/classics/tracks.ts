import type { ClassicsTrack, ClassicsTrackSlug } from "@shared/index";

export const classicsTracks: ClassicsTrack[] = [
  {
    slug: "greek-history",
    title: "Greek History",
    description: "City-states, wars, democracy, and the thinkers who shaped the ancient Mediterranean.",
    subtopics: ["Athens and Sparta", "Persian Wars", "Peloponnesian War", "Philosophers"],
    quizTopics: ["Greek History", "Athens", "Sparta", "Ancient Greece"],
  },
  {
    slug: "roman-history",
    title: "Roman History",
    description: "From republic to empire, follow Rome's institutions, leaders, and expansion.",
    subtopics: ["Roman Republic", "Julius Caesar", "Augustus", "Daily life"],
    quizTopics: ["Roman History", "Roman Republic", "Roman Empire", "Julius Caesar"],
  },
  {
    slug: "mythology",
    title: "Mythology",
    description: "Learn the gods, heroes, monsters, and story cycles that structured the classical imagination.",
    subtopics: ["Olympian gods", "Heroes", "Monsters", "Epic stories"],
    quizTopics: ["Greek Mythology", "Roman Mythology", "Gods and Heroes", "Mythology"],
  },
  {
    slug: "famous-figures",
    title: "Famous Figures",
    description: "Meet generals, kings, philosophers, poets, and rulers who defined the classical world.",
    subtopics: ["Generals", "Kings", "Philosophers", "Poets"],
    quizTopics: ["Classical Figures", "Greek Philosophers", "Roman Leaders", "Ancient Biographies"],
  },
  {
    slug: "vocabulary",
    title: "Vocabulary",
    description: "Build a foundation of common Latin terms and useful word families for reading and recall.",
    subtopics: ["Core nouns", "Core verbs", "School terms", "War and politics"],
    quizTopics: ["Latin Vocabulary", "Classics Vocabulary", "Roman Terms", "Latin Basics"],
  },
];

export const classicsTrackMap = new Map<ClassicsTrackSlug, ClassicsTrack>(
  classicsTracks.map((track) => [track.slug, track]),
);

export function getTrackBySlug(slug: string): ClassicsTrack | undefined {
  return classicsTrackMap.get(slug as ClassicsTrackSlug);
}
