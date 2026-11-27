import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Plus, Copy, Check, Edit2, Trash2, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const MOODS = [
  { level: 5, label: 'Great' },
  { level: 4, label: 'Good' },
  { level: 3, label: 'Okay' },
  { level: 2, label: 'Tired' },
  { level: 1, label: 'Rough' },
];

export const Journal = () => {
  const { journalEntries, addJournalEntry, updateJournalEntry, deleteJournalEntry } = useAppContext();

  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [copiedNotice, setCopiedNotice] = useState(false);

  const [title, setTitle] = useState('');
  const [date, setDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [mood, setMood] = useState<number>(4);
  const [wins, setWins] = useState('');
  const [struggles, setStruggles] = useState('');
  const [notes, setNotes] = useState('');

  const entries = useMemo(() => {
    const list = [...(journalEntries || [])].sort((a: any, b: any) =>
      String(b.date || '').localeCompare(String(a.date || ''))
    );
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter((e: any) =>
      `${e.title || ''} ${e.wins || ''} ${e.struggles || ''} ${e.content || ''} ${e.insights || ''}`
        .toLowerCase()
        .includes(q)
    );
  }, [journalEntries, search]);

  const resetForm = () => {
    setTitle('');
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setMood(4);
    setWins('');
    setStruggles('');
    setNotes('');
    setEditingId(null);
    setIsComposerOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !notes.trim() && !wins.trim()) return;
    const payload = {
      title: title.trim() || `Reflection · ${date}`,
      date,
      mood,
      wins: wins.trim(),
      struggles: struggles.trim(),
      content: notes.trim(),
    };
    if (editingId) {
      await updateJournalEntry(editingId, payload);
    } else {
      await addJournalEntry(payload);
    }
    resetForm();
  };

  const startEdit = (entry: any) => {
    setEditingId(entry.id);
    setTitle(entry.title || '');
    setDate(entry.date || format(new Date(), 'yyyy-MM-dd'));
    setMood(Number(entry.mood) || 4);
    setWins(entry.wins || '');
    setStruggles(entry.struggles || '');
    setNotes(entry.content || entry.insights || '');
    setIsComposerOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this journal entry?')) {
      await deleteJournalEntry(id);
    }
  };

  const handleCopyWeeklyReview = () => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    const cutoffIso = cutoff.toISOString().slice(0, 10);
    const recent = entries.filter((e: any) => String(e.date || '') >= cutoffIso);
    const md = recent.length > 0
      ? `# 7-Day Study Reflection Review\n\n` + recent.map((e: any) =>
          `## ${e.date} — ${e.title || 'Daily Reflection'}\n` +
          (e.wins ? `- **Wins:** ${e.wins}\n` : '') +
          (e.struggles ? `- **Blockers:** ${e.struggles}\n` : '') +
          (e.content ? `- **Notes:** ${e.content}\n` : '')
        ).join('\n')
      : '# 7-Day Study Reflection Review\n\nNo entries logged in the last 7 days.';
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(md).catch(() => {});
    }
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 2200);
  };

  return (
    <div className="w-full px-5 sm:px-8 py-7 max-w-4xl mx-auto space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[var(--sx-hairline)]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--sx-ink)]">Journal</h1>
          <p className="text-sm text-[var(--sx-ink-secondary)] mt-0.5">
            Capture daily wins, blockers, and study notes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyWeeklyReview}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-[8px] text-xs font-medium bg-[var(--sx-surface)] hover:bg-[var(--sx-hover)] border border-[var(--sx-hairline)] text-[var(--sx-ink)] cursor-pointer"
          >
            {copiedNotice ? <Check className="w-3.5 h-3.5 text-[var(--sx-safe)]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedNotice ? 'Copied review' : 'Copy 7-day review'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (isComposerOpen) resetForm();
              else setIsComposerOpen(true);
            }}
            className="sx-btn-primary inline-flex items-center gap-1.5 px-4 py-2.5 rounded-[8px] text-sm font-semibold cursor-pointer"
          >
            {isComposerOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{isComposerOpen ? 'Close' : 'New entry'}</span>
          </button>
        </div>
      </header>

      {isComposerOpen && (
        <form
          onSubmit={handleSubmit}
          className="bg-[var(--sx-surface)] border border-[var(--sx-hairline)] rounded-[12px] p-5 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Entry title"
              className="sm:col-span-2 px-3.5 py-2.5 text-sm border rounded-[8px]"
            />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="px-3.5 py-2.5 text-sm border rounded-[8px]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-[var(--sx-ink-muted)] mr-1">How did today feel?</span>
            {MOODS.map((m) => (
              <button
                key={m.level}
                type="button"
                onClick={() => setMood(m.level)}
                className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                  mood === m.level
                    ? 'bg-[var(--sx-signal-bg)] text-[var(--sx-signal-text)] font-semibold'
                    : 'bg-[var(--sx-elevated)] text-[var(--sx-ink-secondary)] hover:bg-[var(--sx-hover)]'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <textarea
              rows={2}
              value={wins}
              onChange={(e) => setWins(e.target.value)}
              placeholder="What went well today?"
              className="w-full px-3.5 py-2.5 text-sm border rounded-[8px] resize-none"
            />
            <textarea
              rows={2}
              value={struggles}
              onChange={(e) => setStruggles(e.target.value)}
              placeholder="What slowed you down?"
              className="w-full px-3.5 py-2.5 text-sm border rounded-[8px] resize-none"
            />
          </div>

          <textarea
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Write your notes or takeaways..."
            className="w-full px-3.5 py-2.5 text-sm border rounded-[8px]"
          />

          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={resetForm} className="px-4 py-2 text-sm text-[var(--sx-ink-secondary)] hover:text-[var(--sx-ink)] cursor-pointer">
              Cancel
            </button>
            <button type="submit" className="sx-btn-primary px-4 py-2 rounded-[8px] text-sm font-semibold cursor-pointer">
              {editingId ? 'Save changes' : 'Save entry'}
            </button>
          </div>
        </form>
      )}

      <div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search journal entries..."
          className="w-full sm:w-72 px-3.5 py-2 text-sm border rounded-[8px]"
        />
      </div>

      <div className="space-y-3">
        {entries.length === 0 ? (
          <div className="bg-[var(--sx-surface)] border border-[var(--sx-hairline)] rounded-[12px] p-10 text-center text-sm text-[var(--sx-ink-muted)]">
            No journal entries yet. Click "New entry" to write your first note.
          </div>
        ) : (
          entries.map((entry: any) => {
            const moodLabel = MOODS.find((m) => m.level === Number(entry.mood))?.label;
            return (
              <article
                key={entry.id}
                className="bg-[var(--sx-surface)] border border-[var(--sx-hairline)] rounded-[12px] p-5 space-y-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold text-[var(--sx-ink)]">
                      {entry.title || 'Daily Reflection'}
                    </h2>
                    <div className="text-xs text-[var(--sx-ink-muted)] mt-0.5">
                      {entry.date}{moodLabel ? ` · ${moodLabel}` : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button type="button" onClick={() => startEdit(entry)} aria-label="Edit entry" className="p-1.5 text-[var(--sx-ink-muted)] hover:text-[var(--sx-ink)] rounded-[6px] cursor-pointer">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => handleDelete(entry.id)} aria-label="Delete entry" className="p-1.5 text-[var(--sx-ink-muted)] hover:text-[var(--sx-fault)] rounded-[6px] cursor-pointer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {entry.wins && (
                  <p className="text-sm text-[var(--sx-ink)]">
                    <span className="font-medium text-[var(--sx-safe)]">Wins: </span>{entry.wins}
                  </p>
                )}
                {entry.struggles && (
                  <p className="text-sm text-[var(--sx-ink)]">
                    <span className="font-medium text-[var(--sx-caution)]">Blockers: </span>{entry.struggles}
                  </p>
                )}
                {(entry.content || entry.insights) && (
                  <p className="text-sm text-[var(--sx-ink-secondary)] whitespace-pre-wrap leading-relaxed">
                    {entry.content || entry.insights}
                  </p>
                )}
              </article>
            );
          })
        )}
      </div>
    </div>
  );
};
