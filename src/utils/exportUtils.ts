import type { ScholarshipApplication, ReportSummaryKPIs } from '../types';

/**
 * Calculates Weekly KPI summary rollups from the filtered applications list
 */
export function calculateReportKPIs(applications: ScholarshipApplication[]): ReportSummaryKPIs {
  let totalSubmitted = applications.length;
  let verifiedDocuments = 0;
  let approvedCount = 0;
  let endorsedCount = 0;
  let pendingCount = 0;
  let flaggedCount = 0;
  let totalGrantAllocation = 0;

  applications.forEach((app) => {
    // Count verified documents
    const appVerifiedDocs = app.attachedDocuments.filter((d) => d.verified).length;
    verifiedDocuments += appVerifiedDocs;

    totalGrantAllocation += app.stipendAmount || 0;

    if (app.status === 'Approved') approvedCount++;
    else if (app.status === 'Endorsed') endorsedCount++;
    else if (app.status === 'Pending Review') pendingCount++;
    else if (app.status === 'Flagged') flaggedCount++;
  });

  return {
    totalSubmitted,
    verifiedDocuments,
    approvedOrEndorsed: approvedCount + endorsedCount,
    flaggedOrPending: pendingCount + flaggedCount,
    approvedCount,
    endorsedCount,
    pendingCount,
    flaggedCount,
    totalGrantAllocation,
  };
}

/**
 * Escapes field for CSV (RFC 4180)
 */
function escapeCSVField(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Exports application dataset as a formatted institutional CSV file compatible with Microsoft Excel
 */
export function exportApplicationsToCSV(
  applications: ScholarshipApplication[],
  dateRange: { start: string; end: string },
  selectedProgram: string
) {
  const kpis = calculateReportKPIs(applications);

  const headerRows = [
    ['EULOGIO "AMANG" RODRIGUEZ INSTITUTE OF SCIENCE AND TECHNOLOGY'],
    ['SCHOLARSHIP AND FINANCIAL ASSISTANCE OFFICE (SFAO)'],
    ['WEEKLY SCHOLARSHIP ACCOMPLISHMENT AND ACTIVITY REPORT'],
    [`Generated Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`],
    [`Reporting Period: ${dateRange.start} to ${dateRange.end}`],
    [`Program Filter: ${selectedProgram}`],
    [''],
    ['--- SUMMARY METRICS ---'],
    [`Total Applications This Period: ${kpis.totalSubmitted}`],
    [`Verified Documents Total: ${kpis.verifiedDocuments}`],
    [`Approved Beneficiaries: ${kpis.approvedCount}`],
    [`Endorsed Beneficiaries: ${kpis.endorsedCount}`],
    [`Pending Applications: ${kpis.pendingCount}`],
    [`Flagged / Deficient: ${kpis.flaggedCount}`],
    [`Total Allocated Stipend: PHP ${kpis.totalGrantAllocation.toLocaleString()}`],
    [''],
    [
      'Submission ID',
      'Student ID',
      'Student Full Name',
      'College',
      'Course / Year & Section',
      'Scholarship Program',
      'Submission Date',
      'Verification Status',
      'GWA',
      'Stipend Amount (PHP)',
      'Verified Docs Count',
      'Total Required Docs',
      'Assigned Evaluator',
      'Evaluator Remarks / Action Taken',
    ],
  ];

  const dataRows = applications.map((app) => {
    const verifiedDocs = app.attachedDocuments.filter((d) => d.verified).length;
    const totalDocs = app.attachedDocuments.length;
    return [
      app.id,
      app.studentId,
      app.studentName,
      app.college,
      `${app.course} (${app.yearAndSection})`,
      app.program,
      new Date(app.submissionDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
      app.status,
      app.gwa.toFixed(2),
      app.stipendAmount.toString(),
      verifiedDocs.toString(),
      totalDocs.toString(),
      app.assignedEvaluator,
      app.status === 'Flagged' && app.flagReason ? `FLAGGED: ${app.flagReason}` : app.evaluatorNotes,
    ];
  });

  const allRows = [...headerRows, ...dataRows];

  const csvContent =
    '\uFEFF' + // UTF-8 BOM so Excel opens with proper encoding
    allRows.map((row) => row.map((cell) => escapeCSVField(cell)).join(',')).join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const sanitizedDate = new Date().toISOString().slice(0, 10);
  link.setAttribute('href', url);
  link.setAttribute('download', `EARIST_Weekly_Scholarship_Report_${sanitizedDate}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Helper to format currency in Philippine Peso
 */
export function formatPHP(amount: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
  }).format(amount);
}
