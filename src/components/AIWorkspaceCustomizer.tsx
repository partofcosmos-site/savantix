import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Check,
  RotateCcw,
  CalendarDays,
  BookMarked,
  Target,
  AlertTriangle,
  Loader2,
  Wand2,
} from 'lucide-react';
import clsx from 'clsx';
import {
  validateWorkspacePatch,
  applyPatchToPlannerState,
  WorkspacePatch,
} from '../utils/workspacePatchValidator';
import {
  loadPlannerState,
  savePlannerState,
  StudentPlannerState,
} from '../utils/plannerStorage';
import { useAppContext } from '../context/AppContext';

interface AIWorkspaceCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
  onApplied?: (next: StudentPlannerState) => void;
}

const ROLLBACK_KEY = 'savantix_planner_ai_rollback_v1';

const SYSTEM_PROMPT = `You are Savantix Workspace Customizer.
Your job is to understand what a student desires for their study workspace and return ONLY a valid JSON object (no markdown fences, no commentary outside JSON) that configures their Savantix workspace.

Exact JSON schema:
{
  "summary": "Short 1-sentence human explanation of what this setup creates",
  "schoolDaysPerWeek": 5 or 6,
  "simpleMode": true or false,
  "timetable": [
    { "day": "Mon"|"Tue"|"Wed"|"Thu"|"Fri"|"Sat", "time": "HH:MM", "subject": "Subject Name", "note": "Optional short topic/room" }
  ],
  "syllabus": [
    { "subject": "Subject Name", "title": "Chapter or Unit Title", "status": "not_started"|"in_progress"|"revised"|"mastered" }
  ],
  "goals": [
    { "title": "Concise study goal", "subject": "Subject Name", "targetHours": 10 }
  ]
}

Rules:
- Respect the student's requested school week length (if they say 5-day or Mon-Fri, set schoolDaysPerWeek: 5 and NEVER include Sat slots; if 6-day or Mon-Sat, set schoolDaysPerWeek: 6).
- If they ask for a simple or minimal setup, set simpleMode: true and keep timetable/syllabus concise and focused.
- Only include fields relevant to what the user asked for. Keep times in 24-hour HH:MM format.
- Output ONLY strict JSON.`;

const EXAMPLE_PROMPTS = [
  'I go to a 5-day school (Mon–Fri, 8:30 AM to 2:00 PM) in Class 11 Science. Set up a clean Physics, Chemistry, Maths, English & CS timetable plus core chapters.',
  'Keep it super simple: 5-day school week, minimal layout, just Biology, History, English, and Maths chapters to track.',
  'I am a 6-day college CSE student preparing for semester finals. Build a Mon–Sat schedule for DSA, OS, DBMS, and Computer Networks.',
];

