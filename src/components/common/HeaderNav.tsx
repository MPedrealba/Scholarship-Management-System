import React, { useState, useEffect, useRef } from 'react';
import { EaristLogo } from './EaristLogo';
import { GovBadges } from './GovBadges';
import { Menu, X, ChevronDown, Lock, ShieldCheck, Award } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface HeaderNavProps {
  currentView: 'home' | 'scholarships' | 'login';
  onNavigate: (view: 'home' | 'scholarships' | 'login') => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({ currentView, onNavigate }) => {
  const { currentUser, logoutToStudent } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = (name: string) => {
    setActiveDropdown((prev) => (prev === name ? null : name));
  };

  const handleLinkClick = (hashOrAction?: string) => {
    setActiveDropdown(null);
    setMobileMenuOpen(false);
    if (hashOrAction === 'scholarships') {
      onNavigate('scholarships');
    } else {
      if (currentView !== 'home') {
        onNavigate('home');
      }
      if (hashOrAction && hashOrAction.startsWith('#')) {
        setTimeout(() => {
          const el = document.querySelector(hashOrAction);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  };

  return (
    <header ref={navRef} className="sticky top-0 z-40 w-full bg-white border-b border-neutral-200 shadow-xs">
      {/* 1. TOP ROW: Pure White Background (#FFFFFF) */}
      <div className="bg-white border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* LEFT: Circular EARIST seal + single-line red bold title */}
            <div
              className="flex items-center gap-3 cursor-pointer select-none min-w-0"
              onClick={() => onNavigate('home')}
              title="EARIST Home"
            >
              <EaristLogo size={52} showText={false} className="flex-shrink-0" />
              <span className="text-[#CC181E] font-bold text-xs sm:text-sm md:text-base lg:text-lg tracking-tight uppercase whitespace-nowrap overflow-hidden text-ellipsis">
                EULOGIO &apos;AMANG&apos; RODRIGUEZ INSTITUTE OF SCIENCE AND TECHNOLOGY
              </span>
            </div>

            {/* RIGHT: Transparency Seal + Freedom of Information + Active Role Badge & Login */}
            <div className="hidden md:flex items-center gap-3 flex-shrink-0">
              <GovBadges />

              {/* RBAC Session Status & Navigation */}
              <div className="pl-3 border-l border-neutral-200 flex items-center gap-2">
                {currentUser.role === 'student' ? (
                  <button
                    type="button"
                    onClick={() => onNavigate('login')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#800000] text-white hover:bg-red-900 shadow-2xs transition-all cursor-pointer whitespace-nowrap"
                    title="Sign in with your EARIST faculty, evaluator, or administrative credentials"
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-300" />
                    <span>[ Evaluator / Admin Login ]</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 bg-neutral-50 px-2.5 py-1 rounded-lg border border-neutral-200">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      {currentUser.role === 'superadmin' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-purple-900">
                          <Award className="w-3.5 h-3.5 text-purple-600" />
                          <span>Logged in: Super Admin</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-900">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Logged in: {currentUser.title}</span>
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        logoutToStudent();
                        onNavigate('login');
                      }}
                      className="text-[11px] font-semibold text-[#800000] hover:text-red-900 hover:underline px-1.5 py-0.5 rounded border border-neutral-300 bg-white cursor-pointer"
                      title="Switch active role or log out"
                    >
                      [ Log Out / Switch ]
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Hamburger Menu Button */}
            <div className="flex items-center lg:hidden flex-shrink-0">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1.5 text-[#CC181E] hover:bg-neutral-50 rounded focus:outline-none"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. NAVBAR ROW: Clean White Background with Plain Red Uppercase Links */}
      <nav className="bg-white hidden lg:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-11">
            <div className="flex items-center space-x-3 xl:space-x-4 text-xs font-bold text-[#CC181E] tracking-wider uppercase">
              {/* 1. PRESIDENT'S CORNER */}
              <button
                type="button"
                onClick={() => handleLinkClick('#announcements')}
                className="hover:text-red-800 transition-colors whitespace-nowrap"
              >
                PRESIDENT&apos;S CORNER
              </button>

              {/* 2. ABOUT US (Dropdown) */}
              <div
                className="relative"
                onMouseEnter={() => setActiveDropdown('aboutUs')}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button
                  type="button"
                  onClick={() => toggleDropdown('aboutUs')}
                  className="flex items-center gap-0.5 hover:text-red-800 transition-colors whitespace-nowrap"
                  aria-expanded={activeDropdown === 'aboutUs'}
                >
                  <span>ABOUT US</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                {activeDropdown === 'aboutUs' && (
                  <div className="absolute left-0 mt-0 w-56 bg-white rounded shadow-lg border border-neutral-200 py-1.5 z-50">
                    <a
                      href="#colleges"
                      onClick={() => handleLinkClick('#colleges')}
                      className="block px-4 py-1.5 text-xs font-semibold text-neutral-700 hover:text-[#CC181E] hover:bg-red-50"
                    >
                      Vision, Mission &amp; Goals
                    </a>
                    <a
                      href="#announcements"
                      onClick={() => handleLinkClick('#announcements')}
                      className="block px-4 py-1.5 text-xs font-semibold text-neutral-700 hover:text-[#CC181E] hover:bg-red-50"
                    >
                      Quality Policy (ISO 9001:2015)
                    </a>
                    <a
                      href="#announcements"
                      onClick={() => handleLinkClick('#announcements')}
                      className="block px-4 py-1.5 text-xs font-semibold text-neutral-700 hover:text-[#CC181E] hover:bg-red-50"
                    >
                      Institutional History (1945)
                    </a>
                    <a
                      href="#services"
                      onClick={() => handleLinkClick('#services')}
                      className="block px-4 py-1.5 text-xs font-semibold text-neutral-700 hover:text-[#CC181E] hover:bg-red-50"
                    >
                      Citizen&apos;s Charter
                    </a>
                  </div>
                )}
              </div>

              {/* 3. ABOUT EARIST (Dropdown) */}
              <div
                className="relative"
                onMouseEnter={() => setActiveDropdown('aboutEarist')}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button
                  type="button"
                  onClick={() => toggleDropdown('aboutEarist')}
                  className="flex items-center gap-0.5 hover:text-red-800 transition-colors whitespace-nowrap"
                  aria-expanded={activeDropdown === 'aboutEarist'}
                >
                  <span>ABOUT EARIST</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                {activeDropdown === 'aboutEarist' && (
                  <div className="absolute left-0 mt-0 w-56 bg-white rounded shadow-lg border border-neutral-200 py-1.5 z-50">
                    <a
                      href="#announcements"
                      onClick={() => handleLinkClick('#announcements')}
                      className="block px-4 py-1.5 text-xs font-semibold text-neutral-700 hover:text-[#CC181E] hover:bg-red-50"
                    >
                      Board of Trustees
                    </a>
                    <a
                      href="#announcements"
                      onClick={() => handleLinkClick('#announcements')}
                      className="block px-4 py-1.5 text-xs font-semibold text-neutral-700 hover:text-[#CC181E] hover:bg-red-50"
                    >
                      Manila Main Campus
                    </a>
                    <a
                      href="#announcements"
                      onClick={() => handleLinkClick('#announcements')}
                      className="block px-4 py-1.5 text-xs font-semibold text-neutral-700 hover:text-[#CC181E] hover:bg-red-50"
                    >
                      Cavite Campus
                    </a>
                  </div>
                )}
              </div>

              {/* 4. STUDENT SERVICES (Dropdown) */}
              <div
                className="relative"
                onMouseEnter={() => setActiveDropdown('studentServices')}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button
                  type="button"
                  onClick={() => toggleDropdown('studentServices')}
                  className="flex items-center gap-0.5 hover:text-red-800 transition-colors whitespace-nowrap"
                  aria-expanded={activeDropdown === 'studentServices'}
                >
                  <span>STUDENT SERVICES</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                {activeDropdown === 'studentServices' && (
                  <div className="absolute left-0 mt-0 w-60 bg-white rounded shadow-lg border border-neutral-200 py-1.5 z-50">
                    <button
                      type="button"
                      onClick={() => handleLinkClick('scholarships')}
                      className="w-full text-left px-4 py-1.5 text-xs font-bold text-[#CC181E] hover:bg-red-50"
                    >
                      Scholarship &amp; Financial Assistance (SFAO)
                    </button>
                    <a
                      href="#services"
                      onClick={() => handleLinkClick('#services')}
                      className="block px-4 py-1.5 text-xs font-semibold text-neutral-700 hover:text-[#CC181E] hover:bg-red-50"
                    >
                      Office of Student Affairs (OSA)
                    </a>
                    <a
                      href="#services"
                      onClick={() => handleLinkClick('#services')}
                      className="block px-4 py-1.5 text-xs font-semibold text-neutral-700 hover:text-[#CC181E] hover:bg-red-50"
                    >
                      Registrar &amp; Student Records
                    </a>
                  </div>
                )}
              </div>

              {/* 5. SCHOLARSHIP PORTAL (Standard Plain Red Text Link) */}
              <button
                type="button"
                onClick={() => onNavigate('scholarships')}
                className={`hover:text-red-800 transition-colors whitespace-nowrap font-bold ${
                  currentView === 'scholarships' ? 'underline underline-offset-4 decoration-2' : ''
                }`}
                title="EARIST Scholarship Portal"
              >
                SCHOLARSHIP PORTAL
              </button>

              {/* 6. INSTRUCTION (Dropdown) */}
              <div
                className="relative"
                onMouseEnter={() => setActiveDropdown('instruction')}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button
                  type="button"
                  onClick={() => toggleDropdown('instruction')}
                  className="flex items-center gap-0.5 hover:text-red-800 transition-colors whitespace-nowrap"
                  aria-expanded={activeDropdown === 'instruction'}
                >
                  <span>INSTRUCTION</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                {activeDropdown === 'instruction' && (
                  <div className="absolute left-0 mt-0 w-64 bg-white rounded shadow-lg border border-neutral-200 py-1.5 z-50">
                    <a
                      href="#colleges"
                      onClick={() => handleLinkClick('#colleges')}
                      className="block px-4 py-1.5 text-xs font-semibold text-neutral-700 hover:text-[#CC181E] hover:bg-red-50"
                    >
                      College of Engineering (CEN)
                    </a>
                    <a
                      href="#colleges"
                      onClick={() => handleLinkClick('#colleges')}
                      className="block px-4 py-1.5 text-xs font-semibold text-neutral-700 hover:text-[#CC181E] hover:bg-red-50"
                    >
                      College of Industrial Technology (CIT)
                    </a>
                    <a
                      href="#colleges"
                      onClick={() => handleLinkClick('#colleges')}
                      className="block px-4 py-1.5 text-xs font-semibold text-neutral-700 hover:text-[#CC181E] hover:bg-red-50"
                    >
                      College of Arts and Sciences (CAS)
                    </a>
                    <a
                      href="#colleges"
                      onClick={() => handleLinkClick('#colleges')}
                      className="block px-4 py-1.5 text-xs font-semibold text-neutral-700 hover:text-[#CC181E] hover:bg-red-50"
                    >
                      College of Business Administration (CBA)
                    </a>
                    <a
                      href="#colleges"
                      onClick={() => handleLinkClick('#colleges')}
                      className="block px-4 py-1.5 text-xs font-semibold text-neutral-700 hover:text-[#CC181E] hover:bg-red-50"
                    >
                      College of Education (CED)
                    </a>
                    <a
                      href="#colleges"
                      onClick={() => handleLinkClick('#colleges')}
                      className="block px-4 py-1.5 text-xs font-semibold text-neutral-700 hover:text-[#CC181E] hover:bg-red-50"
                    >
                      Architecture &amp; Fine Arts (CAFA)
                    </a>
                    <a
                      href="#colleges"
                      onClick={() => handleLinkClick('#colleges')}
                      className="block px-4 py-1.5 text-xs font-semibold text-neutral-700 hover:text-[#CC181E] hover:bg-red-50"
                    >
                      Hospitality Management (CHM)
                    </a>
                  </div>
                )}
              </div>

              {/* 7. RESEARCH (Dropdown) */}
              <div
                className="relative"
                onMouseEnter={() => setActiveDropdown('research')}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button
                  type="button"
                  onClick={() => toggleDropdown('research')}
                  className="flex items-center gap-0.5 hover:text-red-800 transition-colors whitespace-nowrap"
                  aria-expanded={activeDropdown === 'research'}
                >
                  <span>RESEARCH</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                {activeDropdown === 'research' && (
                  <div className="absolute left-0 mt-0 w-56 bg-white rounded shadow-lg border border-neutral-200 py-1.5 z-50">
                    <a
                      href="#services"
                      onClick={() => handleLinkClick('#services')}
                      className="block px-4 py-1.5 text-xs font-semibold text-neutral-700 hover:text-[#CC181E] hover:bg-red-50"
                    >
                      Office of Research Services
                    </a>
                    <a
                      href="#services"
                      onClick={() => handleLinkClick('#services')}
                      className="block px-4 py-1.5 text-xs font-semibold text-neutral-700 hover:text-[#CC181E] hover:bg-red-50"
                    >
                      Research Journal
                    </a>
                  </div>
                )}
              </div>

              {/* 8. EXTENSION (Dropdown) */}
              <div
                className="relative"
                onMouseEnter={() => setActiveDropdown('extension')}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button
                  type="button"
                  onClick={() => toggleDropdown('extension')}
                  className="flex items-center gap-0.5 hover:text-red-800 transition-colors whitespace-nowrap"
                  aria-expanded={activeDropdown === 'extension'}
                >
                  <span>EXTENSION</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                {activeDropdown === 'extension' && (
                  <div className="absolute left-0 mt-0 w-56 bg-white rounded shadow-lg border border-neutral-200 py-1.5 z-50">
                    <a
                      href="#services"
                      onClick={() => handleLinkClick('#services')}
                      className="block px-4 py-1.5 text-xs font-semibold text-neutral-700 hover:text-[#CC181E] hover:bg-red-50"
                    >
                      Community Extension Services
                    </a>
                    <a
                      href="#services"
                      onClick={() => handleLinkClick('#services')}
                      className="block px-4 py-1.5 text-xs font-semibold text-neutral-700 hover:text-[#CC181E] hover:bg-red-50"
                    >
                      Outreach Programs
                    </a>
                  </div>
                )}
              </div>

              {/* 9. APPLY ONLINE (Dropdown) */}
              <div
                className="relative"
                onMouseEnter={() => setActiveDropdown('applyOnline')}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button
                  type="button"
                  onClick={() => toggleDropdown('applyOnline')}
                  className="flex items-center gap-0.5 hover:text-red-800 transition-colors whitespace-nowrap"
                  aria-expanded={activeDropdown === 'applyOnline'}
                >
                  <span>APPLY ONLINE</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                {activeDropdown === 'applyOnline' && (
                  <div className="absolute left-0 mt-0 w-56 bg-white rounded shadow-lg border border-neutral-200 py-1.5 z-50">
                    <a
                      href="#services"
                      onClick={() => handleLinkClick('#services')}
                      className="block px-4 py-1.5 text-xs font-semibold text-neutral-700 hover:text-[#CC181E] hover:bg-red-50"
                    >
                      Online Admission Portal
                    </a>
                    <button
                      type="button"
                      onClick={() => handleLinkClick('scholarships')}
                      className="w-full text-left px-4 py-1.5 text-xs font-semibold text-neutral-700 hover:text-[#CC181E] hover:bg-red-50"
                    >
                      Scholarship Application
                    </button>
                  </div>
                )}
              </div>

              {/* 10. LIBRARY */}
              <a
                href="#services"
                onClick={() => handleLinkClick('#services')}
                className="hover:text-red-800 transition-colors whitespace-nowrap"
              >
                LIBRARY
              </a>

              {/* 11. BIDS AND AWARDS */}
              <div
                className="relative"
                onMouseEnter={() => setActiveDropdown('bac')}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <button
                  type="button"
                  onClick={() => toggleDropdown('bac')}
                  className="flex items-center gap-0.5 hover:text-red-800 transition-colors whitespace-nowrap"
                  aria-expanded={activeDropdown === 'bac'}
                >
                  <span>BIDS AND AWARDS</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                {activeDropdown === 'bac' && (
                  <div className="absolute right-0 mt-0 w-56 bg-white rounded shadow-lg border border-neutral-200 py-1.5 z-50">
                    <a
                      href="#announcements"
                      onClick={() => handleLinkClick('#announcements')}
                      className="block px-4 py-1.5 text-xs font-semibold text-neutral-700 hover:text-[#CC181E] hover:bg-red-50"
                    >
                      Invitation to Bid
                    </a>
                    <a
                      href="#announcements"
                      onClick={() => handleLinkClick('#announcements')}
                      className="block px-4 py-1.5 text-xs font-semibold text-neutral-700 hover:text-[#CC181E] hover:bg-red-50"
                    >
                      Procurement Monitoring
                    </a>
                  </div>
                )}
              </div>

              {/* 12. SDG */}
              <a
                href="#services"
                onClick={() => handleLinkClick('#services')}
                className="hover:text-red-800 transition-colors whitespace-nowrap"
              >
                SDG
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* 3. MOBILE HAMBURGER DRAWER */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-neutral-200 px-4 py-4 space-y-3 shadow-lg">
          {/* Government Badges & RBAC on Mobile */}
          <div className="pb-3 border-b border-neutral-100 space-y-2">
            <GovBadges />
            <div className="pt-2 border-t border-neutral-100">
              {currentUser.role === 'student' ? (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onNavigate('login');
                  }}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-[#800000] text-white hover:bg-red-900 shadow-2xs"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-300" />
                  <span>[ Evaluator / Admin Login ]</span>
                </button>
              ) : (
                <div className="p-2.5 rounded-lg bg-neutral-50 border border-neutral-200 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-neutral-800">
                      Logged in: {currentUser.title}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logoutToStudent();
                      onNavigate('login');
                    }}
                    className="w-full text-center text-xs font-semibold text-[#800000] bg-white py-1 rounded border border-neutral-300"
                  >
                    [ Log Out / Switch ]
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1 text-xs font-bold text-[#CC181E] uppercase tracking-wider">
            <button
              type="button"
              onClick={() => handleLinkClick('#announcements')}
              className="w-full text-left px-2 py-1.5 hover:bg-neutral-50 rounded"
            >
              PRESIDENT&apos;S CORNER
            </button>
            <button
              type="button"
              onClick={() => handleLinkClick('#colleges')}
              className="w-full text-left px-2 py-1.5 hover:bg-neutral-50 rounded"
            >
              ABOUT US
            </button>
            <button
              type="button"
              onClick={() => handleLinkClick('#colleges')}
              className="w-full text-left px-2 py-1.5 hover:bg-neutral-50 rounded"
            >
              ABOUT EARIST
            </button>
            <button
              type="button"
              onClick={() => handleLinkClick('#services')}
              className="w-full text-left px-2 py-1.5 hover:bg-neutral-50 rounded"
            >
              STUDENT SERVICES
            </button>
            <button
              type="button"
              onClick={() => handleLinkClick('scholarships')}
              className={`w-full text-left px-2 py-1.5 rounded font-black ${
                currentView === 'scholarships' ? 'bg-red-50' : 'hover:bg-neutral-50'
              }`}
            >
              SCHOLARSHIP PORTAL
            </button>
            <button
              type="button"
              onClick={() => handleLinkClick('#colleges')}
              className="w-full text-left px-2 py-1.5 hover:bg-neutral-50 rounded"
            >
              INSTRUCTION
            </button>
            <button
              type="button"
              onClick={() => handleLinkClick('#services')}
              className="w-full text-left px-2 py-1.5 hover:bg-neutral-50 rounded"
            >
              RESEARCH
            </button>
            <button
              type="button"
              onClick={() => handleLinkClick('#services')}
              className="w-full text-left px-2 py-1.5 hover:bg-neutral-50 rounded"
            >
              EXTENSION
            </button>
            <button
              type="button"
              onClick={() => handleLinkClick('#services')}
              className="w-full text-left px-2 py-1.5 hover:bg-neutral-50 rounded"
            >
              APPLY ONLINE
            </button>
            <button
              type="button"
              onClick={() => handleLinkClick('#services')}
              className="w-full text-left px-2 py-1.5 hover:bg-neutral-50 rounded"
            >
              LIBRARY
            </button>
            <button
              type="button"
              onClick={() => handleLinkClick('#announcements')}
              className="w-full text-left px-2 py-1.5 hover:bg-neutral-50 rounded"
            >
              BIDS AND AWARDS
            </button>
            <button
              type="button"
              onClick={() => handleLinkClick('#services')}
              className="w-full text-left px-2 py-1.5 hover:bg-neutral-50 rounded"
            >
              SDG
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
