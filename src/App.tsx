import React, { useState, useEffect } from 'react';
import { AppProvider } from './context/AppContext';
import { AuthWrapper } from './components/AuthWrapper';
import { Layout, ActiveTabType } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Analytics } from './components/Analytics';
import { Journal } from './components/Journal';
import { Goals } from './components/Goals';
import { Pomodoro } from './components/Pomodoro';
import { Settings } from './components/Settings';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DeepWorkFortress } from './components/DeepWorkFortress';
import { ContactFeedback } from './components/ContactFeedback';
import { AttendanceCalculator } from './components/AttendanceCalculator';

const TAB_ROUTES: Record<ActiveTabType, { path: string; title: string }> = {
  dashboard: { path: '/', title: 'Savantix | Elite AI Study Optimization' },
  pomodoro: { path: '/pomodoro', title: 'Focus Timer & Deep Work | Savantix' },
  analytics: { path: '/analytics', title: 'Study Analytics & Velocity | Savantix' },
  attendance: { path: '/attendance', title: 'Smart Attendance Calculator & Planner | Savantix' },
  goals: { path: '/goals', title: 'Study Targets & Syllabus Goals | Savantix' },
  journal: { path: '/journal', title: 'Daily Reflection & Study Journal | Savantix' },
  settings: { path: '/settings', title: 'System Settings | Savantix' },
  feedback: { path: '/feedback', title: 'Contact & Feedback | Savantix' },
};

function resolveTabFromLocation(): ActiveTabType {
  if (typeof window === 'undefined') return 'dashboard';

  // 1. Check path-based URL (/attendance, /pomodoro, /analytics, etc.)
  const pathname = window.location.pathname.replace(/\/+$/, '') || '/';
  for (const [tabKey, config] of Object.entries(TAB_ROUTES)) {
    if (config.path === pathname || pathname === `/${tabKey}`) {
      return tabKey as ActiveTabType;
    }
  }

  // 2. Fallback to query parameter (?tab=attendance)
  try {
    const params = new URLSearchParams(window.location.search);
    const targetTab = params.get('tab') as ActiveTabType;
    if (targetTab && TAB_ROUTES[targetTab]) {
      return targetTab;
    }
  } catch {}

  return 'dashboard';
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTabType>(resolveTabFromLocation);
  const [isFortressMode, setIsFortressMode] = useState(false);
  // Keep-alive lazy mounting: only mount heavy components when first visited
  const [mountedTabs, setMountedTabs] = useState<Set<ActiveTabType>>(() => new Set([resolveTabFromLocation()]));

  // Synchronize document title and browser URL with activeTab
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const route = TAB_ROUTES[activeTab];
      if (route) {
        document.title = route.title;
        const currentPath = window.location.pathname.replace(/\/+$/, '') || '/';
        if (currentPath !== route.path) {
          window.history.pushState({ tab: activeTab }, '', route.path);
        }
      }
    }
  }, [activeTab]);

  // Handle browser Back / Forward buttons (popstate)
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      const newTab = (e.state && e.state.tab) || resolveTabFromLocation();
      setActiveTab(newTab);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    setMountedTabs(prev => {
      if (prev.has(activeTab)) return prev;
      const next = new Set(prev);
      next.add(activeTab);
      return next;
    });
  }, [activeTab]);

  useEffect(() => {
    // 1. In-app navigation custom event listener
    const handleNavigate = (e: any) => {
      if (e.detail && e.detail.tab) {
        setActiveTab(e.detail.tab);
      }
    };
    window.addEventListener('navigate', handleNavigate);

    // 2. Android PWA / Home Screen Widget Shortcut Actions
    try {
      const params = new URLSearchParams(window.location.search);
      const action = params.get('action');
      if (action === 'microlog') {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('savantix_open_microlog'));
        }, 350);
      } else if (action === 'aigateway') {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('savantix_open_ai_gateway', { detail: { open: true } }));
        }, 350);
      }
    } catch {}

    return () => window.removeEventListener('navigate', handleNavigate);
  }, []);

  return (
    <ErrorBoundary>
      <AppProvider>
        <AuthWrapper>
          {isFortressMode && <DeepWorkFortress onClose={() => setIsFortressMode(false)} />}
          <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
            {/* Optimized Lazy-Mount Keep-Alive Viewport for Study Time Management Suite */}
            {(mountedTabs.has('dashboard') || activeTab === 'dashboard') && (
              <div className={`h-full w-full ${activeTab === 'dashboard' ? 'block' : 'hidden'}`}>
                <Dashboard />
              </div>
            )}
            {(mountedTabs.has('pomodoro') || activeTab === 'pomodoro') && (
              <div className={`h-full w-full ${activeTab === 'pomodoro' ? 'block' : 'hidden'}`}>
                <Pomodoro isFortressMode={isFortressMode} setIsFortressMode={setIsFortressMode} />
              </div>
            )}
            {(mountedTabs.has('analytics') || activeTab === 'analytics') && (
              <div className={`h-full w-full ${activeTab === 'analytics' ? 'block' : 'hidden'}`}>
                <Analytics />
              </div>
            )}
            {(mountedTabs.has('attendance') || activeTab === 'attendance') && (
              <div className={`h-full w-full ${activeTab === 'attendance' ? 'block' : 'hidden'}`}>
                <AttendanceCalculator />
              </div>
            )}
            {(mountedTabs.has('goals') || activeTab === 'goals') && (
              <div className={`h-full w-full ${activeTab === 'goals' ? 'block' : 'hidden'}`}>
                <Goals />
              </div>
            )}
            {(mountedTabs.has('journal') || activeTab === 'journal') && (
              <div className={`h-full w-full ${activeTab === 'journal' ? 'block' : 'hidden'}`}>
                <Journal />
              </div>
            )}
            {(mountedTabs.has('settings') || activeTab === 'settings') && (
              <div className={`h-full w-full ${activeTab === 'settings' ? 'block' : 'hidden'}`}>
                <Settings />
              </div>
            )}
            {(mountedTabs.has('feedback') || activeTab === 'feedback') && (
              <div className={`h-full w-full ${activeTab === 'feedback' ? 'block' : 'hidden'}`}>
                <ContactFeedback />
              </div>
            )}
          </Layout>
        </AuthWrapper>
      </AppProvider>
    </ErrorBoundary>
  );
}
