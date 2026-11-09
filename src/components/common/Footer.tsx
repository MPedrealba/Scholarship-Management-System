import React from 'react';
import { EaristLogo } from './EaristLogo';
import {
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  Globe,
  Award,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface FooterProps {
  onNavigateScholarships: () => void;
  onNavigateHome: () => void;
  onNavigateLogin?: () => void;
}

const CURRENT_YEAR = new Date().getFullYear();

export const Footer: React.FC<FooterProps> = ({
  onNavigateScholarships,
  onNavigateHome,
  onNavigateLogin,
}) => {
  return (
    <footer className="bg-[#380000] text-neutral-300 text-xs border-t-4 border-amber-400">
      {/* Upper Footer: Seal, Transparency & Quick Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Col 1: Institutional Identity */}
          <div className="lg:col-span-4 space-y-4">
            <div className="cursor-pointer" onClick={onNavigateHome}>
              <EaristLogo size={52} showText={true} lightMode={true} />
            </div>
            <p className="text-neutral-300 text-xs leading-relaxed max-w-sm">
              The premier state college in Manila committed to academic excellence, technological skills development, and accessible higher education for deserving Filipino youth since 1945.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-full bg-white/10 hover:bg-amber-400 hover:text-maroon-900 transition-colors"
                aria-label="EARIST Official Facebook"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a
                href="https://earist.edu.ph"
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-full bg-white/10 hover:bg-amber-400 hover:text-maroon-900 transition-colors"
                aria-label="Official Website"
              >
                <Globe className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Col 2: Scholarship & Financial Assistance Office */}
          <div className="lg:col-span-3 space-y-3">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              <h3 className="text-white font-bold uppercase tracking-wider text-xs">
                Scholarship Office (SFAO)
              </h3>
            </div>
            <ul className="space-y-2 text-neutral-300">
              <li>
                <button
                  onClick={onNavigateScholarships}
                  className="hover:text-amber-300 transition-colors text-left flex items-center gap-1.5"
                >
                  <span className="text-amber-400">▸</span>
                  <span>Weekly Accomplishment Report</span>
                </button>
              </li>
              <li>
                <button
                  onClick={onNavigateScholarships}
                  className="hover:text-amber-300 transition-colors text-left flex items-center gap-1.5"
                >
                  <span className="text-amber-400">▸</span>
                  <span>CHED TDP & TES Grant Validation</span>
                </button>
              </li>
              <li>
                <button
                  onClick={onNavigateScholarships}
                  className="hover:text-amber-300 transition-colors text-left flex items-center gap-1.5"
                >
                  <span className="text-amber-400">▸</span>
                  <span>Academic Excellence Grant Roster</span>
                </button>
              </li>
              <li>
                <button
                  onClick={onNavigateScholarships}
                  className="hover:text-amber-300 transition-colors text-left flex items-center gap-1.5"
                >
                  <span className="text-amber-400">▸</span>
                  <span>Document Evaluation Guidelines</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Campuses & Contacts */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="text-white font-bold uppercase tracking-wider text-xs">
              Campuses & Contact
            </h3>
            <div className="space-y-2.5 text-neutral-300 text-[11px]">
              <div>
                <p className="text-amber-300 font-bold">Manila Main Campus:</p>
                <p className="flex items-start gap-1.5 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span>Nagtahan, Sampaloc, Manila 1008, Philippines</span>
                </p>
              </div>
              <div>
                <p className="text-amber-300 font-bold">Cavite Campus:</p>
                <p className="flex items-start gap-1.5 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span>Brgy. Poblacion 5, GMA, Cavite</span>
                </p>
              </div>
              <div className="pt-1 flex flex-col gap-1">
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-amber-400" />
                  <span>(02) 8716-6273 / 8716-7243</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3 h-3 text-amber-400" />
                  <span>sfao@earist.edu.ph</span>
                </span>
              </div>
            </div>
          </div>

          {/* Col 4: Philippine Transparency & Governance */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-white font-bold uppercase tracking-wider text-xs">
              Good Governance
            </h3>
            <div className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-[11px] font-bold text-white">Transparency Seal</span>
              </div>
              <p className="text-[10px] text-neutral-400 leading-tight">
                In compliance with Section 93 of Republic Act No. 10155 (General Appropriations Act).
              </p>
              <span className="inline-block text-[9px] bg-amber-400 text-[#4a0000] font-black px-1.5 py-0.5 rounded">
                FOI Compliant
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Sub-Footer */}
      <div className="bg-[#240000] py-4 px-4 sm:px-6 lg:px-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left text-[11px] text-neutral-400">
          <div>
            © {CURRENT_YEAR} Eulogio "Amang" Rodriguez Institute of Science and Technology (EARIST). All Rights Reserved.
          </div>
          <div className="flex items-center gap-4 text-neutral-400">
            <a href="#privacy" className="hover:text-amber-300 transition-colors">Privacy Policy</a>
            <span>•</span>
            <a href="#terms" className="hover:text-amber-300 transition-colors">Terms of Use</a>
            <span>•</span>
            <a href="#citizens-charter" className="hover:text-amber-300 transition-colors">Citizen's Charter</a>
            <span>•</span>
            <button
              type="button"
              onClick={() => {
                if (onNavigateLogin) {
                  onNavigateLogin();
                } else {
                  window.location.hash = 'login';
                }
              }}
              className="inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-amber-300 transition-colors cursor-pointer"
              title="Evaluator &amp; Administrator Portal Login"
            >
              <Lock className="w-3 h-3" />
              <span>Login</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
