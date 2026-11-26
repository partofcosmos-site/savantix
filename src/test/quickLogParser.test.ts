import { parseQuickStudyLog } from '../utils/quickLogParser';

export async function runQuickLogParserTests(): Promise<boolean> {
  console.log('\nRUNNING SUITE: Natural-Language Quick Study Log Parser');
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

  const r1 = parseQuickStudyLog('45m physics optics 15q 85%');
  assert('Parses duration, subject, topic, problems, accuracy',
    r1?.durationMinutes === 45 &&
    r1?.subject === 'Physics' &&
    r1?.topic === 'Optics' &&
    r1?.problemsSolved === 15 &&
    r1?.accuracyPercent === 85,
    JSON.stringify(r1)
  );

  const r2 = parseQuickStudyLog('1.5h math rotational calculus 20 problems');
  assert('Parses decimal hours & problems word',
    r2?.durationMinutes === 90 &&
    r2?.subject === 'Mathematics' &&
    r2?.problemsSolved === 20,
    JSON.stringify(r2)
  );

  const r3 = parseQuickStudyLog('1h 20m chem thermodynamics');
  assert('Parses combined hours and minutes',
    r3?.durationMinutes === 80 &&
    r3?.subject === 'Chemistry' &&
    r3?.topic === 'Thermodynamics',
    JSON.stringify(r3)
  );

  assert('Rejects empty input', parseQuickStudyLog('   ') === null);

  console.log(`QUICK LOG PARSER TESTS COMPLETE: ${passed}/${passed + failed} PASSED`);
  return failed === 0;
}
