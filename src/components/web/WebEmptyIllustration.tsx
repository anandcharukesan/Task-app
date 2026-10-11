import React from 'react';

export const WebEmptyIllustration: React.FC<{ className?: string }> = ({ className = 'w-48 h-32' }) => {
  return (
    <svg
      viewBox="0 0 200 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Top Left: Pastel Pink Circle with Checkmark */}
      <circle cx="68" cy="28" r="16" fill="#FCE8E6" />
      <path
        d="M62 28.5L66 32.5L74 24.5"
        stroke="#EA4335"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Top Right: Pastel Green Capsule / Pill */}
      <rect x="94" y="22" width="48" height="12" rx="6" fill="#CEEAD6" />
      <rect x="100" y="26" width="28" height="4" rx="2" fill="#34A853" opacity="0.6" />

      {/* Main Desk / Mountain Scene Shapes */}
      {/* Soft Blue Base / Mountain 1 */}
      <path
        d="M80 120L105 52C106 49 110 49 111 52L132 120H80Z"
        fill="#D2E3FC"
      />

      {/* Soft Blue Mountain 2 */}
      <path
        d="M102 120L124 64C125 61 129 61 130 64L152 120H102Z"
        fill="#AECBFA"
      />

      {/* Yellow Figure / Character Head and Torso */}
      <circle cx="78" cy="74" r="14" fill="#FEEFC3" />
      <path
        d="M66 120C66 98 72 88 88 88C104 88 110 98 110 120H66Z"
        fill="#FBBC04"
      />

      {/* Stylized White Laptop & Desk Sheets */}
      {/* Laptop / Screen */}
      <rect
        x="130"
        y="86"
        width="26"
        height="22"
        rx="2"
        transform="rotate(6 130 86)"
        fill="#FFFFFF"
        stroke="#BDC1C6"
        strokeWidth="1.5"
      />
      <rect
        x="134"
        y="90"
        width="18"
        height="14"
        rx="1"
        transform="rotate(6 134 90)"
        fill="#4285F4"
        opacity="0.25"
      />

      {/* White Document / Paper sheet */}
      <path
        d="M116 94L128 88L136 104L124 110L116 94Z"
        fill="#FFFFFF"
        stroke="#DADCE0"
        strokeWidth="1.2"
      />
      <line x1="120" y1="96" x2="128" y2="92" stroke="#BDC1C6" strokeWidth="1" />
      <line x1="122" y1="100" x2="130" y2="96" stroke="#BDC1C6" strokeWidth="1" />

      {/* Gentle Base Desk Line */}
      <line
        x1="50"
        y1="120"
        x2="170"
        y2="120"
        stroke="#E8EAED"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
};
