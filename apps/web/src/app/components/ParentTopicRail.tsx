"use client";

import { useRef, type PointerEvent as ReactPointerEvent } from "react";
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
  const touchTrackingRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    moved: boolean;
  } | null>(null);
  const ignoreNextClickRef = useRef(false);

  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (isDisabled || event.pointerType !== "touch") return;

    touchTrackingRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
    };
    ignoreNextClickRef.current = false;
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (isDisabled || event.pointerType !== "touch") return;
    const tracking = touchTrackingRef.current;
    if (!tracking || tracking.pointerId !== event.pointerId || tracking.moved) {
      return;
    }

    const deltaX = Math.abs(event.clientX - tracking.startX);
    const deltaY = Math.abs(event.clientY - tracking.startY);
    if (deltaX > 8 || deltaY > 8) {
      tracking.moved = true;
      ignoreNextClickRef.current = true;
    }
  };

  const resetPointerTracking = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.pointerType !== "touch") return;
    touchTrackingRef.current = null;
  };

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
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={resetPointerTracking}
                  onPointerCancel={resetPointerTracking}
                  onPointerLeave={resetPointerTracking}
                  onClick={() => {
                    if (isDisabled) return;
                    if (ignoreNextClickRef.current) {
                      ignoreNextClickRef.current = false;
                      return;
                    }
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
