import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { EaristLogo } from '../common/EaristLogo';
import { Eye, EyeOff, AlertCircle, CheckCircle2, X, GraduationCap, ArrowRight, UserPlus, LogIn, Loader2 } from 'lucide-react';
import type { AuthUser, CollegeCode } from '../../types';
import { ForgotPasswordOtpModal } from './ForgotPasswordOtpModal';
import { registerStudentApi } from '../../utils/api';

interface LoginPageProps {
  onBackToHome: () => void;
  onLoginSuccess: (user?: AuthUser) => void;
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

export const LoginPage: React.FC<LoginPageProps> = ({ onBackToHome, onLoginSuccess }) => {
  const { loginWithCredentials } = useAuth();

  const [activeMode, setActiveMode] = useState<'signin' | 'register'>('signin');

  // Sign In State
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Register State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regStudentNumber, setRegStudentNumber] = useState('');
  const [regCollege, setRegCollege] = useState<CollegeCode>('CIT');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);

  // Forgot Password Modal State
  const [forgotPasswordModalOpen, setForgotPasswordModalOpen] = useState(false);

  // Handle Sign In Submit
  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const result = await loginWithCredentials(usernameOrEmail, password);
      setIsSubmitting(false);

      if (result.success) {
        onLoginSuccess(result.user);
      } else {
        setErrorMessage(
          result.error || 'Invalid institutional credentials. Please check your username and password.'
        );
      }
    } catch (err: unknown) {
      setIsSubmitting(false);
      setErrorMessage(
        err instanceof Error ? err.message : 'Authentication encountered an unexpected error.'
      );
    }
  };

  // Handle Student Registration Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!regName.trim() || !regEmail.trim() || !regStudentNumber.trim() || !regPassword) {
      setErrorMessage('Please fill in all required registration fields.');
      return;
    }

    const studentNoRegex = /^\d{4}-\d{5}-MN-\d$/;
    if (!studentNoRegex.test(regStudentNumber.trim())) {
      setErrorMessage(
        'Invalid EARIST Student ID format. Format must match: YYYY-NNNNN-MN-0 (e.g., 2024-00123-MN-0).'
      );
      return;
    }

    if (regPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters in length.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Passwords do not match. Please verify your password entry.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await registerStudentApi({
        name: regName.trim(),
        email: regEmail.trim().toLowerCase(),
        studentNumber: regStudentNumber.trim(),
        college: regCollege,
        password: regPassword,
      });

      setIsSubmitting(false);
      setSuccessMessage(
        result.message || 'Student account created successfully! Please sign in with your credentials.'
      );
      // Switch back to Sign In with registered email pre-filled
      setUsernameOrEmail(regEmail.trim().toLowerCase());
      setPassword('');
      setActiveMode('signin');

      // Clear reg fields
      setRegName('');
      setRegEmail('');
      setRegStudentNumber('');
      setRegPassword('');
      setRegConfirmPassword('');
    } catch (err: unknown) {
      setIsSubmitting(false);
      setErrorMessage(
        err instanceof Error ? err.message : 'Registration failed. Please try again.'
      );
    }
  };

  return (
    <div
      className="min-h-screen w-full relative flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat font-sans text-neutral-900 selection:bg-gold-light selection:text-maroon-deep"
      style={{ backgroundImage: "url('/images/earist%20bg.jpg')" }}
    >
      {/* Subtle Dark Background Overlay with Soft Blur */}
      <div
        className="bg-black/55 backdrop-blur-[2px] fixed inset-0"
        aria-hidden="true"
      />

      {/* Elevated Solid White Card Container */}
      <div className="w-full max-w-md relative z-10 bg-white rounded-2xl shadow-2xl border border-white/80 p-7 sm:p-9 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Minimalist Branding & Header */}
        <div className="text-center">
          <div className="flex justify-center mb-2.5">
            <EaristLogo size={46} showText={false} />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-neutral-900 uppercase">
            EARIST SFAO
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Scholarship &amp; Financial Assistance Institutional Portal
          </p>
        </div>

        {/* Tab Switcher: Sign In vs Student Registration */}
        <div className="flex items-center p-1 bg-neutral-100 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setActiveMode('signin');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeMode === 'signin'
                ? 'bg-white text-maroon-primary shadow-xs font-bold'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveMode('register');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeMode === 'register'
                ? 'bg-white text-maroon-primary shadow-xs font-bold'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create Student Account</span>
          </button>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span className="flex-1 font-medium">{successMessage}</span>
            <button
              type="button"
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-500 hover:text-emerald-700 cursor-pointer"
              aria-label="Dismiss message"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <span className="flex-1 font-medium">{errorMessage}</span>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-red-400 hover:text-red-600 cursor-pointer"
              aria-label="Dismiss error"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* MODE 1: SIGN IN FORM                                                      */}
        {/* ========================================================================= */}
        {activeMode === 'signin' && (
          <form onSubmit={handleSignInSubmit} className="space-y-4">
            {/* Field 1: Email, Student ID, or Employee ID */}
            <div className="space-y-1.5">
              <label
                htmlFor="usernameOrEmail"
                className="block text-xs font-medium text-neutral-700"
              >
                Institutional Email or ID Number
              </label>
              <input
                id="usernameOrEmail"
                name="usernameOrEmail"
                type="text"
                autoComplete="username"
                required
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                placeholder="name@earist.edu.ph, 2024-00123-MN-0, or Employee ID"
                className="w-full border border-neutral-300 focus:border-maroon-primary focus:ring-1 focus:ring-maroon-primary rounded-lg px-3.5 py-2.5 text-xs bg-white placeholder:text-neutral-400 outline-none transition-colors"
              />
            </div>

            {/* Field 2: Password with Right-Aligned Forgot Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-xs font-medium text-neutral-700"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setForgotPasswordModalOpen(true)}
                  className="text-xs text-maroon-primary hover:text-maroon-hover font-semibold transition-colors cursor-pointer hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-neutral-300 focus:border-maroon-primary focus:ring-1 focus:ring-maroon-primary rounded-lg px-3.5 py-2.5 pr-10 text-xs bg-white placeholder:text-neutral-400 outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-600 transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Action Button */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-maroon-primary hover:bg-maroon-hover text-white font-semibold text-xs py-2.5 rounded-lg transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* MODE 2: CREATE STUDENT ACCOUNT FORM                                       */}
        {/* ========================================================================= */}
        {activeMode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3">
            {/* Student Full Name */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-neutral-700">
                Full Legal Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="e.g. Maria Clara S. Santos"
                className="w-full border border-neutral-300 focus:border-maroon-primary focus:ring-1 focus:ring-maroon-primary rounded-lg px-3.5 py-2 text-xs bg-white placeholder:text-neutral-400 outline-none"
              />
            </div>

            {/* Student ID Number & Enrolled College */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-neutral-700">
                  Student Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={regStudentNumber}
                  onChange={(e) => setRegStudentNumber(e.target.value)}
                  placeholder="2024-00123-MN-0"
                  className="w-full font-mono border border-neutral-300 focus:border-maroon-primary focus:ring-1 focus:ring-maroon-primary rounded-lg px-3 py-2 text-xs bg-white placeholder:text-neutral-400 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-neutral-700">
                  Enrolled College <span className="text-red-500">*</span>
                </label>
                <select
                  value={regCollege}
                  onChange={(e) => setRegCollege(e.target.value as CollegeCode)}
                  className="w-full border border-neutral-300 focus:border-maroon-primary focus:ring-1 focus:ring-maroon-primary rounded-lg px-2.5 py-2 text-xs bg-white text-neutral-800 outline-none font-medium cursor-pointer"
                >
                  {COLLEGES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Email Address */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-neutral-700">
                Institutional or Personal Gmail <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="student@earist.edu.ph or gmail.com"
                className="w-full border border-neutral-300 focus:border-maroon-primary focus:ring-1 focus:ring-maroon-primary rounded-lg px-3.5 py-2 text-xs bg-white placeholder:text-neutral-400 outline-none"
              />
            </div>

            {/* Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-neutral-700">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Min 6 chars"
                    className="w-full border border-neutral-300 focus:border-maroon-primary focus:ring-1 focus:ring-maroon-primary rounded-lg px-3 py-2 pr-8 text-xs bg-white placeholder:text-neutral-400 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                  >
                    {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-neutral-700">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showRegConfirmPassword ? 'text' : 'password'}
                    required
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Re-type password"
                    className="w-full border border-neutral-300 focus:border-maroon-primary focus:ring-1 focus:ring-maroon-primary rounded-lg px-3 py-2 pr-8 text-xs bg-white placeholder:text-neutral-400 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                  >
                    {showRegConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Submit Registration Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-maroon-primary hover:bg-maroon-hover text-white font-semibold text-xs py-2.5 rounded-lg transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <GraduationCap className="w-4 h-4" />
                    <span>Register Student Account</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Minimalist Navigation Link */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={onBackToHome}
            className="text-xs text-neutral-500 hover:text-neutral-800 transition-colors cursor-pointer"
          >
            ← Back to EARIST Portal
          </button>
        </div>

        {/* Refined Muted Legal Note */}
        <p className="text-[11px] text-neutral-400 text-center pt-1 border-t border-neutral-100">
          Republic Act 10173 • Secure SFAO Institutional Portal
        </p>
      </div>

      {/* Gmail OTP Password Recovery Modal */}
      <ForgotPasswordOtpModal
        isOpen={forgotPasswordModalOpen}
        onClose={() => setForgotPasswordModalOpen(false)}
        initialEmail={usernameOrEmail.includes('@') ? usernameOrEmail : ''}
        onResetSuccess={(resetEmail) => {
          setUsernameOrEmail(resetEmail);
          setPassword('');
          setSuccessMessage(
            'Your password has been reset successfully. Please sign in with your new credentials.'
          );
        }}
      />
    </div>
  );
};

export default LoginPage;
