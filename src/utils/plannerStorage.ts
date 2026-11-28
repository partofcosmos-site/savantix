export type DayKey = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat';
export type ChapterStatus = 'not_started' | 'in_progress' | 'revised' | 'mastered';

export interface TimetableSlot {
  id: string;
  day: DayKey;
  time: string;
  subject: string;
  note?: string;
}

export interface SyllabusChapter {
  id: string;
  subject: string;
  title: string;
  status: ChapterStatus;
  updatedAt: string;
}

export interface StudentPlannerState {
  schoolDaysPerWeek: 5 | 6;
  simpleMode?: boolean;
  timetable: TimetableSlot[];
  syllabus: SyllabusChapter[];
  updatedAt: string;
}

export const PLANNER_STORAGE_KEY = 'savantix_student_planner_v1';

/**
 * Fresh accounts always start completely clean and simple — zero pre-stuffed subjects
 * or hardcoded timetables.
 */
export function createBlankPlannerState(schoolDaysPerWeek: 5 | 6 = 5): StudentPlannerState {
  return {
    schoolDaysPerWeek,
    simpleMode: true,
    timetable: [],
    syllabus: [],
    updatedAt: new Date().toISOString(),
  };
}

export function loadPlannerState(): StudentPlannerState {
  if (typeof window === 'undefined') return createBlankPlannerState(5);
  try {
    const raw = localStorage.getItem(PLANNER_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.timetable) && Array.isArray(parsed.syllabus)) {
        return {
          schoolDaysPerWeek: parsed.schoolDaysPerWeek === 6 ? 6 : 5,
          simpleMode: typeof parsed.simpleMode === 'boolean' ? parsed.simpleMode : false,
          timetable: parsed.timetable,
          syllabus: parsed.syllabus,
          updatedAt: parsed.updatedAt || new Date().toISOString(),
        };
      }
    }
  } catch {}
  return createBlankPlannerState(5);
}

export function savePlannerState(state: StudentPlannerState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PLANNER_STORAGE_KEY, JSON.stringify(state));
  } catch {}
}
