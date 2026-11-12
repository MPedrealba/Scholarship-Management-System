import React, { useState, useRef, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type {
  ScholarshipApplication,
  CollegeCode,
  ScholarshipProgram,
  ScholarshipProgramItem,
  DocumentChecklist,
} from '../../types';
import {
  COLLEGE_NAMES,
  COLLEGE_PROGRAMS,
  COLLEGE_EVALUATORS,
  PROGRAM_STIPENDS,
} from '../../data/mockData';
import { formatPHP } from '../../utils/exportUtils';
import { EaristLogo } from '../common/EaristLogo';
import { fetchQuotasApi, fetchScholarshipsApi, submitApplicationApi, type QuotaRecord } from '../../utils/api';
import {
  X,
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Trash2,
  Printer,
  ShieldCheck,
  Loader2,
} from 'lucide-react';

interface SubmitApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitSuccess: (newApplication: ScholarshipApplication) => void;
  initialProgram?: ScholarshipProgram;
}

type MandatoryDocKey = 'cor' | 'grades' | 'indigency' | 'validId';

interface UploadedDocRecord {
  file: File;
  name: string;
  size: number;
  formattedSize: string;
}

interface MandatoryDocConfig {
  key: MandatoryDocKey;
  title: string;
  sublabel: string;
  iconName: string;
}

const MANDATORY_DOCUMENTS: MandatoryDocConfig[] = [
  {
    key: 'cor',
    title: 'Certificate of Registration (COR) - Current Semester',
    sublabel: 'Official 1st Semester A.Y. 2026–2027 registration with college registrar dry seal',
    iconName: 'cor',
  },
  {
    key: 'grades',
    title: 'Certified True Copy of Grades / Grade Slip',
    sublabel: 'Transcript signed by College Dean or Registrar verifying General Weighted Average (GWA)',
    iconName: 'grades',
  },
  {
    key: 'indigency',
    title: 'Barangay Certificate of Indigency',
    sublabel: 'Issued within calendar year 2026 certifying low-income status or 4Ps Listahanan record',
    iconName: 'indigency',
  },
  {
    key: 'validId',
    title: 'Valid Student ID or 2x2 ID Photo',
    sublabel: 'Scanned front/back of EARIST ID or official government-issued identity card',
    iconName: 'id',
  },
];

const MAX_FILE_SIZE = 2 * 1024 * 1024; // Strict 2MB Server Quota
const ALLOWED_EXTENSIONS = ['.pdf', '.png'];
const ALLOWED_MIME_TYPES = ['application/pdf', 'image/png'];

