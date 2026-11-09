import React from 'react';
import { LATEST_ANNOUNCEMENTS } from '../../data/mockData';
import { Calendar, Bell, ArrowRight, Bookmark } from 'lucide-react';

interface AnnouncementsSectionProps {
  onOpenScholarships: () => void;
}

export const AnnouncementsSection: React.FC<AnnouncementsSectionProps> = ({ onOpenScholarships }) => {
  return (
    <section className="py-14 bg-neutral-50 border-b border-neutral-200" id="news">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider">
              <Bell className="w-3.5 h-3.5 text-amber-600" />
              <span>Campus Advisories</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight mt-2">
              Latest Announcements & Grant Updates
            </h2>
          </div>

          <button
            onClick={onOpenScholarships}
            className="text-xs font-bold text-[#800000] hover:text-[#5a0000] flex items-center gap-1.5 self-start md:self-auto bg-white px-3.5 py-2 rounded-lg border border-neutral-300 shadow-2xs hover:shadow-xs transition-all"
          >
            <span>View All Scholarship Advisories</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {LATEST_ANNOUNCEMENTS.map((item) => {
            const isScholarship = item.category === 'Scholarship';

            return (
              <div
                key={item.id}
                className="bg-white rounded-xl p-5 border border-neutral-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded tracking-wider ${
                        isScholarship
                          ? 'bg-amber-100 text-amber-800 border border-amber-300/80'
                          : 'bg-neutral-100 text-neutral-700'
                      }`}
                    >
                      {item.category}
                    </span>
                    <span className="text-[11px] text-neutral-400 font-medium flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {item.date}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-neutral-900 line-clamp-2 hover:text-[#800000] transition-colors mb-2">
                    {item.title}
                  </h3>

                  <p className="text-xs text-neutral-600 line-clamp-3 leading-relaxed">
                    {item.summary}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-100 text-[11px] text-neutral-500 font-medium flex items-center justify-between">
                  <span>{item.author}</span>
                  <Bookmark className="w-3.5 h-3.5 text-neutral-300 hover:text-amber-500 cursor-pointer" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
