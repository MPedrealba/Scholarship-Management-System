import React, { useState, useEffect, useMemo } from 'react';
import type { ScholarshipProgramItem } from '../../types';
import {
  fetchScholarshipsApi,
  createScholarshipApi,
  updateScholarshipApi,
  deleteScholarshipApi,
} from '../../utils/api';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  GraduationCap,
  Users,
  CheckCircle2,
  AlertTriangle,
  X,
  Loader2,
  RotateCcw,
  Eye,
  EyeOff,
} from 'lucide-react';

interface ScholarshipManagementTabProps {
  onProgramChange?: () => void;
}

export const ScholarshipManagementTab: React.FC<ScholarshipManagementTabProps> = ({
  onProgramChange,
}) => {
  const [programs, setPrograms] = useState<ScholarshipProgramItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'National Government' | 'Institutional' | 'LGU / Private'>('All');

  // Modal State for Add / Edit
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<ScholarshipProgramItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form Fields State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<'National Government' | 'Institutional' | 'LGU / Private'>('National Government');
  const [agency, setAgency] = useState('');
  const [stipendAmount, setStipendAmount] = useState<number | ''>(20000);
  const [maxGwa, setMaxGwa] = useState<number | ''>(3.0);
  const [maxMonthlyIncome, setMaxMonthlyIncome] = useState<number | ''>('');
  const [totalSlots, setTotalSlots] = useState<number | ''>(50);
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Modal State for Delete Confirmation
  const [programToDelete, setProgramToDelete] = useState<ScholarshipProgramItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteWarning, setDeleteWarning] = useState<string | null>(null);
  const [allowForceDelete, setAllowForceDelete] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadPrograms = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Include inactive for Admin view
      const data = await fetchScholarshipsApi(true);
      setPrograms(data);
    } catch (err: any) {
      console.error('Failed to load scholarships:', err);
      setError(err.message || 'Unable to load scholarship catalog from server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPrograms();
  }, []);

  const openAddModal = () => {
    setEditingProgram(null);
    setName('');
    setCategory('National Government');
    setAgency('');
    setStipendAmount(20000);
    setMaxGwa(3.0);
    setMaxMonthlyIncome('');
    setTotalSlots(50);
    setDescription('');
    setIsActive(true);
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (prog: ScholarshipProgramItem) => {
    setEditingProgram(prog);
    setName(prog.name);
    setCategory(prog.category);
    setAgency(prog.agency);
    setStipendAmount(prog.stipendAmount);
    setMaxGwa(prog.maxGwa);
    setMaxMonthlyIncome(prog.maxMonthlyIncome ?? '');
    setTotalSlots(prog.totalSlots);
    setDescription(prog.description);
    setIsActive(prog.isActive);
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Scholarship program name is required.');
      return;
    }
    if (!agency.trim()) {
      setFormError('Sponsoring agency or office is required.');
      return;
    }
    if (stipendAmount === '' || Number(stipendAmount) < 0) {
      setFormError('Please enter a valid non-negative semestral stipend amount.');
      return;
    }
    if (totalSlots === '' || Number(totalSlots) < 1) {
      setFormError('Total intake quota slots must be at least 1.');
      return;
    }
    if (!description.trim()) {
      setFormError('Program description and mandate is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Partial<ScholarshipProgramItem> = {
        name: name.trim(),
        category,
        agency: agency.trim(),
        stipendAmount: Number(stipendAmount),
        maxGwa: maxGwa === '' ? 3.0 : Number(maxGwa),
        maxMonthlyIncome: maxMonthlyIncome === '' ? null : Number(maxMonthlyIncome),
        totalSlots: Number(totalSlots),
        description: description.trim(),
        isActive,
      };

      if (editingProgram) {
        const progId = editingProgram.id || editingProgram._id || editingProgram.name;
        await updateScholarshipApi(progId, payload);
        showToast(`Scholarship program "${name.trim()}" updated successfully.`);
      } else {
        await createScholarshipApi(payload);
        showToast(`Scholarship program "${name.trim()}" created successfully with slot quota synchronized.`);
      }

      setIsFormModalOpen(false);
      await loadPrograms();
      if (onProgramChange) onProgramChange();
    } catch (err: any) {
      console.error('Save scholarship failed:', err);
      setFormError(err.message || 'Operation failed. Please review input fields.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const promptDelete = (prog: ScholarshipProgramItem) => {
    setProgramToDelete(prog);
    setDeleteWarning(null);
    setAllowForceDelete(false);
  };

  const confirmDelete = async (force: boolean = false) => {
    if (!programToDelete) return;
    setIsDeleting(true);
    setDeleteWarning(null);
    try {
      const progId = programToDelete.id || programToDelete._id || programToDelete.name;
      await deleteScholarshipApi(progId, force);
      showToast(`Program "${programToDelete.name}" successfully deleted.`);
      setProgramToDelete(null);
      await loadPrograms();
      if (onProgramChange) onProgramChange();
    } catch (err: any) {
      if (err.hasApplications) {
        setDeleteWarning(
          `Action Required: ${err.applicationCount} student application(s) currently reference "${programToDelete.name}". Deleting will remove this program entirely from active intake. You may choose to deactivate (hide) the program instead or confirm permanent force deletion.`
        );
        setAllowForceDelete(true);
      } else {
        setDeleteWarning(err.message || 'Failed to delete scholarship program.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleActiveQuick = async (prog: ScholarshipProgramItem) => {
    try {
      const progId = prog.id || prog._id || prog.name;
      const nextStatus = !prog.isActive;
      await updateScholarshipApi(progId, { isActive: nextStatus });
      showToast(`Program "${prog.name}" is now ${nextStatus ? 'Active' : 'Hidden from student intake'}.`);
      await loadPrograms();
      if (onProgramChange) onProgramChange();
    } catch (err: any) {
      showToast(`Error: ${err.message || 'Could not update status'}`);
    }
  };

  // Filtered List
  const filteredPrograms = useMemo(() => {
    return programs.filter((prog) => {
      if (categoryFilter !== 'All' && prog.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = prog.name.toLowerCase().includes(q);
        const matchAgency = prog.agency.toLowerCase().includes(q);
        const matchDesc = prog.description.toLowerCase().includes(q);
        if (!matchName && !matchAgency && !matchDesc) return false;
      }
      return true;
    });
  }, [programs, categoryFilter, searchQuery]);

  // Metric Stats
  const stats = useMemo(() => {
    const total = programs.length;
    const activeCount = programs.filter((p) => p.isActive).length;
    const totalSlotsSum = programs.reduce((sum, p) => sum + (p.totalSlots || 0), 0);
    const allocatedSlotsSum = programs.reduce((sum, p) => sum + (p.allocatedSlots || 0), 0);
    return { total, activeCount, totalSlotsSum, allocatedSlotsSum };
  }, [programs]);

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-900 text-white px-4 py-3 rounded-lg shadow-xl text-xs flex items-center gap-2 border border-neutral-700 animate-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner / Metrics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs">
          <div className="text-xs font-medium text-neutral-500">Total Scholarship Grants</div>
          <div className="text-2xl font-bold text-neutral-900 mt-2 font-mono">{stats.total}</div>
          <div className="text-xs text-neutral-500 mt-1">Configured in central database</div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs">
          <div className="text-xs font-medium text-neutral-500">Active Intake Programs</div>
          <div className="text-2xl font-bold text-emerald-700 mt-2 font-mono">{stats.activeCount}</div>
          <div className="text-xs text-neutral-500 mt-1">Open for online student filing</div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs">
          <div className="text-xs font-medium text-neutral-500">Total Intake Quota Slots</div>
          <div className="text-2xl font-bold text-neutral-900 mt-2 font-mono">{stats.totalSlotsSum}</div>
          <div className="text-xs text-neutral-500 mt-1">Authorized institutional capacity</div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-xs">
          <div className="text-xs font-medium text-neutral-500">Allocated Candidates</div>
          <div className="text-2xl font-bold text-maroon-primary mt-2 font-mono">{stats.allocatedSlotsSum}</div>
          <div className="text-xs text-neutral-500 mt-1">
            {stats.totalSlotsSum > 0
              ? `${Math.round((stats.allocatedSlotsSum / stats.totalSlotsSum) * 100)}% overall intake utilization`
              : 'No quotas set'}
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-xl shadow-xs border border-neutral-200 overflow-hidden">
        {/* Header & Controls Toolbar */}
        <div className="p-4 sm:p-5 border-b border-neutral-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-maroon-primary" />
                <h2 className="text-base font-bold text-neutral-900">
                  Institutional Scholarship Programs Catalog
                </h2>
              </div>
              <p className="text-xs text-neutral-500 mt-0.5">
                Dynamic configuration of scholarship grants, sponsoring agencies, stipend rates, GWA/income criteria, and quota limits.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={loadPrograms}
                disabled={isLoading}
                className="p-2 rounded-lg text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 border border-neutral-200 cursor-pointer transition-colors"
                title="Refresh scholarship catalog"
              >
                <RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>

              <button
                type="button"
                onClick={openAddModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-maroon-primary hover:bg-maroon-hover text-white shadow-2xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Scholarship</span>
              </button>
            </div>
          </div>

          {/* Search & Category Filter Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by program name, agency, or description..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-maroon-primary focus:border-maroon-primary placeholder:text-neutral-400"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              {(['All', 'National Government', 'Institutional', 'LGU / Private'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    categoryFilter === cat
                      ? 'bg-maroon-primary text-white shadow-xs'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Table */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-neutral-400">
            <Loader2 className="w-8 h-8 animate-spin text-maroon-primary mb-2" />
            <p className="text-xs">Loading institutional scholarship catalog...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3">
            <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
            <p className="text-xs font-semibold text-neutral-800">{error}</p>
            <button
              type="button"
              onClick={loadPrograms}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-maroon-primary text-white hover:bg-maroon-hover transition-colors cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        ) : filteredPrograms.length === 0 ? (
          <div className="py-16 text-center text-neutral-400 space-y-2">
            <GraduationCap className="w-10 h-10 text-neutral-300 mx-auto" />
            <p className="text-xs font-semibold text-neutral-700">No scholarship programs found.</p>
            <p className="text-[11px] text-neutral-500">
              {searchQuery || categoryFilter !== 'All'
                ? 'Try adjusting your search query or category filter.'
                : 'Click "Add Scholarship" above to register your first grant.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-700 border-collapse">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 uppercase text-[10px] tracking-wider font-bold">
                <tr>
                  <th className="py-3 px-4">Program &amp; Sponsoring Agency</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Semestral Stipend</th>
                  <th className="py-3 px-4">Eligibility Criteria</th>
                  <th className="py-3 px-3">Quota Slots</th>
                  <th className="py-3 px-3">Intake Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 bg-white">
                {filteredPrograms.map((prog) => {
                  const allocated = prog.allocatedSlots || 0;
                  const total = prog.totalSlots || 0;
                  const pct = total > 0 ? Math.round((allocated / total) * 100) : 0;
                  const isLocked = prog.isLocked || false;

                  return (
                    <tr key={prog.id || prog._id || prog.name} className="hover:bg-neutral-50/80 transition-colors">
                      {/* Name & Agency */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-neutral-900 leading-snug">{prog.name}</div>
                        <div className="text-[11px] text-neutral-500 font-medium">{prog.agency}</div>
                        <p className="text-[10px] text-neutral-400 line-clamp-1 mt-0.5 max-w-sm">
                          {prog.description}
                        </p>
                      </td>

                      {/* Category Badge */}
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${
                            prog.category === 'National Government'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : prog.category === 'Institutional'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                        >
                          {prog.category}
                        </span>
                      </td>

                      {/* Semestral Stipend */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="font-black text-maroon-primary text-sm font-mono">
                          PHP {Number(prog.stipendAmount).toLocaleString()}
                        </div>
                        <span className="text-[10px] text-neutral-400">per semester</span>
                      </td>

                      {/* Eligibility Rules */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5 text-[11px]">
                          <div className="text-neutral-700">
                            <span className="text-neutral-400 font-normal">GWA:</span>{' '}
                            <strong>&le; {Number(prog.maxGwa).toFixed(2)}</strong>
                          </div>
                          <div className="text-neutral-700">
                            <span className="text-neutral-400 font-normal">Income Cap:</span>{' '}
                            {prog.maxMonthlyIncome !== null && prog.maxMonthlyIncome !== undefined ? (
                              <strong>&le; PHP {Number(prog.maxMonthlyIncome).toLocaleString()}/mo</strong>
                            ) : (
                              <span className="text-neutral-400 italic">No financial ceiling</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Quota Progress */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-mono text-xs">
                          <Users className="w-3.5 h-3.5 text-neutral-400" />
                          <span className="font-bold text-neutral-900">{allocated}</span>
                          <span className="text-neutral-400">/</span>
                          <span className="text-neutral-600">{total}</span>
                          <span className="text-[10px] text-neutral-400">({pct}%)</span>
                        </div>
                        <div className="w-24 bg-neutral-100 rounded-full h-1.5 mt-1 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              pct >= 100
                                ? 'bg-red-600'
                                : pct >= 80
                                ? 'bg-amber-500'
                                : 'bg-emerald-600'
                            }`}
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                        {isLocked && (
                          <span className="text-[9px] font-bold text-amber-700 uppercase tracking-wider block mt-0.5">
                            Locked by Admin
                          </span>
                        )}
                      </td>

                      {/* Status Toggle Badge */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleActiveQuick(prog)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${
                            prog.isActive
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                              : 'bg-neutral-100 text-neutral-600 border-neutral-300 hover:bg-neutral-200'
                          }`}
                          title={`Click to ${prog.isActive ? 'hide from student intake' : 'activate for student intake'}`}
                        >
                          {prog.isActive ? (
                            <>
                              <Eye className="w-3 h-3 text-emerald-600" />
                              <span>Active Intake</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3 text-neutral-400" />
                              <span>Hidden / Inactive</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(prog)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-neutral-300 text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
                            title="Edit program parameters"
                          >
                            <Edit2 className="w-3 h-3 text-neutral-500" />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => promptDelete(prog)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-red-200 text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete scholarship program"
                          >
                            <Trash2 className="w-3 h-3 text-red-500" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* ADD / EDIT SCHOLARSHIP MODAL                                              */}
      {/* ========================================================================= */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-neutral-300 overflow-hidden animate-in fade-in duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-neutral-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-maroon-subtle text-maroon-primary border border-red-200 flex-shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900">
                    {editingProgram ? 'Edit Scholarship Program' : 'Register New Scholarship Grant'}
                  </h3>
                  <p className="text-xs text-neutral-500">
                    {editingProgram
                      ? 'Update financial benefits, eligibility limits, or slot allocation'
                      : 'Define program details, sponsoring agency, criteria, and initialize intake quota'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="p-5 sm:p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Program Name */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Scholarship Program Name <span className="text-red-600 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Tertiary Education Subsidy (TES)"
                    className="w-full text-xs font-medium px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-maroon-primary focus:border-maroon-primary bg-white"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Program Category <span className="text-red-600 font-bold">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full text-xs font-medium px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-maroon-primary focus:border-maroon-primary bg-white cursor-pointer"
                  >
                    <option value="National Government">National Government</option>
                    <option value="Institutional">Institutional</option>
                    <option value="LGU / Private">LGU / Private</option>
                  </select>
                </div>

                {/* Sponsoring Agency */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Sponsoring Agency / Office <span className="text-red-600 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={agency}
                    onChange={(e) => setAgency(e.target.value)}
                    placeholder="e.g. CHED UniFAST, DOST-SEI, EARIST SFAO"
                    className="w-full text-xs font-medium px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-maroon-primary focus:border-maroon-primary bg-white"
                  />
                </div>

                {/* Semestral Stipend */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Semestral Stipend Amount (PHP) <span className="text-red-600 font-bold">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={500}
                    value={stipendAmount}
                    onChange={(e) => setStipendAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="20000"
                    className="w-full text-xs font-mono font-medium px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-maroon-primary focus:border-maroon-primary bg-white"
                  />
                </div>

                {/* Total Quota Slots */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Total Quota Slots <span className="text-red-600 font-bold">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={totalSlots}
                    onChange={(e) => setTotalSlots(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="50"
                    className="w-full text-xs font-mono font-medium px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-maroon-primary focus:border-maroon-primary bg-white"
                  />
                </div>

                {/* Max GWA Limit */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Maximum GWA Limit (e.g. 1.75 or 3.00)
                  </label>
                  <input
                    type="number"
                    step={0.01}
                    min={1.0}
                    max={5.0}
                    value={maxGwa}
                    onChange={(e) => setMaxGwa(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="3.00"
                    className="w-full text-xs font-mono font-medium px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-maroon-primary focus:border-maroon-primary bg-white"
                  />
                  <span className="text-[10px] text-neutral-400 block mt-0.5">
                    Students with GWA higher than this value cannot apply (Philippine grading 1.00 is highest).
                  </span>
                </div>

                {/* Max Monthly Income */}
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Max Monthly Household Income (PHP, Optional)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={maxMonthlyIncome}
                    onChange={(e) => setMaxMonthlyIncome(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Leave empty if no financial cap"
                    className="w-full text-xs font-mono font-medium px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-maroon-primary focus:border-maroon-primary bg-white"
                  />
                  <span className="text-[10px] text-neutral-400 block mt-0.5">
                    Statutory threshold for low-income assistance (e.g. ₱33,333). Leave blank if merit-only.
                  </span>
                </div>

                {/* Description */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Program Mandate &amp; Description <span className="text-red-600 font-bold">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Summary of grant objectives, qualification criteria, and statutory background..."
                    className="w-full text-xs font-medium px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-maroon-primary focus:border-maroon-primary bg-white resize-none"
                  />
                </div>

                {/* Active Intake Toggle */}
                <div className="sm:col-span-2 pt-2 border-t border-neutral-100 flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-neutral-800 block">
                      Active Intake Status
                    </label>
                    <span className="text-[11px] text-neutral-500">
                      When enabled, this grant appears in the public catalog and student application form.
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsActive(!isActive)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isActive ? 'bg-maroon-primary' : 'bg-neutral-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        isActive ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-neutral-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-bold bg-maroon-primary hover:bg-maroon-hover text-white shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Program...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{editingProgram ? 'Update Program' : 'Create Program'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION MODAL (CUSTOM TAILWIND INSTITUTIONAL DIALOG)           */}
      {/* ========================================================================= */}
      {programToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-neutral-300 overflow-hidden animate-in fade-in duration-150">
            {/* Header */}
            <div className="p-5 border-b border-neutral-200 flex items-center justify-between bg-red-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-red-100 text-red-700 border border-red-200 flex-shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">
                    Delete Scholarship Program
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    SFAO Institutional Action Confirmation
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setProgramToDelete(null)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-3 text-xs text-neutral-700">
              <p>
                Are you sure you want to permanently delete{' '}
                <strong className="text-neutral-900">{programToDelete.name}</strong> from the
                central scholarship catalog?
              </p>

              {deleteWarning ? (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 text-xs space-y-2">
                  <p className="leading-relaxed">{deleteWarning}</p>
                  <p className="text-[11px] font-semibold text-amber-950">
                    Recommended: Click &quot;Deactivate Program&quot; instead to safely hide it without disrupting existing historical records.
                  </p>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200 text-neutral-600 text-[11px] space-y-1">
                  <p>
                    • The associated intake quota record and slot capacity limits will be removed.
                  </p>
                  <p>
                    • This action will be recorded into the immutable SFAO Audit Trail (R.A. 10173).
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="pt-3 border-t border-neutral-200 flex items-center justify-end gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setProgramToDelete(null)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 cursor-pointer"
                >
                  Cancel
                </button>

                {allowForceDelete && (
                  <button
                    type="button"
                    onClick={() => {
                      handleToggleActiveQuick(programToDelete);
                      setProgramToDelete(null);
                    }}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 cursor-pointer"
                  >
                    Deactivate Program Instead
                  </button>
                )}

                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => confirmDelete(allowForceDelete)}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{allowForceDelete ? 'Confirm Force Delete' : 'Confirm Delete'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScholarshipManagementTab;
