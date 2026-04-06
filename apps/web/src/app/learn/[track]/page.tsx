import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTrackBySlug } from "@/content/classics/tracks";
import { getLessonsForTrack } from "@/content/classics/lessons";
import { vocabularyDecks } from "@/content/classics/vocabulary";
import { TrackDetailClient } from "../components/TrackDetailClient";

interface TrackPageProps {
  params: Promise<{ track: string }>;
}

export async function generateMetadata({ params }: TrackPageProps): Promise<Metadata> {
  const { track } = await params;
  const selectedTrack = getTrackBySlug(track);

  if (!selectedTrack) {
    return {
      title: "Track not found | Quivio",
    };
  }

  return {
    title: `${selectedTrack.title} | Learn Classics | Quivio`,
    description: selectedTrack.description,
  };
}

export default async function TrackPage({ params }: TrackPageProps) {
  const { track } = await params;
  const selectedTrack = getTrackBySlug(track);

  if (!selectedTrack) {
    notFound();
  }

  const lessons = getLessonsForTrack(selectedTrack.slug);
  const vocabularyDeck = vocabularyDecks.find((deck) => deck.track === selectedTrack.slug);

  return (
    <main className="min-h-dvh safe-bottom px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <TrackDetailClient track={selectedTrack} lessons={lessons} vocabularyDeck={vocabularyDeck} />
      </div>
    </main>
  );
}
