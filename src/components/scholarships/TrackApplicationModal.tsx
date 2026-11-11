import React, { useState, useEffect } from 'react';
import type { ScholarshipApplication, ScholarshipStatus } from '../../types';
import { formatPHP } from '../../utils/exportUtils';
import { EaristLogo } from '../common/EaristLogo';
import { trackApplicationApi, resolveDeficiencyApi } from '../../utils/api';
import {
  X,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Printer,
  Upload,
  FileCheck,
  FileText,
  ShieldCheck,
  ShieldAlert,
  ArrowLeft,
  Award,
  Check,
  RotateCcw,
  Loader2,
} from 'lucide-react';

export interface TrackApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  applications: ScholarshipApplication[];
  onUpdateApplication?: (updated: ScholarshipApplication) => void;
  initialSearchQuery?: string;
}

export const TrackApplicationModal: React.FC<TrackApplicationModalProps> = ({
  isOpen,
  onClose,
  applications,
  onUpdateApplication,
  initialSearchQuery,
}) => {
  const [searchTerm, setSearchTerm] = useState(initialSearchQuery || '');
  const [searchedApp, setSearchedApp] = useState<ScholarshipApplication | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [showSlip, setShowSlip] = useState(false);

  // Re-upload deficiency state
  const [isReuploadOpen, setIsReuploadOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [reuploadFile, setReuploadFile] = useState<File | null>(null);
  const [reuploadError, setReuploadError] = useState<string | null>(null);
  const [reuploadSuccessMsg, setReuploadSuccessMsg] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmittingReupload, setIsSubmittingReupload] = useState(false);

  // Shared search implementation
  const performSearch = async (rawQuery: string) => {
    const query = rawQuery.trim();
    if (!query) return;

    setIsSearching(true);
    setReuploadSuccessMsg(null);
    setReuploadError(null);

    try {
      const liveApp = await trackApplicationApi(query);
      if (liveApp) {
        setSearchedApp(liveApp);
        setHasSearched(true);
        setShowSlip(false);
        setIsReuploadOpen(false);
        return;
      }
    } catch {
      // Remove whitespace and hyphens for flexible dual lookup fallback
      const normalizedQuery = query.toLowerCase().replace(/[\s-]/g, '');

      const match = applications.find((app) => {
        const sId = app.studentId.toLowerCase().replace(/[\s-]/g, '');
        const aId = app.id.toLowerCase().replace(/[\s-]/g, '');
        return (
          sId === normalizedQuery ||
          aId === normalizedQuery ||
          app.studentId.toLowerCase() === query.toLowerCase() ||
          app.id.toLowerCase() === query.toLowerCase()
        );
      });

      setSearchedApp(match || null);
      setHasSearched(true);
      setShowSlip(false);
      setIsReuploadOpen(false);
    } finally {
      setIsSearching(false);
    }
  };

  // Auto-search if initialSearchQuery provided
  useEffect(() => {
    if (isOpen && initialSearchQuery) {
      setSearchTerm(initialSearchQuery);
      performSearch(initialSearchQuery);
    }
  }, [isOpen, initialSearchQuery]);

  if (!isOpen) return null;

  // Search Handler
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await performSearch(searchTerm);
  };

  // Status Badge Mapper
  const renderStatusBadge = (status: ScholarshipStatus) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Approved / Inscribed in Masterlist
          </span>
        );
      case 'Endorsed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-300 shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
            Endorsed by College Evaluator
          </span>
        );
      case 'Pending Review':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Under Document Screening
          </span>
        );
      case 'Flagged':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-800 border border-red-300 shadow-2xs">
            <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
            Flagged / Deficient Requirements
          </span>
        );
      default:
        return null;
    }
  };

  // Calculate Stepper State
  const getStepProgress = (stepNumber: 1 | 2 | 3 | 4, app: ScholarshipApplication) => {
    const verifiedDocs = app.attachedDocuments.filter((d) => d.verified).length;
    const totalDocs = app.attachedDocuments.length;

    if (stepNumber === 1) {
      return {
        status: 'completed' as const,
        title: '1. Application Received',
        date: new Date(app.submissionDate).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        description: 'Application and digital dossier registered in EARIST SFAO central repository.',
      };
    }

    if (stepNumber === 2) {
      if (app.status === 'Flagged') {
        return {
          status: 'flagged' as const,
          title: '2. Document Verification',
          date: 'Deficiency Action Required',
          description: `Document audit flagged by screener. Please review the official advisory note below.`,
        };
      }
      if (app.status === 'Approved' || app.status === 'Endorsed' || verifiedDocs === totalDocs) {
        return {
          status: 'completed' as const,
          title: '2. Document Verification',
          date: `${verifiedDocs} of ${totalDocs} Documents Verified`,
          description: 'All mandatory credentials authenticated against Institute Registrar records.',
        };
      }
      return {
        status: 'in-progress' as const,
        title: '2. Document Verification',
        date: `${verifiedDocs} of ${totalDocs} Documents Audited`,
        description: 'Registrar screener currently validating submitted COR, Grades, and Indigency.',
      };
    }

    if (stepNumber === 3) {
      if (app.status === 'Approved' || app.status === 'Endorsed') {
        return {
          status: 'completed' as const,
          title: '3. College Committee Evaluation',
          date: `Endorsed by ${app.assignedEvaluator}`,
          description: `Academic qualifications (GWA: ${app.gwa.toFixed(2)}) and socioeconomic profile confirmed.`,
        };
      }
      if (app.status === 'Flagged') {
        return {
          status: 'flagged' as const,
          title: '3. College Committee Evaluation',
          date: 'Evaluation Paused',
          description: 'Deliberation on hold pending resolution of requirement deficiency.',
        };
      }
      return {
        status: 'in-progress' as const,
        title: '3. College Committee Evaluation',
        date: `Assigned Evaluator: ${app.assignedEvaluator}`,
        description: 'Committee actively deliberating slot quota allocation and socioeconomic ranking.',
      };
    }

    // Step 4
    if (app.status === 'Approved') {
      return {
        status: 'completed' as const,
        title: '4. SFAO Final Masterlist & Awarding',
        date: 'Inscribed in Masterlist',
        description: 'Certified for institutional disbursement and Cashier payroll release.',
      };
    }
    if (app.status === 'Endorsed') {
      return {
        status: 'completed' as const,
        title: '4. SFAO Final Masterlist & Awarding',
        date: 'Transmitted to CHED UniFAST',
        description: 'Endorsed to Commission on Higher Education UniFAST central portal for national disbursement.',
      };
    }
    if (app.status === 'Flagged') {
      return {
        status: 'pending' as const,
        title: '4. SFAO Final Masterlist & Awarding',
        date: 'Awarding On Hold',
        description: 'Grant allocation suspended pending requirement completion before deadline.',
      };
    }
    return {
      status: 'pending' as const,
      title: '4. SFAO Final Masterlist & Awarding',
      date: 'Pending Final Rollup',
      description: 'Awaiting college committee sign-off and SFAO Director certification.',
    };
  };

  // Handle File Selection for Re-Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReuploadError(null);
    if (!e.target.files || e.target.files.length === 0) {
      setReuploadFile(null);
      return;
    }

    const file = e.target.files[0];
    const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isPNG = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');

    if (!isPDF && !isPNG) {
      setReuploadError('Invalid file format. Only official PDF (.pdf) documents and PNG (.png) images are permitted.');
      setReuploadFile(null);
      e.target.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setReuploadError(`File exceeds the 2 MB server quota (${sizeMB} MB). Please compress or optimize the file.`);
      setReuploadFile(null);
      e.target.value = '';
      return;
    }

    setReuploadFile(file);
  };

  // Submit Re-Uploaded Document
  const handleConfirmReupload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchedApp || !reuploadFile) return;

    setIsSubmittingReupload(true);
    setReuploadError(null);

    const docTargetId = selectedDocId || searchedApp.attachedDocuments[0]?.id;
    const formattedSize =
      reuploadFile.size >= 1024 * 1024
        ? `${(reuploadFile.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(reuploadFile.size / 1024)} KB`;

    try {
      const formData = new FormData();
      formData.append('deficiencyFile', reuploadFile);
      formData.append('docType', docTargetId || 'cor');
      formData.append(
        'studentRemarks',
        `Replacement document submitted by applicant on ${new Date().toLocaleDateString()}`
      );

      const liveUpdated = await resolveDeficiencyApi(searchedApp.id, formData);
      setSearchedApp(liveUpdated);
      onUpdateApplication?.(liveUpdated);
      setIsReuploadOpen(false);
      setReuploadFile(null);
      setReuploadSuccessMsg(
        'Replacement document submitted successfully! Your application status has been returned to "Under Document Screening" for expedited evaluator review.'
      );
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.warn('API deficiency resolution failed, saving locally:', errorMsg);

      const updatedDocuments = searchedApp.attachedDocuments.map((doc) => {
        if (doc.id === docTargetId) {
          return {
            ...doc,
            verified: false,
            fileSize: formattedSize,
            uploadedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
          };
        }
        return doc;
      });

      const updatedApp: ScholarshipApplication = {
        ...searchedApp,
        status: 'Pending Review',
        attachedDocuments: updatedDocuments,
        evaluatorNotes: `Requirement replacement submitted by applicant on ${new Date().toLocaleDateString()}. Re-queued for SFAO evaluator screening.`,
        lastUpdated: new Date().toISOString(),
      };

      setSearchedApp(updatedApp);
      onUpdateApplication?.(updatedApp);
      setIsReuploadOpen(false);
      setReuploadFile(null);
      setReuploadSuccessMsg(
        'Replacement document submitted successfully! Your application status has been returned to "Under Document Screening" for expedited evaluator review.'
      );
    } finally {
      setIsSubmittingReupload(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-neutral-300 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* ================================================================= */}
        {/* 1. CLEAN INSTITUTIONAL HEADER (Pure White) */}
        {/* ================================================================= */}
        <div className="bg-white px-5 sm:px-6 py-4 border-b border-neutral-200 flex items-center justify-between relative">
          <div className="flex items-center gap-3.5">
            <EaristLogo size={46} showText={false} />
            <div>
              <div className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <span>Republic of the Philippines</span>
                <span>•</span>
                <span>Office of Student Financial Assistance (SFAO)</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-neutral-900 tracking-tight">
                Online Scholarship Tracking Portal
              </h2>
              <p className="text-xs text-neutral-500 font-medium hidden sm:block">
                Eulogio &quot;Amang&quot; Rodriguez Institute of Science and Technology
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close tracking portal"
            className="p-2 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          {/* Institutional red top accent line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-maroon-primary" />
        </div>

        {/* ================================================================= */}
        {/* PRINTABLE ACKNOWLEDGMENT SLIP VIEW (When showSlip === true)       */}
        {/* ================================================================= */}
        {showSlip && searchedApp ? (
          <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6 bg-neutral-50">
            {/* Top Action Bar */}
            <div className="flex items-center justify-between no-print pb-3 border-b border-neutral-200">
              <style>{`
                @media print {
                  body * {
                    visibility: hidden;
                  }
                  #printable-slip, #printable-slip * {
                    visibility: visible;
                  }
                  #printable-slip {
                    position: fixed;
                    left: 0;
                    top: 0;
                    width: 100vw;
                    margin: 0;
                    padding: 20px;
                    border: none;
                    box-shadow: none;
                  }
                }
              `}</style>
              <button
                type="button"
                onClick={() => setShowSlip(false)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-700 hover:text-neutral-900 px-3 py-1.5 rounded-lg border border-neutral-300 bg-white hover:bg-neutral-50"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Status View</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-maroon-primary hover:bg-maroon-hover text-white shadow-sm transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>Print Official Slip</span>
              </button>
            </div>

            {/* Printable Slip Container */}
            <div
              id="printable-slip"
              className="bg-white p-6 sm:p-8 rounded-xl border border-neutral-300 shadow-sm space-y-6 text-neutral-900"
            >
              {/* Slip Official Header */}
              <div className="text-center space-y-1 pb-4 border-b-2 border-neutral-800">
                <div className="flex justify-center mb-2">
                  <EaristLogo size={52} showText={false} />
                </div>
                <div className="text-[10px] uppercase tracking-widest font-bold text-neutral-600">
                  Republic of the Philippines
                </div>
                <h3 className="text-base font-black tracking-tight uppercase text-neutral-900">
                  Eulogio &quot;Amang&quot; Rodriguez Institute of Science and Technology
                </h3>
                <div className="text-xs text-neutral-600 font-semibold">
                  Nagtahan, Sampaloc, Manila • Office of Student Financial Assistance (SFAO)
                </div>
                <div className="pt-2 text-sm font-black text-maroon-primary uppercase tracking-wider">
                  Official Scholarship Award & Claim Acknowledgment Slip
                </div>
              </div>

              {/* Barcode & Reference Row */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                <div>
                  <div className="text-[10px] font-bold text-neutral-500 uppercase">
                    Control Reference ID:
                  </div>
                  <div className="text-sm font-mono font-black text-maroon-primary">
                    {searchedApp.id}
                  </div>
                  <div className="text-[10px] text-neutral-500">
                    Issued on: {new Date(searchedApp.lastUpdated || searchedApp.submissionDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>

                {/* Simulated Barcode */}
                <div className="text-center">
                  <svg className="h-10 w-48 mx-auto" viewBox="0 0 160 36">
                    <rect x="0" y="0" width="3" height="36" fill="#000" />
                    <rect x="5" y="0" width="2" height="36" fill="#000" />
                    <rect x="9" y="0" width="4" height="36" fill="#000" />
                    <rect x="15" y="0" width="2" height="36" fill="#000" />
                    <rect x="19" y="0" width="3" height="36" fill="#000" />
                    <rect x="24" y="0" width="1" height="36" fill="#000" />
                    <rect x="27" y="0" width="4" height="36" fill="#000" />
                    <rect x="33" y="0" width="2" height="36" fill="#000" />
                    <rect x="37" y="0" width="3" height="36" fill="#000" />
                    <rect x="42" y="0" width="1" height="36" fill="#000" />
                    <rect x="45" y="0" width="4" height="36" fill="#000" />
                    <rect x="51" y="0" width="2" height="36" fill="#000" />
                    <rect x="55" y="0" width="3" height="36" fill="#000" />
                    <rect x="60" y="0" width="2" height="36" fill="#000" />
                    <rect x="64" y="0" width="4" height="36" fill="#000" />
                    <rect x="70" y="0" width="1" height="36" fill="#000" />
                    <rect x="73" y="0" width="3" height="36" fill="#000" />
                    <rect x="78" y="0" width="2" height="36" fill="#000" />
                    <rect x="82" y="0" width="4" height="36" fill="#000" />
                    <rect x="88" y="0" width="2" height="36" fill="#000" />
                    <rect x="92" y="0" width="3" height="36" fill="#000" />
                    <rect x="97" y="0" width="1" height="36" fill="#000" />
                    <rect x="100" y="0" width="4" height="36" fill="#000" />
                    <rect x="106" y="0" width="2" height="36" fill="#000" />
                    <rect x="110" y="0" width="3" height="36" fill="#000" />
                    <rect x="115" y="0" width="2" height="36" fill="#000" />
                    <rect x="119" y="0" width="4" height="36" fill="#000" />
                    <rect x="125" y="0" width="1" height="36" fill="#000" />
                    <rect x="128" y="0" width="3" height="36" fill="#000" />
                    <rect x="133" y="0" width="2" height="36" fill="#000" />
                    <rect x="137" y="0" width="4" height="36" fill="#000" />
                    <rect x="143" y="0" width="2" height="36" fill="#000" />
                    <rect x="147" y="0" width="3" height="36" fill="#000" />
                    <rect x="152" y="0" width="2" height="36" fill="#000" />
                    <rect x="156" y="0" width="4" height="36" fill="#000" />
                  </svg>
                  <div className="text-[10px] font-mono font-bold tracking-widest text-neutral-700">
                    * {searchedApp.id} *
                  </div>
                </div>
              </div>

              {/* Scholar Details Table */}
              <div className="border border-neutral-300 rounded-lg overflow-hidden text-xs">
                <div className="bg-neutral-100 px-3 py-2 font-bold uppercase tracking-wider text-neutral-700 border-b border-neutral-300">
                  Scholar Dossier & Enrollment Masterlist Verification
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-neutral-200">
                  <div className="p-3 space-y-2">
                    <div>
                      <span className="text-neutral-500 block text-[10px] uppercase">Scholar Full Name:</span>
                      <span className="font-bold text-neutral-900 text-sm">{searchedApp.studentName}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block text-[10px] uppercase">EARIST Student Number:</span>
                      <span className="font-mono font-bold text-neutral-800">{searchedApp.studentId}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block text-[10px] uppercase">College / Department:</span>
                      <span className="font-semibold text-neutral-800">{searchedApp.collegeName} ({searchedApp.college})</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block text-[10px] uppercase">Degree Program & Year:</span>
                      <span className="font-semibold text-neutral-800">{searchedApp.course} • {searchedApp.yearAndSection}</span>
                    </div>
                  </div>
                  <div className="p-3 space-y-2 bg-neutral-50/50">
                    <div>
                      <span className="text-neutral-500 block text-[10px] uppercase">Awarded Scholarship Grant:</span>
                      <span className="font-bold text-maroon-primary text-sm">{searchedApp.program}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block text-[10px] uppercase">Certified Semestral Stipend:</span>
                      <span className="font-mono font-bold text-emerald-700 text-sm">
                        {formatPHP(searchedApp.stipendAmount)} / Semester
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block text-[10px] uppercase">GWA Standing:</span>
                      <span className="font-semibold text-neutral-800">{searchedApp.gwa.toFixed(2)} (Compliant with Minimum Standards)</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block text-[10px] uppercase">Masterlist Certification Code:</span>
                      <span className="font-mono text-[11px] font-bold text-neutral-700">
                        EARIST-SFAO-2026-M-{searchedApp.id.replace('APP-', '')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="p-3.5 bg-neutral-50 rounded-lg border border-neutral-200 text-xs space-y-1.5">
                <div className="font-bold text-neutral-800 uppercase tracking-wide text-[11px]">
                  Stipend Claiming & Disbursement Protocol:
                </div>
                <ol className="list-decimal pl-4 space-y-1 text-neutral-600 text-[11px]">
                  <li>
                    Present this printed acknowledgment slip along with your original valid EARIST Student ID and current semester Certificate of Registration (COR).
                  </li>
                  <li>
                    For CHED UniFAST TES beneficiaries, funds are credited directly to your LandBank Prepaid / Mastercard upon national treasury release.
                  </li>
                  <li>
                    For institutional and student assistant grants, check issuance is conducted at the Institute Cashier Office, Main Campus (Nagtahan).
                  </li>
                </ol>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-6 border-t border-neutral-300 text-center text-xs">
                <div>
                  <div className="h-10 flex items-end justify-center font-serif italic text-neutral-600 text-sm">
                    {searchedApp.assignedEvaluator}
                  </div>
                  <div className="border-t border-neutral-400 pt-1 font-bold text-neutral-800">
                    {searchedApp.assignedEvaluator}
                  </div>
                  <div className="text-[10px] text-neutral-500">SFAO College Evaluator / Screener</div>
                </div>
                <div>
                  <div className="h-10 flex items-end justify-center font-serif italic text-neutral-600 text-sm">
                    Dr. Ernesto V. Manalastas, Ed.D.
                  </div>
                  <div className="border-t border-neutral-400 pt-1 font-bold text-neutral-800">
                    Dr. Ernesto V. Manalastas, Ed.D.
                  </div>
                  <div className="text-[10px] text-neutral-500">Director, Student Financial Assistance Services</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
            {/* Dual Search Input Bar */}
            <form onSubmit={handleSearch} className="space-y-1.5">
              <label
                htmlFor="search-tracking-input"
                className="block text-xs font-bold uppercase tracking-wider text-neutral-700"
              >
                Track by Student Number or Reference Code:
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <input
                    id="search-tracking-input"
                    type="text"
                    placeholder="Enter EARIST Student No. (e.g. 2023-01849-MN-0) or Reference No. (e.g. APP-2026-1041)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-maroon-primary focus:border-transparent font-medium text-neutral-900 placeholder:text-neutral-400"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearching}
                  className="inline-flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-lg text-xs font-bold bg-maroon-primary hover:bg-maroon-hover text-white shadow-xs transition-all flex-shrink-0 cursor-pointer disabled:opacity-60"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Tracking...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-3.5 h-3.5" />
                      <span>Search Application</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-neutral-500">
                Official student verification service. All statuses reflect real-time SFAO college evaluator audits.
              </p>
            </form>

            {/* Re-upload Success Feedback Banner */}
            {reuploadSuccessMsg && (
              <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-start gap-2.5 text-xs animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-bold">Requirement Submitted Successfully</div>
                  <div className="text-[11px] text-emerald-800 mt-0.5">{reuploadSuccessMsg}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setReuploadSuccessMsg(null)}
                  className="text-emerald-700 hover:text-emerald-900"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Result View */}
            {searchedApp ? (
              <div className="space-y-6 animate-in fade-in">
                {/* 2. APPLICANT DOSSIER SUMMARY CARD */}
                <div className="p-4 sm:p-5 rounded-xl border border-neutral-200 bg-white shadow-xs space-y-4">
                  {/* Top Header of Card */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-neutral-200">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-neutral-500 tracking-wider">
                        Application Reference No.
                      </span>
                      <div className="text-base font-mono font-black text-maroon-primary">
                        {searchedApp.id}
                      </div>
                    </div>
                    <div>{renderStatusBadge(searchedApp.status)}</div>
                  </div>

                  {/* Student Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 text-xs">
                    <div>
                      <div className="text-neutral-500 text-[11px]">Applicant Full Name:</div>
                      <div className="font-bold text-neutral-900">{searchedApp.studentName}</div>
                      <div className="text-[11px] font-mono text-neutral-500 font-semibold">
                        {searchedApp.studentId}
                      </div>
                    </div>

                    <div>
                      <div className="text-neutral-500 text-[11px]">College & Course:</div>
                      <div className="font-semibold text-neutral-800">{searchedApp.course}</div>
                      <div className="text-[11px] text-neutral-500">
                        {searchedApp.collegeName} ({searchedApp.college}) • {searchedApp.yearAndSection}
                      </div>
                    </div>

                    <div>
                      <div className="text-neutral-500 text-[11px]">Applied Grant & Allocation:</div>
                      <div className="font-bold text-blue-800">{searchedApp.program}</div>
                      <div className="text-[11px] font-mono font-bold text-emerald-700">
                        {formatPHP(searchedApp.stipendAmount)} / Semester
                      </div>
                    </div>

                    <div>
                      <div className="text-neutral-500 text-[11px]">Assigned Evaluator:</div>
                      <div className="font-semibold text-neutral-800">
                        {searchedApp.assignedEvaluator}
                      </div>
                    </div>

                    <div>
                      <div className="text-neutral-500 text-[11px]">Evaluated Academic GWA:</div>
                      <div className="font-semibold text-neutral-800">
                        {searchedApp.gwa.toFixed(2)} (Good Academic Standing)
                      </div>
                    </div>

                    <div>
                      <div className="text-neutral-500 text-[11px]">Filing Date & Channel:</div>
                      <div className="font-semibold text-neutral-800">
                        {new Date(searchedApp.submissionDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}{' '}
                        • Online SFAO Web
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. ACTIONABLE REMARKS & DEFICIENCY RESOLUTION */}
                {searchedApp.status === 'Flagged' && (
                  <div className="p-4 sm:p-5 rounded-xl bg-red-50/80 border border-red-300 text-red-950 space-y-3">
                    <div className="flex items-start gap-2.5">
                      <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 space-y-1">
                        <div className="font-black uppercase tracking-wider text-xs text-red-800 flex items-center gap-1.5">
                          <span>Official SFAO Evaluator Advisory • Action Required</span>
                        </div>
                        <p className="text-xs font-semibold text-red-900 bg-white/70 p-2.5 rounded-lg border border-red-200">
                          {searchedApp.flagReason || searchedApp.evaluatorNotes}
                        </p>
                        <p className="text-[11px] text-red-800">
                          Your application evaluation is currently paused. Please re-upload an authenticated replacement document in PDF or PNG format (maximum 2 MB) to proceed before the college quota cut-off.
                        </p>
                      </div>
                    </div>

                    {/* Re-Upload Trigger Button */}
                    {!isReuploadOpen && (
                      <div className="pt-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setIsReuploadOpen(true);
                            // default to first unverified doc if available
                            const unverified = searchedApp.attachedDocuments.find((d) => !d.verified);
                            if (unverified) setSelectedDocId(unverified.id);
                            else if (searchedApp.attachedDocuments[0])
                              setSelectedDocId(searchedApp.attachedDocuments[0].id);
                          }}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-maroon-primary hover:bg-maroon-hover text-white shadow-xs transition-all cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Re-Upload Missing Requirement</span>
                        </button>
                      </div>
                    )}

                    {/* Re-Upload Form (Interactive Dropzone) */}
                    {isReuploadOpen && (
                      <form
                        onSubmit={handleConfirmReupload}
                        className="bg-white p-4 rounded-lg border border-red-200 space-y-3.5 animate-in fade-in"
                      >
                        <div className="font-bold text-xs text-neutral-800 border-b border-neutral-200 pb-1.5 flex items-center justify-between">
                          <span>Submit Authenticated Replacement File</span>
                          <span className="text-[10px] text-neutral-500 font-normal">
                            Max 2 MB • PDF or PNG only
                          </span>
                        </div>

                        {/* Select which document is being replaced */}
                        <div>
                          <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                            Select Requirement to Replace:
                          </label>
                          <select
                            value={selectedDocId}
                            onChange={(e) => setSelectedDocId(e.target.value)}
                            className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-900 font-medium"
                          >
                            {searchedApp.attachedDocuments.map((doc) => (
                              <option key={doc.id} value={doc.id}>
                                {doc.name} {doc.verified ? '(Currently Verified)' : '(Deficient / Pending)'}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* File Input */}
                        <div>
                          <label className="block text-[11px] font-bold text-neutral-700 mb-1">
                            Attach Official Replacement Document:
                          </label>
                          <input
                            type="file"
                            accept=".pdf,image/png"
                            onChange={handleFileChange}
                            className="block w-full text-xs text-neutral-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-maroon-primary file:text-white hover:file:bg-maroon-hover file:cursor-pointer border border-neutral-300 rounded-lg bg-neutral-50 p-1"
                          />
                        </div>

                        {/* File preview */}
                        {reuploadFile && (
                          <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <FileCheck className="w-4 h-4 text-emerald-600" />
                              <span className="font-semibold text-emerald-900">{reuploadFile.name}</span>
                              <span className="text-neutral-500 text-[10px]">
                                ({(reuploadFile.size / (1024 * 1024)).toFixed(2)} MB)
                              </span>
                            </div>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                              Validated
                            </span>
                          </div>
                        )}

                        {/* Error alert */}
                        {reuploadError && (
                          <div className="p-2.5 rounded-lg bg-red-100 border border-red-300 text-red-900 text-xs font-medium flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                            <span>{reuploadError}</span>
                          </div>
                        )}

                        {/* Form buttons */}
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setIsReuploadOpen(false);
                              setReuploadFile(null);
                              setReuploadError(null);
                            }}
                            className="px-3 py-1.5 text-xs font-semibold text-neutral-600 hover:text-neutral-800 hover:bg-neutral-100 rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={!reuploadFile || isSubmittingReupload}
                            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold text-white shadow-xs transition-all ${
                              reuploadFile && !isSubmittingReupload
                                ? 'bg-emerald-700 hover:bg-emerald-800 cursor-pointer'
                                : 'bg-neutral-400 cursor-not-allowed opacity-60'
                            }`}
                          >
                            {isSubmittingReupload ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Uploading Replacement...</span>
                              </>
                            ) : (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Confirm & Submit Replacement</span>
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                {/* Approved / Inscribed Banner */}
                {searchedApp.status === 'Approved' && (
                  <div className="p-4 sm:p-5 rounded-xl bg-emerald-50/90 border border-emerald-300 text-emerald-950 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <Award className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="font-black uppercase tracking-wider text-xs text-emerald-900">
                            Application Approved & Inscribed in Official SFAO Masterlist
                          </div>
                          <div className="text-xs text-emerald-800 mt-0.5">
                            Grant certified by the SFAO Director. Semestral stipend of{' '}
                            <span className="font-bold">{formatPHP(searchedApp.stipendAmount)}</span> ready for
                            disbursement processing.
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowSlip(true)}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-maroon-primary hover:bg-maroon-hover text-white shadow-xs transition-all flex-shrink-0 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print / Download Acknowledgment Slip</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Endorsed to CHED UniFAST Banner */}
                {searchedApp.status === 'Endorsed' && (
                  <div className="p-4 sm:p-5 rounded-xl bg-blue-50/90 border border-blue-300 text-blue-950 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <CheckCircle2 className="w-5 h-5 text-blue-700 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="font-black uppercase tracking-wider text-xs text-blue-900">
                            Endorsed to CHED UniFAST National Masterlist
                          </div>
                          <div className="text-xs text-blue-800 mt-0.5">
                            Application validated under institutional quota and transmitted to the CHED UniFAST
                            Central Office for national disbursement.
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowSlip(true)}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-blue-800 hover:bg-blue-900 text-white shadow-xs transition-all flex-shrink-0"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View Transmittal Summary</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 4. REALISTIC MULTI-STAGE PROGRESS STEPPER */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                      Multi-Stage Evaluation Progress Timeline
                    </h3>
                    <span className="text-[11px] text-neutral-500 font-medium">
                      Last Updated: {new Date(searchedApp.lastUpdated).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="p-4 sm:p-5 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-5">
                    {/* Step 1: Application Received */}
                    {(() => {
                      const step1 = getStepProgress(1, searchedApp);
                      return (
                        <div className="flex items-start gap-3.5 relative">
                          <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-2xs">
                            ✓
                          </div>
                          <div className="flex-1 space-y-0.5">
                            <div className="flex items-center justify-between flex-wrap gap-1">
                              <span className="text-xs font-bold text-neutral-900">{step1.title}</span>
                              <span className="text-[10px] font-semibold text-neutral-500 font-mono">
                                {step1.date}
                              </span>
                            </div>
                            <p className="text-[11px] text-neutral-600">{step1.description}</p>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Step 2: Document Verification */}
                    {(() => {
                      const step2 = getStepProgress(2, searchedApp);
                      const isComplete = step2.status === 'completed';
                      const isFlagged = step2.status === 'flagged';
                      return (
                        <div className="flex items-start gap-3.5 relative">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-2xs ${
                              isComplete
                                ? 'bg-emerald-600 text-white'
                                : isFlagged
                                ? 'bg-red-600 text-white animate-pulse'
                                : 'bg-amber-500 text-white'
                            }`}
                          >
                            {isComplete ? '✓' : isFlagged ? '!' : '2'}
                          </div>
                          <div className="flex-1 space-y-0.5">
                            <div className="flex items-center justify-between flex-wrap gap-1">
                              <span className="text-xs font-bold text-neutral-900">{step2.title}</span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  isComplete
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : isFlagged
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {step2.date}
                              </span>
                            </div>
                            <p className="text-[11px] text-neutral-600">{step2.description}</p>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Step 3: College Committee Evaluation */}
                    {(() => {
                      const step3 = getStepProgress(3, searchedApp);
                      const isComplete = step3.status === 'completed';
                      const isFlagged = step3.status === 'flagged';
                      return (
                        <div className="flex items-start gap-3.5 relative">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-2xs ${
                              isComplete
                                ? 'bg-emerald-600 text-white'
                                : isFlagged
                                ? 'bg-red-600 text-white'
                                : 'bg-amber-500 text-white'
                            }`}
                          >
                            {isComplete ? '✓' : isFlagged ? '!' : '3'}
                          </div>
                          <div className="flex-1 space-y-0.5">
                            <div className="flex items-center justify-between flex-wrap gap-1">
                              <span className="text-xs font-bold text-neutral-900">{step3.title}</span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  isComplete
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : isFlagged
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {step3.date}
                              </span>
                            </div>
                            <p className="text-[11px] text-neutral-600">{step3.description}</p>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Step 4: SFAO Final Masterlist & Awarding */}
                    {(() => {
                      const step4 = getStepProgress(4, searchedApp);
                      const isComplete = step4.status === 'completed';
                      return (
                        <div className="flex items-start gap-3.5 relative">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-2xs ${
                              isComplete ? 'bg-emerald-600 text-white' : 'bg-neutral-300 text-neutral-600'
                            }`}
                          >
                            {isComplete ? '✓' : '4'}
                          </div>
                          <div className="flex-1 space-y-0.5">
                            <div className="flex items-center justify-between flex-wrap gap-1">
                              <span className="text-xs font-bold text-neutral-900">{step4.title}</span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  isComplete
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-neutral-200 text-neutral-700'
                                }`}
                              >
                                {step4.date}
                              </span>
                            </div>
                            <p className="text-[11px] text-neutral-600">{step4.description}</p>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Document Verification Breakdown */}
                <div className="space-y-2.5 pt-2 border-t border-neutral-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                      Submitted Requirements Verification Status:
                    </span>
                    <span className="text-[11px] text-neutral-500">
                      {searchedApp.attachedDocuments.filter((d) => d.verified).length} of{' '}
                      {searchedApp.attachedDocuments.length} Verified
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {searchedApp.attachedDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 rounded-lg bg-neutral-50 border border-neutral-200 text-xs gap-1.5"
                      >
                        <div className="flex items-center gap-2">
                          {doc.verified ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          ) : searchedApp.status === 'Flagged' ? (
                            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                          ) : (
                            <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
                          )}
                          <span className="font-semibold text-neutral-800">{doc.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] self-end sm:self-center">
                          <span className="text-neutral-500">{doc.fileSize}</span>
                          <span
                            className={`font-bold px-2 py-0.5 rounded ${
                              doc.verified
                                ? 'bg-emerald-100 text-emerald-800'
                                : searchedApp.status === 'Flagged'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {doc.verified
                              ? 'Verified & Authenticated'
                              : searchedApp.status === 'Flagged'
                              ? 'Deficient / Requires Replacement'
                              : 'Pending Audit'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : hasSearched ? (
              /* No Search Match State */
              <div className="text-center py-12 px-4 space-y-3 bg-neutral-50 rounded-xl border border-neutral-200">
                <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
                <h4 className="text-sm font-bold text-neutral-800">No Scholarship Application Found</h4>
                <p className="text-xs text-neutral-600 max-w-md mx-auto">
                  We could not find an active scholarship application matching{' '}
                  <span className="font-mono font-bold text-neutral-900">&quot;{searchTerm}&quot;</span>.
                  Please double-check your EARIST Student Number or Application Reference Code and include hyphens.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm('');
                      setHasSearched(false);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-neutral-700 bg-white hover:bg-neutral-100 rounded-lg border border-neutral-300 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Clear Search & Try Again</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Default Welcome / Instructions State (Authentic University Portal) */
              <div className="space-y-4 py-2">
                <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/70 space-y-3">
                  <div className="flex items-center gap-2 text-neutral-800 font-bold text-xs uppercase tracking-wide">
                    <ShieldCheck className="w-4 h-4 text-maroon-primary" />
                    <span>Official EARIST SFAO Online Verification Portal</span>
                  </div>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    Welcome to the Eulogio &quot;Amang&quot; Rodriguez Institute of Science and Technology
                    Scholarship Verification Service. Students who filed applications for the current academic
                    semester may track real-time evaluator audits, document verification milestones, and official
                    CHED UniFAST / Institutional disbursement masterlist inscription.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                    <div className="p-3 bg-white rounded-lg border border-neutral-200 space-y-1">
                      <div className="font-bold text-neutral-800 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-neutral-100 text-neutral-700 flex items-center justify-center text-[10px] font-mono">
                          1
                        </span>
                        <span>Dual Lookup</span>
                      </div>
                      <p className="text-[11px] text-neutral-500">
                        Query by either your 10-digit EARIST Student ID (e.g. 2023-01849-MN-0) or your digital reference number (APP-2026-XXXX).
                      </p>
                    </div>

                    <div className="p-3 bg-white rounded-lg border border-neutral-200 space-y-1">
                      <div className="font-bold text-neutral-800 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-neutral-100 text-neutral-700 flex items-center justify-center text-[10px] font-mono">
                          2
                        </span>
                        <span>Multi-Stage Stepper</span>
                      </div>
                      <p className="text-[11px] text-neutral-500">
                        View real-time registrar credential audit logs, college evaluator deliberation notes, and final director sign-offs.
                      </p>
                    </div>

                    <div className="p-3 bg-white rounded-lg border border-neutral-200 space-y-1">
                      <div className="font-bold text-neutral-800 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-neutral-100 text-neutral-700 flex items-center justify-center text-[10px] font-mono">
                          3
                        </span>
                        <span>Deficiency Clearing</span>
                      </div>
                      <p className="text-[11px] text-neutral-500">
                        If your file is flagged, receive evaluator advisories and re-upload authenticated credentials directly before quota cut-off.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-neutral-500 px-1">
                  <span>Data Privacy Act of 2012 (RA 10173) Enforced.</span>
                  <span>SFAO Office • Nagtahan, Manila Main Campus</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* MODAL FOOTER                                                      */}
        {/* ================================================================= */}
        <div className="px-5 sm:px-6 py-3.5 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between text-xs">
          <div className="text-neutral-500 text-[11px] hidden sm:block">
            Inquiries? Visit SFAO Manila Main Campus Ground Floor or email sfao@earist.edu.ph
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold bg-neutral-800 hover:bg-neutral-900 text-white rounded-lg transition-colors ml-auto"
          >
            Close Tracking Portal
          </button>
        </div>
      </div>
    </div>
  );
};
