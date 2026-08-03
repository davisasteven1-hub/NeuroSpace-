import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useExamStorage } from '../hooks/useExamStorage';
import { useAssignmentStorage } from '../hooks/useAssignmentStorage';
import CalendarEventModal from './CalendarEventModal';

function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }
function daysInMonth(d: Date) { return endOfMonth(d).getDate(); }
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function formatDateYMD(d: Date) { return d.toISOString().slice(0, 10); }
function daysUntil(target: Date, now: Date) { return Math.floor((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)); }

function urgencyColorForExam(days: number) {
  if (days <= 2) return 'bg-panic';
  if (days <= 6) return 'bg-orange-500/70';
  if (days <= 14) return 'bg-yellow-500/60';
  return 'bg-green-600/60';
}
function urgencyColorForAssignment(days: number) {
  if (days < 0) return 'bg-panic';
  if (days <= 2) return 'bg-panic';
  if (days <= 6) return 'bg-orange-500/70';
  if (days <= 14) return 'bg-yellow-500/60';
  return 'bg-green-600/60';
}

export default function AcademicCalendar() {
  const [exams] = useExamStorage();
  const [assignments] = useAssignmentStorage();
  const [current, setCurrent] = useState(() => startOfMonth(new Date()));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const now = new Date();

  const eventsByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    exams.forEach((e) => {
      const d = e.date;
      if (!d) return;
      map[d] = map[d] ?? [];
      map[d].push({ type: 'exam', id: e.course_code, title: e.course_name, courseCode: e.course_code, date: d, time: e.time, venue: e.venue, instructor: e.instructor });
    });
    assignments.forEach((a) => {
      const d = a.dueDate;
      if (!d) return;
      map[d] = map[d] ?? [];
      map[d].push({ type: 'assignment', id: a.id, title: a.title, courseCode: a.courseCode, date: d, time: a.dueTime, venue: a.venue, instructor: a.instructor, priority: a.priority });
    });
    return map;
  }, [exams, assignments]);

  const days = useMemo(() => {
    const first = startOfMonth(current);
    const firstWeekday = first.getDay();
    const total = daysInMonth(current);
    const cells: { date: Date | null }[] = [];
    for (let i = 0; i < firstWeekday; i++) cells.push({ date: null });
    for (let d = 1; d <= total; d++) cells.push({ date: new Date(current.getFullYear(), current.getMonth(), d) });
    return cells;
  }, [current]);

  const openForDate = (dateStr: string) => setSelectedDate(dateStr);

  return (
    <div className="w-full min-w-0 overflow-hidden border-2 border-gray-800 bg-surface p-3 sm:p-4">
      <div className="flex items-center justify-between mb-3 gap-2 min-w-0">
        <div className="min-w-0">
          <span className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-mono font-bold">Calendar</span>
          <h3 className="text-lg font-bold text-white truncate">Smart Academic Calendar</h3>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button aria-label="Previous month" onClick={() => setCurrent(addDays(startOfMonth(current), -1))} className="p-2 border border-gray-800">
            <ChevronLeft size={14} />
          </button>
          <button aria-label="Next month" onClick={() => setCurrent(addDays(endOfMonth(current), 1))} className="p-2 border border-gray-800">
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-xs w-full min-w-0">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
          <div key={d} className="min-w-0 text-gray-500 text-[9px] sm:text-[10px] uppercase tracking-widest text-center truncate">{d}</div>
        ))}

        {days.map((cell, idx) => {
          if (!cell.date) return <div key={idx} className="h-16 sm:h-20 min-w-0 p-1 border border-transparent" />;
          const ds = formatDateYMD(cell.date);
          const cellEvents = eventsByDate[ds] ?? [];
          const isToday = formatDateYMD(now) === ds;

          return (
            <button
              key={ds}
              onClick={() => openForDate(ds)}
              onMouseEnter={() => setHoveredDate(ds)}
              onMouseLeave={() => setHoveredDate(null)}
              onFocus={() => setHoveredDate(ds)}
              onBlur={() => setHoveredDate(null)}
              className="h-16 sm:h-20 min-w-0 w-full p-1 text-left border border-gray-800 hover:border-gray-600 transition-all flex flex-col rounded overflow-hidden"
              aria-label={`Open events for ${ds}`}
              style={ hoveredDate === ds ? { boxShadow: 'inset 0 0 80px 20px rgba(34,197,94,0.14), inset 0 0 40px 6px rgba(34,197,94,0.12)' } : undefined }
            >
              <div className="flex items-start justify-between min-w-0">
                <span className={`text-xs font-bold ${isToday ? 'text-safe' : 'text-gray-300'}`}>{cell.date.getDate()}</span>
                <span className="text-[9px] text-gray-500 shrink-0">{cellEvents.length ? `${cellEvents.length}` : ''}</span>
              </div>
              <div className="mt-1 flex-1 min-h-0 min-w-0 flex flex-col gap-1 overflow-hidden">
                {cellEvents.slice(0,3).map((ev, i) => {
                  const dateObj = new Date(ev.date + 'T' + (ev.time ?? '00:00'));
                  const daysAway = daysUntil(dateObj, now);
                  const color = ev.type === 'exam' ? urgencyColorForExam(daysAway) : urgencyColorForAssignment(daysAway);
                  return (
                    <div
                      key={i}
                      className={`min-w-0 max-w-full rounded text-[9px] sm:text-[10px] truncate px-1 py-0.5 ${color} text-black/90`}
                      title={`${ev.title} (${ev.courseCode})`}
                    >
                      {ev.type === 'exam' ? '📕 ' : '📝 '} {ev.courseCode} {ev.title ? `— ${ev.title}` : ''}
                    </div>
                  );
                })}
              </div>
            </button>
          );
        })}
      </div>

      <CalendarEventModal date={selectedDate} events={selectedDate ? eventsByDate[selectedDate] ?? [] : []} onClose={() => setSelectedDate(null)} />
    </div>
  );
}