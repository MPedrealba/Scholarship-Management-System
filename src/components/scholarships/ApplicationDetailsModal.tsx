import React, { useState, useMemo } from 'react';
import type {
  ScholarshipApplication,
  DocumentChecklist,
  ApplicationAuditEntry,
} from '../../types';
import { formatPHP } from '../../utils/exportUtils';
import { useAuth } from '../../context/AuthContext';
import { checkQuotaAvailability, getGrantQuota } from '../../utils/quotaUtils';
import { EaristLogo } from '../common/EaristLogo';
import { updateApplicationStatusApi } from '../../utils/api';
import { DocumentInspectPanel } from './DocumentInspectionPanel';
import {
  X,
  FileCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Flag,
  MessageSquare,
  Award,
  Send,
  Eye,
  AlertTriangle,
  History,
} from 'lucide-react';

interface ApplicationDetailsModalProps {
  application: ScholarshipApplication | null;
  allApplications: ScholarshipApplication[];
  onClose: () => void;
  onUpdateApplication: (updated: ScholarshipApplication) => void;
}

interface ApplicationDetailsContentProps {
  application: ScholarshipApplication;
  allApplications: ScholarshipApplication[];
  onClose: () => void;
  onUpdateApplication: (updated: ScholarshipApplication) => void;
}

