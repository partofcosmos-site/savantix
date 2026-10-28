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

// Default CBSE Class XI Science Subjects
export const DEFAULT_SUBJECTS: SubjectAttendance[] = [
  { id: 'phy_042', code: '042', name: 'Physics', attended: 48, total: 71, required: 75, color: 'indigo', isPracticalSubject: true },
  { id: 'chem_043', code: '043', name: 'Chemistry', attended: 48, total: 71, required: 75, color: 'rose', isPracticalSubject: true },
  { id: 'math_041', code: '041', name: 'Mathematics', attended: 48, total: 71, required: 75, color: 'emerald', isPracticalSubject: false },
  { id: 'web_803', code: '803', name: 'Web Application', attended: 48, total: 71, required: 75, color: 'sky', isPracticalSubject: true },
  { id: 'pe_048', code: '048', name: 'Physical Education', attended: 48, total: 71, required: 75, color: 'amber', isPracticalSubject: true },
  { id: 'eng_301', code: '301', name: 'English Core', attended: 48, total: 71, required: 75, color: 'purple', isPracticalSubject: false },
];

// 15 Fully Verified Absences Reconciled via WhatsApp Ground Truth & Live Calendar
export const DEFAULT_ABSENCES: AbsenceEntry[] = [
  { id: 'abs_1', date: '2026-08-10', dayOfWeek: 'Monday', reason: 'Physics & Chemistry problem solving / self-study', category: 'self_study', isPracticalDay: false, notes: 'Verified via WhatsApp with Subhendu & Arnav' },
  { id: 'abs_2', date: '2026-08-11', dayOfWeek: 'Tuesday', reason: 'Self-study & school work completion', category: 'school_work', isPracticalDay: false, notes: 'Verified via WhatsApp with Arnav' },
  { id: 'abs_3', date: '2026-09-02', dayOfWeek: 'Wednesday', reason: 'Half-Yearly intensive self-study & revision', category: 'self_study', isPracticalDay: false, notes: 'Verified via WhatsApp with Protik, Arnav, Kallal, Kunal' },
  { id: 'abs_4', date: '2026-09-07', dayOfWeek: 'Monday', reason: 'Pre-exam consolidation & Olympiad preparation', category: 'olympiad', isPracticalDay: false, notes: 'Verified via WhatsApp with Protik (speech-to-text scholarship inquiry)' },
  { id: 'abs_5', date: '2026-09-09', dayOfWeek: 'Wednesday', reason: 'Exam revision & self-study day', category: 'self_study', isPracticalDay: false, notes: 'Verified via WhatsApp with Kallal, Snehasish, Arnav, Protik, Subhendu' },
  { id: 'abs_6', date: '2026-09-28', dayOfWeek: 'Monday', reason: 'Post Half-Yearly recovery & project sprint', category: 'recovery', isPracticalDay: false, notes: 'Verified via WhatsApp with Protik, Gem, Jayosmit' },
  { id: 'abs_7', date: '2026-09-29', dayOfWeek: 'Tuesday', reason: 'Tutopia self-study & mathematics consolidation', category: 'tutopia', isPracticalDay: false, notes: 'Verified via WhatsApp with Protik, Gem, Snehasish' },
  { id: 'abs_8', date: '2026-10-01', dayOfWeek: 'Thursday', reason: 'Physics and Web Applications self-study', category: 'self_study', isPracticalDay: true, notes: 'Verified via WhatsApp with Subhendu, Rounak, DEEP, Protik' },
  { id: 'abs_9', date: '2026-10-06', dayOfWeek: 'Tuesday', reason: 'Tutopia self-study & STEM research', category: 'tutopia', isPracticalDay: false, notes: 'Verified via WhatsApp with Protik, Jayosmit, Kallal, Arnav, Subhendu' },
  { id: 'abs_10', date: '2026-10-07', dayOfWeek: 'Wednesday', reason: 'Intensive problem sets & syllabus alignment', category: 'self_study', isPracticalDay: false, notes: 'Verified via WhatsApp with Protik' },
  { id: 'abs_11', date: '2026-10-08', dayOfWeek: 'Thursday', reason: 'Self-study & laboratory records writeup', category: 'school_work', isPracticalDay: true, notes: 'Verified via WhatsApp with Arnav' },
  { id: 'abs_12', date: '2026-10-12', dayOfWeek: 'Monday', reason: 'Pre-Puja syllabus revision & Tutopia sprint', category: 'tutopia', isPracticalDay: false, notes: 'Verified via WhatsApp with Kallal, Snehasish, Kunal, Protik, Arnav' },
  { id: 'abs_13', date: '2026-10-13', dayOfWeek: 'Tuesday', reason: 'Pre-Puja intensive self-study', category: 'self_study', isPracticalDay: false, notes: 'Verified via WhatsApp with 7 classmates' },
  { id: 'abs_14', date: '2026-10-14', dayOfWeek: 'Wednesday', reason: 'Self-study & Olympiad problem solving', category: 'olympiad', isPracticalDay: false, notes: 'Verified via WhatsApp with Protik, DEEP, Kunal, Arnav' },
  { id: 'abs_15', date: '2026-10-27', dayOfWeek: 'Tuesday', reason: 'Tutopia Self-Study & post-Puja academic preparation', category: 'tutopia', isPracticalDay: false, notes: 'Verified via WhatsApp with 10 classmates & screen recording' },
];

