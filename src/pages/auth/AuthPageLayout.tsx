import { Link } from 'react-router-dom';
import type { PropsWithChildren, ReactNode } from 'react';

interface AuthPageLayoutProps extends PropsWithChildren {
  title: string;
  subtitle: string;
  footer: ReactNode;
}

export function AuthPageLayout({ title, subtitle, footer, children }: AuthPageLayoutProps) {
  return (
    <div className="min-h-screen bg-void bg-grid flex items-center justify-center p-4 font-mono">
      <div className="w-full max-w-md border-2 border-gray-800 bg-surface p-6 relative">
        <div className="absolute -top-2 -left-2 w-4 h-4 border-l-2 border-t-2 border-safe" />
        <div className="absolute -bottom-2 -right-2 w-4 h-4 border-r-2 border-b-2 border-safe" />
        <Link to="/" className="text-[10px] uppercase tracking-[0.3em] text-safe font-bold">NeuroSpace</Link>
        <h1 className="mt-4 text-2xl font-bold uppercase tracking-tight text-white">{title}</h1>
        <p className="mt-2 text-xs leading-relaxed text-gray-500">{subtitle}</p>
        {children}
        <div className="mt-5 pt-4 border-t border-gray-800 text-center text-[10px] text-gray-500">{footer}</div>
      </div>
    </div>
  );
}
