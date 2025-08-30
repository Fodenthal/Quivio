"use client";

import React from "react";

export interface QuivioLogoProps {
  /** Pixel size of the square logo (width = height) */
  size?: number;
  /** Extra classes (e.g., text-indigo-400) */
  className?: string;
  /** Show the Q monogram on the front card */
  showMonogram?: boolean;
}

export const QuivioLogo: React.FC<QuivioLogoProps> = ({
  size = 56,               // default bigger than before
  className = "",
  showMonogram = true,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 256 256"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Quivio Logo"
      className={`block ${className}`}
    >
      {/* translate content down a bit so the icon is optically centered */}
      <g transform="translate(0,16)">
        {/* Back / middle / front cards — all tint with currentColor */}
        <rect x="44" y="76" width="136" height="96" rx="12" fill="currentColor" opacity="0.18" />
        <rect x="64" y="64" width="136" height="96" rx="12" fill="currentColor" opacity="0.36" />
        <rect x="84" y="52" width="136" height="96" rx="12" fill="currentColor" />

        {showMonogram && (
          // Q monogram on the top card
          <g aria-hidden="true">
            {/*
              Top card bounds: x=84..220, y=52..148
              We'll center the Q around (152,100)
            */}
            {/* Q ring */}
            <circle
              cx="152"
              cy="100"
              r="28"
              fill="none"
              stroke="white"
              strokeWidth="10"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.95"
            />
            {/* Q tail (small diagonal) */}
            <rect
              x="168"
              y="110"
              width="12"
              height="26"
              rx="6"
              fill="white"
              opacity="0.95"
              transform="rotate(45 174 123)"
            />
          </g>
        )}
      </g>
    </svg>
  );
};
