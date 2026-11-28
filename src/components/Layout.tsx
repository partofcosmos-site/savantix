import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import {
  LogOut,
  LayoutDashboard,
  BarChart2,
  BookOpen,
  Clock,
  Target,
  Settings,
  Layers,
  Menu,
  X,
  Sparkles,
  Network,
  Crown,
  Zap,
  MessageSquareHeart,
  GraduationCap,
  CalendarDays,
  Wand2,
  RefreshCw,
  ArrowUpRight,
  Sun,
  Moon
} from 'lucide-react';
import clsx from 'clsx';
import { MicroLoggerModal } from './MicroLoggerModal';
import { AIGatewayButton } from './AIGateway';
import { AIWorkspaceCustomizer } from './AIWorkspaceCustomizer';
import { getSavedTheme, toggleTheme, SavantixTheme } from '../utils/themeManager';

export type ActiveTabType =
  | 'dashboard'
  | 'pomodoro'
  | 'analytics'
  | 'attendance'
  | 'planner'
  | 'goals'
  | 'journal'
  | 'settings'
  | 'feedback';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: ActiveTabType;
  setActiveTab: (tab: ActiveTabType) => void;
}

export const Layout = ({ children, activeTab, setActiveTab }: LayoutProps) => {
  const { user, isGuest, logout, syncStatus, forceSyncNow } = useAppContext();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMicroLoggerOpen, setIsMicroLoggerOpen] = useState(false);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [theme, setTheme] = useState<SavantixTheme>(() => getSavedTheme());

  const handleToggleTheme = () => setTheme(toggleTheme());

  useEffect(() => {
    const onThemeChange = (e: Event) => {
      const next = (e as CustomEvent)?.detail?.theme;
      if (next === 'dark' || next === 'light') setTheme(next);
    };
    window.addEventListener('savantix:theme-changed', onThemeChange);
    return () => window.removeEventListener('savantix:theme-changed', onThemeChange);
  }, []);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'l' || e.key === 'L')) {
        e.preventDefault();
        setIsMicroLoggerOpen((prev) => !prev);
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsMicroLoggerOpen((prev) => !prev);
      } else if (e.altKey && (e.key === 'g' || e.key === 'G')) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('savantix_open_ai_gateway', { detail: { open: true } }));
      } else if (e.altKey && (e.key === 't' || e.key === 'T')) {
        e.preventDefault();
        handleToggleTheme();
      } else if (e.altKey && /^[1-9]$/.test(e.key)) {
        const order: ActiveTabType[] = ['dashboard', 'attendance', 'planner', 'pomodoro', 'analytics', 'goals', 'journal', 'settings', 'feedback'];
        const target = order[parseInt(e.key, 10) - 1];
        if (target) {
          e.preventDefault();
          setActiveTab(target);
        }
      } else if (e.key === '?' && !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName || '')) {
        e.preventDefault();
        setIsShortcutsOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsShortcutsOpen(false);
        setIsMicroLoggerOpen(false);
      }
    };

    const handleOpenMicroLog = () => setIsMicroLoggerOpen(true);
    const handleOpenCustomizer = () => setIsCustomizerOpen(true);
    window.addEventListener('savantix_open_microlog', handleOpenMicroLog);
    window.addEventListener('savantix_open_customizer', handleOpenCustomizer);
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
      window.removeEventListener('savantix_open_microlog', handleOpenMicroLog);
      window.removeEventListener('savantix_open_customizer', handleOpenCustomizer);
    };
  }, []);

  const tabs = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'attendance', label: 'Attendance', icon: GraduationCap },
    { id: 'planner', label: 'Planner', icon: CalendarDays },
    { id: 'pomodoro', label: 'Focus', icon: Clock },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    { id: 'goals', label: 'Goals', icon: Target },
    { id: 'journal', label: 'Journal', icon: BookOpen },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'feedback', label: 'Feedback', icon: MessageSquareHeart },
  ] as const;

  const suiteLinks = [
    { href: 'https://partofcosmos.pages.dev/stem-solver/', label: 'STEM Solver', icon: Sparkles },
    { href: 'https://partofcosmos.pages.dev/concept-graph/', label: 'Concept Graph', icon: Network },
    { href: 'https://partofcosmos.pages.dev/flashcards/', label: 'Flashcards', icon: Layers },
    { href: 'https://partofcosmos.pages.dev/ai/council', label: 'AI Council', icon: Crown },
  ];

  return (
    <div className="min-h-screen bg-[var(--sx-canvas)] text-[var(--sx-ink)] flex flex-col md:flex-row font-sans relative">
      <MicroLoggerModal isOpen={isMicroLoggerOpen} onClose={() => setIsMicroLoggerOpen(false)} />
      <AIWorkspaceCustomizer isOpen={isCustomizerOpen} onClose={() => setIsCustomizerOpen(false)} />
      <AIGatewayButton />

      {/* Mobile Top Bar */}
      <header className="md:hidden flex items-center justify-between px-4 h-12 bg-[var(--sx-rail)] border-b border-[var(--sx-hairline)] sticky top-0 z-30">
        <span className="text-lg font-bold tracking-tight" style={{ color: "var(--sx-accent)" }}>Savantix</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleToggleTheme}
            aria-label={theme === 'dark' ? 'Switch to daylight theme' : 'Switch to dark graphite theme'}
            className="p-2 text-[var(--sx-ink-secondary)] hover:text-[var(--sx-ink)] rounded-[5px] cursor-pointer"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={() => forceSyncNow()}
            disabled={syncStatus.isSyncing}
            aria-label="Sync now"
            className="p-2 text-[var(--sx-ink-secondary)] hover:text-[var(--sx-ink)] rounded-[5px] cursor-pointer"
          >
            <RefreshCw className={clsx('w-4 h-4', syncStatus.isSyncing && 'animate-spin')} />
          </button>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle navigation"
            className="p-2 text-[var(--sx-ink)] rounded-[5px] cursor-pointer"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Quiet 224px Linear-Style Sidebar */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 w-60 bg-[var(--sx-rail)] border-r border-[var(--sx-hairline)] flex flex-col transform transition-transform duration-150 ease-out md:relative md:translate-x-0',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="hidden md:flex px-4 h-12 items-center justify-between border-b border-[var(--sx-hairline)]">
          <span className="text-lg font-bold tracking-tight" style={{ color: "var(--sx-accent)" }}>Savantix</span>
          <button
            type="button"
            onClick={handleToggleTheme}
            aria-label={theme === 'dark' ? 'Switch to daylight theme' : 'Switch to dark graphite theme'}
            title={theme === 'dark' ? 'Daylight theme (Alt+T)' : 'Dark theme (Alt+T)'}
            className="p-1.5 text-[var(--sx-ink-muted)] hover:text-[var(--sx-ink)] hover:bg-[var(--sx-hover)] rounded-[5px] transition-colors cursor-pointer"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="p-3">
          <button
            type="button"
            onClick={() => setIsMicroLoggerOpen(true)}
            className="w-full flex items-center justify-between px-3 py-2 rounded-[8px] text-xs font-medium text-[var(--sx-ink-secondary)] hover:text-[var(--sx-ink)] bg-[var(--sx-surface)] hover:bg-[var(--sx-hover)] border border-[var(--sx-hairline)] transition-colors cursor-pointer"
            title="Quick log (Ctrl+K or Alt+L)"
          >
            <span className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5" />
              <span>Quick log</span>
            </span>
            <kbd className="font-mono text-[10px] text-[var(--sx-ink-muted)]">Ctrl+K</kbd>
          </button>
        </div>

        <nav className="flex-1 px-2 py-1 overflow-y-auto space-y-0.5">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                type="button"
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as ActiveTabType);
                  setIsMobileMenuOpen(false);
                }}
                className={clsx(
                  'w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-[8px] text-[14px] py-2 transition-colors cursor-pointer text-left',
                  isActive
                    ? 'bg-[var(--sx-signal-bg)] text-[var(--sx-signal-text)] font-semibold'
                    : 'text-[var(--sx-ink-secondary)] hover:bg-[var(--sx-hover)]/60 hover:text-[var(--sx-ink)]'
                )}
              >
                <tab.icon className="w-4 h-4 shrink-0 opacity-75" strokeWidth={1.6} />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}

          <div className="pt-4 mt-4 border-t border-[var(--sx-hairline)] space-y-0.5">
            <div className="px-2.5 pb-1 text-[11px] text-[var(--sx-ink-muted)]">Part of Cosmos</div>
            {suiteLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-between px-3 py-2 rounded-[8px] text-xs font-medium text-[var(--sx-ink-muted)] hover:text-[var(--sx-ink)] hover:bg-[var(--sx-hover)]/60 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <item.icon className="w-3.5 h-3.5" strokeWidth={1.6} />
                  <span>{item.label}</span>
                </span>
                <ArrowUpRight className="w-3 h-3 opacity-60" />
              </a>
            ))}
          </div>
        </nav>

        <div className="px-3 py-2 border-t border-[var(--sx-hairline)] flex items-center justify-between text-[11px] text-[var(--sx-ink-muted)]">
          <span className="inline-flex items-center gap-1.5 truncate font-mono">
            <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', syncStatus.isSyncing ? 'bg-[var(--sx-caution)]' : 'bg-[var(--sx-safe)]')} />
            <span className="truncate">{isGuest ? 'Demo mode' : syncStatus.isSyncing ? 'Syncing...' : 'Synced'}</span>
          </span>
          <button
            type="button"
            onClick={() => forceSyncNow()}
            disabled={syncStatus.isSyncing}
            aria-label="Sync now"
            title="Sync now"
            className="p-1 hover:text-[var(--sx-ink)] rounded-[4px] cursor-pointer"
          >
            <RefreshCw className={clsx('w-3 h-3', syncStatus.isSyncing && 'animate-spin')} />
          </button>
        </div>

        <div className="px-3 py-2.5 border-t border-[var(--sx-hairline)] flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-xs font-medium text-[var(--sx-ink)] truncate">{user?.displayName || 'Scholar'}</div>
            <div className="text-[11px] text-[var(--sx-ink-muted)] truncate">{isGuest ? 'Local sandbox' : user?.email || ''}</div>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsShortcutsOpen(true)}
              aria-label="Keyboard shortcuts"
              title="Shortcuts (?)"
              className="px-1.5 py-1 font-mono text-[11px] text-[var(--sx-ink-muted)] hover:text-[var(--sx-ink)] hover:bg-[var(--sx-hover)] rounded-[4px] cursor-pointer"
            >
              ?
            </button>
            <button
              type="button"
              onClick={logout}
              aria-label="Sign out"
              title="Sign out"
              className="p-1.5 text-[var(--sx-ink-muted)] hover:text-[var(--sx-fault)] hover:bg-[var(--sx-hover)] rounded-[4px] cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-[var(--sx-overlay)] z-30 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {isShortcutsOpen && (
        <div className="fixed inset-0 z-50 bg-[var(--sx-overlay)] flex items-center justify-center p-4" onClick={() => setIsShortcutsOpen(false)}>
          <div className="w-full max-w-sm bg-[var(--sx-surface)] border border-[var(--sx-border)] rounded-[8px] p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-2 border-b border-[var(--sx-hairline)]">
              <h2 className="text-sm font-medium text-[var(--sx-ink)]">Keyboard shortcuts</h2>
              <button
                type="button"
                onClick={() => setIsShortcutsOpen(false)}
                aria-label="Close keyboard shortcuts"
                className="text-xs font-mono text-[var(--sx-ink-muted)] hover:text-[var(--sx-ink)] cursor-pointer"
              >
                Esc
              </button>
            </div>
            <div className="divide-y divide-[var(--sx-hairline)] text-xs">
              {[
                ['Alt + 1..8', 'Switch views'],
                ['Ctrl + K / Alt + L', 'Quick log modal'],
                ['Alt + G', 'AI solver'],
                ['Alt + T', 'Toggle dark / light theme'],
                ['?', 'Shortcuts'],
              ].map(([k, desc]) => (
                <div key={k} className="py-2 flex items-center justify-between gap-4">
                  <span className="text-[var(--sx-ink-secondary)]">{desc}</span>
                  <kbd className="font-mono text-[11px] px-1.5 py-0.5 bg-[var(--sx-elevated)] border border-[var(--sx-hairline)] text-[var(--sx-ink)] rounded-[4px]">{k}</kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 overflow-y-auto min-h-0 h-[calc(100vh-48px)] md:h-screen bg-[var(--sx-canvas)]">
        {isGuest && (
          <div className="w-full px-4 py-2 bg-[var(--sx-caution-bg)] border-b border-[var(--sx-caution-border)] flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--sx-caution)]">
            <span>You are in Demo Mode — changes here will not sync to your personal account.</span>
            <button
              type="button"
              onClick={logout}
              className="px-2.5 py-1 rounded-[6px] bg-[var(--sx-surface)] border border-[var(--sx-caution-border)] text-[var(--sx-ink)] font-semibold cursor-pointer hover:bg-[var(--sx-hover)]"
            >
              Sign in to your account
            </button>
          </div>
        )}
        {children}
      </main>
    </div>
  );
};
