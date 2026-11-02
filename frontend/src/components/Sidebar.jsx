import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  CalendarCheck2, 
  HeartHandshake, 
  UserCog, 
  BarChart3, 
  TrendingUp, 
  GraduationCap, 
  LogOut, 
  ChevronRight,
  Shield,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV = {
  student: [
    { to: '/my-progress', label: 'My Progress', icon: TrendingUp, end: true }
  ],
  mentor: [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/students', label: 'My Mentees', icon: Users },
    { to: '/attendance', label: 'Attendance', icon: CalendarCheck2 },
    { to: '/interventions', label: 'Interventions', icon: HeartHandshake },
  ],
  faculty: [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/students', label: 'Students', icon: Users },
    { to: '/attendance', label: 'Attendance', icon: CalendarCheck2 },
    { to: '/interventions', label: 'Interventions', icon: HeartHandshake },
  ],
  admin: [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/students', label: 'Students', icon: Users },
    { to: '/attendance', label: 'Attendance', icon: CalendarCheck2 },
    { to: '/interventions', label: 'Interventions', icon: HeartHandshake },
    { to: '/admin/users', label: 'User Directory', icon: UserCog },
    { to: '/admin/reports', label: 'Analytics & Reports', icon: BarChart3 },
  ],
};

const ROLE_BADGES = {
  faculty: { bg: 'bg-indigo-100 text-indigo-700 border-indigo-200', label: 'Faculty' },
  mentor: { bg: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Mentor' },
  admin: { bg: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Admin' },
  student: { bg: 'bg-sky-100 text-sky-700 border-sky-200', label: 'Student' },
};

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const links = NAV[user?.role] || NAV.faculty;
  const roleBadge = ROLE_BADGES[user?.role] || ROLE_BADGES.faculty;

  return (
    <>
      {open && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 lg:hidden transition-opacity" 
          onClick={onClose} 
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 w-72 shrink-0 h-screen bg-white border-r border-slate-200 flex flex-col transition-all duration-300 shadow-sm ${
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="px-6 py-5 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-primary-500/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base text-slate-900 tracking-tight">EduPre Plus</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-primary-100 text-primary-700">v3.0</span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Intervention Platform</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100" 
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Pill Banner */}
        <div className="px-6 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Portal View</span>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${roleBadge.bg}`}>
            {roleBadge.label}
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          {links.map(({ to, label, icon: IconComponent, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                `group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-gradient-to-r from-primary-50 to-indigo-50 text-primary-700 shadow-xs border border-primary-100'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg transition-colors ${
                      isActive 
                        ? 'bg-primary-600 text-white shadow-xs' 
                        : 'text-slate-400 group-hover:text-primary-600 group-hover:bg-slate-100'
                    }`}>
                      <IconComponent className="w-4 h-4" />
                    </div>
                    <span>{label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-4 h-4 text-primary-500" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Profile & Sign Out Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <NavLink
            to="/profile"
            onClick={onClose}
            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-xs transition-all"
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-primary-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-800 truncate leading-tight">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate mt-0.5">{user?.email}</p>
            </div>
          </NavLink>

          <button
            onClick={logout}
            className="mt-2.5 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
