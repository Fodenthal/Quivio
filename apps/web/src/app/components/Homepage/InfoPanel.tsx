"use client";

import React from "react";

export function InfoPanel(): React.ReactElement {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.35)] p-5">
      <div className="inline-flex items-center gap-2 mb-1">
        <span className="text-xs font-semibold uppercase tracking-wide bg-white/10 text-slate-400 px-2 py-0.5 rounded">
          Beta
        </span>
        <h3 className="text-lg font-semibold text-slate-100">What is Quivio?</h3>
      </div>

      {/* Bulleted list */}
      <ul className="mt-1 list-disc marker:text-indigo-400/80 pl-5 space-y-1.5 text-sm text-slate-300">
        <li>Play trivia on anything, with anyone, in seconds.</li>
        <li>We're currently in beta, so expect frequent updates as we smooth out the rough edges.</li>
      </ul>
    </div>
  );
}
