import { useEffect, useMemo, useState, FormEvent } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  Pencil,
  Trash2,
  Clock,
  MapPin,
  User,
  X,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  ArrowUpDown,
} from 'lucide-react';
import { useAssignmentStorage } from '../hooks/useAssignmentStorage';
import type { AssignmentPriority, AssignmentRecord } from '../types/assignment';

type SortOption = 'dueDate' | 'priority' | 'code' | 'alphabetical';
type FilterMode = 'all' | 'upcoming' | 'past' | 'completed';

const PRIORITY_OPTIONS: AssignmentPriority[] = ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'];

const getAutomaticColorLabel = (priority: AssignmentPriority): NonNullable<AssignmentRecord['colorLabel']> => {
  const colors: Record<AssignmentPriority, NonNullable<AssignmentRecord['colorLabel']>> = {
    CRITICAL: 'pink',
    HIGH: 'orange',
    MODERATE: 'yellow',
    LOW: 'green',
  };
  return colors[priority];
};

const COLOR_ACCENT: Record<NonNullable<AssignmentRecord['colorLabel']>, string> = {
  blue: 'border-blue-500/40 bg-blue-500/10 text-blue-300',
  purple: 'border-purple-500/40 bg-purple-500/10 text-purple-300',
  green: 'border-green-500/40 bg-green-500/10 text-green-300',
  yellow: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-300',
  pink: 'border-pink-500/40 bg-pink-500/10 text-pink-300',
  orange: 'border-orange-500/40 bg-orange-500/10 text-orange-300',
  cyan: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300',
};

const PRIORITY_ACCENT: Record<AssignmentPriority, string> = {
  CRITICAL: 'border-panic/40 bg-panic/10 text-panic',
  HIGH: 'border-caution/40 bg-caution/10 text-caution',
  MODERATE: 'border-blue-500/40 bg-blue-500/10 text-blue-300',
  LOW: 'border-gray-700 bg-gray-900/40 text-gray-400',
};

const inputClass =
  'w-full bg-void border border-gray-800 px-3 py-2 text-xs font-mono text-gray-200 placeholder-gray-600 outline-none focus:border-gray-600 transition-colors';

const labelClass = 'block text-[10px] uppercase tracking-widest text-gray-500 font-mono font-bold mb-1.5';

type FormState = {
  courseCode: string;
  courseName: string;
  title: string;
  dueDate: string;
  dueTime: string;
  venue: string;
  instructor: string;
  notes: string;
  reminder: string;
  colorLabel: NonNullable<AssignmentRecord['colorLabel']>;
  priority: AssignmentPriority;
};

const emptyForm = (): FormState => ({
  courseCode: '',
  courseName: '',
  title: '',
  dueDate: '',
  dueTime: '23:59',
  venue: '',
  instructor: '',
  notes: '',
  reminder: '',
  colorLabel: 'blue',
  priority: 'HIGH',
});

const parseDue = (record: AssignmentRecord) => {
  const [y, m, d] = record.dueDate.split('-').map(Number);
  const [hh, mm] = (record.dueTime || '23:59').split(':').map(Number);
  return new Date(y, m - 1, d, hh, mm, 0, 0);
};

const sortAssignments = (list: AssignmentRecord[], sortBy: SortOption): AssignmentRecord[] => {
  const copy = [...list];
  switch (sortBy) {
    case 'priority': {
      const rank: Record<AssignmentPriority, number> = { CRITICAL: 3, HIGH: 2, MODERATE: 1, LOW: 0 };
      return copy.sort((a, b) => rank[b.priority] - rank[a.priority]);
    }
    case 'code':
      return copy.sort((a, b) => a.courseCode.localeCompare(b.courseCode));
    case 'alphabetical':
      return copy.sort((a, b) => a.title.localeCompare(b.title));
    case 'dueDate':
    default:
      return copy.sort((a, b) => parseDue(a).getTime() - parseDue(b).getTime());
  }
};

