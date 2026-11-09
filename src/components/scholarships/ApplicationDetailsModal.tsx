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
  FileText,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  AlertTriangle,
  History,
  Stamp,
  GraduationCap,
} from 'lucide-react';

interface ApplicationDetailsModalProps {
  application: ScholarshipApplication | null;
  allApplications: ScholarshipApplication[];
  onClose: () => void;
  onUpdateApplication: (updated: ScholarshipApplication) => void;
}

interface DocumentInspectModalProps {
  doc: DocumentChecklist;
  applicant: ScholarshipApplication;
  onClose: () => void;
  onToggleVerify: (docId: string) => void;
}

/**
 * High-Fidelity Document Inspection Lightbox/Viewer
 */
const DocumentInspectModal: React.FC<DocumentInspectModalProps> = ({
  doc,
  applicant,
  onClose,
  onToggleVerify,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  const mimeTypeDisplay =
    doc.mimeType || (doc.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/png');

  const handleZoomIn = () => setZoomLevel((z) => Math.min(180, z + 20));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(60, z - 20));
  const handleZoomReset = () => setZoomLevel(100);

  return (
    <div className="fixed inset-0 z-60 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col border border-neutral-300 overflow-hidden">
        {/* Inspection Header Bar */}
        <div className="bg-[#800000] text-white px-5 py-3.5 flex items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4 text-amber-300" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-amber-300 bg-black/20 px-1.5 py-0.5 rounded">
                  {mimeTypeDisplay.toUpperCase()}
                </span>
                <span className="text-[10px] text-white/80">
                  {doc.fileSize} • &lt; 2MB Server Quota Validated
                </span>
              </div>
              <h3 className="text-sm font-bold text-white truncate">{doc.name}</h3>
            </div>
          </div>

          {/* Right Controls: Zoom & Close */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="hidden sm:flex items-center gap-1 bg-black/25 px-2 py-1 rounded-lg text-xs">
              <button
                type="button"
                onClick={handleZoomOut}
                className="p-1 hover:text-amber-300 transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-[11px] px-1 text-neutral-200">{zoomLevel}%</span>
              <button
                type="button"
                onClick={handleZoomIn}
                className="p-1 hover:text-amber-300 transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleZoomReset}
                className="p-1 hover:text-amber-300 transition-colors border-l border-white/20 ml-1 pl-1.5"
                title="Reset Zoom"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-300 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close document inspect"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Verification Status Action Ribbon */}
        <div className="bg-neutral-100 border-b border-neutral-200 px-5 py-2.5 flex items-center justify-between gap-3 text-xs flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-neutral-600 font-medium">Audit Status:</span>
            {doc.verified ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Marked as Verified Correct
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-300">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                Pending Evaluator Verification
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => onToggleVerify(doc.id)}
            className={`px-3.5 py-1.5 rounded-lg font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs ${
              doc.verified
                ? 'bg-amber-600 text-white hover:bg-amber-700'
                : 'bg-emerald-700 text-white hover:bg-emerald-800'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{doc.verified ? 'Revoke Verification' : 'Mark Requirement as Verified'}</span>
          </button>
        </div>

        {/* Document Inspection Canvas Viewport */}
        <div className="flex-1 overflow-auto bg-neutral-200 p-4 sm:p-8 flex items-center justify-center min-h-[380px]">
          <div
            style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
            className="transition-transform duration-100 bg-white shadow-2xl rounded-lg border border-neutral-300 max-w-2xl w-full p-8 text-neutral-800 relative font-sans select-none"
          >
            {/* Watermark Dry Seal */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.06] select-none">
              <EaristLogo size={320} showText={false} />
            </div>

            {/* DOCUMENT TYPE A: CERTIFICATE OF REGISTRATION (COR) */}
            {doc.name.toLowerCase().includes('registration') || doc.name.toLowerCase().includes('cor') ? (
              <div className="space-y-4 text-xs">
                {/* Official Letterhead */}
                <div className="text-center pb-3 border-b-2 border-[#800000] relative">
                  <div className="flex items-center justify-center gap-3 mb-1">
                    <EaristLogo size={42} showText={false} />
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-widest text-neutral-600">
                        Republic of the Philippines
                      </p>
                      <h4 className="text-xs font-black text-[#800000] uppercase tracking-wide">
                        Eulogio &apos;Amang&apos; Rodriguez Institute of Science and Technology
                      </h4>
                      <p className="text-[9px] text-neutral-500">
                        Nagtahan, Sampaloc, Manila • Office of the College Registrar
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 inline-block bg-neutral-900 text-white font-mono text-[10px] font-bold px-3 py-0.5 rounded">
                    CERTIFICATE OF REGISTRATION (COR) — 1ST SEMESTER A.Y. 2026–2027
                  </div>
                </div>

                {/* Student Info Grid */}
                <div className="grid grid-cols-2 gap-2 text-[11px] bg-neutral-50 p-3 rounded border border-neutral-200">
                  <div>
                    <span className="text-neutral-500">Student No:</span>{' '}
                    <strong className="font-mono text-neutral-900">{applicant.studentId}</strong>
                  </div>
                  <div>
                    <span className="text-neutral-500">Student Name:</span>{' '}
                    <strong className="text-neutral-900">{applicant.studentName}</strong>
                  </div>
                  <div>
                    <span className="text-neutral-500">College:</span>{' '}
                    <strong className="text-neutral-900">{applicant.collegeName} ({applicant.college})</strong>
                  </div>
                  <div>
                    <span className="text-neutral-500">Course &amp; Section:</span>{' '}
                    <strong className="text-neutral-900">{applicant.course} ({applicant.yearAndSection})</strong>
                  </div>
                </div>

                {/* Enrolled Courses Table */}
                <div className="border border-neutral-200 rounded overflow-hidden">
                  <table className="w-full text-[10px] text-left">
                    <thead className="bg-[#800000]/10 text-neutral-800 font-bold uppercase border-b border-neutral-200">
                      <tr>
                        <th className="p-1.5">Subject Code</th>
                        <th className="p-1.5">Descriptive Title</th>
                        <th className="p-1.5 text-center">Units</th>
                        <th className="p-1.5 text-center">Schedule</th>
                        <th className="p-1.5 text-center">Room</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 font-mono text-[10px]">
                      <tr>
                        <td className="p-1.5 font-bold">IT-411</td>
                        <td className="p-1.5 font-sans">Advanced Systems Architecture &amp; Cloud</td>
                        <td className="p-1.5 text-center">3.0</td>
                        <td className="p-1.5 text-center">MW 08:00 - 09:30</td>
                        <td className="p-1.5 text-center">IT-LAB 3</td>
                      </tr>
                      <tr>
                        <td className="p-1.5 font-bold">IT-412</td>
                        <td className="p-1.5 font-sans">Capstone Project &amp; Research Defense 2</td>
                        <td className="p-1.5 text-center">3.0</td>
                        <td className="p-1.5 text-center">TTH 10:00 - 11:30</td>
                        <td className="p-1.5 text-center">ROOM 408</td>
                      </tr>
                      <tr>
                        <td className="p-1.5 font-bold">IT-413</td>
                        <td className="p-1.5 font-sans">Information Assurance &amp; Cybersecurity</td>
                        <td className="p-1.5 text-center">3.0</td>
                        <td className="p-1.5 text-center">SAT 09:00 - 12:00</td>
                        <td className="p-1.5 text-center">IT-LAB 1</td>
                      </tr>
                      <tr>
                        <td className="p-1.5 font-bold">GE-ELE1</td>
                        <td className="p-1.5 font-sans">Data Privacy &amp; Ethical Technology Laws</td>
                        <td className="p-1.5 text-center">3.0</td>
                        <td className="p-1.5 text-center">MW 13:00 - 14:30</td>
                        <td className="p-1.5 text-center">MAIN 302</td>
                      </tr>
                    </tbody>
                    <tfoot className="bg-neutral-50 font-bold border-t border-neutral-200">
                      <tr>
                        <td colSpan={2} className="p-1.5 text-right uppercase">Total Enrolled Units:</td>
                        <td className="p-1.5 text-center text-[#800000]">12.0 Academic Units</td>
                        <td colSpan={2} className="p-1.5 text-center text-emerald-700">Official Enrolled</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Validation Stamp & Signatures */}
                <div className="pt-3 border-t border-neutral-200 flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-16 rounded-full border-2 border-dashed border-emerald-600 flex flex-col items-center justify-center text-center p-1 font-bold text-emerald-800 rotate-[-8deg]">
                      <Stamp className="w-4 h-4 text-emerald-600" />
                      <span className="text-[8px] uppercase">REGISTERED</span>
                      <span className="text-[7px]">EARIST MANILA</span>
                    </div>
                    <div className="text-neutral-500">
                      <p className="font-semibold text-neutral-800">Registrar Dry Seal Authenticated</p>
                      <p>Date Verified: Nov 04, 2026</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-neutral-900 underline">Dr. Rolando E. Villaseñor</p>
                    <p className="text-neutral-500">College Registrar Director</p>
                  </div>
                </div>
              </div>
            ) : null}

            {/* DOCUMENT TYPE B: GRADE SLIP / TRANSCRIPT */}
            {doc.name.toLowerCase().includes('grade') || doc.name.toLowerCase().includes('transcript') ? (
              <div className="space-y-4 text-xs">
                <div className="text-center pb-3 border-b-2 border-emerald-700">
                  <p className="text-[10px] uppercase font-bold text-neutral-600">
                    Eulogio &apos;Amang&apos; Rodriguez Institute of Science and Technology
                  </p>
                  <h4 className="text-xs font-black text-emerald-900 uppercase">
                    CERTIFIED TRUE COPY OF ACADEMIC GRADES
                  </h4>
                  <p className="text-[9px] text-neutral-500">Academic Year 2025–2026 • 2nd Semester Records</p>
                </div>

                <div className="bg-emerald-50/50 p-3 rounded border border-emerald-200 flex justify-between text-[11px]">
                  <div>
                    <span className="text-neutral-500">Student:</span>{' '}
                    <strong>{applicant.studentName}</strong> ({applicant.studentId})
                  </div>
                  <div className="text-right">
                    <span className="text-neutral-500">General Weighted Average (GWA):</span>{' '}
                    <strong className="text-emerald-800 font-mono text-sm font-black">
                      {applicant.gwa.toFixed(2)}
                    </strong>
                  </div>
                </div>

                <div className="border border-neutral-200 rounded overflow-hidden">
                  <table className="w-full text-[10px] text-left">
                    <thead className="bg-neutral-100 font-bold uppercase border-b">
                      <tr>
                        <th className="p-1.5">Course Code</th>
                        <th className="p-1.5">Subject Description</th>
                        <th className="p-1.5 text-center">Grade</th>
                        <th className="p-1.5 text-center">Units</th>
                        <th className="p-1.5 text-center">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 font-mono text-[10px]">
                      <tr>
                        <td className="p-1.5 font-bold">CS-321</td>
                        <td className="p-1.5 font-sans">Distributed Computing &amp; Microservices</td>
                        <td className="p-1.5 text-center font-bold text-emerald-700">1.25</td>
                        <td className="p-1.5 text-center">3.0</td>
                        <td className="p-1.5 text-center text-emerald-600">Passed</td>
                      </tr>
                      <tr>
                        <td className="p-1.5 font-bold">CS-322</td>
                        <td className="p-1.5 font-sans">Software Quality Engineering (ISO 25010)</td>
                        <td className="p-1.5 text-center font-bold text-emerald-700">1.25</td>
                        <td className="p-1.5 text-center">3.0</td>
                        <td className="p-1.5 text-center text-emerald-600">Passed</td>
                      </tr>
                      <tr>
                        <td className="p-1.5 font-bold">CS-323</td>
                        <td className="p-1.5 font-sans">Artificial Intelligence &amp; Data Science</td>
                        <td className="p-1.5 text-center font-bold text-emerald-700">1.50</td>
                        <td className="p-1.5 text-center">3.0</td>
                        <td className="p-1.5 text-center text-emerald-600">Passed</td>
                      </tr>
                      <tr>
                        <td className="p-1.5 font-bold">CS-324</td>
                        <td className="p-1.5 font-sans">Information Security &amp; Cryptography</td>
                        <td className="p-1.5 text-center font-bold text-emerald-700">1.25</td>
                        <td className="p-1.5 text-center">3.0</td>
                        <td className="p-1.5 text-center text-emerald-600">Passed</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="pt-2 flex justify-between text-[10px] text-neutral-600">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Certified Dean&apos;s Honors List Record</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold underline text-neutral-800">Prof. Rodrigo S. Ramos, Ph.D.</p>
                    <p className="text-[9px]">College Dean &amp; Academic Auditor</p>
                  </div>
                </div>
              </div>
            ) : null}

            {/* DOCUMENT TYPE C: BARANGAY INDIGENCY */}
            {doc.name.toLowerCase().includes('indigency') ? (
              <div className="space-y-4 text-xs">
                <div className="text-center pb-3 border-b-2 border-amber-600">
                  <p className="text-[10px] uppercase font-bold text-neutral-600">Republic of the Philippines</p>
                  <p className="text-[10px] font-bold text-neutral-700">City of Manila • District IV • Barangay 401</p>
                  <h4 className="text-xs font-black text-amber-900 uppercase mt-1">
                    BARANGAY CERTIFICATE OF INDIGENCY
                  </h4>
                  <p className="text-[9px] text-neutral-500">Issued for CHED UniFAST SFAO Scholarship Application</p>
                </div>

                <div className="space-y-2 text-[11px] leading-relaxed text-neutral-700 p-3 bg-amber-50/40 rounded border border-amber-200">
                  <p>
                    <strong>TO WHOM IT MAY CONCERN:</strong>
                  </p>
                  <p>
                    This is to certify that <strong>{applicant.studentName}</strong>, bonafide resident of
                    this Barangay, belongs to an indigent family whose declared monthly household income does not
                    exceed <strong>{formatPHP(applicant.monthlyHouseholdIncome)}</strong>.
                  </p>
                  <p>
                    This certification is issued upon the request of the interested party for the purpose of
                    availing of the <strong>{applicant.program}</strong> at EARIST Manila.
                  </p>
                </div>

                <div className="pt-3 flex justify-between items-center text-[10px]">
                  <div>
                    <p className="text-neutral-500">Issued at Manila, Philippines</p>
                    <p className="font-mono text-neutral-700">Official Control No: BRGY-2026-IND-0882</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-neutral-900 underline">Hon. Renato M. Bautista</p>
                    <p className="text-neutral-500">Punong Barangay</p>
                  </div>
                </div>
              </div>
            ) : null}

            {/* DOCUMENT TYPE D: VALID ID / STUDENT PHOTO */}
            {doc.name.toLowerCase().includes('id') || doc.name.toLowerCase().includes('photo') || doc.name.toLowerCase().includes('moral') ? (
              <div className="space-y-4 text-xs">
                <div className="text-center pb-2 border-b border-neutral-200">
                  <h4 className="text-xs font-black text-[#800000] uppercase">
                    EARIST OFFICIAL STUDENT IDENTIFICATION CARD
                  </h4>
                  <p className="text-[9px] text-neutral-500">Verified Institutional Smart ID Card (Front &amp; Back)</p>
                </div>

                <div className="bg-gradient-to-r from-red-900 to-[#800000] text-white p-4 rounded-xl shadow-md flex items-center gap-4">
                  {/* Photo Silhouette Placeholder */}
                  <div className="w-20 h-24 bg-white/20 rounded border-2 border-amber-300 flex flex-col items-center justify-center flex-shrink-0 text-amber-200">
                    <GraduationCap className="w-8 h-8" />
                    <span className="text-[8px] font-bold mt-1">PHOTO</span>
                  </div>

                  <div className="space-y-1 min-w-0">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-amber-300">
                      Eulogio &apos;Amang&apos; Rodriguez Institute of Technology
                    </span>
                    <h3 className="text-sm font-black text-white truncate">{applicant.studentName}</h3>
                    <p className="font-mono text-xs text-amber-200 font-bold">{applicant.studentId}</p>
                    <p className="text-[10px] text-white/90 truncate">{applicant.course}</p>
                    <div className="pt-1 flex items-center gap-2">
                      <span className="text-[9px] bg-emerald-500/30 text-emerald-200 border border-emerald-400 px-1.5 py-0.5 rounded font-bold">
                        A.Y. 2026–2027 VALIDATED
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 bg-neutral-50 rounded border border-neutral-200 flex justify-between items-center text-[10px]">
                  <span className="font-mono text-neutral-500">BARCODE: *{applicant.studentId.replace(/-/g, '')}*</span>
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Security Hologram Intact
                  </span>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-neutral-100 border-t border-neutral-200 p-3.5 flex justify-end flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-50 transition-colors"
          >
            Close Document Preview
          </button>
        </div>
      </div>
    </div>
  );
};

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
  const [quotaWarningAlert, setQuotaWarningAlert] = useState<string | null>(null);

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

    if (inspectingDoc && inspectingDoc.id === docId) {
      setInspectingDoc({ ...inspectingDoc, verified: !inspectingDoc.verified });
    }
  };

  // DECISION ACTION 1: [ Endorse to SFAO ] (College Evaluators & Admin)
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
  };

  // DECISION ACTION 2: [ Approve for Awarding ] (Strictly Super Admin + Quota Check)
  const handleApproveForAwarding = () => {
    // Check privilege
    if (currentUser.role !== 'superadmin') {
      alert(
        'Privilege Restricted: [ Approve for Awarding ] is reserved for Super Administrator (SFAO Director). College Evaluators must use [ Endorse to SFAO ].'
      );
      return;
    }

    // Check quota capacity
    const check = checkQuotaAvailability(
      currentApp.program,
      allApplications,
      currentApp.status === 'Approved'
    );

    if (!check.allowed) {
      setQuotaWarningAlert(check.reason || 'Quota Reached: Grant slots fully allocated for this term.');
      return;
    }

    setQuotaWarningAlert(null);

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
  };

  // DECISION ACTION 3: [ Flag Requirements ] (Sends advisory to student tracker)
  const handleFlagRequirementsSubmit = () => {
    if (!activeFlagReason.trim()) {
      alert('Please specify the exact requirement deficiency remarks for the student to resolve.');
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
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-neutral-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
          {/* 1. Header: Student Dossier Profile */}
          <div className="bg-[#800000] text-white p-5 sm:p-6 flex-shrink-0 relative">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono font-bold text-amber-300 bg-black/30 px-2.5 py-0.5 rounded border border-amber-400/30">
                    {currentApp.id}
                  </span>
                  <span className="text-xs bg-white/20 text-white px-2.5 py-0.5 rounded font-bold">
                    {currentApp.collegeName} ({currentApp.college})
                  </span>
                  <span className="text-xs bg-amber-400 text-neutral-950 font-black px-2.5 py-0.5 rounded">
                    GWA: {currentApp.gwa.toFixed(2)}
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-white truncate">
                  {currentApp.studentName}
                </h2>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-200">
                  <span>Student ID: <strong className="text-white font-mono">{currentApp.studentId}</strong></span>
                  <span>•</span>
                  <span>{currentApp.course}</span>
                  <span>•</span>
                  <span>Section: <strong className="text-white">{currentApp.yearAndSection}</strong></span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0"
                aria-label="Close modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Quick Metrics Ribbon in Header */}
            <div className="mt-4 pt-3 border-t border-white/20 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-white/70 uppercase font-semibold">Scholarship Grant:</span>
                <p className="font-bold text-amber-300 truncate">{currentApp.program}</p>
              </div>
              <div>
                <span className="text-[10px] text-white/70 uppercase font-semibold">Grant Value:</span>
                <p className="font-bold text-white">{formatPHP(currentApp.stipendAmount)} / Sem</p>
              </div>
              <div>
                <span className="text-[10px] text-white/70 uppercase font-semibold">Annual Family Income:</span>
                <p className="font-bold text-white">
                  {formatPHP(annualIncome)} <span className="text-[10px] text-white/70">({formatPHP(currentApp.monthlyHouseholdIncome)}/mo)</span>
                </p>
              </div>
              <div>
                <span className="text-[10px] text-white/70 uppercase font-semibold">Current State:</span>
                <div className="mt-0.5">
                  {currentApp.status === 'Approved' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-black text-[10px] bg-emerald-500 text-white">
                      <CheckCircle2 className="w-3 h-3" /> Approved
                    </span>
                  )}
                  {currentApp.status === 'Endorsed' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-black text-[10px] bg-cyan-400 text-cyan-950">
                      <CheckCircle2 className="w-3 h-3" /> Endorsed to SFAO
                    </span>
                  )}
                  {currentApp.status === 'Pending Review' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-black text-[10px] bg-amber-400 text-neutral-950">
                      <Clock className="w-3 h-3" /> Pending Review
                    </span>
                  )}
                  {currentApp.status === 'Flagged' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-black text-[10px] bg-red-400 text-neutral-950">
                      <AlertCircle className="w-3 h-3" /> Flagged Deficiency
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quota Saturated Warning Banner (if triggered) */}
          {quotaWarningAlert && (
            <div className="bg-red-50 border-b border-red-200 px-5 py-3 flex items-center justify-between text-xs text-red-900 animate-in slide-in-from-top-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <span className="font-bold">{quotaWarningAlert}</span>
              </div>
              <button
                type="button"
                onClick={() => setQuotaWarningAlert(null)}
                className="text-red-700 hover:text-red-950 font-bold text-xs"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Modal Body Container */}
          <div className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1">
            {/* 2. Document Verification Section */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 pb-2">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-[#800000]" />
                  <h3 className="font-bold text-neutral-900 text-xs uppercase tracking-wider">
                    Mandatory Document Verification (4 Files Required)
                  </h3>
                </div>
                <span className="text-[11px] text-neutral-500">
                  {currentApp.attachedDocuments.filter((d) => d.verified).length} of {currentApp.attachedDocuments.length} Verified Correct
                </span>
              </div>

              {/* Document Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {currentApp.attachedDocuments.map((doc) => {
                  const mime = doc.mimeType || (doc.name.endsWith('.pdf') ? 'application/pdf' : 'image/png');
                  return (
                    <div
                      key={doc.id}
                      className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-3 ${
                        doc.verified
                          ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                          : 'bg-neutral-50 border-neutral-200 text-neutral-900 hover:border-neutral-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div
                            onClick={() => handleToggleDocVerification(doc.id)}
                            className={`w-5 h-5 rounded flex items-center justify-center border mt-0.5 transition-colors cursor-pointer flex-shrink-0 ${
                              doc.verified
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'border-neutral-400 bg-white hover:border-neutral-600'
                            }`}
                            title="Click to toggle verified state"
                          >
                            {doc.verified && <CheckCircle2 className="w-3.5 h-3.5" />}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-xs truncate">{doc.name}</span>
                              {doc.required && (
                                <span className="text-[9px] bg-red-100 text-red-800 px-1 py-0.2 rounded font-black uppercase">
                                  Required
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-neutral-500 mt-0.5 flex items-center gap-2 font-mono">
                              <span className="uppercase text-neutral-600 font-semibold">{mime.replace('application/', '').replace('image/', '')}</span>
                              <span>•</span>
                              <span>{doc.fileSize} (&lt; 2MB)</span>
                            </div>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap flex-shrink-0 ${
                            doc.verified
                              ? 'bg-emerald-200 text-emerald-900 font-black'
                              : 'bg-amber-100 text-amber-900 font-semibold'
                          }`}
                        >
                          {doc.verified ? 'Verified Correct' : 'Needs Verification'}
                        </span>
                      </div>

                      {/* Card Action: [ View / Inspect Document ] & Toggle Checkbox */}
                      <div className="pt-2 border-t border-neutral-200/60 flex items-center justify-between gap-2">
                        <label className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-700 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={doc.verified}
                            onChange={() => handleToggleDocVerification(doc.id)}
                            className="rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500"
                          />
                          <span>Mark Requirement as Verified</span>
                        </label>

                        <button
                          type="button"
                          onClick={() => setInspectingDoc(doc)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold text-[#800000] bg-white border border-[#800000]/30 hover:bg-red-50 transition-colors shadow-2xs"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>[ View / Inspect Document ]</span>
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
                <h4 className="font-bold text-neutral-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-[#800000]" />
                  <span>Evaluator Audit Notes &amp; Deliberation Remarks</span>
                </h4>
                <button
                  type="button"
                  onClick={handleSaveNotesOnly}
                  className="text-xs font-bold text-[#800000] hover:underline"
                >
                  Save Notes
                </button>
              </div>

              <textarea
                rows={2}
                value={activeNotes}
                onChange={(e) => setActiveNotes(e.target.value)}
                placeholder="Enter official evaluation remarks, Registrar coordination findings, or notes for the SFAO committee..."
                className="w-full text-xs p-3 bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800000] font-sans"
              />

              {/* Deficiency Flagging Section (Expandable or Active) */}
              {(isFlagBoxOpen || currentApp.status === 'Flagged') && (
                <div className="p-3.5 rounded-lg bg-red-50 border border-red-300 space-y-2 animate-in fade-in">
                  <label className="text-[11px] font-bold text-red-900 flex items-center gap-1.5">
                    <Flag className="w-4 h-4 text-red-600" />
                    <span>Flag Deficiency Reason (Will send immediate advisory notice to Student Tracker):</span>
                  </label>

                  {/* Preset Buttons for Common Registrar Deficiencies */}
                  <div className="flex flex-wrap gap-1.5 text-[10px]">
                    <span className="text-neutral-500 font-semibold self-center">Presets:</span>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveFlagReason('Incomplete COR: Missing College Registrar Dry Seal Stamp.')
                      }
                      className="px-2 py-0.5 rounded bg-white border border-red-200 text-red-800 hover:bg-red-100 font-medium"
                    >
                      Missing Registrar Seal
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveFlagReason('Unreadable Grade Slip: General Weighted Average (GWA) not certified.')
                      }
                      className="px-2 py-0.5 rounded bg-white border border-red-200 text-red-800 hover:bg-red-100 font-medium"
                    >
                      Uncertified GWA
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveFlagReason('Expired Indigency Certificate: Must be issued within calendar year 2026.')
                      }
                      className="px-2 py-0.5 rounded bg-white border border-red-200 text-red-800 hover:bg-red-100 font-medium"
                    >
                      Expired Indigency
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveFlagReason('Invalid ID: Missing current 1st Semester A.Y. 2026–2027 validation sticker.')
                      }
                      className="px-2 py-0.5 rounded bg-white border border-red-200 text-red-800 hover:bg-red-100 font-medium"
                    >
                      Unvalidated Student ID
                    </button>
                  </div>

                  <input
                    type="text"
                    value={activeFlagReason}
                    onChange={(e) => setActiveFlagReason(e.target.value)}
                    placeholder="e.g. Incomplete COR: Missing College Registrar Stamp..."
                    className="w-full text-xs px-3 py-2 bg-white border border-red-400 rounded-md focus:outline-none focus:ring-2 focus:ring-red-600 font-medium text-red-950"
                  />

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleFlagRequirementsSubmit}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-2xs transition-colors"
                    >
                      <Flag className="w-3.5 h-3.5" />
                      <span>Confirm &amp; Send Advisory Notice to Student Tracker</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 4. Automated Audit Log & Compliance Ledger (RA 10173 Compliance) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-[#800000]" />
                  <h4 className="font-bold text-neutral-900 text-xs uppercase tracking-wider">
                    Automated Evaluation Audit Ledger (RA 10173 Data Privacy Compliance)
                  </h4>
                </div>
                <span className="text-[10px] text-neutral-500 font-mono">
                  Immutable Audit Records: {(currentApp.auditTrail || []).length}
                </span>
              </div>

              <div className="border border-neutral-200 rounded-xl overflow-hidden bg-white max-h-48 overflow-y-auto divide-y divide-neutral-100 text-xs">
                {(currentApp.auditTrail && currentApp.auditTrail.length > 0) ? (
                  currentApp.auditTrail.map((log) => (
                    <div key={log.id} className="p-3 hover:bg-neutral-50 flex items-start justify-between gap-3">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-neutral-900">{log.evaluatorName}</span>
                          <span className="text-[10px] bg-neutral-100 text-neutral-700 px-1.5 py-0.2 rounded font-semibold border border-neutral-200">
                            {log.role}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#800000] font-bold">{log.action}</p>
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

          {/* 5. Evaluator Action Decision Bar (Sticky Modal Footer) */}
          <div className="p-4 bg-neutral-100 border-t border-neutral-200 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
            {/* Active Evaluator Badge */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-neutral-500">Evaluator:</span>
              <span className="font-bold text-neutral-800 bg-white px-2.5 py-1 rounded border border-neutral-300">
                {currentUser.name} ({currentUser.title})
              </span>
            </div>

            {/* Decision Buttons Trio */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Button 1: [ Endorse to SFAO ] (College Evaluators) */}
              <button
                type="button"
                onClick={handleEndorseToSFAO}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-cyan-700 hover:bg-cyan-800 text-white shadow-2xs transition-colors cursor-pointer"
                title="Endorse candidate to SFAO central committee for awarding"
              >
                <Send className="w-3.5 h-3.5" />
                <span>[ Endorse to SFAO ]</span>
              </button>

              {/* Button 2: [ Approve for Awarding ] (SFAO Admin + Quota Check) */}
              <div className="relative group">
                <button
                  type="button"
                  onClick={handleApproveForAwarding}
                  disabled={quotaInfo.isFull}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all shadow-2xs ${
                    quotaInfo.isFull
                      ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                      : currentUser.role === 'superadmin'
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                      : 'bg-emerald-700/80 hover:bg-emerald-700 text-white cursor-pointer'
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
                  <span>[ Approve for Awarding ]</span>
                  <span className="text-[10px] bg-black/25 px-1.5 py-0.2 rounded font-mono ml-0.5">
                    {quotaInfo.totalFilled}/{quotaInfo.maxSlots}
                  </span>
                </button>
              </div>

              {/* Button 3: [ Flag Requirements ] */}
              <button
                type="button"
                onClick={() => setIsFlagBoxOpen(!isFlagBoxOpen)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                  isFlagBoxOpen
                    ? 'bg-red-600 text-white border-red-700'
                    : 'bg-white text-red-700 border-red-300 hover:bg-red-50'
                }`}
                title="Flag deficient documents and notify student"
              >
                <Flag className="w-3.5 h-3.5" />
                <span>[ Flag Requirements ]</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-50 transition-colors ml-2"
              >
                Done &amp; Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Embedded Document Inspect Lightbox */}
      {inspectingDoc && (
        <DocumentInspectModal
          doc={inspectingDoc}
          applicant={currentApp}
          onClose={() => setInspectingDoc(null)}
          onToggleVerify={handleToggleDocVerification}
        />
      )}
    </>
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
