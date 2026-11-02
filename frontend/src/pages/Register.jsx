import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  GraduationCap, 
  User, 
  Mail, 
  Lock, 
  Building, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldAlert,
  Sparkles,
  HeartHandshake,
  BookOpen,
  Hash,
  Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ROLES = [
  {
    id: 'faculty',
    title: 'Faculty',
    desc: 'Manage students, attendance & approvals',
    icon: Building,
    badge: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    activeBadge: 'ring-2 ring-indigo-600 bg-indigo-50 text-indigo-800 border-indigo-300 font-bold',
  },
  {
    id: 'mentor',
    title: 'Mentor',
    desc: 'Guide mentees & propose interventions',
    icon: HeartHandshake,
    badge: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    activeBadge: 'ring-2 ring-emerald-600 bg-emerald-50 text-emerald-800 border-emerald-300 font-bold',
  },
  {
    id: 'student',
    title: 'Student',
    desc: 'View personal risk & attendance trends',
    icon: GraduationCap,
    badge: 'bg-sky-50 border-sky-200 text-sky-700',
    activeBadge: 'ring-2 ring-sky-600 bg-sky-50 text-sky-800 border-sky-300 font-bold',
  },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('faculty');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    department: 'Information Technology',
    rollNumber: '',
    year: '1',
    section: 'A',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role,
        department: form.department,
        ...(role === 'student' ? {
          rollNumber: form.rollNumber.trim() || `310624205${Math.floor(100 + Math.random() * 900)}`,
          year: Number(form.year) || 1,
          section: form.section || 'A',
        } : {}),
      };

      const user = await register(payload);
      navigate(user.role === 'student' ? '/my-progress' : '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const currentRoleInfo = ROLES.find((r) => r.id === role) || ROLES[0];

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50/80 p-4 sm:p-8">
      <div className="w-full max-w-lg card p-6 sm:p-8 bg-white border border-slate-200 shadow-xl rounded-3xl">
        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-5 justify-center">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-primary-500/20">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl text-slate-900 tracking-tight">EduPre Plus</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-primary-100 text-primary-700">v3.0</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Academic Risk & Intervention Platform</p>
          </div>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Create {currentRoleInfo.title} Account
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
            {role === 'faculty' && 'Sign up to monitor student risk profiles, take daily class attendance, and approve mentor proposals.'}
            {role === 'mentor' && 'Sign up to guide assigned mentees, recommend targeted interventions, and monitor risk reduction.'}
            {role === 'student' && 'Sign up to track your academic progress, attendance target metrics, and personalized advice.'}
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="mb-5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 block text-center">
            Choose Your Registration Role
          </label>
          <div className="grid grid-cols-3 gap-2">
            {ROLES.map((r) => {
              const Icon = r.icon;
              const isSelected = role === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                    isSelected
                      ? r.activeBadge + ' shadow-sm'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isSelected ? 'scale-110' : 'text-slate-400'} transition-transform`} />
                  <span className="text-xs font-bold leading-tight">{r.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 text-rose-700 text-xs sm:text-sm border border-rose-200 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 block">
              {role === 'student' ? 'Student Full Name' : 'Full Name & Title'}
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                required
                className="input-field pl-10"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={role === 'student' ? 'e.g. Diya Sharma' : (role === 'mentor' ? 'e.g. Mr. Arun Prasad' : 'e.g. Dr. K. Ramesh')}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 block">
              Institutional Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                className="input-field pl-10"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder={`${role}@edupreplus.edu`}
              />
            </div>
          </div>

          {/* Student Specific Fields */}
          {role === 'student' ? (
            <div className="space-y-3 p-3.5 bg-sky-50/60 rounded-2xl border border-sky-100">
              <div className="flex items-center gap-1.5 text-sky-800 text-xs font-bold">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Academic Details</span>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                  Roll / Registration Number
                </label>
                <div className="relative">
                  <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    required
                    className="input-field pl-10 bg-white"
                    value={form.rollNumber}
                    onChange={(e) => setForm({ ...form, rollNumber: e.target.value })}
                    placeholder="e.g. 310624205099"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Year of Study
                  </label>
                  <select
                    className="input-field bg-white font-semibold text-slate-700"
                    value={form.year}
                    onChange={(e) => setForm({ ...form, year: e.target.value })}
                  >
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Section
                  </label>
                  <select
                    className="input-field bg-white font-semibold text-slate-700"
                    value={form.section}
                    onChange={(e) => setForm({ ...form, section: e.target.value })}
                  >
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                  </select>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 block">
                Department
              </label>
              <div className="relative">
                <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  required
                  className="input-field pl-10"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  placeholder="Information Technology"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 block">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                className="input-field pl-10 pr-10"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Minimum 6 characters"
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
            className="btn-primary w-full py-3 mt-2 text-xs sm:text-sm font-semibold tracking-wide"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Creating {currentRoleInfo.title} Account...</span>
              </>
            ) : (
              <>
                <span>Complete Registration as {currentRoleInfo.title}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <p className="text-xs text-slate-500 mt-6 text-center">
          Already registered?{' '}
          <Link to="/login" className="text-primary-600 font-bold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}