import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AdminGuard } from './components/auth/AdminGuard';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import AuthCallback from './pages/auth/AuthCallback';
import Home from './pages/Home';

import Sidebar from "./layout/Sidebar";
import Header from "./layout/Header";

import Dashboard from "./pages/Dashboard";
import Timetable from "./pages/Timetable";
import Assignments from "./pages/Assignments";
import Exams from "./pages/Exams";
import Notes from "./pages/Notes";
import GPA from "./pages/GPA";
import SettingsPage from './pages/Settings';
import Projects from './pages/Projects';
import AIAssistant from './pages/AIAssistant';
import FinancialGoals from "./pages/FinancialGoals";
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUserDetailPage from './pages/admin/AdminUserDetail';
import AdminSidebar from './layout/admin/AdminSidebar';
import AdminHeader from './layout/admin/AdminHeader';
import { SmartNotificationsProvider } from './context/SmartNotificationsContext';

const Placeholder = ({ title }: { title: string }) => (
  <div className="p-4 sm:p-8 text-white">
    <h1 className="text-2xl sm:text-4xl font-bold">{title}</h1>
    <p className="mt-4 text-gray-400">This page is under construction.</p>
  </div>
);

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/auth/reset-password" element={<ResetPassword />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/admin/*" element={<AdminGuard><AdminRoutes /></AdminGuard>} />
      <Route path="/*" element={<ProtectedRoute><ApplicationRoutes /></ProtectedRoute>} />
    </Routes>
  );
}

function ApplicationRoutes() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <SmartNotificationsProvider>
      <div className="flex bg-[#09090B] min-h-screen overflow-x-hidden">
        <Sidebar mobileOpen={sidebarOpen} onMobileClose={() => setSidebarOpen(false)} />

        <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
          <Header onMenuClick={() => setSidebarOpen(true)} />

          <main className="pt-4 lg:pt-20 px-4 sm:px-6 pb-8 flex-1 min-w-0">
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/exams" element={<Exams />} />
              <Route path="/timetable" element={<Timetable />} />
              <Route path="/assignments" element={<Assignments />} />
              <Route path="/notes" element={<Notes />} />
              <Route path="/Notes" element={<Navigate to="/notes" replace />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/gpa" element={<GPA />} />
              <Route path="/GPA" element={<Navigate to="/gpa" replace />} />
              <Route path="/financial-goals" element={<FinancialGoals />} />
              <Route path="/ai" element={<AIAssistant />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </SmartNotificationsProvider>
  );
}

function AdminRoutes() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-[#050505]">
      <AdminSidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 min-w-0 px-4 pb-8 pt-4 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="/dashboard" element={<AdminDashboard />} />
            <Route path="/users/:id" element={<AdminUserDetailPage />} />
            <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
