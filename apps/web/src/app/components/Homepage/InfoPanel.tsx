"use client";

import React from "react";

export function InfoPanel(): React.ReactElement {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.25)] px-4 py-3">
      <p className="text-slate-300 text-xs sm:text-sm md:text-sm lg:text-sm text-center whitespace-nowrap overflow-hidden">
        <span className="font-bold text-indigo-400">Quivio:</span> Trivia on anything, with anyone, in seconds.
      </p>
    </div>
  );
}
