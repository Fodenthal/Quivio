import type { Metadata } from "next/types";
import { HomePageClient } from "./HomePageClient";

export const metadata: Metadata = {
  title: "Quivio | Multiplayer Trivia on Anything",
  description: "Create or join multiplayer trivia games in seconds. Pick topics, set difficulty, and play with friends using fresh AI-powered questions.",
  openGraph: {
    title: "Quivio | Multiplayer Trivia on Anything",
    description: "Host or join fast trivia games with AI-generated questions and real-time scoring.",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://www.quivio.fun",
    siteName: "Quivio",
  },
  twitter: {
    card: "summary_large_image",
    title: "Quivio | Multiplayer Trivia on Anything",
    description: "Host or join fast trivia games with AI-generated questions and real-time scoring.",
  },
};

export default function Home() {
  return <HomePageClient />;
}
