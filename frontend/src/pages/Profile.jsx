import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Building, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  Users,
  AlertTriangle,
  Clock,
  HeartHandshake
} from 'lucide-react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { todayStr } from '../utils/date';

const ABOUT = {
  student: [
    'View real-time risk scores, attendance percentages, and historical trends',
    'Receive alerts when attendance falls near or below the mandatory 75% target',
    'Get personalized actionable recommendations to boost academic standing',
  ],
  mentor: [
    'Dedicated dashboard filtered exclusively to your assigned mentees',
    'Record daily session attendance directly for your mentees',
    'Draft and submit intervention proposals to faculty for formal approval',
    'Track approved interventions and mark them resolved upon completion',
  ],
  faculty: [
    'Full access to campus cohort records with bulk CSV import and manual entry',
    'Take attendance for all classes and academic sections',
    'Review, approve, or reject mentoring proposals submitted by mentors',
    'Pair students with faculty mentors across all departments',
  ],
  admin: [
    'All faculty capabilities plus complete administrative oversight',
    'Manage user directory and assign roles (Student, Mentor, Faculty, Admin)',
    'Generate cohort analytics and export CSV reports filtered by year, section, and mentor',
  ],
};

const ROLE_THEMES = {
  faculty: 'from-indigo-600 to-primary-700',
  mentor: 'from-emerald-600 to-teal-700',
  admin: 'from-amber-600 to-orange-700',
  student: 'from-sky-600 to-blue-700',
};

export default function Profile() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const staff = user?.role !== 'student';

  useEffect(() => {
    if (!staff) return;
    client
      .get('/dashboard/summary', { params: { today: todayStr() } })
      .then((res) => setSummary(res.data))
      .catch(() => {});
  }, [staff]);

  const gradient = ROLE_THEMES[user?.role] || 'from-primary-600 to-indigo-700';

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Heading */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          User Profile & Credentials
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your role permissions and review assigned responsibilities.
        </p>
      </div>

      {/* Main Profile Card */}
      <div className="card p-6 sm:p-7 bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <div className={`w-20 h-20 rounded-2xl bg-gradient-to-tr ${gradient} text-white flex items-center justify-center font-extrabold text-3xl shadow-md shrink-0`}>
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </div>

        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">
              {user?.name}
            </h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-primary-100 text-primary-800 capitalize">
              {user?.role}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>{user?.email}</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              <span>{user?.department || 'Department of Information Technology'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Mentor Quick Stats */}
      {user?.role === 'mentor' && summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="card p-4 border border-slate-200">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-500">My Mentees</span>
              <Users className="w-3.5 h-3.5 text-primary-600" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{summary.totalStudents}</p>
          </div>
          <div className="card p-4 border border-rose-100 bg-rose-50/30">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-500">High Risk</span>
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            </div>
            <p className="text-2xl font-extrabold text-rose-600 mt-1">{summary.riskBreakdown.High}</p>
          </div>
          <div className="card p-4 border border-amber-100 bg-amber-50/30">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-500">Pending Review</span>
              <Clock className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <p className="text-2xl font-extrabold text-amber-600 mt-1">{summary.myProposals.Proposed}</p>
          </div>
          <div className="card p-4 border border-indigo-100 bg-indigo-50/30">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-500">Active Plans</span>
              <HeartHandshake className="w-3.5 h-3.5 text-indigo-500" />
            </div>
            <p className="text-2xl font-extrabold text-indigo-700 mt-1">{summary.activeInterventions}</p>
          </div>
        </div>
      )}

      {/* Role Capabilities Section */}
      <div className="card p-6 sm:p-7 bg-white border border-slate-200 shadow-sm space-y-4">
        <div>
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary-600" />
            <span>Role Capabilities & Entitlements ({user?.role?.toUpperCase()})</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Key operations allowed in the EduPre Plus ecosystem
          </p>
        </div>

        <div className="space-y-2.5 pt-1">
          {(ABOUT[user?.role] || []).map((t, idx) => (
            <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-700 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>{t}</span>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-slate-100">
          <Link 
            to={user?.role === 'student' ? '/my-progress' : '/'} 
            className="btn-primary text-xs sm:text-sm py-2.5 px-4"
          >
            <span>Navigate to {user?.role === 'student' ? 'My Progress' : 'Dashboard'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
