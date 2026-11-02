import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend 
} from 'recharts';
import { 
  CalendarCheck2, 
  Users, 
  ArrowRight, 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  Sparkles,
  BarChart2
} from 'lucide-react';
import client from '../api/client';
import StatCard from '../components/StatCard';
import RiskBadge from '../components/RiskBadge';
import { useAuth } from '../context/AuthContext';
import { todayStr } from '../utils/date';

const COLORS = { Low: '#10b981', Moderate: '#f59e0b', High: '#ef4444' };

export default function Dashboard() {
  const { user } = useAuth();
  const [s, setS] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isMentor = user?.role === 'mentor';

  useEffect(() => {
    client
      .get('/dashboard/summary', { params: { today: todayStr() } })
      .then((res) => setS(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  const pieData = s ? Object.entries(s.riskBreakdown).map(([name, value]) => ({ name, value })) : [];
  const noun = isMentor ? 'mentees' : 'students';

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const displayName = user?.name || 'Educator';

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-primary-950 to-indigo-950 text-white p-6 sm:p-8 shadow-md">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-primary-500/15 blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -top-10 w-48 h-48 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-primary-200 text-xs font-semibold backdrop-blur-sm border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-primary-300" />
              <span>{user?.name} · {user?.role?.toUpperCase()} PORTAL · {user?.department || 'IT DEPARTMENT'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {greeting}, {displayName}! 👋
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              {isMentor 
                ? 'Here is real-time performance, attendance tracking, and risk breakdown for your assigned mentees.'
                : 'Here is your campus-wide academic risk summary and early intervention pipeline for today.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link 
              to="/attendance" 
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/15 backdrop-blur transition-all"
            >
              <CalendarCheck2 className="w-4 h-4 text-primary-300" />
              <span>Take Attendance</span>
            </Link>
            <Link 
              to="/students" 
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold text-xs shadow-md shadow-primary-500/30 transition-all"
            >
              <Users className="w-4 h-4" />
              <span>{isMentor ? 'My Mentees' : 'View Students'}</span>
            </Link>
          </div>
        </div>
      </div>

      {loading && (
        <div className="card p-16 text-center">
          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">Loading risk metrics...</p>
          <p className="text-xs text-slate-400 mt-1">Analyzing attendance, marks, and factor weights</p>
        </div>
      )}

      {error && (
        <div className="card p-6 border-rose-200 bg-rose-50 text-rose-700 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-500" />
          <span>{error}. Please verify the server connection.</span>
        </div>
      )}

      {s && !loading && (
        <>
          {/* Key Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
              label={isMentor ? 'My Mentees' : 'Total Students'} 
              value={s.totalStudents} 
              sub="Enrolled" 
              accent="primary" 
            />
            <StatCard 
              label="Low Risk" 
              value={s.riskBreakdown.Low} 
              sub="Good Progress" 
              accent="low" 
            />
            <StatCard 
              label="Moderate Risk" 
              value={s.riskBreakdown.Moderate} 
              sub="Watch List" 
              accent="moderate" 
            />
            <StatCard 
              label="High Risk" 
              value={s.riskBreakdown.High} 
              sub="Action Required" 
              accent="high" 
            />
          </div>

          {/* Charts & At-Risk Roster Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Risk Distribution Donut */}
            <div className="card p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-slate-900 text-base">Risk Distribution</h3>
                  <BarChart2 className="w-4 h-4 text-slate-400" />
                </div>
                <p className="text-xs text-slate-400">Classification across {s.totalStudents} {noun}</p>
              </div>

              <div className="h-60 my-2 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={pieData} 
                      dataKey="value" 
                      nameKey="name" 
                      innerRadius={58} 
                      outerRadius={84} 
                      paddingAngle={4}
                    >
                      {pieData.map((e) => (
                        <Cell key={e.name} fill={COLORS[e.name] || '#3b82f6'} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '12px', 
                        border: '1px solid #e2e8f0', 
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        fontSize: '12px',
                        fontWeight: '600'
                      }} 
                    />
                    <Legend verticalAlign="bottom" height={28} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center">
                <div className="p-2 rounded-xl bg-emerald-50/60 border border-emerald-100/60">
                  <p className="text-[10px] font-bold uppercase text-emerald-700">Low</p>
                  <p className="text-sm font-extrabold text-emerald-800">{s.riskBreakdown.Low}</p>
                </div>
                <div className="p-2 rounded-xl bg-amber-50/60 border border-amber-100/60">
                  <p className="text-[10px] font-bold uppercase text-amber-700">Moderate</p>
                  <p className="text-sm font-extrabold text-amber-800">{s.riskBreakdown.Moderate}</p>
                </div>
                <div className="p-2 rounded-xl bg-rose-50/60 border border-rose-100/60">
                  <p className="text-[10px] font-bold uppercase text-rose-700">High</p>
                  <p className="text-sm font-extrabold text-rose-800">{s.riskBreakdown.High}</p>
                </div>
              </div>
            </div>

            {/* Top At-Risk Students */}
            <div className="card p-6 lg:col-span-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-base">Top At-Risk {noun}</h3>
                    {s.topAtRisk.length > 0 && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                        {s.topAtRisk.length} Priority
                      </span>
                    )}
                  </div>
                  <Link 
                    to="/students?riskLevel=High" 
                    className="text-xs text-primary-600 font-semibold hover:text-primary-800 flex items-center gap-1 hover:underline"
                  >
                    <span>View all risk roster</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
                <p className="text-xs text-slate-400 mb-4">Immediate attention & intervention recommended</p>
              </div>

              {s.topAtRisk.length === 0 ? (
                <div className="py-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-slate-700">No high-risk {noun} flagged!</p>
                  <p className="text-xs text-slate-400 mt-1">All monitored students are performing within safe thresholds.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {s.topAtRisk.map((st) => (
                    <Link
                      to={`/students/${st._id}`}
                      key={st._id}
                      className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-white hover:bg-slate-50/80 hover:border-slate-200 transition-all card-hover group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-100 to-rose-200 text-rose-700 flex items-center justify-center font-bold text-sm shrink-0 border border-rose-200/60 shadow-2xs">
                          {st.name[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 group-hover:text-primary-600 transition-colors truncate">
                            {st.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                            <span>{st.rollNumber}</span>
                            <span>•</span>
                            <span className={st.attendance < 75 ? 'text-rose-600 font-semibold' : 'text-slate-500'}>
                              {st.attendance}% Attendance
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right hidden sm:block">
                          <p className="text-xs font-bold text-slate-700">Risk Score</p>
                          <p className="text-xs text-rose-600 font-extrabold">{st.riskScore}/100</p>
                        </div>
                        <RiskBadge level={st.riskLevel} size="sm" />
                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                <span>Weighted factors: Internal (30%), Mid (30%), Attendance (20%), Assignment (10%), Activity (10%)</span>
              </div>
            </div>
          </div>

          {/* Bottom Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Average Attendance */}
            <div className="card p-6 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Cohort Attendance</span>
                <div className="mt-2 flex items-baseline justify-between">
                  <p className="text-3xl font-extrabold text-slate-900">{s.avgAttendance.toFixed(1)}%</p>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
                    s.avgAttendance >= 75 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    {s.avgAttendance >= 75 ? 'Healthy' : 'Below 75% Target'}
                  </span>
                </div>
              </div>

              <div className="mt-4">
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      s.avgAttendance < 75 ? 'bg-rose-500' : 'bg-gradient-to-r from-primary-500 to-indigo-600'
                    }`} 
                    style={{ width: `${Math.min(100, s.avgAttendance)}%` }} 
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-2">Target benchmark is 75% minimum mandatory attendance.</p>
              </div>
            </div>

            {/* Today's Register Status */}
            <div className="card p-6 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Daily Register</span>
                {s.attendanceToday.marked === 0 ? (
                  <div className="mt-2">
                    <p className="text-xl font-bold text-amber-600">Pending Today</p>
                    <p className="text-xs text-slate-400 mt-1">Attendance has not been recorded yet for today.</p>
                  </div>
                ) : (
                  <div className="mt-2">
                    <p className="text-3xl font-extrabold text-slate-900">
                      {s.attendanceToday.present}
                      <span className="text-sm font-semibold text-slate-400"> / {s.attendanceToday.marked} Present</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {s.attendanceToday.absent} absent • {s.attendanceToday.marked} of {s.attendanceToday.total} students recorded
                    </p>
                  </div>
                )}
              </div>

              <Link 
                to="/attendance" 
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 hover:text-primary-800 group"
              >
                <span>{s.attendanceToday.marked === 0 ? 'Record attendance now' : 'Review attendance sheet'}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {/* Interventions Pipeline */}
            <div className="card p-6 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Intervention Pipeline</span>
                {isMentor ? (
                  <div className="mt-2">
                    <p className="text-xl font-bold text-slate-900">My Action Proposals</p>
                    <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                      <div className="p-2 rounded-lg bg-amber-50 text-amber-800 font-semibold border border-amber-100">
                        {s.myProposals.Proposed} Awaiting Approval
                      </div>
                      <div className="p-2 rounded-lg bg-sky-50 text-sky-800 font-semibold border border-sky-100">
                        {s.myProposals.Approved + s.myProposals['In Progress']} Active In Progress
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2">
                    <p className="text-3xl font-extrabold text-slate-900">
                      {s.pendingApprovals}
                      <span className="text-sm font-semibold text-amber-600 ml-1.5">Awaiting Review</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {s.activeInterventions} approved and in active mentorship progress
                    </p>
                  </div>
                )}
              </div>

              <Link 
                to={s.pendingApprovals ? '/interventions?status=Proposed' : '/interventions'} 
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 hover:text-primary-800 group"
              >
                <span>{s.pendingApprovals ? 'Review mentor proposals' : 'Open interventions ledger'}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
