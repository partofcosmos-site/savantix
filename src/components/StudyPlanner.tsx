import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarDays,
  BookMarked,
  Plus,
  Trash2,
  Clock,
  CheckCircle2,
  Circle,
  RotateCw,
  Sparkles,
} from 'lucide-react';
import clsx from 'clsx';
import { useAppContext } from '../context/AppContext';

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
  timetable: TimetableSlot[];
  syllabus: SyllabusChapter[];
  updatedAt: string;
}

export const PLANNER_STORAGE_KEY = 'savantix_student_planner_v1';

const DAYS: DayKey[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const DEFAULT_PLANNER_STATE: StudentPlannerState = {
  timetable: [
    { id: 'tt_mon_1', day: 'Mon', time: '08:30', subject: 'Physics', note: 'Mechanics & Lab' },
    { id: 'tt_mon_2', day: 'Mon', time: '09:30', subject: 'Mathematics', note: 'Calculus' },
    { id: 'tt_mon_3', day: 'Mon', time: '10:45', subject: 'Chemistry', note: 'Physical Chemistry' },
    { id: 'tt_mon_4', day: 'Mon', time: '12:00', subject: 'English', note: 'Core Literature' },
    { id: 'tt_tue_1', day: 'Tue', time: '08:30', subject: 'Mathematics', note: 'Coordinate Geometry' },
    { id: 'tt_tue_2', day: 'Tue', time: '09:30', subject: 'Physics', note: 'Electromagnetism' },
    { id: 'tt_tue_3', day: 'Tue', time: '10:45', subject: 'Computer Science', note: 'Algorithms & Python' },
    { id: 'tt_wed_1', day: 'Wed', time: '08:30', subject: 'Chemistry', note: 'Organic Chemistry' },
    { id: 'tt_wed_2', day: 'Wed', time: '09:30', subject: 'Mathematics', note: 'Algebra' },
    { id: 'tt_wed_3', day: 'Wed', time: '10:45', subject: 'Physics', note: 'Optics & Waves' },
    { id: 'tt_thu_1', day: 'Thu', time: '08:30', subject: 'Physics', note: 'Problem Solving' },
    { id: 'tt_thu_2', day: 'Thu', time: '09:30', subject: 'Chemistry', note: 'Inorganic Chemistry' },
    { id: 'tt_thu_3', day: 'Thu', time: '10:45', subject: 'Computer Science', note: 'Lab Practice' },
    { id: 'tt_fri_1', day: 'Fri', time: '08:30', subject: 'Mathematics', note: 'Mock Drill' },
    { id: 'tt_fri_2', day: 'Fri', time: '09:30', subject: 'English', note: 'Writing & Grammar' },
    { id: 'tt_fri_3', day: 'Fri', time: '10:45', subject: 'Physics', note: 'Weekly Review' },
  ],
  syllabus: [
    { id: 'syl_p1', subject: 'Physics', title: 'Kinematics & Laws of Motion', status: 'mastered', updatedAt: new Date().toISOString() },
    { id: 'syl_p2', subject: 'Physics', title: 'Work, Energy & Rotational Dynamics', status: 'revised', updatedAt: new Date().toISOString() },
    { id: 'syl_p3', subject: 'Physics', title: 'Electrostatics & Current Electricity', status: 'in_progress', updatedAt: new Date().toISOString() },
    { id: 'syl_p4', subject: 'Physics', title: 'Optics & Modern Physics', status: 'not_started', updatedAt: new Date().toISOString() },
    { id: 'syl_c1', subject: 'Chemistry', title: 'Atomic Structure & Chemical Bonding', status: 'mastered', updatedAt: new Date().toISOString() },
    { id: 'syl_c2', subject: 'Chemistry', title: 'Thermodynamics & Equilibrium', status: 'in_progress', updatedAt: new Date().toISOString() },
    { id: 'syl_c3', subject: 'Chemistry', title: 'Organic Reaction Mechanisms', status: 'not_started', updatedAt: new Date().toISOString() },
    { id: 'syl_m1', subject: 'Mathematics', title: 'Limits, Continuity & Differentiation', status: 'revised', updatedAt: new Date().toISOString() },
    { id: 'syl_m2', subject: 'Mathematics', title: 'Integration & Differential Equations', status: 'in_progress', updatedAt: new Date().toISOString() },
    { id: 'syl_m3', subject: 'Mathematics', title: 'Vectors, 3D Geometry & Probability', status: 'not_started', updatedAt: new Date().toISOString() },
  ],
  updatedAt: new Date().toISOString(),
};

export function loadPlannerState(): StudentPlannerState {
  if (typeof window === 'undefined') return DEFAULT_PLANNER_STATE;
  try {
    const raw = localStorage.getItem(PLANNER_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.timetable) && Array.isArray(parsed.syllabus)) {
        return parsed;
      }
    }
  } catch {}
  return DEFAULT_PLANNER_STATE;
}

