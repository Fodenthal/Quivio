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
    className="w-44 h-24 shrink-0 rounded-xl border border-white/15 bg-white/5 animate-pulse"
  />
);

export function ParentTopicRail({ topics, loading = false, disabled = false, onSelectTopic }: ParentTopicRailProps) {
  const isDisabled = Boolean(disabled);

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold uppercase tracking-wide text-text-secondary/80">
          Explore Parent Topics
        </div>
        <div className="text-xs text-text-secondary/60">Tap to add related subtopics</div>
      </div>
      <div className="flex items-stretch gap-3 overflow-x-auto pb-2 -mx-2 px-2 snap-x snap-mandatory">
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
                  className={`w-48 shrink-0 rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-left transition-transform duration-150 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 snap-start ${buttonClasses}`}
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
                  <div className="text-sm font-semibold text-text-main mb-1 truncate">{topic.displayName}</div>
                  <div className="text-xs text-text-secondary/80">
                    {topic.childCount > 0 ? `${topic.childCount} subtopics` : "Parent topic"}
                  </div>
                  <div className="text-xs text-text-secondary/60 mt-1">
                    {topic.questionCount.toLocaleString()} questions
                  </div>
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

