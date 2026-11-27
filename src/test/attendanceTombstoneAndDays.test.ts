import {
  computeWorkingDaysBetween,
  computeWorkingDaysToToday,
  loadInstitutionalState,
  saveInstitutionalState,
  DEFAULT_HOLIDAYS,
  DEFAULT_VACATIONS,
  DEFAULT_INITIAL_STATE
} from '../services/attendanceRegulatorService';

export async function runAttendanceTombstoneTests(): Promise<boolean> {
  console.log('\nRUNNING SUITE: Attendance Tombstones & Live Working Days Engine');
  let passed = 0;
  let failed = 0;

  const assert = (name: string, cond: boolean, detail = '') => {
    if (cond) {
      console.log(`  PASS ${name}`);
      passed++;
    } else {
      console.error(`  FAIL ${name}${detail ? ': ' + detail : ''}`);
      failed++;
    }
  };

  if (typeof (globalThis as any).localStorage === 'undefined') {
    const store = new Map<string, string>();
    (globalThis as any).localStorage = {
      getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
      setItem: (k: string, v: string) => store.set(k, String(v)),
      removeItem: (k: string) => store.delete(k),
      clear: () => store.clear(),
    };
  }
  localStorage.clear();

  const d4 = computeWorkingDaysBetween('2026-04-21', '2026-04-24', DEFAULT_HOLIDAYS, DEFAULT_VACATIONS);
  assert('4 consecutive weekdays with no holiday', d4 === 4, `got ${d4}`);

  const dHol = computeWorkingDaysBetween('2026-04-27', '2026-05-01', DEFAULT_HOLIDAYS, DEFAULT_VACATIONS);
  assert('Excludes May Day holiday (2026-05-01)', dHol === 4, `got ${dHol}`);

  const novDays = computeWorkingDaysToToday(DEFAULT_INITIAL_STATE, '2026-11-26');
  assert('Computes realistic working days through Nov 26, 2026 (115..160)', novDays >= 115 && novDays <= 160, `got ${novDays}`);

  const email = 'student@example.com';
  const base = loadInstitutionalState(email);
  assert('Fresh account starts with clean empty absences', base.absences.length === 0);

  // Add an absence, then delete it with a tombstone and verify it stays deleted on reload
  saveInstitutionalState(
    {
      ...base,
      absences: [{ id: 'a1', date: '2026-10-27', dayOfWeek: 'Tuesday', reason: 'Sick leave', category: 'medical', isPracticalDay: false }],
      profile: { ...base.profile, workingDaysHeld: 50, presentDays: 49, absentDays: 1 }
    },
    email
  );
  const withAbs = loadInstitutionalState(email);
  assert('Saved absence persists on reload', withAbs.absences.some((a) => a.date === '2026-10-27'));

  saveInstitutionalState(
    {
      ...withAbs,
      absences: [],
      deletedAbsenceDates: ['2026-10-27'],
      profile: { ...withAbs.profile, workingDaysHeld: 50, presentDays: 50, absentDays: 0 }
    },
    email
  );

  const reloaded = loadInstitutionalState(email);
  assert('Deleted absence 2026-10-27 does NOT resurrect on reload', !reloaded.absences.some((a) => a.date === '2026-10-27'));
  assert('deletedAbsenceDates retains tombstone', (reloaded.deletedAbsenceDates || []).includes('2026-10-27'));
  assert('presentDays + absentDays === workingDaysHeld', reloaded.profile.presentDays + reloaded.profile.absentDays === reloaded.profile.workingDaysHeld);

  console.log(`ATTENDANCE TOMBSTONE & DAYS TESTS COMPLETE: ${passed}/${passed + failed} PASSED`);
  return failed === 0;
}
