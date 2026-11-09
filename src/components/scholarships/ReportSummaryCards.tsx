import React from 'react';
import type { ReportSummaryKPIs } from '../../types';
import { formatPHP } from '../../utils/exportUtils';
import {
  FileText,
  FileCheck2,
  CheckCircle,
  AlertTriangle,
  Coins,
} from 'lucide-react';

interface ReportSummaryCardsProps {
  kpis: ReportSummaryKPIs;
  dateRange: { start: string; end: string };
}

export const ReportSummaryCards: React.FC<ReportSummaryCardsProps> = ({ kpis, dateRange }) => {
  return (
    <div className="space-y-4">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Applications */}
        <div className="bg-white rounded-xl p-5 border border-neutral-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#800000]" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                Total Applications
              </p>
              <h3 className="text-3xl font-black text-neutral-900 mt-1">
                {kpis.totalSubmitted}
              </h3>
              <p className="text-[11px] text-neutral-500 mt-1 flex items-center gap-1">
                <span className="font-semibold text-[#800000]">Active in window</span>
                <span>({dateRange.start} – {dateRange.end})</span>
              </p>
            </div>
            <div className="p-3 rounded-xl bg-red-50 text-[#800000] group-hover:bg-[#800000] group-hover:text-amber-300 transition-colors">
              <FileText className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-between text-[11px]">
            <span className="text-neutral-500">Weekly Intake</span>
            <span className="font-bold text-[#800000]">100% Processed</span>
          </div>
        </div>

        {/* Metric 2: Verified Documents */}
        <div className="bg-white rounded-xl p-5 border border-neutral-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-600" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                Verified Documents
              </p>
              <h3 className="text-3xl font-black text-neutral-900 mt-1">
                {kpis.verifiedDocuments}
              </h3>
              <p className="text-[11px] text-neutral-500 mt-1">
                Registrar seals & grade slips validated
              </p>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 text-blue-700 group-hover:bg-blue-700 group-hover:text-white transition-colors">
              <FileCheck2 className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-between text-[11px]">
            <span className="text-neutral-500">Doc Compliance</span>
            <span className="font-bold text-blue-700">Audit Ready</span>
          </div>
        </div>

        {/* Metric 3: Approved & Endorsed Beneficiaries */}
        <div className="bg-white rounded-xl p-5 border border-neutral-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-600" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                Endorsed / Approved
              </p>
              <h3 className="text-3xl font-black text-neutral-900 mt-1">
                {kpis.approvedOrEndorsed}
              </h3>
              <div className="flex items-center gap-2 mt-1 text-[11px]">
                <span className="text-emerald-700 font-bold">{kpis.approvedCount} Approved</span>
                <span className="text-neutral-300">•</span>
                <span className="text-cyan-700 font-bold">{kpis.endorsedCount} Endorsed</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 group-hover:bg-emerald-700 group-hover:text-white transition-colors">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-between text-[11px]">
            <span className="text-neutral-500">UniFAST Endorsement</span>
            <span className="font-bold text-emerald-700">Qualified</span>
          </div>
        </div>

        {/* Metric 4: Flagged or Pending Issues */}
        <div className="bg-white rounded-xl p-5 border border-neutral-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-500" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                Flagged / Pending Action
              </p>
              <h3 className="text-3xl font-black text-neutral-900 mt-1">
                {kpis.flaggedOrPending}
              </h3>
              <div className="flex items-center gap-2 mt-1 text-[11px]">
                <span className="text-amber-700 font-bold">{kpis.pendingCount} Pending</span>
                <span className="text-neutral-300">•</span>
                <span className="text-red-700 font-bold">{kpis.flaggedCount} Flagged</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 text-amber-700 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-neutral-100 flex items-center justify-between text-[11px]">
            <span className="text-neutral-500">Requires SFAO Action</span>
            <span className="font-bold text-red-600">Attention Needed</span>
          </div>
        </div>
      </div>

      {/* Financial Allocation Banner Strip */}
      <div className="bg-gradient-to-r from-[#800000] via-[#5a0000] to-[#3a0000] text-white rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm border border-amber-500/20">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-amber-400 text-[#4a0000]">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
              Weekly Grant Financial Allocation
            </span>
            <p className="text-sm font-semibold text-neutral-200">
              Total stipend value earmarked for current filtered beneficiaries:
            </p>
          </div>
        </div>
        <div className="text-left sm:text-right">
          <span className="text-2xl font-black text-amber-400 tracking-tight">
            {formatPHP(kpis.totalGrantAllocation)}
          </span>
          <span className="block text-[10px] text-neutral-300 uppercase tracking-wider">
            Covering {kpis.totalSubmitted} Candidate Students
          </span>
        </div>
      </div>
    </div>
  );
};
