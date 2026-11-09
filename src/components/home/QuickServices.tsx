import React from 'react';
import { QUICK_SERVICES } from '../../data/mockData';
import {
  GraduationCap,
  UserCheck,
  FileText,
  FolderCheck,
  Lightbulb,
  HeartPulse,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface QuickServicesProps {
  onOpenScholarships: () => void;
}

export const QuickServices: React.FC<QuickServicesProps> = ({ onOpenScholarships }) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'GraduationCap':
        return <GraduationCap className="w-7 h-7" />;
      case 'UserCheck':
        return <UserCheck className="w-7 h-7" />;
      case 'FileText':
        return <FileText className="w-7 h-7" />;
      case 'FolderCheck':
        return <FolderCheck className="w-7 h-7" />;
      case 'Lightbulb':
        return <Lightbulb className="w-7 h-7" />;
      case 'HeartPulse':
        return <HeartPulse className="w-7 h-7" />;
      default:
        return <GraduationCap className="w-7 h-7" />;
    }
  };

  return (
    <section className="py-14 bg-neutral-50 border-b border-neutral-200" id="services">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-[#800000] text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Digital Campus Services</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
            EARIST Online Portals & e-Services
          </h2>
          <p className="text-sm text-neutral-600 font-medium">
            Fast, accessible, and digitized services for EARIST students, faculty, applicants, and scholarship grantees.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {QUICK_SERVICES.map((item) => {
            const isScholarshipPortal = item.isPortalEntry;

            return (
              <div
                key={item.id}
                onClick={isScholarshipPortal ? onOpenScholarships : undefined}
                className={`relative rounded-2xl p-6 transition-all duration-200 cursor-pointer group flex flex-col justify-between ${
                  isScholarshipPortal
                    ? 'bg-gradient-to-br from-amber-500/10 via-amber-400/5 to-white border-2 border-amber-400 shadow-lg shadow-amber-500/10 hover:shadow-xl hover:shadow-amber-500/20 hover:scale-[1.02] ring-1 ring-amber-400/30'
                    : 'bg-white border border-neutral-200 shadow-sm hover:shadow-md hover:border-[#800000]/40 hover:-translate-y-1'
                }`}
              >
                {/* Badge if present */}
                {item.badge && (
                  <div className="absolute -top-3 right-5">
                    <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-red-700 to-[#800000] text-amber-300 shadow-sm border border-amber-400/50 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                      {item.badge}
                    </span>
                  </div>
                )}

                <div>
                  {/* Icon & Category */}
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`p-3.5 rounded-xl transition-colors ${
                        isScholarshipPortal
                          ? 'bg-[#800000] text-amber-400 group-hover:bg-[#680000]'
                          : 'bg-neutral-100 text-[#800000] group-hover:bg-red-50 group-hover:text-[#800000]'
                      }`}
                    >
                      {getIcon(item.icon)}
                    </div>

                    {isScholarshipPortal && (
                      <span className="text-[11px] font-bold text-amber-800 bg-amber-100/90 px-2.5 py-1 rounded-md">
                        Primary System
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <h3
                    className={`text-base font-bold mb-2 group-hover:text-[#800000] transition-colors ${
                      isScholarshipPortal ? 'text-[#800000]' : 'text-neutral-900'
                    }`}
                  >
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-normal">
                    {item.description}
                  </p>
                </div>

                {/* Footer Action link */}
                <div className="mt-5 pt-3 border-t border-neutral-100 flex items-center justify-between">
                  <span
                    className={`text-xs font-bold flex items-center gap-1.5 ${
                      isScholarshipPortal
                        ? 'text-[#800000] group-hover:text-[#5a0000]'
                        : 'text-neutral-600 group-hover:text-[#800000]'
                    }`}
                  >
                    {isScholarshipPortal ? 'Launch Scholarship Portal' : 'Access Service'}
                  </span>
                  <ArrowRight
                    className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${
                      isScholarshipPortal ? 'text-[#800000]' : 'text-neutral-400 group-hover:text-[#800000]'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
