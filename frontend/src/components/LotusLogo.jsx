import React from 'react';

export default function LotusLogo({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="potBody" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A855F7"/>
          <stop offset="100%" stopColor="#FF4E8E"/>
        </linearGradient>
        <linearGradient id="potLid" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF4E8E"/>
          <stop offset="100%" stopColor="#FF85B0"/>
        </linearGradient>
        <linearGradient id="potShade" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#A855F7"/>
          <stop offset="100%" stopColor="#7C3AED"/>
        </linearGradient>
        <linearGradient id="steamGrad" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#FF85B0" stopOpacity="0.8"/>
          <stop offset="100%" stopColor="#FF85B0" stopOpacity="0"/>
        </linearGradient>
      </defs>

      {/* Hơi nước */}
      <path d="M36 30 Q33 23 36 15 Q39 23 36 30Z" fill="url(#steamGrad)"/>
      <path d="M50 26 Q47 17 50 8  Q53 17 50 26Z" fill="url(#steamGrad)"/>
      <path d="M64 30 Q61 23 64 15 Q67 23 64 30Z" fill="url(#steamGrad)"/>

      {/* Nắp nồi */}
      <ellipse cx="50" cy="38" rx="28" ry="6" fill="url(#potLid)"/>
      <path d="M22 38 Q22 44 50 44 Q78 44 78 38" fill="#FF4E8E" opacity="0.4"/>
      {/* Núm nắp */}
      <rect x="44" y="31" width="12" height="7" rx="3.5" fill="url(#potLid)"/>
      <ellipse cx="50" cy="31" rx="6" ry="2.5" fill="#FF85B0"/>

      {/* Thân nồi */}
      <path d="M22 42 Q20 74 50 76 Q80 74 78 42Z" fill="url(#potBody)"/>
      <ellipse cx="50" cy="42" rx="28" ry="5" fill="#A855F7"/>

      {/* Bóng sáng thân nồi */}
      <path d="M30 48 Q28 68 36 73" stroke="#C084FC" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.5"/>

      {/* Quai nồi trái */}
      <path d="M22 50 Q12 50 12 57 Q12 64 22 64" stroke="url(#potShade)" strokeWidth="5" fill="none" strokeLinecap="round"/>
      {/* Quai nồi phải */}
      <path d="M78 50 Q88 50 88 57 Q88 64 78 64" stroke="url(#potShade)" strokeWidth="5" fill="none" strokeLinecap="round"/>

      {/* Hoa văn trang trí */}
      <path d="M32 58 Q50 54 68 58" stroke="#C084FC" strokeWidth="1.5" fill="none" opacity="0.5"/>
      <circle cx="50" cy="68" r="2" fill="#C084FC" opacity="0.4"/>
    </svg>
  );
}
