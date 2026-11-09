import React from 'react';
import { EARIST_COLLEGES } from '../../data/mockData';
import {
  Atom,
  TrendingUp,
  BookOpen,
  Wrench,
  Cpu,
  Palette,
  Utensils,
  GraduationCap,
  Users,
} from 'lucide-react';

interface CollegesGridProps {
  onSelectCollegeFilter?: (collegeCode: string) => void;
}

export const CollegesGrid: React.FC<CollegesGridProps> = ({ onSelectCollegeFilter }) => {
  const getCollegeIcon = (code: string) => {
    switch (code) {
      case 'CAS':
        return <Atom className="w-5 h-5 text-indigo-600" />;
      case 'CBA':
        return <TrendingUp className="w-5 h-5 text-emerald-600" />;
      case 'CED':
        return <BookOpen className="w-5 h-5 text-blue-600" />;
      case 'CIT':
        return <Wrench className="w-5 h-5 text-orange-600" />;
      case 'CEN':
        return <Cpu className="w-5 h-5 text-red-600" />;
      case 'CAFA':
        return <Palette className="w-5 h-5 text-purple-600" />;
      case 'CHM':
        return <Utensils className="w-5 h-5 text-amber-600" />;
      default:
        return <GraduationCap className="w-5 h-5 text-[#800000]" />;
    }
  };

  return (
    <section className="py-14 bg-white border-b border-neutral-200" id="colleges">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#800000] bg-red-50 px-2.5 py-1 rounded">
              Academic Excellence
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight mt-2">
              Colleges of EARIST
            </h2>
            <p className="text-sm text-neutral-600 max-w-xl mt-1">
              Serving thousands of students across vocational, scientific, engineering, and technological disciplines with dedicated scholarship evaluators.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 bg-neutral-100 px-3 py-1.5 rounded-lg border border-neutral-200">
            <Users className="w-4 h-4 text-[#800000]" />
            <span>1,300+ Total Active Grantees Monitored</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {EARIST_COLLEGES.map((col) => (
            <div
              key={col.code}
              onClick={() => onSelectCollegeFilter && onSelectCollegeFilter(col.code)}
              className="group p-5 rounded-xl border border-neutral-200 bg-neutral-50/50 hover:bg-white hover:border-[#800000] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-extrabold px-2.5 py-0.5 rounded bg-white text-[#800000] border border-neutral-200 shadow-2xs group-hover:bg-[#800000] group-hover:text-amber-300 transition-colors">
                    {col.code}
                  </span>
                  <div className="p-2 rounded-lg bg-white border border-neutral-200 group-hover:border-amber-300 transition-colors">
                    {getCollegeIcon(col.code)}
                  </div>
                </div>

                <h3 className="text-sm font-bold text-neutral-900 group-hover:text-[#800000] transition-colors leading-snug">
                  {col.name}
                </h3>
                <p className="text-[11px] text-neutral-500 mt-1">Dean: {col.dean}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-200 flex items-center justify-between text-xs">
                <span className="text-neutral-500">{col.programsCount} Degree Programs</span>
                <span className="font-bold text-[#800000] bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
                  {col.activeGrantees} Scholars
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
