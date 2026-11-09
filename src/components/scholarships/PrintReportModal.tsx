import React, { useMemo, useState } from 'react';
import type { ScholarshipApplication, ReportFilterState } from '../../types';
import { calculateReportKPIs, formatPHP } from '../../utils/exportUtils';
import { EaristLogo } from '../common/EaristLogo';
import { X, Printer } from 'lucide-react';

interface PrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  applications: ScholarshipApplication[];
  filters: ReportFilterState;
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({
  isOpen,
  onClose,
  applications,
  filters,
}) => {
  const kpis = useMemo(() => calculateReportKPIs(applications), [applications]);
  const [printDate] = useState(() =>
    new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  );

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      {/* Floating Modal Card */}
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full border border-neutral-300 max-h-[95vh] flex flex-col overflow-hidden">
        {/* Top Control Bar (Hidden in Print) */}
        <div className="no-print bg-[#4a0000] text-white px-6 py-3.5 flex items-center justify-between border-b border-amber-400">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-amber-300" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Institutional Document Print & PDF Preview
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-amber-400 hover:bg-amber-300 text-[#4a0000] shadow-sm transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Trigger Browser Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-neutral-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Paper View */}
        <div className="overflow-y-auto p-6 sm:p-10 bg-neutral-100 flex-1">
          <div className="printable-report-area bg-white mx-auto p-8 sm:p-12 shadow-md border border-neutral-200 max-w-4xl text-neutral-900 font-serif leading-normal">
            
            {/* 1. Official Institutional Letterhead */}
            <div className="flex items-center justify-between pb-4 border-b-2 border-[#800000] gap-4">
              <EaristLogo size={68} lightMode={false} />
              
              <div className="text-center flex-1 font-sans">
                <p className="text-[10px] tracking-widest uppercase font-semibold text-neutral-600">
                  Republic of the Philippines
                </p>
                <h1 className="text-base sm:text-lg font-black text-[#800000] tracking-wide uppercase leading-tight">
                  Eulogio "Amang" Rodriguez Institute of Science and Technology
                </h1>
                <p className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                  Scholarship and Financial Assistance Office (SFAO)
                </p>
                <p className="text-[10px] text-neutral-500 font-sans mt-0.5">
                  Nagtahan, Sampaloc, Manila 1008 • Tel: (02) 8716-6273 • Email: sfao@earist.edu.ph
                </p>
              </div>

              {/* Philippine Bagong Pilipinas / Quality Seal Placeholder */}
              <div className="text-center font-sans hidden sm:block">
                <div className="w-16 h-16 rounded-full border-2 border-amber-500 bg-amber-50 flex flex-col items-center justify-center p-1">
                  <span className="text-[8px] font-black text-[#800000] leading-none text-center">
                    CHED UniFAST
                  </span>
                  <span className="text-[7px] text-neutral-600 font-bold mt-1">ACCREDITED</span>
                </div>
              </div>
            </div>

            {/* 2. Document Title & Metadata */}
            <div className="my-6 text-center font-sans space-y-1">
              <h2 className="text-base sm:text-lg font-black tracking-wider uppercase text-neutral-900">
                Weekly Scholarship Accomplishment & Verification Report
              </h2>
              <p className="text-xs font-bold text-[#800000] uppercase tracking-wide">
                1st Semester, Academic Year 2026-2027
              </p>
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-xs text-neutral-600 pt-1">
                <span>
                  <strong>Reporting Window:</strong> {filters.startDate} to {filters.endDate}
                </span>
                <span>•</span>
                <span>
                  <strong>Program:</strong> {filters.program === 'All' ? 'All Scholarship Grants' : filters.program}
                </span>
                <span>•</span>
                <span>
                  <strong>Generated:</strong> {printDate}
                </span>
              </div>
            </div>

            {/* 3. Executive KPI Summary Table */}
            <div className="mb-6 font-sans">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#800000] mb-2">
                I. Executive Summary & Weekly Rollup Metrics
              </h3>
              <table className="w-full text-xs border border-neutral-300">
                <thead className="bg-neutral-100 text-neutral-700 font-bold">
                  <tr>
                    <th className="border border-neutral-300 p-2 text-left">Total Applications</th>
                    <th className="border border-neutral-300 p-2 text-left">Verified Documents</th>
                    <th className="border border-neutral-300 p-2 text-left">Approved Beneficiaries</th>
                    <th className="border border-neutral-300 p-2 text-left">Endorsed to UniFAST</th>
                    <th className="border border-neutral-300 p-2 text-left">Pending / Under Review</th>
                    <th className="border border-neutral-300 p-2 text-left">Flagged / Deficient</th>
                    <th className="border border-neutral-300 p-2 text-right">Total Grant Allocation</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="font-semibold">
                    <td className="border border-neutral-300 p-2 text-center text-sm font-bold text-[#800000]">{kpis.totalSubmitted}</td>
                    <td className="border border-neutral-300 p-2 text-center text-sm font-bold text-blue-700">{kpis.verifiedDocuments}</td>
                    <td className="border border-neutral-300 p-2 text-center text-sm font-bold text-emerald-700">{kpis.approvedCount}</td>
                    <td className="border border-neutral-300 p-2 text-center text-sm font-bold text-cyan-700">{kpis.endorsedCount}</td>
                    <td className="border border-neutral-300 p-2 text-center text-sm font-bold text-amber-600">{kpis.pendingCount}</td>
                    <td className="border border-neutral-300 p-2 text-center text-sm font-bold text-red-600">{kpis.flaggedCount}</td>
                    <td className="border border-neutral-300 p-2 text-right text-sm font-black text-neutral-900">{formatPHP(kpis.totalGrantAllocation)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 4. Detailed Applicant Roster Table */}
            <div className="mb-8 font-sans">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#800000] mb-2">
                II. Individual Evaluated Beneficiaries Roster
              </h3>
              <table className="w-full text-[10px] border border-neutral-300 leading-tight">
                <thead className="bg-neutral-100 font-bold uppercase text-neutral-700">
                  <tr>
                    <th className="border border-neutral-300 p-2 text-left">#</th>
                    <th className="border border-neutral-300 p-2 text-left">Submission ID</th>
                    <th className="border border-neutral-300 p-2 text-left">Student ID & Name</th>
                    <th className="border border-neutral-300 p-2 text-left">Course / College</th>
                    <th className="border border-neutral-300 p-2 text-left">Grant Program</th>
                    <th className="border border-neutral-300 p-2 text-center">GWA</th>
                    <th className="border border-neutral-300 p-2 text-center">Docs Status</th>
                    <th className="border border-neutral-300 p-2 text-left">Status</th>
                    <th className="border border-neutral-300 p-2 text-left">Evaluator Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app, idx) => {
                    const verifiedDocs = app.attachedDocuments.filter((d) => d.verified).length;
                    const totalDocs = app.attachedDocuments.length;

                    return (
                      <tr key={app.id} className="border-b border-neutral-300">
                        <td className="border border-neutral-300 p-1.5 text-center font-bold">{idx + 1}</td>
                        <td className="border border-neutral-300 p-1.5 font-mono font-bold text-[#800000]">{app.id}</td>
                        <td className="border border-neutral-300 p-1.5">
                          <span className="font-bold block">{app.studentName}</span>
                          <span className="text-[9px] text-neutral-500 font-mono">{app.studentId}</span>
                        </td>
                        <td className="border border-neutral-300 p-1.5">
                          <span>{app.course}</span>
                          <span className="text-[9px] block text-neutral-500">[{app.college}] {app.yearAndSection}</span>
                        </td>
                        <td className="border border-neutral-300 p-1.5 font-semibold">{app.program}</td>
                        <td className="border border-neutral-300 p-1.5 text-center font-bold">{app.gwa.toFixed(2)}</td>
                        <td className="border border-neutral-300 p-1.5 text-center font-semibold">
                          {verifiedDocs}/{totalDocs}
                        </td>
                        <td className="border border-neutral-300 p-1.5 font-bold">
                          {app.status}
                        </td>
                        <td className="border border-neutral-300 p-1.5 text-[9px] text-neutral-700">
                          {app.status === 'Flagged' && app.flagReason ? `DEFICIENCY: ${app.flagReason}` : app.evaluatorNotes}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* 5. Institutional Signatory Block */}
            <div className="pt-8 mt-8 border-t border-neutral-300 font-sans text-xs">
              <div className="grid grid-cols-3 gap-6 text-center">
                <div className="space-y-12">
                  <p className="text-[11px] font-semibold text-neutral-600">Prepared & Audited by:</p>
                  <div>
                    <div className="w-48 mx-auto border-b border-neutral-900 font-bold uppercase text-xs">
                      PROF. MARLON SANTOS
                    </div>
                    <p className="text-[10px] text-neutral-500 mt-0.5">
                      Head Scholarship Evaluator, SFAO
                    </p>
                  </div>
                </div>

                <div className="space-y-12">
                  <p className="text-[11px] font-semibold text-neutral-600">Verified & Certified Correct:</p>
                  <div>
                    <div className="w-48 mx-auto border-b border-neutral-900 font-bold uppercase text-xs">
                      DR. CARIDAD A. BAUTISTA
                    </div>
                    <p className="text-[10px] text-neutral-500 mt-0.5">
                      Director, Scholarship & Financial Assistance
                    </p>
                  </div>
                </div>

                <div className="space-y-12">
                  <p className="text-[11px] font-semibold text-neutral-600">Approved for Endorsement:</p>
                  <div>
                    <div className="w-48 mx-auto border-b border-neutral-900 font-bold uppercase text-xs">
                      DR. ROGELIO T. MAGSINO
                    </div>
                    <p className="text-[10px] text-neutral-500 mt-0.5">
                      Vice President for Academic Affairs / College President
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-neutral-200 text-center text-[9px] text-neutral-400">
                Official Document of Eulogio "Amang" Rodriguez Institute of Science and Technology • ISO 9001:2015 Certified System
              </div>
            </div>

          </div>
        </div>

        {/* Modal Bottom Controls */}
        <div className="no-print bg-neutral-50 p-4 border-t border-neutral-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-neutral-600 bg-white border border-neutral-300 hover:bg-neutral-100 transition-colors"
          >
            Close Preview
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2 rounded-lg text-xs font-bold bg-[#800000] hover:bg-[#680000] text-white shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-4 h-4 text-amber-300" />
            <span>Print Report (PDF)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
