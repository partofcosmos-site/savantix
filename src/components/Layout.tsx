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
  RefreshCw,
  ArrowUpRight,
  Sun,
  Moon
} from 'lucide-react';
import clsx from 'clsx';
import { MicroLoggerModal } from './MicroLoggerModal';
import { AIGatewayButton } from './AIGateway';
import { getSavedTheme, toggleTheme, SavantixTheme } from '../utils/themeManager';

export type ActiveTabType =
  | 'dashboard'
  | 'pomodoro'
  | 'analytics'
  | 'attendance'
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
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [theme, setTheme] = useState<SavantixTheme>(() => getSavedTheme());

  const handleToggleTheme = () => {
    const next = toggleTheme();
    setTheme(next);
  };

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
      } else if (e.altKey && /^[1-8]$/.test(e.key)) {
        const order: ActiveTabType[] = ['dashboard', 'attendance', 'pomodoro', 'analytics', 'goals', 'journal', 'settings', 'feedback'];
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
    window.addEventListener('savantix_open_microlog', handleOpenMicroLog);
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
      window.removeEventListener('savantix_open_microlog', handleOpenMicroLog);
    };
  }, []);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard & Study Logger', icon: LayoutDashboard },
    { id: 'attendance', label: 'Attendance Tracker', icon: GraduationCap },
    { id: 'pomodoro', label: 'Pomodoro & Flowmodoro', icon: Clock },
    { id: 'analytics', label: 'Analytics & Heatmap', icon: BarChart2 },
    { id: 'goals', label: 'Goals & Milestones', icon: Target },
    { id: 'journal', label: 'Journal & Reflections', icon: BookOpen },
    { id: 'settings', label: 'Universal AI Providers', icon: Settings },
    { id: 'feedback', label: 'Contact & Feedback', icon: MessageSquareHeart },
  ] as const;

  const suiteLinks = [
    { href: 'https://partofcosmos.pages.dev/stem-solver/', label: 'STEM Solver', icon: Sparkles },
    { href: 'https://partofcosmos.pages.dev/concept-graph/', label: 'Concept Graph', icon: Network },
    { href: 'https://partofcosmos.pages.dev/flashcards/', label: 'Flashcards Vault', icon: Layers },
    { href: 'https://partofcosmos.pages.dev/ai/council', label: 'AI Council', icon: Crown },
  ];

  return (
    <div className="min-h-screen bg-[var(--sx-canvas)] text-[var(--sx-ink)] flex flex-col md:flex-row font-sans relative">
      <MicroLoggerModal isOpen={isMicroLoggerOpen} onClose={() => setIsMicroLoggerOpen(false)} />
      <AIGatewayButton />

      {/* Mobile Top Bar */}
      <header className="md:hidden flex items-center justify-between px-4 h-14 bg-[var(--sx-rail)] border-b border-[var(--sx-hairline)] sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-[var(--sx-ink)]" />
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-[var(--sx-ink)] leading-none">Savantix</h1>
            <p className="font-mono text-[9px] text-[var(--sx-ink-muted)]  mt-0.5">
              Part of Cosmos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleToggleTheme}
            aria-label={theme === 'dark' ? 'Switch to daylight theme' : 'Switch to dark graphite theme'}
            title={theme === 'dark' ? 'Switch to Daylight (Alt+T)' : 'Switch to Dark Graphite (Alt+T)'}
            className="p-2 text-[var(--sx-ink-secondary)] hover:text-[var(--sx-ink)] bg-[var(--sx-surface)] border border-[var(--sx-hairline)] rounded-[5px] transition-colors cursor-pointer"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => forceSyncNow()}
            disabled={syncStatus.isSyncing}
            aria-label="Sync now"
            className="p-2 text-[var(--sx-ink-secondary)] hover:text-[var(--sx-ink)] bg-[var(--sx-surface)] border border-[var(--sx-hairline)] rounded-[5px] transition-colors cursor-pointer"
            title={`Cloud Sync: ${syncStatus.lastSyncedAt || 'Live'}`}
          >
            <RefreshCw className={clsx('w-4 h-4', syncStatus.isSyncing && 'animate-spin text-[var(--sx-signal-text)]')} />
          </button>

          <button
            type="button"
            onClick={() => setIsMicroLoggerOpen(true)}
            aria-label="Open Micro-Logger"
            className="p-2 text-[var(--sx-ink)] bg-[var(--sx-surface)] hover:bg-[var(--sx-hover)] border border-[var(--sx-hairline)] rounded-[5px] transition-colors cursor-pointer"
            title="Open Micro-Logger (Alt+L)"
          >
            <Zap className="w-4 h-4 text-[var(--sx-signal-text)]" />
          </button>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-[var(--sx-ink)] bg-[var(--sx-surface)] border border-[var(--sx-hairline)] rounded-[5px] cursor-pointer"
            aria-label="Toggle navigation"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Precision Navigation Rail */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 w-64 bg-[var(--sx-rail)] border-r border-[var(--sx-hairline)] flex flex-col transform transition-transform duration-200 ease-out md:relative md:translate-x-0',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Masthead */}
        <div className="hidden md:flex px-5 py-4 items-center justify-between border-b border-[var(--sx-hairline)]">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--sx-ink)]" />
              <h1 className="text-base font-semibold tracking-tight text-[var(--sx-ink)]">Savantix</h1>
            </div>
            <p className="font-mono text-[9px] text-[var(--sx-ink-muted)]  mt-1">
              Study workbench
            </p>
          </div>
          <button
            type="button"
            onClick={handleToggleTheme}
            aria-label={theme === 'dark' ? 'Switch to daylight theme' : 'Switch to dark graphite theme'}
            title={theme === 'dark' ? 'Switch to Daylight (Alt+T)' : 'Switch to Dark Graphite (Alt+T)'}
            className="p-1.5 text-[var(--sx-ink-secondary)] hover:text-[var(--sx-ink)] bg-[var(--sx-surface)] hover:bg-[var(--sx-hover)] border border-[var(--sx-hairline)] rounded-[5px] transition-colors cursor-pointer"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Quick Micro-Logger Command */}
        <div className="px-4 py-3 border-b border-[var(--sx-hairline)]">
          <button
            type="button"
            onClick={() => setIsMicroLoggerOpen(true)}
            className="sx-btn-primary w-full flex items-center justify-between px-3 py-2 rounded-[5px] text-xs font-medium transition-colors duration-150 cursor-pointer"
            title="Quick Study Micro-Logger (Alt+L or Ctrl+K)"
          >
            <span className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5" />
              <span>Quick log</span>
            </span>
            <kbd className="font-mono text-[10px] opacity-75 px-1.5 py-0.5 rounded-[3px] border border-current/25">
              Alt+L
            </kbd>
          </button>
        </div>

        {/* Primary Workspace Navigation */}
        <nav className="flex-1 py-3 overflow-y-auto">
          <div className="px-5 pb-1.5 font-mono text-[10px] text-[var(--sx-ink-muted)] tracking-wider">
            Workspace
          </div>
          <div className="space-y-0.5">
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
                    'w-full flex items-center gap-2.5 px-5 py-2.5 text-xs transition-colors duration-150 cursor-pointer border-l-2 text-left',
                    isActive
                      ? 'border-[var(--sx-ink)] bg-[var(--sx-elevated)] text-[var(--sx-ink)] font-medium'
                      : 'border-transparent text-[var(--sx-ink-secondary)] hover:bg-[var(--sx-hover)] hover:text-[var(--sx-ink)] font-medium'
                  )}
                >
                  <tab.icon
                    className={clsx('w-4 h-4 shrink-0', isActive ? 'text-[var(--sx-signal-text)]' : 'text-[var(--sx-ink-muted)]')}
                    strokeWidth={1.75}
                  />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Cosmic Knowledge Suite */}
          <div className="mt-4 pt-3 border-t border-[var(--sx-hairline)]">
            <div className="px-5 pb-1.5 font-mono text-[10px] text-[var(--sx-ink-muted)] tracking-wider">
              Part of Cosmos
            </div>
            <div className="space-y-0.5">
              {suiteLinks.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-between px-5 py-2 text-xs font-medium text-[var(--sx-ink-secondary)] hover:text-[var(--sx-ink)] hover:bg-[var(--sx-hover)] transition-colors duration-150"
                >
                  <span className="flex items-center gap-2.5">
                    <item.icon className="w-3.5 h-3.5 text-[var(--sx-ink-muted)]" strokeWidth={1.75} />
                    <span>{item.label}</span>
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[var(--sx-ink-muted)]" />
                </a>
              ))}
            </div>
          </div>
        </nav>

        {/* Cloud Sync Telemetry Strip */}
        <div className="px-4 py-2.5 border-t border-[var(--sx-hairline)] bg-[var(--sx-surface)] flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={clsx(
                'w-1.5 h-1.5 rounded-full shrink-0',
                syncStatus.isSyncing ? 'bg-[var(--sx-signal)]' : 'bg-[var(--sx-safe)]'
              )}
            />
            <span className="font-mono text-[10px] text-[var(--sx-ink-secondary)] truncate">
              {isGuest ? 'Local Demo Sandbox' : syncStatus.isSyncing ? 'Syncing cloud...' : `Synced · ${syncStatus.lastSyncedAt || 'Live'}`}
            </span>
          </div>
          <button
            type="button"
            onClick={() => forceSyncNow()}
            disabled={syncStatus.isSyncing}
            aria-label="Sync now"
            className="p-1 text-[var(--sx-ink-secondary)] hover:text-[var(--sx-ink)] hover:bg-[var(--sx-hover)] rounded-[4px] transition-colors cursor-pointer"
            title="Sync now"
          >
            <RefreshCw className={clsx('w-3.5 h-3.5', syncStatus.isSyncing && 'animate-spin text-[var(--sx-signal-text)]')} />
          </button>
        </div>

        {/* Account Footer */}
        <div className="px-4 py-3 border-t border-[var(--sx-hairline)] flex items-center justify-between">
          <div className="flex flex-col min-w-0 pr-2">
            <span className="text-xs font-semibold text-[var(--sx-ink)] truncate">
              {user?.displayName || 'Scholar'}
            </span>
            <span className="font-mono text-[10px] text-[var(--sx-ink-muted)] truncate">
              {isGuest ? 'Local Sandbox' : (user?.email || 'Signed In')}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsShortcutsOpen(true)}
              aria-label="Keyboard shortcuts"
              title="Keyboard shortcuts (?)"
              className="px-2 py-1.5 font-mono text-[11px] font-semibold text-[var(--sx-ink-secondary)] hover:text-[var(--sx-ink)] hover:bg-[var(--sx-hover)] border border-[var(--sx-hairline)] rounded-[4px] transition-colors cursor-pointer"
            >
              ?
            </button>
            <button
              type="button"
              onClick={logout}
              aria-label="Sign out"
              className="p-2 text-[var(--sx-ink-secondary)] hover:text-[var(--sx-fault)] hover:bg-[var(--sx-hover)] rounded-[4px] transition-colors cursor-pointer"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-[var(--sx-overlay)] z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {isShortcutsOpen && (
        <div
          className="fixed inset-0 z-50 bg-[var(--sx-overlay)] flex items-center justify-center p-4"
          onClick={() => setIsShortcutsOpen(false)}
        >
          <div
            className="w-full max-w-md bg-[var(--sx-surface)] border border-[var(--sx-border)] rounded-[8px] p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--sx-hairline)] pb-3">
              <div>
                <span className="font-mono text-[10px] text-[var(--sx-signal-text)] tracking-wider uppercase">Shortcuts</span>
                <h2 className="text-base font-semibold text-[var(--sx-ink)]">Keyboard Shortcuts</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsShortcutsOpen(false)}
                aria-label="Close keyboard shortcuts"
                title="Close (Esc)"
                className="px-2 py-1 text-xs font-mono text-[var(--sx-ink-secondary)] hover:text-[var(--sx-ink)] border border-[var(--sx-hairline)] rounded-[4px] cursor-pointer"
              >
                Esc
              </button>
            </div>
            <div className="divide-y divide-[var(--sx-hairline)] text-xs">
              {[
                ['Alt + 1 .. 8', 'Switch workspace tabs (Dashboard to Contact)'],
                ['Alt + L  /  Ctrl + K', 'Toggle Micro-Logger quick session HUD'],
                ['Alt + G', 'Open AI Gateway & KaTeX STEM Solver'],
                ['Alt + T', 'Toggle Dark Graphite / Daylight theme'],
                ['?', 'Toggle this keyboard shortcuts sheet'],
                ['Esc', 'Close active modal or overlay'],
              ].map(([k, desc]) => (
                <div key={k} className="py-2.5 flex items-center justify-between gap-4">
                  <span className="text-[var(--sx-ink-secondary)]">{desc}</span>
                  <kbd className="font-mono text-[11px] font-semibold px-2 py-0.5 bg-[var(--sx-elevated)] border border-[var(--sx-border)] text-[var(--sx-ink)] rounded-[4px] shrink-0">{k}</kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Stage */}
      <main className="flex-1 overflow-y-auto min-h-0 h-[calc(100vh-56px)] md:h-screen bg-[var(--sx-canvas)]">
        {children}
      </main>
    </div>
  );
};
