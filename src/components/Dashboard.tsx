import React, { useState, useMemo } from 'react';
import { format, subDays, parseISO, isValid, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { Edit2, Check, X, Trash2, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { parseQuickStudyLog } from '../utils/quickLogParser';
import { ExamCountdown } from './ExamCountdown';
import { DailyAgendaDesk } from './DailyAgendaDesk';
import { LogInput } from './LogInput';

export const Dashboard = () => {
  const {
    logs,
    addLog,
    updateLog,
    deleteLog,
    elasticStreak,
    updateElasticStreak,
  } = useAppContext();

  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [quickLogInput, setQuickLogInput] = useState('');
  const [isQuickLogging, setIsQuickLogging] = useState(false);
  const [showFullComposer, setShowFullComposer] = useState(false);
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [targetInput, setTargetInput] = useState(String(elasticStreak?.targetMinutesDaily || 120));
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  const parsedQuickLog = useMemo(() => parseQuickStudyLog(quickLogInput), [quickLogInput]);

  const logs7Days = useMemo(() => {
    const today = new Date();
    const start = startOfDay(subDays(today, 6));
    const end = endOfDay(today);
    return (logs || []).filter((l) => {
      if (!l?.date) return false;
      const d = parseISO(String(l.date).slice(0, 10));
      return isValid(d) && isWithinInterval(d, { start, end });
    });
  }, [logs]);

  const todayLogs = useMemo(
    () => (logs || []).filter((l) => String(l.date || '').slice(0, 10) === selectedDate),
    [logs, selectedDate]
  );

  const totalMinutes = useMemo(
    () => todayLogs.reduce((acc, l) => acc + (Math.max(0, Number(l.durationMinutes)) || 0), 0),
    [todayLogs]
  );
  const totalProblems = useMemo(
    () => todayLogs.reduce((acc, l) => acc + (Math.max(0, Number(l.problemsSolved)) || 0), 0),
    [todayLogs]
  );
  const pace7dHours = useMemo(() => {
    const mins7 = logs7Days.reduce((acc, l) => acc + (Math.max(0, Number(l.durationMinutes)) || 0), 0);
    return (mins7 / 60 / 7).toFixed(1);
  }, [logs7Days]);

  const subjectShare7d = useMemo(() => {
    const bySubj = new Map<string, number>();
    let total = 0;
    logs7Days.forEach((l) => {
      const m = Math.max(0, Number(l.durationMinutes) || 0);
      if (!m) return;
      const s = (l.subject || 'General').split(',')[0].trim() || 'General';
      bySubj.set(s, (bySubj.get(s) || 0) + m);
      total += m;
    });
    if (total === 0) return [];
    return Array.from(bySubj.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, mins]) => ({ name, mins, pct: Math.round((mins / total) * 100) }));
  }, [logs7Days]);

  const targetMins = Math.max(15, elasticStreak?.targetMinutesDaily || 120);
  const targetPct = Math.min(100, Math.round((totalMinutes / targetMins) * 100));
  const activeStreak = elasticStreak?.activeStreakDays || 0;

  const handleQuickLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parsedQuickLog || isQuickLogging) return;
    setIsQuickLogging(true);
    try {
      await addLog({
        date: selectedDate,
        subject: parsedQuickLog.subject,
        topic: parsedQuickLog.topic,
        durationMinutes: parsedQuickLog.durationMinutes,
        problemsSolved: parsedQuickLog.problemsSolved,
        accuracyPercent: parsedQuickLog.accuracyPercent,
        rawText: quickLogInput.trim(),
      });
      setQuickLogInput('');
      showToast(`Logged ${parsedQuickLog.durationMinutes}m · ${parsedQuickLog.subject}`);
    } catch {
      showToast('Could not save log.');
    } finally {
      setIsQuickLogging(false);
    }
  };

  const handleSaveTarget = () => {
    const n = parseInt(targetInput, 10);
    if (!isNaN(n) && n >= 15) {
      updateElasticStreak({ targetMinutesDaily: n });
      setIsEditingTarget(false);
      showToast(`Daily target set to ${n}m`);
    }
  };

  const handleEditClick = (log: any) => {
    setEditingLogId(log.id);
    setEditForm({
      subject: log.subject || '',
      topic: log.topic || '',
      durationMinutes: Number(log.durationMinutes) || 0,
      problemsSolved: Number(log.problemsSolved) || 0,
    });
  };

  const handleSaveEdit = async (id: string) => {
    await updateLog(id, {
      subject: (editForm.subject || 'General').trim().slice(0, 99) || 'General',
      topic: (editForm.topic || '').trim().slice(0, 199),
      durationMinutes: Math.max(0, Math.round(Number(editForm.durationMinutes))) || 0,
      problemsSolved: Math.max(0, Math.round(Number(editForm.problemsSolved))) || 0,
    });
    setEditingLogId(null);
  };

  const handleDeleteLog = async (id: string) => {
    if (window.confirm('Delete this study session?')) {
      await deleteLog(id);
      if (editingLogId === id) setEditingLogId(null);
    }
  };

  const displayDateLabel = useMemo(() => {
    const d = parseISO(selectedDate);
    return isValid(d) ? format(d, 'EEEE, d MMM yyyy') : selectedDate;
  }, [selectedDate]);

  const getHumanGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };
  const barColors = ['#2374e1', '#31a24c', '#f7b928', '#e4605e', '#8b5cf6'];

  return (
    <div className="w-full px-5 sm:px-8 py-7 max-w-6xl mx-auto space-y-8">
      {toast && (
        <div className="fixed top-5 right-5 z-50 px-3.5 py-2 rounded-[8px] bg-[var(--sx-surface)] border border-[var(--sx-border)] text-xs text-[var(--sx-ink)]">
          {toast}
        </div>
      )}

      {/* Minimal Header — No Box */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-[var(--sx-hairline)]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--sx-ink)]">{getHumanGreeting()}</h1>
          <p className="text-xs text-[var(--sx-ink-muted)] mt-1">{displayDateLabel}</p>
        </div>
        <div className="flex items-center gap-2.5">
          {isEditingTarget ? (
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={15}
                max={960}
                value={targetInput}
                onChange={(e) => setTargetInput(e.target.value)}
                className="w-20 px-2.5 py-1.5 text-xs rounded-[5px] border border-[var(--sx-border)]"
                aria-label="Daily target minutes"
              />
              <button
                type="button"
                onClick={handleSaveTarget}
                className="sx-btn-primary px-2.5 py-1.5 text-xs rounded-[5px] cursor-pointer"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsEditingTarget(false)}
                className="px-2 py-1.5 text-xs text-[var(--sx-ink-secondary)] hover:text-[var(--sx-ink)] cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setTargetInput(String(targetMins));
                setIsEditingTarget(true);
              }}
              className="px-2.5 py-1.5 text-xs font-mono text-[var(--sx-ink-secondary)] hover:text-[var(--sx-ink)] bg-[var(--sx-surface)] border border-[var(--sx-hairline)] rounded-[5px] cursor-pointer transition-colors"
              title="Edit daily focus target"
            >
              Goal: {targetMins}m
            </button>
          )}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setEditingLogId(null);
            }}
            aria-label="Select date"
            className="px-3 py-1.5 text-xs rounded-[5px] border border-[var(--sx-hairline)]"
          />
        </div>
      </header>

      {/* Flat 4-Column Telemetry Strip (Hairline Dividers, Zero Nested Boxes) */}
      <section className="grid grid-cols-2 md:grid-cols-4 border border-[var(--sx-hairline)] rounded-[12px] bg-[var(--sx-surface)] divide-y md:divide-y-0 md:divide-x divide-[var(--sx-hairline)]">
        <div className="p-4 space-y-2">
          <div className="text-xs text-[var(--sx-ink-muted)]">Focused today</div>
          <div className="flex items-baseline gap-2 font-mono">
            <span className="text-xl font-semibold text-[var(--sx-ink)]">{totalMinutes}m</span>
            <span className="text-xs text-[var(--sx-ink-muted)]">/ {targetMins}m</span>
          </div>
          <div className="w-full h-1 rounded-full bg-[var(--sx-elevated)] overflow-hidden">
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${targetPct}%`,
                backgroundColor: targetPct >= 100 ? 'var(--sx-safe)' : 'var(--sx-accent)',
              }}
            />
          </div>
        </div>

        <div className="p-4 space-y-1.5">
          <div className="text-xs text-[var(--sx-ink-muted)]">Problems solved</div>
          <div className="font-mono text-xl font-semibold text-[var(--sx-ink)]">{totalProblems}</div>
          <div className="text-[11px] text-[var(--sx-ink-muted)]">{todayLogs.length} session(s)</div>
        </div>

        <div className="p-4 space-y-1.5">
          <div className="text-xs text-[var(--sx-ink-muted)]">Active streak</div>
          <div className="font-mono text-xl font-semibold text-[var(--sx-ink)]">{activeStreak}d</div>
          <div className="text-[11px] text-[var(--sx-ink-muted)]">
            Best: {elasticStreak?.longestStreakDays || activeStreak}d
          </div>
        </div>

        <div className="p-4 space-y-1.5">
          <div className="text-xs text-[var(--sx-ink-muted)]">7-day average</div>
          <div className="font-mono text-xl font-semibold text-[var(--sx-ink)]">{pace7dHours}h</div>
          <div className="text-[11px] text-[var(--sx-ink-muted)]">per day</div>
        </div>
      </section>

      {/* Single Clean Quick-Log Bar + 7-Day Subject Balance */}
      <section className="space-y-3">
        <form onSubmit={handleQuickLogSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={quickLogInput}
            onChange={(e) => setQuickLogInput(e.target.value)}
            placeholder='Quick log — e.g. "45m physics optics 15q 85%" or "1.5h math calculus"'
            aria-label="Natural language quick study log"
            className="flex-1 px-3.5 py-2.5 text-sm rounded-[8px] border border-[var(--sx-border)]"
          />
          <button
            type="submit"
            disabled={!parsedQuickLog || isQuickLogging}
            className="sx-btn-primary px-4 py-2.5 rounded-[8px] text-xs font-medium cursor-pointer disabled:opacity-40 shrink-0"
          >
            {isQuickLogging ? 'Saving...' : 'Quick Log'}
          </button>
          <button
            type="button"
            onClick={() => setShowFullComposer((v) => !v)}
            className="px-3 py-2.5 rounded-[8px] text-xs text-[var(--sx-ink-secondary)] hover:text-[var(--sx-ink)] bg-[var(--sx-surface)] border border-[var(--sx-hairline)] flex items-center gap-1 cursor-pointer shrink-0"
            title="Toggle voice and detailed log composer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Detailed</span>
            {showFullComposer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </form>

        {parsedQuickLog && (
          <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-[var(--sx-safe)]">
            <span>{parsedQuickLog.durationMinutes}m</span>
            <span>· {parsedQuickLog.subject}</span>
            <span>· {parsedQuickLog.topic}</span>
            {parsedQuickLog.problemsSolved > 0 && <span>· {parsedQuickLog.problemsSolved}Q</span>}
            {parsedQuickLog.accuracyPercent !== undefined && <span>· {parsedQuickLog.accuracyPercent}%</span>}
          </div>
        )}

        {showFullComposer && (
          <div className="pt-2">
            <LogInput selectedDate={selectedDate} />
          </div>
        )}

        {subjectShare7d.length > 0 && (
          <div className="pt-1 space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[var(--sx-ink-muted)]">
              <span>7-Day Subject Balance</span>
              <div className="flex flex-wrap items-center gap-3 font-mono">
                {subjectShare7d.map((item, idx) => (
                  <span key={item.name} className="inline-flex items-center gap-1.5 text-[var(--sx-ink-secondary)]">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: barColors[idx % barColors.length] }} />
                    <span>{item.name} {item.pct}%</span>
                  </span>
                ))}
              </div>
            </div>
            <div className="w-full h-1 rounded-full overflow-hidden flex bg-[var(--sx-elevated)]">
              {subjectShare7d.map((item, idx) => (
                <div
                  key={item.name}
                  style={{ width: `${item.pct}%`, backgroundColor: barColors[idx % barColors.length] }}
                />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Clean 2-Column Main Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Sessions List */}
        <section className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-[var(--sx-ink)]">Sessions</h2>
            <span className="font-mono text-xs text-[var(--sx-ink-muted)]">
              {todayLogs.length} logged
            </span>
          </div>

          <div className="border border-[var(--sx-hairline)] rounded-[12px] bg-[var(--sx-surface)] divide-y divide-[var(--sx-hairline)]">
            {todayLogs.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--sx-ink-muted)]">
                No study sessions logged for {displayDateLabel}. Type above to log one in seconds.
              </div>
            ) : (
              todayLogs.map((log: any) => {
                const isEditing = editingLogId === log.id;
                return (
                  <div key={log.id} className="p-3.5 hover:bg-[var(--sx-hover)]/40 transition-colors">
                    {isEditing ? (
                      <div className="space-y-2.5">
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={editForm.subject}
                            onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                            placeholder="Subject"
                            className="px-2.5 py-1.5 text-xs rounded-[5px] border"
                          />
                          <input
                            type="text"
                            value={editForm.topic}
                            onChange={(e) => setEditForm({ ...editForm, topic: e.target.value })}
                            placeholder="Topic"
                            className="px-2.5 py-1.5 text-xs rounded-[5px] border"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={editForm.durationMinutes}
                            onChange={(e) => setEditForm({ ...editForm, durationMinutes: e.target.value })}
                            placeholder="Minutes"
                            className="w-24 px-2.5 py-1.5 text-xs rounded-[5px] border"
                          />
                          <input
                            type="number"
                            value={editForm.problemsSolved}
                            onChange={(e) => setEditForm({ ...editForm, problemsSolved: e.target.value })}
                            placeholder="Problems"
                            className="w-24 px-2.5 py-1.5 text-xs rounded-[5px] border"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(log.id)}
                            aria-label="Save session"
                            className="sx-btn-primary p-1.5 rounded-[5px] cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingLogId(null)}
                            aria-label="Cancel edit"
                            className="p-1.5 text-[var(--sx-ink-muted)] hover:text-[var(--sx-ink)] cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-[var(--sx-ink)] truncate">
                              {log.subject || 'General'}
                            </span>
                            {log.topic && (
                              <span className="text-xs text-[var(--sx-ink-secondary)] truncate">
                                · {log.topic}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-mono text-xs text-[var(--sx-ink)]">
                            {log.durationMinutes || 0}m
                          </span>
                          {(log.problemsSolved || 0) > 0 && (
                            <span className="font-mono text-xs text-[var(--sx-ink-muted)]">
                              {log.problemsSolved}Q
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleEditClick(log)}
                            aria-label="Edit session"
                            title="Edit"
                            className="p-1 text-[var(--sx-ink-muted)] hover:text-[var(--sx-ink)] cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteLog(log.id)}
                            aria-label="Delete session"
                            title="Delete"
                            className="p-1 text-[var(--sx-ink-muted)] hover:text-[var(--sx-fault)] cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <DailyAgendaDesk selectedDate={selectedDate} />
        </section>

        {/* Right: Upcoming Exams */}
        <aside className="lg:col-span-5">
          <ExamCountdown />
        </aside>
      </div>
    </div>
  );
};
