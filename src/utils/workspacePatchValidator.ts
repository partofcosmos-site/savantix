/**
 * @file workspacePatchValidator.ts
 * @description
 * Deterministic validation, sanitization, and diff-preview builder for AI-generated
 * Savantix workspace customization patches. Never trusts raw LLM output (OWASP LLM01/LLM06).
 */

import type { DayKey, ChapterStatus, TimetableSlot, SyllabusChapter, StudentPlannerState } from '../utils/plannerStorage';

export interface ProposedGoal {
  title: string;
  subject: string;
  targetHours: number;
}

export interface WorkspacePatch {
  summary: string;
  schoolDaysPerWeek?: 5 | 6;
  simpleMode?: boolean;
  timetable?: Array<{
    day: DayKey;
    time: string;
    subject: string;
    note?: string;
  }>;
  syllabus?: Array<{
    subject: string;
    title: string;
    status: ChapterStatus;
  }>;
  goals?: ProposedGoal[];
}

export interface ValidationResult {
  ok: boolean;
  patch?: WorkspacePatch;
  warnings: string[];
  error?: string;
}

const VALID_DAYS_5 = new Set<DayKey>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
const VALID_DAYS_6 = new Set<DayKey>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
const VALID_STATUS = new Set<ChapterStatus>(['not_started', 'in_progress', 'revised', 'mastered']);

const DAY_ALIASES: Record<string, DayKey> = {
  mon: 'Mon', monday: 'Mon',
  tue: 'Tue', tues: 'Tue', tuesday: 'Tue',
  wed: 'Wed', wednesday: 'Wed',
  thu: 'Thu', thur: 'Thu', thurs: 'Thu', thursday: 'Thu',
  fri: 'Fri', friday: 'Fri',
  sat: 'Sat', saturday: 'Sat',
};

function sanitizeText(raw: unknown, maxLen: number): string {
  if (typeof raw !== 'string') return '';
  // Strip control characters and angle brackets to prevent injection
  return raw.replace(/[\x00-\x1F\x7F<>]/g, '').trim().slice(0, maxLen);
}

function normalizeTime(raw: unknown): string {
  const s = String(raw || '').trim();
  const m = s.match(/^(\d{1,2}):(\d{2})/);
  if (m) {
    const hh = Math.min(23, Math.max(0, parseInt(m[1], 10)));
    const mm = Math.min(59, Math.max(0, parseInt(m[2], 10)));
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  }
  return '09:00';
}

function normalizeDay(raw: unknown): DayKey | null {
  const k = String(raw || '').trim().toLowerCase();
  return DAY_ALIASES[k] || null;
}

export function extractJsonFromLLMText(rawText: string): any | null {
  if (!rawText || typeof rawText !== 'string') return null;
  const cleaned = rawText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {}

  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end > start) {
    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch {}
  }
  return null;
}