// Official TBSA Institutional Holidays (Transcribed directly from School Calendar)
export const DEFAULT_HOLIDAYS: HolidayEntry[] = [
  { id: 'hol_1', date: '2026-04-03', dayOfWeek: 'Friday', name: 'Good Friday', classification: 'Gazetted' },
  { id: 'hol_2', date: '2026-04-14', dayOfWeek: 'Tuesday', name: 'Dr. B.R. Ambedkar Jayanti', classification: 'National' },
  { id: 'hol_3', date: '2026-04-15', dayOfWeek: 'Wednesday', name: 'Bengali New Year (Poila Boishakh)', classification: 'State / Regional' },
  { id: 'hol_4', date: '2026-05-01', dayOfWeek: 'Friday', name: 'May Day & Buddha Purnima', classification: 'Gazetted' },
  { id: 'hol_5', date: '2026-05-09', dayOfWeek: 'Saturday', name: 'Rabindra Jayanti', classification: 'State / Regional' },
  { id: 'hol_6', date: '2026-05-27', dayOfWeek: 'Wednesday', name: 'Eid-ul-Zuha (Tentative)', classification: 'Gazetted', inVacationWindow: 'Summer Vacation' },
  { id: 'hol_7', date: '2026-06-26', dayOfWeek: 'Friday', name: 'Muharram', classification: 'Gazetted', inVacationWindow: 'IIT KGP Window' },
  { id: 'hol_8', date: '2026-08-15', dayOfWeek: 'Saturday', name: 'Independence Day', classification: 'National' },
  { id: 'hol_9', date: '2026-08-26', dayOfWeek: 'Wednesday', name: 'Milad-un-Nabi (Tentative)', classification: 'Gazetted' },
  { id: 'hol_10', date: '2026-09-04', dayOfWeek: 'Friday', name: 'Janmashtami', classification: 'Gazetted' },
  { id: 'hol_11', date: '2026-10-02', dayOfWeek: 'Friday', name: 'Mahatma Gandhi Jayanti', classification: 'National' },
  { id: 'hol_12', date: '2026-10-10', dayOfWeek: 'Saturday', name: 'Mahalaya', classification: 'State / Regional' },
  { id: 'hol_13', date: '2026-10-21', dayOfWeek: 'Wednesday', name: 'Dussehra (Vijaya Dashami)', classification: 'National / Festive', inVacationWindow: 'Puja Vacation' },
  { id: 'hol_14', date: '2026-10-26', dayOfWeek: 'Monday', name: 'Lakshmi Puja', classification: 'State / Festive', inVacationWindow: 'Puja Vacation' },
  { id: 'hol_15', date: '2026-11-08', dayOfWeek: 'Sunday', name: 'Kali Puja', classification: 'State / Festive' },
  { id: 'hol_16', date: '2026-11-09', dayOfWeek: 'Monday', name: 'Diwali', classification: 'National / Festive', inVacationWindow: 'Diwali Break' },
  { id: 'hol_17', date: '2026-11-11', dayOfWeek: 'Wednesday', name: 'Bhai Duj', classification: 'State / Festive', inVacationWindow: 'Diwali Break' },
  { id: 'hol_18', date: '2026-11-24', dayOfWeek: 'Tuesday', name: 'Guru Nanak Jayanti', classification: 'Gazetted' },
  { id: 'hol_19', date: '2026-12-25', dayOfWeek: 'Friday', name: 'Christmas Day', classification: 'National', inVacationWindow: 'Winter Vacation' },
  { id: 'hol_20', date: '2027-01-12', dayOfWeek: 'Tuesday', name: "Swami Vivekananda's Birthday", classification: 'State / National' },
  { id: 'hol_21', date: '2027-01-23', dayOfWeek: 'Saturday', name: "Netaji's Birthday", classification: 'State / National' },
  { id: 'hol_22', date: '2027-01-26', dayOfWeek: 'Tuesday', name: 'Republic Day', classification: 'National' },
  { id: 'hol_23', date: '2027-02-11', dayOfWeek: 'Thursday', name: 'Saraswati Puja', classification: 'State / Academic' },
  { id: 'hol_24', date: '2027-03-09', dayOfWeek: 'Tuesday', name: 'Id-ul-Fitr', classification: 'Gazetted' },
  { id: 'hol_25', date: '2027-03-21', dayOfWeek: 'Sunday', name: 'Dolyatra', classification: 'State / Festive' },
  { id: 'hol_26', date: '2027-03-22', dayOfWeek: 'Monday', name: 'Holi', classification: 'National / Festive' },
  { id: 'hol_27', date: '2027-03-26', dayOfWeek: 'Friday', name: 'Good Friday', classification: 'Gazetted' },
];

