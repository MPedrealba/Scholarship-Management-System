import React from 'react';
import { EaristLogo } from '../common/EaristLogo';
import { GraduationCap, Award, CheckCircle2 } from 'lucide-react';

interface HeroBannerProps {
  onOpenScholarships: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ onOpenScholarships }) => {
  return (
    <section className="bg-gradient-to-br from-maroon-primary via-maroon-dark to-maroon-deep text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* ========================================================= */}
          {/* LEFT COLUMN: Vertical Promotional Flyer/Poster Graphic   */}
          {/* ========================================================= */}
          <div className="flex justify-center lg:justify-end">
            <div className="w-full max-w-sm sm:max-w-md bg-white text-neutral-900 rounded-2xl shadow-xl border border-neutral-100 overflow-hidden">
              {/* Poster Header */}
              <div className="bg-maroon-dark text-white py-2.5 px-4 text-center">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-gold-primary">
                  OFFICIAL SFAO INSTITUTIONAL ADVISORY
                </span>
              </div>

              {/* Poster Content */}
              <div className="p-6 space-y-4 text-center">
                <div className="flex justify-center">
                  <div className="p-1 rounded-full bg-neutral-50 border border-neutral-200">
                    <EaristLogo size={60} showText={false} />
                  </div>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider block">
                    Republic of the Philippines
                  </span>
                  <h3 className="text-xs sm:text-sm font-bold text-neutral-800 uppercase tracking-tight">
                    Eulogio &apos;Amang&apos; Rodriguez Institute of Science and Technology
                  </h3>
                  <p className="text-[10px] text-neutral-500 uppercase tracking-wider">
                    Nagtahan, Sampaloc, Manila
                  </p>
                </div>

                <div className="py-1">
                  <h2 className="text-sm sm:text-base font-black text-maroon-primary uppercase tracking-tight leading-snug">
                    EARIST SCHOLARSHIP &amp; FINANCIAL ASSISTANCE SERVICES
                  </h2>
                  <div className="mt-2 inline-block bg-gold-primary text-maroon-deep font-black text-[11px] uppercase tracking-wider px-3 py-1 rounded">
                    ACADEMIC YEAR 2026–2027
                  </div>
                </div>

                {/* Programs Tag List */}
                <div className="pt-1 text-left space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block">
                    Available Grants &amp; Subsidies:
                  </span>
                  <div className="flex flex-wrap gap-1.5 text-[10px] sm:text-[11px] font-bold">
                    <span className="px-2 py-0.5 rounded bg-maroon-subtle text-maroon-primary border border-red-200 flex items-center gap-1">
                      <GraduationCap className="w-3 h-3" />
                      CHED UniFAST (TES)
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200 flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      CHED TDP-SUC
                    </span>
                    <span className="px-2 py-0.5 rounded bg-neutral-100 text-neutral-800 border border-neutral-200">
                      Dean&apos;s Honor &amp; Merit
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Student Assistantship
                    </span>
                  </div>
                </div>

                {/* Qualifications Box */}
                <div className="bg-neutral-50 rounded-lg p-3 border border-neutral-200 text-left text-[11px] text-neutral-700 space-y-1">
                  <span className="font-bold text-maroon-primary block text-[11px] uppercase tracking-wide">
                    General Requirements:
                  </span>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span>Bona fide enrolled EARIST student (COR)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span>General Weighted Average (GWA) ≥ 2.50</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span>Certificate of Indigency / Income Proof</span>
                    </div>
                  </div>
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={onOpenScholarships}
                    className="w-full py-2.5 px-4 rounded-lg font-bold text-xs uppercase tracking-wider bg-maroon-primary hover:bg-maroon-hover text-white shadow-xs transition-colors cursor-pointer"
                  >
                    VIEW DETAILS &amp; APPLICATION
                  </button>
                  <p className="text-[9.5px] text-neutral-400 mt-2">
                    Office of Student Financial Assistance • Room 204 Main Admin Bldg.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* RIGHT COLUMN: STRICT MINIMALISM                           */}
          {/* ========================================================= */}
          <div className="flex flex-col items-start justify-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light text-white tracking-wide uppercase leading-tight font-sans">
              ANNUAL SCHOLARSHIP
              <br />
              PORTAL
            </h1>

            <div className="pt-6 sm:pt-8">
              <button
                type="button"
                onClick={onOpenScholarships}
                className="inline-block px-7 py-3 border-[1.5px] border-white bg-transparent hover:bg-white hover:text-maroon-primary text-white text-xs sm:text-sm font-semibold tracking-wider uppercase transition-colors duration-200 cursor-pointer rounded-lg shadow-sm"
              >
                CLICK HERE TO SEE DETAILS
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
