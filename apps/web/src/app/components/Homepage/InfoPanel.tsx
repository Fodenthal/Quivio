"use client";

import React from "react";

export function InfoPanel(): React.ReactElement {
  return (
    <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3">
      <p className="text-slate-300 text-xs sm:text-sm md:text-sm lg:text-sm text-center">
        <span className="font-bold text-amber-300">Quivio:</span> Learn the classical world, then prove what you know.
      </p>
    </div>
  );
}
