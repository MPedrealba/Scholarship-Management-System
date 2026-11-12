import React, { useState, useMemo, useEffect } from 'react';
import type {
  ScholarshipApplication,
  ScholarshipStatus,
  ScholarshipProgram,
  ApplicationAuditEntry,
  AcademicTerm,
  StorageStatusResponse,
} from '../../types';
import { useAuth } from '../../context/AuthContext';
import { loadApplications, saveApplications, syncApplicationsWithApi } from '../../utils/storageUtils';
import { exportApplicationsToCSV, formatPHP } from '../../utils/exportUtils';
import { checkQuotaAvailability, PROGRAM_MAX_QUOTAS } from '../../utils/quotaUtils';
import { DashboardLayout } from '../common/DashboardLayout';
import type { SidebarNavItem } from '../common/PortalSidebar';
import { ApplicationDetailsModal } from '../scholarships/ApplicationDetailsModal';
import { PrintReportModal } from '../scholarships/PrintReportModal';
import {
  fetchQuotasApi,
  updateQuotaApi,
  fetchAuditLogsApi,
  downloadArchivalSnapshot,
  updateApplicationStatusApi,
  fetchStorageTelemetryApi,
  purgeOrphanedFilesApi,
  fetchAcademicTermsApi,
  archiveAcademicTermApi,
  fetchScholarshipsApi,
  type QuotaRecord,
  type AuditLogRecord,
} from '../../utils/api';
import type { ScholarshipProgramItem } from '../../types';
import {
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Check,
  Download,
  Lock,
  Printer,
  ClipboardList,
  Sliders,
  ShieldCheck,
  Archive,
  AlertTriangle,
  X,
  Loader2,
  Users,
  GraduationCap,
} from 'lucide-react';
import { UserProfileView } from '../profile/UserProfileView';
import { UserAccountsTab } from './UserAccountsTab';
import { AdminQuotasTab } from './AdminQuotasTab';
import { AdminAuditTab } from './AdminAuditTab';
import { ScholarshipManagementTab } from './ScholarshipManagementTab';

