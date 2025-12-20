import { MetadataRoute } from "next/types";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://www.quivio.fun";

const staticRoutes = [
  "/",
  "/blog",
  "/privacy-policy",
  "/terms-conditions",
  "/community-guidelines",
  "/about",
  "/contact",
  "/questions",
  "/login",
];

const blogSlugs = [
  "history-of-trivia-games",
  "improve-trivia-skills",
  "science-behind-learning",
  "psychology-competition-trivia",
  "famous-trivia-champions",
  "trivia-improves-social-skills",
  "evolution-quiz-shows",
  "trivia-in-education",
  "art-of-hosting-trivia",
  "sports-trivia",
  "pop-culture-trivia",
  "geography-trivia",
  "science-trivia",
  "literature-trivia",
  "technology-trivia",
  "music-trivia",
  "art-trivia",
  "food-trivia",
  "nature-trivia",
  "space-trivia",
  "philosophy-trivia",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const pages: MetadataRoute.Sitemap = [
    ...staticRoutes.map((path) => ({
      url: `${baseUrl}${path}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: path === "/" ? 1 : 0.7,
    })),
    ...blogSlugs.map((slug) => ({
      url: `${baseUrl}/blog/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];

  return pages;
}
