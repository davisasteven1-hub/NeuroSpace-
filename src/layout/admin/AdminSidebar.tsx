import { Shield, LayoutDashboard, LogOut, X, ArrowLeft } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

type AdminSidebarProps = {
  mobileOpen: boolean;
  onClose: () => void;
};

const links = [
  { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
];

export default function AdminSidebar({ mobileOpen, onClose }: AdminSidebarProps) {
  const { profile, user, signOut } = useAuth();
  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Administrator';

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close administrator menu"
          className="fixed inset-0 z-40 bg-black/70 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-gray-800 bg-void font-mono text-white transition-transform duration-300 lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-900 px-4 py-4 lg:hidden">
          <span className="text-[10px] uppercase tracking-[0.3em] text-safe">Admin Menu</span>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center border border-gray-800 text-gray-400 transition-colors hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        <div className="border-b border-gray-900 px-6 py-6">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-safe">
            <Shield size={14} />
            Secure Admin Link
          </div>
          <h1 className="mt-4 text-2xl font-bold uppercase tracking-tight text-white">
            Super Admin
          </h1>
          <p className="mt-2 text-xs leading-relaxed text-gray-500">
            Cognitive Operations Control Center for protected cross-user oversight.
          </p>

          <div className="mt-6 border border-safe/30 bg-safe/10 p-3">
            <p className="text-[10px] uppercase tracking-widest text-gray-500">Current Operator</p>
            <p className="mt-2 truncate text-sm font-bold uppercase tracking-wide text-white">{displayName}</p>
            <p className="mt-1 truncate text-[10px] uppercase tracking-widest text-gray-500">{user?.email}</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
          {links.map(({ name, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/admin/dashboard'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 border px-3 py-3 text-[11px] font-bold uppercase tracking-widest transition-colors ${
                  isActive
                    ? 'border-safe/40 bg-safe/10 text-safe'
                    : 'border-transparent text-gray-400 hover:border-gray-800 hover:bg-surface hover:text-white'
                }`
              }
            >
              <Icon size={16} />
              {name}
            </NavLink>
          ))}
        </nav>

        <div className="space-y-3 border-t border-gray-900 p-4">
          <Link
            to="/login"
            onClick={onClose}
            className="flex items-center gap-2 border border-gray-800 px-3 py-2 text-[10px] uppercase tracking-widest text-gray-400 transition-colors hover:text-white"
          >
            <ArrowLeft size={14} />
            Student Login
          </Link>
          <button
            type="button"
            onClick={() => {
              onClose();
              void signOut();
            }}
            className="flex w-full items-center gap-2 border border-panic/40 px-3 py-2 text-[10px] uppercase tracking-widest text-panic transition-colors hover:bg-panic/10"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
