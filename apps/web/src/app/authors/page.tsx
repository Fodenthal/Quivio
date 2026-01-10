import React from "react";
import type { Metadata } from "next/types";

export const metadata: Metadata = {
  title: "Authors | Quivio",
  description: "Meet the human editors and researchers who review Quivio trivia questions and articles.",
};

const authors = [
  {
    name: "Ava Thompson",
    role: "Content Editor & Trivia Host",
    bio: "Former pub-trivia host and education volunteer. Specializes in clear question wording and age-appropriate difficulty tuning.",
    expertise: "Humanities, pop culture, moderation",
  },
  {
    name: "Jordan Lee",
    role: "Research Lead",
    bio: "Researcher with a background in library science. Focuses on sourcing facts from reputable references and adding citations.",
    expertise: "Science, history, sourcing and citations",
  },
  {
    name: "Samira Khan",
    role: "Learning Designer",
    bio: "Designs learning experiences and pacing for classrooms and remote teams. Writes guides and how-to content for hosts.",
    expertise: "Education, facilitation, accessibility",
  },
];

export default function AuthorsPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-12 space-y-6">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.2em] text-indigo-300">Authors</p>
        <h1 className="text-3xl font-bold text-white">Meet the Quivio editorial team</h1>
        <p className="text-gray-400">
          Every article and featured question set is reviewed by a human editor. AI assists with drafting, but final content and fact checks are handled by this team.
        </p>
      </header>

      <div className="grid md:grid-cols-3 gap-4">
        {authors.map((author) => (
          <div key={author.name} className="bg-white/5 border border-white/10 rounded-lg p-5 space-y-2">
            <div>
              <p className="text-lg font-semibold text-white">{author.name}</p>
              <p className="text-sm text-indigo-200">{author.role}</p>
            </div>
            <p className="text-sm text-gray-300">{author.bio}</p>
            <p className="text-xs text-text-secondary">Focus: {author.expertise}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
