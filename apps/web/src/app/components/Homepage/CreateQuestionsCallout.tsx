"use client";

import React, { useEffect, useState } from "react";

interface CreateQuestionsCalloutProps {
  onCreateClick: () => void;
}

const formatCount = (count: number | null | undefined) => {
  if (count === null || count === undefined) return "—";
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
};

export const CreateQuestionsCallout: React.FC<CreateQuestionsCalloutProps> = ({ onCreateClick }) => {
  const [totalQuestions, setTotalQuestions] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchStats = async () => {
      try {
        const response = await fetch("/api/question-stats", {
          next: { revalidate: 60 },
        });
        if (!response.ok) {
          throw new Error("Failed to load question stats");
        }
        const payload = (await response.json()) as { totalQuestions: number | null };
        if (!cancelled) {
          setTotalQuestions(payload.totalQuestions ?? null);
        }
      } catch (error) {
        console.warn("Unable to fetch question stats", error);
        if (!cancelled) {
          setTotalQuestions(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void fetchStats();

    return () => {
      cancelled = true;
    };
  }, []);

  const displayTotal = formatCount(totalQuestions);

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.35)] p-4 flex flex-col gap-4">
      <div className="relative">
        <div className="flex items-center justify-between gap-3 mb-1">
          <h3 className="text-lg font-semibold text-slate-100">Create Questions</h3>
          <div className="flex-shrink-0 rounded-full border border-white/15 bg-white/8 px-3 py-1.5 backdrop-blur-sm">
            <span className="text-xs font-medium text-slate-400 whitespace-nowrap">
              {isLoading ? "…" : `${displayTotal} questions`}
            </span>
          </div>
        </div>
        <p className="mt-2 text-sm text-slate-300/80">
          The question database is built by the community.
        </p>
      </div>
      <button
        type="button"
        onClick={onCreateClick}
        className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 transition-all duration-200 shadow-lg shadow-indigo-600/30"
      >
        Upload Questions
      </button>
    </div>
  );
};