export function validateWorkspacePatch(rawInput: any): ValidationResult {
  const warnings: string[] = [];
  let obj = rawInput;

  if (typeof rawInput === 'string') {
    obj = extractJsonFromLLMText(rawInput);
  }

  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return {
      ok: false,
      warnings,
      error: 'The AI response did not contain a valid JSON customization plan. Try rephrasing your request.',
    };
  }

  const patch: WorkspacePatch = {
    summary: sanitizeText(obj.summary, 240) || 'Custom workspace update ready to preview.',
  };

  if (obj.schoolDaysPerWeek === 5 || obj.schoolDaysPerWeek === 6) {
    patch.schoolDaysPerWeek = obj.schoolDaysPerWeek;
  } else if (obj.schoolDaysPerWeek !== undefined) {
    const n = Number(obj.schoolDaysPerWeek);
    if (n === 5 || n === 6) {
      patch.schoolDaysPerWeek = n;
    } else {
      warnings.push('Ignored unsupported school week length (only 5-day or 6-day supported).');
    }
  }

  if (typeof obj.simpleMode === 'boolean') {
    patch.simpleMode = obj.simpleMode;
  }

  const allowedDays = patch.schoolDaysPerWeek === 6 ? VALID_DAYS_6 : VALID_DAYS_5;

  if (Array.isArray(obj.timetable)) {
    const cleanSlots: NonNullable<WorkspacePatch['timetable']> = [];
    const seen = new Set<string>();
    for (const item of obj.timetable.slice(0, 60)) {
      if (!item || typeof item !== 'object') continue;
      const day = normalizeDay(item.day);
      if (!day) continue;
      if (!allowedDays.has(day)) {
        warnings.push(`Skipped ${day} slot because school week is set to ${patch.schoolDaysPerWeek || 5} days.`);
        continue;
      }
      const subject = sanitizeText(item.subject, 60);
      if (!subject) continue;
      const time = normalizeTime(item.time);
      const note = sanitizeText(item.note, 80) || undefined;
      const sig = `${day}|${time}|${subject.toLowerCase()}`;
      if (seen.has(sig)) continue;
      seen.add(sig);
      cleanSlots.push({ day, time, subject, note });
    }
    if (cleanSlots.length > 0) patch.timetable = cleanSlots;
  }

  if (Array.isArray(obj.syllabus)) {
    const cleanSyllabus: NonNullable<WorkspacePatch['syllabus']> = [];
    const seen = new Set<string>();
    for (const item of obj.syllabus.slice(0, 80)) {
      if (!item || typeof item !== 'object') continue;
      const subject = sanitizeText(item.subject, 50) || 'General';
      const title = sanitizeText(item.title, 100);
      if (!title) continue;
      const rawStatus = String(item.status || 'not_started').toLowerCase() as ChapterStatus;
      const status: ChapterStatus = VALID_STATUS.has(rawStatus) ? rawStatus : 'not_started';
      const sig = `${subject.toLowerCase()}|${title.toLowerCase()}`;
      if (seen.has(sig)) continue;
      seen.add(sig);
      cleanSyllabus.push({ subject, title, status });
    }
    if (cleanSyllabus.length > 0) patch.syllabus = cleanSyllabus;
  }

  if (Array.isArray(obj.goals)) {
    const cleanGoals: ProposedGoal[] = [];
    for (const item of obj.goals.slice(0, 12)) {
      if (!item || typeof item !== 'object') continue;
      const title = sanitizeText(item.title, 90);
      if (!title) continue;
      const subject = sanitizeText(item.subject, 40) || 'General';
      const targetHours = Math.min(200, Math.max(1, Math.round(Number(item.targetHours) || 10)));
      cleanGoals.push({ title, subject, targetHours });
    }
    if (cleanGoals.length > 0) patch.goals = cleanGoals;
  }

  const hasChanges =
    patch.schoolDaysPerWeek !== undefined ||
    patch.simpleMode !== undefined ||
    (patch.timetable && patch.timetable.length > 0) ||
    (patch.syllabus && patch.syllabus.length > 0) ||
    (patch.goals && patch.goals.length > 0);

  if (!hasChanges) {
    return {
      ok: false,
      warnings,
      error: 'No actionable workspace changes were found. Try mentioning your subjects, school days (5-day or 6-day), or timetable.',
    };
  }

  return { ok: true, patch, warnings };
}

export function applyPatchToPlannerState(
  current: StudentPlannerState,
  patch: WorkspacePatch,
  mode: 'merge' | 'replace'
): StudentPlannerState {
  const now = new Date().toISOString();
  const nextWeekDays = patch.schoolDaysPerWeek ?? current.schoolDaysPerWeek ?? 5;
  const nextSimpleMode = patch.simpleMode ?? current.simpleMode ?? false;

  // Build timetable
  let nextTimetable: TimetableSlot[] = mode === 'replace' && patch.timetable ? [] : [...current.timetable];
  if (nextWeekDays === 5) {
    nextTimetable = nextTimetable.filter((s) => s.day !== 'Sat');
  }
  if (patch.timetable && patch.timetable.length > 0) {
    const existingSigs = new Set(nextTimetable.map((s) => `${s.day}|${s.time}|${s.subject.toLowerCase()}`));
    patch.timetable.forEach((slot, idx) => {
      const sig = `${slot.day}|${slot.time}|${slot.subject.toLowerCase()}`;
      if (!existingSigs.has(sig)) {
        existingSigs.add(sig);
        nextTimetable.push({
          id: `tt_ai_${Date.now()}_${idx}`,
          day: slot.day,
          time: slot.time,
          subject: slot.subject,
          note: slot.note,
        });
      }
    });
  }

  // Build syllabus
  let nextSyllabus: SyllabusChapter[] = mode === 'replace' && patch.syllabus ? [] : [...current.syllabus];
  if (patch.syllabus && patch.syllabus.length > 0) {
    const existingSigs = new Set(nextSyllabus.map((c) => `${c.subject.toLowerCase()}|${c.title.toLowerCase()}`));
    patch.syllabus.forEach((chap, idx) => {
      const sig = `${chap.subject.toLowerCase()}|${chap.title.toLowerCase()}`;
      if (!existingSigs.has(sig)) {
        existingSigs.add(sig);
        nextSyllabus.push({
          id: `syl_ai_${Date.now()}_${idx}`,
          subject: chap.subject,
          title: chap.title,
          status: chap.status,
          updatedAt: now,
        });
      }
    });
  }

  return {
    schoolDaysPerWeek: nextWeekDays,
    simpleMode: nextSimpleMode,
    timetable: nextTimetable,
    syllabus: nextSyllabus,
    updatedAt: now,
  };
}
