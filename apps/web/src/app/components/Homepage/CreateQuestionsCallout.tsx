"use client";

import React from "react";

interface CreateQuestionsCalloutProps {
  onCreateClick: () => void;
}

export const CreateQuestionsCallout: React.FC<CreateQuestionsCalloutProps> = ({ onCreateClick }) => (
  <div className="bg-white/5 border border-white/10 rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.35)] p-4 flex flex-col gap-3">
    <div className="space-y-1">
      <h3 className="text-lg font-semibold text-slate-100">Create Questions</h3>
      <p className="text-sm text-slate-300/80">
        Have great trivia to share? Upload it to our community staging queue and help shape the next mode.
      </p>
    </div>
    <button
      type="button"
      onClick={onCreateClick}
      className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 transition-all duration-200 shadow-lg shadow-indigo-600/30"
    >
      Go to Question Uploads
    </button>
  </div>
);
