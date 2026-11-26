import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Loader2, ArrowRight, Mail, AlertCircle } from 'lucide-react';

export const AuthWrapper = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, login, loginWithEmail, continueAsGuest } = useAppContext();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f3ef] flex flex-col items-center justify-center gap-3 text-[#141413]">
        <Loader2 className="w-5 h-5 text-[#c2410c] animate-spin" />
        <span className="font-mono text-xs uppercase tracking-widest text-[#575652]">
          Initializing Savantix
        </span>
      </div>
    );
  }

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setIsGoogleLoading(true);
    try {
      await login();
    } catch (error: any) {
      console.warn('Google Auth error:', error);
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        setErrorMsg(null);
      } else if (error.code === 'auth/unauthorized-domain' || error.message?.includes('unauthorized-domain')) {
        setErrorMsg('This domain is not yet authorized in Firebase Auth. Use Email Sign-In below to sync immediately.');
      } else if (error.code === 'auth/popup-blocked') {
        setErrorMsg('Browser blocked the Google popup. Allow popups or use Email Sign-In below.');
      } else {
        setErrorMsg(error.message || 'Unable to sign in with Google. Use Email Sign-In below.');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    setErrorMsg(null);
    setIsSubmittingEmail(true);
    try {
      await loginWithEmail(emailInput);
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to sign in with email.');
    } finally {
      setIsSubmittingEmail(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#f4f3ef] text-[#141413] flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-[#ffffff] border border-[#b8b5ac] rounded-[6px] overflow-hidden">
          {/* Top Specification Strip */}
          <div className="px-6 py-3 bg-[#f4f3ef] border-b border-[#d5d3cb] flex items-center justify-between">
            <span className="font-mono text-[11px] text-[#c2410c] font-medium tracking-wider">
              01 / WORKBENCH ACCESS
            </span>
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-[#575652]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#15803d]" />
              SYNC READY
            </span>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Title Block */}
            <div className="space-y-1.5 border-b border-[#d5d3cb] pb-5">
              <h1 className="text-2xl font-semibold tracking-tight text-[#141413]">
                Savantix
              </h1>
              <p className="text-sm text-[#575652] leading-relaxed">
                Academic telemetry, attendance ledger, and STEM study workbench.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-[#fff7ed] border border-[#ea580c]/40 rounded-[4px] text-[#9a3412] text-xs flex items-start gap-2 leading-relaxed">
                <AlertCircle className="w-4 h-4 text-[#c2410c] flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Primary Google Sign-In */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading || isSubmittingEmail}
              className="rams-btn-primary w-full flex items-center justify-center gap-3 px-4 py-3 rounded-[4px] font-medium text-sm transition-colors duration-150 cursor-pointer disabled:opacity-50"
            >
              {isGoogleLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              <span>Continue with Google</span>
            </button>

            {/* Hairline Divider */}
            <div className="relative flex items-center justify-center">
              <div className="border-t border-[#d5d3cb] w-full" />
              <span className="bg-[#ffffff] px-3 font-mono text-[10px] text-[#5f5e59] uppercase tracking-widest whitespace-nowrap">
                Or email sync
              </span>
              <div className="border-t border-[#d5d3cb] w-full" />
            </div>

            {/* Email Sign-In Form */}
            <form onSubmit={handleEmailSubmit} className="space-y-3">
              <div className="relative">
                <Mail className="w-4 h-4 text-[#5f5e59] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-[4px] border border-[#b8b5ac] bg-[#ffffff] text-[#141413]"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmittingEmail || isGoogleLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-[4px] border border-[#b8b5ac] bg-[#f4f3ef] hover:bg-[#eae8e2] text-[#141413] font-medium text-sm transition-colors duration-150 cursor-pointer disabled:opacity-50"
              >
                {isSubmittingEmail ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#c2410c]" />
                ) : (
                  <>
                    <span>Sign in with email</span>
                    <ArrowRight className="w-4 h-4 text-[#575652]" />
                  </>
                )}
              </button>
            </form>

            {/* Sandbox Demo Mode */}
            <div className="pt-4 border-t border-[#d5d3cb] flex items-center justify-between">
              <span className="text-xs text-[#5f5e59]">Local sandbox, no account</span>
              <button
                type="button"
                onClick={continueAsGuest}
                className="text-xs font-medium text-[#141413] hover:text-[#c2410c] underline underline-offset-4 cursor-pointer transition-colors"
              >
                Explore Demo Mode
              </button>
            </div>
          </div>

          <div className="px-6 py-2.5 bg-[#f4f3ef] border-t border-[#d5d3cb] flex items-center justify-between font-mono text-[10px] text-[#5f5e59]">
            <span>PART OF COSMOS INITIATIVE</span>
            <span>OFFLINE-FIRST · CLOUD SYNC</span>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
