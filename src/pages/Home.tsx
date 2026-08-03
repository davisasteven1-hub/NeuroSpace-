import { Link } from 'react-router-dom';
import {
  BookOpen,
  CalendarDays,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  Sparkles,
  ArrowRight,
  FileText,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const features = [
  {
    icon: LayoutDashboard,
    title: 'Unified Dashboard',
    description: 'See exams, classes, GPA, and notes at a glance — one cognitive operations center.',
  },
  {
    icon: CalendarDays,
    title: 'Smart Timetable',
    description: 'Live class countdowns, clash detection, and weekly planning built for real schedules.',
  },
  {
    icon: ClipboardList,
    title: 'Assignments & Exams',
    description: 'Track deadlines and assessments with priorities, reminders, and preparation tools.',
  },
  {
    icon: GraduationCap,
    title: 'GPA Intelligence',
    description: 'Calculate, predict, and understand your academic standing with clarity.',
  },
  {
    icon: FileText,
    title: 'Notes & Files',
    description: 'Organize study materials with folders, tags, and cloud-backed storage.',
  },
  {
    icon: Sparkles,
    title: 'Built for Focus',
    description: 'Minimal, distraction-free UI designed for deep work and exam seasons.',
  },
];

const benefits = [
  'One login, all your academic data synced securely',
  'Works on phone, tablet, and desktop',
  'Designed for university students who juggle complexity daily',
  'Fast, responsive, and always within reach',
];

function ScreenshotPlaceholder({ label }: { label: string }) {
  return (
    <div className="aspect-video border-2 border-gray-800 bg-surface/80 flex flex-col items-center justify-center gap-2 p-4">
      <div className="w-full h-full border border-dashed border-gray-700 flex items-center justify-center">
        <span className="text-[10px] uppercase tracking-[0.25em] text-gray-600 font-mono text-center">{label}</span>
      </div>
    </div>
  );
}

export default function Home() {
  const { user, loading } = useAuth();

  const primaryCta = user ? (
    <Link
      to="/dashboard"
      className="inline-flex items-center gap-2 px-6 py-3 border border-safe bg-safe/10 text-safe text-[10px] font-bold uppercase tracking-widest hover:bg-safe/20 transition-colors"
    >
      Dashboard <ArrowRight size={14} />
    </Link>
  ) : (
    <Link
      to="/signup"
      className="inline-flex items-center gap-2 px-6 py-3 border border-safe bg-safe/10 text-safe text-[10px] font-bold uppercase tracking-widest hover:bg-safe/20 transition-colors"
    >
      Get Started <ArrowRight size={14} />
    </Link>
  );

  return (
    <div className="min-h-screen bg-void bg-grid text-white font-mono overflow-x-hidden">
      <header className="sticky top-0 z-40 border-b-2 border-[#1a1a1a] bg-void/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="text-sm font-bold uppercase tracking-widest text-white shrink-0">
            Neuro<span className="text-safe">_</span>Space
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-[10px] uppercase tracking-widest text-gray-500">
            <a href="#features" className="hover:text-safe transition-colors">Features</a>
            <a href="#about" className="hover:text-safe transition-colors">About</a>
            {!loading && user ? (
              <Link to="/dashboard" className="text-safe hover:text-white transition-colors">Dashboard</Link>
            ) : (
              <Link to="/login" className="hover:text-safe transition-colors">Login</Link>
            )}
          </nav>
          <div className="flex items-center gap-2 shrink-0">
            {!loading && !user && (
              <>
                <Link to="/login" className="hidden sm:inline-flex px-3 py-1.5 border border-gray-800 text-gray-400 text-[10px] uppercase tracking-wider hover:border-gray-600 hover:text-white transition-colors">
                  Login
                </Link>
                <Link to="/signup" className="px-3 py-1.5 border border-safe/40 text-safe text-[10px] uppercase tracking-wider hover:bg-safe/10 transition-colors">
                  Create Account
                </Link>
              </>
            )}
            {!loading && user && (
              <Link to="/dashboard" className="px-3 py-1.5 border border-safe/40 text-safe text-[10px] uppercase tracking-wider hover:bg-safe/10 transition-colors">
                Dashboard
              </Link>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 lg:py-32">
          <div className="max-w-3xl">
            <p className="text-[10px] uppercase tracking-[0.4em] text-safe font-bold mb-4">Educational · Productive · Minimal</p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] text-white">
              One Big Knowledge Space
            </h1>
            <p className="mt-6 text-base sm:text-lg text-gray-400 leading-relaxed max-w-xl">
              A single place to organize your university life.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row flex-wrap gap-3">
              {primaryCta}
              {!user && !loading && (
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center px-6 py-3 border border-gray-700 text-gray-300 text-[10px] font-bold uppercase tracking-widest hover:border-gray-500 transition-colors"
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </section>

        <section id="features" className="border-t border-gray-900 bg-surface/30">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
            <span className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-bold">Features</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mt-2 mb-10">Everything you need for academic life</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {features.map(({ icon: Icon, title, description }) => (
                <div key={title} className="border border-gray-800 bg-void p-5 hover:border-gray-600 transition-colors">
                  <Icon size={22} className="text-safe mb-3" />
                  <h3 className="text-sm font-bold uppercase tracking-wide text-white">{title}</h3>
                  <p className="text-gray-500 text-xs mt-2 leading-relaxed">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <span className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-bold">Product Preview</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white mt-2 mb-8">Screenshots</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ScreenshotPlaceholder label="Dashboard" />
            <ScreenshotPlaceholder label="Exams & Assignments" />
            <ScreenshotPlaceholder label="Notes & GPA" />
          </div>
        </section>

        <section id="about" className="border-t border-gray-900">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div>
              <span className="text-[10px] uppercase tracking-[0.3em] text-gray-500 font-bold">Benefits</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mt-2 mb-6">Why NeuroSpace</h2>
              <ul className="space-y-4">
                {benefits.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-gray-400 text-sm">
                    <BookOpen size={16} className="text-safe shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="border-2 border-safe/30 bg-surface p-8 sm:p-10 text-center lg:text-left">
              <h3 className="text-xl font-bold uppercase tracking-wide text-white">Ready to organize your semester?</h3>
              <p className="text-gray-500 text-xs mt-3 leading-relaxed">
                Join NeuroSpace and bring your timetable, exams, notes, and GPA into one professional workspace.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                {primaryCta}
                {!user && !loading && (
                  <Link to="/signup" className="inline-flex items-center justify-center px-6 py-3 border border-gray-700 text-gray-300 text-[10px] font-bold uppercase tracking-widest hover:border-gray-500 transition-colors">
                    Create Account
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-900 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] uppercase tracking-widest text-gray-600">
          <span>NeuroSpace · One Big Knowledge Space</span>
          <div className="flex gap-4">
            <Link to="/login" className="hover:text-safe transition-colors">Login</Link>
            <Link to="/signup" className="hover:text-safe transition-colors">Sign up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
