import React, { useState, useMemo, useEffect, useRef } from 'react';
import type {
  ScholarshipApplication,
  ReportFilterState,
  ScholarshipStatus,
  ScholarshipProgram,
  ScholarshipProgramItem,
} from '../../types';
import {
  loadApplications,
  saveApplications,
  resetApplicationsToDefault,
  syncApplicationsWithApi,
} from '../../utils/storageUtils';
import { fetchScholarshipsApi } from '../../utils/api';
import { exportApplicationsToCSV } from '../../utils/exportUtils';
import { ScholarshipReportTable } from './ScholarshipReportTable';
import { ApplicationDetailsModal } from './ApplicationDetailsModal';
import { PrintReportModal } from './PrintReportModal';
import { SubmitApplicationModal } from './SubmitApplicationModal';
import { TrackApplicationModal } from './TrackApplicationModal';
import { ScholarshipAnalyticsTab } from './ScholarshipAnalyticsTab';
import { useAuth } from '../../context/AuthContext';
import {
  GraduationCap,
  Search,
  ArrowRight,
  ChevronRight,
  CheckCircle2,
  Award,
  Layers,
  ShieldCheck,
  Download,
  Printer,
  RotateCcw,
  Plus,
  PlusCircle,
  BarChart3,
  FileSpreadsheet,
  BookOpen,
  CheckCircle,
  Building,
  FileDown,
  ArrowLeft,
  FileCheck,
  AlertTriangle,
} from 'lucide-react';
import { UserProfileView } from '../profile/UserProfileView';

interface ScholarshipModuleProps {
  onBackToHome: () => void;
  initialCollegeFilter?: string;
}