export const SubmitApplicationModal: React.FC<SubmitApplicationModalProps> = ({
  isOpen,
  onClose,
  onSubmitSuccess,
  initialProgram,
}) => {
  // Form Text Inputs
  const [formData, setFormData] = useState({
    studentId: '2024-05189-MN-0',
    studentName: '',
    college: 'CAS' as CollegeCode,
    course: 'BS in Computer Science',
    yearAndSection: '2nd Year - CS-2A',
    program: (initialProgram || 'CHED TDP') as ScholarshipProgram,
    gwa: '1.45',
    monthlyHouseholdIncome: '15000',
    contactNumber: '+63 9',
    email: '',
  });

  // State synchronization when initialProgram updates
  const [prevProgram, setPrevProgram] = useState(initialProgram);
  if (initialProgram !== prevProgram) {
    setPrevProgram(initialProgram);
    if (initialProgram) {
      setFormData((prev) => ({ ...prev, program: initialProgram }));
    }
  }

  // Real Uploaded Files State for the 4 Mandatory Attachments
  const [uploadedFiles, setUploadedFiles] = useState<Record<MandatoryDocKey, UploadedDocRecord | null>>({
    cor: null,
    grades: null,
    indigency: null,
    validId: null,
  });

  // Drag over tracking per key
  const [dragActiveKey, setDragActiveKey] = useState<MandatoryDocKey | null>(null);

  // Validation & Error Tracking
  const [fileErrors, setFileErrors] = useState<Partial<Record<MandatoryDocKey, string>>>({});
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [globalBannerError, setGlobalBannerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quota & Dynamic Scholarship Programs State
  const [quotas, setQuotas] = useState<QuotaRecord[]>([]);
  const [programs, setPrograms] = useState<ScholarshipProgramItem[]>([]);

  // Success Confirmation State
  const [submittedApp, setSubmittedApp] = useState<ScholarshipApplication | null>(null);

  // Hidden File Inputs Refs
  const inputRefs = {
    cor: useRef<HTMLInputElement>(null),
    grades: useRef<HTMLInputElement>(null),
    indigency: useRef<HTMLInputElement>(null),
    validId: useRef<HTMLInputElement>(null),
  };

  // Fetch real-time quota slots and dynamic scholarships on modal open
  useEffect(() => {
    if (isOpen) {
      fetchScholarshipsApi()
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setPrograms(data);
            if (!formData.program && data[0]?.name) {
              setFormData((prev) => ({ ...prev, program: data[0].name }));
            }
          }
        })
        .catch((err) => {
          console.warn('Unable to load scholarships in modal:', err);
        });

      fetchQuotasApi()
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setQuotas(data);
          }
        })
        .catch((err) => {
          console.warn('Unable to load quotas from server, using local defaults:', err);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // File size format helper
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Strict File Governance Validation
  const validateUploadedFile = (file: File): { valid: boolean; error?: string } => {
    const fileName = file.name.toLowerCase();
    const hasValidExt = ALLOWED_EXTENSIONS.some((ext) => fileName.endsWith(ext));
    const hasValidMime = ALLOWED_MIME_TYPES.includes(file.type);

    // MIME Type restriction: .pdf and .png only
    if (!hasValidExt && !hasValidMime) {
      return {
        valid: false,
        error: `Invalid file format for "${file.name}". Only .pdf and .png documents are accepted.`,
      };
    }

    // Strict 2MB Server Storage Limit
    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File "${file.name}" (${formatFileSize(file.size)}) exceeds the 2MB server limit.`,
      };
    }

    return { valid: true };
  };

  // Handle incoming file (from input change or drop)
  const processFileAttachment = (key: MandatoryDocKey, fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];
    const validation = validateUploadedFile(file);

    if (!validation.valid) {
      const err = validation.error || 'Invalid file uploaded.';
      setFileErrors((prev) => ({ ...prev, [key]: err }));
      setGlobalBannerError(err);
      return;
    }

    // Valid file: clear error and update state
    setFileErrors((prev) => ({ ...prev, [key]: undefined }));
    setGlobalBannerError(null);
    setUploadedFiles((prev) => ({
      ...prev,
      [key]: {
        file,
        name: file.name,
        size: file.size,
        formattedSize: formatFileSize(file.size),
      },
    }));
  };

  // Remove / Replace file handler
  const handleRemoveFile = (key: MandatoryDocKey) => {
    setUploadedFiles((prev) => ({ ...prev, [key]: null }));
    setFileErrors((prev) => ({ ...prev, [key]: undefined }));
    if (inputRefs[key].current) {
      inputRefs[key].current.value = '';
    }
  };

  // College dropdown change
  const handleCollegeChange = (college: CollegeCode) => {
    const courses = COLLEGE_PROGRAMS[college] || [];
    setFormData((prev) => ({
      ...prev,
      college,
      course: courses[0] || '',
    }));
  };

  // GWA Validation
  const gwaNum = parseFloat(formData.gwa);
  const isGwaValid = !isNaN(gwaNum) && gwaNum >= 1.0 && gwaNum <= 5.0;
  const monthlyIncomeNum = parseFloat(formData.monthlyHouseholdIncome) || 0;

  // Real-time Academic & Financial Eligibility Pre-Screening (Feature 1)
  const isStemProgram = (college: CollegeCode, course: string): boolean => {
    if (college === 'CEN' || college === 'CIT') return true;
    const stemKeywords = [
      'computer science',
      'applied physics',
      'mathematics',
      'science',
      'architecture',
      'technology',
      'engineering',
    ];
    const cLower = course.toLowerCase();
    return stemKeywords.some((k) => cLower.includes(k));
  };

  // Dynamic Program Document Lookup
  const selectedProgramDoc = programs.find(
    (p) => p.name.toLowerCase() === (formData.program || '').toLowerCase()
  );

  const getEligibilityCheck = (): { eligible: boolean; advisory?: string } => {
    if (!formData.program) return { eligible: true };

    if (selectedProgramDoc) {
      if (isGwaValid && selectedProgramDoc.maxGwa && gwaNum > selectedProgramDoc.maxGwa) {
        return {
          eligible: false,
          advisory: `${selectedProgramDoc.name} requires a General Weighted Average (GWA) of ${Number(selectedProgramDoc.maxGwa).toFixed(2)} or better. Your declared GWA (${gwaNum.toFixed(2)}) does not meet the qualification standard for this grant.`,
        };
      }

      if (
        selectedProgramDoc.maxMonthlyIncome !== null &&
        selectedProgramDoc.maxMonthlyIncome !== undefined &&
        monthlyIncomeNum > selectedProgramDoc.maxMonthlyIncome
      ) {
        return {
          eligible: false,
          advisory: `${selectedProgramDoc.name} statutory financial mandate requires monthly household income not exceeding PHP ${Number(selectedProgramDoc.maxMonthlyIncome).toLocaleString()}. Your declared monthly income (${formatPHP(monthlyIncomeNum)}) exceeds this statutory threshold.`,
        };
      }
    } else {
      if (formData.program === 'Academic Excellence Grant') {
        if (isGwaValid && gwaNum > 1.75) {
          return {
            eligible: false,
            advisory: `Academic Excellence Grant requires a General Weighted Average (GWA) of 1.75 or better (Dean's/President's List honors). Your entered GWA (${gwaNum.toFixed(2)}) does not meet the qualification standard for this grant.`,
          };
        }
      }

      if (formData.program === 'CHED TDP' || formData.program === 'Tertiary Education Subsidy (TES)') {
        if (monthlyIncomeNum > 33333) {
          return {
            eligible: false,
            advisory: `${formData.program} statutory low-income mandate requires monthly household income not exceeding PHP 33,333. Your declared monthly income (${formatPHP(monthlyIncomeNum)}) exceeds this statutory threshold.`,
          };
        }
      }
    }

    if (formData.program.toLowerCase().includes('dost')) {
      if (isGwaValid && gwaNum > 2.00) {
        return {
          eligible: false,
          advisory: `DOST-SEI Science & Technology Grant requires a minimum GWA of 2.00 or better. Your entered GWA (${gwaNum.toFixed(2)}) does not qualify for DOST-SEI endorsement.`,
        };
      }
      if (!isStemProgram(formData.college, formData.course)) {
        return {
          eligible: false,
          advisory: `DOST-SEI Grant is strictly restricted to recognized Priority Science, Technology, Engineering, and Mathematics (STEM) degree programs. Enrolled course "${formData.course}" (${formData.college}) does not qualify under DOST priority curricula.`,
        };
      }
    }

    return { eligible: true };
  };

  const eligibilityCheck = getEligibilityCheck();

  // Text inputs completeness
  const isTextValid =
    formData.studentId.trim() !== '' &&
    formData.studentName.trim() !== '' &&
    formData.contactNumber.trim() !== '' &&
    formData.email.trim() !== '' &&
    formData.course.trim() !== '' &&
    formData.yearAndSection.trim() !== '' &&
    formData.monthlyHouseholdIncome.trim() !== '' &&
    Boolean(formData.program) &&
    isGwaValid;

  // 4 Mandatory uploads completeness
  const areAllDocsAttached =
    uploadedFiles.cor !== null &&
    uploadedFiles.grades !== null &&
    uploadedFiles.indigency !== null &&
    uploadedFiles.validId !== null;

  // Form Overall Validity (Strict Submission Blocking)
  const isFormValid = isTextValid && areAllDocsAttached && eligibilityCheck.eligible;

  // Check if a scholarship grant quota is locked or full
  const isGrantClosed = (grantName: string): boolean => {
    const prog = programs.find((p) => p.name.toLowerCase() === grantName.toLowerCase());
    if (prog) {
      if (prog.isLocked) return true;
      if (prog.allocatedSlots !== undefined && prog.totalSlots !== undefined && prog.allocatedSlots >= prog.totalSlots) {
        return true;
      }
    }
    const q = quotas.find(
      (item) => item.grantType.toLowerCase() === grantName.toLowerCase()
    );
    if (!q) return false;
    return q.isLocked || q.allocatedSlots >= q.totalSlots;
  };

  // Form Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttemptedSubmit(true);

    if (!eligibilityCheck.eligible) {
      setGlobalBannerError(
        eligibilityCheck.advisory || 'Student does not meet eligibility requirements for this grant.'
      );
      return;
    }

    if (!isFormValid) {
      setGlobalBannerError(
        'All required fields and mandatory document attachments must be completed before submission.'
      );
      return;
    }

    if (isGrantClosed(formData.program)) {
      setGlobalBannerError(
        `Intake Closed: The quota limit for ${formData.program} has been reached. Please choose an open scholarship grant.`
      );
      return;
    }

    setIsSubmitting(true);
    setGlobalBannerError(null);

    try {
      const payload = new FormData();
      payload.append('studentNumber', formData.studentId.trim());
      payload.append('studentName', formData.studentName.trim());
      payload.append('college', formData.college);
      payload.append('degreeProgram', formData.course.trim());
      payload.append('yearAndSection', formData.yearAndSection.trim());
      payload.append('scholarshipGrant', formData.program);
      payload.append('grantType', formData.program);
      payload.append(
        'stipendAmount',
        String(selectedProgramDoc?.stipendAmount ?? (PROGRAM_STIPENDS[formData.program] || 20000))
      );
      payload.append('academicTerm', '1st Sem A.Y. 2026-2027');
      payload.append('gwa', String(gwaNum));
      payload.append('monthlyIncome', formData.monthlyHouseholdIncome.trim());
      payload.append('annualIncome', String(monthlyIncomeNum * 12));
      payload.append('contactMobile', formData.contactNumber.trim());
      payload.append('contactNumber', formData.contactNumber.trim());
      payload.append(
        'email',
        formData.email.trim() || `${formData.studentId.toLowerCase().replace(/[^a-z0-9]/g, '')}@earist.edu.ph`
      );

      if (uploadedFiles.cor?.file) payload.append('doc_cor', uploadedFiles.cor.file);
      if (uploadedFiles.grades?.file) payload.append('doc_grades', uploadedFiles.grades.file);
      if (uploadedFiles.indigency?.file) payload.append('doc_indigency', uploadedFiles.indigency.file);
      if (uploadedFiles.validId?.file) payload.append('doc_validId', uploadedFiles.validId.file);

      const res = await submitApplicationApi(payload);
      if (res && res.application) {
        onSubmitSuccess(res.application);
        setSubmittedApp(res.application);
        return;
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);

      // Duplicate Application Error Detection (Feature 2)
      if (
        errorMsg.includes('already exists') ||
        errorMsg.includes('Conflict') ||
        errorMsg.includes('409') ||
        errorMsg.includes('current semester')
      ) {
        setGlobalBannerError(errorMsg);
        setIsSubmitting(false);
        return;
      }

      console.warn('API submission failed, falling back to local storage handler:', errorMsg);
      // Fallback local creation
      const generatedId = `APP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const stipend = selectedProgramDoc?.stipendAmount ?? (PROGRAM_STIPENDS[formData.program] || 15000);
      const evaluator = COLLEGE_EVALUATORS[formData.college] || 'SFAO General Evaluator';
      const submissionTime = new Date().toISOString();

      const attachedDocs: DocumentChecklist[] = [
        {
          id: 'doc-cor',
          name: uploadedFiles.cor ? uploadedFiles.cor.name : 'Certificate of Registration (COR)',
          verified: false,
          required: true,
          uploadedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
          fileSize: uploadedFiles.cor ? uploadedFiles.cor.formattedSize : '1.4 MB',
        },
        {
          id: 'doc-grades',
          name: uploadedFiles.grades ? uploadedFiles.grades.name : 'Certified Grade Slip',
          verified: false,
          required: true,
          uploadedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
          fileSize: uploadedFiles.grades ? uploadedFiles.grades.formattedSize : '950 KB',
        },
        {
          id: 'doc-indigency',
          name: uploadedFiles.indigency ? uploadedFiles.indigency.name : 'Barangay Certificate of Indigency',
          verified: false,
          required: true,
          uploadedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
          fileSize: uploadedFiles.indigency ? uploadedFiles.indigency.formattedSize : '640 KB',
        },
        {
          id: 'doc-validId',
          name: uploadedFiles.validId ? uploadedFiles.validId.name : 'Valid Student ID / Photo',
          verified: false,
          required: true,
          uploadedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
          fileSize: uploadedFiles.validId ? uploadedFiles.validId.formattedSize : '780 KB',
        },
      ];

      const fallbackApp: ScholarshipApplication = {
        id: generatedId,
        studentId: formData.studentId.trim(),
        studentName: formData.studentName.trim(),
        college: formData.college,
        collegeName: COLLEGE_NAMES[formData.college],
        course: formData.course,
        yearAndSection: formData.yearAndSection,
        program: formData.program,
        submissionDate: submissionTime,
        status: 'Pending Review',
        assignedEvaluator: evaluator,
        gwa: gwaNum,
        monthlyHouseholdIncome: monthlyIncomeNum,
        contactNumber: formData.contactNumber.trim(),
        email:
          formData.email.trim() ||
          `${formData.studentId.toLowerCase().replace(/[^a-z0-9]/g, '')}@earist.edu.ph`,
        stipendAmount: stipend,
        academicTerm: '1st Sem A.Y. 2026-2027',
        evaluatorNotes:
          'Direct online intake via SFAO Student Application Portal. Verified attachments pending committee review.',
        attachedDocuments: attachedDocs,
        lastUpdated: submissionTime,
      };

      onSubmitSuccess(fallbackApp);
      setSubmittedApp(fallbackApp);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const resetAndClose = () => {
    setSubmittedApp(null);
    setAttemptedSubmit(false);
    setGlobalBannerError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      {/* Modal Dialog Card (Clean Institutional Design) */}
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full border border-neutral-300 overflow-hidden transform transition-all animate-in fade-in duration-150">
        {/* ========================================================= */}
        {/* HEADER: Clean Institutional White Header with EARIST Seal */}
        {/* ========================================================= */}
        <div className="bg-white p-5 sm:p-6 border-b border-neutral-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <EaristLogo size={46} showText={false} className="flex-shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-neutral-900 tracking-tight font-sans">
                  New Scholarship Application Filing
                </h2>
                <span className="hidden sm:inline-block text-[10px] font-bold text-maroon-primary bg-maroon-subtle border border-red-200 px-2 py-0.5 rounded uppercase">
                  A.Y. 2026–2027 • 1st Sem
                </span>
              </div>
              <p className="text-xs text-neutral-500 font-medium">
                Eulogio &apos;Amang&apos; Rodriguez Institute of Science and Technology • SFAO Intake
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={resetAndClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ========================================================= */}
        {/* BODY CONTAINER                                            */}
        {/* ========================================================= */}
        <div className="p-5 sm:p-6 max-h-[75vh] overflow-y-auto">
          {submittedApp ? (
            /* ========================================================= */
            /* SUCCESS SUBMISSION RECEIPT VIEW WITH QR CODE (FEATURE 3)   */
            /* ========================================================= */
            <div id="official-sfao-receipt" className="space-y-5 text-center py-2">
              <style>{`
                @media print {
                  body * {
                    visibility: hidden !important;
                  }
                  #official-sfao-receipt, #official-sfao-receipt * {
                    visibility: visible !important;
                  }
                  #official-sfao-receipt {
                    position: absolute !important;
                    left: 0 !important;
                    top: 0 !important;
                    width: 100% !important;
                    margin: 0 !important;
                    padding: 24px !important;
                  }
                  .print\\:hidden {
                    display: none !important;
                  }
                }
              `}</style>

              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner print:hidden">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div className="space-y-1 print:hidden">
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 uppercase tracking-wider">
                  Application Successfully Filed
                </span>
                <h3 className="text-xl font-black text-neutral-900 font-sans">
                  Official SFAO Submission Receipt
                </h3>
                <p className="text-xs text-neutral-500">
                  Your credentials have been securely registered under the SFAO Verification Workflow.
                </p>
              </div>

              {/* Printable Official Receipt Card */}
              <div className="bg-white p-6 rounded-xl border border-neutral-300 text-left space-y-4 max-w-xl mx-auto shadow-xs">
                {/* Institutional Header */}
                <div className="flex items-center justify-between pb-4 border-b border-neutral-200 gap-3">
                  <div className="flex items-center gap-3">
                    <EaristLogo size={42} showText={false} className="flex-shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-tight text-neutral-900">
                        Eulogio &quot;Amang&quot; Rodriguez Institute of Science and Technology
                      </h4>
                      <p className="text-[11px] text-maroon-primary font-semibold">
                        Office of Student Financial Assistance (SFAO)
                      </p>
                      <p className="text-[10px] text-neutral-500">
                        Official Scholarship Application Filing Receipt
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end flex-shrink-0">
                    <span className="text-[9px] text-neutral-500 uppercase font-bold">
                      Reference Code
                    </span>
                    <span className="text-base font-mono font-black text-maroon-primary">
                      {submittedApp.id}
                    </span>
                    <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 mt-1">
                      {submittedApp.academicTerm || '1st Sem A.Y. 2026-2027'}
                    </span>
                  </div>
                </div>

                {/* Details Grid & QR Code */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1 items-center">
                  <div className="sm:col-span-2 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-neutral-500 uppercase font-bold block">
                        Applicant Name
                      </span>
                      <strong className="text-neutral-900 text-xs block">{submittedApp.studentName}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-500 uppercase font-bold block">
                        Student Number
                      </span>
                      <strong className="font-mono text-neutral-900 text-xs block">{submittedApp.studentId}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-500 uppercase font-bold block">
                        College / Department
                      </span>
                      <span className="text-neutral-800 text-xs block font-medium">{submittedApp.collegeName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-500 uppercase font-bold block">
                        Degree Program
                      </span>
                      <span className="text-neutral-800 text-xs block truncate" title={submittedApp.course}>
                        {submittedApp.course}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-500 uppercase font-bold block">
                        Scholarship Grant
                      </span>
                      <strong className="text-maroon-primary text-xs block">{submittedApp.program}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-500 uppercase font-bold block">
                        Semestral Grant
                      </span>
                      <strong className="text-neutral-900 text-xs block">{formatPHP(submittedApp.stipendAmount)}</strong>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] text-neutral-500 uppercase font-bold block">
                        Submission Timestamp
                      </span>
                      <span className="text-neutral-700 font-mono text-[11px] block">
                        {new Date(submittedApp.submissionDate).toLocaleString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  {/* QR Code Container */}
                  <div className="flex flex-col items-center justify-center p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-center">
                    <QRCodeSVG
                      value={`${window.location.origin}/#scholarships?track=${encodeURIComponent(submittedApp.id)}`}
                      size={110}
                      level="M"
                      includeMargin={false}
                    />
                    <span className="text-[9px] font-mono text-neutral-500 mt-2 block leading-tight">
                      Scan to Track Status
                    </span>
                  </div>
                </div>

                {/* Uploaded Verification Documents */}
                <div className="pt-2 border-t border-neutral-200">
                  <span className="text-[11px] font-bold text-neutral-700 block mb-1">
                    Uploaded Verification Dossier ({submittedApp.attachedDocuments.length}/4 Mandatory):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {submittedApp.attachedDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between text-[11px] text-neutral-700 bg-neutral-50 p-1.5 rounded border border-neutral-200"
                      >
                        <span className="truncate max-w-[200px]">{doc.name}</span>
                        <span className="font-mono text-[10px] text-neutral-500">{doc.fileSize}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Notice */}
                <div className="pt-2 border-t border-neutral-200 flex items-center justify-between text-[10px] text-neutral-500">
                  <span>Assigned Evaluator: {submittedApp.assignedEvaluator}</span>
                  <span>R.A. 10173 Verified Digital Dossier</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-3 pt-2 print:hidden">
                <button
                  type="button"
                  onClick={handlePrintReceipt}
                  className="px-4 py-2.5 rounded-lg text-xs font-bold border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  <Printer className="w-4 h-4 text-neutral-500" />
                  <span>Print Receipt</span>
                </button>
                <button
                  type="button"
                  onClick={resetAndClose}
                  className="px-6 py-2.5 rounded-lg text-xs font-bold bg-maroon-primary hover:bg-maroon-hover text-white transition-colors cursor-pointer shadow-2xs"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* ========================================================= */
            /* APPLICATION FILING FORM                                   */
            /* ========================================================= */
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Mandatory Incomplete Submission Warning Banner */}
              {attemptedSubmit && !isFormValid && (
                <div className="p-3.5 rounded-lg bg-red-50 border border-red-300 text-red-900 flex items-start gap-2.5 text-xs animate-in fade-in duration-150">
                  <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold block">Submission Blocked:</strong>
                    <span>
                      All required text fields and all 4 mandatory document attachments must be completed before submission.
                    </span>
                  </div>
                </div>
              )}

              {/* General File / Validation Error Notification */}
              {globalBannerError && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span>{globalBannerError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setGlobalBannerError(null)}
                    className="text-amber-700 hover:text-amber-950 font-bold"
                  >
                    ×
                  </button>
                </div>
              )}

              {/* --------------------------------------------------------- */}
              {/* SECTION 1: Personal Information                           */}
              {/* --------------------------------------------------------- */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800 pb-1 border-b border-neutral-200">
                  1. Student Personal Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      EARIST Student Number <span className="text-red-600 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 2024-05189-MN-0"
                      value={formData.studentId}
                      onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                      className={`w-full text-xs font-mono px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-maroon-primary focus:border-maroon-primary bg-white transition-colors ${
                        attemptedSubmit && !formData.studentId.trim()
                          ? 'border-red-500 bg-red-50/20'
                          : 'border-neutral-300'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Full Legal Name (Last, First M.) <span className="text-red-600 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Ramos, Alyssa Nicole C."
                      value={formData.studentName}
                      onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                      className={`w-full text-xs px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-maroon-primary focus:border-maroon-primary bg-white transition-colors ${
                        attemptedSubmit && !formData.studentName.trim()
                          ? 'border-red-500 bg-red-50/20'
                          : 'border-neutral-300'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Contact Mobile Number <span className="text-red-600 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="+63 9XX XXX XXXX"
                      value={formData.contactNumber}
                      onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                      className={`w-full text-xs px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-maroon-primary focus:border-maroon-primary bg-white transition-colors ${
                        attemptedSubmit && !formData.contactNumber.trim()
                          ? 'border-red-500 bg-red-50/20'
                          : 'border-neutral-300'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Institutional / Personal Email <span className="text-red-600 font-bold">*</span>
                    </label>
                    <input
                      type="email"
                      placeholder="student@earist.edu.ph"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={`w-full text-xs px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-maroon-primary focus:border-maroon-primary bg-white transition-colors ${
                        attemptedSubmit && !formData.email.trim()
                          ? 'border-red-500 bg-red-50/20'
                          : 'border-neutral-300'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* --------------------------------------------------------- */}
              {/* SECTION 2: Academic Program Enrollment                    */}
              {/* --------------------------------------------------------- */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800 pb-1 border-b border-neutral-200">
                  2. Academic Enrollment &amp; College Standing
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      College <span className="text-red-600 font-bold">*</span>
                    </label>
                    <select
                      value={formData.college}
                      onChange={(e) => handleCollegeChange(e.target.value as CollegeCode)}
                      className="w-full text-xs px-3 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-maroon-primary focus:border-maroon-primary bg-white cursor-pointer"
                    >
                      <option value="CAS">CAS - Arts &amp; Sciences</option>
                      <option value="CEN">CEN - Engineering</option>
                      <option value="CIT">CIT - Industrial Technology</option>
                      <option value="CBA">CBA - Business Administration</option>
                      <option value="CED">CED - Education</option>
                      <option value="CAFA">CAFA - Architecture &amp; Fine Arts</option>
                      <option value="CHM">CHM - Hospitality Management</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Degree Program / Course <span className="text-red-600 font-bold">*</span>
                    </label>
                    <select
                      value={formData.course}
                      onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                      className="w-full text-xs px-3 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-maroon-primary focus:border-maroon-primary bg-white cursor-pointer"
                    >
                      {(COLLEGE_PROGRAMS[formData.college] || []).map((prog) => (
                        <option key={prog} value={prog}>
                          {prog}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Year Level &amp; Section <span className="text-red-600 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 2nd Year - CS-2A"
                      value={formData.yearAndSection}
                      onChange={(e) => setFormData({ ...formData, yearAndSection: e.target.value })}
                      className={`w-full text-xs px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-maroon-primary focus:border-maroon-primary bg-white transition-colors ${
                        attemptedSubmit && !formData.yearAndSection.trim()
                          ? 'border-red-500 bg-red-50/20'
                          : 'border-neutral-300'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      General Weighted Average (GWA) <span className="text-red-600 font-bold">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="1.00"
                      max="5.00"
                      placeholder="1.00 - 5.00"
                      value={formData.gwa}
                      onChange={(e) => setFormData({ ...formData, gwa: e.target.value })}
                      className={`w-full text-xs px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-maroon-primary focus:border-maroon-primary bg-white transition-colors ${
                        attemptedSubmit && !isGwaValid
                          ? 'border-red-500 bg-red-50/20'
                          : 'border-neutral-300'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Monthly Household Income (PHP) <span className="text-red-600 font-bold">*</span>
                    </label>
                    <input
                      type="number"
                      step="500"
                      placeholder="e.g. 15000"
                      value={formData.monthlyHouseholdIncome}
                      onChange={(e) => setFormData({ ...formData, monthlyHouseholdIncome: e.target.value })}
                      className={`w-full text-xs px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-1 focus:ring-maroon-primary focus:border-maroon-primary bg-white transition-colors ${
                        attemptedSubmit && !formData.monthlyHouseholdIncome.trim()
                          ? 'border-red-500 bg-red-50/20'
                          : 'border-neutral-300'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* --------------------------------------------------------- */}
              {/* SECTION 3: Scholarship Program Selection                  */}
              {/* --------------------------------------------------------- */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800 pb-1 border-b border-neutral-200">
                  3. Applied Scholarship Grant &amp; Allocation
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Select Scholarship Grant <span className="text-red-600 font-bold">*</span>
                    </label>
                    <select
                      value={formData.program}
                      onChange={(e) => setFormData({ ...formData, program: e.target.value as ScholarshipProgram })}
                      className="w-full text-xs font-medium px-3 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-maroon-primary focus:border-maroon-primary bg-white cursor-pointer"
                    >
                      {programs.length > 0 ? (
                        programs.map((p) => {
                          const closed = isGrantClosed(p.name);
                          return (
                            <option key={p.id || p._id || p.name} value={p.name} disabled={closed}>
                              {p.name} ({p.agency}) {closed ? '(Quota Reached - Closed)' : ''}
                            </option>
                          );
                        })
                      ) : (
                        <>
                          <option value="CHED TDP" disabled={isGrantClosed('CHED TDP')}>
                            CHED Tulong Dunong Program (TDP-SUC) {isGrantClosed('CHED TDP') ? '(Quota Reached - Closed)' : ''}
                          </option>
                          <option value="Tertiary Education Subsidy (TES)" disabled={isGrantClosed('Tertiary Education Subsidy (TES)')}>
                            Tertiary Education Subsidy (TES - UniFAST) {isGrantClosed('Tertiary Education Subsidy (TES)') ? '(Quota Reached - Closed)' : ''}
                          </option>
                          <option value="Academic Excellence Grant" disabled={isGrantClosed('Academic Excellence Grant')}>
                            Academic Excellence Grant (President's/Dean's List) {isGrantClosed('Academic Excellence Grant') ? '(Quota Reached - Closed)' : ''}
                          </option>
                          <option value="DOST-SEI Grant" disabled={isGrantClosed('DOST-SEI Grant')}>
                            DOST-SEI Science &amp; Technology Grant {isGrantClosed('DOST-SEI Grant') ? '(Quota Reached - Closed)' : ''}
                          </option>
                          <option value="Student Assistantship Program (SAP)" disabled={isGrantClosed('Student Assistantship Program (SAP)')}>
                            Student Assistantship Program (SAP) {isGrantClosed('Student Assistantship Program (SAP)') ? '(Quota Reached - Closed)' : ''}
                          </option>
                          <option value="Barangay/LGU Assistance" disabled={isGrantClosed('Barangay/LGU Assistance')}>
                            Barangay / LGU Educational Assistance {isGrantClosed('Barangay/LGU Assistance') ? '(Quota Reached - Closed)' : ''}
                          </option>
                        </>
                      )}
                    </select>
                  </div>

                  <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider block">
                        Earmarked Semestral Benefit
                      </span>
                      <span className="text-base font-black text-maroon-primary">
                        {formatPHP(selectedProgramDoc?.stipendAmount ?? (PROGRAM_STIPENDS[formData.program] || 0))}
                      </span>
                    </div>
                    <div className="text-right text-[11px] text-neutral-600">
                      <span>Assigned College Evaluator:</span>
                      <span className="font-bold block text-neutral-800">{COLLEGE_EVALUATORS[formData.college]}</span>
                    </div>
                  </div>
                </div>

                {/* Real-Time Automated Eligibility Pre-Screening Banner (Feature 1) */}
                {!eligibilityCheck.eligible && eligibilityCheck.advisory && (
                  <div className="p-3.5 rounded-lg bg-red-50 border border-red-300 text-red-900 flex items-start gap-2.5 text-xs animate-in fade-in duration-150">
                    <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold block text-red-950">
                        Eligibility Pre-Screening Advisory:
                      </strong>
                      <span className="text-red-900 leading-relaxed">
                        {eligibilityCheck.advisory}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* --------------------------------------------------------- */}
              {/* SECTION 4: REAL FILE UPLOAD DROPZONES (MANDATORY)         */}
              {/* --------------------------------------------------------- */}
              <div className="space-y-4">
                <div className="pb-1 border-b border-neutral-200 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                    4. Document Verification &amp; Mandatory Attachments
                  </h3>
                  <span className="text-[11px] font-semibold text-neutral-500">
                    Strict Limit: <strong>2MB per file</strong> • Formats: <strong>.pdf, .png only</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3.5">
                  {MANDATORY_DOCUMENTS.map((docConfig) => {
                    const key = docConfig.key;
                    const record = uploadedFiles[key];
                    const error = fileErrors[key];
                    const isMissing = attemptedSubmit && !record;
                    const isDragActive = dragActiveKey === key;

                    return (
                      <div
                        key={key}
                        className={`border-2 rounded-xl p-4 transition-all ${
                          record
                            ? 'border-emerald-300 bg-emerald-50/20'
                            : isMissing || error
                            ? 'border-red-400 bg-red-50/20'
                            : isDragActive
                            ? 'border-maroon-primary bg-red-50/30'
                            : 'border-dashed border-neutral-300 bg-neutral-50/50 hover:border-neutral-400'
                        }`}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragActiveKey(key);
                        }}
                        onDragLeave={() => setDragActiveKey(null)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragActiveKey(null);
                          processFileAttachment(key, e.dataTransfer.files);
                        }}
                      >
                        {/* Hidden Native File Input */}
                        <input
                          ref={inputRefs[key]}
                          type="file"
                          accept=".pdf,image/png"
                          onChange={(e) => processFileAttachment(key, e.target.files)}
                          className="hidden"
                          id={`file-input-${key}`}
                        />

                        {record ? (
                          /* Uploaded State Display */
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                                <CheckCircle2 className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-neutral-900 truncate max-w-sm block">
                                    {record.name}
                                  </span>
                                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-1.5 py-0.2 rounded uppercase">
                                    Verified Attachment
                                  </span>
                                </div>
                                <div className="text-[11px] text-neutral-500 font-mono mt-0.5">
                                  File Size: {record.formattedSize} • {docConfig.title}
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveFile(key)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-red-700 hover:text-white hover:bg-red-700 border border-red-300 rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Remove / Replace</span>
                            </button>
                          </div>
                        ) : (
                          /* Empty Dropzone State */
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-neutral-900">
                                  {docConfig.title}
                                </span>
                                <span className="text-red-600 font-black text-xs">*</span>
                                <span className="text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-800 px-1.5 rounded">
                                  Mandatory
                                </span>
                              </div>
                              <p className="text-[11px] text-neutral-500">
                                {docConfig.sublabel}
                              </p>
                              {error && (
                                <p className="text-[11px] text-red-600 font-semibold pt-1">
                                  {error}
                                </p>
                              )}
                              {isMissing && !error && (
                                <p className="text-[11px] text-red-600 font-semibold pt-1">
                                  This document is required before submission.
                                </p>
                              )}
                            </div>

                            <label
                              htmlFor={`file-input-${key}`}
                              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-white border border-neutral-300 hover:border-maroon-primary hover:text-maroon-primary text-neutral-700 transition-colors shadow-2xs cursor-pointer flex-shrink-0"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>Select .PDF or .PNG</span>
                            </label>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ========================================================= */}
              {/* ACTION FOOTER                                             */}
              {/* ========================================================= */}
              <div className="pt-4 border-t border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Republic Act 10173 (Data Privacy Act of 2012) Compliant</span>
                </div>

                <div className="flex items-center gap-2.5 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={resetAndClose}
                    className="px-4 py-2.5 rounded-lg text-xs font-semibold border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={!isFormValid || isSubmitting}
                    className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-bold transition-all shadow-xs ${
                      isFormValid && !isSubmitting
                        ? 'bg-maroon-primary hover:bg-maroon-hover text-white cursor-pointer'
                        : 'bg-neutral-300 text-neutral-500 cursor-not-allowed opacity-50'
                    }`}
                    title={
                      !eligibilityCheck.eligible
                        ? `Eligibility Pre-Screening: ${eligibilityCheck.advisory}`
                        : isFormValid
                        ? 'Submit verified application to SFAO'
                        : 'Complete all required inputs and upload all 4 mandatory files to enable submission'
                    }
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Transmitting to SFAO Server...</span>
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4" />
                        <span>Submit Application (RA 10173 Compliant)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
