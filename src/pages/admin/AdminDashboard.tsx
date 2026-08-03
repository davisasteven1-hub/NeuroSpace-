import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  BadgeCheck,
  Database,
  MailCheck,
  MailX,
  Search,
  Shield,
  Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchAdminUsers } from '../../services/adminApi';
import type { AdminUsersResponse, VerificationFilter } from '../../types/admin';
import { formatDateTime, formatGpa } from '../../utils/adminFormat';

const PAGE_SIZE = 10;

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  helper,
}: {
  label: string;
  value: string | number;
  icon: typeof Users;
  accent: string;
  helper: string;
}) {
  return (
    <div className="border border-gray-800 bg-surface p-5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500">{label}</p>
        <Icon size={16} className={accent} />
      </div>
      <p className="mt-4 text-3xl font-bold text-white">{value}</p>
      <p className="mt-2 text-xs leading-relaxed text-gray-500">{helper}</p>
    </div>
  );
}

function FilterChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border px-3 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${
        active
          ? 'border-safe/40 bg-safe/10 text-safe'
          : 'border-gray-800 text-gray-400 hover:border-gray-700 hover:text-white'
      }`}
    >
      {label}
    </button>
  );
}

function VerificationBars({ payload }: { payload: AdminUsersResponse }) {
  const total = Math.max(1, payload.overview.totalUsers);
  const verifiedWidth = (payload.overview.verifiedUsers / total) * 100;
  const unverifiedWidth = (payload.overview.unverifiedUsers / total) * 100;
  const activeWidth = (payload.overview.activeUsers / total) * 100;

  return (
    <div className="border border-gray-800 bg-surface p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500">Verification Map</p>
          <h2 className="mt-2 text-lg font-bold uppercase tracking-wide text-white">Identity and engagement distribution</h2>
        </div>
        <Shield size={18} className="text-safe" />
      </div>
      <div className="mt-6 space-y-4">
        <div>
          <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-widest text-gray-500">
            <span>Verified</span>
            <span>{payload.overview.verifiedUsers}</span>
          </div>
          <div className="h-3 overflow-hidden border border-gray-800 bg-void">
            <div className="h-full bg-safe" style={{ width: `${verifiedWidth}%` }} />
          </div>
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-widest text-gray-500">
            <span>Unverified</span>
            <span>{payload.overview.unverifiedUsers}</span>
          </div>
          <div className="h-3 overflow-hidden border border-gray-800 bg-void">
            <div className="h-full bg-caution" style={{ width: `${unverifiedWidth}%` }} />
          </div>
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-widest text-gray-500">
            <span>Active in last {payload.overview.activeWindowDays} days</span>
            <span>{payload.overview.activeUsers}</span>
          </div>
          <div className="h-3 overflow-hidden border border-gray-800 bg-void">
            <div className="h-full bg-white" style={{ width: `${activeWidth}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function AcademicCoverage({ payload }: { payload: AdminUsersResponse }) {
  const entries = [
    ['user_gpa', payload.overview.academicTotals.userGpa],
    ['user_timetable', payload.overview.academicTotals.userTimetable],
    ['user_exams', payload.overview.academicTotals.userExams],
    ['user_assignments', payload.overview.academicTotals.userAssignments],
    ['notes', payload.overview.academicTotals.notes],
    ['note_files', payload.overview.academicTotals.noteFiles],
    ['ai_chats', payload.overview.academicTotals.aiChats],
    ['ai_messages', payload.overview.academicTotals.aiMessages],
  ] as const;
  const highest = Math.max(1, ...entries.map(([, value]) => value));

  return (
    <div className="border border-gray-800 bg-surface p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500">Academic Data</p>
          <h2 className="mt-2 text-lg font-bold uppercase tracking-wide text-white">Server-loaded dataset visibility</h2>
        </div>
        <Database size={18} className="text-safe" />
      </div>
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {entries.map(([label, value]) => (
          <div key={label} className="border border-gray-800 bg-void p-3">
            <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-widest text-gray-500">
              <span>{label}</span>
              <span>{value}</span>
            </div>
            <div className="h-2 overflow-hidden bg-surface">
              <div className="h-full bg-safe" style={{ width: `${(value / highest) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { session } = useAuth();
  const [payload, setPayload] = useState<AdminUsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [verification, setVerification] = useState<VerificationFilter>('all');
  const [gpaMinInput, setGpaMinInput] = useState('');
  const [gpaMaxInput, setGpaMaxInput] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [verification]);

  useEffect(() => {
    if (!session?.access_token) return;

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const nextPayload = await fetchAdminUsers(session.access_token, {
          search,
          verification,
          gpaMin: gpaMinInput === '' ? null : Number(gpaMinInput),
          gpaMax: gpaMaxInput === '' ? null : Number(gpaMaxInput),
          page,
          pageSize: PAGE_SIZE,
        });
        if (!cancelled) setPayload(nextPayload);
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : 'Unable to load the administrator dashboard.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [gpaMaxInput, gpaMinInput, page, search, session?.access_token, verification]);

  const summaryLabel = useMemo(() => {
    if (!payload) return 'Waiting for administrator data feed.';
    return `Displaying ${payload.users.length} of ${payload.pagination.total} filtered users.`;
  }, [payload]);

  return (
    <div className="flex flex-col gap-6 font-mono">
      <div>
        <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500">Restricted Overview</p>
        <h1 className="mt-2 text-3xl font-bold uppercase tracking-tight text-white sm:text-4xl">
          Super Admin Dashboard
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-gray-400">
          Real-time oversight across authentication, academic storage, notes, and AI activity.
        </p>
      </div>

      {error && (
        <div className="border border-panic/30 bg-panic/10 p-4 text-sm text-panic">
          {error}
        </div>
      )}

      {payload && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Registered Users" value={payload.overview.totalUsers} icon={Users} accent="text-safe" helper="All authenticated accounts recorded in Supabase Auth." />
            <StatCard label="Verified Users" value={payload.overview.verifiedUsers} icon={MailCheck} accent="text-safe" helper="Accounts with confirmed email verification." />
            <StatCard label="Unverified Users" value={payload.overview.unverifiedUsers} icon={MailX} accent="text-caution" helper="Accounts that still require confirmation." />
            <StatCard label="Active Users" value={payload.overview.activeUsers} icon={Activity} accent="text-white" helper={`Signed in during the last ${payload.overview.activeWindowDays} days.`} />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <VerificationBars payload={payload} />
            <AcademicCoverage payload={payload} />
          </div>
        </>
      )}

      <div className="border border-gray-800 bg-surface p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500">User Directory</p>
            <h2 className="mt-2 text-xl font-bold uppercase tracking-wide text-white">Search, filter, and inspect users</h2>
            <p className="mt-2 text-xs text-gray-500">{summaryLabel}</p>
          </div>

          <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-2 xl:max-w-3xl xl:grid-cols-4">
            <label className="relative flex flex-col gap-2 text-[10px] uppercase tracking-widest text-gray-500">
              Search
              <span className="pointer-events-none absolute left-3 top-[35px] text-gray-600">
                <Search size={14} />
              </span>
              <input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Name or email"
                className="border border-gray-800 bg-void py-2 pl-9 pr-3 text-xs text-white outline-none focus:border-safe"
              />
            </label>
            <label className="flex flex-col gap-2 text-[10px] uppercase tracking-widest text-gray-500">
              GPA Min
              <input
                value={gpaMinInput}
                onChange={(event) => {
                  setPage(1);
                  setGpaMinInput(event.target.value);
                }}
                inputMode="decimal"
                placeholder="0.00"
                className="border border-gray-800 bg-void px-3 py-2 text-xs text-white outline-none focus:border-safe"
              />
            </label>
            <label className="flex flex-col gap-2 text-[10px] uppercase tracking-widest text-gray-500">
              GPA Max
              <input
                value={gpaMaxInput}
                onChange={(event) => {
                  setPage(1);
                  setGpaMaxInput(event.target.value);
                }}
                inputMode="decimal"
                placeholder="5.00"
                className="border border-gray-800 bg-void px-3 py-2 text-xs text-white outline-none focus:border-safe"
              />
            </label>
            <div className="flex flex-col gap-2">
              <span className="text-[10px] uppercase tracking-widest text-gray-500">Verification</span>
              <div className="grid grid-cols-3 gap-2">
                <FilterChip active={verification === 'all'} label="All" onClick={() => setVerification('all')} />
                <FilterChip active={verification === 'verified'} label="Verified" onClick={() => setVerification('verified')} />
                <FilterChip active={verification === 'unverified'} label="Pending" onClick={() => setVerification('unverified')} />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-4 lg:hidden">
          {loading && <div className="border border-gray-800 bg-void p-4 text-xs text-gray-400">Loading administrator records...</div>}
          {!loading && payload?.users.length === 0 && (
            <div className="border border-gray-800 bg-void p-4 text-xs text-gray-400">No users match the current administrator filters.</div>
          )}
          {payload?.users.map((entry) => (
            <Link
              key={entry.id}
              to={`/admin/users/${entry.id}`}
              className="block border border-gray-800 bg-void p-4 transition-colors hover:border-safe/40"
            >
              <div className="flex items-start gap-3">
                {entry.avatarUrl ? (
                  <img src={entry.avatarUrl} alt={entry.displayName ?? entry.email} className="h-12 w-12 border border-gray-800 object-cover" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center border border-gray-800 bg-surface text-safe">
                    <BadgeCheck size={16} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold uppercase tracking-wide text-white">{entry.displayName ?? 'Unnamed User'}</p>
                  <p className="truncate text-xs text-gray-500">{entry.email}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-[10px] uppercase tracking-widest text-gray-500">
                <div>
                  <p>Status</p>
                  <p className={entry.emailVerified ? 'mt-1 text-safe' : 'mt-1 text-caution'}>
                    {entry.emailVerified ? 'Verified' : 'Unverified'}
                  </p>
                </div>
                <div>
                  <p>Current GPA</p>
                  <p className="mt-1 text-white">{formatGpa(entry.currentGpa)}</p>
                </div>
                <div>
                  <p>Created</p>
                  <p className="mt-1 text-white">{formatDateTime(entry.createdAt)}</p>
                </div>
                <div>
                  <p>Last Sign In</p>
                  <p className="mt-1 text-white">{formatDateTime(entry.lastSignInAt)}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-6 hidden lg:block">
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-800 text-left text-sm">
              <thead className="bg-void text-[10px] uppercase tracking-[0.25em] text-gray-500">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Last Sign In</th>
                  <th className="px-4 py-3">Verified</th>
                  <th className="px-4 py-3">GPA</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-xs text-gray-400">
                      Loading administrator records...
                    </td>
                  </tr>
                )}
                {!loading && payload?.users.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-xs text-gray-400">
                      No users match the current administrator filters.
                    </td>
                  </tr>
                )}
                {payload?.users.map((entry) => (
                  <tr key={entry.id} className="border-t border-gray-800 bg-surface/70">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {entry.avatarUrl ? (
                          <img src={entry.avatarUrl} alt={entry.displayName ?? entry.email} className="h-11 w-11 border border-gray-800 object-cover" />
                        ) : (
                          <div className="flex h-11 w-11 items-center justify-center border border-gray-800 bg-void text-safe">
                            <Users size={16} />
                          </div>
                        )}
                        <span className="font-bold uppercase tracking-wide text-white">{entry.displayName ?? 'Unnamed User'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-gray-300">{entry.email}</td>
                    <td className="px-4 py-4 text-gray-300">{formatDateTime(entry.createdAt)}</td>
                    <td className="px-4 py-4 text-gray-300">{formatDateTime(entry.lastSignInAt)}</td>
                    <td className="px-4 py-4">
                      <span className={`border px-2 py-1 text-[10px] uppercase tracking-widest ${
                        entry.emailVerified
                          ? 'border-safe/40 bg-safe/10 text-safe'
                          : 'border-caution/40 bg-caution/10 text-caution'
                      }`}>
                        {entry.emailVerified ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-white">{formatGpa(entry.currentGpa)}</td>
                    <td className="px-4 py-4">
                      <Link
                        to={`/admin/users/${entry.id}`}
                        className="border border-safe/40 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-safe hover:bg-safe/10"
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {payload && (
          <div className="mt-6 flex flex-col gap-3 border-t border-gray-800 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[10px] uppercase tracking-widest text-gray-500">
              Page {payload.pagination.page} of {payload.pagination.totalPages}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!payload.pagination.hasPreviousPage}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="border border-gray-800 px-3 py-2 text-[10px] uppercase tracking-widest text-gray-300 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={!payload.pagination.hasNextPage}
                onClick={() => setPage((current) => current + 1)}
                className="border border-safe/40 px-3 py-2 text-[10px] uppercase tracking-widest text-safe disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
