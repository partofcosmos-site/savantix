import React, { useState, useMemo } from 'react';
import { Plus, CheckCircle2, Circle, Trash2, Edit2, Calendar, X, Check } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export type GoalCategory = 'Physics' | 'Math' | 'Chemistry' | 'Mock Tests' | 'General';
export type GoalPriority = 'Urgent' | 'High' | 'Medium' | 'Low';

const CATEGORIES: GoalCategory[] = ['Physics', 'Math', 'Chemistry', 'Mock Tests', 'General'];
const PRIORITIES: GoalPriority[] = ['Urgent', 'High', 'Medium', 'Low'];

export const Goals = () => {
  const { goals, addGoal, updateGoal, deleteGoal } = useAppContext();

  const [filterCat, setFilterCat] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('all');
  const [search, setSearch] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<GoalCategory>('General');
  const [priority, setPriority] = useState<GoalPriority>('Medium');
  const [targetDate, setTargetDate] = useState('');

  const allGoals = goals || [];
  const completedCount = allGoals.filter((g: any) => g.completed).length;
  const activeCount = allGoals.length - completedCount;
  const completionPct = allGoals.length > 0 ? Math.round((completedCount / allGoals.length) * 100) : 0;

  const filteredGoals = useMemo(() => {
    return allGoals.filter((g: any) => {
      if (filterCat !== 'All' && (g.category || 'General') !== filterCat) return false;
      if (filterStatus === 'active' && g.completed) return false;
      if (filterStatus === 'completed' && !g.completed) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!`${g.title || ''} ${g.description || ''}`.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [allGoals, filterCat, filterStatus, search]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('General');
    setPriority('Medium');
    setTargetDate('');
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (editingId) {
      await updateGoal(editingId, {
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        targetDate: targetDate || null,
      });
    } else {
      await addGoal({
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        targetDate: targetDate || null,
        completed: false,
      });
    }
    resetForm();
  };

  const startEdit = (g: any) => {
    setEditingId(g.id);
    setTitle(g.title || '');
    setDescription(g.description || '');
    setCategory((g.category as GoalCategory) || 'General');
    setPriority((g.priority as GoalPriority) || 'Medium');
    setTargetDate(g.targetDate || '');
    setIsAdding(true);
  };

  const toggleDone = async (g: any) => {
    await updateGoal(g.id, { completed: !g.completed });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this goal?')) {
      await deleteGoal(id);
    }
  };

  return (
    <div className="w-full px-5 sm:px-8 py-7 max-w-4xl mx-auto space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[var(--sx-hairline)]">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--sx-ink)]">Goals</h1>
          <p className="text-sm text-[var(--sx-ink-secondary)] mt-0.5">
            Track syllabus milestones and target dates.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (isAdding) resetForm();
            else setIsAdding(true);
          }}
          className="sx-btn-primary inline-flex items-center gap-2 px-4 py-2.5 rounded-[8px] text-sm font-semibold cursor-pointer self-start sm:self-auto"
        >
          {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>{isAdding ? 'Close' : 'Add goal'}</span>
        </button>
      </header>

      {/* Simple 3-Metric Summary Card */}
      <div className="grid grid-cols-3 bg-[var(--sx-surface)] border border-[var(--sx-hairline)] rounded-[12px] divide-x divide-[var(--sx-hairline)]">
        <div className="p-4">
          <div className="text-xs text-[var(--sx-ink-muted)]">Active</div>
          <div className="text-xl font-bold text-[var(--sx-ink)] mt-0.5">{activeCount}</div>
        </div>
        <div className="p-4">
          <div className="text-xs text-[var(--sx-ink-muted)]">Completed</div>
          <div className="text-xl font-bold text-[var(--sx-safe)] mt-0.5">{completedCount}</div>
        </div>
        <div className="p-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-[var(--sx-ink-muted)]">
            <span>Progress</span>
            <span className="font-semibold text-[var(--sx-ink)]">{completionPct}%</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-[var(--sx-elevated)] overflow-hidden">
            <div className="h-full transition-all duration-300" style={{ width: `${completionPct}%`, backgroundColor: 'var(--sx-accent)' }} />
          </div>
        </div>
      </div>

      {/* Add / Edit Goal Form */}
      {isAdding && (
        <form
          onSubmit={handleSubmit}
          className="bg-[var(--sx-surface)] border border-[var(--sx-hairline)] rounded-[12px] p-5 space-y-4"
        >
          <div className="text-sm font-semibold text-[var(--sx-ink)]">
            {editingId ? 'Edit goal' : 'New goal'}
          </div>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What do you want to finish?"
            className="w-full px-3.5 py-2.5 text-sm border rounded-[8px]"
          />
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Notes or chapters to cover (optional)"
            className="w-full px-3.5 py-2.5 text-sm border rounded-[8px] resize-none"
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <select value={category} onChange={(e) => setCategory(e.target.value as GoalCategory)} className="px-3 py-2 text-sm border rounded-[8px]">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={priority} onChange={(e) => setPriority(e.target.value as GoalPriority)} className="px-3 py-2 text-sm border rounded-[8px]">
              {PRIORITIES.map((p) => <option key={p} value={p}>{p} priority</option>)}
            </select>
            <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="px-3 py-2 text-sm border rounded-[8px]" />
          </div>
          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={resetForm} className="px-4 py-2 text-sm text-[var(--sx-ink-secondary)] hover:text-[var(--sx-ink)] cursor-pointer">
              Cancel
            </button>
            <button type="submit" className="sx-btn-primary inline-flex items-center gap-1.5 px-4 py-2 rounded-[8px] text-sm font-semibold cursor-pointer">
              <Check className="w-4 h-4" />
              <span>{editingId ? 'Save changes' : 'Create goal'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Search & Filter Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {['All', ...CATEGORIES].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setFilterCat(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                filterCat === cat
                  ? 'bg-[var(--sx-signal-bg)] text-[var(--sx-signal-text)] font-semibold'
                  : 'bg-[var(--sx-surface)] text-[var(--sx-ink-secondary)] hover:bg-[var(--sx-hover)] border border-[var(--sx-hairline)]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search goals..."
            className="px-3 py-1.5 text-xs border rounded-[8px] w-40 sm:w-48"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-2.5 py-1.5 text-xs border rounded-[8px]"
            aria-label="Filter by status"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="completed">Done</option>
          </select>
        </div>
      </div>

      {/* Clean Goal List Card */}
      <div className="bg-[var(--sx-surface)] border border-[var(--sx-hairline)] rounded-[12px] divide-y divide-[var(--sx-hairline)]">
        {filteredGoals.length === 0 ? (
          <div className="p-10 text-center text-sm text-[var(--sx-ink-muted)]">
            No goals match your filter. Click "Add goal" to create one.
          </div>
        ) : (
          filteredGoals.map((g: any) => (
            <div key={g.id} className="p-4 flex items-start justify-between gap-3 hover:bg-[var(--sx-hover)]/40 transition-colors">
              <div className="flex items-start gap-3 min-w-0">
                <button
                  type="button"
                  onClick={() => toggleDone(g)}
                  aria-label={g.completed ? 'Mark goal incomplete' : 'Mark goal complete'}
                  className="mt-0.5 text-[var(--sx-ink-muted)] hover:text-[var(--sx-accent)] cursor-pointer shrink-0"
                >
                  {g.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-[var(--sx-safe)]" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </button>
                <div className="min-w-0">
                  <div className={`text-sm font-medium ${g.completed ? 'line-through text-[var(--sx-ink-muted)]' : 'text-[var(--sx-ink)]'}`}>
                    {g.title}
                  </div>
                  {g.description && (
                    <p className="text-xs text-[var(--sx-ink-secondary)] mt-0.5">{g.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-2.5 mt-1.5 text-xs text-[var(--sx-ink-muted)]">
                    <span>{g.category || 'General'}</span>
                    {g.priority && <span>· {g.priority}</span>}
                    {g.targetDate && (
                      <span className="inline-flex items-center gap-1">
                        · <Calendar className="w-3 h-3" /> {g.targetDate}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button type="button" onClick={() => startEdit(g)} aria-label="Edit goal" className="p-1.5 text-[var(--sx-ink-muted)] hover:text-[var(--sx-ink)] rounded-[6px] cursor-pointer">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => handleDelete(g.id)} aria-label="Delete goal" className="p-1.5 text-[var(--sx-ink-muted)] hover:text-[var(--sx-fault)] rounded-[6px] cursor-pointer">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