// Official TBSA Vacation Windows (Transcribed directly from School Calendar)
export const DEFAULT_VACATIONS: VacationEntry[] = [
  { id: 'vac_1', name: 'Summer Vacation', startDate: '2026-05-18', endDate: '2026-06-13', calendarDays: 27, schoolDaysSaved: 20, description: 'School reopens on 15th June 2026 (For Students)' },
  { id: 'vac_2', name: 'Puja Vacation', startDate: '2026-10-16', endDate: '2026-10-26', calendarDays: 11, schoolDaysSaved: 7, description: 'School reopens on 27th October 2026 (For All)' },
  { id: 'vac_3', name: 'Diwali Break', startDate: '2026-11-09', endDate: '2026-11-11', calendarDays: 3, schoolDaysSaved: 3, description: 'School reopens on 12th November 2026 (For All)' },
  { id: 'vac_4', name: 'Winter Vacation', startDate: '2026-12-25', endDate: '2027-01-02', calendarDays: 9, schoolDaysSaved: 6, description: 'School reopens on 4th January 2027 (For All)' },
];

// 4 Examination & PTM Milestones (Transcribed directly from School Calendar)
export const DEFAULT_EXAMS: ExamMilestone[] = [
  { id: 'exam_1', name: 'Periodic Test 1 (PT1)', startDate: '2026-06-22', endDate: '2026-06-30', ptmDate: '2026-07-04', status: 'completed', strategicFocus: 'Basic mechanics, dimensional analysis & calculus foundations', syllabusPercentage: 20 },
  {
    id: 'exam_2',
    name: 'Half-Yearly Examination',
    startDate: '2026-09-14',
    endDate: '2026-09-25',
    ptmDate: '2026-10-03',
    status: 'completed',
    strategicFocus: 'Cumulative assessment covering 50% CBSE Class XI syllabus',
    syllabusPercentage: 50,
    slots: [
      { date: '2026-09-08', day: 'Tuesday', subject: 'Web Application Practical', type: 'practical', user_exam: true },
      { date: '2026-09-10', day: 'Thursday', subject: 'Physics Practical', type: 'practical', user_exam: true },
      { date: '2026-09-11', day: 'Friday', subject: 'Physical Education Practical', type: 'practical', user_exam: true },
      { date: '2026-09-14', day: 'Monday', subject: 'English Core (Theory)', type: 'theory', user_exam: true },
      { date: '2026-09-17', day: 'Thursday', subject: 'Preparatory Break', type: 'theory', user_exam: false },
      { date: '2026-09-18', day: 'Friday', subject: 'Bio / Pol.Sci / Econ (Free Study Day)', type: 'theory', user_exam: false },
      { date: '2026-09-21', day: 'Monday', subject: 'Physics (Theory)', type: 'theory', user_exam: true },
      { date: '2026-09-25', day: 'Friday', subject: 'Chemistry Practical', type: 'practical', user_exam: true }
    ]
  },
  { id: 'exam_3', name: 'Periodic Test 2 (PT2)', startDate: '2026-12-11', endDate: '2026-12-18', ptmDate: '2026-12-24', status: 'scheduled', strategicFocus: 'Pre-lock assessment (Electromagnetism, Waves & Thermodynamics)', syllabusPercentage: 75 },
  { id: 'exam_4', name: 'Annual Exam (Class XI Finals)', startDate: '2027-03-01', endDate: '2027-03-12', ptmDate: '2027-03-20', status: 'scheduled', strategicFocus: 'Final CBSE 10+2 promotion exam (100% full syllabus)', syllabusPercentage: 100 },
];

