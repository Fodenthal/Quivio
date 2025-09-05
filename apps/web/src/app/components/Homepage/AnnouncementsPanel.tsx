"use client";

import React, { useEffect, useState } from "react";

interface Announcement {
  id: string;
  title: string;
  summary: string;
  date: string; // ISO string
  url?: string;
}

export function AnnouncementsPanel(): React.ReactElement {
  const [announcements, setAnnouncements] = useState<Announcement[] | null>(null);
  const discordUrl = process.env.NEXT_PUBLIC_DISCORD_URL || "https://discord.gg/";

  useEffect(() => {
    // For pass 1, load static announcements inline. Later we can fetch from /api/announcements
    const staticAnnouncements: Announcement[] = [
      {
        id: "images-coming-soon",
        title: "Questions with images coming soon!",
        summary: "Users can upload image questions",
        date: "2025-09-04",
      },
      {
        id: "launch-beta",
        title: "Public Beta launched",
        summary: "Share feedback in Discord please!",
        date: "2025-08-24",
        url: process.env.NEXT_PUBLIC_DISCORD_URL,
      },
    ];
    setAnnouncements(staticAnnouncements);
  }, []);

  if (!announcements) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.35)] p-5">
        <div className="skeleton-text w-28 mb-3"></div>
        <div className="space-y-3">
          <div className="skeleton-text w-full"></div>
          <div className="skeleton-text w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.35)] p-5">
      <h3 className="text-lg font-semibold text-slate-100 mb-3">Announcements</h3>
      {announcements.length === 0 ? (
        <div className="text-sm text-slate-300">No announcements yet.</div>
      ) : (
        <ul className="space-y-3">
          {announcements.map((a) => (
            <li key={a.id} className="border-t border-white/10 pt-3 first:border-t-0 first:pt-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-slate-100">{a.title}</div>
                  <div className="text-sm text-slate-300 line-clamp-2">{a.summary}</div>
                </div>
                <div className="text-xs text-slate-400 whitespace-nowrap">
                  {new Date(a.date + 'T00:00:00').toLocaleDateString()}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      
      {/* Discord Community Button */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <a
          href={discordUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Join our Discord community (opens in a new tab)"
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-center
                     bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg
                     active:scale-95 transition-all duration-300
                     focus:outline-none focus:ring-2 focus:ring-indigo-500/40
                     group"
        >
          <svg 
            className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" 
            fill="currentColor" 
            viewBox="0 0 24 24"
          >
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
          </svg>
          Join the Discord
        </a>
      </div>
    </div>
  );
}

