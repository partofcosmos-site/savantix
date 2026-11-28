import assert from 'node:assert';
import {
  validateWorkspacePatch,
  applyPatchToPlannerState,
  extractJsonFromLLMText,
} from '../utils/workspacePatchValidator';
import { createBlankPlannerState } from '../components/StudyPlanner';

console.log('=== Running AI Workspace Patch Validator & Isolation Tests ===');

// 1. Fresh user starts completely blank & simple
const blank = createBlankPlannerState(5);
assert.strictEqual(blank.schoolDaysPerWeek, 5);
assert.strictEqual(blank.simpleMode, true);
assert.strictEqual(blank.timetable.length, 0);
assert.strictEqual(blank.syllabus.length, 0);
console.log('PASS 1: Fresh account starts blank & simple (zero hardcoded slots/chapters)');

// 2. Markdown-fenced JSON from Llama 3.3 70B parses cleanly
const fenced = '```json\n{"summary":"5-day Science","schoolDaysPerWeek":5,"timetable":[{"day":"Mon","time":"8:30","subject":"Physics"},{"day":"Sat","time":"9:00","subject":"Extra"}]}\n```';
const extracted = extractJsonFromLLMText(fenced);
assert.ok(extracted && extracted.schoolDaysPerWeek === 5);
const res5 = validateWorkspacePatch(fenced);
assert.strictEqual(res5.ok, true);
assert.strictEqual(res5.patch?.timetable?.length, 1, 'Saturday must be stripped in 5-day mode');
assert.strictEqual(res5.patch?.timetable?.[0].time, '08:30', 'Time normalized to HH:MM');
assert.ok(res5.warnings.length >= 1, 'Warning emitted when Sat stripped');
console.log('PASS 2: 5-day mode strips Sat slots & normalizes time');

// 3. 6-day mode allows Saturday slots
const res6 = validateWorkspacePatch({
  summary: '6-day college week',
  schoolDaysPerWeek: 6,
  timetable: [{ day: 'Saturday', time: '10:00', subject: 'Algorithms' }],
});
assert.strictEqual(res6.ok, true);
assert.strictEqual(res6.patch?.timetable?.length, 1);
assert.strictEqual(res6.patch?.timetable?.[0].day, 'Sat');
console.log('PASS 3: 6-day mode accepts Saturday slots');

// 4. Prompt-injection / XSS characters stripped
const inj = validateWorkspacePatch({
  summary: '<script>alert(1)</script>Clean setup',
  syllabus: [{ subject: 'Physics', title: '<b>Optics</b>', status: 'revised' }],
});
assert.strictEqual(inj.ok, true);
assert.ok(!inj.patch?.summary.includes('<'));
assert.ok(!inj.patch?.syllabus?.[0].title.includes('<'));
console.log('PASS 4: Angle brackets & control chars stripped');

// 5. Merge vs Replace behavior
const applied1 = applyPatchToPlannerState(blank, res5.patch!, 'merge');
assert.strictEqual(applied1.timetable.length, 1);
const resAdd = validateWorkspacePatch({
  summary: 'Add Maths',
  timetable: [
    { day: 'Mon', time: '08:30', subject: 'Physics' }, // duplicate
    { day: 'Tue', time: '09:30', subject: 'Mathematics' },
  ],
});
const merged = applyPatchToPlannerState(applied1, resAdd.patch!, 'merge');
assert.strictEqual(merged.timetable.length, 2, 'Merge deduplicates existing slot and adds new');
const replaced = applyPatchToPlannerState(merged, resAdd.patch!, 'replace');
assert.strictEqual(replaced.timetable.length, 2);
console.log('PASS 5: Merge deduplication & Replace mode verified');

// 6. Invalid / empty LLM output rejected safely
const bad = validateWorkspacePatch('Sorry, I cannot help with that.');
assert.strictEqual(bad.ok, false);
assert.ok(bad.error && bad.error.length > 0);
console.log('PASS 6: Invalid LLM output safely rejected');

console.log('ALL 6 AI WORKSPACE VALIDATOR TESTS PASSED!');
