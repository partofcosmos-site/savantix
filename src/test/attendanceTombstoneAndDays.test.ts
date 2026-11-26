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

  // Ensure localStorage exists in Node test runtime
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
  assert('Computes realistic TBSA working days through Nov 26, 2026 (115..145)', novDays >= 115 && novDays <= 145, `got ${novDays}`);

  const email = 'partofcosmmos@gmail.com';
  const initial = loadInstitutionalState(email);
  assert('Owner initial state contains 2026-10-27', initial.absences.some((a) => a.date === '2026-10-27'));

  const remaining = initial.absences.filter((a) => a.date !== '2026-10-27');
  saveInstitutionalState(
    {
      ...initial,
      absences: remaining,
      deletedAbsenceDates: ['2026-10-27'],
      profile: {
        ...initial.profile,
        absentDays: remaining.length,
        presentDays: initial.profile.workingDaysHeld - remaining.length
      }
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
