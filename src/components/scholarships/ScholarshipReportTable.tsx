import React, { useState } from 'react';
import type { ScholarshipApplication, ScholarshipStatus } from '../../types';
import { formatPHP } from '../../utils/exportUtils';
import {
  FileText,
  Paperclip,
  AlertCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Download,
  CheckCheck,
  Sparkles,
  X,
} from 'lucide-react';

interface ScholarshipReportTableProps {
  applications: ScholarshipApplication[];
  onViewDetails: (application: ScholarshipApplication) => void;
  onQuickUpdateStatus: (id: string, newStatus: ScholarshipStatus) => void;
  selectedIds?: string[];
  onToggleSelect?: (id: string) => void;
  onToggleSelectAll?: (visibleIds: string[]) => void;
  onBatchUpdateStatus?: (status: ScholarshipStatus) => void;
  onExportSelected?: () => void;
}

export const ScholarshipReportTable: React.FC<ScholarshipReportTableProps> = ({
  applications,
  onViewDetails,
  onQuickUpdateStatus,
  selectedIds = [],
  onToggleSelect,
  onToggleSelectAll,
  onBatchUpdateStatus,
  onExportSelected,
}) => {
  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [prevLength, setPrevLength] = useState(applications.length);

  // Reset to page 1 during render if applications list length changes
  if (applications.length !== prevLength) {
    setPrevLength(applications.length);
    setCurrentPage(1);
  }

  // Total pages
  const totalRecords = applications.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);

  // Paginated applications slice
  const startIndex = (validCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalRecords);
  const paginatedApplications = applications.slice(startIndex, endIndex);

  // Selection calculations on visible page
  const visibleIds = paginatedApplications.map((app) => app.id);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
  const someVisibleSelected =
    visibleIds.some((id) => selectedIds.includes(id)) && !allVisibleSelected;

  const handleSelectAllOnPage = () => {
    if (onToggleSelectAll) {
      onToggleSelectAll(visibleIds);
    }
  };

  // Minimalist Status Badge
  const renderStatusBadge = (status: ScholarshipStatus) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            Approved
          </span>
        );
      case 'Endorsed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
            Endorsed
          </span>
        );
      case 'Pending Review':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Pending Review
          </span>
        );
      case 'Flagged':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
            Flagged
          </span>
        );
    }
  };

  // Program Display Label
  const formatProgramName = (program: string) => {
    if (program.includes('TES')) return 'CHED UniFAST (TES)';
    if (program.includes('TDP')) return 'CHED TDP-SUC';
    if (program.includes('DOST')) return 'DOST-SEI Grant';
    if (program.includes('Academic')) return 'Academic Honor Grant';
    if (program.includes('Assistantship') || program.includes('SAP')) return 'Student Assistantship';
    if (program.includes('Barangay') || program.includes('LGU')) return 'LGU / Barangay Assistance';
    return program;
  };

  // Format Date clean e.g. "Nov 2, 2026" & "9:40 PM"
  const formatDateTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const datePart = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      const timePart = date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      return { datePart, timePart };
    } catch {
      return { datePart: dateStr, timePart: '' };
    }
  };

  return (
    <div className="w-full bg-white rounded-xl border border-neutral-200 shadow-xs overflow-hidden relative">
      {/* Table Data Viewport */}
      {applications.length === 0 ? (
        <div className="text-center py-16 px-4">
          <AlertCircle className="w-10 h-10 text-neutral-300 mx-auto mb-2.5" />
          <h4 className="text-sm font-bold text-neutral-800">No Matching Student Applications Found</h4>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1">
            Adjust your search query, grant filter, or college criteria to view institutional candidate records.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            {/* Sticky Table Header */}
            <thead className="sticky top-0 z-10 bg-neutral-50 border-b border-neutral-200 text-[11px] font-bold text-neutral-600 uppercase tracking-wider">
              <tr>
                {/* 1. Checkbox Column */}
                <th scope="col" className="w-12 py-3 px-3 text-center">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    ref={(input) => {
                      if (input) input.indeterminate = someVisibleSelected;
                    }}
                    onChange={handleSelectAllOnPage}
                    className="w-4 h-4 rounded border-neutral-300 text-maroon-primary focus:ring-maroon-primary cursor-pointer"
                    aria-label="Select all applicants on page"
                  />
                </th>

                {/* 2. Applicant */}
                <th scope="col" className="py-3 px-4 min-w-[200px]">
                  Applicant
                </th>

                {/* 3. College & Program */}
                <th scope="col" className="py-3 px-4 min-w-[210px]">
                  College &amp; Program
                </th>

                {/* 4. Grant Applied */}
                <th scope="col" className="py-3 px-4 min-w-[170px]">
                  Grant Applied
                </th>

                {/* 5. Documents */}
                <th scope="col" className="py-3 px-4 min-w-[130px]">
                  Documents
                </th>

                {/* 6. Submission Date */}
                <th scope="col" className="py-3 px-4 min-w-[140px]">
                  Submission Date
                </th>

                {/* 7. Status */}
                <th scope="col" className="py-3 px-4 min-w-[125px]">
                  Status
                </th>

                {/* 8. Evaluator / Remarks */}
                <th scope="col" className="py-3 px-4 min-w-[190px]">
                  Evaluator / Remarks
                </th>

                {/* 9. Actions */}
                <th scope="col" className="py-3 px-4 text-center min-w-[190px]">
                  Actions
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-neutral-200 text-xs">
              {paginatedApplications.map((app) => {
                const isSelected = selectedIds.includes(app.id);
                const verifiedDocsCount = app.attachedDocuments.filter((d) => d.verified).length;
                const totalDocsCount = app.attachedDocuments.length;
                const isAllDocsVerified =
                  totalDocsCount > 0 && verifiedDocsCount === totalDocsCount;
                const missingDocsCount = totalDocsCount - verifiedDocsCount;
                const { datePart, timePart } = formatDateTime(app.submissionDate);

                return (
                  <tr
                    key={app.id}
                    className={`transition-colors ${
                      isSelected
                        ? 'bg-amber-50/70'
                        : 'hover:bg-neutral-50/80'
                    }`}
                  >
                    {/* 1. Checkbox */}
                    <td className="py-3.5 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onToggleSelect && onToggleSelect(app.id)}
                        className="w-4 h-4 rounded border-neutral-300 text-maroon-primary focus:ring-maroon-primary cursor-pointer"
                        aria-label={`Select ${app.studentName}`}
                      />
                    </td>

                    {/* 2. Applicant: Full Name + Student Number Monospace */}
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => onViewDetails(app)}
                        className="font-bold text-neutral-900 hover:text-maroon-primary transition-colors text-left block leading-tight truncate max-w-[220px]"
                        title={app.studentName}
                      >
                        {app.studentName}
                      </button>
                      <span className="font-mono text-[11px] text-neutral-500 block mt-0.5">
                        {app.studentId}
                      </span>
                    </td>

                    {/* 3. College & Program: College Code Badge + Course and Year */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-neutral-100 text-neutral-700 border border-neutral-200">
                          {app.college}
                        </span>
                        <span
                          className="text-xs text-neutral-800 font-medium truncate max-w-[190px]"
                          title={`${app.course} (${app.yearAndSection})`}
                        >
                          {app.course}
                        </span>
                      </div>
                      <span className="text-[11px] text-neutral-500 block mt-0.5">
                        {app.yearAndSection}
                      </span>
                    </td>

                    {/* 4. Grant Applied: Program Name + PHP Allocation Amount */}
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-neutral-800 block text-xs truncate max-w-[180px]">
                        {formatProgramName(app.program)}
                      </span>
                      <span className="font-bold text-[11px] text-maroon-primary block mt-0.5">
                        {formatPHP(app.stipendAmount)}
                      </span>
                    </td>

                    {/* 5. Documents: Clean Indicator + Clickable Paperclip Icon */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onViewDetails(app)}
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold transition-colors ${
                          totalDocsCount === 0
                            ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                            : isAllDocsVerified
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                        }`}
                        title="Click to inspect attached verification documents"
                      >
                        <Paperclip className="w-3 h-3 text-neutral-500" />
                        <span>
                          {totalDocsCount === 0
                            ? '0/4 Missing'
                            : isAllDocsVerified
                            ? `${verifiedDocsCount}/${totalDocsCount} Verified`
                            : `${missingDocsCount}/${totalDocsCount} Missing`}
                        </span>
                      </button>
                    </td>

                    {/* 6. Submission Date: Clean Date + Time */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-neutral-700">
                      <span className="font-medium text-xs block">{datePart}</span>
                      <span className="text-[11px] text-neutral-400 block mt-0.5">{timePart}</span>
                    </td>

                    {/* 7. Status: Minimalist Status Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {renderStatusBadge(app.status)}
                    </td>

                    {/* 8. Evaluator / Remarks: Name + Subtle Red Warning Chip for Flagged */}
                    <td className="py-3.5 px-4">
                      <span className="text-xs font-medium text-neutral-800 block truncate max-w-[180px]">
                        {app.assignedEvaluator}
                      </span>
                      {app.status === 'Flagged' && (
                        <div
                          className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded mt-1 cursor-help"
                          title={app.flagReason || 'Requires applicant document resubmission'}
                        >
                          <AlertTriangle className="w-3 h-3 text-rose-600 flex-shrink-0" />
                          <span>Needs Resubmission</span>
                        </div>
                      )}
                    </td>

                    {/* 9. Actions: Sleek [ Review Dossier ] Button + Clean Status Dropdown */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onViewDetails(app)}
                          className="px-2.5 py-1.5 rounded-md text-xs font-semibold border border-neutral-300 bg-white text-neutral-700 hover:border-maroon-primary hover:text-maroon-primary hover:bg-maroon-subtle/40 transition-colors inline-flex items-center gap-1 shadow-2xs"
                          title="Review complete applicant dossier"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Review Dossier</span>
                        </button>

                        <select
                          value={app.status}
                          onChange={(e) =>
                            onQuickUpdateStatus(app.id, e.target.value as ScholarshipStatus)
                          }
                          className="text-[11px] font-medium py-1 px-1.5 border border-neutral-300 rounded-md bg-white text-neutral-700 hover:border-neutral-400 focus:outline-none focus:ring-1 focus:ring-maroon-primary cursor-pointer"
                          aria-label={`Change status for ${app.studentName}`}
                        >
                          <option value="Approved">Approve</option>
                          <option value="Endorsed">Endorse</option>
                          <option value="Pending Review">Pending</option>
                          <option value="Flagged">Flag</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 5. Pagination Footer */}
      <div className="p-3.5 bg-neutral-50 border-t border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-neutral-600 select-none">
        {/* Left: Showing range */}
        <div className="font-medium text-neutral-700">
          Showing <span className="font-bold text-neutral-900">{totalRecords > 0 ? startIndex + 1 : 0}</span> to{' '}
          <span className="font-bold text-neutral-900">{endIndex}</span> of{' '}
          <span className="font-bold text-maroon-primary">810</span> applicants
          {totalRecords < 810 && (
            <span className="text-[11px] text-neutral-500 ml-1">
              ({totalRecords} filtered)
            </span>
          )}
        </div>

        {/* Center / Right: Page Controls & Rows Per Page */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Rows per page selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-neutral-500 font-medium">Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="text-xs font-semibold py-1 px-2 border border-neutral-300 rounded-md bg-white text-neutral-800 focus:outline-none focus:ring-1 focus:ring-maroon-primary cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>

          {/* Page navigation buttons */}
          <div className="inline-flex items-center gap-1">
            <button
              type="button"
              disabled={validCurrentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-md border border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pageNum) => (
              <button
                key={pageNum}
                type="button"
                onClick={() => setCurrentPage(pageNum)}
                className={`min-w-[28px] h-7 px-2 rounded-md text-xs font-semibold transition-colors ${
                  pageNum === validCurrentPage
                    ? 'bg-maroon-primary text-white shadow-xs'
                    : 'bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                {pageNum}
              </button>
            ))}

            <button
              type="button"
              disabled={validCurrentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-md border border-neutral-300 bg-white text-neutral-600 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Bottom Floating Batch Operations Bar */}
      {selectedIds.length > 0 && onBatchUpdateStatus && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-neutral-900 text-white px-5 py-3 rounded-xl shadow-2xl border border-neutral-700 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2 text-xs">
            <span className="w-6 h-6 rounded-full bg-amber-400 text-neutral-900 font-bold flex items-center justify-center text-xs">
              {selectedIds.length}
            </span>
            <span className="font-medium text-neutral-200">
              candidate{selectedIds.length !== 1 ? 's' : ''} selected
            </span>
          </div>

          <div className="h-4 w-px bg-neutral-700 hidden sm:block" />

          <div className="flex items-center gap-2 text-xs flex-wrap">
            <button
              type="button"
              onClick={() => onBatchUpdateStatus('Endorsed')}
              className="px-3 py-1.5 rounded-lg bg-sky-700 hover:bg-sky-600 text-white font-semibold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-sky-200" />
              <span>Endorse Selected</span>
            </button>

            <button
              type="button"
              onClick={() => onBatchUpdateStatus('Approved')}
              className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-semibold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5 text-emerald-200" />
              <span>Approve Selected</span>
            </button>

            {onExportSelected && (
              <button
                type="button"
                onClick={onExportSelected}
                className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-semibold border border-neutral-600 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Export selected candidates to CHED disbursement spreadsheet"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Export Selected to Masterlist</span>
              </button>
            )}

            {onToggleSelectAll && (
              <button
                type="button"
                onClick={() => onToggleSelectAll([])}
                className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                title="Deselect all candidates"
                aria-label="Clear selection"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
