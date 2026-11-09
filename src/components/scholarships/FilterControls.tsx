import React from 'react';
import type { ReportFilterState } from '../../types';
import {
  Calendar,
  Filter,
  Search,
  RotateCcw,
  Download,
  Printer,
  ChevronDown,
  Layers,
  GraduationCap,
} from 'lucide-react';

interface FilterControlsProps {
  filters: ReportFilterState;
  onFilterChange: (key: keyof ReportFilterState, value: string) => void;
  onResetFilters: () => void;
  onSetQuickDateRange: (type: 'current-week' | 'last-14' | 'all') => void;
  onExportCSV: () => void;
  onOpenPrintModal: () => void;
  totalFilteredCount: number;
}

export const FilterControls: React.FC<FilterControlsProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  onSetQuickDateRange,
  onExportCSV,
  onOpenPrintModal,
  totalFilteredCount,
}) => {
  return (
    <div className="bg-white rounded-xl p-5 border border-neutral-200 shadow-sm space-y-4">
      {/* Top Bar: Title & Primary Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-red-50 text-[#800000]">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-neutral-900">
              Report Filter & Evaluation Parameters
            </h3>
            <p className="text-[11px] text-neutral-500">
              Showing <span className="font-bold text-[#800000]">{totalFilteredCount}</span> application records based on active criteria
            </p>
          </div>
        </div>

        {/* Action Buttons: Export CSV & Print PDF */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={onExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-neutral-900 hover:bg-neutral-800 text-white shadow-2xs hover:shadow-xs transition-all"
            title="Download formatted CSV for Excel"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Export Summary (CSV)</span>
          </button>

          <button
            onClick={onOpenPrintModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-[#800000] hover:bg-[#680000] text-white shadow-2xs hover:shadow-xs transition-all"
            title="Preview and Print formal institutional weekly report"
          >
            <Printer className="w-3.5 h-3.5 text-amber-300" />
            <span>Print / Save as PDF</span>
          </button>

          <button
            onClick={onResetFilters}
            className="inline-flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs font-semibold text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
            title="Reset all filters to default"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Main Filter Controls Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5">
        {/* Date Range: Start Date */}
        <div className="lg:col-span-3 space-y-1">
          <label className="text-[11px] font-bold text-neutral-600 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-[#800000]" />
            <span>Start Date:</span>
          </label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => onFilterChange('startDate', e.target.value)}
            className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-transparent"
          />
        </div>

        {/* Date Range: End Date */}
        <div className="lg:col-span-3 space-y-1">
          <label className="text-[11px] font-bold text-neutral-600 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-[#800000]" />
            <span>End Date:</span>
          </label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => onFilterChange('endDate', e.target.value)}
            className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-transparent"
          />
        </div>

        {/* Scholarship Program Dropdown */}
        <div className="lg:col-span-3 space-y-1">
          <label className="text-[11px] font-bold text-neutral-600 flex items-center gap-1">
            <GraduationCap className="w-3 h-3 text-[#800000]" />
            <span>Scholarship Program:</span>
          </label>
          <div className="relative">
            <select
              value={filters.program}
              onChange={(e) => onFilterChange('program', e.target.value)}
              className="w-full appearance-none text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-transparent pr-8 text-neutral-800 font-medium"
            >
              <option value="All">All Programs</option>
              <option value="CHED TDP">CHED TDP (Tulong Dunong)</option>
              <option value="Tertiary Education Subsidy (TES)">Tertiary Education Subsidy (TES)</option>
              <option value="Academic Excellence Grant">Academic Excellence Grant</option>
              <option value="Barangay/LGU Assistance">Barangay/LGU Assistance</option>
              <option value="DOST-SEI Grant">DOST-SEI Grant</option>
              <option value="Student Assistantship Program (SAP)">Student Assistantship Program (SAP)</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Status Selector */}
        <div className="lg:col-span-3 space-y-1">
          <label className="text-[11px] font-bold text-neutral-600 flex items-center gap-1">
            <Layers className="w-3 h-3 text-[#800000]" />
            <span>Status:</span>
          </label>
          <div className="relative">
            <select
              value={filters.status}
              onChange={(e) => onFilterChange('status', e.target.value)}
              className="w-full appearance-none text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-transparent pr-8 text-neutral-800 font-medium"
            >
              <option value="All">All Statuses</option>
              <option value="Pending Review">Pending Review</option>
              <option value="Approved">Approved</option>
              <option value="Endorsed">Endorsed</option>
              <option value="Flagged">Flagged</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Second Row: Search, College Filter & Quick Date Presets */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
        {/* Search Input */}
        <div className="md:col-span-6 relative">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Student Name, Student ID (e.g. 2023-01849), or Submission ID..."
            value={filters.searchQuery}
            onChange={(e) => onFilterChange('searchQuery', e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-transparent"
          />
        </div>

        {/* College Filter */}
        <div className="md:col-span-3 relative">
          <select
            value={filters.college}
            onChange={(e) => onFilterChange('college', e.target.value)}
            className="w-full appearance-none text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-transparent pr-8 text-neutral-800 font-medium"
          >
            <option value="All">All Colleges</option>
            <option value="CAS">CAS (Arts & Sciences)</option>
            <option value="CBA">CBA (Business Administration)</option>
            <option value="CED">CED (Education)</option>
            <option value="CIT">CIT (Industrial Technology)</option>
            <option value="CEN">CEN (Engineering)</option>
            <option value="CAFA">CAFA (Architecture & Fine Arts)</option>
            <option value="CHM">CHM (Hospitality Management)</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Quick Date Presets */}
        <div className="md:col-span-3 flex items-center gap-1.5 justify-end">
          <span className="text-[10px] text-neutral-600 font-bold uppercase tracking-wider">
            Presets:
          </span>
          <button
            onClick={() => onSetQuickDateRange('current-week')}
            className="text-[11px] px-2 py-1 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold transition-colors"
          >
            7 Days
          </button>
          <button
            onClick={() => onSetQuickDateRange('last-14')}
            className="text-[11px] px-2 py-1 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold transition-colors"
          >
            14 Days
          </button>
          <button
            onClick={() => onSetQuickDateRange('all')}
            className="text-[11px] px-2 py-1 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold transition-colors"
          >
            All Dates
          </button>
        </div>
      </div>
    </div>
  );
};