const ApplicationDetailsContent: React.FC<ApplicationDetailsContentProps> = ({
  application,
  allApplications,
  onClose,
  onUpdateApplication,
}) => {
  const { currentUser } = useAuth();

  const [currentApp, setCurrentApp] = useState<ScholarshipApplication>(application);
  const [activeNotes, setActiveNotes] = useState(application.evaluatorNotes || '');
  const [activeFlagReason, setActiveFlagReason] = useState(application.flagReason || '');
  const [isFlagBoxOpen, setIsFlagBoxOpen] = useState(application.status === 'Flagged');
  const [inspectingDoc, setInspectingDoc] = useState<DocumentChecklist | null>(null);
  const [inlineBanner, setInlineBanner] = useState<{
    type: 'error' | 'warning' | 'success';
    message: string;
  } | null>(null);

  // Compute live quota availability for this applicant's program
  const quotaInfo = useMemo(() => {
    return getGrantQuota(currentApp.program, allApplications);
  }, [currentApp.program, allApplications]);

  // Derived Annual Income
  const annualIncome = currentApp.monthlyHouseholdIncome * 12;

  // Toggle document verification state
  const handleToggleDocVerification = (docId: string) => {
    const updatedDocs = currentApp.attachedDocuments.map((doc) => {
      if (doc.id === docId) {
        return { ...doc, verified: !doc.verified };
      }
      return doc;
    });

    const targetDoc = currentApp.attachedDocuments.find((d) => d.id === docId);
    const wasVerified = targetDoc?.verified;
    const actionLabel = wasVerified
      ? `Revoked Verification: ${targetDoc?.name}`
      : `Marked Verified: ${targetDoc?.name}`;

    const newAuditEntry: ApplicationAuditEntry = {
      id: `audit-${Date.now()}`,
      evaluatorName: currentUser.name,
      role: currentUser.title,
      action: actionLabel,
      remarks: `Requirement credential audit updated by ${currentUser.name}.`,
      timestamp: new Date().toISOString(),
    };

    const updatedTrail = [newAuditEntry, ...(currentApp.auditTrail || [])];

    const updated: ScholarshipApplication = {
      ...currentApp,
      attachedDocuments: updatedDocs,
      auditTrail: updatedTrail,
      lastUpdated: new Date().toISOString(),
    };

    setCurrentApp(updated);
    onUpdateApplication(updated);

    // Persist doc verification toggle to backend
    updateApplicationStatusApi(currentApp.id, {
      status: currentApp.status,
      verifiedDocs: updatedDocs.filter((d) => d.verified).map((d) => d.id),
      evaluatedBy: currentUser.name,
      role: currentUser.title,
      userEmail: currentUser.email,
    }).catch((err) => console.warn('Could not sync doc verification to server:', err));

    if (inspectingDoc && inspectingDoc.id === docId) {
      setInspectingDoc({ ...inspectingDoc, verified: !inspectingDoc.verified });
    }
  };

  // DECISION ACTION 1: Endorse to SFAO (College Evaluators & Admin)
  const handleEndorseToSFAO = () => {
    const newAuditEntry: ApplicationAuditEntry = {
      id: `audit-${Date.now()}`,
      evaluatorName: currentUser.name,
      role: currentUser.title,
      action: 'Endorsed to SFAO',
      remarks: activeNotes || 'Applicant recommended by College Evaluator for CHED UniFAST processing.',
      timestamp: new Date().toISOString(),
    };

    const updated: ScholarshipApplication = {
      ...currentApp,
      status: 'Endorsed',
      evaluatorNotes: activeNotes || 'Recommended for CHED UniFAST grant endorsement by College Evaluator.',
      flagReason: undefined,
      auditTrail: [newAuditEntry, ...(currentApp.auditTrail || [])],
      lastUpdated: new Date().toISOString(),
    };

    setCurrentApp(updated);
    onUpdateApplication(updated);
    setIsFlagBoxOpen(false);
    setInlineBanner({
      type: 'success',
      message: 'Applicant successfully endorsed to SFAO Central Office for awarding.',
    });

    // Persist endorsement to backend
    updateApplicationStatusApi(currentApp.id, {
      status: 'Endorsed',
      evaluatorRemarks: activeNotes || 'Applicant recommended by College Evaluator for CHED UniFAST processing.',
      evaluatedBy: currentUser.name,
      role: currentUser.title,
      userEmail: currentUser.email,
    }).catch((err) => console.warn('Could not sync endorsement to server:', err));
  };

  // DECISION ACTION 2: Approve for Awarding (Strictly Super Admin + Quota Check)
  const handleApproveForAwarding = () => {
    // Check privilege
    if (currentUser.role !== 'superadmin') {
      setInlineBanner({
        type: 'warning',
        message: 'Privilege Restricted: Grant approval is reserved for Super Administrator (SFAO Director). College Evaluators must use Endorse to SFAO.',
      });
      return;
    }

    // Check quota capacity
    const check = checkQuotaAvailability(
      currentApp.program,
      allApplications,
      currentApp.status === 'Approved'
    );

    if (!check.allowed) {
      setInlineBanner({
        type: 'warning',
        message: check.reason || 'Quota Reached: Grant slots fully allocated for this term.',
      });
      return;
    }

    const newAuditEntry: ApplicationAuditEntry = {
      id: `audit-${Date.now()}`,
      evaluatorName: currentUser.name,
      role: currentUser.title,
      action: 'Approved for Awarding',
      remarks: activeNotes || `Enrolled into official disbursement masterlist. Quota slot allocated (${check.quota.totalFilled + 1}/${check.quota.maxSlots}).`,
      timestamp: new Date().toISOString(),
    };

    const updated: ScholarshipApplication = {
      ...currentApp,
      status: 'Approved',
      evaluatorNotes: activeNotes || 'Official grant awarded by SFAO Director. Earmarked for disbursement.',
      flagReason: undefined,
      auditTrail: [newAuditEntry, ...(currentApp.auditTrail || [])],
      lastUpdated: new Date().toISOString(),
    };

    setCurrentApp(updated);
    onUpdateApplication(updated);
    setIsFlagBoxOpen(false);
    setInlineBanner({
      type: 'success',
      message: `Application approved and enrolled into official disbursement masterlist (Quota slot ${check.quota.totalFilled + 1}/${check.quota.maxSlots}).`,
    });

    // Persist approval to backend
    updateApplicationStatusApi(currentApp.id, {
      status: 'Approved',
      evaluatorRemarks: activeNotes || 'Official grant awarded by SFAO Director. Earmarked for disbursement.',
      evaluatedBy: currentUser.name,
      role: currentUser.title,
      userEmail: currentUser.email,
    }).catch((err) => console.warn('Could not sync approval to server:', err));
  };

  // DECISION ACTION 3: Flag Requirements (Sends advisory to student tracker)
  const handleFlagRequirementsSubmit = () => {
    if (!activeFlagReason.trim()) {
      setInlineBanner({
        type: 'error',
        message: 'Please specify the exact requirement deficiency remarks for the student to resolve.',
      });
      return;
    }

    const newAuditEntry: ApplicationAuditEntry = {
      id: `audit-${Date.now()}`,
      evaluatorName: currentUser.name,
      role: currentUser.title,
      action: 'Flagged Requirements',
      remarks: activeFlagReason,
      timestamp: new Date().toISOString(),
    };

    const updated: ScholarshipApplication = {
      ...currentApp,
      status: 'Flagged',
      flagReason: activeFlagReason,
      evaluatorNotes: activeNotes || `Flagged for deficiency: ${activeFlagReason}`,
      auditTrail: [newAuditEntry, ...(currentApp.auditTrail || [])],
      lastUpdated: new Date().toISOString(),
    };

    setCurrentApp(updated);
    onUpdateApplication(updated);
    setIsFlagBoxOpen(true);
    setInlineBanner({
      type: 'success',
      message: 'Application marked as Flagged. Deficiency advisory notice dispatched to Student Tracker.',
    });

    // Persist deficiency flag to backend
    updateApplicationStatusApi(currentApp.id, {
      status: 'Flagged',
      flagReason: activeFlagReason,
      evaluatorRemarks: activeNotes || `Flagged for deficiency: ${activeFlagReason}`,
      evaluatedBy: currentUser.name,
      role: currentUser.title,
      userEmail: currentUser.email,
    }).catch((err) => console.warn('Could not sync deficiency flag to server:', err));
  };

  // Save Evaluator Notes
  const handleSaveNotesOnly = () => {
    const newAuditEntry: ApplicationAuditEntry = {
      id: `audit-${Date.now()}`,
      evaluatorName: currentUser.name,
      role: currentUser.title,
      action: 'Evaluator Notes Updated',
      remarks: activeNotes,
      timestamp: new Date().toISOString(),
    };

    const updated: ScholarshipApplication = {
      ...currentApp,
      evaluatorNotes: activeNotes,
      auditTrail: [newAuditEntry, ...(currentApp.auditTrail || [])],
      lastUpdated: new Date().toISOString(),
    };

    setCurrentApp(updated);
    onUpdateApplication(updated);
    setInlineBanner({
      type: 'success',
      message: 'Evaluator deliberation remarks recorded in audit trail.',
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div
        className={`bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh] w-full transition-all duration-200 ${
          inspectingDoc ? 'max-w-7xl' : 'max-w-4xl'
        }`}
      >
        {/* 1. Header: Clean White Institutional Dossier Header */}
        <div className="bg-white p-5 sm:p-6 border-b border-neutral-200 text-neutral-900 flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3.5 min-w-0">
              <EaristLogo size={44} showText={false} className="flex-shrink-0 mt-0.5" />
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono font-medium text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">
                    {currentApp.id}
                  </span>
                  <span className="text-xs bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded font-medium border border-neutral-200">
                    {currentApp.collegeName} ({currentApp.college})
                  </span>
                  <span className="text-xs bg-neutral-100 text-neutral-800 font-semibold px-2 py-0.5 rounded border border-neutral-200">
                    GWA: {currentApp.gwa.toFixed(2)}
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight truncate">
                  {currentApp.studentName}
                </h2>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-600">
                  <span>
                    Student ID: <strong className="text-neutral-900 font-mono font-medium">{currentApp.studentId}</strong>
                  </span>
                  <span>•</span>
                  <span>{currentApp.course}</span>
                  <span>•</span>
                  <span>
                    Section: <strong className="text-neutral-800">{currentApp.yearAndSection}</strong>
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors flex-shrink-0 cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Metrics Ribbon in Header */}
          <div className="mt-4 pt-3 border-t border-neutral-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-[10px] text-neutral-500 uppercase font-medium">Scholarship Grant</span>
              <p className="font-semibold text-neutral-900 truncate">{currentApp.program}</p>
            </div>
            <div>
              <span className="text-[10px] text-neutral-500 uppercase font-medium">Grant Value</span>
              <p className="font-semibold text-neutral-900">{formatPHP(currentApp.stipendAmount)} / Sem</p>
            </div>
            <div>
              <span className="text-[10px] text-neutral-500 uppercase font-medium">Annual Family Income</span>
              <p className="font-semibold text-neutral-900">
                {formatPHP(annualIncome)}{' '}
                <span className="text-[10px] text-neutral-500">
                  ({formatPHP(currentApp.monthlyHouseholdIncome)}/mo)
                </span>
              </p>
            </div>
            <div>
              <span className="text-[10px] text-neutral-500 uppercase font-medium">Current Status</span>
              <div className="mt-0.5">
                {currentApp.status === 'Approved' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Approved
                  </span>
                )}
                {currentApp.status === 'Endorsed' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    <CheckCircle2 className="w-3 h-3 text-blue-600" /> Endorsed to SFAO
                  </span>
                )}
                {currentApp.status === 'Pending Review' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                    <Clock className="w-3 h-3 text-amber-600" /> Pending Review
                  </span>
                )}
                {currentApp.status === 'Flagged' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-red-50 text-red-700 border border-red-200">
                    <AlertCircle className="w-3 h-3 text-red-600" /> Flagged Deficiency
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Clean Inline Notification Banner (Replacing native alerts) */}
        {inlineBanner && (
          <div
            className={`px-5 py-3 border-b text-xs flex items-center justify-between animate-in slide-in-from-top-1 flex-shrink-0 ${
              inlineBanner.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-800'
                : inlineBanner.type === 'warning'
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {inlineBanner.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              ) : inlineBanner.type === 'warning' ? (
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              )}
              <span className="font-medium">{inlineBanner.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setInlineBanner(null)}
              className="text-xs font-semibold hover:underline ml-4 cursor-pointer flex-shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Modal Body Container (Split pane when document inspection is active) */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row min-h-0">
          {/* Left Column: Dossier Details, Checklist, Notes, Audit Ledger */}
          <div
            className={`p-5 sm:p-6 space-y-6 overflow-y-auto ${
              inspectingDoc ? 'lg:w-1/2 border-r border-neutral-200' : 'w-full'
            }`}
          >
            {/* 2. Document Verification Section */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 pb-2">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-maroon-primary" />
                  <h3 className="font-semibold text-neutral-900 text-xs uppercase tracking-wider">
                    Mandatory Document Verification (4 Files Required)
                  </h3>
                </div>
                <span className="text-[11px] text-neutral-500 font-medium">
                  {currentApp.attachedDocuments.filter((d) => d.verified).length} of{' '}
                  {currentApp.attachedDocuments.length} Verified Correct
                </span>
              </div>

              {/* Document Cards Grid */}
              <div
                className={`grid gap-3 text-xs ${
                  inspectingDoc ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'
                }`}
              >
                {currentApp.attachedDocuments.map((doc) => {
                  const mime =
                    doc.mimeType || (doc.name.endsWith('.pdf') ? 'application/pdf' : 'image/png');
                  const isCurrentInspect = inspectingDoc?.id === doc.id;

                  return (
                    <div
                      key={doc.id}
                      className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                        isCurrentInspect
                          ? 'bg-maroon-subtle/50 border-maroon-primary/40 ring-1 ring-maroon-primary/30'
                          : doc.verified
                          ? 'bg-emerald-50/50 border-emerald-200 text-neutral-900'
                          : 'bg-neutral-50 border-neutral-200 text-neutral-900 hover:border-neutral-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <button
                            type="button"
                            onClick={() => handleToggleDocVerification(doc.id)}
                            className={`w-5 h-5 rounded flex items-center justify-center border mt-0.5 transition-colors cursor-pointer flex-shrink-0 ${
                              doc.verified
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'border-neutral-400 bg-white hover:border-neutral-600'
                            }`}
                            title="Click to toggle verified state"
                          >
                            {doc.verified && <CheckCircle2 className="w-3.5 h-3.5" />}
                          </button>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-xs text-neutral-900 truncate">
                                {doc.name}
                              </span>
                              {doc.required && (
                                <span className="text-[9px] bg-red-100 text-red-800 px-1 py-0.2 rounded font-semibold uppercase">
                                  Required
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-neutral-500 mt-0.5 flex items-center gap-2 font-mono">
                              <span className="uppercase text-neutral-600 font-medium">
                                {mime.replace('application/', '').replace('image/', '')}
                              </span>
                              <span>•</span>
                              <span>{doc.fileSize} (&lt; 2MB)</span>
                            </div>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded whitespace-nowrap flex-shrink-0 ${
                            doc.verified
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {doc.verified ? 'Verified Correct' : 'Needs Verification'}
                        </span>
                      </div>

                      {/* Card Action: Inspect File & Verification Toggle */}
                      <div className="pt-2 border-t border-neutral-200/60 flex items-center justify-between gap-2">
                        <label className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-700 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={doc.verified}
                            onChange={() => handleToggleDocVerification(doc.id)}
                            className="rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                          <span>Verified</span>
                        </label>

                        <button
                          type="button"
                          onClick={() => setInspectingDoc(doc)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors shadow-2xs cursor-pointer ${
                            isCurrentInspect
                              ? 'bg-maroon-primary text-white'
                              : 'text-maroon-primary bg-white border border-maroon-primary/30 hover:bg-maroon-subtle'
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{isCurrentInspect ? 'Viewing' : 'Inspect File'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Evaluator Action Remarks & Deficiency Input */}
            <div className="space-y-3 bg-neutral-50 p-4 rounded-xl border border-neutral-200">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-neutral-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-maroon-primary" />
                  <span>Evaluator Audit Notes &amp; Deliberation Remarks</span>
                </h4>
                <button
                  type="button"
                  onClick={handleSaveNotesOnly}
                  className="text-xs font-semibold text-maroon-primary hover:text-maroon-hover hover:underline cursor-pointer"
                >
                  Save Notes
                </button>
              </div>

              <textarea
                rows={2}
                value={activeNotes}
                onChange={(e) => setActiveNotes(e.target.value)}
                placeholder="Enter official evaluation remarks, Registrar coordination findings, or notes for the SFAO committee..."
                className="w-full text-xs p-3 bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-primary font-sans"
              />

              {/* Deficiency Flagging Section (Expandable or Active) */}
              {(isFlagBoxOpen || currentApp.status === 'Flagged') && (
                <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 space-y-2 animate-in fade-in">
                  <label className="text-[11px] font-semibold text-red-900 flex items-center gap-1.5">
                    <Flag className="w-3.5 h-3.5 text-red-600" />
                    <span>Deficiency Remarks (Advisory notice sent to Student Tracker):</span>
                  </label>

                  {/* Preset Buttons for Common Registrar Deficiencies */}
                  <div className="flex flex-wrap gap-1.5 text-[10px]">
                    <span className="text-neutral-500 font-medium self-center">Presets:</span>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveFlagReason('Incomplete COR: Missing College Registrar Dry Seal Stamp.')
                      }
                      className="px-2 py-0.5 rounded bg-white border border-red-200 text-red-800 hover:bg-red-100 font-medium cursor-pointer"
                    >
                      Missing Registrar Seal
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveFlagReason('Unreadable Grade Slip: General Weighted Average (GWA) not certified.')
                      }
                      className="px-2 py-0.5 rounded bg-white border border-red-200 text-red-800 hover:bg-red-100 font-medium cursor-pointer"
                    >
                      Uncertified GWA
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveFlagReason('Expired Indigency Certificate: Must be issued within calendar year 2026.')
                      }
                      className="px-2 py-0.5 rounded bg-white border border-red-200 text-red-800 hover:bg-red-100 font-medium cursor-pointer"
                    >
                      Expired Indigency
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveFlagReason('Invalid ID: Missing current 1st Semester A.Y. 2026–2027 validation sticker.')
                      }
                      className="px-2 py-0.5 rounded bg-white border border-red-200 text-red-800 hover:bg-red-100 font-medium cursor-pointer"
                    >
                      Unvalidated Student ID
                    </button>
                  </div>

                  <input
                    type="text"
                    value={activeFlagReason}
                    onChange={(e) => setActiveFlagReason(e.target.value)}
                    placeholder="e.g. Incomplete COR: Missing College Registrar Stamp..."
                    className="w-full text-xs px-3 py-2 bg-white border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-600 font-medium text-neutral-900"
                  />

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleFlagRequirementsSubmit}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600 hover:bg-red-700 text-white shadow-2xs transition-colors cursor-pointer"
                    >
                      <Flag className="w-3.5 h-3.5" />
                      <span>Confirm &amp; Send Advisory Notice</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 4. Automated Audit Log & Compliance Ledger (RA 10173 Compliance) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-maroon-primary" />
                  <h4 className="font-semibold text-neutral-900 text-xs uppercase tracking-wider">
                    Automated Evaluation Audit Ledger (RA 10173 Compliance)
                  </h4>
                </div>
                <span className="text-[10px] text-neutral-500 font-mono">
                  Immutable Audit Records: {(currentApp.auditTrail || []).length}
                </span>
              </div>

              <div className="border border-neutral-200 rounded-xl overflow-hidden bg-white max-h-48 overflow-y-auto divide-y divide-neutral-100 text-xs">
                {currentApp.auditTrail && currentApp.auditTrail.length > 0 ? (
                  currentApp.auditTrail.map((log) => (
                    <div key={log.id} className="p-3 hover:bg-neutral-50 flex items-start justify-between gap-3">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-neutral-900">{log.evaluatorName}</span>
                          <span className="text-[10px] bg-neutral-100 text-neutral-700 px-1.5 py-0.2 rounded font-medium border border-neutral-200">
                            {log.role}
                          </span>
                        </div>
                        <p className="text-[11px] text-maroon-primary font-semibold">{log.action}</p>
                        {log.remarks && (
                          <p className="text-[11px] text-neutral-600 italic truncate">&quot;{log.remarks}&quot;</p>
                        )}
                      </div>
                      <span className="text-[10px] text-neutral-400 whitespace-nowrap font-mono flex-shrink-0">
                        {new Date(log.timestamp).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-neutral-400 text-xs italic">
                    No prior evaluation audit entries recorded for this candidate.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Integrated Document Inspection Pane */}
          {inspectingDoc && (
            <div className="lg:w-1/2 flex flex-col bg-neutral-100 overflow-hidden border-t lg:border-t-0 border-neutral-200">
              <DocumentInspectPanel
                doc={inspectingDoc}
                applicant={currentApp}
                onClose={() => setInspectingDoc(null)}
                onToggleVerify={handleToggleDocVerification}
              />
            </div>
          )}
        </div>

        {/* 5. Evaluator Action Decision Bar (Sticky Modal Footer) */}
        <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
          {/* Active Evaluator Badge */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-neutral-500">Evaluator:</span>
            <span className="font-semibold text-neutral-800 bg-white px-2.5 py-1 rounded border border-neutral-300">
              {currentUser.name} ({currentUser.title})
            </span>
          </div>

          {/* Decision Buttons Trio - Zero Brackets */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Button 1: Endorse to SFAO */}
            <button
              type="button"
              onClick={handleEndorseToSFAO}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-blue-700 hover:bg-blue-800 text-white shadow-2xs transition-colors cursor-pointer"
              title="Endorse candidate to SFAO central committee for awarding"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Endorse to SFAO</span>
            </button>

            {/* Button 2: Approve for Awarding */}
            <button
              type="button"
              onClick={handleApproveForAwarding}
              disabled={quotaInfo.isFull}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all shadow-2xs ${
                quotaInfo.isFull
                  ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                  : 'bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer'
              }`}
              title={
                quotaInfo.isFull
                  ? 'Grant slots fully allocated for this term'
                  : currentUser.role !== 'superadmin'
                  ? 'Requires Super Admin (SFAO Director) privilege'
                  : 'Enroll student into official disbursement masterlist'
              }
            >
              <Award className="w-3.5 h-3.5" />
              <span>Approve for Awarding</span>
              <span className="text-[10px] bg-black/20 px-1.5 py-0.2 rounded font-mono ml-0.5">
                {quotaInfo.totalFilled}/{quotaInfo.maxSlots}
              </span>
            </button>

            {/* Button 3: Flag Deficiency */}
            <button
              type="button"
              onClick={() => setIsFlagBoxOpen(!isFlagBoxOpen)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                isFlagBoxOpen
                  ? 'bg-red-600 text-white border-red-700'
                  : 'bg-white text-red-700 border-red-300 hover:bg-red-50'
              }`}
              title="Flag deficient documents and notify student"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Flag Deficiency</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-50 transition-colors ml-2 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ApplicationDetailsModal: React.FC<ApplicationDetailsModalProps> = ({
  application,
  allApplications,
  onClose,
  onUpdateApplication,
}) => {
  if (!application) return null;

  return (
    <ApplicationDetailsContent
      key={application.id}
      application={application}
      allApplications={allApplications}
      onClose={onClose}
      onUpdateApplication={onUpdateApplication}
    />
  );
};

export const DocumentInspectModal = DocumentInspectPanel;
