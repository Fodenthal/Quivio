import React from 'react';

export interface QuivioLogoProps {
  /** Size of the logo in pixels */
  size?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Quivio logo component featuring stacked cards design
 * Uses currentColor for theming - will inherit text color from parent
 */
export const QuivioLogo: React.FC<QuivioLogoProps> = ({ 
  size = 32, 
  className = "" 
}) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 256 256" 
      xmlns="http://www.w3.org/2000/svg" 
      role="img" 
      aria-label="Quivio Logo"
      className={className}
    >
      {/* back card */}
      <rect x="44" y="76" width="136" height="96" rx="12" fill="currentColor" opacity="0.18"/>
      {/* middle card */}
      <rect x="64" y="64" width="136" height="96" rx="12" fill="currentColor" opacity="0.36"/>
      {/* front card */}
      <rect x="84" y="52" width="136" height="96" rx="12" fill="currentColor"/>
    </svg>
  );
};