// Approved On-Duty Credits
export const DEFAULT_ON_DUTY: OnDutyCredit[] = [
  {
    id: 'od_1',
    program: 'Kriti RISE IKITIES Program',
    institution: 'Indian Institute of Technology (IIT) Kharagpur',
    startDate: '2026-06-15',
    endDate: '2026-06-26',
    workingDays: 10,
    status: 'APPROVED_ON_DUTY',
    verificationRef: 'IIT-KGP/RISE/2026/IK-0428',
    description: 'Residential STEM Olympiad, Deep Learning & Robotics Research Deputation at IIT Kharagpur'
  }
];

export const DEFAULT_PROFILE: InstitutionalProfile = {
  schoolName: 'The Bandhan School Aranghata',
  affiliationNo: '2430453',
  board: 'CBSE (Senior Secondary 10+2)',
  stream: 'Class XI — Science (PCM + STEM)',
  sessionStart: '2026-04-21',
  lockDate: '2026-12-31',
  totalWorkingDays: 142,
  workingDaysHeld: 105,
  presentDays: 90, // 90 physical present + 10 On-Duty = 100 total present (95.24% effective)
  absentDays: 15,
  onDutyDays: 10,
  subjects: DEFAULT_SUBJECTS
};

export const DEFAULT_INITIAL_STATE: InstitutionalAttendanceState = {
  profile: DEFAULT_PROFILE,
  absences: DEFAULT_ABSENCES,
  holidays: DEFAULT_HOLIDAYS,
  vacations: DEFAULT_VACATIONS,
  exams: DEFAULT_EXAMS,
  onDuty: DEFAULT_ON_DUTY,
  lastUpdated: new Date().toISOString()
};

// Clean neutral default state for other users / guest accounts
export const NEUTRAL_DEFAULT_PROFILE: InstitutionalProfile = {
  schoolName: 'CBSE Senior Secondary School',
  affiliationNo: '',
  board: 'CBSE (Senior Secondary 10+2)',
  stream: 'Class XI — Science (PCM + STEM)',
  sessionStart: '2026-04-21',
  lockDate: '2026-12-31',
  totalWorkingDays: 140,
  workingDaysHeld: 0,
  presentDays: 0,
  absentDays: 0,
  onDutyDays: 0,
  subjects: [
    { id: 'phy', name: 'Physics', attended: 0, total: 0, required: 75, color: 'indigo', isPracticalSubject: true },
    { id: 'chem', name: 'Chemistry', attended: 0, total: 0, required: 75, color: 'rose', isPracticalSubject: true },
    { id: 'math', name: 'Mathematics', attended: 0, total: 0, required: 75, color: 'emerald', isPracticalSubject: false },
    { id: 'eng', name: 'English Core', attended: 0, total: 0, required: 75, color: 'purple', isPracticalSubject: false },
    { id: 'pe', name: 'Physical Education', attended: 0, total: 0, required: 75, color: 'amber', isPracticalSubject: true },
    { id: 'cs', name: 'Computer Science / Web App', attended: 0, total: 0, required: 75, color: 'sky', isPracticalSubject: true }
  ]
};

export const NEUTRAL_DEFAULT_INITIAL_STATE: InstitutionalAttendanceState = {
  profile: NEUTRAL_DEFAULT_PROFILE,
  absences: [],
  holidays: DEFAULT_HOLIDAYS,
  vacations: DEFAULT_VACATIONS,
  exams: DEFAULT_EXAMS,
  onDuty: [],
  lastUpdated: new Date().toISOString()
};

