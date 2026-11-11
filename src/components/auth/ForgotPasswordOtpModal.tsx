import React, { useState } from 'react';
import { EaristLogo } from '../common/EaristLogo';
import {
  X,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RotateCcw,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';
import { requestPasswordOtpApi, verifyOtpAndResetPasswordApi } from '../../utils/api';

interface ForgotPasswordOtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetSuccess: (email: string) => void;
  initialEmail?: string;
}

export const ForgotPasswordOtpModal: React.FC<ForgotPasswordOtpModalProps> = ({
  isOpen,
  onClose,
  onResetSuccess,
  initialEmail = '',
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isSimulatedNotice, setIsSimulatedNotice] = useState(false);

  if (!isOpen) return null;

  // Handle Step 1: Request 6-digit OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    const targetEmail = email.trim().toLowerCase();
    if (!targetEmail) {
      setErrorMessage('Please enter your institutional email address.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await requestPasswordOtpApi(targetEmail);
      setIsLoading(false);
      setIsSimulatedNotice(Boolean(result.simulated));
      setInfoMessage(
        result.simulated
          ? 'Verification code generated! (Dev mode: check terminal console for the 6-digit code)'
          : 'A 6-digit verification code has been dispatched to your email address.'
      );
      setStep(2);
    } catch (err: unknown) {
      setIsLoading(false);
      setErrorMessage(
        err instanceof Error ? err.message : 'Unable to dispatch verification code. Please try again.'
      );
    }
  };

  // Handle Step 2: Verify OTP and Reset Password
  const handleVerifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length !== 6) {
      setErrorMessage('Please enter the complete 6-digit verification code.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('New password must contain at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify both fields.');
      return;
    }

    setIsLoading(true);
    try {
      await verifyOtpAndResetPasswordApi({
        email: email.trim().toLowerCase(),
        otp: cleanOtp,
        newPassword,
      });
      setIsLoading(false);
      setStep(3);
    } catch (err: unknown) {
      setIsLoading(false);
      setErrorMessage(
        err instanceof Error ? err.message : 'Verification failed. Please check your code.'
      );
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    setErrorMessage(null);
    setInfoMessage(null);
    setIsLoading(true);
    try {
      const result = await requestPasswordOtpApi(email.trim().toLowerCase());
      setIsLoading(false);
      setIsSimulatedNotice(Boolean(result.simulated));
      setInfoMessage(
        result.simulated
          ? 'New code generated! (Check terminal console for the 6-digit code)'
          : 'A fresh 6-digit verification code has been dispatched.'
      );
    } catch (err: unknown) {
      setIsLoading(false);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to resend code.');
    }
  };

  const handleFinish = () => {
    onResetSuccess(email.trim().toLowerCase());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 selection:bg-gold-light selection:text-maroon-deep">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-neutral-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header Strip */}
        <div className="bg-maroon-primary px-6 py-4 flex items-center justify-between text-white border-b-2 border-gold-primary">
          <div className="flex items-center gap-2.5">
            <EaristLogo size={28} showText={false} lightMode={true} />
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Institutional Password Recovery
              </h3>
              <p className="text-[10px] text-gold-light">EARIST SFAO Secure Verification</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10 cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-7 space-y-5">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3 text-[11px]">
            <span
              className={`font-semibold ${
                step === 1 ? 'text-maroon-primary' : 'text-neutral-400'
              }`}
            >
              1. Email Address
            </span>
            <span className="text-neutral-300">→</span>
            <span
              className={`font-semibold ${
                step === 2 ? 'text-maroon-primary' : 'text-neutral-400'
              }`}
            >
              2. 6-Digit OTP & Password
            </span>
            <span className="text-neutral-300">→</span>
            <span
              className={`font-semibold ${
                step === 3 ? 'text-emerald-700' : 'text-neutral-400'
              }`}
            >
              3. Verified
            </span>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <span className="flex-1 font-medium">{errorMessage}</span>
            </div>
          )}

          {/* Info / Success Message */}
          {infoMessage && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span className="flex-1 font-medium">{infoMessage}</span>
            </div>
          )}

          {/* Dev Simulation Notice */}
          {isSimulatedNotice && step === 2 && (
            <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
              <span>Simulated delivery: The 6-digit code has been output to your terminal server console.</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 1: Enter Registered Email Address                                    */}
          {/* ========================================================================= */}
          {step === 1 && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-neutral-700">
                  Institutional Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@earist.edu.ph or gmail.com"
                    className="w-full text-xs pl-9 pr-3 py-2.5 bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-primary focus:border-transparent font-sans"
                  />
                </div>
                <p className="text-[11px] text-neutral-500 pt-0.5">
                  Enter your registered institutional account or personal recovery email.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-maroon-primary hover:bg-maroon-hover text-white font-semibold text-xs py-2.5 rounded-lg transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending Verification Code...</span>
                    </>
                  ) : (
                    <span>Send 6-Digit OTP</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: Enter 6-Digit OTP & New Password                                  */}
          {/* ========================================================================= */}
          {step === 2 && (
            <form onSubmit={handleVerifyAndReset} className="space-y-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-neutral-700">
                    6-Digit Verification Code (OTP)
                  </label>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isLoading}
                    className="text-[11px] text-maroon-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Resend Code</span>
                  </button>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="000000"
                  className="w-full text-center text-xl font-mono font-bold tracking-widest py-2 bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-primary focus:border-transparent text-maroon-primary placeholder:text-neutral-300"
                />
                <p className="text-[10px] text-neutral-500 text-center">
                  Verification code valid for 10 minutes.
                </p>
              </div>

              {/* New Password */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-neutral-700">
                  New Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full text-xs pl-9 pr-10 py-2.5 bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-primary focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-neutral-700">
                  Confirm New Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type new password"
                    className="w-full text-xs pl-9 pr-10 py-2.5 bg-white border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maroon-primary focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-3 py-2.5 rounded-lg border border-neutral-300 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-maroon-primary hover:bg-maroon-hover text-white font-semibold text-xs py-2.5 rounded-lg transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Verifying & Resetting...</span>
                    </>
                  ) : (
                    <span>Verify & Reset Password</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: Success Screen                                                    */}
          {/* ========================================================================= */}
          {step === 3 && (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-500 text-emerald-600 animate-in zoom-in duration-300">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-neutral-900">
                  Password Reset Successfully
                </h4>
                <p className="text-xs text-neutral-600 max-w-xs mx-auto">
                  Your institutional credentials have been updated securely. You may now proceed to sign in with your new password.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleFinish}
                  className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-semibold text-xs py-2.5 rounded-lg transition-colors shadow-xs cursor-pointer"
                >
                  Return to Sign In
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer info note */}
        <div className="bg-neutral-50 px-6 py-3 border-t border-neutral-100 text-center text-[10px] text-neutral-400">
          Secured with SHA-256 OTP Cryptography • EARIST e-SFAO
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordOtpModal;
