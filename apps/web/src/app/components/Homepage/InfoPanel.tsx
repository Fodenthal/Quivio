"use client";

import React from "react";

export function InfoPanel(): React.ReactElement {
  const discordUrl = process.env.NEXT_PUBLIC_DISCORD_URL || "https://discord.gg/";

  return (
    <div className="card p-5">
      <div className="mb-3">
        <div className="inline-flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wide bg-white/10 text-text-secondary px-2 py-0.5 rounded">Beta</span>
          <h3 className="text-lg font-semibold text-text-main">What is Quivio?</h3>
        </div>
        <div className="text-sm text-text-secondary">
        Quivio is a realtime, social trivia game powered by AI-generated questions on any topic imaginable. We’re currently in beta so expect frequent updates but nevertheless some very chopped questions and overall rough edges. Please join the discord if you have any feedback at all, we would love to start building a community.
        </div>
      </div>
      <div className="divider my-4" />
      <a
        href={discordUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-primary w-full py-2"
        aria-label="Join our Discord (opens in a new tab)"
      >
        Join the Discord
      </a>
    </div>
  );
}

