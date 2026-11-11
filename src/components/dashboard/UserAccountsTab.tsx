import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  UserPlus,
  Shield,
  GraduationCap,
  Building,
  CheckCircle2,
  AlertCircle,
  X,
  Lock,
  Loader2,
  RefreshCw,
  Power,
  SlidersHorizontal,
} from 'lucide-react';
import type { UserRecord } from '../../utils/api';
import { fetchUsersApi, createStaffUserApi, toggleUserStatusApi } from '../../utils/api';
import type { CollegeCode } from '../../types';

interface UserAccountsTabProps {
  adminEmail: string;
  adminName: string;
}

const COLLEGES: { code: CollegeCode; name: string }[] = [
  { code: 'CAS', name: 'CAS — College of Arts and Sciences' },
  { code: 'CBA', name: 'CBA — College of Business Administration' },
  { code: 'CED', name: 'CED — College of Education' },
  { code: 'CIT', name: 'CIT — College of Industrial Technology' },
  { code: 'CEN', name: 'CEN — College of Engineering' },
  { code: 'CAFA', name: 'CAFA — College of Architecture & Fine Arts' },
  { code: 'CHM', name: 'CHM — College of Hospitality Management' },
];

export const UserAccountsTab: React.FC<UserAccountsTabProps> = ({ adminEmail, adminName }) => {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<'All' | 'student' | 'evaluator' | 'admin'>('All');
  const [selectedStatus, setSelectedStatus] = useState<'All' | 'active' | 'suspended'>('All');

  // Create Staff Account Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [modalRole, setModalRole] = useState<'evaluator' | 'admin'>('evaluator');
  const [modalCollege, setModalCollege] = useState<CollegeCode>('CIT');
  const [modalName, setModalName] = useState('');
  const [modalEmail, setModalEmail] = useState('');
  const [modalPassword, setModalPassword] = useState('');
  const [modalEmployeeId, setModalEmployeeId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Load Users
  const loadUsers = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await fetchUsersApi();
      setUsers(data);
    } catch (err: unknown) {
      console.warn('Could not load users from backend:', err);
      // Fallback demo users if offline
      setUsers([
        {
          id: 'usr-admin-1',
          name: 'Dr. Rogelio T. Mamaradlo',
          email: 'admin@earist.edu.ph',
          role: 'admin',
          college: null,
          employeeId: 'ADM-2024-001',
          isActive: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'usr-eval-1',
          name: 'Prof. Noel Carpio',
          email: 'evaluator@earist.edu.ph',
          role: 'evaluator',
          college: 'CIT',
          employeeId: 'EVL-CIT-004',
          isActive: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'usr-student-1',
          name: 'Juan Dela Cruz',
          email: 'student@earist.edu.ph',
          role: 'student',
          college: 'CIT',
          studentNumber: '2023-01849-MN-0',
          isActive: true,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Role Filter
      if (selectedRole !== 'All' && u.role !== selectedRole) {
        return false;
      }

      // Status Filter
      if (selectedStatus === 'active' && !u.isActive) return false;
      if (selectedStatus === 'suspended' && u.isActive) return false;

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchesName = u.name.toLowerCase().includes(query);
        const matchesEmail = u.email.toLowerCase().includes(query);
        const matchesStudentId = u.studentNumber?.toLowerCase().includes(query);
        const matchesEmployeeId = u.employeeId?.toLowerCase().includes(query);
        const matchesCollege = u.college?.toLowerCase().includes(query);
        return matchesName || matchesEmail || matchesStudentId || matchesEmployeeId || matchesCollege;
      }

      return true;
    });
  }, [users, selectedRole, selectedStatus, searchQuery]);

  // Telemetry Counts
  const telemetry = useMemo(() => {
    const total = users.length;
    const evaluators = users.filter((u) => u.role === 'evaluator').length;
    const students = users.filter((u) => u.role === 'student').length;
    const admins = users.filter((u) => u.role === 'admin').length;
    const activeCount = users.filter((u) => u.isActive).length;
    return { total, evaluators, students, admins, activeCount };
  }, [users]);

  // Handle Toggle Status
  const handleToggleStatus = async (user: UserRecord) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const nextStatus = !user.isActive;
    const actionLabel = nextStatus ? 'activate' : 'suspend';

    // Protect Super Admin self-suspension
    if (user.email === adminEmail && !nextStatus) {
      setErrorMessage('Security restriction: You cannot deactivate your own active Super Administrator account.');
      return;
    }

    try {
      await toggleUserStatusApi(user.id || (user as { _id?: string })._id || '', nextStatus, adminName, adminEmail);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id || (u as { _id?: string })._id === user.id ? { ...u, isActive: nextStatus } : u))
      );
      setSuccessMessage(
        `Account for "${user.name}" has been successfully ${nextStatus ? 'activated' : 'suspended'}.`
      );
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : `Failed to ${actionLabel} user account.`
      );
    }
  };

  // Handle Create Staff Account Submit
  const handleCreateStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (!modalName.trim() || !modalEmail.trim() || !modalPassword) {
      setModalError('Please fill in Name, Email, and Password.');
      return;
    }

    if (modalPassword.length < 6) {
      setModalError('Password must contain at least 6 characters.');
      return;
    }

    setIsCreating(true);
    try {
      const result = await createStaffUserApi({
        name: modalName.trim(),
        email: modalEmail.trim().toLowerCase(),
        password: modalPassword,
        role: modalRole,
        college: modalRole === 'evaluator' ? modalCollege : undefined,
        employeeId: modalEmployeeId.trim() || undefined,
        adminName,
        adminEmail,
      });

      setIsCreating(false);
      setIsCreateModalOpen(false);
      setSuccessMessage(result.message || 'Staff account created successfully.');

      // Refresh list
      loadUsers();

      // Reset fields
      setModalName('');
      setModalEmail('');
      setModalPassword('');
      setModalEmployeeId('');
    } catch (err: unknown) {
      setIsCreating(false);
      setModalError(err instanceof Error ? err.message : 'Failed to create staff account.');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Metrics Telemetry */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Accounts */}
        <div className="bg-white rounded-xl p-5 border border-neutral-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-maroon-primary" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                Total Registered Accounts
              </p>
              <h3 className="text-3xl font-black text-neutral-900 mt-1">
                {telemetry.total}
              </h3>
              <p className="text-[11px] text-neutral-500 mt-1">
                <span className="font-semibold text-emerald-700">{telemetry.activeCount} Active</span> accounts
              </p>
            </div>
            <div className="p-3 rounded-xl bg-maroon-subtle text-maroon-primary">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* College Evaluators */}
        <div className="bg-white rounded-xl p-5 border border-neutral-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-sky-600" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                Department Evaluators
              </p>
              <h3 className="text-3xl font-black text-neutral-900 mt-1">
                {telemetry.evaluators}
              </h3>
              <p className="text-[11px] text-neutral-500 mt-1">
                Scoped across 7 EARIST Colleges
              </p>
            </div>
            <div className="p-3 rounded-xl bg-sky-50 text-sky-700">
              <Building className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Registered Students */}
        <div className="bg-white rounded-xl p-5 border border-neutral-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-600" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                Registered Students
              </p>
              <h3 className="text-3xl font-black text-neutral-900 mt-1">
                {telemetry.students}
              </h3>
              <p className="text-[11px] text-neutral-500 mt-1">
                Self-registered student applicants
              </p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700">
              <GraduationCap className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Super Administrators */}
        <div className="bg-white rounded-xl p-5 border border-neutral-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-purple-600" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                System Administrators
              </p>
              <h3 className="text-3xl font-black text-neutral-900 mt-1">
                {telemetry.admins}
              </h3>
              <p className="text-[11px] text-neutral-500 mt-1">
                Full institutional clearance
              </p>
            </div>
            <div className="p-3 rounded-xl bg-purple-50 text-purple-700">
              <Shield className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-medium">{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-500 hover:text-emerald-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span className="font-medium">{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-red-400 hover:text-red-600 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Controls & Search Toolbar */}
      <div className="bg-white rounded-xl p-5 border border-neutral-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-maroon-subtle text-maroon-primary">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-900">
                Account Directory &amp; Role Assignments
              </h3>
              <p className="text-[11px] text-neutral-500">
                Manage staff credentials, assigned academic colleges, and access status.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={loadUsers}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
              title="Refresh User List"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setModalError(null);
                setIsCreateModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-maroon-primary hover:bg-maroon-hover text-white shadow-2xs transition-all cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 text-gold-light" />
              <span>Create Staff Account</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
          {/* Search Input */}
          <div className="sm:col-span-6 relative">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, employee ID, or student number..."
              className="w-full text-xs pl-8 pr-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-primary font-sans"
            />
          </div>

          {/* Role Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as 'All' | 'student' | 'evaluator' | 'admin')}
              className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-primary font-medium text-neutral-800 cursor-pointer"
            >
              <option value="All">All Roles ({telemetry.total})</option>
              <option value="evaluator">College Evaluators ({telemetry.evaluators})</option>
              <option value="student">Student Scholars ({telemetry.students})</option>
              <option value="admin">Administrators ({telemetry.admins})</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as 'All' | 'active' | 'suspended')}
              className="w-full text-xs px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-primary font-medium text-neutral-800 cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="active">Active Accounts</option>
              <option value="suspended">Suspended Accounts</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. User Accounts Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-[11px] font-bold text-neutral-600 uppercase tracking-wider">
              <tr>
                <th scope="col" className="py-3 px-4">User Name &amp; Email</th>
                <th scope="col" className="py-3 px-4">Institutional Role</th>
                <th scope="col" className="py-3 px-4">Assigned College / ID</th>
                <th scope="col" className="py-3 px-4 text-center">Status</th>
                <th scope="col" className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 font-sans">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-neutral-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-maroon-primary" />
                      <span>Loading institutional user directory...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-neutral-500">
                    <p className="text-sm font-semibold text-neutral-700">No matching user accounts found</p>
                    <p className="text-xs text-neutral-400 mt-1">Try modifying your search criteria or role filters.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const roleBadgeClass =
                    u.role === 'admin'
                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                      : u.role === 'evaluator'
                      ? 'bg-sky-50 text-sky-700 border-sky-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200';

                  const roleTitle =
                    u.role === 'admin'
                      ? 'Super Administrator'
                      : u.role === 'evaluator'
                      ? 'College Evaluator'
                      : 'Student Applicant';

                  return (
                    <tr key={u.id || (u as { _id?: string })._id} className="hover:bg-neutral-50/70 transition-colors">
                      {/* Name & Email */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-neutral-900 text-xs">
                          {u.name}
                        </div>
                        <span className="text-[11px] text-neutral-500 font-mono block mt-0.5">
                          {u.email}
                        </span>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${roleBadgeClass}`}
                        >
                          {u.role === 'admin' && <Shield className="w-3 h-3" />}
                          {u.role === 'evaluator' && <Building className="w-3 h-3" />}
                          {u.role === 'student' && <GraduationCap className="w-3 h-3" />}
                          <span>{roleTitle}</span>
                        </span>
                      </td>

                      {/* Affiliation / ID */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs">
                        {u.role === 'evaluator' && (
                          <div className="space-y-0.5">
                            <span className="font-bold text-neutral-800 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">
                              {u.college || 'CIT'}
                            </span>
                            {u.employeeId && (
                              <span className="font-mono text-[11px] text-neutral-500 block">
                                {u.employeeId}
                              </span>
                            )}
                          </div>
                        )}
                        {u.role === 'student' && (
                          <div className="space-y-0.5">
                            <span className="font-mono font-semibold text-neutral-800">
                              {u.studentNumber || 'Student ID Pending'}
                            </span>
                            {u.college && (
                              <span className="text-[10px] text-neutral-500 block font-medium">
                                College: {u.college}
                              </span>
                            )}
                          </div>
                        )}
                        {u.role === 'admin' && (
                          <div className="space-y-0.5">
                            <span className="font-semibold text-neutral-700">
                              Office of SFAO
                            </span>
                            {u.employeeId && (
                              <span className="font-mono text-[11px] text-neutral-500 block">
                                {u.employeeId}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Active/Suspended Status Badge */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {u.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                            <span>Suspended</span>
                          </span>
                        )}
                      </td>

                      {/* Actions: Activate / Suspend */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(u)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-2xs cursor-pointer ${
                            u.isActive
                              ? 'border border-red-200 bg-red-50/50 text-red-700 hover:bg-red-100 hover:border-red-300'
                              : 'border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 hover:border-emerald-300'
                          }`}
                          title={u.isActive ? 'Suspend access for this account' : 'Reactivate account'}
                        >
                          <Power className="w-3.5 h-3.5" />
                          <span>{u.isActive ? 'Suspend' : 'Activate'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Count */}
        <div className="p-3.5 bg-neutral-50 border-t border-neutral-200 text-xs text-neutral-500 flex items-center justify-between">
          <span>Showing {filteredUsers.length} of {telemetry.total} institutional accounts</span>
          <span className="font-mono text-[11px] text-neutral-400">RA 10173 Cryptographic Ledger</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CREATE STAFF ACCOUNT MODAL                                                */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-neutral-200 overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="bg-maroon-primary px-6 py-4 flex items-center justify-between text-white border-b-2 border-gold-primary">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-gold-light" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  Create Staff Account (Evaluator / Admin)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateStaffSubmit} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <span className="flex-1 font-medium">{modalError}</span>
                </div>
              )}

              {/* Select Role */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-neutral-700">
                  Select Staff Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setModalRole('evaluator')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      modalRole === 'evaluator'
                        ? 'border-maroon-primary bg-maroon-subtle text-maroon-primary ring-1 ring-maroon-primary'
                        : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    <Building className="w-3.5 h-3.5" />
                    <span>College Evaluator</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalRole('admin')}
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      modalRole === 'admin'
                        ? 'border-maroon-primary bg-maroon-subtle text-maroon-primary ring-1 ring-maroon-primary'
                        : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Super Administrator</span>
                  </button>
                </div>
              </div>

              {/* If Evaluator: Select College */}
              {modalRole === 'evaluator' && (
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-neutral-700">
                    Assigned EARIST Academic College <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={modalCollege}
                    onChange={(e) => setModalCollege(e.target.value as CollegeCode)}
                    className="w-full border border-neutral-300 focus:border-maroon-primary focus:ring-1 focus:ring-maroon-primary rounded-lg px-3 py-2 text-xs bg-white text-neutral-800 outline-none font-medium cursor-pointer"
                  >
                    {COLLEGES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-neutral-500">
                    Evaluator will have scoped verification authority over this college's applicants.
                  </p>
                </div>
              )}

              {/* Full Name */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-neutral-700">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={modalName}
                  onChange={(e) => setModalName(e.target.value)}
                  placeholder="e.g. Prof. Edgardo M. Reyes"
                  className="w-full border border-neutral-300 focus:border-maroon-primary focus:ring-1 focus:ring-maroon-primary rounded-lg px-3.5 py-2 text-xs bg-white outline-none"
                />
              </div>

              {/* Email Address */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-neutral-700">
                  Institutional Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={modalEmail}
                  onChange={(e) => setModalEmail(e.target.value)}
                  placeholder="evaluator.cas@earist.edu.ph"
                  className="w-full border border-neutral-300 focus:border-maroon-primary focus:ring-1 focus:ring-maroon-primary rounded-lg px-3.5 py-2 text-xs bg-white outline-none font-mono"
                />
              </div>

              {/* Employee ID (Optional) */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-neutral-700">
                  Institutional Employee ID (Optional)
                </label>
                <input
                  type="text"
                  value={modalEmployeeId}
                  onChange={(e) => setModalEmployeeId(e.target.value)}
                  placeholder="EMP-CIT-2026 (Leave blank to auto-generate)"
                  className="w-full font-mono border border-neutral-300 focus:border-maroon-primary focus:ring-1 focus:ring-maroon-primary rounded-lg px-3.5 py-2 text-xs bg-white outline-none"
                />
              </div>

              {/* Temporary Password */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-neutral-700">
                  Initial Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={modalPassword}
                    onChange={(e) => setModalPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full border border-neutral-300 focus:border-maroon-primary focus:ring-1 focus:ring-maroon-primary rounded-lg pl-9 pr-3.5 py-2 text-xs bg-white outline-none"
                  />
                </div>
                <p className="text-[10px] text-neutral-500">
                  Staff member can update their password anytime in their User Profile.
                </p>
              </div>

              {/* Modal Actions */}
              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-neutral-300 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2 rounded-lg bg-maroon-primary hover:bg-maroon-hover text-white text-xs font-bold transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <span>Create Account</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserAccountsTab;
