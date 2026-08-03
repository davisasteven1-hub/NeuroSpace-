import React, { useState, FormEvent } from 'react';
import { X, Trash2 } from 'lucide-react';
import { Exam, ExamColorLabel } from '../types';

interface ExamFormProps {
  exam: Exam | null;
  onSave: (exam: Exam) => void;
  onDelete?: (courseCode: string) => void;
  onClose: () => void;
}

const URGENCY_OPTIONS: Exam['urgency'][] = ['EXTREME', 'CRITICAL', 'HIGH', 'MODERATE', 'LOW'];

const COLOR_OPTIONS: { value: ExamColorLabel; label: string; className: string }[] = [
  { value: 'blue', label: 'Blue', className: 'bg-blue-500' },
  { value: 'purple', label: 'Purple', className: 'bg-purple-500' },
  { value: 'green', label: 'Green', className: 'bg-green-500' },
  { value: 'yellow', label: 'Yellow', className: 'bg-yellow-500' },
  { value: 'pink', label: 'Pink', className: 'bg-pink-500' },
  { value: 'orange', label: 'Orange', className: 'bg-orange-500' },
  { value: 'cyan', label: 'Cyan', className: 'bg-cyan-500' },
];

const inputClass =
  'w-full bg-void border border-gray-800 px-3 py-2 text-xs font-mono text-gray-200 placeholder-gray-600 outline-none focus:border-gray-600 transition-colors disabled:opacity-50';

const labelClass = 'block text-[10px] uppercase tracking-widest text-gray-500 font-mono font-bold mb-1.5';

export const ExamForm: React.FC<ExamFormProps> = ({ exam, onSave, onDelete, onClose }) => {
  const [courseCode, setCourseCode] = useState(exam?.course_code ?? '');
  const [courseName, setCourseName] = useState(exam?.course_name ?? '');
  const [date, setDate] = useState(exam?.date ?? '');
  const [time, setTime] = useState(exam?.time ?? '');
  const [duration, setDuration] = useState(exam?.duration ?? '3 hours');
  const [urgency, setUrgency] = useState<Exam['urgency']>(exam?.urgency ?? 'HIGH');
  const [venue, setVenue] = useState(exam?.venue ?? '');
  const [instructor, setInstructor] = useState(exam?.instructor ?? '');
  const [notes, setNotes] = useState(exam?.notes ?? '');
  const [reminder, setReminder] = useState(exam?.reminder ?? '');
  const [colorLabel, setColorLabel] = useState<ExamColorLabel>(exam?.colorLabel ?? 'blue');
  const [error, setError] = useState('');

  const isEditing = !!exam;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!courseCode.trim() || !courseName.trim() || !date || !time || !venue.trim()) {
      setError('Course code, name, date, time, and venue are required.');
      return;
    }

    const payload: Exam = {
      ...(exam ?? {}),
      course_code: courseCode.trim().toUpperCase(),
      course_name: courseName.trim(),
      date,
      time,
      duration: duration.trim() || '3 hours',
      urgency,
      venue: venue.trim(),
      instructor: instructor.trim() || undefined,
      notes: notes.trim() || undefined,
      reminder: reminder.trim() || undefined,
      colorLabel,
      createdAt: exam?.createdAt ?? new Date().toISOString(),
    };

    onSave(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-void border-2 border-gray-800 p-6">
      <div className="absolute -top-2 -left-2 w-4 h-4 border-l-2 border-t-2 border-safe" />
      <div className="absolute -bottom-2 -right-2 w-4 h-4 border-r-2 border-b-2 border-safe" />

      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-900">
        <h3 className="text-lg font-bold text-white uppercase tracking-wide">
          {isEditing ? 'Edit Exam' : 'Add Exam'}
        </h3>
        <button type="button" onClick={onClose} className="w-7 h-7 flex items-center justify-center border border-gray-800 text-gray-500 hover:border-gray-600 hover:text-white transition-colors">
          <X size={14} />
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className={labelClass}>Course Name</label>
          <input value={courseName} onChange={(e) => setCourseName(e.target.value)} className={inputClass} placeholder="Data Structures" required />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Course Code</label>
            <input value={courseCode} onChange={(e) => setCourseCode(e.target.value)} disabled={isEditing} className={inputClass} placeholder="CS301" required />
          </div>
          <div>
            <label className={labelClass}>Priority</label>
            <select value={urgency} onChange={(e) => setUrgency(e.target.value as Exam['urgency'])} className={inputClass}>
              {URGENCY_OPTIONS.map((u) => (
                <option key={u} value={u} className="bg-void">
                  {u}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} required />
          </div>
          <div>
            <label className={labelClass}>Time</label>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={inputClass} required />
          </div>
        </div>

        <div>
          <label className={labelClass}>Venue</label>
          <input value={venue} onChange={(e) => setVenue(e.target.value)} className={inputClass} placeholder="Hall B" required />
        </div>

        <div>
          <label className={labelClass}>Instructor (optional)</label>
          <input value={instructor} onChange={(e) => setInstructor(e.target.value)} className={inputClass} placeholder="Dr. Smith" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Duration</label>
            <input value={duration} onChange={(e) => setDuration(e.target.value)} className={inputClass} placeholder="3 hours" />
          </div>
          <div>
            <label className={labelClass}>Reminder (optional)</label>
            <input value={reminder} onChange={(e) => setReminder(e.target.value)} className={inputClass} placeholder="1 day before, 1 hour before" />
          </div>
        </div>

        <div>
          <label className={labelClass}>Notes (optional)</label>
          <input value={notes} onChange={(e) => setNotes(e.target.value)} className={inputClass} placeholder="Bring calculator, ID card..." />
        </div>

        <div>
          <label className={labelClass}>Color Label</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {COLOR_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setColorLabel(option.value)}
                className={`flex items-center gap-2 px-2 py-1 border text-[10px] font-mono uppercase tracking-wider ${
                  colorLabel === option.value ? 'border-safe text-safe bg-safe/10' : 'border-gray-800 text-gray-500 hover:border-gray-600'
                }`}
              >
                <span className={`w-3 h-3 rounded-sm ${option.className}`} />
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-panic text-[10px] font-mono uppercase tracking-wide">{error}</p>}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button type="submit" className="flex-1 py-2 border border-gray-700 text-gray-300 text-[10px] font-mono uppercase tracking-wider hover:border-safe hover:text-safe active:bg-safe/10 transition-colors">
            Save
          </button>
          {isEditing && onDelete && (
            <button
              type="button"
              onClick={() => onDelete(exam!.course_code)}
              className="flex items-center justify-center gap-1 px-4 py-2 border border-panic/40 text-panic text-[10px] font-mono uppercase tracking-wider hover:bg-panic/10 transition-colors"
            >
              <Trash2 size={12} /> Delete
            </button>
          )}
          <button type="button" onClick={onClose} className="flex-1 py-2 border border-gray-800 text-gray-500 text-[10px] font-mono uppercase tracking-wider hover:border-gray-600 hover:text-gray-300 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
};
