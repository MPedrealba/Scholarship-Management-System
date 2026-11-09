import React from 'react';

interface GovBadgesProps {
  className?: string;
}

export const GovBadges: React.FC<GovBadgesProps> = ({ className = '' }) => {
  return (
    <div className={`flex items-center gap-5 sm:gap-6 select-none ${className}`}>
      {/* 1. Transparency Seal */}
      <a
        href="#transparency"
        className="flex items-center gap-2 hover:opacity-85 transition-opacity"
        title="Transparency Seal"
      >
        <svg
          width="36"
          height="36"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="flex-shrink-0"
        >
          <circle cx="50" cy="50" r="48" fill="#0038A8" stroke="#D4AF37" strokeWidth="3" />
          <circle cx="50" cy="50" r="42" fill="#002b80" stroke="#FFD700" strokeWidth="1" strokeDasharray="3 2" />

          {/* 8-Ray Philippine Sun */}
          <g transform="translate(50, 36)" fill="#FFD700">
            <circle cx="0" cy="0" r="7" />
            <path d="M 0,-12 L 2,-8 L -2,-8 Z" />
            <path d="M 0,12 L 2,8 L -2,8 Z" />
            <path d="M -12,0 L -8,2 L -8,-2 Z" />
            <path d="M 12,0 L 8,2 L 8,-2 Z" />
          </g>

          {/* 3 Stars */}
          <polygon points="26,30 28,34 32,34 29,36 30,40 26,37 22,40 23,36 20,34 24,34" fill="#FFD700" />
          <polygon points="74,30 76,34 80,34 77,36 78,40 74,37 70,40 71,36 68,34 72,34" fill="#FFD700" />
          <polygon points="50,14 52,18 56,18 53,20 54,24 50,21 46,24 47,20 44,18 48,18" fill="#FFD700" />

          {/* Open Oyster Shell & Pearl */}
          <path
            d="M 22,62 C 22,50 34,44 50,44 C 66,44 78,50 78,62 C 78,74 65,80 50,80 C 35,80 22,74 22,62 Z"
            fill="#E8ECEF"
            stroke="#D4AF37"
            strokeWidth="1.5"
          />
          <circle cx="50" cy="60" r="10" fill="#FFFFFF" stroke="#D4AF37" strokeWidth="1" />

          {/* Ribbon */}
          <path
            d="M 18,80 L 30,77 L 50,81 L 70,77 L 82,80 L 78,88 L 50,91 L 22,88 Z"
            fill="#CE1126"
            stroke="#FFD700"
            strokeWidth="1"
          />
          <text
            x="50"
            y="86.5"
            fill="#FFFFFF"
            fontSize="6"
            fontWeight="900"
            fontFamily="system-ui, sans-serif"
            textAnchor="middle"
            letterSpacing="0.8"
          >
            TRANSPARENCY
          </text>
        </svg>
        <span className="text-xs font-bold text-neutral-800 uppercase tracking-tight whitespace-nowrap">
          TRANSPARENCY SEAL
        </span>
      </a>

      {/* 2. Freedom of Information */}
      <a
        href="#foi"
        className="flex items-center gap-2 hover:opacity-85 transition-opacity"
        title="Freedom of Information"
      >
        <svg
          width="36"
          height="36"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="flex-shrink-0"
        >
          <circle cx="50" cy="50" r="48" fill="#FFFFFF" stroke="#D4AF37" strokeWidth="2.5" />
          <path d="M 50,6 A 44,44 0 0,0 50,94 Z" fill="#0038A8" />
          <path d="M 50,6 A 44,44 0 0,1 50,94 Z" fill="#CE1126" />
          <circle cx="50" cy="50" r="30" fill="#FFFFFF" stroke="#FFD700" strokeWidth="1.5" />
          <g transform="translate(50, 50)">
            <path
              d="M -11,-12 L 4,-12 L 12,-4 L 12,14 L -11,14 Z"
              fill="#F8FAFC"
              stroke="#0038A8"
              strokeWidth="1.5"
            />
            <rect x="-16" y="11" width="32" height="9" rx="2" fill="#0038A8" />
            <text
              x="0"
              y="18"
              fill="#FFD700"
              fontSize="7.5"
              fontWeight="900"
              fontFamily="system-ui, sans-serif"
              textAnchor="middle"
              letterSpacing="1"
            >
              FOI
            </text>
          </g>
        </svg>
        <span className="text-xs font-bold text-neutral-800 uppercase tracking-tight whitespace-nowrap">
          FREEDOM OF INFORMATION
        </span>
      </a>
    </div>
  );
};
