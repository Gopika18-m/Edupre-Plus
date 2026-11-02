import React, { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Menu, Calendar, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import NotificationBell from './NotificationBell';

export const homeFor = (role) => (role === 'student' ? '/my-progress' : '/');

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-primary-600 animate-pulse" />
            <div className="absolute inset-0 border-4 border-primary-200 border-t-primary-600 rounded-2xl animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-slate-800">EduPre Plus</p>
            <p className="text-xs text-slate-400 mt-0.5">Connecting to academic risk engine...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={homeFor(user.role)} replace />;

  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  }).format(new Date());

  return (
    <div className="flex min-h-screen bg-slate-50/80">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOpen(true)}
              className="lg:hidden w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center text-slate-600 transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 bg-slate-100/70 border border-slate-200/60 px-3 py-1.5 rounded-full">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-slate-700">{todayFormatted}</span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500">Academic Year 2026-27</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Status Pill */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/70 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Engine</span>
            </div>

            <NotificationBell />

            <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

            {/* Quick User Pill */}
            <div className="hidden sm:flex items-center gap-2.5 pl-1">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div className="text-left hidden md:block">
                <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">{user?.name}</p>
                <p className="text-[10px] text-slate-400 font-semibold capitalize">{user?.role}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
