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

  useEffect(() => {
    // For pass 1, load static announcements inline. Later we can fetch from /api/announcements
    const staticAnnouncements: Announcement[] = [
      {
        id: "launch-beta",
        title: "Public Beta launched",
        summary: "Share feedback in Discord please!",
        date: new Date().toISOString(),
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
                  {new Date(a.date).toLocaleDateString()}
                </div>
              </div>
              {a.url && (
                <a
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 px-3 py-1.5 text-sm bg-white/5 text-indigo-300 hover:text-indigo-200 hover:bg-white/10 rounded-lg transition-all duration-300"
                >
                  Learn more
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

