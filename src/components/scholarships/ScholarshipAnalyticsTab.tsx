import React from 'react';
import type { ScholarshipApplication } from '../../types';
import { formatPHP } from '../../utils/exportUtils';
import { EARIST_COLLEGES } from '../../data/mockData';
import {
  TrendingUp,
  BarChart3,
  Award,
  GraduationCap,
} from 'lucide-react';

interface ScholarshipAnalyticsTabProps {
  applications: ScholarshipApplication[];
}

export const ScholarshipAnalyticsTab: React.FC<ScholarshipAnalyticsTabProps> = ({
  applications,
}) => {
  const total = applications.length;

  // Status breakdown
  const approved = applications.filter((a) => a.status === 'Approved').length;
  const endorsed = applications.filter((a) => a.status === 'Endorsed').length;
  const pending = applications.filter((a) => a.status === 'Pending Review').length;
  const flagged = applications.filter((a) => a.status === 'Flagged').length;

  // Financial breakdown
  const totalAllocated = applications.reduce((sum, a) => sum + (a.stipendAmount || 0), 0);
  const approvedDisbursable = applications
    .filter((a) => a.status === 'Approved' || a.status === 'Endorsed')
    .reduce((sum, a) => sum + (a.stipendAmount || 0), 0);
  const pendingClearance = totalAllocated - approvedDisbursable;

  // College distribution
  const collegeStats = EARIST_COLLEGES.map((col) => {
    const colApps = applications.filter((a) => a.college === col.code);
    const colApproved = colApps.filter((a) => a.status === 'Approved' || a.status === 'Endorsed').length;
    const colAmount = colApps.reduce((s, a) => s + (a.stipendAmount || 0), 0);
    return {
      ...col,
      totalCount: colApps.length,
      approvedCount: colApproved,
      totalAmount: colAmount,
      percentage: total > 0 ? Math.round((colApps.length / total) * 100) : 0,
    };
  });

  // Program distribution
  const programs = [
    'CHED TDP',
    'Tertiary Education Subsidy (TES)',
    'Academic Excellence Grant',
    'Barangay/LGU Assistance',
    'DOST-SEI Grant',
    'Student Assistantship Program (SAP)',
  ];

  const programStats = programs.map((prog) => {
    const progApps = applications.filter((a) => a.program === prog);
    const amount = progApps.reduce((s, a) => s + (a.stipendAmount || 0), 0);
    return {
      name: prog,
      count: progApps.length,
      amount,
      percentage: total > 0 ? Math.round((progApps.length / total) * 100) : 0,
    };
  });

  return (
    <div className="space-y-6">
      {/* 1. Header Overview & Financial Health */}
      <div className="bg-gradient-to-br from-maroon-primary via-maroon-hover to-maroon-deep rounded-2xl p-6 text-white shadow-md border-b-4 border-gold-primary">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/20">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
              <span>SFAO Executive Analytics & Financial Allocation</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black">
              Scholarship Distribution & Performance Metrics
            </h2>
            <p className="text-xs text-neutral-200 mt-1 max-w-2xl">
              Real-time audit telemetry across undergraduate colleges, stipend commitments, and verification milestones.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 text-right self-start md:self-auto">
            <span className="text-[10px] uppercase font-bold text-amber-300 tracking-wider">
              Total Earmarked Semestral Grants
            </span>
            <div className="text-2xl sm:text-3xl font-black text-amber-400">
              {formatPHP(totalAllocated)}
            </div>
            <div className="text-[11px] text-neutral-300 mt-0.5">
              1st Semester A.Y. 2026-2027
            </div>
          </div>
        </div>

        {/* 3 Metric Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <span className="text-xs text-neutral-300">Certified for Cashier/UniFAST Disbursal:</span>
            <div className="text-xl font-black text-emerald-400 mt-1">
              {formatPHP(approvedDisbursable)}
            </div>
            <div className="text-[10px] text-emerald-200/80 mt-0.5">
              {approved + endorsed} scholars validated ({total > 0 ? Math.round(((approved + endorsed) / total) * 100) : 0}%)
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <span className="text-xs text-neutral-300">Under Evaluation / Audit Hold:</span>
            <div className="text-xl font-black text-amber-300 mt-1">
              {formatPHP(pendingClearance)}
            </div>
            <div className="text-[10px] text-amber-200/80 mt-0.5">
              {pending + flagged} applications in review or flagged
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <span className="text-xs text-neutral-300">Document Verification Rate:</span>
            <div className="text-xl font-black text-white mt-1">
              {total > 0
                ? Math.round(
                    (applications.reduce(
                      (acc, a) => acc + a.attachedDocuments.filter((d) => d.verified).length,
                      0
                    ) /
                      applications.reduce((acc, a) => acc + a.attachedDocuments.length, 0)) *
                      100
                  )
                : 0}
              %
            </div>
            <div className="text-[10px] text-neutral-300 mt-0.5">
              Across all official registrar & LGU submissions
            </div>
          </div>
        </div>
      </div>

      {/* 2. Grid: College Breakdown & Program Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: College Breakdown (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl p-6 border border-neutral-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-maroon-subtle text-maroon-primary">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-900">
                  Beneficiary Breakdown by College
                </h3>
                <p className="text-[11px] text-neutral-500">
                  Student distribution and funding allocated per academic unit
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-maroon-primary bg-maroon-subtle px-2 py-0.5 rounded">
              7 Colleges
            </span>
          </div>

          <div className="space-y-4">
            {collegeStats.map((col) => (
              <div key={col.code} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-maroon-primary px-1.5 py-0.5 bg-neutral-100 rounded text-[11px]">
                      {col.code}
                    </span>
                    <span className="font-semibold text-neutral-800">{col.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-neutral-900">{col.totalCount} scholars</span>
                    <span className="text-neutral-400 text-[11px] ml-1.5">
                      ({formatPHP(col.totalAmount)})
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden flex">
                  <div
                    className="bg-maroon-primary h-2 transition-all duration-500 rounded-full"
                    style={{ width: `${Math.max(col.percentage, 4)}%` }}
                    title={`${col.percentage}% of applications`}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Program Breakdown & Statuses (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Status Breakdown Box */}
          <div className="bg-white rounded-xl p-6 border border-neutral-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
              <BarChart3 className="w-4 h-4 text-maroon-primary" />
              <h3 className="text-sm font-bold text-neutral-900">
                Application Review Statuses
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                  Approved
                </div>
                <div className="text-2xl font-black text-emerald-700 mt-1">{approved}</div>
                <div className="text-[10px] text-emerald-600">
                  {total > 0 ? Math.round((approved / total) * 100) : 0}% of total
                </div>
              </div>

              <div className="p-3 rounded-xl bg-cyan-50 border border-cyan-200">
                <div className="text-[10px] font-bold text-cyan-800 uppercase tracking-wider">
                  Endorsed UniFAST
                </div>
                <div className="text-2xl font-black text-cyan-700 mt-1">{endorsed}</div>
                <div className="text-[10px] text-cyan-600">
                  {total > 0 ? Math.round((endorsed / total) * 100) : 0}% of total
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                  Pending Review
                </div>
                <div className="text-2xl font-black text-amber-700 mt-1">{pending}</div>
                <div className="text-[10px] text-amber-600">
                  {total > 0 ? Math.round((pending / total) * 100) : 0}% of total
                </div>
              </div>

              <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                <div className="text-[10px] font-bold text-red-800 uppercase tracking-wider">
                  Flagged Issues
                </div>
                <div className="text-2xl font-black text-red-700 mt-1">{flagged}</div>
                <div className="text-[10px] text-red-600">
                  {total > 0 ? Math.round((flagged / total) * 100) : 0}% of total
                </div>
              </div>
            </div>
          </div>

          {/* Program Distribution Box */}
          <div className="bg-white rounded-xl p-6 border border-neutral-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
              <Award className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-bold text-neutral-900">
                Funding Program Distribution
              </h3>
            </div>

            <div className="space-y-3">
              {programStats.map((prog) => (
                <div key={prog.name} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-neutral-800 truncate pr-2">
                      {prog.name}
                    </span>
                    <span className="font-bold text-neutral-900 whitespace-nowrap">
                      {prog.count} ({formatPHP(prog.amount)})
                    </span>
                  </div>
                  <div className="w-full bg-neutral-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-amber-500 h-1.5 rounded-full"
                      style={{ width: `${Math.max(prog.percentage, 3)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
