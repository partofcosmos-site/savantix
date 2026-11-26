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
  ArrowUpRight
} from 'lucide-react';
import clsx from 'clsx';
import { MicroLoggerModal } from './MicroLoggerModal';
import { AIGatewayButton } from './AIGateway';

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
  const { user, logout, syncStatus, forceSyncNow } = useAppContext();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMicroLoggerOpen, setIsMicroLoggerOpen] = useState(false);
  const isFounder = ['debanjan8686@gmail.com', 'partofcosmmos@gmail.com'].includes(user?.email || '');

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
      } else if (e.altKey && /^[1-8]$/.test(e.key)) {
        const order: ActiveTabType[] = ['dashboard', 'attendance', 'pomodoro', 'analytics', 'goals', 'journal', 'settings', 'feedback'];
        const target = order[parseInt(e.key, 10) - 1];
        if (target) {
          e.preventDefault();
          setActiveTab(target);
        }
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
    <div className="min-h-screen bg-[#f4f3ef] text-[#141413] flex flex-col md:flex-row font-sans relative">
      <MicroLoggerModal isOpen={isMicroLoggerOpen} onClose={() => setIsMicroLoggerOpen(false)} />
      <AIGatewayButton />

      {/* Mobile Top Bar */}
      <header className="md:hidden flex items-center justify-between px-4 h-14 bg-[#f4f3ef] border-b border-[#b8b5ac] sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ea580c]" />
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-[#141413] leading-none">Savantix</h1>
            <p className="font-mono text-[9px] text-[#5f5e59] uppercase tracking-wider mt-0.5">
              An initiative of Part of Cosmos
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => forceSyncNow()}
            disabled={syncStatus.isSyncing}
            className="p-2 text-[#575652] hover:text-[#141413] bg-[#ffffff] border border-[#d5d3cb] rounded-[4px] transition-colors cursor-pointer"
            title={`Cloud Sync: ${syncStatus.lastSyncedAt || 'Live'}`}
          >
            <RefreshCw className={clsx('w-4 h-4', syncStatus.isSyncing && 'animate-spin text-[#c2410c]')} />
          </button>

          <button
            onClick={() => setIsMicroLoggerOpen(true)}
            className="p-2 text-[#141413] bg-[#ffffff] hover:bg-[#eae8e2] border border-[#d5d3cb] rounded-[4px] transition-colors cursor-pointer"
            title="Open Micro-Logger (Alt+L)"
          >
            <Zap className="w-4 h-4 text-[#c2410c]" />
          </button>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-[#141413] bg-[#ffffff] border border-[#d5d3cb] rounded-[4px] cursor-pointer"
            aria-label="Toggle navigation"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Architectural Navigation Rail */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 w-64 bg-[#f4f3ef] border-r border-[#b8b5ac] flex flex-col transform transition-transform duration-200 ease-out md:relative md:translate-x-0',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Masthead */}
        <div className="hidden md:flex px-5 py-4 items-center justify-between border-b border-[#d5d3cb]">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#ea580c]" />
              <h1 className="text-base font-semibold tracking-tight text-[#141413]">Savantix</h1>
            </div>
            <p className="font-mono text-[9px] text-[#5f5e59] uppercase tracking-wider mt-1">
              An initiative of Part of Cosmos
            </p>
          </div>
        </div>

        {/* Quick Micro-Logger Command */}
        <div className="px-4 py-3 border-b border-[#d5d3cb]">
          <button
            onClick={() => setIsMicroLoggerOpen(true)}
            className="rams-btn-primary w-full flex items-center justify-between px-3 py-2 rounded-[4px] text-xs font-medium transition-colors duration-150 cursor-pointer"
            title="Quick Study Micro-Logger (Alt+L or Ctrl+K)"
          >
            <span className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5" />
              <span>Micro-Logger HUD</span>
            </span>
            <kbd className="font-mono text-[10px] opacity-80 px-1.5 py-0.5 rounded-[2px] border border-white/25">
              Alt+L
            </kbd>
          </button>
        </div>

        {/* Primary Workspace Navigation */}
        <nav className="flex-1 py-3 overflow-y-auto">
          <div className="px-5 pb-1.5 font-mono text-[10px] text-[#5f5e59] tracking-wider">
            01 / WORKSPACE
          </div>
          <div className="space-y-0.5">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as ActiveTabType);
                    setIsMobileMenuOpen(false);
                  }}
                  className={clsx(
                    'w-full flex items-center gap-2.5 px-5 py-2.5 text-xs transition-colors duration-150 cursor-pointer border-l-2 text-left',
                    isActive
                      ? 'border-[#ea580c] bg-[#eae8e2] text-[#141413] font-semibold'
                      : 'border-transparent text-[#575652] hover:bg-[#eae8e2]/60 hover:text-[#141413] font-medium'
                  )}
                >
                  <tab.icon
                    className={clsx('w-4 h-4 shrink-0', isActive ? 'text-[#c2410c]' : 'text-[#5f5e59]')}
                    strokeWidth={1.75}
                  />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Cosmic Knowledge Suite */}
          <div className="mt-4 pt-3 border-t border-[#d5d3cb]">
            <div className="px-5 pb-1.5 font-mono text-[10px] text-[#5f5e59] tracking-wider">
              02 / KNOWLEDGE SUITE
            </div>
            <div className="space-y-0.5">
              {suiteLinks.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-between px-5 py-2 text-xs font-medium text-[#575652] hover:text-[#141413] hover:bg-[#eae8e2]/60 transition-colors duration-150"
                >
                  <span className="flex items-center gap-2.5">
                    <item.icon className="w-3.5 h-3.5 text-[#5f5e59]" strokeWidth={1.75} />
                    <span>{item.label}</span>
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#5f5e59]" />
                </a>
              ))}
            </div>
          </div>
        </nav>

        {/* Cloud Sync Telemetry Strip */}
        <div className="px-4 py-2.5 border-t border-[#d5d3cb] bg-[#eceae3]/60 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={clsx(
                'w-1.5 h-1.5 rounded-full shrink-0',
                syncStatus.isSyncing ? 'bg-[#ea580c]' : 'bg-[#15803d]'
              )}
            />
            <span className="font-mono text-[10px] text-[#575652] truncate">
              {syncStatus.isSyncing ? 'Syncing cloud...' : `Synced · ${syncStatus.lastSyncedAt || 'Live'}`}
            </span>
          </div>
          <button
            onClick={() => forceSyncNow()}
            disabled={syncStatus.isSyncing}
            className="p-1 text-[#575652] hover:text-[#141413] hover:bg-[#eae8e2] rounded-[4px] transition-colors cursor-pointer"
            title="Sync now"
          >
            <RefreshCw className={clsx('w-3.5 h-3.5', syncStatus.isSyncing && 'animate-spin text-[#c2410c]')} />
          </button>
        </div>

        {/* Account Footer */}
        <div className="px-4 py-3 border-t border-[#d5d3cb] flex items-center justify-between">
          <div className="flex flex-col min-w-0 pr-2">
            <span className="text-xs font-semibold text-[#141413] truncate">
              {user?.displayName && !user.displayName.toLowerCase().includes('debanjan')
                ? user.displayName
                : 'Lead Scholar'}
            </span>
            <span className="font-mono text-[10px] text-[#5f5e59] truncate">
              {isFounder ? 'Core Researcher' : user?.email || 'Local Sandbox'}
            </span>
          </div>
          <button
            onClick={logout}
            className="p-2 text-[#575652] hover:text-[#b91c1c] hover:bg-[#eae8e2] rounded-[4px] transition-colors cursor-pointer"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-[#141413]/30 z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content Stage */}
      <main className="flex-1 overflow-y-auto min-h-0 h-[calc(100vh-56px)] md:h-screen bg-[#f4f3ef]">
        {children}
      </main>
    </div>
  );
};
