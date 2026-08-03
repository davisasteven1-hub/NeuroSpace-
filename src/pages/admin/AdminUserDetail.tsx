import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Bot,
  CalendarDays,
  FileText,
  GraduationCap,
  Mail,
  ShieldCheck,
  TimerReset,
  UserRound,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchAdminUserDetail } from '../../services/adminApi';
import type { AdminUserDetail } from '../../types/admin';
import { formatBytes, formatDate, formatDateTime, formatRelativeDays } from '../../utils/adminFormat';

const GRADE_POINTS: Record<string, number> = { A: 5, B: 4, C: 3, D: 2, E: 1, F: 0 };

function Section({
  title,
  subtitle,
  icon: Icon,
  children,
}: {
  title: string;
  subtitle: string;
  icon: typeof UserRound;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-gray-800 bg-surface p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500">{subtitle}</p>
          <h2 className="mt-2 text-xl font-bold uppercase tracking-wide text-white">{title}</h2>
        </div>
        <Icon size={18} className="text-safe" />
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function EmptyState({ message }: { message: string }) {
  return <div className="border border-gray-800 bg-void p-4 text-sm text-gray-400">{message}</div>;
}

function buildGpaSummary(detail: AdminUserDetail | null) {
  const semesters = detail?.gpa?.semesters ?? [];
  let totalUnits = 0;
  let totalPoints = 0;

  const semesterRows = semesters.map((semester) => {
    let semesterUnits = 0;
    let semesterPoints = 0;

    for (const course of semester.courses) {
      const units = Number(course.units) || 0;
      const gradePoint = GRADE_POINTS[course.grade] ?? 0;
      semesterUnits += units;
      semesterPoints += units * gradePoint;
      totalUnits += units;
      totalPoints += units * gradePoint;
    }

    return {
      id: semester.id,
      label: `${semester.level} ${semester.term}`,
      gpa: semesterUnits ? (semesterPoints / semesterUnits).toFixed(2) : '--',
      units: semesterUnits,
      courses: semester.courses,
    };
  });

  return {
    semesterRows,
    cumulativeGpa: totalUnits ? (totalPoints / totalUnits).toFixed(2) : '--',
    creditsEarned: totalUnits,
  };
}

export default function AdminUserDetailPage() {
  const { id } = useParams();
  const { session } = useAuth();
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!session?.access_token || !id) return;

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const payload = await fetchAdminUserDetail(session.access_token, id);
        if (!cancelled) setDetail(payload);
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'Unable to load this administrator user profile.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [id, session?.access_token]);

  const gpaSummary = useMemo(() => buildGpaSummary(detail), [detail]);

  if (loading) {
    return (
      <div className="border border-gray-800 bg-surface p-6 font-mono text-gray-400">
        Loading administrator user detail...
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="space-y-4 font-mono">
        <Link to="/admin/dashboard" className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-safe">
          <ArrowLeft size={14} />
          Back to Admin Dashboard
        </Link>
        <div className="border border-panic/30 bg-panic/10 p-6 text-sm text-panic">
          {error || 'The requested user detail is unavailable.'}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 font-mono">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link to="/admin/dashboard" className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-safe">
            <ArrowLeft size={14} />
            Back to Admin Dashboard
          </Link>
          <h1 className="mt-3 text-3xl font-bold uppercase tracking-tight text-white">User Intelligence Profile</h1>
          <p className="mt-2 text-sm text-gray-400">
            Detailed academic, storage, and AI activity snapshot for a single account.
          </p>
        </div>
        <div className={`inline-flex items-center gap-2 border px-3 py-2 text-[10px] uppercase tracking-widest ${
          detail.auth.emailVerified
            ? 'border-safe/40 bg-safe/10 text-safe'
            : 'border-caution/40 bg-caution/10 text-caution'
        }`}>
          <ShieldCheck size={14} />
          {detail.auth.emailVerified ? 'Verified Account' : 'Verification Pending'}
        </div>
      </div>

      <Section title="Profile" subtitle="Identity Snapshot" icon={UserRound}>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div className="border border-gray-800 bg-void p-4">
            {detail.avatarUrl ? (
              <img src={detail.avatarUrl} alt={detail.profile?.display_name ?? detail.auth.email} className="h-48 w-full object-cover" />
            ) : (
              <div className="flex h-48 items-center justify-center border border-dashed border-gray-800 text-safe">
                <UserRound size={28} />
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="border border-gray-800 bg-void p-4">
              <p className="text-[10px] uppercase tracking-widest text-gray-500">Display Name</p>
              <p className="mt-2 text-lg font-bold uppercase tracking-wide text-white">{detail.profile?.display_name ?? 'Unnamed User'}</p>
            </div>
            <div className="border border-gray-800 bg-void p-4">
              <p className="text-[10px] uppercase tracking-widest text-gray-500">Email</p>
              <p className="mt-2 break-all text-sm text-white">{detail.auth.email}</p>
            </div>
            <div className="border border-gray-800 bg-void p-4">
              <p className="text-[10px] uppercase tracking-widest text-gray-500">Account Age</p>
              <p className="mt-2 text-lg font-bold text-white">{formatRelativeDays(detail.auth.createdAt)}</p>
            </div>
            <div className="border border-gray-800 bg-void p-4">
              <p className="text-[10px] uppercase tracking-widest text-gray-500">Last Sign In</p>
              <p className="mt-2 text-sm text-white">{formatDateTime(detail.auth.lastSignInAt)}</p>
            </div>
            <div className="border border-gray-800 bg-void p-4">
              <p className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-gray-500"><Mail size={12} /> Created</p>
              <p className="mt-2 text-sm text-white">{formatDateTime(detail.auth.createdAt)}</p>
            </div>
            <div className="border border-gray-800 bg-void p-4">
              <p className="text-[10px] uppercase tracking-widest text-gray-500">Verification</p>
              <p className={`mt-2 text-sm font-bold uppercase tracking-widest ${detail.auth.emailVerified ? 'text-safe' : 'text-caution'}`}>
                {detail.auth.emailVerified ? 'Verified' : 'Unverified'}
              </p>
            </div>
          </div>
        </div>
      </Section>

      <Section title="GPA" subtitle="Academic Performance" icon={GraduationCap}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="border border-gray-800 bg-void p-4">
            <p className="text-[10px] uppercase tracking-widest text-gray-500">Cumulative GPA</p>
            <p className="mt-2 text-3xl font-bold text-white">{gpaSummary.cumulativeGpa}</p>
          </div>
          <div className="border border-gray-800 bg-void p-4">
            <p className="text-[10px] uppercase tracking-widest text-gray-500">Credits Earned</p>
            <p className="mt-2 text-3xl font-bold text-white">{gpaSummary.creditsEarned}</p>
          </div>
          <div className="border border-gray-800 bg-void p-4">
            <p className="text-[10px] uppercase tracking-widest text-gray-500">Semesters</p>
            <p className="mt-2 text-3xl font-bold text-white">{gpaSummary.semesterRows.length}</p>
          </div>
        </div>

        {gpaSummary.semesterRows.length === 0 ? (
          <div className="mt-4">
            <EmptyState message="No GPA records have been stored for this user yet." />
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
            {gpaSummary.semesterRows.map((semester) => (
              <div key={semester.id} className="border border-gray-800 bg-void p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-gray-500">Semester GPA</p>
                    <h3 className="mt-1 text-lg font-bold uppercase tracking-wide text-white">{semester.label}</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-widest text-gray-500">GPA</p>
                    <p className="text-2xl font-bold text-safe">{semester.gpa}</p>
                  </div>
                </div>
                <div className="mt-4 text-[10px] uppercase tracking-widest text-gray-500">
                  Credits: <span className="text-white">{semester.units}</span>
                </div>
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full text-left text-xs">
                    <thead className="text-[10px] uppercase tracking-widest text-gray-500">
                      <tr>
                        <th className="pb-2 pr-4">Course</th>
                        <th className="pb-2 pr-4">Title</th>
                        <th className="pb-2 pr-4">Units</th>
                        <th className="pb-2">Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {semester.courses.map((course) => (
                        <tr key={course.id} className="border-t border-gray-800 text-gray-300">
                          <td className="py-2 pr-4 font-bold text-white">{course.code}</td>
                          <td className="py-2 pr-4">{course.title}</td>
                          <td className="py-2 pr-4">{course.units}</td>
                          <td className="py-2 text-safe">{course.grade}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Section title="Timetable" subtitle="Schedule Matrix" icon={CalendarDays}>
          {detail.timetable.length === 0 ? (
            <EmptyState message="No timetable rows are stored for this user." />
          ) : (
            <div className="space-y-3">
              {detail.timetable.map((course) => (
                <div key={course.id} className="border border-gray-800 bg-void p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-bold uppercase tracking-wide text-white">{course.code} · {course.title}</p>
                      <p className="mt-1 text-[10px] uppercase tracking-widest text-gray-500">{course.lecturer}</p>
                    </div>
                    <div className="text-[10px] uppercase tracking-widest text-safe">{course.day} · {course.start} - {course.end}</div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-[10px] uppercase tracking-widest text-gray-500">
                    <div>Location: <span className="text-white">{course.venue}</span></div>
                    <div>Units: <span className="text-white">{course.units}</span></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Exams" subtitle="Assessment Queue" icon={TimerReset}>
          {detail.exams.length === 0 ? (
            <EmptyState message="No exam rows are stored for this user." />
          ) : (
            <div className="space-y-3">
              {detail.exams.map((exam, index) => (
                <div key={`${exam.course_code}-${exam.date}-${index}`} className="border border-gray-800 bg-void p-4">
                  <p className="text-sm font-bold uppercase tracking-wide text-white">{exam.course_code} · {exam.course_name}</p>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-[10px] uppercase tracking-widest text-gray-500">
                    <div>Date: <span className="text-white">{formatDate(exam.date)}</span></div>
                    <div>Time: <span className="text-white">{exam.time}</span></div>
                    <div>Venue: <span className="text-white">{exam.venue}</span></div>
                    <div>Urgency: <span className="text-white">{exam.urgency}</span></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Section title="Assignments" subtitle="Task Inventory" icon={FileText}>
          {detail.assignments.length === 0 ? (
            <EmptyState message="No assignment rows are stored for this user." />
          ) : (
            <div className="space-y-3">
              {detail.assignments.map((assignment) => (
                <div key={assignment.id} className="border border-gray-800 bg-void p-4">
                  <p className="text-sm font-bold uppercase tracking-wide text-white">{assignment.title}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-widest text-gray-500">{assignment.courseCode} · {assignment.courseName}</p>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-[10px] uppercase tracking-widest text-gray-500">
                    <div>Due: <span className="text-white">{assignment.dueDate} {assignment.dueTime}</span></div>
                    <div>Priority: <span className="text-white">{assignment.priority}</span></div>
                    <div>Status: <span className="text-white">{assignment.completed ? 'Completed' : 'Open'}</span></div>
                    <div>Lecturer: <span className="text-white">{assignment.instructor ?? 'Unknown'}</span></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="AI Activity" subtitle="Conversation Metrics" icon={Bot}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="border border-gray-800 bg-void p-4">
              <p className="text-[10px] uppercase tracking-widest text-gray-500">Conversations</p>
              <p className="mt-2 text-3xl font-bold text-white">{detail.ai.conversations}</p>
            </div>
            <div className="border border-gray-800 bg-void p-4">
              <p className="text-[10px] uppercase tracking-widest text-gray-500">Last Interaction</p>
              <p className="mt-2 text-sm text-white">{formatDateTime(detail.ai.lastInteractionAt)}</p>
            </div>
            <div className="border border-gray-800 bg-void p-4">
              <p className="text-[10px] uppercase tracking-widest text-gray-500">Total Messages</p>
              <p className="mt-2 text-3xl font-bold text-white">{detail.ai.totalMessages}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div className="border border-gray-800 bg-void p-4">
              <p className="text-[10px] uppercase tracking-widest text-gray-500">Recent Conversations</p>
              <div className="mt-3 space-y-3">
                {detail.ai.conversationsList.length === 0 && <p className="text-sm text-gray-400">No AI conversations recorded.</p>}
                {detail.ai.conversationsList.slice(0, 8).map((chat) => (
                  <div key={chat.id} className="border border-gray-800 bg-surface p-3">
                    <p className="truncate text-xs font-bold uppercase tracking-wide text-white">{chat.title}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-widest text-gray-500">
                      Updated {formatDateTime(chat.updated_at)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-gray-800 bg-void p-4">
              <p className="text-[10px] uppercase tracking-widest text-gray-500">Recent Messages</p>
              <div className="mt-3 space-y-3">
                {detail.ai.recentMessages.length === 0 && <p className="text-sm text-gray-400">No AI messages recorded.</p>}
                {detail.ai.recentMessages.slice(0, 8).map((message) => (
                  <div key={message.id} className="border border-gray-800 bg-surface p-3">
                    <p className="text-[10px] uppercase tracking-widest text-safe">{message.role}</p>
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-gray-300">{message.content}</p>
                    <p className="mt-2 text-[10px] uppercase tracking-widest text-gray-500">{formatDateTime(message.created_at)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>
      </div>

      <Section title="Notes and Files" subtitle="Document Inventory" icon={FileText}>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="border border-gray-800 bg-void p-4">
            <p className="text-[10px] uppercase tracking-widest text-gray-500">Notes</p>
            <div className="mt-3 space-y-3">
              {detail.notes.length === 0 && <p className="text-sm text-gray-400">No notes stored for this user.</p>}
              {detail.notes.slice(0, 12).map((note) => (
                <div key={note.id} className="border border-gray-800 bg-surface p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate text-sm font-bold uppercase tracking-wide text-white">{note.title}</p>
                    <span className={note.trashed ? 'text-panic text-[10px] uppercase tracking-widest' : 'text-safe text-[10px] uppercase tracking-widest'}>
                      {note.trashed ? 'Trashed' : 'Active'}
                    </span>
                  </div>
                  <p className="mt-2 text-[10px] uppercase tracking-widest text-gray-500">
                    Updated {formatDateTime(note.updatedAt)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-gray-800 bg-void p-4">
            <p className="text-[10px] uppercase tracking-widest text-gray-500">Files</p>
            <div className="mt-3 space-y-3">
              {detail.noteFiles.length === 0 && <p className="text-sm text-gray-400">No uploaded files stored for this user.</p>}
              {detail.noteFiles.slice(0, 12).map((file) => (
                <div key={file.id} className="border border-gray-800 bg-surface p-3">
                  <p className="truncate text-sm font-bold uppercase tracking-wide text-white">{file.name}</p>
                  <div className="mt-2 grid grid-cols-2 gap-3 text-[10px] uppercase tracking-widest text-gray-500">
                    <div>Note: <span className="text-white">{file.noteTitle ?? 'Detached file'}</span></div>
                    <div>Size: <span className="text-white">{formatBytes(file.size)}</span></div>
                    <div>Type: <span className="text-white">{file.extension.toUpperCase()}</span></div>
                    <div>Uploaded: <span className="text-white">{formatDateTime(file.uploadedAt)}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
