import React, { useMemo, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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

interface ReportPaperContentProps {
  applications: ScholarshipApplication[];
  kpis: ReturnType<typeof calculateReportKPIs>;
  filters: ReportFilterState;
  printDate: string;
}

/**
 * Shared report paper markup used for both the on-screen preview and the print portal
 */
const ReportPaperContent: React.FC<ReportPaperContentProps> = ({
  applications,
  kpis,
  filters,
  printDate,
}) => {
  return (
    <>
      {/* 1. Official Institutional Letterhead */}
      <div className="flex items-center justify-between pb-4 print:pb-2 border-b-2 border-maroon-primary gap-4">
        <EaristLogo size={64} lightMode={false} />

        <div className="text-center flex-1 font-sans">
          <p className="text-[10px] tracking-widest uppercase font-semibold text-neutral-600">
            Republic of the Philippines
          </p>
          <h1 className="text-base sm:text-lg font-black text-maroon-primary tracking-wide uppercase leading-tight">
            Eulogio &quot;Amang&quot; Rodriguez Institute of Science and Technology
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
          <div className="w-14 h-14 rounded-full border-2 border-gold-primary bg-gold-light/20 flex flex-col items-center justify-center p-1">
            <span className="text-[7.5px] font-black text-maroon-primary leading-none text-center">
              CHED UniFAST
            </span>
            <span className="text-[6.5px] text-neutral-600 font-bold mt-0.5">ACCREDITED</span>
          </div>
        </div>
      </div>

      {/* 2. Document Title & Metadata */}
      <div className="my-6 print:my-2.5 text-center font-sans space-y-1">
        <h2 className="text-base sm:text-lg font-black tracking-wider uppercase text-neutral-900">
          Weekly Scholarship Accomplishment &amp; Verification Report
        </h2>
        <p className="text-xs font-bold text-maroon-primary uppercase tracking-wide">
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
      <div className="mb-6 print:mb-3 font-sans">
        <h3 className="text-xs font-bold uppercase tracking-wider text-maroon-primary mb-2">
          I. Executive Summary &amp; Weekly Rollup Metrics
        </h3>
        <table className="sfao-summary-table w-full text-xs border border-neutral-300 border-collapse">
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
              <td className="border border-neutral-300 p-2 text-center text-sm font-bold text-maroon-primary">{kpis.totalSubmitted}</td>
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

      {/* 4. Detailed Applicant Roster Table (Proportional Landscape Columns) */}
      <div className="mb-8 print:mb-4 font-sans">
        <h3 className="text-xs font-bold uppercase tracking-wider text-maroon-primary mb-2">
          II. Individual Evaluated Beneficiaries Roster
        </h3>
        <table className="sfao-roster-table w-full text-[10px] border border-neutral-300 leading-tight border-collapse table-fixed">
          <colgroup>
            <col style={{ width: '3%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '16%' }} />
            <col style={{ width: '13%' }} />
            <col style={{ width: '5%' }} />
            <col style={{ width: '6%' }} />
            <col style={{ width: '9%' }} />
            <col style={{ width: '23%' }} />
          </colgroup>
          <thead className="bg-neutral-100 font-bold uppercase text-neutral-700">
            <tr>
              <th className="border border-neutral-300 p-1.5 sm:p-2 text-center">#</th>
              <th className="border border-neutral-300 p-1.5 sm:p-2 text-left whitespace-nowrap">Submission ID</th>
              <th className="border border-neutral-300 p-1.5 sm:p-2 text-left">Student ID &amp; Name</th>
              <th className="border border-neutral-300 p-1.5 sm:p-2 text-left">Course / College</th>
              <th className="border border-neutral-300 p-1.5 sm:p-2 text-left">Grant Program</th>
              <th className="border border-neutral-300 p-1.5 sm:p-2 text-center whitespace-nowrap">GWA</th>
              <th className="border border-neutral-300 p-1.5 sm:p-2 text-center whitespace-nowrap">Docs Status</th>
              <th className="border border-neutral-300 p-1.5 sm:p-2 text-left whitespace-nowrap">Status</th>
              <th className="border border-neutral-300 p-1.5 sm:p-2 text-left">Evaluator Remarks</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app, idx) => {
              const verifiedDocs = app.attachedDocuments.filter((d) => d.verified).length;
              const totalDocs = app.attachedDocuments.length;

              return (
                <tr key={app.id} className="border-b border-neutral-300 break-inside-avoid">
                  <td className="border border-neutral-300 p-1 sm:p-1.5 text-center font-bold">{idx + 1}</td>
                  <td className="border border-neutral-300 p-1 sm:p-1.5 font-mono font-bold text-maroon-primary whitespace-nowrap">{app.id}</td>
                  <td className="border border-neutral-300 p-1 sm:p-1.5 break-words">
                    <span className="font-bold block">{app.studentName}</span>
                    <span className="text-[9px] text-neutral-500 font-mono">{app.studentId}</span>
                  </td>
                  <td className="border border-neutral-300 p-1 sm:p-1.5 break-words">
                    <span>{app.course}</span>
                    <span className="text-[9px] block text-neutral-500">{app.college} • {app.yearAndSection}</span>
                  </td>
                  <td className="border border-neutral-300 p-1 sm:p-1.5 font-semibold break-words">{app.program}</td>
                  <td className="border border-neutral-300 p-1 sm:p-1.5 text-center font-bold whitespace-nowrap">{app.gwa.toFixed(2)}</td>
                  <td className="border border-neutral-300 p-1 sm:p-1.5 text-center font-semibold whitespace-nowrap">
                    {totalDocs === 0 ? '0/4 Missing' : `${verifiedDocs}/${totalDocs}`}
                  </td>
                  <td className="border border-neutral-300 p-1 sm:p-1.5 font-bold whitespace-nowrap">
                    {app.status}
                  </td>
                  <td className="border border-neutral-300 p-1 sm:p-1.5 text-[9px] text-neutral-700 break-words">
                    {app.status === 'Flagged' && app.flagReason ? `DEFICIENCY: ${app.flagReason}` : app.evaluatorNotes}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 5. Institutional Signatory Block */}
      <div className="signatory-block pt-8 mt-8 print:pt-4 print:mt-4 border-t border-neutral-300 font-sans text-xs break-inside-avoid">
        <div className="grid grid-cols-3 gap-6 text-center">
          <div className="space-y-12 print:space-y-7">
            <p className="text-[11px] font-semibold text-neutral-600">Prepared &amp; Audited by:</p>
            <div>
              <div className="w-full max-w-[180px] mx-auto border-b border-neutral-900 font-bold uppercase text-xs">
                PROF. MARLON SANTOS
              </div>
              <p className="text-[10px] text-neutral-500 mt-0.5">
                Head Scholarship Evaluator, SFAO
              </p>
            </div>
          </div>

          <div className="space-y-12 print:space-y-7">
            <p className="text-[11px] font-semibold text-neutral-600">Verified &amp; Certified Correct:</p>
            <div>
              <div className="w-full max-w-[180px] mx-auto border-b border-neutral-900 font-bold uppercase text-xs">
                DR. CARIDAD A. BAUTISTA
              </div>
              <p className="text-[10px] text-neutral-500 mt-0.5">
                Director, Scholarship &amp; Financial Assistance
              </p>
            </div>
          </div>

          <div className="space-y-12 print:space-y-7">
            <p className="text-[11px] font-semibold text-neutral-600">Approved for Endorsement:</p>
            <div>
              <div className="w-full max-w-[180px] mx-auto border-b border-neutral-900 font-bold uppercase text-xs">
                DR. ROGELIO T. MAGSINO
              </div>
              <p className="text-[10px] text-neutral-500 mt-0.5">
                Vice President for Academic Affairs / College President
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-4 print:mt-4 print:pt-2 border-t border-neutral-200 text-center text-[9px] text-neutral-400">
          Official Document of Eulogio &quot;Amang&quot; Rodriguez Institute of Science and Technology • ISO 9001:2015 Certified System
        </div>
      </div>
    </>
  );
};

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

  // Manage body class for isolating print portal and multi-page pagination
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('printing-sfao-report');
    } else {
      document.body.classList.remove('printing-sfao-report');
    }
    return () => {
      document.body.classList.remove('printing-sfao-report');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* 1. On-Screen Preview Modal (Hidden in Print via .no-print) */}
      <div className="no-print fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
        {/* Floating Modal Card (Landscape-friendly max-w-6xl) */}
        <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full border border-neutral-300 max-h-[95vh] flex flex-col overflow-hidden">
          {/* Top Control Bar */}
          <div className="bg-white text-neutral-900 px-6 py-3.5 flex items-center justify-between border-b border-neutral-200">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center">
                <Printer className="w-4 h-4 text-maroon-primary" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-neutral-900 uppercase tracking-wide">
                  Institutional Document Print &amp; PDF Preview (Landscape Format)
                </h2>
                <p className="text-[11px] text-neutral-500 font-sans">Official SFAO scholarship audit report</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-maroon-primary hover:bg-maroon-hover text-white shadow-2xs transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print / Save as PDF</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
                aria-label="Close preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Printable Document Paper View (On-Screen Preview - Widened to max-w-5xl) */}
          <div className="overflow-y-auto p-6 sm:p-8 bg-neutral-100 flex-1">
            <div className="printable-report-area bg-white mx-auto p-8 sm:p-10 shadow-md border border-neutral-200 max-w-5xl text-neutral-900 font-serif leading-normal">
              <ReportPaperContent
                applications={applications}
                kpis={kpis}
                filters={filters}
                printDate={printDate}
              />
            </div>
          </div>

          {/* Modal Bottom Controls */}
          <div className="bg-neutral-50 p-4 border-t border-neutral-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              Close Preview
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2 rounded-lg text-xs font-semibold bg-maroon-primary hover:bg-maroon-hover text-white shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-white" />
              <span>Print Report (PDF)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top-Level Print Portal (Rendered directly in document.body, hidden on screen, visible only during @media print) */}
      {typeof document !== 'undefined' &&
        createPortal(
          <div className="print-report-portal hidden print:block">
            <div className="printable-report-area bg-white text-neutral-900 font-serif leading-normal">
              <ReportPaperContent
                applications={applications}
                kpis={kpis}
                filters={filters}
                printDate={printDate}
              />
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
