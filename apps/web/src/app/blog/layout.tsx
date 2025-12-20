import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: {
    template: '%s | Quivio Blog',
    default: 'Quivio Blog - Trivia Knowledge & Insights',
  },
  description: "Discover the fascinating world of trivia across 20 diverse categories, from sports and science to philosophy and space exploration. Learn proven strategies, explore the science behind learning, and master the art of hosting engaging trivia events.",
  keywords: [
    "trivia",
    "knowledge",
    "education",
    "learning",
    "quiz",
    "games",
    "history",
    "science",
    "sports",
    "entertainment",
    "geography",
    "literature",
    "technology",
    "music",
    "art",
    "food",
    "nature",
    "space",
    "philosophy"
  ],
  authors: [{ name: "Quivio Team" }],
  creator: "Quivio",
  publisher: "Quivio",
  category: "Education",
  openGraph: {
    title: "Quivio Blog - Trivia Knowledge & Insights",
    description: "Discover the fascinating world of trivia across 20 diverse categories. Learn proven strategies and explore the science behind knowledge.",
    url: "https://quivio.com/blog",
    siteName: "Quivio",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Quivio Blog - Trivia Knowledge & Insights",
    description: "Discover the fascinating world of trivia across 20 diverse categories. Learn proven strategies and explore the science behind knowledge.",
    creator: "@quivio",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Script
        id="adsbygoogle-blog-init"
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"
        async
        crossOrigin="anonymous"
        data-ad-client="ca-pub-7659818852435801"
        strategy="afterInteractive"
      />
      {/* Blog Content */}
      <div className="min-h-screen">
        {children}
      </div>
    </>
  );
}
