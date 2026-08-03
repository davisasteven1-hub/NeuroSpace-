import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Activity, Menu } from "lucide-react";
import NotificationBell from "../components/notifications/NotificationBell";

const PAGE_LABELS: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/timetable": "Timetable",
  "/assignments": "Assignments",
  "/exams": "Exams",
  "/notes": "Notes",
  "/projects": "Projects",
  "/gpa": "GPA",
  "/ai": "AI Assistant",
  "/settings": "Settings",
};

type HeaderProps = {
  onMenuClick?: () => void;
};

const Header = ({ onMenuClick }: HeaderProps) => {
  const location = useLocation();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const normalizedPath = location.pathname.toLowerCase();
  const currentPage = PAGE_LABELS[normalizedPath] ?? PAGE_LABELS[location.pathname] ?? "Unknown Module";

  return (
    <header className="relative z-30 h-16 border-b-2 border-[#1a1a1a] bg-void/90 backdrop-blur-md flex items-center justify-between px-4 md:px-8 font-mono min-w-0">
      <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden w-9 h-9 shrink-0 flex items-center justify-center border border-gray-800 text-gray-400 hover:border-gray-600 hover:text-white transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu size={18} />
        </button>

        <div className="flex flex-col min-w-0">
          <span className="text-[9px] uppercase tracking-[0.3em] text-gray-500 font-bold">System Status</span>
          <h2 className="text-sm md:text-base font-bold uppercase tracking-tight text-white leading-tight truncate">
            COGNITIVE OPERATIONS CENTER
          </h2>
          <p className="hidden sm:block text-[10px] text-gray-600 tracking-wide">NEURAL SYSTEMS READY.</p>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 border border-safe/40 bg-safe/10 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-safe animate-pulse" />
          <span className="text-[9px] uppercase tracking-widest text-safe font-bold">Online</span>
        </div>
      </div>

      <div className="hidden md:flex flex-col items-center px-3 shrink-0">
        <span className="text-[9px] uppercase tracking-[0.3em] text-gray-600">Current Module</span>
        <span className="text-xs font-bold uppercase tracking-widest text-gray-200">{currentPage}</span>
      </div>

      <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 border border-gray-800 bg-surface shrink-0">
        <Activity size={12} className="text-safe animate-pulse" />
        <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Live Monitoring</span>
      </div>

      <div className="flex items-center gap-2 md:gap-4 shrink-0">
        <NotificationBell />

        <div className="text-right hidden sm:block">
          <p className="text-[9px] uppercase tracking-widest text-gray-500">Welcome Master</p>
          <p className="text-xs font-bold uppercase tracking-wide text-white">LIGHT</p>
        </div>

        <div className="flex flex-col items-end px-2 sm:px-3 py-1.5 border border-gray-800 bg-surface">
          <span className="text-[9px] uppercase tracking-widest text-gray-500">
            {now.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </span>
          <span className="text-[10px] sm:text-xs font-bold font-mono text-safe">{now.toLocaleTimeString()}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