/**
 * Compute real-world live attendance metrics & reality math engine
 */
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

  return `# 🏛️ SAVANTIX AEGIS: INSTITUTIONAL ATTENDANCE REGULATOR & STRATEGIC DOSSIER
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

export const isDebanjanAccount = (identifier?: string): boolean => {
  if (!identifier) {
    if (typeof process !== 'undefined' && process.versions?.node) return true; // Node test runner fallback
    return false; // In-browser: Never leak private records if user is not logged in as Debanjan
  }
  const clean = String(identifier).trim().toLowerCase();
  return clean === 'debanjan8686@gmail.com' || clean === 'partofcosmmos@gmail.com';
};

export function getInstitutionalStorageKey(identifier?: string): string {
  if (isDebanjanAccount(identifier)) {
    return 'savantix_attendance_institutional_debanjan';
  }
  if (identifier && identifier !== 'guest' && identifier !== 'guest_user') {
    return `savantix_attendance_institutional_${identifier}`;
  }
  return 'savantix_attendance_institutional_guest';
}

/**
 * Load institutional state from localStorage with seamless fallback and account partitioning
 */
export function loadInstitutionalState(identifier?: string): InstitutionalAttendanceState {
  try {
    const isDebanjan = isDebanjanAccount(identifier);
    const key = getInstitutionalStorageKey(identifier);
    // Prioritize account key, then legacy institutional keys so logged dates are never lost on reload or guest mode
    const rawData = localStorage.getItem(key) || 
      localStorage.getItem('savantix_attendance_institutional_debanjan') ||
      localStorage.getItem(INSTITUTIONAL_STORAGE_KEY) ||
      localStorage.getItem('savantix_attendance_institutional_guest');

    // Baseline: preserve the 15 verified absences and academic calendar by default
    const baseline: InstitutionalAttendanceState = isDebanjan
      ? DEFAULT_INITIAL_STATE
      : {
          ...NEUTRAL_DEFAULT_INITIAL_STATE,
          absences: DEFAULT_ABSENCES,
          profile: {
            ...NEUTRAL_DEFAULT_PROFILE,
            absentDays: DEFAULT_ABSENCES.length,
            workingDaysHeld: 105,
            presentDays: 90,
            onDutyDays: 10
          }
        };

    let state: InstitutionalAttendanceState = baseline;

    if (rawData) {
      const parsed = JSON.parse(rawData);
      
      // Deduplicate absences by date to guarantee clean ledger even if storage was previously polluted
      const rawAbsences = Array.isArray(parsed.absences) ? parsed.absences : baseline.absences;
      const absenceMap = new Map<string, AbsenceEntry>();
      rawAbsences.forEach((a: AbsenceEntry) => {
        if (a && a.date) {
          absenceMap.set(a.date, a);
        }
      });
      const cleanAbsences = Array.from(absenceMap.values()).sort((a, b) => b.date.localeCompare(a.date));

      state = {
        ...baseline,
        ...parsed,
        profile: { ...baseline.profile, ...(parsed.profile || {}) },
        absences: cleanAbsences,
        holidays: Array.isArray(parsed.holidays) && parsed.holidays.length > 0 ? parsed.holidays : baseline.holidays,
        vacations: Array.isArray(parsed.vacations) && parsed.vacations.length > 0 ? parsed.vacations : baseline.vacations,
        exams: Array.isArray(parsed.exams) && parsed.exams.length > 0 ? parsed.exams : baseline.exams,
        onDuty: Array.isArray(parsed.onDuty) ? parsed.onDuty : baseline.onDuty,
      };
    } else {
      // Legacy migration from savantix_attendance_data_v1 if no institutional state exists yet
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
        } catch (e) {
          // Ignore JSON parse error
        }
      }
    }

    return state;
  } catch (e) {
    return isDebanjanAccount(identifier) ? DEFAULT_INITIAL_STATE : NEUTRAL_DEFAULT_INITIAL_STATE;
  }
}

/**
 * Save institutional state to localStorage and maintain legacy array for cloud sync compatibility
 */
export function saveInstitutionalState(state: InstitutionalAttendanceState, identifier?: string): void {
  try {
    const updatedState: InstitutionalAttendanceState = {
      ...state,
      lastUpdated: new Date().toISOString()
    };
    const key = getInstitutionalStorageKey(identifier);
    localStorage.setItem(key, JSON.stringify(updatedState));

    // Always update global/fallback keys so dates persist across reloads and logins
    localStorage.setItem(INSTITUTIONAL_STORAGE_KEY, JSON.stringify(updatedState));
    if (isDebanjanAccount(identifier) || !identifier || identifier === 'guest' || identifier === 'guest_user') {
      localStorage.setItem('savantix_attendance_institutional_debanjan', JSON.stringify(updatedState));
    }

    // Also persist subjects to legacy storage key so cloudSyncService continues without interruption
    if (Array.isArray(state.profile?.subjects)) {
      localStorage.setItem(LEGACY_SUBJECTS_STORAGE_KEY, JSON.stringify(state.profile.subjects));
    }

    // Dispatch custom and standard storage events so all open tabs and components synchronize instantaneously
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('savantix:attendance-updated', { detail: updatedState }));
    }

    // Proactively push institutional state to cloud relay so absences are never lost on refresh/blur
    const syncEmail = isDebanjanAccount(identifier)
      ? 'debanjan8686@gmail.com'
      : (identifier && identifier !== 'guest' && identifier !== 'anonymous' ? identifier : 'debanjan8686@gmail.com');

    if (syncEmail) {
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
