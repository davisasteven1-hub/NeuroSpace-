import { Menu, ShieldAlert, Activity } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

type AdminHeaderProps = {
  onMenuClick: () => void;
};

function resolveLabel(pathname: string): string {
  if (pathname.startsWith('/admin/users/')) return 'User Detail';
  if (pathname === '/admin/dashboard') return 'Dashboard';
  return 'Administrator Module';
}

export default function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const location = useLocation();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex min-w-0 items-center justify-between gap-3 border-b border-gray-800 bg-void/95 px-4 py-4 font-mono backdrop-blur-md sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="flex h-10 w-10 items-center justify-center border border-gray-800 text-gray-400 transition-colors hover:text-white lg:hidden"
          aria-label="Open administrator menu"
        >
          <Menu size={18} />
        </button>
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500">Security State</p>
          <h2 className="truncate text-sm font-bold uppercase tracking-[0.15em] text-white sm:text-base">
            Cognitive Operations Control Center
          </h2>
          <p className="mt-1 text-[10px] uppercase tracking-widest text-safe">
            {resolveLabel(location.pathname)}
          </p>
        </div>
      </div>

      <div className="hidden items-center gap-2 border border-safe/30 bg-safe/10 px-3 py-2 lg:flex">
        <ShieldAlert size={14} className="text-safe" />
        <span className="text-[10px] uppercase tracking-widest text-safe">Restricted Access</span>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden items-center gap-2 border border-gray-800 bg-surface px-3 py-2 md:flex">
          <Activity size={12} className="text-safe" />
          <span className="text-[10px] uppercase tracking-widest text-gray-400">Live Audit</span>
        </div>
        <div className="border border-gray-800 bg-surface px-3 py-2 text-right">
          <p className="text-[10px] uppercase tracking-widest text-gray-500">
            {now.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </p>
          <p className="text-xs font-bold text-safe">{now.toLocaleTimeString()}</p>
        </div>
      </div>
    </header>
  );
}
