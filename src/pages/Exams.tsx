import { useEffect, useMemo, useState } from 'react';
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
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  BookOpen,
  ArrowUpDown,
  User,
} from 'lucide-react';
import { Exam, ExamColorLabel } from '../types';
import { useExamStorage } from '../hooks/useExamStorage';
import { ExamForm } from '../components/ExamForm';
import { parseExamDate, getUrgencyColor, getUrgencyBg } from '../utils';

type SortOption = 'date' | 'priority' | 'code' | 'alphabetical';
type FilterMode = 'all' | 'upcoming' | 'past' | 'completed';

const COLOR_ACCENT: Record<ExamColorLabel, string> = {
  blue: 'border-blue-500/40 bg-blue-500/10 text-blue-300',
  purple: 'border-purple-500/40 bg-purple-500/10 text-purple-300',
  green: 'border-green-500/40 bg-green-500/10 text-green-300',
  yellow: 'border-yellow-500/40 bg-yellow-500/10 text-yellow-300',
  pink: 'border-pink-500/40 bg-pink-500/10 text-pink-300',
  orange: 'border-orange-500/40 bg-orange-500/10 text-orange-300',
  cyan: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300',
};

const isCompleted = (exam: Exam) => !!exam.completed;

const formatCountdown = (target: Date, now: Date) => {
  const ms = target.getTime() - now.getTime();
  if (ms <= 0) return 'Started or passed';
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  return `${minutes}m ${seconds}s`;
};

const sortExams = (list: Exam[], sortBy: SortOption): Exam[] => {
  const copy = [...list];
  switch (sortBy) {
    case 'priority': {
      const rank: Record<Exam['urgency'], number> = { EXTREME: 4, CRITICAL: 3, HIGH: 2, MODERATE: 1, LOW: 0 };
      return copy.sort((a, b) => rank[b.urgency] - rank[a.urgency]);
    }
    case 'code':
      return copy.sort((a, b) => a.course_code.localeCompare(b.course_code));
    case 'alphabetical':
      return copy.sort((a, b) => a.course_name.localeCompare(b.course_name));
    case 'date':
    default:
      return copy.sort(
        (a, b) => parseExamDate(a.date, a.time).getTime() - parseExamDate(b.date, b.time).getTime()
      );
  }
};

