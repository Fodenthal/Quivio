import React from "react";

export interface HeroSectionProps {
  children: [React.ReactNode, React.ReactNode]; // [CreateRoomPanel, JoinRoomPanel]
}

/**
 * Hero section with two-panel layout inspired by JKLM design
 * Responsive design that stacks panels on mobile
 * Optimized for stacked layout with other components
 */
export const HeroSection: React.FC<HeroSectionProps> = ({ children }) => {
  const [createRoomPanel, joinRoomPanel] = children;

  return (
    <div className="flex items-start justify-center p-4">
      <div className="flex flex-col lg:flex-row items-start gap-8 w-full max-w-6xl">
        {/* Create Room Panel - Left Side (Primary) */}
        <div className="flex-1 w-full">
          {createRoomPanel}
        </div>

        {/* Join Room Panel - Right Side */}
        <div className="flex-1 w-full">
          {joinRoomPanel}
        </div>
      </div>
    </div>
  );
}; 