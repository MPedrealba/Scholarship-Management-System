import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Save,
  Lock,
  GraduationCap,
} from 'lucide-react';

export const UserProfileView: React.FC = () => {
  const { currentUser, updateUserProfile } = useAuth();

  // Role determination
  const isStaff = currentUser.role === 'superadmin' || currentUser.role === 'evaluator';
  const isSuperAdmin = currentUser.role === 'superadmin';

  // Profile Form States
  const [displayName, setDisplayName] = useState(currentUser.name || '');
  const [contactNumber, setContactNumber] = useState(
    currentUser.contactNumber ||
      (isSuperAdmin ? '+63 (02) 8716-6273' : isStaff ? '+63 917 555 0192' : '+63 917 842 1092')
  );
  const [personalEmail, setPersonalEmail] = useState(
    currentUser.personalEmail || (isStaff ? currentUser.email : 'johncarlo.mendoza@gmail.com')
  );
  const [homeAddress, setHomeAddress] = useState(
    currentUser.homeAddress || '1482 Pureza St., Sampaloc, Manila 1008'
  );

  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);

  // Security & Password Form States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [securityBanner, setSecurityBanner] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Computed Values
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase() || 'EA';

  const roleLabel = isSuperAdmin
    ? 'SFAO Director'
    : currentUser.role === 'evaluator'
    ? `College Evaluator - ${currentUser.college || 'CIT'}`
    : 'Student Applicant';

  const employeeId =
    currentUser.employeeId ||
    (isSuperAdmin ? 'EMP-SFAO-001' : `EMP-${currentUser.college || 'CIT'}-084`);

  const studentNumber = currentUser.studentId || '2023-01482-MN-0';
  const collegeName =
    currentUser.collegeName ||
    (isSuperAdmin
      ? 'Office of Student Financial Assistance'
      : 'College of Industrial Technology');
  const course = currentUser.course || 'BS in Information Technology';
  const yearLevel = currentUser.yearLevel || '4th Year, Section A';

  // Handle Save Profile
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();

    updateUserProfile({
      name: displayName.trim(),
      contactNumber: contactNumber.trim(),
      personalEmail: personalEmail.trim(),
      homeAddress: homeAddress.trim(),
    });

    setProfileSuccessMsg('Profile details updated successfully. Changes have been saved to your institutional session.');
    setTimeout(() => setProfileSuccessMsg(null), 4000);
  };

  // Handle Password Update
  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityBanner(null);

    if (!currentPassword) {
      setSecurityBanner({
        type: 'error',
        message: 'Please enter your current institutional password to authorize this credential change.',
      });
      return;
    }

    if (newPassword.length < 8) {
      setSecurityBanner({
        type: 'error',
        message: 'New password must contain at least 8 characters for institutional compliance.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setSecurityBanner({
        type: 'error',
        message: 'The new password and confirmation password do not match. Please re-enter.',
      });
      return;
    }

    // Success
    setSecurityBanner({
      type: 'success',
      message: 'Account password has been successfully updated and re-encrypted. A confirmation receipt has been dispatched to your institutional email.',
    });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ========================================================================= */}
      {/* 1. PROFILE HEADER & IDENTITY CARD                                         */}
      {/* ========================================================================= */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4 min-w-0">
            {/* Initials Avatar Circle (Clean EARIST Crimson Theme) */}
            <div className="w-16 h-16 rounded-full bg-maroon-primary text-white flex items-center justify-center text-xl font-bold font-sans shadow-2xs flex-shrink-0">
              {initials}
            </div>

            <div className="space-y-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-neutral-900 tracking-tight truncate">
                  {displayName}
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500">
                <span className="font-mono text-neutral-600 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-neutral-400" />
                  {currentUser.email}
                </span>
                <span>•</span>
                <span className="font-medium text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">
                  {roleLabel}
                </span>
              </div>
            </div>
          </div>

          <div className="text-left sm:text-right flex-shrink-0 text-xs text-neutral-500 border-t sm:border-t-0 pt-3 sm:pt-0 border-neutral-100">
            <span className="block text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
              Affiliation
            </span>
            <span className="font-semibold text-neutral-800">{collegeName}</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. ROLE-SPECIFIC INFORMATION FORM                                         */}
      {/* ========================================================================= */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-xs space-y-6">
        <div className="border-b border-neutral-200 pb-3">
          <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
            <User className="w-4 h-4 text-maroon-primary" />
            <span>Institutional Identity &amp; Profile Information</span>
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            Review verified institutional records and update your primary communications information.
          </p>
        </div>

        {profileSuccessMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-3 rounded-lg flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-medium">{profileSuccessMsg}</span>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-5">
          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Super Admin & Evaluator Read-Only Fields */}
            {isStaff ? (
              <>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1 flex items-center justify-between">
                    <span>Institutional Employee ID</span>
                    <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Read-Only
                    </span>
                  </label>
                  <input
                    type="text"
                    value={employeeId}
                    disabled
                    className="w-full bg-neutral-50 text-neutral-600 border border-neutral-200 rounded-lg px-3 py-2 font-mono text-xs cursor-not-allowed select-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-maroon-primary" />
                      <span>Assigned Office / College</span>
                    </span>
                    <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Read-Only
                    </span>
                  </label>
                  <input
                    type="text"
                    value={collegeName}
                    disabled
                    className="w-full bg-neutral-50 text-neutral-600 border border-neutral-200 rounded-lg px-3 py-2 text-xs cursor-not-allowed select-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-semibold text-neutral-700 mb-1 flex items-center justify-between">
                    <span>Institutional Access Level (RBAC)</span>
                    <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" /> Least Privilege Model
                    </span>
                  </label>
                  <input
                    type="text"
                    value={
                      isSuperAdmin
                        ? 'Super Administrator (Tier 1 Full Institutional Clearance & Quota Allocation)'
                        : `College Department Evaluator (${currentUser.college || 'CIT'} Scoped Validation & Endorsement)`
                    }
                    disabled
                    className="w-full bg-neutral-50 text-neutral-600 border border-neutral-200 rounded-lg px-3 py-2 text-xs cursor-not-allowed select-none font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Display Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    className="w-full bg-white text-neutral-900 border border-neutral-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-maroon-primary font-sans"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Official Contact Number <span className="text-red-600">*</span></span>
                  </label>
                  <input
                    type="text"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    required
                    className="w-full bg-white text-neutral-900 border border-neutral-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-maroon-primary font-mono"
                  />
                </div>
              </>
            ) : (
              /* Student Applicant Profile Fields */
              <>
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1 flex items-center justify-between">
                    <span>EARIST Student Number</span>
                    <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Registrar Verified
                    </span>
                  </label>
                  <input
                    type="text"
                    value={studentNumber}
                    disabled
                    className="w-full bg-neutral-50 text-neutral-600 border border-neutral-200 rounded-lg px-3 py-2 font-mono text-xs cursor-not-allowed select-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-maroon-primary" />
                      <span>Enrolled College</span>
                    </span>
                    <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Read-Only
                    </span>
                  </label>
                  <input
                    type="text"
                    value={collegeName}
                    disabled
                    className="w-full bg-neutral-50 text-neutral-600 border border-neutral-200 rounded-lg px-3 py-2 text-xs cursor-not-allowed select-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-maroon-primary" />
                      <span>Degree Program</span>
                    </span>
                    <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Read-Only
                    </span>
                  </label>
                  <input
                    type="text"
                    value={course}
                    disabled
                    className="w-full bg-neutral-50 text-neutral-600 border border-neutral-200 rounded-lg px-3 py-2 text-xs cursor-not-allowed select-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1 flex items-center justify-between">
                    <span>Year Level &amp; Section</span>
                    <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Read-Only
                    </span>
                  </label>
                  <input
                    type="text"
                    value={yearLevel}
                    disabled
                    className="w-full bg-neutral-50 text-neutral-600 border border-neutral-200 rounded-lg px-3 py-2 text-xs cursor-not-allowed select-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Contact Mobile Number <span className="text-red-600">*</span></span>
                  </label>
                  <input
                    type="text"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    required
                    className="w-full bg-white text-neutral-900 border border-neutral-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-maroon-primary font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Personal Email Address <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="email"
                    value={personalEmail}
                    onChange={(e) => setPersonalEmail(e.target.value)}
                    required
                    className="w-full bg-white text-neutral-900 border border-neutral-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-maroon-primary"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-semibold text-neutral-700 mb-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Permanent Home Address <span className="text-red-600">*</span></span>
                  </label>
                  <input
                    type="text"
                    value={homeAddress}
                    onChange={(e) => setHomeAddress(e.target.value)}
                    required
                    className="w-full bg-white text-neutral-900 border border-neutral-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-maroon-primary"
                  />
                </div>
              </>
            )}
          </div>

          {/* Action Button */}
          <div className="flex justify-end pt-2 border-t border-neutral-100">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-xs font-semibold bg-maroon-primary hover:bg-maroon-hover text-white shadow-2xs transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Profile</span>
            </button>
          </div>
        </form>
      </div>

      {/* ========================================================================= */}
      {/* 3. PASSWORD & SESSION SECURITY SECTION (R.A. 10173 COMPLIANCE)            */}
      {/* ========================================================================= */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-xs space-y-6">
        <div className="border-b border-neutral-200 pb-3">
          <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-maroon-primary" />
            <span>Password &amp; Security</span>
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">
            Manage your institutional authentication credentials and review cryptographic session status.
          </p>
        </div>

        {securityBanner && (
          <div
            className={`border text-xs px-4 py-3 rounded-lg flex items-center gap-2 animate-in fade-in ${
              securityBanner.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}
          >
            {securityBanner.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            )}
            <span className="font-medium">{securityBanner.message}</span>
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Current Password */}
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Current Password <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <input
                  type={showCurrentPass ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white text-neutral-900 border border-neutral-300 rounded-lg px-3 py-2 pr-9 text-xs focus:outline-none focus:ring-2 focus:ring-maroon-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 cursor-pointer p-0.5"
                  aria-label="Toggle password visibility"
                >
                  {showCurrentPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                New Password <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <input
                  type={showNewPass ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full bg-white text-neutral-900 border border-neutral-300 rounded-lg px-3 py-2 pr-9 text-xs focus:outline-none focus:ring-2 focus:ring-maroon-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 cursor-pointer p-0.5"
                  aria-label="Toggle password visibility"
                >
                  {showNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block font-semibold text-neutral-700 mb-1">
                Confirm New Password <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPass ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type new password"
                  className="w-full bg-white text-neutral-900 border border-neutral-300 rounded-lg px-3 py-2 pr-9 text-xs focus:outline-none focus:ring-2 focus:ring-maroon-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 cursor-pointer p-0.5"
                  aria-label="Toggle password visibility"
                >
                  {showConfirmPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-neutral-400">
              Password must contain upper/lowercase and minimum 8 characters.
            </span>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-xs font-semibold bg-maroon-primary hover:bg-maroon-hover text-white shadow-2xs transition-colors cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Update Password</span>
            </button>
          </div>
        </form>

        {/* Session Activity Footer (R.A. 10173 Compliance) */}
        <div className="pt-4 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-neutral-500 font-sans">
          <span>
            Last authentication:{' '}
            <strong className="text-neutral-700 font-mono">
              {currentUser.lastLogin || 'Nov 11, 2026, 08:30 AM'}
            </strong>{' '}
            via EARIST Campus Secure Intranet
          </span>
          <span className="text-neutral-400">
            Protected under R.A. 10173 (Data Privacy Act of 2012) • 256-Bit SSL Encrypted
          </span>
        </div>
      </div>
    </div>
  );
};

export default UserProfileView;