const Assignments = () => {
  const [assignments, setAssignments, loading] = useAssignmentStorage();
  const [now, setNow] = useState(() => new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('dueDate');
  const [filterMode, setFilterMode] = useState<FilterMode>('upcoming');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(() => emptyForm());
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Deep-link highlight support: if routed with location.state.highlightAssignmentId, scroll + highlight.
  const location = useLocation();
  const [highlightedAssignment, setHighlightedAssignment] = useState<number | null>(null);
  useEffect(() => {
    const id = (location.state as any)?.highlightAssignmentId as number | undefined;
    if (!id) return;
    setHighlightedAssignment(id);
    const el = document.getElementById(`assignment-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-safe');
      setTimeout(() => el.classList.remove('ring-2', 'ring-safe'), 3500);
    }
    try { window.history.replaceState({}, document.title, window.location.pathname + window.location.search); } catch {};
  }, [location]);

  useEffect(() => {
    if (!successMessage) return;
    const timer = window.setTimeout(() => setSuccessMessage(''), 3000);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyForm());
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (record: AssignmentRecord) => {
    setEditingId(record.id);
    setForm({
      courseCode: record.courseCode,
      courseName: record.courseName,
      title: record.title,
      dueDate: record.dueDate,
      dueTime: record.dueTime,
      venue: record.venue ?? '',
      instructor: record.instructor ?? '',
      notes: record.notes ?? '',
      reminder: record.reminder ?? '',
      colorLabel: record.colorLabel ?? 'blue',
      priority: record.priority,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormError('');
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.courseCode.trim() || !form.courseName.trim() || !form.title.trim() || !form.dueDate) {
      setFormError('Course code, course name, title, and due date are required.');
      return;
    }

    const record: AssignmentRecord = {
      id: editingId ?? Date.now(),
      courseCode: form.courseCode.trim().toUpperCase(),
      courseName: form.courseName.trim(),
      title: form.title.trim(),
      dueDate: form.dueDate,
      dueTime: form.dueTime || '23:59',
      venue: form.venue.trim() || undefined,
      instructor: form.instructor.trim() || undefined,
      notes: form.notes.trim() || undefined,
      reminder: form.reminder.trim() || undefined,
      colorLabel: getAutomaticColorLabel(form.priority),
      priority: form.priority,
      completed: editingId !== null ? assignments.find((a) => a.id === editingId)?.completed : false,
    };

    setAssignments((prev) => {
      if (editingId !== null) {
        return prev.map((a) => (a.id === editingId ? record : a));
      }
      return [...prev, record];
    });

    setSuccessMessage(editingId !== null ? 'Assignment updated.' : 'Assignment added.');
    closeModal();
  };

  const handleDelete = (id: number) => {
    setAssignments((prev) => prev.filter((a) => a.id !== id));
    setSuccessMessage('Assignment deleted.');
    closeModal();
  };

  const toggleCompleted = (id: number) => {
    setAssignments((prev) => prev.map((a) => (a.id === id ? { ...a, completed: !a.completed } : a)));
  };

  const filtered = useMemo(() => {
    let list = assignments;

    switch (filterMode) {
      case 'upcoming':
        list = list.filter((a) => !a.completed && parseDue(a) >= now);
        break;
      case 'past':
        list = list.filter((a) => parseDue(a) < now);
        break;
      case 'completed':
        list = list.filter((a) => a.completed);
        break;
      case 'all':
      default:
        break;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (a) =>
          a.courseCode.toLowerCase().includes(q) ||
          a.courseName.toLowerCase().includes(q) ||
          a.title.toLowerCase().includes(q) ||
          (a.instructor?.toLowerCase().includes(q) ?? false)
      );
    }

    return sortAssignments(list, sortBy);
  }, [assignments, filterMode, searchQuery, sortBy, now]);

  const filterButtons: { key: FilterMode; label: string }[] = [
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'past', label: 'Past' },
    { key: 'completed', label: 'Completed' },
    { key: 'all', label: 'All' },
  ];

  if (loading) {
    return (
      <div className="py-12 text-center text-gray-500 text-[10px] uppercase tracking-[0.3em] font-mono">
        Loading assignments...
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 font-mono pb-8 max-w-full overflow-x-hidden">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <span className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-bold">Coursework</span>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mt-1 flex items-center gap-3">
            <ClipboardList className="text-safe shrink-0" size={28} /> Assignments
          </h1>
          <p className="text-gray-500 text-xs mt-2">Track deadlines, priorities, and submission status.</p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="flex items-center gap-1.5 px-4 py-2 border border-gray-700 text-gray-300 text-[10px] uppercase tracking-wider hover:border-safe hover:text-safe active:bg-safe/10 transition-colors self-start"
        >
          <Plus size={12} /> Add Assignment
        </button>
      </motion.div>

      {successMessage && (
        <div className="border border-safe/40 bg-safe/10 px-4 py-2 text-safe text-[10px] uppercase tracking-widest">
          {successMessage}
        </div>
      )}

      {assignments.length === 0 ? (
        <section className="border-2 border-dashed border-gray-800 bg-surface/50 p-10 sm:p-14 text-center">
          <div className="mx-auto w-16 h-16 border-2 border-gray-700 flex items-center justify-center mb-6">
            <ClipboardList size={32} className="text-gray-600" />
          </div>
          <h2 className="text-xl font-bold text-white uppercase tracking-wide">No assignments yet.</h2>
          <p className="text-gray-500 text-xs mt-3 max-w-md mx-auto leading-relaxed">
            Add coursework and deadlines to stay ahead of submissions. Everything syncs to your account automatically.
          </p>
          <button
            type="button"
            onClick={openAddModal}
            className="mt-8 inline-flex items-center gap-2 px-6 py-3 border border-safe text-safe text-[10px] font-bold uppercase tracking-widest hover:bg-safe/10 transition-colors"
          >
            <Plus size={14} /> Add Assignment
          </button>
        </section>
      ) : (
        <>
          <div className="flex flex-col lg:flex-row gap-2">
            <div className="flex-1 flex items-center gap-2 px-3 py-2 border border-gray-800 bg-surface min-w-0">
              <Search size={14} className="text-gray-600 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search assignments..."
                className="bg-transparent outline-none text-xs text-gray-200 placeholder-gray-600 w-full min-w-0"
              />
            </div>
            <div className="flex items-center gap-2 px-3 py-2 border border-gray-800 bg-surface shrink-0">
              <ArrowUpDown size={14} className="text-gray-600" />
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)} className="bg-transparent outline-none text-xs text-gray-200 cursor-pointer">
                <option className="bg-surface" value="dueDate">Due Date</option>
                <option className="bg-surface" value="priority">Priority</option>
                <option className="bg-surface" value="code">Course Code</option>
                <option className="bg-surface" value="alphabetical">Title</option>
              </select>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 border border-gray-800 bg-surface shrink-0">
              <Filter size={14} className="text-gray-600" />
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {filterButtons.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilterMode(key)}
                className={`px-2.5 py-1 border text-[10px] uppercase tracking-wider ${
                  filterMode === key ? 'border-safe text-safe bg-safe/10' : 'border-gray-800 text-gray-500 hover:border-gray-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <p className="text-gray-600 text-xs">No assignments match your filters.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {filtered.map((record) => {
                const due = parseDue(record);
                const isPast = due < now;
                const colorKey = record.colorLabel ?? 'blue';

                return (
                  <div
                    id={`assignment-${record.id}`}
                    key={record.id}
                    className={`flex flex-col sm:flex-row sm:items-start justify-between gap-3 p-4 bg-surface border-l-4 border-gray-800 border-t border-r border-b hover:border-gray-600 transition-all ${
                      record.completed ? 'opacity-60' : ''
                    } ${highlightedAssignment === record.id ? 'ring-2 ring-safe' : ''}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-2 mb-1">
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 border rounded ${COLOR_ACCENT[colorKey]}`}>{colorKey}</span>
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 border rounded ${PRIORITY_ACCENT[record.priority]}`}>{record.priority}</span>
                        {!isPast && !record.completed && (
                          <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 border border-safe/40 bg-safe/10 text-safe">Upcoming</span>
                        )}
                        {record.completed && (
                          <span className="flex items-center gap-1 text-[9px] font-bold uppercase px-1.5 py-0.5 border border-safe/40 bg-safe/10 text-safe">
                            <CheckCircle2 size={9} /> Done
                          </span>
                        )}
                      </div>
                      <h5 className="text-white font-bold text-lg">
                        <span className="text-xs text-gray-500 mr-2">{record.courseCode}</span>
                        {record.title}
                      </h5>
                      <p className="text-gray-400 text-xs mt-1">{record.courseName}</p>
                      <div className="flex flex-wrap gap-3 text-gray-500 text-[10px] mt-2">
                        <span className="flex items-center gap-1"><CalendarDays size={10} /> {record.dueDate}</span>
                        <span className="flex items-center gap-1"><Clock size={10} /> {record.dueTime}</span>
                        {record.venue && <span className="flex items-center gap-1"><MapPin size={10} /> {record.venue}</span>}
                        {record.instructor && <span className="flex items-center gap-1"><User size={10} /> {record.instructor}</span>}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button type="button" onClick={() => toggleCompleted(record.id)} className="w-8 h-8 flex items-center justify-center border border-gray-700 text-gray-500 hover:border-safe hover:text-safe">
                        <CheckCircle2 size={14} />
                      </button>
                      <button type="button" onClick={() => openEditModal(record)} className="w-8 h-8 flex items-center justify-center border border-gray-700 text-gray-500 hover:border-safe hover:text-safe">
                        <Pencil size={12} />
                      </button>
                      <button type="button" onClick={() => handleDelete(record.id)} className="w-8 h-8 flex items-center justify-center border border-gray-700 text-gray-500 hover:border-panic hover:text-panic">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-void border-2 border-gray-800 p-6"
            >
              <div className="absolute -top-2 -left-2 w-4 h-4 border-l-2 border-t-2 border-safe" />
              <div className="absolute -bottom-2 -right-2 w-4 h-4 border-r-2 border-b-2 border-safe" />
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-900">
                <h2 className="text-lg font-bold text-white uppercase">{editingId !== null ? 'Edit Assignment' : 'Add Assignment'}</h2>
                <button type="button" onClick={closeModal} className="w-7 h-7 flex items-center justify-center border border-gray-800 text-gray-500 hover:text-white">
                  <X size={14} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className={labelClass}>Course Name</label>
                  <input value={form.courseName} onChange={(e) => setForm((p) => ({ ...p, courseName: e.target.value }))} className={inputClass} required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Course Code</label>
                    <input value={form.courseCode} onChange={(e) => setForm((p) => ({ ...p, courseCode: e.target.value }))} className={inputClass} required />
                  </div>
                  <div>
                    <label className={labelClass}>Priority</label>
                    <select value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value as AssignmentPriority }))} className={inputClass}>
                      {PRIORITY_OPTIONS.map((p) => (
                        <option key={p} value={p} className="bg-void">{p}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Assignment Title</label>
                  <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} className={inputClass} required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Due Date</label>
                    <input type="date" value={form.dueDate} onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))} className={inputClass} required />
                  </div>
                  <div>
                    <label className={labelClass}>Due Time</label>
                    <input type="time" value={form.dueTime} onChange={(e) => setForm((p) => ({ ...p, dueTime: e.target.value }))} className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Venue (optional)</label>
                  <input value={form.venue} onChange={(e) => setForm((p) => ({ ...p, venue: e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Instructor (optional)</label>
                  <input value={form.instructor} onChange={(e) => setForm((p) => ({ ...p, instructor: e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Reminder (optional)</label>
                  <input value={form.reminder} onChange={(e) => setForm((p) => ({ ...p, reminder: e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Notes (optional)</label>
                  <input value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} className={inputClass} />
                </div>
                {formError && <p className="text-panic text-[10px] uppercase">{formError}</p>}
                <div className="flex gap-3 pt-2">
                  <button type="submit" className="flex-1 py-2 border border-gray-700 text-gray-300 text-[10px] uppercase hover:border-safe hover:text-safe">Save</button>
                  <button type="button" onClick={closeModal} className="flex-1 py-2 border border-gray-800 text-gray-500 text-[10px] uppercase">Cancel</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Assignments;
