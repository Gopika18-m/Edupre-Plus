import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  GraduationCap, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  CheckCircle2, 
  Activity, 
  CalendarCheck, 
  HeartHandshake, 
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: 'faculty@edupreplus.edu', password: 'faculty123' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activePreset, setActivePreset] = useState('faculty');

  const DEMO_PRESETS = [
    {
      id: 'faculty',
      role: 'Faculty',
      email: 'faculty@edupreplus.edu',
      password: 'faculty123',
      desc: 'All students, attendance & approvals',
      color: 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100/80',
      activeColor: 'ring-2 ring-indigo-500 bg-indigo-50 border-indigo-300',
    },
    {
      id: 'mentor',
      role: 'Mentor',
      email: 'mentor@edupreplus.edu',
      password: 'mentor123',
      desc: 'Assigned mentees & proposals',
      color: 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100/80',
      activeColor: 'ring-2 ring-emerald-500 bg-emerald-50 border-emerald-300',
    },
    {
      id: 'admin',
      role: 'Admin',
      email: 'admin@edupreplus.edu',
      password: 'admin123',
      desc: 'User management & CSV reports',
      color: 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100/80',
      activeColor: 'ring-2 ring-amber-500 bg-amber-50 border-amber-300',
    },
    {
      id: 'student',
      role: 'Student',
      email: 'student@edupreplus.edu',
      password: 'student123',
      desc: 'Personal progress & risk trends',
      color: 'bg-sky-50 border-sky-200 text-sky-700 hover:bg-sky-100/80',
      activeColor: 'ring-2 ring-sky-500 bg-sky-50 border-sky-300',
    },
  ];

  const handleSelectPreset = (preset) => {
    setActivePreset(preset.id);
    setForm({ email: preset.email, password: preset.password });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const u = await login(form.email.trim(), form.password);
      navigate(u.role === 'student' ? '/my-progress' : '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-50">
      {/* Left Hero Panel */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-slate-900 via-primary-950 to-primary-900 text-white flex-col justify-between p-12 relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary-500/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 -left-20 w-80 h-80 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-primary-500 to-indigo-400 text-white flex items-center justify-center font-bold shadow-lg shadow-primary-500/30">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight">EduPre Plus</span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-primary-400/20 text-primary-200 border border-primary-400/30">
                PRO 3.0
              </span>
            </div>
            <p className="text-xs text-primary-200/70">Predictive Academic Early Intervention</p>
          </div>
        </div>

        {/* Platform Highlights */}
        <div className="relative z-10 max-w-lg my-auto py-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur text-primary-200 text-xs font-medium mb-6 border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-primary-300" />
            Empowering Mentors & Faculty with Early Data
          </div>
          <h1 className="text-4xl font-extrabold leading-tight mb-4 tracking-tight">
            Predict early.<br />
            <span className="bg-gradient-to-r from-primary-200 via-white to-indigo-200 bg-clip-text text-transparent">
              Intervene timely.
            </span><br />
            Improve performance.
          </h1>
          <p className="text-primary-100/80 text-sm leading-relaxed mb-8">
            An intelligent academic retention platform combining daily attendance records, 
            weighted risk analytics (30/30/20/10/10), and a structured mentor approval workflow.
          </p>

          {/* Feature Cards Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center mb-2.5">
                <CalendarCheck className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-semibold text-white">Daily Attendance</h4>
              <p className="text-[11px] text-slate-300 mt-1 leading-normal">
                Auto-recalculated risk scores and instant alert thresholds.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-lg bg-primary-500/20 text-primary-300 flex items-center justify-center mb-2.5">
                <Activity className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-semibold text-white">Risk Intelligence</h4>
              <p className="text-[11px] text-slate-300 mt-1 leading-normal">
                Identifies High and Moderate at-risk students proactively.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center mb-2.5">
                <HeartHandshake className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-semibold text-white">Mentor Workflow</h4>
              <p className="text-[11px] text-slate-300 mt-1 leading-normal">
                Propose interventions with faculty review and resolution tracking.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-300 flex items-center justify-center mb-2.5">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-semibold text-white">Automated Alerts</h4>
              <p className="text-[11px] text-slate-300 mt-1 leading-normal">
                Real-time notifications for drop in attendance & critical risk flags.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center justify-between text-xs text-primary-300/70 border-t border-white/10 pt-4">
          <span>Department of Information Technology</span>
          <span>EduPre Plus v3.0</span>
        </div>
      </div>

      {/* Right Login Form Panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 lg:p-12 overflow-y-auto">
        <div className="w-full max-w-md my-auto">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-6 justify-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-primary-500/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg text-slate-900">EduPre Plus</span>
              <p className="text-[11px] text-slate-500">Early Intervention Platform</p>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Sign in
            </h2>
            <p className="text-sm text-slate-500 mt-1.5">
              Access your dashboard, mentee roster, and academic insights.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50/90 text-rose-700 text-sm border border-rose-200 flex items-start gap-2.5 animate-in fade-in duration-200">
              <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs sm:text-sm font-medium">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 block">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  className="input-field pl-10"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="name@edupreplus.edu"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                  Password
                </label>
                <span className="text-[11px] text-slate-400">Default: role123</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="input-field pl-10 pr-10"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 mt-2 text-sm font-semibold tracking-wide"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign in to EduPre Plus</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Logins Section */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                1-Click Demo Accounts
              </span>
              <span className="text-[11px] text-primary-600 font-medium">Click any to auto-fill</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {DEMO_PRESETS.map((p) => {
                const isActive = activePreset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    className={`text-left p-2.5 rounded-xl border transition-all duration-150 flex flex-col justify-between ${
                      isActive ? p.activeColor : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-800">{p.role}</span>
                      {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-primary-600" />}
                    </div>
                    <span className="text-[11px] text-slate-500 truncate">{p.email}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <p className="text-xs text-slate-500 mt-6 text-center">
            Need a faculty account?{' '}
            <Link to="/register" className="text-primary-600 font-semibold hover:underline">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
