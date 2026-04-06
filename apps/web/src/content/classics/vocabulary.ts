import type { VocabularyDeck } from "@shared/index";

export const vocabularyDecks: VocabularyDeck[] = [
  {
    id: "vocabulary-foundations",
    track: "vocabulary",
    title: "Classics Vocabulary Foundations",
    description: "A compact review set for the first Latin nouns and verbs used across the site.",
    entries: [
      { term: "rex", translation: "king", notes: "A common noun in political and mythological contexts." },
      { term: "urbs", translation: "city", notes: "Useful for Roman history and urban life." },
      { term: "bellum", translation: "war", notes: "Appears often in historical narratives." },
      { term: "amo", translation: "love / I love", notes: "A standard beginner verb." },
      { term: "video", translation: "see / I see", notes: "Useful in simple reading exercises." },
      { term: "habeo", translation: "have / I have", notes: "A high-frequency verb in beginner Latin." },
    ],
  },
];
