import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTrackBySlug } from "@/content/classics/tracks";
import { getLessonById, getLessonsForTrack } from "@/content/classics/lessons";
import { LessonPageClient } from "../../components/LessonPageClient";

interface LessonPageProps {
  params: Promise<{ track: string; lesson: string }>;
}

export async function generateMetadata({ params }: LessonPageProps): Promise<Metadata> {
  const { track, lesson } = await params;
  const selectedTrack = getTrackBySlug(track);

  if (!selectedTrack) {
    return {
      title: "Lesson not found | Quivio",
    };
  }

  const selectedLesson = getLessonById(selectedTrack.slug, lesson);

  if (!selectedLesson) {
    return {
      title: "Lesson not found | Quivio",
    };
  }

  return {
    title: `${selectedLesson.title} | ${selectedTrack.title} | Quivio`,
    description: selectedLesson.description,
  };
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { track, lesson } = await params;
  const selectedTrack = getTrackBySlug(track);

  if (!selectedTrack) {
    notFound();
  }

  const lessons = getLessonsForTrack(selectedTrack.slug);
  const selectedLesson = getLessonById(selectedTrack.slug, lesson);

  if (!selectedLesson) {
    notFound();
  }

  const nextLesson = lessons.find((candidate) => candidate.order === selectedLesson.order + 1);

  return (
    <main className="min-h-dvh safe-bottom px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <LessonPageClient
          track={selectedTrack}
          lesson={selectedLesson}
          totalLessons={lessons.length}
          nextLessonId={nextLesson?.id}
        />
      </div>
    </main>
  );
}
