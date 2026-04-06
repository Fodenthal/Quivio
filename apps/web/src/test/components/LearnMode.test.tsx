import { describe, expect, it, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LearnHubClient } from "../../app/learn/components/LearnHubClient";
import { LessonPageClient } from "../../app/learn/components/LessonPageClient";
import { classicsTracks } from "../../content/classics/tracks";
import { getLessonsForTrack } from "../../content/classics/lessons";

describe("Learn Mode", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("renders track cards on the learn hub", () => {
    const lessonCounts = Object.fromEntries(
      classicsTracks.map((track) => [track.slug, getLessonsForTrack(track.slug).length]),
    );

    render(<LearnHubClient tracks={classicsTracks} lessonCounts={lessonCounts} />);

    expect(screen.getByText("Greek History")).toBeInTheDocument();
    expect(screen.getByText("Roman History")).toBeInTheDocument();
    expect(screen.getByText("Mythology")).toBeInTheDocument();
  });

  it("marks a lesson complete after correct checkpoint answers", () => {
    const track = classicsTracks.find((candidate) => candidate.slug === "roman-history");
    const lesson = getLessonsForTrack("roman-history")[0];

    if (!track) {
      throw new Error("Expected roman-history track to exist");
    }

    render(
      <LessonPageClient
        track={track}
        lesson={lesson}
        totalLessons={2}
        nextLessonId="roman-history-augustus"
      />,
    );

    const inputs = screen.getAllByPlaceholderText("Type your answer");
    fireEvent.change(inputs[0], { target: { value: "two" } });
    fireEvent.click(screen.getAllByRole("button", { name: /Check answer/i })[0]);
    fireEvent.change(inputs[1], { target: { value: "senate" } });
    fireEvent.click(screen.getAllByRole("button", { name: /Check answer/i })[1]);
    fireEvent.click(screen.getByRole("button", { name: /Complete lesson/i }));

    expect(screen.getByRole("button", { name: /Lesson completed/i })).toBeInTheDocument();
  });
});
