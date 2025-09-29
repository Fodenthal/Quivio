import React from "react";
import { QuestionUploadPanel } from "@/app/components/QuestionUploadPanel";

export default function QuestionsPage() {
  return (
    <main className="min-h-dvh bg-slate-950 text-white">
      <div className="safe-top" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Question Uploads</h1>
          <p className="text-sm text-white/70">
            Draft new trivia for the community. Questions land in a staging queue for moderation before they go live.
          </p>
        </div>
        <QuestionUploadPanel />
      </div>
      <div className="safe-bottom" />
    </main>
  );
}
