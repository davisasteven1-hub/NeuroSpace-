import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function CalendarEventModal({ date, events, onClose }: { date: string | null; events: any[]; onClose: () => void; }) {
  const navigate = useNavigate();
  if (!date) return null;

  const openEvent = (ev: any) => {
    if (ev.type === 'exam') {
      navigate('/exams', { state: { highlightExam: ev.id } });
      onClose();
    } else if (ev.type === 'assignment') {
      navigate('/assignments', { state: { highlightAssignmentId: ev.id } });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-surface border-2 border-gray-800 p-4 rounded-t md:rounded">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-white">Events on {date}</h3>
          <button onClick={onClose} className="text-gray-400">Close</button>
        </div>
        <div className="flex flex-col gap-3">
          {events.length === 0 ? (
            <div className="text-gray-500 text-xs">No events on this date.</div>
          ) : events.map((ev) => (
            <div key={`${ev.type}-${ev.id}`} className="p-3 border border-gray-800 bg-void rounded flex items-start justify-between">
              <div>
                <div className="text-xs text-gray-400">{ev.type === 'exam' ? 'Exam' : 'Assignment'} • {ev.courseCode}</div>
                <div className="text-white font-bold">{ev.title}</div>
                <div className="text-gray-400 text-xs mt-1">{ev.time ?? 'All day'} {ev.venue ? `• ${ev.venue}` : ''} {ev.instructor ? `• ${ev.instructor}` : ''}</div>
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={() => openEvent(ev)} className="px-3 py-1 border border-gray-700 text-[10px] uppercase tracking-wider">Open {ev.type === 'exam' ? 'Exam' : 'Assignment'}</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
