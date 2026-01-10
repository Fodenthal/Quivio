import React from "react";
import Link from "next/link";
import type { Metadata } from "next/types";

export const metadata: Metadata = {
  title: "Editorial Policy | Quivio",
  description: "Learn how Quivio sources, reviews, and moderates trivia questions and articles.",
};

export default function EditorialPolicyPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-12 space-y-6">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.2em] text-indigo-300">Editorial Policy</p>
        <h1 className="text-3xl font-bold text-white">How Quivio builds and reviews content</h1>
        <p className="text-gray-400">
          We combine human expertise with AI assistance to produce safe, accurate, and engaging trivia. This page explains
          how we source, review, and update questions and articles.
        </p>
      </header>

      <section className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-3">
        <h2 className="text-xl font-semibold text-white">Sourcing and authorship</h2>
        <ul className="list-disc list-inside text-gray-300 space-y-2">
          <li>Questions start from human-authored prompts and topic lists curated by educators and experienced hosts.</li>
          <li>AI helps draft variants, but every live question is screened by a human reviewer for clarity, difficulty, and appropriateness.</li>
          <li>Blog articles are outlined and edited by humans; AI may assist with drafts, but final copy is reviewed and fact-checked before publishing.</li>
        </ul>
      </section>

      <section className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-3">
        <h2 className="text-xl font-semibold text-white">Accuracy and citations</h2>
        <ul className="list-disc list-inside text-gray-300 space-y-2">
          <li>We verify facts against reputable sources (e.g., Britannica, academic sites, official league or museum sites).</li>
          <li>Articles include inline citations or source lists; question answers link to a reference during internal review.</li>
          <li>We correct errors within 48 hours of a report; see the contact and report links below.</li>
        </ul>
      </section>

      <section className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-3">
        <h2 className="text-xl font-semibold text-white">Safety, moderation, and updates</h2>
        <ul className="list-disc list-inside text-gray-300 space-y-2">
          <li>We reject content that is hateful, violent, explicit, or personally identifying. Automated filters flag risky prompts before human review.</li>
          <li>Community reports are triaged daily; repeat issues lead to topic-level blocks and question takedowns.</li>
          <li>Question sets are refreshed weekly; stale or disputed questions are rotated out until corrected.</li>
        </ul>
      </section>

      <section className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-3">
        <h2 className="text-xl font-semibold text-white">How to report issues</h2>
        <p className="text-gray-300">
          If you spot an error or inappropriate content, email{" "}
          <a href="mailto:moderation@quivio.fun" className="text-blue-400 underline">moderation@quivio.fun</a> or use the contact form on{" "}
          <Link href="/contact" className="text-blue-400 underline">our contact page</Link>. Include the game pin, topic, and the question text if possible.
        </p>
      </section>

      <section className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-3">
        <h2 className="text-xl font-semibold text-white">Update cadence</h2>
        <p className="text-gray-300">
          This policy was last reviewed on March 07, 2025. We update it quarterly or whenever we change our review process.
        </p>
      </section>
    </main>
  );
}
