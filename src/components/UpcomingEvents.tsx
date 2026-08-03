import React, { useMemo } from 'react';
import { CalendarDays } from 'lucide-react';
import { useExamStorage } from '../hooks/useExamStorage';
import { useAssignmentStorage } from '../hooks/useAssignmentStorage';
import { parseExamDate } from '../utils';

function daysUntil(dateStr: string) {
  const [y,m,d] = dateStr.split('-').map(Number);
  const now = new Date();
  const target = new Date(y,m-1,d);
  const diff = Math.ceil((target.getTime() - now.getTime()) / (1000*60*60*24));
  return diff;
}

export default function UpcomingEvents() {
  const [exams] = useExamStorage();
  const [assignments] = useAssignmentStorage();

  const next7 = useMemo(() => {
    const now = new Date();
    const examsNext = exams
      .filter(e => parseExamDate(e.date, e.time) >= now)
      .map(e => ({ type: 'exam', id: e.course_code, title: e.course_name, courseCode: e.course_code, days: Math.ceil((parseExamDate(e.date,e.time).getTime()-now.getTime())/(1000*60*60*24)) }))
      .sort((a,b)=>a.days-b.days);
    const assignmentsNext = assignments
      .filter(a => {
        const d = new Date(a.dueDate + 'T' + (a.dueTime ?? '23:59'));
        return d >= now;
      })
      .map(a => ({ type: 'assignment', id: a.id, title: a.title, courseCode: a.courseCode, days: Math.ceil((new Date(a.dueDate + 'T' + (a.dueTime ?? '23:59')).getTime()-now.getTime())/(1000*60*60*24)) }))
      .sort((a,b)=>a.days-b.days);

    return {
      nextExam: examsNext[0] ?? null,
      nextAssignment: assignmentsNext[0] ?? null,
    };
  }, [exams, assignments]);

  return (
    <div className="w-full min-w-0 overflow-hidden border-2 border-gray-800 bg-surface p-4">
      <div className="flex items-center justify-between mb-2 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <CalendarDays className="text-safe shrink-0" />
          <h4 className="text-sm font-bold text-white truncate">Next 7 days</h4>
        </div>
      </div>
      <div className="flex flex-col gap-2 min-w-0">
        {next7.nextExam ? (
          <div className="flex items-center gap-3 min-w-0">
            <div className="text-[10px] text-gray-400 shrink-0">📕</div>
            <div className="min-w-0 flex-1">
              <div className="text-xs text-gray-500 truncate">{next7.nextExam.courseCode}</div>
              <div className="text-sm text-white font-bold break-words">
                {next7.nextExam.title} — {next7.nextExam.days} days left
              </div>
            </div>
          </div>
        ) : (
          <div className="text-gray-500 text-xs">No upcoming exams in the next 7 days.</div>
        )}

        {next7.nextAssignment ? (
          <div className="flex items-center gap-3 min-w-0">
            <div className="text-[10px] text-gray-400 shrink-0">📝</div>
            <div className="min-w-0 flex-1">
              <div className="text-xs text-gray-500 truncate">{next7.nextAssignment.courseCode}</div>
              <div className="text-sm text-white font-bold break-words">
                {next7.nextAssignment.title} — {next7.nextAssignment.days} days left
              </div>
            </div>
          </div>
        ) : (
          <div className="text-gray-500 text-xs">No upcoming assignments in the next 7 days.</div>
        )}
      </div>
    </div>
  );
}