interface AdminDashboardProps {
  onNavigateHome?: () => void;
  onNavigateScholarships?: () => void;
  onSignOut: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onSignOut,
}) => {
  const { currentUser } = useAuth();

  // Active Tab: 'masterlist' | 'scholarships' | 'quotas' | 'users' | 'audit' | 'profile'
  const [activeTab, setActiveTab] = useState<'masterlist' | 'scholarships' | 'quotas' | 'users' | 'audit' | 'profile'>('masterlist');
  const [scholarshipPrograms, setScholarshipPrograms] = useState<ScholarshipProgramItem[]>([]);

  // Application Data State
  const [applications, setApplications] = useState<ScholarshipApplication[]>(() =>
    loadApplications()
  );

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [collegeFilter, setCollegeFilter] = useState<string>('All');
  const [programFilter, setProgramFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Selected Checkboxes for Batch Processing
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Selected application for dossier review modal
  const [selectedApplication, setSelectedApplication] = useState<ScholarshipApplication | null>(null);

  // Feedback toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Live Data & Modals State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [apiQuotas, setApiQuotas] = useState<QuotaRecord[]>([]);
  const [liveAuditLogs, setLiveAuditLogs] = useState<AuditLogRecord[]>([]);

  // Academic Terms State (Feature 6)
  const [terms, setTerms] = useState<AcademicTerm[]>([
    { termName: '1st Sem A.Y. 2026-2027', isActive: true, isArchived: false },
    { termName: '2nd Sem A.Y. 2025-2026', isActive: false, isArchived: true },
  ]);
  const [selectedTerm, setSelectedTerm] = useState<string>('1st Sem A.Y. 2026-2027');
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [nextTermInput, setNextTermInput] = useState('2nd Sem A.Y. 2026-2027');
  const [isArchiving, setIsArchiving] = useState(false);

  // Storage Telemetry State (Feature 5)
  const [storageTelemetry, setStorageTelemetry] = useState<StorageStatusResponse | null>(null);
  const [isLoadingStorage, setIsLoadingStorage] = useState(false);
  const [isPurgingOrphans, setIsPurgingOrphans] = useState(false);
  const [storageFeedback, setStorageFeedback] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadStorageTelemetry = async () => {
    try {
      setIsLoadingStorage(true);
      const res = await fetchStorageTelemetryApi();
      if (res && res.success) {
        setStorageTelemetry(res);
      }
    } catch (err) {
      console.warn('Could not load storage telemetry:', err);
    } finally {
      setIsLoadingStorage(false);
    }
  };

  // Sync with live backend API on mount
  useEffect(() => {
    syncApplicationsWithApi()
      .then((apps) => {
        if (apps && apps.length > 0) {
          setApplications(apps);
        }
      })
      .catch((err) => console.warn('Could not sync applications:', err));

    fetchQuotasApi()
      .then((quotas) => {
        if (Array.isArray(quotas) && quotas.length > 0) {
          setApiQuotas(quotas);
        }
      })
      .catch((err) => console.warn('Could not load API quotas:', err));

    fetchAuditLogsApi()
      .then((logs) => {
        if (Array.isArray(logs) && logs.length > 0) {
          setLiveAuditLogs(logs);
        }
      })
      .catch((err) => console.warn('Could not load API audit logs:', err));

    fetchAcademicTermsApi()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setTerms(data);
          const active = data.find((t) => t.isActive);
          if (active) setSelectedTerm(active.termName);
        }
      })
      .catch((err) => console.warn('Could not load terms:', err));

    fetchScholarshipsApi(true)
      .then((progs) => {
        if (Array.isArray(progs) && progs.length > 0) {
          setScholarshipPrograms(progs);
        }
      })
      .catch((err) => console.warn('Could not load scholarship programs:', err));

    loadStorageTelemetry();
  }, []);

  // Storage Orphan Purge Handler (Feature 5)
  const handlePurgeOrphans = async () => {
    try {
      setIsPurgingOrphans(true);
      setStorageFeedback(null);
      const res = await purgeOrphanedFilesApi({
        adminName: currentUser.name || 'Dr. Mario M. Santos (SFAO Director)',
        adminEmail: currentUser.email || 'director.sfao@earist.edu.ph',
      });
      if (res && res.success) {
        setStorageFeedback(
          `Purge complete: ${res.purgedCount} unreferenced files cleaned (${res.recoveredMB} MB recovered).`
        );
        loadStorageTelemetry();
        fetchAuditLogsApi().then((logs) => {
          if (Array.isArray(logs) && logs.length > 0) setLiveAuditLogs(logs);
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStorageFeedback(`Purge error: ${msg}`);
    } finally {
      setIsPurgingOrphans(false);
    }
  };

  // Academic Term Archival Handler (Feature 6)
  const handleArchiveTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nextTermInput.trim()) return;

    setIsArchiving(true);
    try {
      const activeTerm = terms.find((t) => t.isActive)?.termName || selectedTerm;
      await archiveAcademicTermApi({
        currentTermName: activeTerm,
        nextTermName: nextTermInput.trim(),
        adminName: currentUser.name || 'Dr. Mario M. Santos (SFAO Director)',
        adminEmail: currentUser.email || 'director.sfao@earist.edu.ph',
      });

      showToast(`Term "${activeTerm}" archived. New intake opened for "${nextTermInput.trim()}".`);
      setIsArchiveModalOpen(false);

      const updatedTerms = await fetchAcademicTermsApi();
      if (Array.isArray(updatedTerms) && updatedTerms.length > 0) {
        setTerms(updatedTerms);
      }
      setSelectedTerm(nextTermInput.trim());

      const updatedQuotas = await fetchQuotasApi();
      if (Array.isArray(updatedQuotas) && updatedQuotas.length > 0) {
        setApiQuotas(updatedQuotas);
      }

      const updatedApps = await syncApplicationsWithApi();
      if (updatedApps) setApplications(updatedApps);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`Error archiving term: ${msg}`);
    } finally {
      setIsArchiving(false);
    }
  };

  // Manual Quota Override Handlers (Module 3)
  const handleToggleQuotaLock = async (grantType: string, newLockState: boolean) => {
    try {
      const updated = await updateQuotaApi(grantType, {
        isLocked: newLockState,
        adminName: currentUser.name || 'Dr. Mario M. Santos',
        adminEmail: currentUser.email || 'director.sfao@earist.edu.ph',
      });
      setApiQuotas((prev) =>
        prev.map((q) => (q.grantType.toLowerCase() === grantType.toLowerCase() ? updated : q))
      );
      showToast(`${grantType} intake ${newLockState ? 'locked' : 'unlocked'} successfully.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`Error updating quota lock: ${msg}`);
    }
  };

  const handleAdjustQuotaSlots = async (grantType: string, newTotalSlots: number) => {
    try {
      const updated = await updateQuotaApi(grantType, {
        totalSlots: newTotalSlots,
        adminName: currentUser.name || 'Dr. Mario M. Santos',
        adminEmail: currentUser.email || 'director.sfao@earist.edu.ph',
      });
      setApiQuotas((prev) =>
        prev.map((q) => (q.grantType.toLowerCase() === grantType.toLowerCase() ? updated : q))
      );
      showToast(`${grantType} total slots updated to ${newTotalSlots}.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`Error updating total slots: ${msg}`);
    }
  };

  // 1. CAMPUS-WIDE KPI METRICS
  const kpis = useMemo(() => {
    const totalApplicants = applications.length;
    const totalStipend = applications.reduce((sum, app) => sum + (app.stipendAmount || 0), 0);
    const approvedCount = applications.filter((a) => a.status === 'Approved').length;
    const endorsedCount = applications.filter((a) => a.status === 'Endorsed').length;
    const readyForDisbursement = approvedCount + endorsedCount;

    // Overall Quota Utilization %
    let totalMaxSlots = 0;
    let totalFilledSlots = 0;
    (Object.keys(PROGRAM_MAX_QUOTAS) as ScholarshipProgram[]).forEach((prog) => {
      const cfg = PROGRAM_MAX_QUOTAS[prog];
      const progApproved = applications.filter((a) => a.program === prog && a.status === 'Approved').length;
      totalMaxSlots += cfg.max;
      totalFilledSlots += Math.min(cfg.max, cfg.baseline + progApproved);
    });

    const quotaUtilizationPct = Math.round((totalFilledSlots / totalMaxSlots) * 100);

    return {
      totalApplicants,
      totalStipend,
      approvedCount,
      endorsedCount,
      readyForDisbursement,
      quotaUtilizationPct,
      totalMaxSlots,
      totalFilledSlots,
    };
  }, [applications]);

  // 2. REAL-TIME QUOTA SLOT MANAGEMENT METRICS
  const quotaCards = useMemo(() => {
    const defaultConfigs = [
      {
        id: 'tes',
        title: 'CHED UniFAST TES',
        programName: 'Tertiary Education Subsidy (TES)' as ScholarshipProgram,
        maxSlots: 50,
        baseline: 47,
        stipendPerSem: 20000,
        agency: 'Commission on Higher Education (UniFAST)',
      },
      {
        id: 'tdp',
        title: 'CHED TDP-SUC',
        programName: 'CHED TDP' as ScholarshipProgram,
        maxSlots: 40,
        baseline: 29,
        stipendPerSem: 15000,
        agency: 'CHED Tulong Dunong Program',
      },
      {
        id: 'dost',
        title: 'DOST-SEI Science Grant',
        programName: 'DOST-SEI Grant' as ScholarshipProgram,
        maxSlots: 20,
        baseline: 15,
        stipendPerSem: 40000,
        agency: 'DOST Science Education Institute',
      },
      {
        id: 'honor',
        title: 'Academic Excellence Grant',
        programName: 'Academic Excellence Grant' as ScholarshipProgram,
        maxSlots: 25,
        baseline: 17,
        stipendPerSem: 18000,
        agency: 'EARIST Board of Trustees Honor Fund',
      },
      {
        id: 'sap',
        title: 'Student Assistantship (SAP)',
        programName: 'Student Assistantship Program (SAP)' as ScholarshipProgram,
        maxSlots: 20,
        baseline: 14,
        stipendPerSem: 12000,
        agency: 'EARIST SFAO Student Labor Fund',
      },
      {
        id: 'lgu',
        title: 'Barangay / LGU Assistance',
        programName: 'Barangay/LGU Assistance' as ScholarshipProgram,
        maxSlots: 30,
        baseline: 21,
        stipendPerSem: 10000,
        agency: 'City of Manila / Cavite Local LGUs',
      },
    ];

    return defaultConfigs.map((item) => {
      const apiRecord = apiQuotas.find(
        (q) => q.grantType.toLowerCase() === item.programName.toLowerCase()
      );

      const maxSlots = apiRecord ? apiRecord.totalSlots : item.maxSlots;
      const approvedCount = applications.filter(
        (a) => a.program === item.programName && a.status === 'Approved'
      ).length;

      const filled = apiRecord
        ? apiRecord.allocatedSlots
        : Math.min(maxSlots, item.baseline + approvedCount);
      const remaining = Math.max(0, maxSlots - filled);
      const pct = maxSlots > 0 ? Math.min(100, Math.round((filled / maxSlots) * 100)) : 100;
      const isLocked = apiRecord ? apiRecord.isLocked : remaining === 0;

      return {
        ...item,
        maxSlots,
        filled,
        remaining,
        pct,
        isLocked,
        grantType: item.programName,
      };
    });
  }, [applications, apiQuotas]);

  // Check if active or archived term
  const selectedTermObj = terms.find((t) => t.termName === selectedTerm);
  const isTermArchived = Boolean(selectedTermObj?.isArchived);

  // 3. MASTERLIST FILTERING
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      // Academic Term Filter
      if (selectedTerm && selectedTerm !== 'All') {
        const appTerm = app.academicTerm || '1st Sem A.Y. 2026-2027';
        if (appTerm !== selectedTerm) return false;
      }

      if (collegeFilter !== 'All' && app.college !== collegeFilter) return false;
      if (programFilter !== 'All' && app.program !== programFilter) return false;
      if (statusFilter !== 'All' && app.status !== statusFilter) return false;

      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchName = app.studentName.toLowerCase().includes(query);
        const matchId = app.studentId.toLowerCase().includes(query);
        const matchAppId = app.id.toLowerCase().includes(query);
        const matchCourse = app.course.toLowerCase().includes(query);
        if (!matchName && !matchId && !matchAppId && !matchCourse) return false;
      }

      return true;
    });
  }, [applications, collegeFilter, programFilter, statusFilter, searchQuery, selectedTerm]);

  // 4. SYSTEM AUDIT LOG DATA (RA 10173 COMPLIANCE)
  const systemAuditLogs = useMemo(() => {
    const list: Array<ApplicationAuditEntry & { appId: string; studentName: string; ipHash: string }> = [];

    applications.forEach((app) => {
      if (app.auditTrail && app.auditTrail.length > 0) {
        app.auditTrail.forEach((entry, idx) => {
          const ipOctet = ((parseInt(app.id.replace(/\D/g, ''), 10) || 10) + idx * 7) % 254 + 1;
          const ipHash = `192.168.10.${ipOctet}`;

          list.push({
            ...entry,
            appId: app.id,
            studentName: app.studentName,
            ipHash,
          });
        });
      }
    });

    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [applications]);

  // Update application handler from dossier modal
  const handleUpdateApplication = (updatedApp: ScholarshipApplication) => {
    const updated = applications.map((app) => (app.id === updatedApp.id ? updatedApp : app));
    setApplications(updated);
    saveApplications(updated);
    setSelectedApplication(updatedApp);
    showToast(`Application ${updatedApp.id} updated successfully.`);
  };

  // Toggle selection for batch approval
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredApplications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredApplications.map((a) => a.id));
    }
  };

  // BATCH ACTION: Approve Selected
  const handleBatchApproveAwarding = () => {
    if (selectedIds.length === 0) return;

    const appsToApprove = new Set<string>();
    let lockedCount = 0;

    for (const app of applications) {
      if (selectedIds.includes(app.id) && app.status !== 'Approved') {
        const check = checkQuotaAvailability(app.program, applications, false);
        if (check.allowed) {
          appsToApprove.add(app.id);
        } else {
          lockedCount++;
        }
      }
    }

    const approvedCount = appsToApprove.size;

    const updated = applications.map((app) => {
      if (appsToApprove.has(app.id)) {
        const auditLog: ApplicationAuditEntry = {
          id: `audit-${Date.now()}-${app.id}`,
          evaluatorName: currentUser.name || 'Dr. Mario M. Santos',
          role: currentUser.title || 'SFAO Director',
          action: 'Approved for Final Awarding',
          remarks: 'Enrolled into official disbursement masterlist by SFAO Director.',
          timestamp: new Date().toISOString(),
        };

        return {
          ...app,
          status: 'Approved' as ScholarshipStatus,
          auditTrail: [auditLog, ...(app.auditTrail || [])],
          lastUpdated: new Date().toISOString(),
        };
      }
      return app;
    });

    setApplications(updated);
    saveApplications(updated);
    setSelectedIds([]);

    // Sync approved applications with backend API
    appsToApprove.forEach((appId) => {
      updateApplicationStatusApi(appId, {
        status: 'Approved',
        evaluatedBy: currentUser.name || 'Dr. Mario M. Santos',
        role: currentUser.title || 'SFAO Director',
        userEmail: currentUser.email || 'director.sfao@earist.edu.ph',
        evaluatorRemarks: 'Enrolled into official disbursement masterlist by SFAO Director.',
      })
        .then(() => fetchQuotasApi().then(setApiQuotas))
        .catch((err) => console.warn('Could not sync batch approval to server:', appId, err));
    });

    if (lockedCount > 0) {
      showToast(
        `${approvedCount} candidate(s) approved. ${lockedCount} skipped due to full quota limits.`
      );
    } else {
      showToast(`${approvedCount} candidate(s) approved for final awarding.`);
    }
  };

  // ONE-CLICK EXPORT: Export CHED Masterlist (CSV)
  const handleExportMasterlistCSV = () => {
    exportApplicationsToCSV(
      filteredApplications,
      { start: '2026-01-01', end: '2026-12-31' },
      `EARIST_SFAO_CHED_Masterlist_${collegeFilter}`
    );
    showToast('Exported official CHED masterlist (CSV).');
  };

  // Sidebar items definition
  const sidebarItems = useMemo<SidebarNavItem[]>(() => [
    {
      id: 'masterlist',
      label: 'Disbursement Masterlist',
      icon: ClipboardList,
      badge: kpis.totalApplicants,
    },
    {
      id: 'scholarships',
      label: 'Scholarship Management',
      icon: GraduationCap,
      badge: scholarshipPrograms.length || undefined,
    },
    {
      id: 'quotas',
      label: 'Grant Quotas',
      icon: Sliders,
      badge: `${kpis.quotaUtilizationPct}%`,
    },
    {
      id: 'users',
      label: 'User Accounts',
      icon: Users,
    },
    {
      id: 'audit',
      label: 'Audit Log (RA 10173)',
      icon: ShieldCheck,
    },
  ], [kpis.totalApplicants, kpis.quotaUtilizationPct, scholarshipPrograms.length]);

  const sectionMeta = useMemo(() => {
    switch (activeTab) {
      case 'profile':
        return {
          title: 'User Profile & Account Settings',
          subtitle: 'Manage administrative identity, contact details, and cryptographic password security',
        };
      case 'scholarships':
        return {
          title: 'Scholarship Program Management',
          subtitle: 'Institutional Grants, Sponsoring Agencies, Stipend Amounts, and Slot Capacities',
        };
      case 'quotas':
        return {
          title: 'Grant Quotas & Allocation Locks',
          subtitle: 'CHED UniFAST & Institutional Intake Slots Administration',
        };
      case 'users':
        return {
          title: 'Institutional User Accounts & Access Control',
          subtitle: 'Staff Credentials, Department Role Assignments, and Status Management',
        };
      case 'audit':
        return {
          title: 'Audit Log & Compliance Ledger (RA 10173)',
          subtitle: 'Evaluation Activity Trail & Disaster Recovery Storage',
        };
      case 'masterlist':
      default:
        return {
          title: 'Disbursement Masterlist',
          subtitle: 'Official Scholar Applications & Awarding Deliberation Roster',
        };
    }
  }, [activeTab]);

  return (
    <DashboardLayout
      role="superadmin"
      activeTab={activeTab}
      onTabChange={(tab) => setActiveTab(tab as 'masterlist' | 'quotas' | 'users' | 'audit' | 'profile')}
      title={sectionMeta.title}
      subtitle={sectionMeta.subtitle}
      sidebarItems={sidebarItems}
      onSignOut={onSignOut}
      headerActions={
        <div className="flex items-center gap-2.5">
          <div className="hidden md:flex items-center gap-2 text-xs text-neutral-500 bg-white px-3 py-1.5 rounded-lg border border-neutral-200 shadow-2xs">
            <span className="font-medium text-neutral-600">Enrolled:</span>
            <strong className="text-emerald-700 font-mono">{kpis.approvedCount}</strong>
            <span>•</span>
            <span className="font-medium text-neutral-600">Total:</span>
            <strong className="text-neutral-900 font-mono">{kpis.totalApplicants}</strong>
          </div>
          <button
            type="button"
            onClick={() => setIsPrintModalOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold bg-maroon-primary hover:bg-maroon-hover text-white px-3.5 py-2 rounded-lg transition-colors cursor-pointer shadow-2xs"
            title="Print Official Masterlist Report"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print / Export</span>
          </button>
        </div>
      }
    >
      {/* Toast Feedback Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-white text-neutral-900 px-4 py-3 rounded-xl shadow-lg border border-neutral-200 flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-3 text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {activeTab === 'profile' ? (
        <UserProfileView />
      ) : (
        <div className="max-w-7xl mx-auto space-y-6">
        {/* 3. REFINED METRIC CARDS (CLEAN ENTERPRISE STYLE) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Applicants */}
          <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs">
            <div className="text-xs font-medium text-neutral-500">Total Applicants</div>
            <div className="text-2xl font-bold text-neutral-900 mt-2 font-mono">
              {kpis.totalApplicants}
            </div>
            <div className="text-xs text-neutral-500 mt-1">Across 7 undergraduate colleges</div>
          </div>

          {/* Card 2: Total Earmarked Funding */}
          <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs">
            <div className="text-xs font-medium text-neutral-500">Total Earmarked Funding</div>
            <div className="text-2xl font-bold text-neutral-900 mt-2 font-mono">
              {formatPHP(kpis.totalStipend)}
            </div>
            <div className="text-xs text-neutral-500 mt-1">1st Semester A.Y. 2026–2027</div>
          </div>

          {/* Card 3: Overall Quota Allocation */}
          <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs">
            <div className="text-xs font-medium text-neutral-500">Overall Quota Allocation</div>
            <div className="text-2xl font-bold text-neutral-900 mt-2 font-mono">
              {kpis.quotaUtilizationPct}%
            </div>
            <div className="text-xs text-neutral-500 mt-1">
              {kpis.totalFilledSlots} of {kpis.totalMaxSlots} slots utilized
            </div>
          </div>

          {/* Card 4: Approved Scholars */}
          <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs">
            <div className="text-xs font-medium text-neutral-500">Approved Scholars</div>
            <div className="text-2xl font-bold text-neutral-900 mt-2 font-mono">
              {kpis.approvedCount}
            </div>
            <div className="text-xs text-neutral-500 mt-1">Ready for CHED endorsement</div>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* TAB 1: DISBURSEMENT MASTERLIST                                        */}
        {/* ===================================================================== */}
        {activeTab === 'masterlist' && (
          <div className="bg-white rounded-xl shadow-xs border border-neutral-200 overflow-hidden">
            {/* ACADEMIC TERM SELECTOR & ARCHIVING TOOLBAR (FEATURE 6) */}
            <div className="p-3.5 px-4 sm:px-5 bg-neutral-50 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Archive className="w-4 h-4 text-maroon-primary" />
                  <span className="text-xs font-bold text-neutral-800">Academic Term:</span>
                </div>

                <select
                  value={selectedTerm}
                  onChange={(e) => setSelectedTerm(e.target.value)}
                  className="px-3 py-1.5 text-xs font-semibold bg-white border border-neutral-300 rounded-lg text-neutral-900 focus:outline-none focus:ring-1 focus:ring-maroon-primary focus:border-maroon-primary cursor-pointer shadow-2xs"
                >
                  {terms.map((t) => (
                    <option key={t.termName} value={t.termName}>
                      {t.termName} {t.isActive ? '(Active Intake)' : '(Archived)'}
                    </option>
                  ))}
                </select>

                {isTermArchived ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    <Lock className="w-3 h-3 text-amber-600" />
                    <span>Archived • Read-Only Historical Snapshot</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    <span>Active Intake Semester</span>
                  </span>
                )}
              </div>

              {/* Close & Archive Active Term Button (Super Admin Only) */}
              {!isTermArchived && (
                <button
                  type="button"
                  onClick={() => setIsArchiveModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 shadow-2xs transition-colors cursor-pointer self-start sm:self-auto"
                  title="Close active intake semester and archive snapshot"
                >
                  <Archive className="w-3.5 h-3.5 text-maroon-primary" />
                  <span>Close &amp; Archive Active Term</span>
                </button>
              )}
            </div>

            {/* Read-Only Historical Notice Banner */}
            {isTermArchived && (
              <div className="p-3 px-5 bg-amber-50 border-b border-amber-200 text-amber-900 flex items-center gap-2 text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>
                  <strong>Viewing Historical Archive ({selectedTerm}):</strong> Records are preserved in read-only audit compliance under R.A. 10173. Status mutations, approvals, and batch modifications are locked.
                </span>
              </div>
            )}

            {/* 4. SEARCH, FILTER, AND EXPORT TOOLBAR */}
            <div className="p-4 sm:p-5 border-b border-neutral-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by student name, student number, or application ID..."
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-maroon-primary focus:border-maroon-primary placeholder:text-neutral-400"
                  />
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  {selectedIds.length > 0 && !isTermArchived && (
                    <button
                      type="button"
                      onClick={handleBatchApproveAwarding}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-maroon-primary hover:bg-maroon-hover text-white shadow-2xs transition-colors cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve Selected ({selectedIds.length})</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsPrintModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-maroon-primary hover:bg-maroon-hover text-white shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Printer className="w-3.5 h-3.5 text-gold-light" />
                    <span>Print Masterlist (PDF)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportMasterlistCSV}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-700 shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Download className="w-3.5 h-3.5 text-neutral-500" />
                    <span>Export CHED Masterlist (CSV)</span>
                  </button>
                </div>
              </div>

              {/* Native Dropdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-medium text-neutral-500 mb-1">College</label>
                  <select
                    value={collegeFilter}
                    onChange={(e) => setCollegeFilter(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-maroon-primary text-neutral-800"
                  >
                    <option value="All">All Colleges</option>
                    <option value="CAS">CAS - College of Arts and Sciences</option>
                    <option value="CBA">CBA - College of Business Administration</option>
                    <option value="CED">CED - College of Education</option>
                    <option value="CIT">CIT - College of Industrial Technology</option>
                    <option value="CEN">CEN - College of Engineering</option>
                    <option value="CAFA">CAFA - Architecture &amp; Fine Arts</option>
                    <option value="CHM">CHM - Hospitality Management</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-neutral-500 mb-1">Grant Program</label>
                  <select
                    value={programFilter}
                    onChange={(e) => setProgramFilter(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-maroon-primary text-neutral-800"
                  >
                    <option value="All">All Programs</option>
                    {scholarshipPrograms.length > 0 ? (
                      scholarshipPrograms.map((prog) => (
                        <option key={prog.id || prog._id || prog.name} value={prog.name}>
                          {prog.name}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Tertiary Education Subsidy (TES)">CHED UniFAST TES</option>
                        <option value="CHED TDP">CHED TDP-SUC</option>
                        <option value="Academic Excellence Grant">Academic Excellence Grant</option>
                        <option value="DOST-SEI Grant">DOST-SEI Grant</option>
                        <option value="Student Assistantship Program (SAP)">Student Assistantship Program (SAP)</option>
                        <option value="Barangay/LGU Assistance">Barangay / LGU Assistance</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-neutral-500 mb-1">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-maroon-primary text-neutral-800"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Approved">Approved</option>
                    <option value="Endorsed">Endorsed</option>
                    <option value="Pending Review">Pending Review</option>
                    <option value="Flagged">Flagged</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 5. DATA TABLE REFACTOR (PROFESSIONAL DATA GRID) */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-neutral-50 border-b border-neutral-200 text-xs font-semibold text-neutral-600 uppercase tracking-wider select-none">
                  <tr>
                    <th className="py-3 px-3 text-center w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.length > 0 && selectedIds.length === filteredApplications.length}
                        onChange={handleToggleSelectAll}
                        className="rounded border-neutral-300 text-maroon-primary focus:ring-maroon-primary"
                      />
                    </th>
                    <th className="py-3 px-3">Application ID</th>
                    <th className="py-3 px-4">Student Beneficiary</th>
                    <th className="py-3 px-3 text-center">College</th>
                    <th className="py-3 px-4">Scholarship Grant</th>
                    <th className="py-3 px-3 text-center">GWA &amp; Income</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {filteredApplications.length > 0 ? (
                    filteredApplications.map((app) => {
                      const isSelected = selectedIds.includes(app.id);

                      return (
                        <tr
                          key={app.id}
                          className={`hover:bg-neutral-50/80 transition-colors ${
                            isSelected ? 'bg-amber-50/40' : ''
                          }`}
                        >
                          <td className="py-3.5 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSelect(app.id)}
                              className="rounded border-neutral-300 text-maroon-primary focus:ring-maroon-primary"
                            />
                          </td>

                          <td className="py-3.5 px-3 font-mono font-medium text-neutral-900 whitespace-nowrap">
                            {app.id}
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="font-semibold text-neutral-900">{app.studentName}</div>
                            <div className="text-[11px] text-neutral-500 font-mono">
                              {app.studentId}
                            </div>
                          </td>

                          <td className="py-3.5 px-3 text-center whitespace-nowrap">
                            <span className="font-semibold px-2 py-0.5 rounded text-[11px] bg-neutral-100 text-neutral-700 border border-neutral-200">
                              {app.college}
                            </span>
                            <div className="text-[10px] text-neutral-400 mt-0.5 truncate max-w-[120px]">
                              {app.course}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="font-medium text-neutral-900">{app.program}</div>
                            <div className="text-[11px] text-neutral-500">
                              {formatPHP(app.stipendAmount)} / Sem
                            </div>
                          </td>

                          <td className="py-3.5 px-3 text-center whitespace-nowrap">
                            <div className="font-semibold text-neutral-900 font-mono">
                              {app.gwa.toFixed(2)}
                            </div>
                            <div className="text-[10px] text-neutral-400">
                              {formatPHP(app.monthlyHouseholdIncome)}/mo
                            </div>
                          </td>

                          <td className="py-3.5 px-3 text-center whitespace-nowrap">
                            {app.status === 'Approved' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-medium text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <Check className="w-3 h-3" />
                                <span>Approved</span>
                              </span>
                            )}
                            {app.status === 'Endorsed' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-medium text-[11px] bg-blue-50 text-blue-700 border border-blue-200">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Endorsed</span>
                              </span>
                            )}
                            {app.status === 'Pending Review' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-medium text-[11px] bg-amber-50 text-amber-700 border border-amber-200">
                                <Clock className="w-3 h-3" />
                                <span>Pending Review</span>
                              </span>
                            )}
                            {app.status === 'Flagged' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-medium text-[11px] bg-red-50 text-red-700 border border-red-200">
                                <AlertCircle className="w-3 h-3" />
                                <span>Flagged</span>
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setSelectedApplication(app)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-maroon-primary hover:bg-maroon-subtle border border-neutral-300 transition-colors cursor-pointer"
                              title="Review student application dossier"
                            >
                              <Eye className="w-3.5 h-3.5 text-neutral-500" />
                              <span>Review Dossier</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-neutral-400">
                        <p className="font-medium text-neutral-600">No matching applications found.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-neutral-50 border-t border-neutral-200 text-xs text-neutral-500 flex flex-col sm:flex-row items-center justify-between gap-2">
              <span>Showing {filteredApplications.length} of {applications.length} student records</span>
              <span className="text-[11px] text-neutral-400">
                Official Commission on Higher Education (CHED) Masterlist Standard
              </span>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB: SCHOLARSHIP MANAGEMENT (DYNAMIC CRUD & LIVE QUOTA SYNC)          */}
        {/* ===================================================================== */}
        {activeTab === 'scholarships' && (
          <ScholarshipManagementTab
            onProgramChange={() => {
              fetchScholarshipsApi(true).then((p) => {
                if (Array.isArray(p)) setScholarshipPrograms(p);
              });
              fetchQuotasApi().then((q) => {
                if (Array.isArray(q)) setApiQuotas(q);
              });
              syncApplicationsWithApi().then((apps) => {
                if (apps) setApplications(apps);
              });
            }}
          />
        )}

        {/* ===================================================================== */}
        {/* TAB 2: GRANT QUOTAS (MODULAR COMPONENT)                              */}
        {/* ===================================================================== */}
        {activeTab === 'quotas' && (
          <AdminQuotasTab
            quotaCards={quotaCards}
            onAdjustQuotaSlots={handleAdjustQuotaSlots}
            onToggleQuotaLock={handleToggleQuotaLock}
          />
        )}

        {/* ===================================================================== */}
        {/* TAB 3: SYSTEM AUDIT & STORAGE TELEMETRY (MODULAR COMPONENT)          */}
        {/* ===================================================================== */}
        {activeTab === 'audit' && (
          <AdminAuditTab
            storageTelemetry={storageTelemetry}
            isLoadingStorage={isLoadingStorage}
            isPurgingOrphans={isPurgingOrphans}
            storageFeedback={storageFeedback}
            liveAuditLogs={liveAuditLogs}
            systemAuditLogs={systemAuditLogs}
            onLoadStorageTelemetry={loadStorageTelemetry}
            onPurgeOrphans={handlePurgeOrphans}
            onDismissFeedback={() => setStorageFeedback(null)}
            onDownloadSnapshot={downloadArchivalSnapshot}
          />
        )}

        {/* TAB 4: USER ACCOUNTS (ADMIN STAFF & STUDENT REGISTRATIONS) */}
        {activeTab === 'users' && (
          <UserAccountsTab
            adminEmail={currentUser.email}
            adminName={currentUser.name}
          />
        )}
      </div>
      )}

      {/* 4. APPLICATION DETAILS / EVALUATOR DOSSIER MODAL */}
      {selectedApplication && (
        <ApplicationDetailsModal
          application={selectedApplication}
          allApplications={applications}
          onClose={() => setSelectedApplication(null)}
          onUpdateApplication={handleUpdateApplication}
        />
      )}

      {/* 5. OFFICIAL PRINTABLE CHED DISBURSEMENT MASTERLIST (MODULE 5) */}
      <PrintReportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        applications={filteredApplications}
        filters={{
          startDate: '2026-08-01',
          endDate: '2026-12-31',
          program: programFilter,
          status: statusFilter,
          college: collegeFilter,
          searchQuery,
        }}
      />

      {/* ========================================================================= */}
      {/* 6. ACADEMIC TERM ARCHIVAL MODAL (FEATURE 6 / PROPOSAL SLIDE 6)             */}
      {/* ========================================================================= */}
      {isArchiveModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-neutral-300 overflow-hidden animate-in fade-in duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-neutral-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-maroon-subtle text-maroon-primary border border-red-200 flex-shrink-0">
                  <Archive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900">
                    Close &amp; Archive Academic Term
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Institutional Term Transition &amp; Intake Quota Reset Protocol
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsArchiveModalOpen(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleArchiveTerm} className="p-5 space-y-4">
              <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-950 text-xs space-y-1.5">
                <strong className="block font-bold">Important Administrative Notice:</strong>
                <p className="leading-relaxed">
                  Archiving the current active term (<strong>{selectedTerm}</strong>) will permanently lock all {applications.length} submitted applications into a read-only historical state. Active intake quotas across all 6 scholarship grants will automatically be reset to 0 allocated slots.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Current Term to Archive
                </label>
                <input
                  type="text"
                  disabled
                  value={selectedTerm}
                  className="w-full text-xs font-semibold px-3 py-2 border border-neutral-300 rounded-lg bg-neutral-100 text-neutral-700 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Next Academic Term Name <span className="text-red-600 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2nd Sem A.Y. 2026-2027"
                  value={nextTermInput}
                  onChange={(e) => setNextTermInput(e.target.value)}
                  className="w-full text-xs font-medium px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-maroon-primary focus:border-maroon-primary bg-white"
                />
                <span className="text-[11px] text-neutral-500 block mt-1">
                  This term will immediately become the active semester for new student scholarship applications.
                </span>
              </div>

              <div className="pt-3 border-t border-neutral-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsArchiveModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isArchiving || !nextTermInput.trim()}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-bold bg-maroon-primary hover:bg-maroon-hover text-white shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isArchiving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Archiving Term...</span>
                    </>
                  ) : (
                    <>
                      <Archive className="w-3.5 h-3.5" />
                      <span>Confirm &amp; Archive Term</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminDashboard;
