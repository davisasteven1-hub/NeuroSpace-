import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("Could not find root element");
}

const root = ReactDOM.createRoot(rootElement);

function renderBootstrapError() {
  root.render(
    <main className="min-h-screen bg-[#09090B] text-white flex items-center justify-center p-6 font-mono">
      <section className="w-full max-w-lg border border-panic/40 bg-surface p-6">
        <p className="text-[10px] uppercase tracking-[0.3em] text-panic font-bold">Configuration required</p>
        <h1 className="mt-3 text-xl font-bold uppercase">NeuroSpace could not start</h1>
        <p className="mt-3 text-xs leading-relaxed text-gray-400">
          This deployment is missing its Supabase public environment variables. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel, then redeploy.
        </p>
      </section>
    </main>,
  );
}

void Promise.all([import('./App'), import('./context/AuthContext')])
  .then(([{ default: App }, { AuthProvider }]) => {
    root.render(
      <React.StrictMode>
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </React.StrictMode>,
    );
  })
  .catch(() => renderBootstrapError());