const Exams = () => {
  const [exams, , loading, storageError, commitExams] = useExamStorage();
  const [successMessage, setSuccessMessage] = useState('');
  const [now, setNow] = useState(() => new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [filterMode, setFilterMode] = useState<FilterMode>('upcoming');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Deep-link highlight support: if routed with location.state.highlightExam, scroll + highlight.
  const location = useLocation();
  const [highlightedExam, setHighlightedExam] = useState<string | null>(null);
  useEffect(() => {
    const code = (location.state as any)?.highlightExam as string | undefined;
    if (!code) return;
    setHighlightedExam(code);
    const el = document.getElementById(`exam-${code}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-safe');
      setTimeout(() => el.classList.remove('ring-2', 'ring-safe'), 3500);
    }
    // clear navigation state to avoid repeated highlights on reload
    try { window.history.replaceState({}, document.title, window.location.pathname + window.location.search); } catch {};
  }, [location]);

  useEffect(() => {
    if (!successMessage) return;
    const timer = window.setTimeout(() => setSuccessMessage(''), 3000);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

  const openAddModal = () => {
    setEditingExam(null);
    setIsModalOpen(true);
  };

  const openEditModal = (exam: Exam) => {
    setEditingExam(exam);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingExam(null);
  };

  const handleSave = async (exam: Exam) => {
    try {
      await commitExams((prev) => {
      const exists = prev.some((e) => e.course_code === exam.course_code);
      if (exists) {
        return prev.map((e) => (e.course_code === exam.course_code ? { ...e, ...exam } : e));
      }
      return [...prev, exam];
      });
      setFilterMode('all');
      setSearchQuery('');
      setSuccessMessage(editingExam ? 'Exam updated.' : 'Exam added.');
      closeModal();
    } catch {
      // The hook exposes the storage failure in the page error panel.
    }
  };

  const handleDelete = async (courseCode: string) => {
    try {
      await commitExams((prev) => prev.filter((e) => e.course_code !== courseCode));
      setSuccessMessage('Exam deleted.');
      closeModal();
    } catch {
      // The hook exposes the storage failure in the page error panel.
    }
  };

  const toggleCompleted = async (courseCode: string) => {
    try {
      await commitExams((prev) =>
      prev.map((e) => (e.course_code === courseCode ? { ...e, completed: !isCompleted(e) } : e))
      );
    } catch {
      // The hook exposes the storage failure in the page error panel.
    }
  };

  const nextUpcoming = useMemo(() => {
    return exams
      .filter((e) => !isCompleted(e) && parseExamDate(e.date, e.time) > now)
      .sort((a, b) => parseExamDate(a.date, a.time).getTime() - parseExamDate(b.date, b.time).getTime())[0] ?? null;
  }, [exams, now]);

  const filteredExams = useMemo(() => {
    let list = exams;

    switch (filterMode) {
      case 'upcoming':
        list = list.filter((e) => !isCompleted(e) && parseExamDate(e.date, e.time) >= now);
        break;
      case 'past':
        list = list.filter((e) => parseExamDate(e.date, e.time) < now);
        break;
      case 'completed':
        list = list.filter(isCompleted);
        break;
      case 'all':
      default:
        break;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (e) =>
          e.course_code.toLowerCase().includes(q) ||
          e.course_name.toLowerCase().includes(q) ||
          e.venue.toLowerCase().includes(q) ||
          (e.instructor?.toLowerCase().includes(q) ?? false)
      );
    }

    return sortExams(list, sortBy);
  }, [exams, filterMode, searchQuery, sortBy, now]);

  const filterButtons: { key: FilterMode; label: string }[] = [
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'past', label: 'Past' },
    { key: 'completed', label: 'Completed' },
    { key: 'all', label: 'All' },
  ];

  if (loading) {
    return (
      <div className="flex flex-col gap-4 font-mono py-12 items-center justify-center text-gray-500 text-[10px] uppercase tracking-[0.3em]">
        Loading exams...
      </div>
    );
  }

  if (storageError && exams.length === 0) {
    return (
      <div className="font-mono border border-panic/40 bg-panic/5 p-6 text-center">
        <p className="text-panic text-xs uppercase tracking-widest mb-4">{storageError}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 font-mono pb-8 max-w-full overflow-x-hidden">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <span className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-bold">Assessment Tracker</span>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mt-1 flex items-center gap-3">
            <BookOpen className="text-safe shrink-0" size={28} /> Exams
          </h1>
          <p className="text-gray-500 text-xs mt-2 tracking-wide">Plan, track, and prepare for every exam in one place.</p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="flex items-center justify-center gap-1.5 px-4 py-2 border border-gray-700 text-gray-300 text-[10px] uppercase tracking-wider whitespace-nowrap hover:border-safe hover:text-safe active:bg-safe/10 transition-colors self-start"
        >
          <Plus size={12} /> Add Exam
        </button>
      </motion.div>

      {successMessage && (
        <div className="border border-safe/40 bg-safe/10 px-4 py-2 text-safe text-[10px] uppercase tracking-widest">
          {successMessage}
        </div>
      )}

      {storageError && exams.length > 0 && (
        <div className="border border-panic/40 bg-panic/5 px-4 py-2 text-panic text-[10px] uppercase tracking-widest">
          {storageError}
        </div>
      )}

      {nextUpcoming && exams.length > 0 && (
        <section className="relative group">
          <div className="absolute -top-2 -left-2 w-4 h-4 border-l-2 border-t-2 border-safe" />
          <div className="absolute -bottom-2 -right-2 w-4 h-4 border-r-2 border-b-2 border-safe" />
          <div className="border-2 border-safe/40 bg-surface p-5 sm:p-6">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-safe/10 text-safe border border-safe/40 mb-3">
              Upcoming
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              {nextUpcoming.course_code} — {nextUpcoming.course_name}
            </h2>
            <p className="text-safe text-xs mt-2 font-mono">
              Countdown: {formatCountdown(parseExamDate(nextUpcoming.date, nextUpcoming.time), now)}
            </p>
            <div className="flex flex-wrap gap-3 text-gray-400 text-[10px] mt-3">
              <span className="flex items-center gap-1">
                <CalendarDays size={10} /> {nextUpcoming.date}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={10} /> {nextUpcoming.time}
              </span>
              <span className="flex items-center gap-1">
                <MapPin size={10} /> {nextUpcoming.venue}
              </span>
            </div>
          </div>
        </section>
      )}

      {exams.length === 0 ? (
        <section className="border-2 border-dashed border-gray-800 bg-surface/50 p-10 sm:p-14 text-center">
          <div className="mx-auto w-16 h-16 border-2 border-gray-700 flex items-center justify-center mb-6">
            <BookOpen size={32} className="text-gray-600" />
          </div>
          <h2 className="text-xl font-bold text-white uppercase tracking-wide">No exams yet.</h2>
          <p className="text-gray-500 text-xs mt-3 max-w-md mx-auto leading-relaxed">
            Add your first exam to start countdowns, reminders, and preparation tracking. Your schedule stays synced to your account.
          </p>
          <button
            type="button"
            onClick={openAddModal}
            className="mt-8 inline-flex items-center gap-2 px-6 py-3 border border-safe text-safe text-[10px] font-bold uppercase tracking-widest hover:bg-safe/10 transition-colors"
          >
            <Plus size={14} /> Add Exam
          </button>
        </section>
      ) : (
        <>
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2">
            <div className="flex-1 flex items-center gap-2 px-3 py-2 border border-gray-800 bg-surface min-w-0">
              <Search size={14} className="text-gray-600 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search course, venue, instructor..."
                className="bg-transparent outline-none text-xs text-gray-200 placeholder-gray-600 w-full min-w-0"
              />
            </div>
            <div className="flex items-center gap-2 px-3 py-2 border border-gray-800 bg-surface shrink-0">
              <ArrowUpDown size={14} className="text-gray-600" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-transparent outline-none text-xs text-gray-200 cursor-pointer"
              >
                <option className="bg-surface" value="date">Date</option>
                <option className="bg-surface" value="priority">Priority</option>
                <option className="bg-surface" value="code">Course Code</option>
                <option className="bg-surface" value="alphabetical">Alphabetical</option>
              </select>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 border border-gray-800 bg-surface shrink-0">
              <Filter size={14} className="text-gray-600" />
              <span className="text-[10px] text-gray-500 uppercase hidden sm:inline">Filter</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
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

          {filteredExams.length === 0 ? (
            <p className="text-gray-600 text-xs px-1">No exams match your search or filters.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredExams.map((exam) => {
                const examDate = parseExamDate(exam.date, exam.time);
                const isPast = examDate < now;
                const colorKey = exam.colorLabel ?? 'blue';
                const accent = COLOR_ACCENT[colorKey];
                const completed = isCompleted(exam);

                return (
                  <div
                    id={`exam-${exam.course_code}`}
                    key={exam.course_code}
                    className={`group relative flex flex-col sm:flex-row sm:items-start justify-between gap-3 p-4 bg-surface border-l-4 border-t border-r border-b border-gray-800 hover:border-gray-600 transition-all ${
                      completed ? 'opacity-60' : ''
                    } ${getUrgencyColor(exam.urgency).split(' ')[1] ?? 'border-gray-800'} ${highlightedExam === exam.course_code ? 'ring-2 ring-safe' : ''}`}
                  >
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 border rounded ${accent}`}>
                          {colorKey}
                        </span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 ${getUrgencyBg(exam.urgency)} ${getUrgencyColor(exam.urgency).split(' ')[0]}`}>
                          {exam.urgency}
                        </span>
                        {!isPast && !completed && (
                          <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 border border-safe/40 bg-safe/10 text-safe">
                            Upcoming
                          </span>
                        )}
                        {isPast && (
                          <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 border border-gray-700 text-gray-500">
                            Past
                          </span>
                        )}
                        {completed && (
                          <span className="flex items-center gap-1 text-[9px] font-bold uppercase px-1.5 py-0.5 border border-safe/40 bg-safe/10 text-safe">
                            <CheckCircle2 size={9} /> Done
                          </span>
                        )}
                      </div>
                      <h5 className="text-white font-bold text-lg leading-tight break-words">
                        <span className="text-xs text-gray-500 mr-2">{exam.course_code}</span>
                        {exam.course_name}
                      </h5>
                      <div className="flex flex-wrap items-center gap-3 text-gray-400 text-[10px] mt-1">
                        <span className="flex items-center gap-1">
                          <CalendarDays size={10} /> {exam.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={10} /> {exam.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin size={10} /> {exam.venue}
                        </span>
                        {exam.instructor && (
                          <span className="flex items-center gap-1">
                            <User size={10} /> {exam.instructor}
                          </span>
                        )}
                      </div>
                      {!completed && !isPast && (
                        <p className="text-caution text-[10px] mt-2">
                          Countdown: {formatCountdown(examDate, now)}
                        </p>
                      )}
                      {exam.reminder && (
                        <p className="text-gray-600 text-[10px] mt-1">Reminder: {exam.reminder}</p>
                      )}
                      {exam.notes && (
                        <p className="text-gray-500 text-[10px] mt-1 line-clamp-2">{exam.notes}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0 self-end sm:self-start">
                      <button
                        type="button"
                        onClick={() => toggleCompleted(exam.course_code)}
                        className={`w-8 h-8 flex items-center justify-center border transition-all ${
                          completed ? 'border-safe text-safe bg-safe/10' : 'border-gray-700 text-gray-500 hover:border-safe hover:text-safe'
                        }`}
                        title={completed ? 'Mark incomplete' : 'Mark complete'}
                      >
                        <CheckCircle2 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditModal(exam)}
                        className="w-8 h-8 flex items-center justify-center border border-gray-700 text-gray-500 hover:border-safe hover:text-safe active:bg-safe/10 transition-all"
                        title="Edit exam"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(exam.course_code)}
                        className="w-8 h-8 flex items-center justify-center border border-gray-700 text-gray-500 hover:border-panic hover:text-panic active:bg-panic/10 transition-all"
                        title="Delete exam"
                      >
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
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
            >
              <ExamForm
                exam={editingExam}
                onSave={handleSave}
                onDelete={editingExam ? handleDelete : undefined}
                onClose={closeModal}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Exams;
