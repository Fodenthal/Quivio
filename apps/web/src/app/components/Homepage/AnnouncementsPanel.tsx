"use client";

import React, { useEffect, useState } from "react";

interface Announcement {
  id: string;
  title: string;
  summary: string;
  date: string; // ISO string
  url?: string;
}

export function AnnouncementsPanel(): JSX.Element {
  const [announcements, setAnnouncements] = useState<Announcement[] | null>(null);

  useEffect(() => {
    // For pass 1, load static announcements inline. Later we can fetch from /api/announcements
    const staticAnnouncements: Announcement[] = [
      {
        id: "launch-beta",
        title: "Public Beta launched",
        summary: "We’re shipping frequent UI updates and performance fixes. Share feedback in Discord!",
        date: new Date().toISOString(),
        url: process.env.NEXT_PUBLIC_DISCORD_URL,
      },
    ];
    setAnnouncements(staticAnnouncements);
  }, []);

  if (!announcements) {
    return (
      <div className="card p-5">
        <div className="skeleton-text w-28 mb-3"></div>
        <div className="space-y-3">
          <div className="skeleton-text w-full"></div>
          <div className="skeleton-text w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <h3 className="text-lg font-semibold text-text-main mb-3">Announcements</h3>
      {announcements.length === 0 ? (
        <div className="text-sm text-text-secondary">No announcements yet.</div>
      ) : (
        <ul className="space-y-3">
          {announcements.map((a) => (
            <li key={a.id} className="border-t border-white/10 pt-3 first:border-t-0 first:pt-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-text-main">{a.title}</div>
                  <div className="text-sm text-text-secondary line-clamp-2">{a.summary}</div>
                </div>
                <div className="text-xs text-text-secondary whitespace-nowrap">
                  {new Date(a.date).toLocaleDateString()}
                </div>
              </div>
              {a.url && (
                <a
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost mt-2 px-3 py-1.5 text-sm"
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

