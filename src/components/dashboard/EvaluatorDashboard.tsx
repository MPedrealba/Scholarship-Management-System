import React, { useState, useMemo, useEffect } from 'react';
import type { ScholarshipApplication } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { loadApplications, saveApplications, syncApplicationsWithApi } from '../../utils/storageUtils';
import { formatPHP } from '../../utils/exportUtils';
import { DashboardLayout } from '../common/DashboardLayout';
import type { SidebarNavItem } from '../common/PortalSidebar';
import { ApplicationDetailsModal } from '../scholarships/ApplicationDetailsModal';
import { PrintReportModal } from '../scholarships/PrintReportModal';
import {
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Check,
  RotateCcw,
  GraduationCap,
  Printer,
  ClipboardList,
  Layers,
} from 'lucide-react';
import { UserProfileView } from '../profile/UserProfileView';

interface EvaluatorDashboardProps {
  onNavigateHome?: () => void;
  onNavigateScholarships?: () => void;
  onSignOut: () => void;
}

export const EvaluatorDashboard: React.FC<EvaluatorDashboardProps> = ({
  onSignOut,
}) => {
  const { currentUser } = useAuth();
  const assignedCollege = currentUser.college || 'CIT';
  const collegeTitle = currentUser.collegeName || 'College of Industrial Technology';

  // Applications State loaded from localStorage
  const [applications, setApplications] = useState<ScholarshipApplication[]>(() =>
    loadApplications()
  );

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'queue' | 'endorsed' | 'flagged' | 'profile'>('queue');

  // Sync with live backend API on mount
  useEffect(() => {
    syncApplicationsWithApi()
      .then((apps) => {
        if (apps && apps.length > 0) {
          setApplications(apps);
        }
      })
      .catch((err) => console.warn('Could not sync applications in EvaluatorDashboard:', err));
  }, []);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [programFilter, setProgramFilter] = useState<string>('All');

  // Dossier Modal State
  const [selectedApplication, setSelectedApplication] = useState<ScholarshipApplication | null>(null);

  // Filtered applications strictly scoped to the evaluator's assigned college
  const collegeApplications = useMemo(() => {
    return applications.filter((app) => app.college === assignedCollege);
  }, [applications, assignedCollege]);

  // Metric Rollups for this college
  const metrics = useMemo(() => {
    const total = collegeApplications.length;
    const pending = collegeApplications.filter((a) => a.status === 'Pending Review').length;
    const endorsed = collegeApplications.filter((a) => a.status === 'Endorsed').length;
    const flagged = collegeApplications.filter((a) => a.status === 'Flagged').length;
    const approved = collegeApplications.filter((a) => a.status === 'Approved').length;

    return { total, pending, endorsed, flagged, approved };
  }, [collegeApplications]);

  // Tab change handler updates the active view & filters
  const handleTabChange = (tabId: string) => {
    if (tabId === 'all') {
      setActiveTab('all');
      setStatusFilter('All');
    } else if (tabId === 'queue') {
      setActiveTab('queue');
      setStatusFilter('Pending Review');
    } else if (tabId === 'endorsed') {
      setActiveTab('endorsed');
      setStatusFilter('Endorsed');
    } else if (tabId === 'flagged') {
      setActiveTab('flagged');
      setStatusFilter('Flagged');
    } else if (tabId === 'profile') {
      setActiveTab('profile');
    }
  };

  // Filtered Review Queue
  const filteredQueue = useMemo(() => {
    return collegeApplications.filter((app) => {
      // Role-specific queue enforcement
      if (activeTab === 'queue' && app.status !== 'Pending Review') return false;
      if (activeTab === 'endorsed' && app.status !== 'Endorsed') return false;
      if (activeTab === 'flagged' && app.status !== 'Flagged') return false;
      if (activeTab === 'all' && statusFilter !== 'All' && app.status !== statusFilter) return false;

      if (programFilter !== 'All' && app.program !== programFilter) return false;

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
  }, [collegeApplications, activeTab, statusFilter, programFilter, searchQuery]);

  // Update application handler
  const handleUpdateApplication = (updatedApp: ScholarshipApplication) => {
    const updated = applications.map((app) => (app.id === updatedApp.id ? updatedApp : app));
    setApplications(updated);
    saveApplications(updated);
    setSelectedApplication(updatedApp);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    if (activeTab === 'all') {
      setStatusFilter('All');
    }
    setProgramFilter('All');
  };

  // Sidebar navigation configuration
  const sidebarItems = useMemo<SidebarNavItem[]>(() => [
    {
      id: 'all',
      label: 'All Applications',
      icon: Layers,
      badge: metrics.total,
      badgeVariant: 'neutral',
    },
    {
      id: 'queue',
      label: 'Review Queue',
      icon: ClipboardList,
      badge: metrics.pending,
      badgeVariant: metrics.pending > 0 ? 'amber' : 'neutral',
    },
    {
      id: 'endorsed',
      label: 'Endorsed Candidates',
      icon: CheckCircle2,
      badge: metrics.endorsed,
      badgeVariant: 'emerald',
    },
    {
      id: 'flagged',
      label: 'Flagged Deficiencies',
      icon: AlertCircle,
      badge: metrics.flagged,
      badgeVariant: 'red',
    },
  ], [metrics]);

  const sectionMeta = useMemo(() => {
    switch (activeTab) {
      case 'profile':
        return {
          title: 'Evaluator Profile & Account Settings',
          subtitle: `${collegeTitle} • Manage faculty evaluator credentials and password security`,
        };
      case 'all':
        return {
          title: 'All College Applications',
          subtitle: `${collegeTitle} • Complete roster of applications for ${assignedCollege}`,
        };
      case 'endorsed':
        return {
          title: 'Endorsed Candidates',
          subtitle: `${collegeTitle} • Verified applications endorsed for SFAO Director approval`,
        };
      case 'flagged':
        return {
          title: 'Flagged Deficiencies',
          subtitle: `${collegeTitle} • Deficiencies awaiting student re-submission`,
        };
      case 'queue':
      default:
        return {
          title: 'College Review Queue',
          subtitle: `${collegeTitle} • Actionable applications pending document verification`,
        };
    }
  }, [activeTab, collegeTitle, assignedCollege]);

  return (
    <DashboardLayout
      role="evaluator"
      activeTab={activeTab}
      onTabChange={handleTabChange}
      title={sectionMeta.title}
      subtitle={sectionMeta.subtitle}
      sidebarItems={sidebarItems}
      onSignOut={onSignOut}
      headerActions={
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsPrintModalOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-700 bg-white hover:bg-neutral-50 border border-neutral-300 px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-2xs"
            title="Print Official College Masterlist"
          >
            <Printer className="w-3.5 h-3.5 text-neutral-500" />
            <span className="hidden sm:inline">Print Masterlist</span>
          </button>
        </div>
      }
    >
      {activeTab === 'profile' ? (
        <UserProfileView />
      ) : (
        <div className="max-w-7xl mx-auto space-y-6">
        {/* 1. Summary Metric Cards (Clean Uniform White Theme) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Applicants */}
          <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs">
            <div className="text-xs font-medium text-neutral-500">Total College Applicants</div>
            <div className="text-2xl font-bold text-neutral-900 mt-2 font-mono">
              {metrics.total}
            </div>
            <div className="text-xs text-neutral-500 mt-1">
              Active submissions for {assignedCollege}
            </div>
          </div>

          {/* Card 2: Pending Verification */}
          <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs">
            <div className="text-xs font-medium text-neutral-500">Pending Verification</div>
            <div className="text-2xl font-bold text-neutral-900 mt-2 font-mono">
              {metrics.pending}
            </div>
            <div className="text-xs text-neutral-500 mt-1">
              Awaiting evaluator document audit
            </div>
          </div>

          {/* Card 3: Endorsed to SFAO */}
          <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs">
            <div className="text-xs font-medium text-neutral-500">Endorsed to SFAO</div>
            <div className="text-2xl font-bold text-neutral-900 mt-2 font-mono">
              {metrics.endorsed}
            </div>
            <div className="text-xs text-neutral-500 mt-1">
              Recommended for central awarding
            </div>
          </div>

          {/* Card 4: Flagged Deficiencies */}
          <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs">
            <div className="text-xs font-medium text-neutral-500">Flagged Deficiencies</div>
            <div className="text-2xl font-bold text-neutral-900 mt-2 font-mono">
              {metrics.flagged}
            </div>
            <div className="text-xs text-neutral-500 mt-1">
              Notified for student compliance
            </div>
          </div>
        </div>

        {/* 2. Search & Filter Bar */}
        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name, ID, or course..."
              className="w-full pl-9 pr-4 py-2 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-primary bg-white font-sans"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {activeTab === 'all' && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs border border-neutral-300 rounded-lg px-3 py-2 bg-white text-neutral-700 focus:outline-none focus:ring-2 focus:ring-maroon-primary cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="Pending Review">Pending Review</option>
                <option value="Endorsed">Endorsed to SFAO</option>
                <option value="Approved">Approved</option>
                <option value="Flagged">Flagged Deficiency</option>
              </select>
            )}

            <select
              value={programFilter}
              onChange={(e) => setProgramFilter(e.target.value)}
              className="text-xs border border-neutral-300 rounded-lg px-3 py-2 bg-white text-neutral-700 focus:outline-none focus:ring-2 focus:ring-maroon-primary cursor-pointer"
            >
              <option value="All">All Scholarship Grants</option>
              <option value="Tertiary Education Subsidy (TES)">CHED UniFAST TES</option>
              <option value="CHED TDP">CHED TDP</option>
              <option value="DOST-SEI Grant">DOST-SEI Grant</option>
              <option value="Academic Excellence Grant">Academic Excellence Grant</option>
              <option value="Student Assistantship Program (SAP)">Student Assistantship Program (SAP)</option>
              <option value="Barangay/LGU Assistance">Barangay/LGU Assistance</option>
            </select>

            {(searchQuery || (activeTab === 'all' && statusFilter !== 'All') || programFilter !== 'All') && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-800 px-2 py-2 cursor-pointer transition-colors"
                title="Reset all filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* 3. College Review Queue Data Table */}
        <div className="bg-white border border-neutral-200 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-semibold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Applicant ID</th>
                  <th className="py-3 px-4">Student Information</th>
                  <th className="py-3 px-4">Program Applied</th>
                  <th className="py-3 px-4 text-center">GWA</th>
                  <th className="py-3 px-4">Household Income</th>
                  <th className="py-3 px-4 text-center">Documents</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredQueue.length > 0 ? (
                  filteredQueue.map((app) => {
                    const verifiedCount = app.attachedDocuments.filter((d) => d.verified).length;
                    const totalDocs = app.attachedDocuments.length;

                    return (
                      <tr key={app.id} className="hover:bg-neutral-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-medium text-neutral-700 whitespace-nowrap">
                          {app.id}
                        </td>
                        <td className="py-3.5 px-4 min-w-[200px]">
                          <div className="font-semibold text-neutral-900">{app.studentName}</div>
                          <div className="text-[11px] text-neutral-500 font-mono mt-0.5">
                            {app.studentId} • {app.course} ({app.yearAndSection})
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-medium text-neutral-800">
                          {app.program}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono font-bold text-neutral-900">
                          {app.gwa.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-neutral-600">
                          {formatPHP(app.monthlyHouseholdIncome)}/mo
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {totalDocs === 0 ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                              0/4 Missing
                            </span>
                          ) : (
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                                totalDocs > 0 && verifiedCount === totalDocs
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-neutral-100 text-neutral-700 border border-neutral-200'
                              }`}
                            >
                              {totalDocs > 0 && verifiedCount === totalDocs && <Check className="w-3 h-3 text-emerald-600" />}
                              {verifiedCount}/{totalDocs}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {app.status === 'Approved' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Approved
                            </span>
                          )}
                          {app.status === 'Endorsed' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded">
                              <CheckCircle2 className="w-3 h-3 text-blue-600" /> Endorsed
                            </span>
                          )}
                          {app.status === 'Pending Review' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded">
                              <Clock className="w-3 h-3 text-amber-600" /> Pending Review
                            </span>
                          )}
                          {app.status === 'Flagged' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded">
                              <AlertCircle className="w-3 h-3 text-red-600" /> Flagged
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedApplication(app)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-maroon-primary hover:bg-maroon-hover text-white transition-colors cursor-pointer shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Review</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-neutral-400">
                      <GraduationCap className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="font-semibold text-neutral-600">No applicant records found.</p>
                      <p className="text-[11px] mt-0.5">Try adjusting your search query or status filter.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="p-4 bg-neutral-50 border-t border-neutral-200 text-xs text-neutral-500 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>
              Showing {filteredQueue.length} of {collegeApplications.length} candidate applications for {assignedCollege}
            </span>
            <span className="text-[11px] text-neutral-400 font-mono">
              Compliant with CHED UniFAST &amp; RA 10173 Guidelines
            </span>
          </div>
        </div>
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

      {/* 5. OFFICIAL PRINTABLE CHED DISBURSEMENT MASTERLIST */}
      <PrintReportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        applications={filteredQueue}
        filters={{
          startDate: '2026-08-01',
          endDate: '2026-12-31',
          program: programFilter,
          status: statusFilter,
          college: assignedCollege,
          searchQuery,
        }}
      />
    </DashboardLayout>
  );
};

export default EvaluatorDashboard;
