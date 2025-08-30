"use client";

import React from "react";

export function InfoPanel(): React.ReactElement {
  const discordUrl = process.env.NEXT_PUBLIC_DISCORD_URL || "https://discord.gg/";

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.35)] p-5">
      <div className="mb-3">
        <div className="inline-flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wide bg-white/10 text-slate-400 px-2 py-0.5 rounded">
            Beta
          </span>
          <h3 className="text-lg font-semibold text-slate-100">What is Quivio?</h3>
        </div>

        {/* Bulleted list */}
        <ul className="mt-1 list-disc marker:text-indigo-400/80 pl-5 space-y-1.5 text-sm text-slate-300">
          <li>Play trivia on anything, with anyone, in seconds.</li>
          <li>We’re currently in beta, so expect frequent updates as we smooth out the rough edges.</li>
        </ul>
      </div>
      <a
        href={discordUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Join our Discord (opens in a new tab)"
        className="block w-full px-4 py-2 text-center
                   bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg
                   active:scale-95 transition-all duration-300
                   focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
      >
        Join the Discord
      </a>
    </div>
  );
}
