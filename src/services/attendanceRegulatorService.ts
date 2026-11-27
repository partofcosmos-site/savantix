import {
  InstitutionalAttendanceState,
  InstitutionalProfile,
  AbsenceEntry,
  HolidayEntry,
  VacationEntry,
  ExamMilestone,
  OnDutyCredit,
  AttendanceMetrics,
  SimulationResult,
  SubjectAttendance
} from '../types/attendance';
import { CloudSyncService } from './cloudSyncService';

export const INSTITUTIONAL_STORAGE_KEY = 'savantix_attendance_institutional_v1';
export const LEGACY_SUBJECTS_STORAGE_KEY = 'savantix_attendance_data_v1';

// Clean universal default subjects (customizable per account; personal records sync privately from cloud KV)
export const DEFAULT_SUBJECTS: SubjectAttendance[] = [
  { id: 'subj_1', name: 'Physics', attended: 0, total: 0, required: 75, color: 'indigo', isPracticalSubject: true },
  { id: 'subj_2', name: 'Chemistry', attended: 0, total: 0, required: 75, color: 'rose', isPracticalSubject: true },
  { id: 'subj_3', name: 'Mathematics', attended: 0, total: 0, required: 75, color: 'emerald', isPracticalSubject: false },
  { id: 'subj_4', name: 'Computer Science', attended: 0, total: 0, required: 75, color: 'sky', isPracticalSubject: true },
  { id: 'subj_5', name: 'English', attended: 0, total: 0, required: 75, color: 'purple', isPracticalSubject: false },
];

export const DEFAULT_ABSENCES: AbsenceEntry[] = [];

// Generic public holidays (users can customize holidays for their own institution/region)
export const DEFAULT_HOLIDAYS: HolidayEntry[] = [
  { id: 'hol_1', date: '2026-01-26', dayOfWeek: 'Monday', name: 'Republic Day', classification: 'National' },
  { id: 'hol_2', date: '2026-05-01', dayOfWeek: 'Friday', name: 'May Day', classification: 'Gazetted' },
  { id: 'hol_3', date: '2026-08-15', dayOfWeek: 'Saturday', name: 'Independence Day', classification: 'National' },
  { id: 'hol_4', date: '2026-10-02', dayOfWeek: 'Friday', name: 'Gandhi Jayanti', classification: 'National' },
  { id: 'hol_5', date: '2026-12-25', dayOfWeek: 'Friday', name: 'Christmas Day', classification: 'National' },
];

export const DEFAULT_VACATIONS: VacationEntry[] = [
  { id: 'vac_1', name: 'Summer Break', startDate: '2026-05-18', endDate: '2026-06-13', calendarDays: 27, schoolDaysSaved: 20, description: 'Scheduled summer break window (editable)' },
  { id: 'vac_2', name: 'Winter Break', startDate: '2026-12-25', endDate: '2027-01-02', calendarDays: 9, schoolDaysSaved: 6, description: 'Scheduled winter break window (editable)' },
];

export const DEFAULT_EXAMS: ExamMilestone[] = [
  { id: 'exam_1', name: 'Midterm Examination', startDate: '2026-09-14', endDate: '2026-09-25', ptmDate: '2026-10-03', status: 'scheduled', strategicFocus: 'Mid-session cumulative evaluation', syllabusPercentage: 50 },
  { id: 'exam_2', name: 'Final Examination', startDate: '2027-03-01', endDate: '2027-03-12', ptmDate: '2027-03-20', status: 'scheduled', strategicFocus: 'End-of-session full syllabus exam', syllabusPercentage: 100 },
];

export const DEFAULT_ON_DUTY: OnDutyCredit[] = [];

export const NEUTRAL_DEFAULT_PROFILE: InstitutionalProfile = {
  schoolName: 'Your Institution',
  affiliationNo: '',
  board: 'Secondary / Higher Secondary / University',
  stream: 'General Academic Track',
  sessionStart: '2026-04-01',
  lockDate: '2026-12-31',
  totalWorkingDays: 140,
  workingDaysHeld: 0,
  presentDays: 0,
  absentDays: 0,
  onDutyDays: 0,
  subjects: DEFAULT_SUBJECTS
};

export const DEFAULT_PROFILE: InstitutionalProfile = NEUTRAL_DEFAULT_PROFILE;

