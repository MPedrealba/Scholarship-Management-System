import React from 'react';
import earistLogoImg from '../../assets/earist-logo.png';

interface EaristLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  lightMode?: boolean;
}

export const EaristLogo: React.FC<EaristLogoProps> = ({
  className = '',
  size = 54,
  showText = false,
  lightMode = false,
}) => {
  return (
    <div className={`flex items-center gap-3.5 select-none ${className}`}>
      {/* Official Uploaded EARIST Circular Seal Image */}
      <img
        src={earistLogoImg}
        alt="EARIST Official Seal"
        width={size}
        height={size}
        style={{ width: `${size}px`, height: `${size}px` }}
        className="flex-shrink-0 object-contain drop-shadow-xs"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = '/images/earist logo.png';
        }}
      />

      {/* Institutional Typography (when showText is enabled) */}
      {showText && (
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1.5">
            <span
              className={`text-[15px] sm:text-[17px] font-black tracking-wider leading-tight uppercase ${
                lightMode ? 'text-white' : 'text-neutral-900'
              }`}
            >
              Eulogio &quot;Amang&quot; Rodriguez
            </span>
          </div>
          <span
            className={`text-xs sm:text-[13px] font-bold tracking-tight leading-tight ${
              lightMode ? 'text-gold-light' : 'text-maroon-primary'
            }`}
          >
            Institute of Science and Technology
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className={`text-[10px] tracking-widest uppercase font-semibold ${
                lightMode ? 'text-neutral-300' : 'text-neutral-500'
              }`}
            >
              Nagtahan, Sampaloc, Manila
            </span>
            <span
              className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase tracking-wider ${
                lightMode ? 'bg-gold-primary text-maroon-deep' : 'bg-maroon-subtle text-maroon-primary'
              }`}
            >
              State College
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
