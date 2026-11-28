import React, { useState, useEffect, Suspense, lazy } from 'react';
import { AppProvider } from './context/AppContext';
import { AuthWrapper } from './components/AuthWrapper';
import { Layout, ActiveTabType } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { ErrorBoundary } from './components/ErrorBoundary';

const Analytics = lazy(() => import('./components/Analytics').then(m => ({ default: m.Analytics })));
const Journal = lazy(() => import('./components/Journal').then(m => ({ default: m.Journal })));
const Goals = lazy(() => import('./components/Goals').then(m => ({ default: m.Goals })));
const Pomodoro = lazy(() => import('./components/Pomodoro').then(m => ({ default: m.Pomodoro })));
const Settings = lazy(() => import('./components/Settings').then(m => ({ default: m.Settings })));
const DeepWorkFortress = lazy(() => import('./components/DeepWorkFortress').then(m => ({ default: m.DeepWorkFortress })));
const ContactFeedback = lazy(() => import('./components/ContactFeedback').then(m => ({ default: m.ContactFeedback })));
const AttendanceCalculator = lazy(() => import('./components/AttendanceCalculator').then(m => ({ default: m.AttendanceCalculator })));
const StudyPlanner = lazy(() => import('./components/StudyPlanner').then(m => ({ default: m.StudyPlanner })));

const TabFallback = () => (
  <div className="flex items-center justify-center h-64 text-xs text-[var(--sx-ink-muted)]">
    Loading...
  </div>
);

const TAB_ROUTES: Record<ActiveTabType, { path: string; title: string }> = {
  dashboard: { path: '/', title: 'Savantix' },
  pomodoro: { path: '/pomodoro', title: 'Focus Timer — Savantix' },
  analytics: { path: '/analytics', title: 'Analytics — Savantix' },
  attendance: { path: '/attendance', title: 'Attendance — Savantix' },
  planner: { path: '/planner', title: 'Study Planner — Savantix' },
  goals: { path: '/goals', title: 'Goals — Savantix' },
  journal: { path: '/journal', title: 'Journal — Savantix' },
  settings: { path: '/settings', title: 'Settings — Savantix' },
  feedback: { path: '/feedback', title: 'Feedback — Savantix' },
};

function resolveTabFromLocation(): ActiveTabType {
  if (typeof window === 'undefined') return 'dashboard';
  const pathname = window.location.pathname.replace(/\/+$/, '') || '/';
  for (const [tabKey, config] of Object.entries(TAB_ROUTES)) {
    if (config.path === pathname || pathname === `/${tabKey}`) {
      return tabKey as ActiveTabType;
    }
  }
  try {
    const params = new URLSearchParams(window.location.search);
    const targetTab = params.get('tab') as ActiveTabType;
    if (targetTab && TAB_ROUTES[targetTab]) return targetTab;
  } catch {}
  return 'dashboard';
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTabType>(resolveTabFromLocation);
  const [isFortressMode, setIsFortressMode] = useState(false);
  const [pomodoroMounted, setPomodoroMounted] = useState<boolean>(() => resolveTabFromLocation() === 'pomodoro');

  useEffect(() => {
    if (activeTab === 'pomodoro' && !pomodoroMounted) setPomodoroMounted(true);
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
  }, [activeTab, pomodoroMounted]);

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      const newTab = (e.state && e.state.tab) || resolveTabFromLocation();
      setActiveTab(newTab);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const handleNavigate = (e: any) => {
      if (e.detail && e.detail.tab) setActiveTab(e.detail.tab);
    };
    window.addEventListener('navigate', handleNavigate);

    try {
      const params = new URLSearchParams(window.location.search);
      const action = params.get('action');
      if (action === 'microlog') {
        setTimeout(() => window.dispatchEvent(new CustomEvent('savantix_open_microlog')), 350);
      } else if (action === 'aigateway') {
        setTimeout(() => window.dispatchEvent(new CustomEvent('savantix_open_ai_gateway', { detail: { open: true } })), 350);
      }
    } catch {}

    return () => window.removeEventListener('navigate', handleNavigate);
  }, []);

  return (
    <ErrorBoundary>
      <AppProvider>
        <AuthWrapper>
          {isFortressMode && (
            <Suspense fallback={null}>
              <DeepWorkFortress onClose={() => setIsFortressMode(false)} />
            </Suspense>
          )}
          <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
            <Suspense fallback={<TabFallback />}>
              {activeTab === 'dashboard' && <Dashboard />}
              {pomodoroMounted && (
                <div className={activeTab === 'pomodoro' ? 'block h-full w-full' : 'hidden'}>
                  <Pomodoro isFortressMode={isFortressMode} setIsFortressMode={setIsFortressMode} />
                </div>
              )}
              {activeTab === 'analytics' && <Analytics />}
              {activeTab === 'attendance' && <AttendanceCalculator />}
              {activeTab === 'planner' && <StudyPlanner />}
              {activeTab === 'goals' && <Goals />}
              {activeTab === 'journal' && <Journal />}
              {activeTab === 'settings' && <Settings />}
              {activeTab === 'feedback' && <ContactFeedback />}
            </Suspense>
          </Layout>
        </AuthWrapper>
      </AppProvider>
    </ErrorBoundary>
  );
}
