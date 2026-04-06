import React from "react";
import Link from "next/link";

const questions = [
  {
    prompt: "Which scientist proposed the theory of general relativity?",
    choices: ["Albert Einstein", "Isaac Newton", "Niels Bohr", "Marie Curie"],
    answer: "Albert Einstein",
  },
  {
    prompt: "The Rosetta Stone helped scholars decode which writing system?",
    choices: ["Mayan glyphs", "Egyptian hieroglyphs", "Cuneiform", "Linear B"],
    answer: "Egyptian hieroglyphs",
  },
  {
    prompt: "Which city hosted the first modern Olympic Games in 1896?",
    choices: ["Athens", "Paris", "London", "Rome"],
    answer: "Athens",
  },
  {
    prompt: "What musical interval is known as a perfect fifth?",
    choices: ["7 semitones", "5 semitones", "8 semitones", "12 semitones"],
    answer: "7 semitones",
  },
  {
    prompt: "Who wrote the novel “One Hundred Years of Solitude”?",
    choices: ["Gabriel García Márquez", "Jorge Luis Borges", "Isabel Allende", "Pablo Neruda"],
    answer: "Gabriel García Márquez",
  },
];

export default function SampleQuizPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.2em] text-indigo-300">Sample Quiz</p>
        <h1 className="text-3xl font-bold text-white">Try a 5-question Quivio-style quiz</h1>
        <p className="text-gray-400">
          A quick, read-only sample to show how our questions look. Each item lists the correct answer below.
        </p>
      </header>

      <div className="space-y-4">
        {questions.map((q, idx) => (
          <div key={q.prompt} className="bg-white/5 border border-white/10 rounded-lg p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-indigo-200">Question {idx + 1}</p>
              <p className="text-xs text-text-secondary">Answer below</p>
            </div>
            <p className="text-white font-semibold">{q.prompt}</p>
            <div className="grid sm:grid-cols-2 gap-2">
              {q.choices.map((choice) => (
                <div
                  key={choice}
                  className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-text-secondary"
                >
                  {choice}
                </div>
              ))}
            </div>
            <p className="text-sm text-emerald-300">Answer: {q.answer}</p>
          </div>
        ))}
      </div>

      <div className="bg-white/5 border border-white/10 rounded-lg p-5 space-y-2">
        <h2 className="text-xl font-semibold text-white">Want to play a full game?</h2>
        <p className="text-text-secondary">Create or join a live room to see timers, scoring, and chat in action.</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-500 transition-colors"
        >
          Go to homepage
        </Link>
      </div>
    </main>
  );
}
