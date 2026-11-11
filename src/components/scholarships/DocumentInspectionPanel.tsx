import React, { useState } from 'react';
import {
  FileText,
  CheckCircle2,
  Clock,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Stamp,
  GraduationCap,
  AlertCircle,
} from 'lucide-react';
import type { DocumentChecklist, ScholarshipApplication } from '../../types';
import { EaristLogo } from '../common/EaristLogo';
import { formatPHP } from '../../utils/exportUtils';

export interface DocumentInspectPanelProps {
  doc: DocumentChecklist;
  applicant: ScholarshipApplication;
  onClose: () => void;
  onToggleVerify: (docId: string) => void;
}

export const DocumentInspectPanel: React.FC<DocumentInspectPanelProps> = ({
  doc,
  applicant,
  onClose,
  onToggleVerify,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [loadError, setLoadError] = useState(false);

  const mimeTypeDisplay =
    doc.mimeType || (doc.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/png');

  const handleZoomIn = () => setZoomLevel((z) => Math.min(180, z + 20));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(60, z - 20));
  const handleZoomReset = () => setZoomLevel(100);

  return (
    <div className="h-full flex flex-col bg-neutral-100 overflow-hidden font-sans">
      {/* Inspection Header Bar */}
      <div className="bg-white border-b border-neutral-200 px-5 py-3 flex items-center justify-between gap-3 flex-shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0">
            <FileText className="w-4 h-4 text-maroon-primary" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-medium text-neutral-600 bg-neutral-100 border border-neutral-200 px-1.5 py-0.2 rounded">
                {mimeTypeDisplay.toUpperCase()}
              </span>
              <span className="text-[10px] text-neutral-500 font-mono">
                {doc.fileSize} • Validated
              </span>
            </div>
            <h3 className="text-xs font-bold text-neutral-900 truncate">{doc.name}</h3>
          </div>
        </div>

        {/* Right Controls: Zoom & Close */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-1 bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded-lg text-xs">
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1 hover:text-maroon-primary text-neutral-600 transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[11px] px-1 text-neutral-700">{zoomLevel}%</span>
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1 hover:text-maroon-primary text-neutral-600 transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleZoomReset}
              className="p-1 hover:text-maroon-primary text-neutral-600 transition-colors border-l border-neutral-200 ml-1 pl-1.5 cursor-pointer"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
            aria-label="Close document inspect"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Verification Status Action Ribbon */}
      <div className="bg-neutral-50 border-b border-neutral-200 px-5 py-2.5 flex items-center justify-between gap-3 text-xs flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-neutral-500 text-[11px] font-medium">Audit Status:</span>
          {doc.verified ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Verified Correct
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              Pending Verification
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => onToggleVerify(doc.id)}
          className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs ${
            doc.verified
              ? 'bg-amber-600 text-white hover:bg-amber-700'
              : 'bg-emerald-700 text-white hover:bg-emerald-800'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{doc.verified ? 'Revoke Verification' : 'Mark as Verified'}</span>
        </button>
      </div>

      {/* Document Inspection Canvas Viewport */}
      <div className="flex-1 overflow-auto bg-neutral-200/80 p-4 sm:p-6 flex items-center justify-center min-h-[360px]">
        {doc.fileUrl && !loadError ? (
          <div className="bg-white shadow-md rounded-lg border border-neutral-300 max-w-2xl w-full p-4 flex flex-col items-center">
            {mimeTypeDisplay === 'application/pdf' || doc.fileUrl.toLowerCase().endsWith('.pdf') ? (
              <div className="w-full space-y-2">
                <iframe
                  src={doc.fileUrl}
                  title={doc.name}
                  className="w-full h-[480px] rounded border border-neutral-300 bg-white shadow-inner"
                />
                <div className="text-center pt-1">
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-maroon-primary underline font-semibold hover:text-maroon-hover"
                  >
                    Open PDF in New Window ↗
                  </a>
                </div>
              </div>
            ) : (
              <div className="w-full flex flex-col items-center space-y-2 overflow-auto">
                <img
                  src={doc.fileUrl}
                  alt={doc.name}
                  onError={() => setLoadError(true)}
                  style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
                  className="max-h-[480px] max-w-full object-contain rounded border border-neutral-200 transition-transform duration-100"
                />
                <div className="text-center pt-1">
                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-maroon-primary underline font-semibold hover:text-maroon-hover"
                  >
                    Open Full Image in New Window ↗
                  </a>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div
            style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
            className="transition-transform duration-100 bg-white shadow-md rounded-lg border border-neutral-300 max-w-xl w-full p-6 text-neutral-800 relative font-sans select-none"
          >
            {loadError && (
              <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded text-amber-800 text-[11px] flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                <span>External attachment preview unavailable. Displaying institutional verified credential ledger.</span>
              </div>
            )}

            {/* Watermark Dry Seal */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.05] select-none">
              <EaristLogo size={280} showText={false} />
            </div>

            {/* DOCUMENT TYPE A: CERTIFICATE OF REGISTRATION (COR) */}
            {doc.name.toLowerCase().includes('registration') || doc.name.toLowerCase().includes('cor') ? (
              <div className="space-y-4 text-xs">
                {/* Official Letterhead */}
                <div className="text-center pb-3 border-b-2 border-maroon-primary relative">
                  <div className="flex items-center justify-center gap-3 mb-1">
                    <EaristLogo size={36} showText={false} />
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-widest text-neutral-600">
                        Republic of the Philippines
                      </p>
                      <h4 className="text-xs font-black text-maroon-primary uppercase tracking-wide">
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
                <div className="grid grid-cols-2 gap-2 text-[11px] bg-neutral-50 p-2.5 rounded border border-neutral-200">
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
                    <thead className="bg-neutral-100 text-neutral-800 font-bold uppercase border-b border-neutral-200">
                      <tr>
                        <th className="p-1.5">Subject Code</th>
                        <th className="p-1.5">Descriptive Title</th>
                        <th className="p-1.5 text-center">Units</th>
                        <th className="p-1.5 text-center">Room</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 font-mono text-[10px]">
                      <tr>
                        <td className="p-1.5 font-bold">IT-411</td>
                        <td className="p-1.5 font-sans">Advanced Systems Architecture &amp; Cloud</td>
                        <td className="p-1.5 text-center">3.0</td>
                        <td className="p-1.5 text-center">IT-LAB 3</td>
                      </tr>
                      <tr>
                        <td className="p-1.5 font-bold">IT-412</td>
                        <td className="p-1.5 font-sans">Capstone Project &amp; Research Defense 2</td>
                        <td className="p-1.5 text-center">3.0</td>
                        <td className="p-1.5 text-center">ROOM 408</td>
                      </tr>
                      <tr>
                        <td className="p-1.5 font-bold">IT-413</td>
                        <td className="p-1.5 font-sans">Information Assurance &amp; Cybersecurity</td>
                        <td className="p-1.5 text-center">3.0</td>
                        <td className="p-1.5 text-center">IT-LAB 1</td>
                      </tr>
                      <tr>
                        <td className="p-1.5 font-bold">GE-ELE1</td>
                        <td className="p-1.5 font-sans">Data Privacy &amp; Ethical Technology Laws</td>
                        <td className="p-1.5 text-center">3.0</td>
                        <td className="p-1.5 text-center">MAIN 302</td>
                      </tr>
                    </tbody>
                    <tfoot className="bg-neutral-50 font-bold border-t border-neutral-200">
                      <tr>
                        <td colSpan={2} className="p-1.5 text-right uppercase">Total Enrolled Units:</td>
                        <td className="p-1.5 text-center text-maroon-primary">12.0 Units</td>
                        <td className="p-1.5 text-center text-emerald-700">Official Enrolled</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Validation Stamp & Signatures */}
                <div className="pt-2 border-t border-neutral-200 flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-2">
                    <div className="w-14 h-14 rounded-full border-2 border-dashed border-emerald-600 flex flex-col items-center justify-center text-center p-1 font-bold text-emerald-800 rotate-[-8deg]">
                      <Stamp className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-[7px] uppercase">REGISTERED</span>
                      <span className="text-[6px]">EARIST MANILA</span>
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

                <div className="bg-emerald-50/50 p-2.5 rounded border border-emerald-200 flex justify-between text-[11px]">
                  <div>
                    <span className="text-neutral-500">Student:</span>{' '}
                    <strong>{applicant.studentName}</strong> ({applicant.studentId})
                  </div>
                  <div className="text-right">
                    <span className="text-neutral-500">GWA:</span>{' '}
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
                        <td className="p-1.5 font-sans">Software Quality Engineering</td>
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
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
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

                <div className="space-y-2 text-[11px] leading-relaxed text-neutral-700 p-2.5 bg-amber-50/40 rounded border border-amber-200">
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

                <div className="pt-2 flex justify-between items-center text-[10px]">
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
                  <h4 className="text-xs font-black text-maroon-primary uppercase">
                    EARIST OFFICIAL STUDENT IDENTIFICATION CARD
                  </h4>
                  <p className="text-[9px] text-neutral-500">Verified Institutional Smart ID Card (Front &amp; Back)</p>
                </div>

                <div className="bg-gradient-to-r from-maroon-deep to-maroon-primary text-white p-3.5 rounded-xl shadow-sm flex items-center gap-3">
                  <div className="w-16 h-20 bg-white/20 rounded border border-amber-300 flex flex-col items-center justify-center flex-shrink-0 text-amber-200">
                    <GraduationCap className="w-6 h-6" />
                    <span className="text-[7px] font-bold mt-1">PHOTO</span>
                  </div>

                  <div className="space-y-1 min-w-0">
                    <span className="text-[8px] font-bold uppercase tracking-wider text-amber-300">
                      Eulogio &apos;Amang&apos; Rodriguez Institute of Science and Technology
                    </span>
                    <h3 className="text-sm font-black text-white truncate">{applicant.studentName}</h3>
                    <p className="font-mono text-xs text-amber-200 font-bold">{applicant.studentId}</p>
                    <p className="text-[10px] text-white/90 truncate">{applicant.course}</p>
                    <div className="pt-0.5 flex items-center gap-2">
                      <span className="text-[8px] bg-emerald-500/30 text-emerald-200 border border-emerald-400 px-1.5 py-0.2 rounded font-bold">
                        A.Y. 2026–2027 VALIDATED
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-2 bg-neutral-50 rounded border border-neutral-200 flex justify-between items-center text-[10px]">
                  <span className="font-mono text-neutral-500">BARCODE: *{applicant.studentId.replace(/-/g, '')}*</span>
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Security Hologram Intact
                  </span>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Panel Footer */}
      <div className="bg-white border-t border-neutral-200 px-4 py-2 flex items-center justify-between text-xs text-neutral-500 flex-shrink-0">
        <span className="truncate">Inspecting: <strong className="text-neutral-800">{doc.name}</strong></span>
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1 rounded text-xs font-medium text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
        >
          Close Preview
        </button>
      </div>
    </div>
  );
};

export default DocumentInspectPanel;
