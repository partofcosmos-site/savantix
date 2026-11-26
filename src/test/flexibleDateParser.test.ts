import { parseFlexibleAbsenceDates } from '../utils/dateParser';

export async function runFlexibleDateParserTests(): Promise<boolean> {
  console.log('\nRUNNING SUITE: Flexible Absence Date Parser');
  let passed = 0;
  let failed = 0;

  const assertEq = (name: string, actual: string[], expected: string[]) => {
    const ok = JSON.stringify(actual) === JSON.stringify(expected);
    if (ok) {
      console.log(`  PASS ${name}`);
      passed++;
    } else {
      console.error(`  FAIL ${name}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
      failed++;
    }
  };

  assertEq('ISO dates', parseFlexibleAbsenceDates('2026-11-04, 2026-11-12'), ['2026-11-04', '2026-11-12']);
  assertEq('Indian DD/MM/YYYY & DD-MM-YYYY', parseFlexibleAbsenceDates('14/11/2026 and 05-11-2026'), ['2026-11-05', '2026-11-14']);
  assertEq('Natural month names', parseFlexibleAbsenceDates('12 Nov 2026\nNovember 18, 2026'), ['2026-11-12', '2026-11-18']);
  assertEq('Mixed formats with deduplication', parseFlexibleAbsenceDates('2026-11-12, 12/11/2026, Nov 12 2026'), ['2026-11-12']);
  assertEq('Rejects impossible calendar dates', parseFlexibleAbsenceDates('31/02/2026, 2026-04-31, 2026-11-20'), ['2026-11-20']);

  console.log(`FLEXIBLE DATE PARSER TESTS COMPLETE: ${passed}/${passed + failed} PASSED`);
  return failed === 0;
}
