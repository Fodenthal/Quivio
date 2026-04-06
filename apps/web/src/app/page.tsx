import type { Metadata } from "next/types";
import { HomePageClient } from "./HomePageClient";

export const metadata: Metadata = {
  title: "Quivio | Learn Classics and Compete",
  description: "Study Greek and Roman history, mythology, famous figures, and vocabulary, then test yourself in live quiz rooms.",
  openGraph: {
    title: "Quivio | Learn Classics and Compete",
    description: "Learn the classical world with guided lessons, then jump into live quiz rooms on the same topics.",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://www.quivio.fun",
    siteName: "Quivio",
  },
  twitter: {
    card: "summary_large_image",
    title: "Quivio | Learn Classics and Compete",
    description: "Learn the classical world with guided lessons, then jump into live quiz rooms on the same topics.",
  },
};

export default function Home() {
  return <HomePageClient />;
}
