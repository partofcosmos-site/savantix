import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Loader2, AlertCircle, Sun, Moon } from 'lucide-react';
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
        <Loader2 className="w-6 h-6 text-[var(--sx-accent)] animate-spin" />
        <span className="text-sm text-[var(--sx-ink-secondary)]">Loading Savantix...</span>
      </div>
    );
  }

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setIsGoogleLoading(true);
    try {
      await login();
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        setErrorMsg(null);
      } else if (error.code === 'auth/unauthorized-domain' || error.message?.includes('unauthorized-domain')) {
        setErrorMsg('Google sign-in is unavailable on this domain. Please sign in with your email below.');
      } else if (error.code === 'auth/popup-blocked') {
        setErrorMsg('Your browser blocked the sign-in popup. Allow popups or sign in with your email below.');
      } else {
        setErrorMsg(error.message || 'Could not sign in with Google. Try email sign-in below.');
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
      setErrorMsg(err.message || 'Could not sign in with that email.');
    } finally {
      setIsSubmittingEmail(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--sx-canvas)] text-[var(--sx-ink)] flex flex-col justify-between">
        {/* Subtle top-right theme switcher */}
        <div className="w-full max-w-5xl mx-auto px-6 pt-5 flex justify-end">
          <button
            type="button"
            onClick={handleToggleTheme}
            aria-label={theme === 'dark' ? 'Switch to daylight theme' : 'Switch to dark theme'}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium text-[var(--sx-ink-secondary)] hover:text-[var(--sx-ink)] bg-[var(--sx-surface)] border border-[var(--sx-hairline)] cursor-pointer transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
          </button>
        </div>

        {/* Facebook-inspired Friendly Centered Split Layout */}
        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-12 items-center">
            {/* Left Brand Intro */}
            <div className="md:col-span-6 space-y-3 text-center md:text-left">
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight" style={{ color: 'var(--sx-accent)' }}>
                Savantix
              </h1>
              <p className="text-lg sm:text-xl text-[var(--sx-ink)] leading-snug font-normal max-w-md mx-auto md:mx-0">
                Keep track of your daily study sessions, school attendance, and upcoming exams in one calm place.
              </p>
            </div>

            {/* Right Sign-In Card */}
            <div className="md:col-span-6 w-full max-w-[396px] mx-auto">
              <div
                className="bg-[var(--sx-surface)] border border-[var(--sx-hairline)] rounded-[12px] p-6 space-y-4"
                style={{ boxShadow: '0 4px 16px rgba(0, 0, 0, 0.14)' }}
              >
                {errorMsg && (
                  <div className="p-3 bg-[var(--sx-fault-bg)] border border-[var(--sx-fault-border)] rounded-[8px] text-[var(--sx-fault)] text-xs flex items-start gap-2 leading-relaxed">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleEmailSubmit} className="space-y-3">
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="Email address"
                    aria-label="Email address"
                    className="w-full h-12 px-4 text-[15px] rounded-[8px] border border-[var(--sx-border)]"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingEmail || isGoogleLoading}
                    className="sx-btn-primary w-full h-12 rounded-[8px] font-semibold text-[15px] transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmittingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Log In with Email'}
                  </button>
                </form>

                <div className="relative flex items-center py-1">
                  <div className="flex-1 border-t border-[var(--sx-hairline)]" />
                  <span className="px-3 text-xs text-[var(--sx-ink-muted)]">or</span>
                  <div className="flex-1 border-t border-[var(--sx-hairline)]" />
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isGoogleLoading || isSubmittingEmail}
                  className="w-full h-11 flex items-center justify-center gap-2.5 px-4 rounded-[8px] bg-[var(--sx-elevated)] hover:bg-[var(--sx-hover)] border border-[var(--sx-hairline)] text-[var(--sx-ink)] font-medium text-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isGoogleLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  )}
                  <span>Continue with Google</span>
                </button>

                <div className="pt-3 border-t border-[var(--sx-hairline)] text-center">
                  <button
                    type="button"
                    onClick={continueAsGuest}
                    className="px-5 py-2.5 rounded-[8px] text-sm font-semibold text-white cursor-pointer transition-colors"
                    style={{ backgroundColor: '#31a24c' }}
                  >
                    Explore Demo Mode
                  </button>
                </div>
              </div>
              <p className="text-center text-xs text-[var(--sx-ink-muted)] mt-4">
                Your study logs and attendance stay private to your account.
              </p>
            </div>
          </div>
        </div>

        <footer className="w-full py-4 text-center text-xs text-[var(--sx-ink-muted)]">
          Savantix · Part of Cosmos
        </footer>
      </div>
    );
  }

  return <>{children}</>;
};
