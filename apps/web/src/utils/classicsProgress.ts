import type { ClassicsTrackSlug, TrackProgress } from "@shared/index";

const STORAGE_KEY = "quivioClassicsProgress";

type ProgressState = Partial<Record<ClassicsTrackSlug, TrackProgress>>;

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function parseProgress(raw: string | null): ProgressState {
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as ProgressState;
    return parsed ?? {};
  } catch {
    return {};
  }
}

export function readAllTrackProgress(): ProgressState {
  if (!isBrowser()) return {};
  return parseProgress(window.localStorage.getItem(STORAGE_KEY));
}

export function getTrackProgress(track: ClassicsTrackSlug): TrackProgress {
  const stored = readAllTrackProgress()[track];

  if (stored) {
    return stored;
  }

  return {
    track,
    completedLessonIds: [],
    masteryScore: 0,
  };
}

export function completeLesson(track: ClassicsTrackSlug, lessonId: string, totalLessons: number): TrackProgress {
  if (!isBrowser()) {
    return {
      track,
      completedLessonIds: [lessonId],
      masteryScore: totalLessons > 0 ? Math.round((100 / totalLessons)) : 0,
      lastLessonId: lessonId,
    };
  }

  const allProgress = readAllTrackProgress();
  const current = getTrackProgress(track);
  const completedLessonIds = current.completedLessonIds.includes(lessonId)
    ? current.completedLessonIds
    : [...current.completedLessonIds, lessonId];
  const masteryScore = totalLessons > 0
    ? Math.min(100, Math.round((completedLessonIds.length / totalLessons) * 100))
    : 0;

  const updated: TrackProgress = {
    track,
    completedLessonIds,
    masteryScore,
    lastLessonId: lessonId,
  };

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      ...allProgress,
      [track]: updated,
    }),
  );

  return updated;
}
