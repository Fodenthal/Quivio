"use client";

import React from "react";

export function InfoPanel(): JSX.Element {
  const discordUrl = process.env.NEXT_PUBLIC_DISCORD_URL || "https://discord.gg/";

  return (
    <div className="card p-5">
      <div className="mb-3">
        <div className="inline-flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wide bg-white/10 text-text-secondary px-2 py-0.5 rounded">Beta</span>
          <h3 className="text-lg font-semibold text-text-main">What is Quivio?</h3>
        </div>
        <div className="text-sm text-text-secondary">
          Quivio is a realtime, social trivia game powered by AI-generated questions. We’re currently in beta—expect fast updates and occasional rough edges.
        </div>
      </div>
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

