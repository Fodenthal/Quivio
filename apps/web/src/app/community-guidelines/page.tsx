import React from 'react';
import type { Metadata } from "next/types";

export const metadata: Metadata = {
  title: "Community Guidelines | Quivio",
  description: "Quivio community rules for safe, respectful trivia games. Learn what we allow and how to report issues.",
  openGraph: {
    title: "Community Guidelines | Quivio",
    description: "Rules for safe, respectful trivia games.",
  },
  twitter: {
    card: "summary",
    title: "Community Guidelines | Quivio",
    description: "Rules for safe, respectful trivia games.",
  },
};

const CommunityGuidelinesPage: React.FC = () => (
  <main className="max-w-2xl mx-auto px-4 py-12">
    <h1 className="text-3xl font-bold mb-4 text-white">Community Guidelines</h1>
    <p className="text-gray-600 mb-2">Last Updated: January 15, 2025</p>
    <p className="mb-6 text-gray-400">
      Welcome to Quivio! Our community is built on the foundation of fun, learning, and respectful interaction. 
      These guidelines help ensure everyone has a positive experience while playing trivia games.
    </p>

    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-3 text-gray-100">Our Mission</h2>
      <p className="text-gray-400 mb-4">
        Quivio is designed to create an inclusive, educational, and entertaining environment where people can 
        test their knowledge, learn new things, and connect with others through the joy of trivia. We believe 
        that learning should be fun, accessible, and safe for everyone.
      </p>
    </section>

    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-3 text-gray-100">Core Values</h2>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white/5 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-100 mb-2">🎓 Education</h3>
          <p className="text-gray-400 text-sm">We promote learning and intellectual curiosity through engaging trivia content.</p>
        </div>
        <div className="bg-white/5 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-100 mb-2">🤝 Respect</h3>
          <p className="text-gray-400 text-sm">Treat all community members with kindness, dignity, and respect.</p>
        </div>
        <div className="bg-white/5 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-100 mb-2">🏠 Inclusivity</h3>
          <p className="text-gray-400 text-sm">We welcome people of all backgrounds, ages, and knowledge levels.</p>
        </div>
        <div className="bg-white/5 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-100 mb-2">🛡️ Safety</h3>
          <p className="text-gray-400 text-sm">We maintain a safe environment free from harassment and harmful content.</p>
        </div>
      </div>
    </section>

    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-3 text-gray-100">Appropriate Content & Behavior</h2>
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-gray-100 mb-2">✅ What We Encourage</h3>
          <ul className="list-disc list-inside space-y-1 text-gray-400">
            <li>Friendly competition and good sportsmanship</li>
            <li>Educational discussions about trivia topics</li>
            <li>Constructive feedback and suggestions</li>
            <li>Celebrating others' knowledge and achievements</li>
            <li>Helping new players learn the game</li>
            <li>Creative and interesting trivia topics</li>
          </ul>
        </div>
        
        <div>
          <h3 className="font-semibold text-gray-100 mb-2">❌ What We Don't Allow</h3>
          <ul className="list-disc list-inside space-y-1 text-gray-400">
            <li>Hate speech, discrimination, or harassment</li>
            <li>Explicit sexual content or adult material</li>
            <li>Violence, threats, or intimidation</li>
            <li>Spam, scams, or misleading information</li>
            <li>Impersonation of others or false identities</li>
            <li>Sharing personal information without consent</li>
            <li>Cheating, exploiting bugs, or using bots</li>
            <li>Excessive profanity or offensive language</li>
          </ul>
        </div>
      </div>
    </section>

    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-3 text-gray-100">Content Guidelines</h2>
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-gray-100 mb-2">Game Topics</h3>
          <ul className="list-disc list-inside space-y-1 text-gray-400">
            <li>Topics should be educational, entertaining, or culturally relevant</li>
            <li>Avoid topics that promote violence, discrimination, or harmful stereotypes</li>
            <li>Respect copyright and intellectual property rights</li>
            <li>Topics should be appropriate for a general audience</li>
          </ul>
        </div>
        
        <div>
          <h3 className="font-semibold text-gray-100 mb-2">Chat Messages</h3>
          <ul className="list-disc list-inside space-y-1 text-gray-400">
            <li>Keep conversations friendly and on-topic</li>
            <li>No personal attacks or inflammatory comments</li>
            <li>Avoid excessive use of caps lock or repetitive messages</li>
            <li>Respect others' privacy and boundaries</li>
          </ul>
        </div>
        
        <div>
          <h3 className="font-semibold text-gray-100 mb-2">Usernames & Profiles</h3>
          <ul className="list-disc list-inside space-y-1 text-gray-400">
            <li>Usernames should not be offensive, misleading, or impersonate others</li>
            <li>No usernames that promote hate speech or violence</li>
            <li>Avoid usernames that could be considered spam or advertising</li>
          </ul>
        </div>
      </div>
    </section>

    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-3 text-gray-100">Moderation & Enforcement</h2>
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-gray-100 mb-2">How We Moderate</h3>
          <ul className="list-disc list-inside space-y-1 text-gray-400">
            <li>Automated systems detect inappropriate content and behavior</li>
            <li>Human moderators review reported content and appeals</li>
            <li>Community reports help us identify violations</li>
            <li>We consider context and intent when reviewing violations</li>
          </ul>
        </div>
        
        <div>
          <h3 className="font-semibold text-gray-100 mb-2">Reporting Violations</h3>
          <p className="text-gray-400 mb-2">
            If you encounter content or behavior that violates these guidelines, please report it immediately. 
            You can report violations through:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-400">
            <li>In-game reporting features</li>
            <li>Email to <a href="mailto:moderation@quivio.fun" className="text-blue-400 underline">moderation@quivio.fun</a></li>
            <li>Contact form on our website</li>
          </ul>
        </div>
        
        <div>
          <h3 className="font-semibold text-gray-100 mb-2">Consequences for Violations</h3>
          <div className="space-y-2">
            <div className="bg-red-900/20 border border-red-500/30 p-3 rounded">
              <h4 className="font-semibold text-red-300 mb-1">First Warning</h4>
              <p className="text-gray-400 text-sm">Educational message about the violation and how to avoid it in the future.</p>
            </div>
            <div className="bg-orange-900/20 border border-orange-500/30 p-3 rounded">
              <h4 className="font-semibold text-orange-300 mb-1">Temporary Suspension</h4>
              <p className="text-gray-400 text-sm">24-72 hour suspension from chat or game features for repeated violations.</p>
            </div>
            <div className="bg-red-900/20 border border-red-500/30 p-3 rounded">
              <h4 className="font-semibold text-red-300 mb-1">Account Suspension</h4>
              <p className="text-gray-400 text-sm">1-30 day suspension for serious or repeated violations.</p>
            </div>
            <div className="bg-red-950/20 border border-red-600/30 p-3 rounded">
              <h4 className="font-semibold text-red-200 mb-1">Permanent Ban</h4>
              <p className="text-gray-400 text-sm">Permanent removal from the platform for severe violations or repeated serious offenses.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-3 text-gray-100">Appeals Process</h2>
      <p className="text-gray-400 mb-3">
        If you believe your account was suspended or banned in error, you may appeal the decision:
      </p>
      <ul className="list-disc list-inside space-y-1 text-gray-400">
        <li>Submit an appeal within 30 days of the action</li>
        <li>Provide specific details about why you believe the action was incorrect</li>
        <li>Include any relevant context or evidence</li>
        <li>We will review your appeal within 5-7 business days</li>
        <li>Send appeals to <a href="mailto:appeals@quivio.fun" className="text-blue-400 underline">appeals@quivio.fun</a></li>
      </ul>
    </section>

    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-3 text-gray-100">Safety Tips</h2>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-green-900/20 border border-green-500/30 p-4 rounded">
          <h3 className="font-semibold text-green-300 mb-2">🛡️ Protect Your Privacy</h3>
          <ul className="text-gray-400 text-sm space-y-1">
            <li>• Don't share personal information</li>
            <li>• Use a unique username</li>
            <li>• Be cautious with private messages</li>
          </ul>
        </div>
        <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded">
          <h3 className="font-semibold text-blue-300 mb-2">🎮 Enjoy the Game</h3>
          <ul className="text-gray-400 text-sm space-y-1">
            <li>• Focus on learning and fun</li>
            <li>• Be a good sport</li>
            <li>• Help create a positive environment</li>
          </ul>
        </div>
      </div>
    </section>

    <section className="mb-8">
      <h2 className="text-xl font-semibold mb-3 text-gray-100">Updates to Guidelines</h2>
      <p className="text-gray-400">
        These guidelines may be updated periodically to reflect our growing community and evolving standards. 
        We will notify users of significant changes through in-app notifications or email updates. 
        Continued use of Quivio after changes constitutes acceptance of the updated guidelines.
      </p>
    </section>

    <section>
      <h2 className="text-xl font-semibold mb-3 text-gray-100">Contact Us</h2>
      <p className="text-gray-400 mb-3">
        If you have questions about these guidelines or need clarification on any policy, please contact us:
      </p>
      <div className="space-y-2 text-gray-400">
        <p>• General questions: <a href="mailto:support@quivio.fun" className="text-blue-400 underline">support@quivio.fun</a></p>
        <p>• Report violations: <a href="mailto:moderation@quivio.fun" className="text-blue-400 underline">moderation@quivio.fun</a></p>
        <p>• Appeal decisions: <a href="mailto:appeals@quivio.fun" className="text-blue-400 underline">appeals@quivio.fun</a></p>
      </div>
    </section>
  </main>
);

export default CommunityGuidelinesPage;
