import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Loader2, ArrowRight, Mail, AlertCircle, Sun, Moon } from 'lucide-react';
import { getSavedTheme, toggleTheme, SavantixTheme } from '../utils/themeManager';

export const AuthWrapper = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, login, loginWithEmail, continueAsGuest } = useAppContext();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [theme, setTheme] = useState<SavantixTheme>(() => getSavedTheme());

  const handleToggleTheme = () => setTheme(toggleTheme());

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--sx-canvas)] flex flex-col items-center justify-center gap-3 text-[var(--sx-ink)]">
        <Loader2 className="w-5 h-5 text-[var(--sx-signal-text)] animate-spin" />
        <span className="font-mono text-xs  text-[var(--sx-ink-secondary)]">
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
      <div className="min-h-screen bg-[var(--sx-canvas)] text-[var(--sx-ink)] flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-[var(--sx-surface)] border border-[var(--sx-border)] rounded-[8px] overflow-hidden shadow-lg">
          {/* Top Specification Strip */}
          <div className="px-6 py-3 bg-[var(--sx-rail)] border-b border-[var(--sx-hairline)] flex items-center justify-between">
            <span className="font-mono text-[11px] text-[var(--sx-signal-text)] font-medium tracking-wider">
              Sign in
            </span>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-[var(--sx-ink-secondary)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--sx-safe)]" />
                Cloud sync
              </span>
              <button
                type="button"
                onClick={handleToggleTheme}
                aria-label={theme === 'dark' ? 'Switch to daylight theme' : 'Switch to dark graphite theme'}
                title={theme === 'dark' ? 'Switch to Daylight' : 'Switch to Dark Graphite'}
                className="p-1 text-[var(--sx-ink-secondary)] hover:text-[var(--sx-ink)] border border-[var(--sx-hairline)] rounded-[4px] cursor-pointer"
              >
                {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Title Block */}
            <div className="space-y-1.5 border-b border-[var(--sx-hairline)] pb-5">
              <h1 className="text-2xl font-semibold tracking-tight text-[var(--sx-ink)]">
                Savantix
              </h1>
              <p className="text-sm text-[var(--sx-ink-secondary)] leading-relaxed">
                Study log, attendance tracker, and focus timer.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-[var(--sx-signal-bg)] border border-[var(--sx-signal-border)] rounded-[5px] text-[var(--sx-signal-text)] text-xs flex items-start gap-2 leading-relaxed">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Primary Google Sign-In */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading || isSubmittingEmail}
              className="sx-btn-primary w-full flex items-center justify-center gap-3 px-4 py-3 rounded-[5px] font-medium text-sm transition-colors duration-150 cursor-pointer disabled:opacity-50"
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
              <div className="border-t border-[var(--sx-hairline)] w-full" />
              <span className="bg-[var(--sx-surface)] px-3 font-mono text-[10px] text-[var(--sx-ink-muted)]  whitespace-nowrap">
                Or email sync
              </span>
              <div className="border-t border-[var(--sx-hairline)] w-full" />
            </div>

            {/* Email Sign-In Form */}
            <form onSubmit={handleEmailSubmit} className="space-y-3">
              <div className="relative">
                <Mail className="w-4 h-4 text-[var(--sx-ink-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-[5px] border border-[var(--sx-border)] bg-[var(--sx-elevated)] text-[var(--sx-ink)]"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmittingEmail || isGoogleLoading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-[5px] border border-[var(--sx-border)] bg-[var(--sx-elevated)] hover:bg-[var(--sx-hover)] text-[var(--sx-ink)] font-medium text-sm transition-colors duration-150 cursor-pointer disabled:opacity-50"
              >
                {isSubmittingEmail ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[var(--sx-signal-text)]" />
                ) : (
                  <>
                    <span>Sign in with email</span>
                    <ArrowRight className="w-4 h-4 text-[var(--sx-ink-secondary)]" />
                  </>
                )}
              </button>
            </form>

            {/* Sandbox Demo Mode */}
            <div className="pt-4 border-t border-[var(--sx-hairline)] flex items-center justify-between">
              <span className="text-xs text-[var(--sx-ink-muted)]">Local sandbox, no account</span>
              <button
                type="button"
                onClick={continueAsGuest}
                className="text-xs font-medium text-[var(--sx-ink)] hover:text-[var(--sx-signal-text)] underline underline-offset-4 cursor-pointer transition-colors"
              >
                Explore Demo Mode
              </button>
            </div>
          </div>

          <div className="px-6 py-2.5 bg-[var(--sx-rail)] border-t border-[var(--sx-hairline)] flex items-center justify-between font-mono text-[10px] text-[var(--sx-ink-muted)]">
            <span>Part of Cosmos</span>
            <span>Local-first sync</span>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
