"use client";

import type { ParentTopicOverview } from "@/types/topics";

interface ParentTopicRailProps {
  topics: ParentTopicOverview[];
  loading?: boolean;
  disabled?: boolean;
  onSelectTopic?: (topic: ParentTopicOverview) => void;
}

const SkeletonCard = ({ index }: { index: number }) => (
  <div
    key={`parent-topic-skeleton-${index}`}
    className="w-44 h-16 shrink-0 rounded-xl border border-white/15 bg-white/5 animate-pulse"
  />
);

export function ParentTopicRail({ topics, loading = false, disabled = false, onSelectTopic }: ParentTopicRailProps) {
  const isDisabled = Boolean(disabled);

  return (
    <div className="mt-6">
      <div className="text-sm font-medium text-text-main mb-2">Explore Gamemodes</div>
      <div className="flex items-stretch gap-3 overflow-x-auto pb-2 -mx-2 px-2 snap-x snap-mandatory no-scrollbar">
        {loading && topics.length === 0
          ? Array.from({ length: 4 }).map((_, index) => <SkeletonCard key={index} index={index} />)
          : topics.map((topic) => {
              const buttonClasses = isDisabled
                ? "cursor-not-allowed opacity-60 border-white/10"
                : "hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/10 active:translate-y-0";

              return (
                <button
                  key={topic.slug}
                  type="button"
                  disabled={isDisabled}
                  className={`w-44 shrink-0 rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-left transition-transform duration-150 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 snap-start ${buttonClasses}`}
                  onMouseDown={(event) => {
                    if (isDisabled) return;
                    event.preventDefault();
                    onSelectTopic?.(topic);
                  }}
                  onTouchStart={(event) => {
                    if (isDisabled) return;
                    event.preventDefault();
                    onSelectTopic?.(topic);
                  }}
                  >
                    <div className="text-sm font-semibold text-text-main truncate">{topic.displayName}</div>
                  </button>
                );
            })}

        {!loading && topics.length === 0 && (
          <div className="text-sm text-text-secondary/70 italic">Parent topics currently unavailable.</div>
        )}
      </div>
    </div>
  );
}
