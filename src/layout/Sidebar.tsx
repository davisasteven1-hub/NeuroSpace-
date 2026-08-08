import {
  LayoutDashboard, CalendarDays, ClipboardList, BookOpen, FileText,
  FolderKanban, GraduationCap, Bot, Settings, Camera, User, X, Target,
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { name: 'Timetable', icon: CalendarDays, path: '/timetable' },
  { name: 'Assignments', icon: ClipboardList, path: '/assignments' },
  { name: 'Exams', icon: BookOpen, path: '/exams' },
  { name: 'Notes', icon: FileText, path: '/notes' },
  { name: 'Projects', icon: FolderKanban, path: '/projects' },
  { name: 'GPA', icon: GraduationCap, path: '/gpa' },
  { name: 'Financial Goals', icon: Target, path: '/financial-goals' },
  { name: 'AI', icon: Bot, path: '/ai' },
  { name: 'Settings', icon: Settings, path: '/settings' },
];

type SidebarProps = { mobileOpen?: boolean; onMobileClose?: () => void };

const Sidebar = ({ mobileOpen = false, onMobileClose }: SidebarProps) => {
  const navigate = useNavigate();
  const { avatarUrl, profile, user } = useAuth();
  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'Student';
  const closeAndNavigateToSettings = () => { onMobileClose?.(); navigate('/settings'); };

  return (
    <>
      {mobileOpen && <button type="button" aria-label="Close menu" className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={onMobileClose} />}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 min-h-screen bg-void border-r-2 border-[#1a1a1a] text-white flex flex-col font-mono transform transition-transform duration-300 ease-out ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="lg:hidden flex justify-end p-3 border-b border-gray-900"><button type="button" onClick={onMobileClose} className="w-8 h-8 flex items-center justify-center border border-gray-800 text-gray-500 hover:text-white"><X size={16} /></button></div>
        <div className="p-6 border-b border-gray-900">
          <div className="flex items-center gap-2 mb-3"><span className="w-2 h-2 bg-safe rounded-full animate-pulse" /><span className="text-[9px] uppercase tracking-[0.3em] text-safe font-bold">Online</span></div>
          <div className="flex items-center gap-3 mb-4">
            <button type="button" onClick={closeAndNavigateToSettings} title="Manage profile picture" className="group relative w-14 h-14 shrink-0 border-2 border-gray-800 hover:border-safe/60 bg-surface overflow-hidden transition-colors">
              {avatarUrl ? <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><User size={22} className="text-gray-600 group-hover:text-gray-400 transition-colors" /></div>}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Camera size={16} className="text-safe" /></div>
            </button>
            <div className="min-w-0"><p className="text-xs text-white font-bold truncate">{displayName}</p><button type="button" onClick={closeAndNavigateToSettings} className="mt-1 text-[9px] uppercase tracking-widest text-gray-500 hover:text-safe transition-colors text-left">Manage profile</button></div>
          </div>
          <h1 className="text-xl font-bold tracking-widest uppercase text-white leading-tight">Neuro<span className="text-safe">_</span>Space</h1>
          <p className="text-[9px] uppercase tracking-[0.25em] text-gray-500 mt-1">Cognitive Operations Center</p>
          <div className="mt-4 flex items-center gap-2 px-2 py-1.5 border border-gray-800 bg-surface w-fit"><span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">Student Mode</span></div>
        </div>
        <nav className="flex-1 flex flex-col gap-1 p-4 overflow-y-auto">
          {links.map(({ name, icon: Icon, path }) => <NavLink key={name} to={path} onClick={onMobileClose} className={({ isActive }) => `group relative flex items-center gap-3 px-3 py-2.5 border transition-all duration-200 ${isActive ? 'border-safe/40 bg-safe/10 text-safe' : 'border-transparent text-gray-500 hover:border-gray-700 hover:text-gray-200 hover:bg-surface'}`}>
            {({ isActive }) => <><span className={`absolute left-0 top-0 bottom-0 w-0.5 transition-all duration-200 ${isActive ? 'bg-safe shadow-[0_0_8px_rgba(0,255,157,0.6)]' : 'bg-transparent group-hover:bg-gray-700'}`} /><Icon size={16} className={isActive ? 'text-safe' : 'text-gray-500 group-hover:text-gray-300 transition-colors'} /><span className={`text-[11px] uppercase tracking-widest font-bold ${isActive ? 'text-safe' : 'text-gray-400 group-hover:text-gray-200'}`}>{name}</span></>}
          </NavLink>)}
        </nav>
        <div className="p-4 border-t border-gray-900"><div className="flex items-center justify-between text-[9px] uppercase tracking-widest text-gray-600"><span>v2.0</span><span className="flex items-center gap-1"><span className="w-1 h-1 bg-safe rounded-full animate-pulse" /> Synced</span></div></div>
      </aside>
    </>
  );
};

export default Sidebar;