export const ScholarshipModule: React.FC<ScholarshipModuleProps> = ({
  onBackToHome,
  initialCollegeFilter = 'All',
}) => {
  const { currentUser } = useAuth();

  // Primary Separation of Concerns: Default is Public Portal (or Evaluator if logged in)
  const [viewMode, setViewMode] = useState<'public' | 'evaluator'>(() => {
    return currentUser.role !== 'student' ? 'evaluator' : 'public';
  });

  // Application Data State - loaded from localStorage
  const [applications, setApplications] = useState<ScholarshipApplication[]>(() =>
    loadApplications()
  );

  // Active sub-tab inside Evaluator workspace
  const [evaluatorTab, setEvaluatorTab] = useState<
    'weekly-report' | 'analytics' | 'grants-directory' | 'guidelines'
  >('weekly-report');

  // Active catalog filter on Public view
  const [catalogCategory, setCatalogCategory] = useState<'all' | 'national' | 'institutional' | 'lgu'>('all');
  const [scholarshipPrograms, setScholarshipPrograms] = useState<ScholarshipProgramItem[]>([]);

  // Student portal active navigation tab
  const [studentTab, setStudentTab] = useState<'programs' | 'requirements' | 'profile'>('programs');
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  useEffect(() => {
    fetchScholarshipsApi()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setScholarshipPrograms(data);
        }
      })
      .catch((err) => console.warn('Could not load public scholarships:', err));
  }, []);

  const filteredCatalogPrograms = useMemo(() => {
    return scholarshipPrograms.filter((prog) => {
      if (catalogCategory === 'national') return prog.category === 'National Government';
      if (catalogCategory === 'institutional') return prog.category === 'Institutional';
      if (catalogCategory === 'lgu') return prog.category === 'LGU / Private';
      return true;
    });
  }, [scholarshipPrograms, catalogCategory]);

  // Filters State for evaluator table
  const [filters, setFilters] = useState<ReportFilterState>({
    startDate: '',
    endDate: '',
    program: 'All Programs',
    status: 'All',
    college:
      currentUser.role === 'evaluator' && currentUser.college
        ? currentUser.college
        : initialCollegeFilter === 'All'
        ? 'All Colleges'
        : initialCollegeFilter,
    searchQuery: '',
  });

  // Synchronize when authenticated role changes
  const prevUserRef = useRef(currentUser);
  useEffect(() => {
    if (prevUserRef.current !== currentUser) {
      prevUserRef.current = currentUser;
      if (currentUser.role === 'evaluator') {
        setViewMode('evaluator');
        if (currentUser.college) {
          setFilters((prev) => ({ ...prev, college: currentUser.college! }));
        }
      } else if (currentUser.role === 'superadmin') {
        setViewMode('evaluator');
      }
    }
  }, [currentUser]);

  // Sync applications from live server on mount
  useEffect(() => {
    syncApplicationsWithApi()
      .then((apps) => {
        if (apps && apps.length > 0) {
          setApplications(apps);
        }
      })
      .catch((err) => console.warn('Could not sync applications in ScholarshipModule:', err));
  }, []);

  // Modals visibility
  const [selectedApplication, setSelectedApplication] = useState<ScholarshipApplication | null>(null);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [trackModalOpen, setTrackModalOpen] = useState(false);
  const [initialTrackQuery, setInitialTrackQuery] = useState<string>('');
  const [preselectedProgram, setPreselectedProgram] = useState<ScholarshipProgram | undefined>(undefined);

  // Parse direct QR / URL tracking query (?track=APP-2026-XXXX or #scholarships?track=APP-2026-XXXX)
  useEffect(() => {
    const handleUrlTrack = () => {
      const hash = window.location.hash || '';
      const search = window.location.search || '';
      let trackRef: string | null = null;

      if (hash.includes('track=')) {
        const parts = hash.split('track=');
        if (parts[1]) {
          trackRef = decodeURIComponent(parts[1].split('&')[0]);
        }
      } else if (search.includes('track=')) {
        const params = new URLSearchParams(search);
        trackRef = params.get('track');
      }

      if (trackRef) {
        setInitialTrackQuery(trackRef);
        setTrackModalOpen(true);
      }
    };

    handleUrlTrack();
    window.addEventListener('hashchange', handleUrlTrack);
    return () => window.removeEventListener('hashchange', handleUrlTrack);
  }, []);

  // Batch Selection IDs
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Toast feedback message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Open Submit Modal with pre-selected program
  const handleOpenApplyModal = (program?: ScholarshipProgram) => {
    setPreselectedProgram(program);
    setSubmitModalOpen(true);
  };

  // Filter change handler
  const handleFilterChange = (key: keyof ReportFilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Reset Filters Handler
  const handleResetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      program: 'All Programs',
      status: 'All',
      college: 'All Colleges',
      searchQuery: '',
    });
    setSelectedIds([]);
  };

  const isFilterActive =
    filters.searchQuery.trim() !== '' ||
    filters.college !== 'All Colleges' ||
    filters.program !== 'All Programs' ||
    filters.status !== 'All';

  // Filtered applications list
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      if (filters.program !== 'All' && filters.program !== 'All Programs') {
        if (app.program !== filters.program) {
          return false;
        }
      }
      if (filters.status !== 'All' && app.status !== filters.status) return false;
      if (filters.college !== 'All' && filters.college !== 'All Colleges' && app.college !== filters.college) {
        return false;
      }
      if (filters.searchQuery.trim() !== '') {
        const query = filters.searchQuery.toLowerCase();
        const matchName = app.studentName.toLowerCase().includes(query);
        const matchStudentId = app.studentId.toLowerCase().includes(query);
        const matchAppId = app.id.toLowerCase().includes(query);
        const matchCourse = app.course.toLowerCase().includes(query);
        if (!matchName && !matchStudentId && !matchAppId && !matchCourse) {
          return false;
        }
      }
      return true;
    });
  }, [applications, filters]);

  // Quota Capacity Limits (Strictly Enforced on Approved Grants)
  const quotaStats = useMemo(() => {
    const tesApproved = applications.filter(
      (a) => a.program.includes('TES') && a.status === 'Approved'
    ).length;
    const tdpApproved = applications.filter(
      (a) => a.program.includes('TDP') && a.status === 'Approved'
    ).length;
    const dostApproved = applications.filter(
      (a) => a.program.includes('DOST') && a.status === 'Approved'
    ).length;
    const honorApproved = applications.filter(
      (a) => a.program.includes('Academic') && a.status === 'Approved'
    ).length;
    const saApproved = applications.filter(
      (a) => (a.program.includes('Assistantship') || a.program.includes('SAP')) && a.status === 'Approved'
    ).length;

    return {
      tes: { filled: Math.min(50, 47 + tesApproved), max: 50 },
      tdp: { filled: Math.min(40, 37 + tdpApproved), max: 40 },
      dost: { filled: Math.min(20, 18 + dostApproved), max: 20 },
      honor: { filled: Math.min(25, 22 + honorApproved), max: 25 },
      sa: { filled: Math.min(20, 17 + saApproved), max: 20 },
    };
  }, [applications]);

  // Status counts for Segmented Tabs
  const statusCounts = useMemo(() => {
    const counts = {
      All: applications.length,
      'Pending Review': 0,
      Endorsed: 0,
      Approved: 0,
      Flagged: 0,
    };
    applications.forEach((a) => {
      if (counts[a.status] !== undefined) {
        counts[a.status]++;
      }
    });
    return counts;
  }, [applications]);

  // Quick update status in list
  const handleQuickUpdateStatus = (id: string, newStatus: ScholarshipStatus) => {
    const updated = applications.map((app) => {
      if (app.id === id) {
        const auditLog = {
          id: `audit-${Date.now()}`,
          evaluatorName: currentUser.name,
          role: currentUser.title,
          action: `Status Changed to ${newStatus}`,
          remarks: `Action recorded in SFAO masterlist by ${currentUser.name}.`,
          timestamp: new Date().toISOString(),
        };
        return {
          ...app,
          status: newStatus,
          auditTrail: [auditLog, ...(app.auditTrail || [])],
          lastUpdated: new Date().toISOString(),
        };
      }
      return app;
    });
    setApplications(updated);
    saveApplications(updated);
    setToastMessage(`Application ${id} status updated to ${newStatus}.`);
  };

  // Full application update from details modal
  const handleUpdateApplication = (updatedApp: ScholarshipApplication) => {
    const updated = applications.map((app) => (app.id === updatedApp.id ? updatedApp : app));
    setApplications(updated);
    saveApplications(updated);
    setSelectedApplication(updatedApp);
    setToastMessage(`Application ${updatedApp.id} changes saved successfully.`);
  };

  // New application submitted
  const handleNewApplicationSubmitted = (newApp: ScholarshipApplication) => {
    const updated = [newApp, ...applications];
    setApplications(updated);
    saveApplications(updated);
    setToastMessage(`New application ${newApp.id} for ${newApp.studentName} created.`);
  };

  // Reset to default seed records
  const handleResetToDefault = () => {
    setIsResetConfirmOpen(true);
  };

  const executeResetToDefault = () => {
    const reset = resetApplicationsToDefault();
    setApplications(reset);
    setSelectedIds([]);
    setIsResetConfirmOpen(false);
    setToastMessage('Scholarship database restored to initial official state.');
  };

  // Batch Selection Handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = (visibleIds: string[]) => {
    if (visibleIds.length === 0) {
      setSelectedIds([]);
      return;
    }
    const allVisibleSelected = visibleIds.every((id) => selectedIds.includes(id));
    if (allVisibleSelected) {
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleBatchUpdateStatus = (newStatus: ScholarshipStatus) => {
    if (selectedIds.length === 0) return;
    const updated = applications.map((app) => {
      if (selectedIds.includes(app.id)) {
        const auditLog = {
          id: `audit-${Date.now()}-${app.id}`,
          evaluatorName: currentUser.name,
          role: currentUser.title,
          action: `Batch Mutated to ${newStatus}`,
          remarks: `Bulk batch operation performed by ${currentUser.name}.`,
          timestamp: new Date().toISOString(),
        };
        return {
          ...app,
          status: newStatus,
          auditTrail: [auditLog, ...(app.auditTrail || [])],
          lastUpdated: new Date().toISOString(),
        };
      }
      return app;
    });
    setApplications(updated);
    saveApplications(updated);
    setToastMessage(
      `Batch action applied: ${selectedIds.length} candidate(s) marked as ${newStatus}.`
    );
    setSelectedIds([]);
  };

  const handleExportSelected = () => {
    const selectedApps = applications.filter((app) => selectedIds.includes(app.id));
    exportApplicationsToCSV(
      selectedApps,
      { start: '2026-01-01', end: '2026-12-31' },
      `${selectedApps.length}_Selected_CHED_Masterlist`
    );
  };

  const handleExportCSV = () => {
    exportApplicationsToCSV(
      filteredApplications,
      { start: '2026-01-01', end: '2026-12-31' },
      `CHED_UniFAST_Disbursement_Masterlist_${filters.college}`
    );
  };

  // Download simulation for official forms
  const handleDownloadForm = (formTitle: string) => {
    const content = `Republic of the Philippines\nEULOGIO 'AMANG' RODRIGUEZ INSTITUTE OF SCIENCE AND TECHNOLOGY\nOffice of Student Financial Assistance (SFAO)\nNagtahan, Sampaloc, Manila\n\nOfficial Template: ${formTitle}\nAcademic Year 2026-2027\n\nInstructions: Fill out this document legibly and have it notarized or certified by the required authorities before uploading to the e-SFAO portal.`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${formTitle.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setToastMessage(`Downloaded official template: ${formTitle}`);
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-20 font-sans text-neutral-900">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-900 text-white px-4 py-3 rounded-lg shadow-2xl border border-neutral-700 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW A: AUTHENTIC PUBLIC-FACING STUDENT SCHOLARSHIP PORTAL (DEFAULT)     */}
      {/* ========================================================================= */}
      {viewMode === 'public' && (
        <div>
          {/* Sub-Header Navigation Toolbar (Replaces sidebar & duplicate dashboard header) */}
          <div className="bg-white border-b border-neutral-200 sticky top-0 z-10 shadow-2xs">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
              {/* Left: View Tabs */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStudentTab('programs')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    studentTab === 'programs'
                      ? 'bg-maroon-primary text-white shadow-xs'
                      : 'text-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Scholarship Programs</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStudentTab('requirements')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    studentTab === 'requirements'
                      ? 'bg-maroon-primary text-white shadow-xs'
                      : 'text-neutral-700 hover:bg-neutral-100'
                  }`}
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Requirements Checklist</span>
                </button>
              </div>

              {/* Right: Quick Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenApplyModal()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-maroon-primary hover:bg-maroon-hover text-white shadow-2xs transition-colors cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Apply Online</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTrackModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium text-neutral-700 bg-white hover:bg-neutral-50 border border-neutral-300 transition-colors cursor-pointer shadow-2xs"
                >
                  <Search className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Track Status</span>
                </button>
                <button
                  type="button"
                  onClick={onBackToHome}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-800 transition-colors cursor-pointer ml-1"
                  title="Back to EARIST Homepage"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Homepage</span>
                </button>
              </div>
            </div>
          </div>

          {/* Full-Width Main Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            {studentTab === 'profile' ? (
              <UserProfileView />
            ) : (
              <>
            {/* Quick Hero Banner in Main Area */}
            <div className="bg-gradient-to-br from-maroon-primary via-maroon-dark to-maroon-deep text-white rounded-2xl p-6 sm:p-8 shadow-xs border-b-4 border-gold-accent space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-gold-light text-xs font-bold uppercase tracking-wider">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>OFFICIAL SFAO STUDENT APPLICATION PORTAL • A.Y. 2026–2027</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight font-sans">
                Campus Scholarship &amp; Financial Assistance Services
              </h2>
              <p className="text-xs sm:text-sm text-white/90 max-w-2xl leading-relaxed">
                Empowering bona fide Red Foxes through equitable access to tertiary education under Republic Act 10931 (CHED UniFAST), institutional academic honors, and student assistantships.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleOpenApplyModal()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-white text-maroon-primary hover:bg-gold-primary hover:text-maroon-deep shadow-sm transition-all cursor-pointer"
                >
                  <GraduationCap className="w-4 h-4 text-maroon-primary" />
                  <span>Apply for Scholarship Online</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTrackModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-transparent border border-white text-white hover:bg-white hover:text-maroon-primary transition-all cursor-pointer"
                >
                  <Search className="w-4 h-4 text-gold-light" />
                  <span>Track Application Status</span>
                </button>
              </div>
            </div>

            {/* TAB 1: PROGRAMS */}
            {studentTab === 'programs' && (
              <>
                {/* 2. 4-STEP APPLICATION PROCEDURE (INFOGRAPHIC WORKFLOW) */}
            <section className="space-y-6">
              <div className="text-center max-w-2xl mx-auto space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-widest text-maroon-primary block">
                  Application Guidelines &amp; Roadmap
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight font-sans">
                  4-Step Scholarship Application Procedure
                </h2>
                <p className="text-xs text-neutral-600">
                  Follow this official institutional workflow to prepare, file, and track your educational grant dossier.
                </p>
              </div>

              {/* 4-Column Step Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Step 1 */}
                <div className="bg-white rounded-xl p-5 border border-neutral-200 shadow-xs space-y-3 relative overflow-hidden group hover:border-maroon-primary transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-maroon-subtle text-maroon-primary font-black text-base flex items-center justify-center border border-red-200">
                    1
                  </div>
                  <h3 className="text-sm font-bold text-neutral-900">
                    Check Qualifications
                  </h3>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    Review statutory GWA requirements (≥ 2.50) and low-income / indigency criteria specified for your target grant program.
                  </p>
                  <div className="pt-2 text-[10px] font-bold text-maroon-primary uppercase tracking-wider flex items-center gap-1">
                    <span>Step 01 • Review Criteria</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* Step 2 */}
                <div className="bg-white rounded-xl p-5 border border-neutral-200 shadow-xs space-y-3 relative overflow-hidden group hover:border-maroon-primary transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 text-maroon-primary font-black text-base flex items-center justify-center border border-amber-200">
                    2
                  </div>
                  <h3 className="text-sm font-bold text-neutral-900">
                    Prepare Documents
                  </h3>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    Scan official COR, certified Grade Slip, and Barangay Indigency Certificate. Ensure all files are PDF/PNG under 2MB.
                  </p>
                  <div className="pt-2 text-[10px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">
                    <span>Step 02 • Clear Scans</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* Step 3 */}
                <div className="bg-white rounded-xl p-5 border border-neutral-200 shadow-xs space-y-3 relative overflow-hidden group hover:border-maroon-primary transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-800 font-black text-base flex items-center justify-center border border-sky-200">
                    3
                  </div>
                  <h3 className="text-sm font-bold text-neutral-900">
                    Submit Application
                  </h3>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    Fill out the online application form on this portal and attach required credentials before institutional quota deadlines.
                  </p>
                  <div className="pt-2 text-[10px] font-bold text-sky-700 uppercase tracking-wider flex items-center gap-1">
                    <span>Step 03 • e-Filing</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* Step 4 */}
                <div className="bg-white rounded-xl p-5 border border-neutral-200 shadow-xs space-y-3 relative overflow-hidden group hover:border-maroon-primary transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-800 font-black text-base flex items-center justify-center border border-emerald-200">
                    4
                  </div>
                  <h3 className="text-sm font-bold text-neutral-900">
                    Evaluation &amp; Masterlist
                  </h3>
                  <p className="text-xs text-neutral-600 leading-relaxed">
                    College SFAO evaluators review your dossier for CHED UniFAST voucher endorsement or institutional stipend disbursement.
                  </p>
                  <div className="pt-2 text-[10px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                    <span>Step 04 • Verification</span>
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  </div>
                </div>
              </div>
            </section>

            {/* ========================================================================= */}
            {/* 3. SCHOLARSHIP PROGRAMS CATALOG (INTERACTIVE CARDS GRID)                 */}
            {/* ========================================================================= */}
            <section className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-neutral-200">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-maroon-primary block">
                    Available Financial Assistance
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight font-sans">
                    Scholarship Programs Catalog
                  </h2>
                  <p className="text-xs text-neutral-600 max-w-xl">
                    Select a grant portfolio to review eligibility requirements and submit an online application dossier.
                  </p>
                </div>

                {/* Category Segmented Tabs */}
                <div className="flex items-center gap-1.5 flex-wrap text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setCatalogCategory('all')}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      catalogCategory === 'all'
                        ? 'bg-maroon-primary text-white shadow-xs'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    }`}
                  >
                    All Programs (8)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCatalogCategory('national')}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      catalogCategory === 'national'
                        ? 'bg-maroon-primary text-white shadow-xs'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    }`}
                  >
                    National Government
                  </button>
                  <button
                    type="button"
                    onClick={() => setCatalogCategory('institutional')}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      catalogCategory === 'institutional'
                        ? 'bg-maroon-primary text-white shadow-xs'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    }`}
                  >
                    Institutional Grants
                  </button>
                  <button
                    type="button"
                    onClick={() => setCatalogCategory('lgu')}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      catalogCategory === 'lgu'
                        ? 'bg-maroon-primary text-white shadow-xs'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    }`}
                  >
                    LGU &amp; Private
                  </button>
                </div>
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCatalogPrograms.length === 0 ? (
                  <div className="col-span-full py-16 text-center text-neutral-400">
                    <GraduationCap className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-neutral-700">No active scholarship programs found in this category.</p>
                    <p className="text-xs text-neutral-500 mt-1">Please check back soon for upcoming institutional intake cycles.</p>
                  </div>
                ) : (
                  filteredCatalogPrograms.map((prog) => {
                    const isLocked =
                      prog.isLocked ||
                      (prog.allocatedSlots !== undefined &&
                        prog.totalSlots !== undefined &&
                        prog.allocatedSlots >= prog.totalSlots);

                    return (
                      <div
                        key={prog.id || prog._id || prog.name}
                        className="bg-white rounded-xl border border-neutral-200 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow"
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                                prog.category === 'National Government'
                                  ? 'bg-purple-50 text-purple-800 border-purple-200'
                                  : prog.category === 'Institutional'
                                  ? 'bg-amber-50 text-amber-900 border-amber-200'
                                  : 'bg-blue-50 text-blue-800 border-blue-200'
                              }`}
                            >
                              {prog.category} • {prog.agency}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                isLocked
                                  ? 'bg-red-50 text-red-700 border-red-200'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}
                            >
                              {isLocked ? 'Quota Reached' : 'Active Intake'}
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-neutral-900 leading-snug">
                            {prog.name}
                          </h3>
                          <div className="text-lg font-black text-maroon-primary font-mono">
                            PHP {Number(prog.stipendAmount).toLocaleString()}{' '}
                            <span className="text-xs font-normal text-neutral-500 font-sans">
                              / Semester
                            </span>
                          </div>
                          <p className="text-xs text-neutral-600 leading-relaxed">
                            {prog.description}
                          </p>
                          <div className="space-y-1 text-xs text-neutral-700 pt-1 border-t border-neutral-100">
                            <span className="font-bold text-[11px] text-neutral-800 block">
                              Minimum Qualifications:
                            </span>
                            <ul className="space-y-0.5 text-[11px] list-disc list-inside text-neutral-600">
                              <li>General Weighted Average (GWA) &le; {Number(prog.maxGwa).toFixed(2)}</li>
                              {prog.maxMonthlyIncome !== null && prog.maxMonthlyIncome !== undefined ? (
                                <li>
                                  Monthly Household Income &le; PHP {Number(prog.maxMonthlyIncome).toLocaleString()}
                                </li>
                              ) : (
                                <li>No statutory household income cap</li>
                              )}
                              <li>Enrolled bona fide undergraduate student</li>
                            </ul>
                          </div>
                          {prog.totalSlots && (
                            <div className="pt-1 text-[11px] text-neutral-500 flex items-center justify-between">
                              <span>Intake Capacity:</span>
                              <span className="font-bold text-neutral-700 font-mono">
                                {prog.remainingSlots !== undefined
                                  ? `${prog.remainingSlots} of ${prog.totalSlots} slots remaining`
                                  : `${prog.totalSlots} slots total`}
                              </span>
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleOpenApplyModal(prog.name)}
                          className="w-full py-2.5 px-4 rounded-lg font-bold text-xs uppercase tracking-wider bg-maroon-primary hover:bg-maroon-hover text-white shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <span>Apply for Grant</span>
                          <ArrowRight className="w-3.5 h-3.5 text-gold-light" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </>
        )}

        {/* TAB 2: REQUIREMENTS */}
        {studentTab === 'requirements' && (
          <section className="bg-white rounded-xl border border-neutral-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="pb-4 border-b border-neutral-200 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-widest text-maroon-primary block">
                Official Verification Protocol
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight font-sans">
                Requirements &amp; Submission Guidelines
              </h2>
              <p className="text-xs text-neutral-600">
                Ensure all requirements comply with document upload thresholds and statutory privacy policies.
              </p>
            </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left 7 Cols: Checklist & Data Privacy */}
                <div className="lg:col-span-7 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                    General Document Checklist:
                  </h3>
                  <div className="space-y-2 text-xs text-neutral-700">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Certificate of Registration (COR):</strong> Must be for the current Academic Year (1st or 2nd Semester) bearing the official college dry seal.
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Certified Copy of Grades (Grade Slip):</strong> With official stamp from the College Registrar showing a GWA of 2.50 or higher with no unremoved failing grades.
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Barangay Certificate of Indigency:</strong> Issued within the current calendar year (2026), declaring household income or 4Ps Listahanan certification.
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Good Moral Character Certificate:</strong> Issued by the Office of Student Affairs (OSA) or previous school institution.
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Valid Student ID:</strong> Back-to-back scan of active EARIST identification card or Philippine National ID.
                      </div>
                    </div>
                  </div>

                  {/* Data Privacy Act Notice */}
                  <div className="bg-amber-50/80 rounded-lg p-3.5 border border-amber-200 text-xs text-neutral-700 space-y-1">
                    <span className="font-bold text-amber-950 flex items-center gap-1.5 text-xs">
                      <ShieldCheck className="w-4 h-4 text-maroon-primary" />
                      <span>RA 10173 Data Privacy Compliance Notice</span>
                    </span>
                    <p className="text-[11px] text-amber-900 leading-relaxed font-medium">
                      In compliance with the Data Privacy Act of 2012 (Republic Act No. 10173), all personal data and academic records collected through this portal will be handled with strict confidentiality and used exclusively for scholarship evaluation and CHED UniFAST masterlist generation.
                    </p>
                  </div>

                  {/* Upload Specs */}
                  <div className="text-[11px] text-neutral-500 bg-neutral-50 p-2.5 rounded border border-neutral-200">
                    <strong>Upload Specifications:</strong> Portable Document Format (PDF) and High-Resolution PNG/JPEG only. Maximum file size is strictly <strong>2MB per document</strong>.
                  </div>
                </div>

                {/* Right 5 Cols: Downloadable Forms */}
                <div className="lg:col-span-5 bg-neutral-50 rounded-xl p-5 border border-neutral-200 space-y-4">
                  <div className="flex items-center gap-2">
                    <FileDown className="w-4 h-4 text-maroon-primary" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                      Downloadable Forms &amp; Templates
                    </h3>
                  </div>
                  <p className="text-[11px] text-neutral-600">
                    Download official SFAO forms before filing. Completed forms must be signed and scanned.
                  </p>

                  <div className="space-y-2.5">
                    {/* Form 1 */}
                    <div className="bg-white p-3 rounded-lg border border-neutral-200 flex items-center justify-between gap-3 shadow-2xs">
                      <div>
                        <span className="font-bold text-xs text-neutral-900 block">
                          SFAO General Scholarship Application Form
                        </span>
                        <span className="text-[10px] text-neutral-500">Official Intake Form 1 • PDF (180 KB)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDownloadForm('EARIST_SFAO_Form_1_Application')}
                        className="px-2.5 py-1.5 rounded bg-neutral-100 hover:bg-maroon-primary hover:text-white text-xs font-bold text-neutral-700 transition-colors cursor-pointer"
                        title="Download form"
                      >
                        Download
                      </button>
                    </div>

                    {/* Form 2 */}
                    <div className="bg-white p-3 rounded-lg border border-neutral-200 flex items-center justify-between gap-3 shadow-2xs">
                      <div>
                        <span className="font-bold text-xs text-neutral-900 block">
                          Certificate of Indigency &amp; Income Template
                        </span>
                        <span className="text-[10px] text-neutral-500">Barangay Clearance Guide • PDF (120 KB)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDownloadForm('Template_Barangay_Indigency_Certificate')}
                        className="px-2.5 py-1.5 rounded bg-neutral-100 hover:bg-maroon-primary hover:text-white text-xs font-bold text-neutral-700 transition-colors cursor-pointer"
                        title="Download template"
                      >
                        Download
                      </button>
                    </div>

                    {/* Form 3 */}
                    <div className="bg-white p-3 rounded-lg border border-neutral-200 flex items-center justify-between gap-3 shadow-2xs">
                      <div>
                        <span className="font-bold text-xs text-neutral-900 block">
                          Student Assistantship Duty Shift Form
                        </span>
                        <span className="text-[10px] text-neutral-500">SAP Weekly Log Template • PDF (140 KB)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDownloadForm('Template_SAP_Duty_Shift_Schedule')}
                        className="px-2.5 py-1.5 rounded bg-neutral-100 hover:bg-maroon-primary hover:text-white text-xs font-bold text-neutral-700 transition-colors cursor-pointer"
                        title="Download template"
                      >
                        Download
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* SFAO Directory & Helpdesk Footer */}
          <section className="bg-white rounded-xl p-5 border border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-neutral-600 shadow-2xs">
            <div className="flex items-center gap-3">
              <Building className="w-5 h-5 text-maroon-primary flex-shrink-0" />
              <div>
                <span className="font-bold text-neutral-900 block">
                  Office of Student Financial Assistance (SFAO) Helpdesk
                </span>
                <span>Room 204, 2nd Floor Main Admin Building, Nagtahan, Sampaloc, Manila 1008</span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-neutral-700 flex-shrink-0">
              <span><strong>Hours:</strong> Mon–Fri 8:00 AM – 5:00 PM</span>
              <span>•</span>
              <span><strong>Email:</strong> sfao@earist.edu.ph</span>
            </div>
          </section>
              </>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW B: STAFF & EVALUATOR WORKSPACE (ACCESSED VIA EVALUATOR LOGIN)        */}
      {/* ========================================================================= */}
      {viewMode === 'evaluator' && (
        <div>
          {/* Header Bar with Back Button */}
          <div className="bg-white border-b border-neutral-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-5">
              {/* Top Navigation Row */}
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-neutral-100">
                <nav className="flex items-center gap-1.5 text-xs text-neutral-500 select-none">
                  <button
                    onClick={() => setViewMode('public')}
                    className="hover:text-maroon-primary font-medium transition-colors"
                  >
                    Public SFAO Portal
                  </button>
                  <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="font-semibold text-maroon-primary">Staff &amp; Evaluator Workspace</span>
                </nav>

                {/* Back to Public View Button */}
                <button
                  type="button"
                  onClick={() => setViewMode('public')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-neutral-700 hover:text-maroon-primary bg-neutral-100 hover:bg-maroon-subtle border border-neutral-200 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-maroon-primary" />
                  <span>← Return to Public Student Portal</span>
                </button>
              </div>

              {/* Title & Role Info */}
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5 pt-4">
                <div className="space-y-1.5 max-w-3xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight font-sans">
                      Scholarship Applications &amp; Quota Management
                    </h1>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Logged in: {currentUser.title} ({currentUser.name})</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        window.location.hash = 'login';
                      }}
                      className="text-[11px] font-bold text-maroon-primary hover:underline px-2 py-0.5 rounded bg-white border border-neutral-300 shadow-2xs cursor-pointer"
                    >
                      Sign out / Switch Role
                    </button>
                    {currentUser.college && (
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded border border-emerald-300">
                        Department Scoped: SFAO-{currentUser.college}
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed font-normal">
                    Official SFAO evaluation portal for verifying requirements, managing grant quotas, and generating CHED UniFAST disbursement masterlists.
                  </p>
                </div>

                {/* Masterlist Action Buttons */}
                <div className="flex items-center gap-2.5 flex-wrap flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenApplyModal()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-maroon-primary hover:bg-maroon-hover text-white shadow-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-gold-light" />
                    <span>+ New Application</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-700 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-neutral-500" />
                    <span>Export Masterlist (CSV / Excel)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPrintModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-700 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-neutral-500" />
                    <span>Print Official Rollup</span>
                  </button>
                </div>
              </div>

              {/* Sub-tabs inside Evaluator Workspace */}
              <div className="flex items-center gap-1 mt-5 border-b border-neutral-200 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setEvaluatorTab('weekly-report')}
                  className={`px-4 py-2.5 border-b-2 transition-all flex items-center gap-2 ${
                    evaluatorTab === 'weekly-report'
                      ? 'border-maroon-primary text-maroon-primary'
                      : 'border-transparent text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Evaluation Masterlist</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-neutral-100 text-neutral-700">
                    {filteredApplications.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setEvaluatorTab('analytics')}
                  className={`px-4 py-2.5 border-b-2 transition-all flex items-center gap-2 ${
                    evaluatorTab === 'analytics'
                      ? 'border-maroon-primary text-maroon-primary'
                      : 'border-transparent text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>College Quota Analytics</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEvaluatorTab('grants-directory')}
                  className={`px-4 py-2.5 border-b-2 transition-all flex items-center gap-2 ${
                    evaluatorTab === 'grants-directory'
                      ? 'border-maroon-primary text-maroon-primary'
                      : 'border-transparent text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <Award className="w-4 h-4" />
                  <span>Programs Directory</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEvaluatorTab('guidelines')}
                  className={`px-4 py-2.5 border-b-2 transition-all flex items-center gap-2 ${
                    evaluatorTab === 'guidelines'
                      ? 'border-maroon-primary text-maroon-primary'
                      : 'border-transparent text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Audit Guidelines</span>
                </button>
              </div>
            </div>
          </div>

          {/* Evaluator Workspace Main Container */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
            {evaluatorTab === 'weekly-report' && (
              <>
                {/* Quota Capacity Bar */}
                <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-xs space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-neutral-100">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-maroon-primary" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800">
                        Grant Allocation Quota Capacity (Real-Time Slot Limits)
                      </h3>
                    </div>
                    <span className="text-[11px] text-neutral-500 font-medium">
                      Prevents over-allocation under CHED UniFAST &amp; State College statutory limits
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                    <div className="bg-neutral-50/80 rounded-lg p-3 border border-neutral-200/80 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-neutral-800">
                        <span>TES (UniFAST)</span>
                        <span className="text-rose-700 text-[11px]">
                          {Math.round((quotaStats.tes.filled / quotaStats.tes.max) * 100)}%
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-neutral-200 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-maroon-primary transition-all duration-300"
                          style={{
                            width: `${Math.round((quotaStats.tes.filled / quotaStats.tes.max) * 100)}%`,
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-neutral-500 font-medium">
                        <span>{quotaStats.tes.filled}/{quotaStats.tes.max} slots filled</span>
                        <span className="text-[10px] text-amber-700 font-semibold">Near Cap</span>
                      </div>
                    </div>

                    <div className="bg-neutral-50/80 rounded-lg p-3 border border-neutral-200/80 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-neutral-800">
                        <span>TDP-SUC</span>
                        <span className="text-sky-700 text-[11px]">
                          {Math.round((quotaStats.tdp.filled / quotaStats.tdp.max) * 100)}%
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-neutral-200 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-sky-600 transition-all duration-300"
                          style={{
                            width: `${Math.round((quotaStats.tdp.filled / quotaStats.tdp.max) * 100)}%`,
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-neutral-500 font-medium">
                        <span>{quotaStats.tdp.filled}/{quotaStats.tdp.max} slots filled</span>
                        <span className="text-[10px] text-emerald-700 font-semibold">Available</span>
                      </div>
                    </div>

                    <div className="bg-neutral-50/80 rounded-lg p-3 border border-neutral-200/80 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-neutral-800">
                        <span>DOST-SEI</span>
                        <span className="text-emerald-700 text-[11px]">
                          {Math.round((quotaStats.dost.filled / quotaStats.dost.max) * 100)}%
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-neutral-200 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-600 transition-all duration-300"
                          style={{
                            width: `${Math.round((quotaStats.dost.filled / quotaStats.dost.max) * 100)}%`,
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-neutral-500 font-medium">
                        <span>{quotaStats.dost.filled}/{quotaStats.dost.max} slots filled</span>
                        <span className="text-[10px] text-emerald-700 font-semibold">Available</span>
                      </div>
                    </div>

                    <div className="bg-neutral-50/80 rounded-lg p-3 border border-neutral-200/80 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-neutral-800">
                        <span>Academic Honor</span>
                        <span className="text-amber-700 text-[11px]">
                          {Math.round((quotaStats.honor.filled / quotaStats.honor.max) * 100)}%
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-neutral-200 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-amber-500 transition-all duration-300"
                          style={{
                            width: `${Math.round((quotaStats.honor.filled / quotaStats.honor.max) * 100)}%`,
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-neutral-500 font-medium">
                        <span>{quotaStats.honor.filled}/{quotaStats.honor.max} slots filled</span>
                        <span className="text-[10px] text-emerald-700 font-semibold">Available</span>
                      </div>
                    </div>

                    <div className="bg-neutral-50/80 rounded-lg p-3 border border-neutral-200/80 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-neutral-800">
                        <span>Student Assistantship</span>
                        <span className="text-neutral-700 text-[11px]">
                          {Math.round((quotaStats.sa.filled / quotaStats.sa.max) * 100)}%
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-neutral-200 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-neutral-700 transition-all duration-300"
                          style={{
                            width: `${Math.round((quotaStats.sa.filled / quotaStats.sa.max) * 100)}%`,
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-neutral-500 font-medium">
                        <span>{quotaStats.sa.filled}/{quotaStats.sa.max} slots filled</span>
                        <span className="text-[10px] text-emerald-700 font-semibold">Available</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Search & Filter Toolbar */}
                <div className="bg-white rounded-xl border border-neutral-200 p-4 shadow-xs space-y-3.5">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                    <div className="md:col-span-6 relative">
                      <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={filters.searchQuery}
                        onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
                        placeholder="Search by Student Name, Student ID (e.g., 2023-XXXXX-MN-0), or Application No..."
                        className="w-full text-xs pl-9 pr-8 py-2.5 bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-maroon-primary focus:border-maroon-primary transition-colors"
                      />
                      {filters.searchQuery && (
                        <button
                          type="button"
                          onClick={() => handleFilterChange('searchQuery', '')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                        >
                          ×
                        </button>
                      )}
                    </div>

                    <div className="md:col-span-3">
                      <select
                        value={filters.college}
                        onChange={(e) => handleFilterChange('college', e.target.value)}
                        className="w-full text-xs py-2.5 px-3 bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-800 focus:outline-none focus:ring-1 focus:ring-maroon-primary focus:border-maroon-primary cursor-pointer"
                      >
                        <option value="All Colleges">All Colleges</option>
                        <option value="CAS">CAS (Arts and Sciences)</option>
                        <option value="CBA">CBA (Business Administration)</option>
                        <option value="CED">CED (Education)</option>
                        <option value="CIT">CIT (Industrial Technology)</option>
                        <option value="CEN">CEN (Engineering)</option>
                        <option value="CAFA">CAFA (Architecture &amp; Fine Arts)</option>
                        <option value="CHM">CHM (Hospitality Management)</option>
                      </select>
                    </div>

                    <div className="md:col-span-3">
                      <select
                        value={filters.program}
                        onChange={(e) => handleFilterChange('program', e.target.value)}
                        className="w-full text-xs py-2.5 px-3 bg-neutral-50 border border-neutral-300 rounded-lg text-neutral-800 focus:outline-none focus:ring-1 focus:ring-maroon-primary focus:border-maroon-primary cursor-pointer"
                      >
                        <option value="All Programs">All Programs</option>
                        {scholarshipPrograms.length > 0 ? (
                          scholarshipPrograms.map((prog) => (
                            <option key={prog.id || prog._id || prog.name} value={prog.name}>
                              {prog.name}
                            </option>
                          ))
                        ) : (
                          <>
                            <option value="Tertiary Education Subsidy (TES)">CHED UniFAST TES</option>
                            <option value="CHED TDP">CHED TDP</option>
                            <option value="DOST-SEI Grant">DOST-SEI Grant</option>
                            <option value="Academic Excellence Grant">Academic Excellence Grant</option>
                            <option value="Student Assistantship Program (SAP)">Student Assistantship Program (SAP)</option>
                            <option value="Barangay/LGU Assistance">Barangay/LGU Assistance</option>
                          </>
                        )}
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-neutral-100">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {(['All', 'Pending Review', 'Endorsed', 'Approved', 'Flagged'] as const).map(
                        (statusKey) => {
                          const isActive = filters.status === statusKey;
                          const count = statusCounts[statusKey];
                          return (
                            <button
                              key={statusKey}
                              type="button"
                              onClick={() => handleFilterChange('status', statusKey)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                isActive
                                  ? 'bg-maroon-primary text-white shadow-xs'
                                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200/80'
                              }`}
                            >
                              <span>{statusKey}</span>
                              <span
                                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                                  isActive
                                    ? 'bg-white/20 text-white'
                                    : 'bg-neutral-200 text-neutral-700'
                                }`}
                              >
                                {count}
                              </span>
                            </button>
                          );
                        }
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-neutral-500">
                        <strong className="text-neutral-900">{filteredApplications.length}</strong> matching candidate records
                      </span>
                      {isFilterActive && (
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="text-xs font-semibold text-maroon-primary hover:text-maroon-hover hover:underline flex items-center gap-1"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Reset Filters</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleResetToDefault}
                        className="text-[11px] font-medium text-neutral-400 hover:text-neutral-600 ml-1"
                        title="Restore demo dataset"
                      >
                        Restore Demo Seed
                      </button>
                    </div>
                  </div>
                </div>

                {/* Enterprise Data Table */}
                <ScholarshipReportTable
                  applications={filteredApplications}
                  onViewDetails={(app) => setSelectedApplication(app)}
                  onQuickUpdateStatus={handleQuickUpdateStatus}
                  selectedIds={selectedIds}
                  onToggleSelect={handleToggleSelect}
                  onToggleSelectAll={handleToggleSelectAll}
                  onBatchUpdateStatus={handleBatchUpdateStatus}
                  onExportSelected={handleExportSelected}
                />
              </>
            )}

            {evaluatorTab === 'analytics' && (
              <ScholarshipAnalyticsTab applications={applications} />
            )}

            {evaluatorTab === 'grants-directory' && (
              <div className="bg-white rounded-xl p-6 border border-neutral-200 shadow-sm space-y-4">
                <h2 className="text-base font-bold text-neutral-900">
                  Institutional SFAO Grant Telemetry &amp; Quota Configuration
                </h2>
                <p className="text-xs text-neutral-600">
                  Manage grant ceilings and college allocation quotas in accordance with the annual SUC GAA budget provisions.
                </p>
              </div>
            )}

            {evaluatorTab === 'guidelines' && (
              <div className="bg-white rounded-xl p-6 border border-neutral-200 shadow-sm space-y-4">
                <h2 className="text-base font-bold text-neutral-900">
                  SFAO Application Evaluation &amp; Verification Protocols
                </h2>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  In accordance with RA 10931 and EARIST Academic Policy, evaluators audit minimum GWA thresholds, low-income bracket validity, and enrollment status before generating CHED UniFAST endorsement vouchers.
                </p>
              </div>
            )}
          </main>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DIALOGS                                                             */}
      {/* ========================================================================= */}
      {selectedApplication && (
        <ApplicationDetailsModal
          application={selectedApplication}
          allApplications={applications}
          onClose={() => setSelectedApplication(null)}
          onUpdateApplication={handleUpdateApplication}
        />
      )}

      <PrintReportModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        applications={filteredApplications}
        filters={filters}
      />

      <SubmitApplicationModal
        isOpen={submitModalOpen}
        onClose={() => {
          setSubmitModalOpen(false);
          setPreselectedProgram(undefined);
        }}
        onSubmitSuccess={handleNewApplicationSubmitted}
        initialProgram={preselectedProgram}
      />

      <TrackApplicationModal
        isOpen={trackModalOpen}
        onClose={() => {
          setTrackModalOpen(false);
          setInitialTrackQuery('');
        }}
        applications={applications}
        onUpdateApplication={handleUpdateApplication}
        initialSearchQuery={initialTrackQuery}
      />

      {/* Confirmation Modal to replace native window.confirm */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-neutral-200 p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-neutral-900">
                  Restore Institutional Demonstration Data?
                </h3>
                <p className="text-xs text-neutral-600 leading-relaxed">
                  This will restore all official EARIST demonstration student records and reset any temporary test applications submitted during this session.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeResetToDefault}
                className="px-4 py-2 text-xs font-bold text-white bg-maroon-primary hover:bg-maroon-hover rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                Confirm &amp; Restore
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
