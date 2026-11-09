import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { EaristLogo } from '../common/EaristLogo';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  X,
} from 'lucide-react';

interface LoginPageProps {
  onBackToHome: () => void;
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onBackToHome, onLoginSuccess }) => {
  const { loginWithCredentials } = useAuth();

  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [forgotPasswordModalOpen, setForgotPasswordModalOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    // Simulate authentic network latency (400ms)
    setTimeout(() => {
      const result = loginWithCredentials(usernameOrEmail, password);

      if (result.success) {
        setIsSubmitting(false);
        onLoginSuccess();
      } else {
        setIsSubmitting(false);
        setErrorMessage(
          result.error || 'Invalid institutional credentials. Please check your username and password.'
        );
      }
    }, 400);
  };

  const handlePreFillDemo = (email: string) => {
    setUsernameOrEmail(email);
    setPassword('earist2026');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col justify-between relative overflow-hidden font-sans text-neutral-900 selection:bg-amber-300 selection:text-maroon-900">
      {/* Background Watermark: High-Resolution EARIST Seal */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.035] select-none overflow-hidden">
        <EaristLogo size={700} showText={false} />
      </div>

      {/* Top Navigation Bar */}
      <header className="relative z-10 w-full bg-white border-b border-neutral-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <button
            type="button"
            onClick={onBackToHome}
            className="inline-flex items-center gap-2 text-xs font-bold text-[#800000] hover:text-red-950 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>← Back to EARIST Homepage</span>
          </button>

          <div className="flex items-center gap-2 text-[11px] text-neutral-500 font-medium">
            <span className="hidden sm:inline">Republic of the Philippines</span>
            <span className="hidden sm:inline">•</span>
            <span className="font-semibold text-neutral-700">Office of Student Financial Assistance</span>
          </div>
        </div>
      </header>

      {/* Main Centered Login Section */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-neutral-200/80 p-8 sm:p-10 animate-in fade-in zoom-in-95 duration-200">
          {/* Header & Seal Branding */}
          <div className="text-center space-y-2.5 mb-7">
            <div className="flex justify-center mb-1">
              <EaristLogo size={72} showText={false} />
            </div>

            <div>
              <p className="text-[10px] uppercase font-bold tracking-widest text-[#800000]">
                Eulogio &apos;Amang&apos; Rodriguez Institute of Science and Technology
              </p>
              <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight mt-1">
                SFAO Institutional Portal
              </h1>
            </div>

            <p className="text-xs text-neutral-500 leading-relaxed max-w-xs mx-auto">
              Sign in with your EARIST faculty, evaluator, or administrative credentials.
            </p>
          </div>

          {/* Error Alert Banner */}
          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-800 animate-in shake duration-150">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-red-500 hover:text-red-800"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Authentication Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Field 1: Institutional Email / Username */}
            <div className="space-y-1.5">
              <label
                htmlFor="usernameOrEmail"
                className="block text-xs font-bold text-neutral-700 uppercase tracking-wider"
              >
                Username / Institutional Email
              </label>
              <div className="relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="usernameOrEmail"
                  name="usernameOrEmail"
                  type="text"
                  autoComplete="username"
                  required
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="e.g., evaluator@earist.edu.ph or Employee ID"
                  className="block w-full pl-9 pr-3 py-2.5 text-xs bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-transparent text-neutral-900 placeholder:text-neutral-400 font-sans"
                />
              </div>
            </div>

            {/* Field 2: Password with Interactive Show/Hide Toggle */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-xs font-bold text-neutral-700 uppercase tracking-wider"
              >
                Password
              </label>
              <div className="relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your institutional password"
                  className="block w-full pl-9 pr-10 py-2.5 text-xs bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#800000] focus:border-transparent text-neutral-900 placeholder:text-neutral-400 font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-700 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Field 3: Utility Row (Keep Signed In & Forgot Password) */}
            <div className="flex items-center justify-between pt-1 text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none text-neutral-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-neutral-300 text-[#800000] focus:ring-[#800000]"
                />
                <span>Keep me signed in</span>
              </label>

              <button
                type="button"
                onClick={() => setForgotPasswordModalOpen(true)}
                className="font-semibold text-[#800000] hover:text-red-900 hover:underline"
              >
                Forgot password?
              </button>
            </div>

            {/* Field 4: Solid EARIST Crimson Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-xs sm:text-sm font-bold uppercase tracking-wider bg-[#800000] hover:bg-red-900 text-white shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <span>[ Sign In to SFAO Portal ]</span>
                )}
              </button>
            </div>
          </form>

          {/* Privacy Act Notice Footer */}
          <div className="mt-8 pt-4 border-t border-neutral-200 text-center">
            <div className="flex items-center justify-center gap-1.5 text-[10px] text-neutral-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span>Authorized Access Only • Protected under R.A. 10173 (Data Privacy Act of 2012)</span>
            </div>
          </div>

          {/* Discreet Collapsible Demo Accounts Footnote for Reviewers */}
          <div className="mt-4 pt-2 text-center">
            <details className="text-[11px] text-neutral-400 select-none group">
              <summary className="cursor-pointer hover:text-neutral-600 font-medium inline-flex items-center gap-1 transition-colors">
                <HelpCircle className="w-3 h-3 text-neutral-400 group-hover:text-neutral-600" />
                <span>Need test credentials? Click for Demo Accounts</span>
              </summary>
              <div className="mt-2.5 p-3 rounded-lg bg-neutral-50 border border-neutral-200 text-left text-[11px] space-y-1.5 text-neutral-600 animate-in fade-in">
                <p className="font-semibold text-neutral-700">Official Evaluation Presets:</p>
                <div className="flex flex-col gap-1 font-mono text-[10px]">
                  <button
                    type="button"
                    onClick={() => handlePreFillDemo('admin@earist.edu.ph')}
                    className="text-left text-[#800000] hover:underline"
                  >
                    • <strong>admin@earist.edu.ph</strong> (Super Administrator / SFAO Director)
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePreFillDemo('evaluator.cit@earist.edu.ph')}
                    className="text-left text-[#800000] hover:underline"
                  >
                    • <strong>evaluator.cit@earist.edu.ph</strong> (Prof. Noel Carpio - SFAO-CIT)
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePreFillDemo('evaluator.cafa@earist.edu.ph')}
                    className="text-left text-[#800000] hover:underline"
                  >
                    • <strong>evaluator.cafa@earist.edu.ph</strong> (Ar. Ericoff Dela Rosa - SFAO-CAFA)
                  </button>
                </div>
                <p className="text-[10px] text-neutral-400 pt-1">
                  Password: <em>any password (e.g. earist2026)</em>
                </p>
              </div>
            </details>
          </div>
        </div>
      </main>

      {/* Institutional Bottom Bar */}
      <footer className="relative z-10 w-full py-4 px-4 sm:px-6 lg:px-8 border-t border-neutral-200 bg-white/70 text-center text-[11px] text-neutral-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© {new Date().getFullYear()} Eulogio &apos;Amang&apos; Rodriguez Institute of Science and Technology.</span>
          <span>Nagtahan, Sampaloc, Manila 1008 • ICT Services Unit (ICTSU)</span>
        </div>
      </footer>

      {/* Forgot Password Help Dialog */}
      {forgotPasswordModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-neutral-200 p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-[#800000]" />
                <span>Password Recovery Assistance</span>
              </h3>
              <button
                type="button"
                onClick={() => setForgotPasswordModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-600 leading-relaxed">
              Institutional passwords are centrally managed by the <strong>EARIST ICT Services Unit (ICTSU)</strong>.
            </p>

            <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200 text-xs space-y-1 text-neutral-700">
              <p className="font-semibold text-[#800000]">Contact ICTSU Support:</p>
              <p>Email: <code className="font-mono text-[11px] font-bold">ictsu@earist.edu.ph</code></p>
              <p>Hotline: <span>(02) 8716-6273 loc. 104</span></p>
              <p>Location: <span>Main Campus Building, 2nd Floor</span></p>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setForgotPasswordModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-[#800000] text-white hover:bg-red-900"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
