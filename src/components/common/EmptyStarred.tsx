import React from 'react';

export const EmptyStarred: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center select-none">
      {/* Google Tasks Girl with Star SVG Illustration */}
      <svg
        viewBox="0 0 240 240"
        className="w-48 h-48 sm:w-56 sm:h-56 mb-4"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Hair bubbles */}
        <circle cx="80" cy="72" r="14" fill="#2B2D2F" />
        <circle cx="88" cy="92" r="13" fill="#2B2D2F" />
        <circle cx="98" cy="112" r="12" fill="#2B2D2F" />
        <circle cx="110" cy="130" r="14" fill="#2B2D2F" />

        {/* Head */}
        <ellipse cx="120" cy="132" rx="14" ry="17" fill="#7C4A27" />
        <path
          d="M110 120 C 114 114, 126 114, 130 122 C 122 120, 114 125, 110 120 Z"
          fill="#2B2D2F"
        />

        {/* Neck */}
        <rect x="114" y="146" width="12" height="10" fill="#7C4A27" />

        {/* Torso / Light Blue Shirt */}
        <path
          d="M96 156 C 88 165, 80 180, 76 195 L 140 195 C 138 180, 134 165, 126 156 Z"
          fill="#BCE0FD"
          stroke="#1F1F1F"
          strokeWidth="1.5"
        />

        {/* Arms */}
        {/* Left Arm */}
        <path
          d="M80 168 C 76 178, 80 190, 92 192"
          stroke="#7C4A27"
          strokeWidth="12"
          strokeLinecap="round"
        />

        {/* Right Arm holding string */}
        <path
          d="M125 168 C 138 178, 142 192, 138 198 C 132 205, 122 202, 124 186 L 126 165"
          stroke="#7C4A27"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* String from star */}
        <line
          x1="126"
          y1="158"
          x2="126"
          y2="182"
          stroke="#1F1F1F"
          strokeWidth="1.5"
        />
        <circle cx="126" cy="184" r="3" stroke="#1F1F1F" strokeWidth="1.5" fill="none" />

        {/* Big Yellow Star */}
        <path
          d="M 126 78 
             L 134 110 
             L 166 110 
             L 140 128 
             L 150 160 
             L 126 142 
             L 102 160 
             L 112 128 
             L 86 110 
             L 118 110 Z"
          fill="#FDE293"
          stroke="#1F1F1F"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>

      <h3 className="text-lg font-medium text-[#1F1F1F] dark:text-[#E3E3E3] tracking-tight">
        No starred tasks
      </h3>
      <p className="text-xs text-[#5F6368] dark:text-[#9AA0A6] mt-1.5 max-w-xs leading-relaxed">
        Mark important tasks with a star so that you can easily find them here
      </p>
    </div>
  );
};