export const AIWorkspaceCustomizer: React.FC<AIWorkspaceCustomizerProps> = ({
  isOpen,
  onClose,
  onApplied,
}) => {
  const { addGoal, forceSyncNow } = useAppContext();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [preview, setPreview] = useState<WorkspacePatch | null>(null);
  const [applyMode, setApplyMode] = useState<'merge' | 'replace'>('merge');
  const [appliedBanner, setAppliedBanner] = useState<string | null>(null);
  const [hasRollback, setHasRollback] = useState<boolean>(() => {
    try {
      return Boolean(localStorage.getItem(ROLLBACK_KEY));
    } catch {
      return false;
    }
  });

  if (!isOpen) return null;

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = prompt.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);
    setWarnings([]);
    setPreview(null);
    setAppliedBanner(null);

    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: trimmed,
          systemPrompt: SYSTEM_PROMPT,
          jsonMode: true,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'AI service returned an error. Please try again.');
      }

      const candidate = data.json || data.text;
      const result = validateWorkspacePatch(candidate);
      if (!result.ok || !result.patch) {
        setError(result.error || 'Could not understand the customization plan. Please try again.');
      } else {
        setPreview(result.patch);
        setWarnings(result.warnings);
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to reach AI Customizer right now.');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!preview) return;
    const current = loadPlannerState();
    try {
      localStorage.setItem(ROLLBACK_KEY, JSON.stringify(current));
      setHasRollback(true);
    } catch {}

    const next = applyPatchToPlannerState(current, preview, applyMode);
    savePlannerState(next);

    // Sync schoolDaysPerWeek into Attendance profile if updated
    if (preview.schoolDaysPerWeek === 5 || preview.schoolDaysPerWeek === 6) {
      try {
        const rawAtt = localStorage.getItem('savantix_attendance_institutional_v1');
        if (rawAtt) {
          const parsedAtt = JSON.parse(rawAtt);
          if (parsedAtt && parsedAtt.profile) {
            parsedAtt.profile.schoolDaysPerWeek = preview.schoolDaysPerWeek;
            localStorage.setItem('savantix_attendance_institutional_v1', JSON.stringify(parsedAtt));
            window.dispatchEvent(new CustomEvent('savantix:attendance-updated', { detail: parsedAtt }));
          }
        }
      } catch {}
    }

    if (preview.goals && preview.goals.length > 0) {
      for (const g of preview.goals) {
        try {
          await addGoal({
            title: g.title,
            subject: g.subject,
            targetHours: g.targetHours,
            completedHours: 0,
            status: 'active',
          });
        } catch {}
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('savantix:planner-updated', { detail: next }));
    }
    if (onApplied) onApplied(next);

    setTimeout(() => {
      try {
        forceSyncNow();
      } catch {}
    }, 250);

    setAppliedBanner('Workspace customized and synced to your account.');
    setPreview(null);
  };

  const handleRollback = () => {
    try {
      const raw = localStorage.getItem(ROLLBACK_KEY);
      if (!raw) return;
      const prev: StudentPlannerState = JSON.parse(raw);
      savePlannerState(prev);
      localStorage.removeItem(ROLLBACK_KEY);
      setHasRollback(false);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('savantix:planner-updated', { detail: prev }));
      }
      if (onApplied) onApplied(prev);
      setTimeout(() => {
        try {
          forceSyncNow();
        } catch {}
      }, 250);
      setAppliedBanner('Reverted to your previous workspace setup.');
    } catch {}
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4"
      role="dialog"
      aria-modal="true"
      aria-label="AI Workspace Customizer"
    >
      <div className="w-full max-w-2xl bg-[var(--sx-surface)] border border-[var(--sx-hairline)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--sx-hairline)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--sx-accent)]/15 text-[var(--sx-accent)] flex items-center justify-center">
              <Wand2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--sx-ink)]">
                Customize Workspace with AI
              </h2>
              <p className="text-xs text-[var(--sx-ink-secondary)]">
                Describe your school week, subjects, and goals — preview every change before applying.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close AI Customizer"
            className="p-1.5 rounded-lg text-[var(--sx-ink-muted)] hover:text-[var(--sx-ink)] hover:bg-[var(--sx-hover)] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          <form onSubmit={handleGenerate} className="space-y-3">
            <label className="block text-xs font-medium text-[var(--sx-ink-secondary)]">
              Tell Savantix how you want your workspace set up
            </label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. I'm in a 5-day school (Mon–Fri). Set up my weekly timetable for Physics, Chemistry, Maths, and English, and add my key syllabus chapters..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--sx-canvas)] border border-[var(--sx-hairline)] text-sm text-[var(--sx-ink)] focus:outline-none focus:border-[var(--sx-accent)] resize-none"
            />
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLE_PROMPTS.map((ex, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPrompt(ex)}
                  className="text-left text-[11px] px-2.5 py-1 rounded-full bg-[var(--sx-canvas)] border border-[var(--sx-hairline)] text-[var(--sx-ink-secondary)] hover:text-[var(--sx-ink)] hover:border-[var(--sx-accent)] transition-colors cursor-pointer truncate max-w-full"
                >
                  {ex.slice(0, 68)}…
                </button>
              ))}
            </div>
            <div className="flex items-center justify-between gap-2 pt-1">
              {hasRollback ? (
                <button
                  type="button"
                  onClick={handleRollback}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--sx-ink-secondary)] hover:text-[var(--sx-ink)] border border-[var(--sx-hairline)] hover:bg-[var(--sx-hover)] cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Undo Last AI Change
                </button>
              ) : (
                <span className="text-[11px] text-[var(--sx-ink-muted)]">
                  Powered by Cloudflare Workers AI · Changes only affect your account
                </span>
              )}
              <button
                type="submit"
                disabled={loading || !prompt.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--sx-accent)] hover:opacity-90 disabled:opacity-50 text-white text-sm font-semibold cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Designing…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Preview Plan
                  </>
                )}
              </button>
            </div>
          </form>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {appliedBanner && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{appliedBanner}</span>
            </div>
          )}

          {/* Staged Diff Preview */}
          {preview && (
            <div className="rounded-xl border border-[var(--sx-accent)]/40 bg-[var(--sx-canvas)] p-4 space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-[var(--sx-accent)]">
                    Preview Before Applying
                  </div>
                  <p className="text-sm font-medium text-[var(--sx-ink)] mt-0.5">
                    {preview.summary}
                  </p>
                </div>
                <div className="inline-flex rounded-lg border border-[var(--sx-hairline)] p-0.5 bg-[var(--sx-surface)] text-xs">
                  <button
                    type="button"
                    onClick={() => setApplyMode('merge')}
                    className={clsx(
                      'px-2.5 py-1 rounded-md font-medium cursor-pointer',
                      applyMode === 'merge'
                        ? 'bg-[var(--sx-accent)] text-white'
                        : 'text-[var(--sx-ink-secondary)]'
                    )}
                  >
                    Merge
                  </button>
                  <button
                    type="button"
                    onClick={() => setApplyMode('replace')}
                    className={clsx(
                      'px-2.5 py-1 rounded-md font-medium cursor-pointer',
                      applyMode === 'replace'
                        ? 'bg-[var(--sx-accent)] text-white'
                        : 'text-[var(--sx-ink-secondary)]'
                    )}
                  >
                    Replace
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                {preview.schoolDaysPerWeek && (
                  <div className="p-2.5 rounded-lg bg-[var(--sx-surface)] border border-[var(--sx-hairline)]">
                    <div className="text-[var(--sx-ink-muted)] flex items-center gap-1">
                      <CalendarDays className="w-3.5 h-3.5" /> School Week
                    </div>
                    <div className="font-semibold text-[var(--sx-ink)] mt-1">
                      {preview.schoolDaysPerWeek} days ({preview.schoolDaysPerWeek === 5 ? 'Mon–Fri' : 'Mon–Sat'})
                    </div>
                  </div>
                )}
                {preview.timetable && (
                  <div className="p-2.5 rounded-lg bg-[var(--sx-surface)] border border-[var(--sx-hairline)]">
                    <div className="text-[var(--sx-ink-muted)] flex items-center gap-1">
                      <CalendarDays className="w-3.5 h-3.5" /> Timetable Slots
                    </div>
                    <div className="font-semibold text-[var(--sx-ink)] mt-1">
                      +{preview.timetable.length} periods
                    </div>
                  </div>
                )}
                {preview.syllabus && (
                  <div className="p-2.5 rounded-lg bg-[var(--sx-surface)] border border-[var(--sx-hairline)]">
                    <div className="text-[var(--sx-ink-muted)] flex items-center gap-1">
                      <BookMarked className="w-3.5 h-3.5" /> Syllabus Chapters
                    </div>
                    <div className="font-semibold text-[var(--sx-ink)] mt-1">
                      +{preview.syllabus.length} chapters
                    </div>
                  </div>
                )}
                {preview.goals && (
                  <div className="p-2.5 rounded-lg bg-[var(--sx-surface)] border border-[var(--sx-hairline)]">
                    <div className="text-[var(--sx-ink-muted)] flex items-center gap-1">
                      <Target className="w-3.5 h-3.5" /> Study Goals
                    </div>
                    <div className="font-semibold text-[var(--sx-ink)] mt-1">
                      +{preview.goals.length} goals
                    </div>
                  </div>
                )}
              </div>

              {preview.timetable && preview.timetable.length > 0 && (
                <div className="text-xs space-y-1">
                  <div className="font-semibold text-[var(--sx-ink-secondary)]">Sample Timetable Periods</div>
                  <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                    {preview.timetable.slice(0, 8).map((s, i) => (
                      <div key={i} className="flex items-center justify-between px-2.5 py-1 rounded bg-[var(--sx-surface)] border border-[var(--sx-hairline)]">
                        <span className="font-medium text-[var(--sx-ink)]">
                          {s.day} · {s.time} — {s.subject}
                        </span>
                        {s.note && <span className="text-[var(--sx-ink-muted)]">{s.note}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {preview.syllabus && preview.syllabus.length > 0 && (
                <div className="text-xs space-y-1">
                  <div className="font-semibold text-[var(--sx-ink-secondary)]">Sample Syllabus Chapters</div>
                  <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                    {preview.syllabus.slice(0, 8).map((c, i) => (
                      <div key={i} className="flex items-center justify-between px-2.5 py-1 rounded bg-[var(--sx-surface)] border border-[var(--sx-hairline)]">
                        <span className="text-[var(--sx-ink)] truncate">{c.title}</span>
                        <span className="text-[var(--sx-ink-muted)] shrink-0 ml-2">{c.subject}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {warnings.length > 0 && (
                <div className="text-[11px] text-amber-400 space-y-0.5">
                  {warnings.map((w, i) => (
                    <div key={i}>• {w}</div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--sx-hairline)]">
                <button
                  type="button"
                  onClick={() => setPreview(null)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-[var(--sx-ink-secondary)] hover:text-[var(--sx-ink)] border border-[var(--sx-hairline)] cursor-pointer"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[var(--sx-accent)] hover:opacity-90 text-white text-xs font-semibold cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  Apply to My Workspace
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
