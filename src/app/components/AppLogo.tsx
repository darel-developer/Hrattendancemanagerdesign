import React from "react";

export function AppLogo({ size = 36 }: { size?: number }) {
  const id = `hr_grad_${size}`;
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366F1" />
          <stop offset="1" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill={`url(#${id})`} />
      {/* H */}
      <rect x="7" y="11" width="3.5" height="18" rx="1.75" fill="white" />
      <rect x="7" y="18.5" width="10" height="3" rx="1.5" fill="white" />
      <rect x="13.5" y="11" width="3.5" height="18" rx="1.75" fill="white" />
      {/* R */}
      <rect x="21" y="11" width="3.5" height="18" rx="1.75" fill="white" />
      <path d="M24.5 11 H28 C30.2 11 31.8 12.6 31.8 14.5 C31.8 16.4 30.2 18 28 18 H24.5"
        stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <line x1="27.5" y1="18" x2="32.5" y2="28.5" stroke="white" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