export const NEUTRAL_DEFAULT_INITIAL_STATE: InstitutionalAttendanceState = {
  profile: NEUTRAL_DEFAULT_PROFILE,
  absences: [],
  holidays: DEFAULT_HOLIDAYS,
  vacations: DEFAULT_VACATIONS,
  exams: DEFAULT_EXAMS,
  onDuty: [],
  lastUpdated: new Date().toISOString()
};

export const DEFAULT_INITIAL_STATE: InstitutionalAttendanceState = NEUTRAL_DEFAULT_INITIAL_STATE;

/**
 * Compute exact Mon–Fri school working days between startDate and endDate (inclusive),
 * automatically excluding official holidays and vacation windows.
 */
export function computeWorkingDaysBetween(
  startDate: string,
  endDate: string,
  holidays: HolidayEntry[] = DEFAULT_HOLIDAYS,
  vacations: VacationEntry[] = DEFAULT_VACATIONS
): number {
  if (!startDate || !endDate || endDate < startDate) return 0;
  const holidaySet = new Set((holidays || []).map((h) => h.date));
  const isVacation = (iso: string) =>
    (vacations || []).some((v) => v.startDate && v.endDate && iso >= v.startDate && iso <= v.endDate);

  const cur = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  if (isNaN(cur.getTime()) || isNaN(end.getTime())) return 0;

  let count = 0;
  while (cur <= end) {
    const dow = cur.getUTCDay(); // 0=Sun, 6=Sat
    if (dow >= 1 && dow <= 5) {
      const iso = cur.toISOString().slice(0, 10);
      if (!holidaySet.has(iso) && !isVacation(iso)) {
        count++;
      }
    }
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return count;
}

export function computeWorkingDaysToToday(
  state: InstitutionalAttendanceState,
  asOfDate?: string
): number {
  const start = state.profile?.sessionStart || '2026-04-21';
  const lock = state.profile?.lockDate || '2026-12-31';
  const today = asOfDate || new Date().toISOString().slice(0, 10);
  const effectiveEnd = today < lock ? today : lock;
  return computeWorkingDaysBetween(start, effectiveEnd, state.holidays, state.vacations);
}

export function computeLiveMetrics(state: InstitutionalAttendanceState): AttendanceMetrics {
  const profile = state.profile || ({} as any);
  const tHeld = Math.max(1, profile.workingDaysHeld ?? 71);
  const present = Math.max(0, profile.presentDays ?? 48);
  
  // Calculate approved on-duty days
  const odDaysFromList = Array.isArray(state.onDuty)
    ? state.onDuty.reduce((acc, curr) => {
        return curr.status === 'APPROVED_ON_DUTY' ? acc + (typeof curr.workingDays === 'number' ? curr.workingDays : (curr.workingDays ?? 0)) : acc;
      }, 0)
    : 0;

  // Preserve explicit 0 onDutyCredits or onDutyDays if specified on profile, otherwise fallback to onDuty list / default
  const odDays = typeof (profile as any).onDutyCredits === 'number'
    ? (profile as any).onDutyCredits
    : (Array.isArray(state.onDuty)
        ? odDaysFromList
        : (profile.onDutyDays ?? 10));

  const absent = Math.max(0, profile.absentDays ?? 23);
  const tSession = Math.max(tHeld, profile.totalWorkingDays ?? 139);
  const rDays = Math.max(0, tSession - tHeld);

  const effectiveDays = present + odDays;
  const effectivePct = Number(((effectiveDays / tHeld) * 100).toFixed(2));
  const rawPct = Number(((present / tHeld) * 100).toFixed(2));

  // Required days for target thresholds
  const targetDays75 = Math.ceil(0.75 * tSession);
  const targetDays60 = Math.ceil(0.60 * tSession);

  // Future days must attend
  const daysMustAttend75 = Math.max(0, targetDays75 - effectiveDays);
  const daysMustAttend60 = Math.max(0, targetDays60 - effectiveDays);

  // Safe future leaves remaining
  const safeLeaves75 = Math.max(0, rDays - daysMustAttend75);
  const safeLeaves60 = Math.max(0, rDays - daysMustAttend60);

  // Consecutive compulsory recovery math:
  // C_rec = max(0, ceil((0.75 * T_held - AttendedEffective) / 0.25))
  const rawDeficit = 0.75 * tHeld - present;
  const consecutiveRecoveryRaw = rawDeficit > 0 ? Math.ceil(rawDeficit / 0.25) : 0;

  const effDeficit = 0.75 * tHeld - effectiveDays;
  const consecutiveRecoveryEffective = effDeficit > 0 ? Math.ceil(effDeficit / 0.25) : 0;
  const effectiveSurplusBuffer = Number((effectiveDays - (0.75 * tHeld)).toFixed(2));

  const statusEffective: 'safe' | 'warning' | 'danger' =
    effectivePct >= 75 ? 'safe' : effectivePct >= 70 ? 'warning' : 'danger';

  const statusRaw: 'safe' | 'warning' | 'danger' =
    rawPct >= 75 ? 'safe' : rawPct >= 70 ? 'warning' : 'danger';

  return {
    workingDaysHeld: tHeld,
    presentDays: present,
    onDutyDays: odDays,
    absentDays: absent,
    totalSessionDays: tSession,
    remainingSessionDays: rDays,
    effectiveDays,
    effectivePct,
    rawPct,
    safeLeaves75,
    safeLeaves60,
    daysMustAttend75,
    daysMustAttend60,
    targetDays75,
    targetDays60,
    consecutiveRecoveryRaw,
    consecutiveRecoveryEffective,
    effectiveSurplusBuffer,
    statusEffective,
    statusRaw
  };
}

/**
 * Simulate hypothetical attendance scenarios
 */
export function simulateAttendanceScenario(
  state: InstitutionalAttendanceState,
  hypotheticalFutureLeaves: number,
  hypotheticalFutureAttended: number
): SimulationResult {
  const metrics = computeLiveMetrics(state);
  const futureHeld = Math.max(0, hypotheticalFutureLeaves) + Math.max(0, hypotheticalFutureAttended);
  const projectedHeld = metrics.workingDaysHeld + futureHeld;
  const projectedEffective = metrics.effectiveDays + Math.max(0, hypotheticalFutureAttended);
  
  const projectedEffectivePct = projectedHeld > 0
    ? Number(((projectedEffective / projectedHeld) * 100).toFixed(2))
    : 0;

  // If we project through whole session to Dec 31
  const remainingAfterFuture = Math.max(0, metrics.remainingSessionDays - futureHeld);
  // Assuming 100% attendance on all other remaining days
  const projectedFinalEffective = projectedEffective + remainingAfterFuture;
  const projectedFinalPctDec31 = Number(((projectedFinalEffective / metrics.totalSessionDays) * 100).toFixed(2));

  return {
    hypotheticalAbsences: hypotheticalFutureLeaves,
    hypotheticalAttended: hypotheticalFutureAttended,
    projectedEffectiveDays: projectedEffective,
    projectedHeldDays: projectedHeld,
    projectedEffectivePct,
    projectedFinalPctDec31,
    meetsSafe75: projectedFinalPctDec31 >= 75,
    meetsCondonation60: projectedFinalPctDec31 >= 60
  };
}

/**
 * Generate Structured Gemini Prompt Payload for 1-Click Regulator Bridge
 */
export function generateGeminiRegulatoryPrompt(
  state: InstitutionalAttendanceState,
  customQuery?: string
): string {
  const metrics = computeLiveMetrics(state);
  const profile = state.profile;

  const nextExam = state.exams.find(e => e.status === 'upcoming') || state.exams[1] || state.exams[0];
  const formattedAbsences = state.absences.length > 0
    ? state.absences.map((a, idx) => 
        `${idx + 1}. [${a.date} | ${a.dayOfWeek}] ${a.reason} (${a.category.toUpperCase()}${a.isPracticalDay ? ' | Practical Day' : ''})`
      ).join('\n')
    : '(No absences recorded)';

  const formattedHolidays = state.holidays.slice(0, 15).map((h, idx) =>
    `${idx + 1}. ${h.date} (${h.dayOfWeek}) - ${h.name} [${h.classification}]`
  ).join('\n');

  const formattedVacations = state.vacations.map(v =>
    `- **${v.name}**: ${v.startDate} to ${v.endDate} (${v.calendarDays} calendar days, ${v.schoolDaysSaved} school days saved)`
  ).join('\n');

  const formattedOnDuty = state.onDuty.length > 0
    ? state.onDuty.map(od => `${od.description} (${od.startDate} to ${od.endDate}, ${od.workingDays} school days credit)`).join('; ')
    : 'None';

  return `# SAVANTIX AEGIS: INSTITUTIONAL ATTENDANCE REGULATOR & STRATEGIC DOSSIER
**System Identity:** Savantix Aegis — Academic Attendance Portal
**Generated At:** ${new Date().toISOString()} (Live Academic Ledger)

## 1. INSTITUTIONAL & ACADEMIC PROFILE
- **Institution:** ${profile.schoolName || 'Secondary / Senior Secondary School'}
- **Affiliation / Board:** ${profile.board || 'CBSE'} ${profile.affiliationNo ? `(Affiliation: ${profile.affiliationNo})` : ''}
- **Academic Stream:** ${profile.stream || 'General Academic'}
- **Schedule:** Monday to Friday (5 working days / week)
- **Academic Session Window:** ${profile.sessionStart} to ${profile.lockDate} (Attendance Lock Date)
- **Total Projected Working Days:** ${metrics.totalSessionDays} days

## 2. REALITY ATTENDANCE METRICS (Live Ground Truth)
- **Working Days Held to Date:** ${metrics.workingDaysHeld} days
- **Days Physically Attended (P):** ${metrics.presentDays} days
- **Approved On-Duty Credits (OD):** ${metrics.onDutyDays} days (${formattedOnDuty})
- **Total Effective Attendance Credit (P + OD):** ${metrics.effectiveDays} / ${metrics.workingDaysHeld}
- **LIVE EFFECTIVE ATTENDANCE:** **${metrics.effectivePct}%** (Rule 14 / Condonation Standard)
- **RAW PHYSICAL ATTENDANCE:** **${metrics.rawPct}%**
- **Consecutive Recovery Days Needed (Effective):** ${metrics.consecutiveRecoveryEffective} days (Buffer Surplus: +${metrics.effectiveSurplusBuffer} days)
- **Consecutive Recovery Days Needed (Raw without OD):** ${metrics.consecutiveRecoveryRaw} consecutive days
- **Remaining Working Days to Cutoff:** ${metrics.remainingSessionDays} days
- **Safe Future Leaves Remaining to Cutoff (at 75% standard threshold):** **${metrics.safeLeaves75} days**
- **Safe Future Leaves Remaining to Cutoff (at 60% medical condonation threshold):** **${metrics.safeLeaves60} days**

## 3. ACADEMIC & CALENDAR LEDGER
### A. Upcoming Examination Milestones:
${nextExam ? `- **Next Critical Exam:** ${nextExam.name} (${nextExam.startDate} to ${nextExam.endDate})` : '- No upcoming exams scheduled'}

### B. Major Vacation Windows (School Days Saved):
${formattedVacations}

### C. Logged Absences Schedule (${state.absences.length} Entries):
${formattedAbsences}

### D. Key Institutional Holidays:
${formattedHolidays}

## 4. REGULATORY FRAMEWORK & STRATEGIC INQUIRIES
Please evaluate my case under the following regulatory and high-performance frameworks:

1. **Board Examination By-Laws & Condonation Rules:**
   - Formal documentation protocols for medical illness or approved academic/sports deputation under Rule 14.
   - Preserving minimum 75% mandatory attendance floor ahead of official session lock dates.
2. **Attendance vs. Academic Self-Study Optimization:**
   - With ${metrics.safeLeaves75} safe leaves remaining until cutoff, provide an optimal weekly distribution schedule between physical class presence and concentrated syllabus revision.
   - Balancing practical/laboratory days vs theoretical coursework.
3. **Institutional Risk Assessment & Buffer Management:**
   - Proactive margin calculations to absorb unforeseen sick leaves without breaching board minimums.

${customQuery ? `\n## 5. USER CUSTOM DIRECTIVE\n${customQuery}` : `\n## 5. ADVISORY DIRECTIVE FOR GEMINI\nAct as a Senior Academic Dean and Board Regulatory Advisor. Provide a clear, actionable attendance management strategy, advice on condonation procedures, and a week-by-week calendar recommendation to maintain safe compliance.`}
`;
}

/**
 * Launch Gemini Web Regulator: copies rich prompt payload to clipboard & opens Gemini web interface
 */
export async function launchGeminiRegulator(
  state: InstitutionalAttendanceState,
  customQuery?: string
): Promise<{ success: boolean; message: string }> {
  try {
    const prompt = generateGeminiRegulatoryPrompt(state, customQuery);
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(prompt);
    }
    if (typeof window !== 'undefined') {
      window.open('https://gemini.google.com/app', '_blank', 'noopener,noreferrer');
    }
    return {
      success: true,
      message: 'Comprehensive Institutional Regulatory Dossier copied to clipboard! Opening Gemini Web...'
    };
  } catch (err) {
    if (typeof window !== 'undefined') {
      window.open('https://gemini.google.com/app', '_blank', 'noopener,noreferrer');
    }
    return {
      success: false,
      message: 'Opened Gemini Web. Please copy the prompt payload manually from the AI Regulator tab.'
    };
  }
}

export const isOwnerAccount = (_identifier?: string): boolean => false;

export function getInstitutionalStorageKey(identifier?: string): string {
  const clean = String(identifier || '').trim().toLowerCase();
  if (!clean || clean === 'guest' || clean === 'guest_user' || clean === 'anonymous' || clean === 'guest@savantix.app') {
    return 'savantix_attendance_institutional_guest';
  }
  const safeKey = clean.replace(/[^a-z0-9_]/g, '_');
  return `savantix_attendance_institutional_${safeKey}`;
}

/**
 * Load institutional state from localStorage with strict per-account partitioning.
 * Personal records for signed-in accounts hydrate privately from Cloudflare KV on sign-in.
 */
export function loadInstitutionalState(identifier?: string): InstitutionalAttendanceState {
  try {
    const key = getInstitutionalStorageKey(identifier);
    const clean = String(identifier || '').trim().toLowerCase();
    const prefixKey = clean.includes('@') ? `savantix_attendance_institutional_${clean.split('@')[0]}` : null;
    const isGuest = key === 'savantix_attendance_institutional_guest';

    const rawData = localStorage.getItem(key)
      || (!isGuest && prefixKey ? localStorage.getItem(prefixKey) : null)
      || (!isGuest ? localStorage.getItem(INSTITUTIONAL_STORAGE_KEY) : null);

    const baseline: InstitutionalAttendanceState = NEUTRAL_DEFAULT_INITIAL_STATE;
    let state: InstitutionalAttendanceState = baseline;

    if (rawData) {
      const parsed = JSON.parse(rawData);
      const deletedDates = new Set<string>(
        Array.isArray(parsed.deletedAbsenceDates) ? parsed.deletedAbsenceDates : []
      );
      const absenceMap = new Map<string, AbsenceEntry>();
      if (Array.isArray(parsed.absences)) {
        parsed.absences.forEach((a: AbsenceEntry) => {
          if (a && a.date && !deletedDates.has(a.date)) {
            absenceMap.set(a.date, a);
          }
        });
      }
      const cleanAbsences = Array.from(absenceMap.values()).sort((a, b) => b.date.localeCompare(a.date));

      const mergedProfile = { ...baseline.profile, ...(parsed.profile || {}) };
      if (!mergedProfile.schoolName) mergedProfile.schoolName = baseline.profile.schoolName;
      if (!mergedProfile.board) mergedProfile.board = baseline.profile.board;
      mergedProfile.absentDays = cleanAbsences.length;
      if (typeof mergedProfile.workingDaysHeld === 'number' && mergedProfile.workingDaysHeld > 0) {
        mergedProfile.presentDays = Math.max(0, mergedProfile.workingDaysHeld - cleanAbsences.length);
      }

      state = {
        ...baseline,
        ...parsed,
        profile: mergedProfile,
        absences: cleanAbsences,
        deletedAbsenceDates: Array.from(deletedDates).sort(),
        holidays: Array.isArray(parsed.holidays) && parsed.holidays.length > 0 ? parsed.holidays : baseline.holidays,
        vacations: Array.isArray(parsed.vacations) && parsed.vacations.length > 0 ? parsed.vacations : baseline.vacations,
        exams: Array.isArray(parsed.exams) && parsed.exams.length > 0 ? parsed.exams : baseline.exams,
        onDuty: Array.isArray(parsed.onDuty) ? parsed.onDuty : baseline.onDuty,
      };
    } else if (!isGuest) {
      const legacyRaw = localStorage.getItem(LEGACY_SUBJECTS_STORAGE_KEY);
      if (legacyRaw) {
        try {
          const legacySubjects = JSON.parse(legacyRaw);
          if (Array.isArray(legacySubjects) && legacySubjects.length > 0) {
            state = {
              ...state,
              profile: {
                ...state.profile,
                subjects: legacySubjects.map(s => ({
                  id: s.id || `subj_${Math.random().toString(36).substring(2, 7)}`,
                  name: s.name || 'Subject',
                  attended: typeof s.attended === 'number' ? s.attended : 0,
                  total: typeof s.total === 'number' ? s.total : 0,
                  required: typeof s.required === 'number' ? s.required : 75,
                  color: s.color || 'indigo',
                  code: s.code,
                  isPracticalSubject: Boolean(s.isPracticalSubject)
                }))
              }
            };
          }
        } catch {}
      }
    }

    return state;
  } catch {
    return NEUTRAL_DEFAULT_INITIAL_STATE;
  }
}

/**
 * Save institutional state to the active account's storage partition and sync to cloud when signed in.
 */
export function saveInstitutionalState(state: InstitutionalAttendanceState, identifier?: string): void {
  try {
    const updatedState: InstitutionalAttendanceState = {
      ...state,
      lastUpdated: new Date().toISOString()
    };
    const key = getInstitutionalStorageKey(identifier);
    const isGuestOrAnon = key === 'savantix_attendance_institutional_guest';
    const serialized = JSON.stringify(updatedState);
    localStorage.setItem(key, serialized);

    if (!isGuestOrAnon && identifier && identifier.includes('@')) {
      const clean = identifier.trim().toLowerCase();
      localStorage.setItem(INSTITUTIONAL_STORAGE_KEY, serialized);
      localStorage.setItem(`savantix_attendance_institutional_${clean.split('@')[0]}`, serialized);
      if (Array.isArray(state.profile?.subjects)) {
        localStorage.setItem(LEGACY_SUBJECTS_STORAGE_KEY, JSON.stringify(state.profile.subjects));
      }
    }

    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('savantix:attendance-updated', { detail: updatedState }));
    }

    if (!isGuestOrAnon && identifier && identifier.includes('@')) {
      const syncEmail = identifier.trim().toLowerCase();
      const canonicalId = CloudSyncService.getCanonicalUid(syncEmail);
      CloudSyncService.pushToCloud(syncEmail, canonicalId).catch(syncErr => {
        console.warn('[saveInstitutionalState] Auto cloud push notice:', syncErr);
      });
    }
  } catch (err) {
    console.error('Failed to save institutional attendance state', err);
  }
}

export interface StreakAbsenceRisk {
  hasCriticalStreak: boolean;
  consecutiveAbsenceStreak: number;
  dates: string[];
  warningMessage?: string;
}

/**
 * 3-Consecutive-Day Absence Risk Detector
 * Detects whether 3 or more consecutive school working days were missed.
 */
export function detectConsecutiveAbsenceRisk(absences: AbsenceEntry[]): StreakAbsenceRisk {
  const sorted = [...(absences || [])]
    .filter(a => a.status === 'ABSENT' || a.status === 'ABSENT_PRACTICAL_DAY' || !a.status)
    .sort((a, b) => a.date.localeCompare(b.date));

  let maxStreak = 0;
  let currentStreak = 0;
  let streakDates: string[] = [];
  let longestStreakDates: string[] = [];

  const isNextWorkingDay = (d1: string, d2: string): boolean => {
    const dt1 = new Date(d1);
    const dt2 = new Date(d2);
    const diffDays = Math.round((dt2.getTime() - dt1.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) return true;
    if (diffDays === 3 && dt1.getDay() === 5 && dt2.getDay() === 1) return true;
    return false;
  };

  for (let i = 0; i < sorted.length; i++) {
    if (i === 0) {
      currentStreak = 1;
      streakDates = [sorted[i].date];
    } else {
      if (isNextWorkingDay(sorted[i - 1].date, sorted[i].date)) {
        currentStreak++;
        streakDates.push(sorted[i].date);
      } else {
        if (currentStreak > maxStreak) {
          maxStreak = currentStreak;
          longestStreakDates = [...streakDates];
        }
        currentStreak = 1;
        streakDates = [sorted[i].date];
      }
    }
  }
  if (currentStreak > maxStreak) {
    maxStreak = currentStreak;
    longestStreakDates = [...streakDates];
  }

  const hasCriticalStreak = maxStreak >= 3;
  return {
    hasCriticalStreak,
    consecutiveAbsenceStreak: maxStreak,
    dates: longestStreakDates,
    warningMessage: hasCriticalStreak
      ? `CRITICAL REGULATORY RISK: ${maxStreak} consecutive school working days absent (${longestStreakDates.join(', ')}). Requires formal medical / on-duty condonation.`
      : undefined
  };
}