export function savePlannerState(state: StudentPlannerState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PLANNER_STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

const STATUS_META: Record<
  ChapterStatus,
  { label: string; next: ChapterStatus; badgeClass: string; weight: number }
> = {
  not_started: {
    label: 'Not started',
    next: 'in_progress',
    badgeClass: 'bg-[var(--sx-surface-2)] text-[var(--sx-ink-muted)] border-[var(--sx-hairline)]',
    weight: 0,
  },
  in_progress: {
    label: 'In progress',
    next: 'revised',
    badgeClass: 'bg-[#2374e1]/15 text-[#4599ff] border-[#2374e1]/30',
    weight: 0.35,
  },
  revised: {
    label: 'Revised',
    next: 'mastered',
    badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    weight: 0.75,
  },
  mastered: {
    label: 'Mastered',
    next: 'not_started',
    badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    weight: 1,
  },
};

function getTodayKey(): DayKey {
  const idx = new Date().getDay(); // 0=Sun, 1=Mon...6=Sat
  const map: Record<number, DayKey> = { 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat' };
  return map[idx] || 'Mon';
}

export const StudyPlanner: React.FC = () => {
  const { forceSyncNow } = useAppContext();
  const [view, setView] = useState<'timetable' | 'syllabus'>('timetable');
  const [planner, setPlanner] = useState<StudentPlannerState>(() => loadPlannerState());
  const [selectedDay, setSelectedDay] = useState<DayKey>(() => getTodayKey());

  // Timetable add form
  const [newTime, setNewTime] = useState('08:30');
  const [newSubject, setNewSubject] = useState('');
  const [newNote, setNewNote] = useState('');

  // Syllabus add form
  const [selectedSubjFilter, setSelectedSubjFilter] = useState<string>('All');
  const [chapSubject, setChapSubject] = useState('Physics');
  const [chapTitle, setChapTitle] = useState('');

  // Re-hydrate if cloud sync updates localStorage
  useEffect(() => {
    const onSync = () => setPlanner(loadPlannerState());
    window.addEventListener('savantix:planner-updated', onSync);
    return () => window.removeEventListener('savantix:planner-updated', onSync);
  }, []);

  const persistAndSync = (next: StudentPlannerState) => {
    const stamped = { ...next, updatedAt: new Date().toISOString() };
    setPlanner(stamped);
    savePlannerState(stamped);
    setTimeout(() => {
      try {
        forceSyncNow();
      } catch {}
    }, 300);
  };

  const todayKey = getTodayKey();
  const daySlots = useMemo(
    () =>
      planner.timetable
        .filter((s) => s.day === selectedDay)
        .sort((a, b) => a.time.localeCompare(b.time)),
    [planner.timetable, selectedDay]
  );

  const handleAddSlot = (e: React.FormEvent) => {
    e.preventDefault();
    const subj = newSubject.trim();
    if (!subj) return;
    const slot: TimetableSlot = {
      id: `tt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      day: selectedDay,
      time: newTime || '09:00',
      subject: subj,
      note: newNote.trim() || undefined,
    };
    persistAndSync({ ...planner, timetable: [...planner.timetable, slot] });
    setNewSubject('');
    setNewNote('');
  };

  const handleDeleteSlot = (id: string) => {
    persistAndSync({
      ...planner,
      timetable: planner.timetable.filter((s) => s.id !== id),
    });
  };

  const subjects = useMemo(() => {
    const set = new Set<string>(['Physics', 'Chemistry', 'Mathematics', 'Computer Science', 'English']);
    planner.syllabus.forEach((c) => set.add(c.subject));
    return Array.from(set);
  }, [planner.syllabus]);

  const filteredChapters = useMemo(() => {
    if (selectedSubjFilter === 'All') return planner.syllabus;
    return planner.syllabus.filter((c) => c.subject === selectedSubjFilter);
  }, [planner.syllabus, selectedSubjFilter]);

  const syllabusStats = useMemo(() => {
    const total = planner.syllabus.length;
    if (!total) return { total: 0, mastered: 0, revised: 0, inProgress: 0, pct: 0 };
    let score = 0;
    let mastered = 0;
    let revised = 0;
    let inProgress = 0;
    for (const c of planner.syllabus) {
      const m = STATUS_META[c.status] || STATUS_META.not_started;
      score += m.weight;
      if (c.status === 'mastered') mastered++;
      else if (c.status === 'revised') revised++;
      else if (c.status === 'in_progress') inProgress++;
    }
    return {
      total,
      mastered,
      revised,
      inProgress,
      pct: Math.round((score / total) * 100),
    };
  }, [planner.syllabus]);

  const handleCycleStatus = (id: string) => {
    const nextList = planner.syllabus.map((c) => {
      if (c.id !== id) return c;
      const nextStatus = (STATUS_META[c.status] || STATUS_META.not_started).next;
      return { ...c, status: nextStatus, updatedAt: new Date().toISOString() };
    });
    persistAndSync({ ...planner, syllabus: nextList });
  };

  const handleAddChapter = (e: React.FormEvent) => {
    e.preventDefault();
    const title = chapTitle.trim();
    const subj = chapSubject.trim() || 'General';
    if (!title) return;
    const item: SyllabusChapter = {
      id: `syl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      subject: subj,
      title,
      status: 'not_started',
      updatedAt: new Date().toISOString(),
    };
    persistAndSync({ ...planner, syllabus: [...planner.syllabus, item] });
    setChapTitle('');
  };

  const handleDeleteChapter = (id: string) => {
    persistAndSync({
      ...planner,
      syllabus: planner.syllabus.filter((c) => c.id !== id),
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--sx-ink)]">
            Study Planner
          </h1>
          <p className="text-sm text-[var(--sx-ink-secondary)] mt-0.5">
            Your weekly class timetable and chapter-by-chapter syllabus progress, synced to your account.
          </p>
        </div>

        <div className="inline-flex rounded-lg bg-[var(--sx-surface)] border border-[var(--sx-hairline)] p-1 self-start">
          <button
            type="button"
            onClick={() => setView('timetable')}
            className={clsx(
              'flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer',
              view === 'timetable'
                ? 'bg-[var(--sx-accent)] text-white'
                : 'text-[var(--sx-ink-secondary)] hover:text-[var(--sx-ink)]'
            )}
          >
            <CalendarDays className="w-4 h-4" />
            Timetable
          </button>
          <button
            type="button"
            onClick={() => setView('syllabus')}
            className={clsx(
              'flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer',
              view === 'syllabus'
                ? 'bg-[var(--sx-accent)] text-white'
                : 'text-[var(--sx-ink-secondary)] hover:text-[var(--sx-ink)]'
            )}
          >
            <BookMarked className="w-4 h-4" />
            Syllabus ({syllabusStats.pct}%)
          </button>
        </div>
      </div>

      {view === 'timetable' ? (
        <div className="space-y-5">
          {/* Day selector */}
          <div className="flex flex-wrap gap-2">
            {DAYS.map((day) => {
              const count = planner.timetable.filter((s) => s.day === day).length;
              const isToday = day === todayKey;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={clsx(
                    'px-3.5 py-2 rounded-lg text-sm font-medium border transition-colors cursor-pointer flex items-center gap-2',
                    selectedDay === day
                      ? 'bg-[var(--sx-accent)] text-white border-[var(--sx-accent)]'
                      : 'bg-[var(--sx-surface)] text-[var(--sx-ink-secondary)] border-[var(--sx-hairline)] hover:text-[var(--sx-ink)]'
                  )}
                >
                  <span>{day}</span>
                  {isToday && (
                    <span
                      className={clsx(
                        'text-[11px] px-1.5 py-0.2 rounded-full',
                        selectedDay === day ? 'bg-white/20 text-white' : 'bg-[var(--sx-accent)]/15 text-[var(--sx-accent)]'
                      )}
                    >
                      Today
                    </span>
                  )}
                  <span className="text-xs opacity-70">{count}</span>
                </button>
              );
            })}
          </div>

          {/* Add Class Form */}
          <form
            onSubmit={handleAddSlot}
            className="bg-[var(--sx-surface)] border border-[var(--sx-hairline)] rounded-xl p-4 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
          >
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[var(--sx-ink-secondary)] mb-1">
                Time
              </label>
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[var(--sx-canvas)] border border-[var(--sx-hairline)] text-sm text-[var(--sx-ink)] focus:outline-none focus:border-[var(--sx-accent)]"
              />
            </div>
            <div className="sm:col-span-4">
              <label className="block text-xs font-medium text-[var(--sx-ink-secondary)] mb-1">
                Subject
              </label>
              <input
                type="text"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                placeholder="e.g. Physics, Maths, Lab"
                className="w-full px-3 py-2 rounded-lg bg-[var(--sx-canvas)] border border-[var(--sx-hairline)] text-sm text-[var(--sx-ink)] focus:outline-none focus:border-[var(--sx-accent)]"
              />
            </div>
            <div className="sm:col-span-4">
              <label className="block text-xs font-medium text-[var(--sx-ink-secondary)] mb-1">
                Topic or Room (optional)
              </label>
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="e.g. Room 204, Optics Practical"
                className="w-full px-3 py-2 rounded-lg bg-[var(--sx-canvas)] border border-[var(--sx-hairline)] text-sm text-[var(--sx-ink)] focus:outline-none focus:border-[var(--sx-accent)]"
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--sx-accent)] hover:opacity-90 text-white text-sm font-semibold transition-opacity cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
          </form>

          {/* Schedule list */}
          <div className="bg-[var(--sx-surface)] border border-[var(--sx-hairline)] rounded-xl divide-y divide-[var(--sx-hairline)]">
            {daySlots.length === 0 ? (
              <div className="p-8 text-center text-sm text-[var(--sx-ink-muted)]">
                No classes scheduled for {selectedDay}. Add a period above to build your timetable.
              </div>
            ) : (
              daySlots.map((slot) => (
                <div
                  key={slot.id}
                  className="flex items-center justify-between gap-4 px-4 py-3.5 hover:bg-[var(--sx-hover)] transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-[var(--sx-accent)] w-20 shrink-0 tabular-nums">
                      <Clock className="w-3.5 h-3.5" />
                      {slot.time}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-[var(--sx-ink)] truncate">
                        {slot.subject}
                      </div>
                      {slot.note && (
                        <div className="text-xs text-[var(--sx-ink-secondary)] truncate">
                          {slot.note}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteSlot(slot.id)}
                    aria-label={`Remove ${slot.subject}`}
                    className="p-1.5 rounded-md text-[var(--sx-ink-muted)] hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Syllabus Readiness Summary */}
          <div className="bg-[var(--sx-surface)] border border-[var(--sx-hairline)] rounded-xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div>
                <div className="text-sm font-medium text-[var(--sx-ink-secondary)]">
                  Overall Syllabus Readiness
                </div>
                <div className="text-2xl font-bold text-[var(--sx-ink)] mt-0.5">
                  {syllabusStats.pct}%
                  <span className="text-sm font-normal text-[var(--sx-ink-secondary)] ml-2">
                    {syllabusStats.mastered} mastered · {syllabusStats.revised} revised · {syllabusStats.inProgress} in progress · {syllabusStats.total} total
                  </span>
                </div>
              </div>
              <div className="text-xs text-[var(--sx-ink-muted)]">
                Click any chapter status pill to advance it
              </div>
            </div>
            <div className="h-2.5 w-full rounded-full bg-[var(--sx-canvas)] overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--sx-accent)] transition-all duration-300"
                style={{ width: `${syllabusStats.pct}%` }}
              />
            </div>
          </div>

          {/* Subject Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {['All', ...subjects].map((subj) => (
              <button
                key={subj}
                type="button"
                onClick={() => setSelectedSubjFilter(subj)}
                className={clsx(
                  'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer',
                  selectedSubjFilter === subj
                    ? 'bg-[var(--sx-accent)] text-white border-[var(--sx-accent)]'
                    : 'bg-[var(--sx-surface)] text-[var(--sx-ink-secondary)] border-[var(--sx-hairline)] hover:text-[var(--sx-ink)]'
                )}
              >
                {subj}
              </button>
            ))}
          </div>

          {/* Add Chapter Form */}
          <form
            onSubmit={handleAddChapter}
            className="bg-[var(--sx-surface)] border border-[var(--sx-hairline)] rounded-xl p-4 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
          >
            <div className="sm:col-span-3">
              <label className="block text-xs font-medium text-[var(--sx-ink-secondary)] mb-1">
                Subject
              </label>
              <input
                type="text"
                list="savantix-subjects"
                value={chapSubject}
                onChange={(e) => setChapSubject(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[var(--sx-canvas)] border border-[var(--sx-hairline)] text-sm text-[var(--sx-ink)] focus:outline-none focus:border-[var(--sx-accent)]"
              />
              <datalist id="savantix-subjects">
                {subjects.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
            <div className="sm:col-span-7">
              <label className="block text-xs font-medium text-[var(--sx-ink-secondary)] mb-1">
                Chapter or Topic
              </label>
              <input
                type="text"
                value={chapTitle}
                onChange={(e) => setChapTitle(e.target.value)}
                placeholder="e.g. Electromagnetic Induction, Matrices & Determinants"
                className="w-full px-3 py-2 rounded-lg bg-[var(--sx-canvas)] border border-[var(--sx-hairline)] text-sm text-[var(--sx-ink)] focus:outline-none focus:border-[var(--sx-accent)]"
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--sx-accent)] hover:opacity-90 text-white text-sm font-semibold transition-opacity cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
          </form>

          {/* Chapters List */}
          <div className="bg-[var(--sx-surface)] border border-[var(--sx-hairline)] rounded-xl divide-y divide-[var(--sx-hairline)]">
            {filteredChapters.length === 0 ? (
              <div className="p-8 text-center text-sm text-[var(--sx-ink-muted)]">
                No chapters added yet for {selectedSubjFilter}.
              </div>
            ) : (
              filteredChapters.map((chap) => {
                const meta = STATUS_META[chap.status] || STATUS_META.not_started;
                return (
                  <div
                    key={chap.id}
                    className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-[var(--sx-hover)] transition-colors"
                  >
                    <div className="min-w-0 flex items-center gap-3">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[var(--sx-canvas)] border border-[var(--sx-hairline)] text-[var(--sx-ink-secondary)] shrink-0">
                        {chap.subject}
                      </span>
                      <span className="text-sm font-medium text-[var(--sx-ink)] truncate">
                        {chap.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCycleStatus(chap.id)}
                        className={clsx(
                          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors cursor-pointer',
                          meta.badgeClass
                        )}
                        title="Click to update chapter status"
                      >
                        {chap.status === 'mastered' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {chap.status === 'revised' && <Sparkles className="w-3.5 h-3.5" />}
                        {chap.status === 'in_progress' && <RotateCw className="w-3.5 h-3.5" />}
                        {chap.status === 'not_started' && <Circle className="w-3.5 h-3.5" />}
                        {meta.label}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteChapter(chap.id)}
                        aria-label={`Delete ${chap.title}`}
                        className="p-1.5 rounded-md text-[var(--sx-ink-muted)] hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
