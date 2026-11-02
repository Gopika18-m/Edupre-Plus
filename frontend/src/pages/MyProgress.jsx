import React, { useEffect, useState } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { 
  GraduationCap, 
  TrendingUp, 
  CalendarCheck2, 
  Lightbulb, 
  ShieldAlert, 
  Award,
  Sparkles,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import client from '../api/client';
import RiskBadge from '../components/RiskBadge';
import AttendanceStrip from '../components/AttendanceStrip';
import { useAuth } from '../context/AuthContext';

const INDICATORS = [
  { key: 'attendance', label: 'Attendance', target: '≥75%' },
  { key: 'assessmentMarks', label: 'Assessment Marks', target: '30% wt' },
  { key: 'assignmentCompletion', label: 'Assignments', target: '10% wt' },
  { key: 'engagementScore', label: 'Class Engagement', target: '10% wt' },
  { key: 'previousPerformance', label: 'Prior Performance', target: '30% wt' },
];

export default function MyProgress() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client
      .get('/students/me')
      .then((res) => setData(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Could not load your progress records'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-16 text-center">
        <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-600">Loading your academic record...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
        <div className="card p-6 border-rose-200 bg-rose-50 text-rose-700 text-sm flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  const { student, history, suggestions, attendance } = data;
  const chart = history.map((h) => ({
    ...h,
    date: new Date(h.recordedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
  }));

  const firstName = user?.name?.split(' ')?.[0] || 'Student';
  const isHealthy = student.riskLevel === 'Low';

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-primary-950 to-indigo-950 text-white p-6 sm:p-8 shadow-md">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-primary-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-primary-200 text-xs font-semibold backdrop-blur-sm border border-white/10">
              <Sparkles className="w-3.5 h-3.5 text-primary-300" />
              <span>STUDENT DASHBOARD · YEAR {student.year} (SEC {student.section})</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome, {firstName}! 🎓
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Track your attendance, view AI risk feedback, and get personalized recommendations to excel.
            </p>
            <p className="text-xs text-primary-200 font-mono">
              Roll No: {student.rollNumber} • Assigned Mentor: {student.mentor?.name || 'Academic Advisor'}
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white/10 backdrop-blur p-4 rounded-2xl border border-white/15 self-start md:self-auto">
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary-200 block">
                Risk Score
              </span>
              <span className="text-3xl font-extrabold text-white">{student.riskScore}</span>
              <span className="text-xs text-slate-300 font-semibold">/100</span>
            </div>
            <RiskBadge level={student.riskLevel} />
          </div>
        </div>
      </div>

      {/* Flags Alert (if any) */}
      {student.riskFactors?.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-amber-900 shadow-2xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-800">
              Areas Requiring Your Immediate Focus
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {student.riskFactors.map((f) => (
                <span key={f} className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-white/80 border border-amber-300 text-amber-900">
                  {f}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5 Indicators Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {INDICATORS.map(({ key, label, target }) => {
          const val = student[key] ?? 0;
          return (
            <div key={key} className="card p-4 bg-white border border-slate-200/90 card-hover">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-500 truncate">{label}</span>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                  {target}
                </span>
              </div>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">{val}%</p>
              <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2.5 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${
                    val < 50 ? 'bg-rose-500' : val < 75 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`} 
                  style={{ width: `${Math.min(100, val)}%` }} 
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Daily Attendance Strip */}
      <div className="card p-6 bg-white border border-slate-200 shadow-sm">
        <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 mb-1">
          <CalendarCheck2 className="w-4 h-4 text-primary-600" />
          <span>My Daily Attendance Log</span>
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          {attendance.total > 0 
            ? `${attendance.present} of ${attendance.total} days present (${attendance.percent}%). ${
                attendance.percent < 75 
                  ? 'Attendance is below the mandatory 75% threshold. Please prioritize attending classes.' 
                  : 'Great attendance record! Keep it above 75%.'
              }`
            : 'No attendance records logged yet.'}
        </p>
        <AttendanceStrip records={attendance.records} days={30} />
      </div>

      {/* Progress Chart & Tips Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card p-6 lg:col-span-2 flex flex-col justify-between border border-slate-200">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary-600" />
              <span>My Trend Over Time</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Historical curve of risk score, attendance percentage, and assessment marks
            </p>
          </div>

          <div className="h-64 my-4">
            {chart.length < 2 ? (
              <div className="h-full flex items-center justify-center text-xs font-semibold text-slate-400 bg-slate-50 rounded-xl">
                Trend chart will activate after your next recorded assessment or session.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: '1px solid #e2e8f0', 
                      fontSize: '12px',
                      fontWeight: 600
                    }} 
                  />
                  <Legend />
                  <Line type="monotone" dataKey="riskScore" name="Risk Score" stroke="#ef4444" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="attendance" name="Attendance %" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="assessmentMarks" name="Marks %" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Personalized Guidance */}
        <div className="card p-6 flex flex-col justify-between border border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-slate-900 text-base">Recommended Focus</h3>
            </div>
            <p className="text-xs text-slate-400">Targeted actionable tips from your mentor</p>
          </div>

          <div className="space-y-3 my-3">
            {suggestions.length === 0 ? (
              <div className="py-8 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">You are doing fantastic!</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Keep maintaining your current study rhythm.</p>
              </div>
            ) : (
              suggestions.map((sug, i) => (
                <div key={i} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/80">
                  <span className="text-[11px] font-bold text-primary-700 bg-primary-100/70 px-2 py-0.5 rounded-md">
                    {sug.category}
                  </span>
                  <p className="text-xs text-slate-700 font-medium leading-relaxed mt-1.5">
                    {sug.recommendation}
                  </p>
                </div>
              ))
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400">
            Reach out to your mentor if you need extra 1-on-1 coaching.
          </div>
        </div>
      </div>
    </div>
  );
}
