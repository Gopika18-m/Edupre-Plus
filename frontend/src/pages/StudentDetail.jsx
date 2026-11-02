import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
  ChevronLeft, 
  Edit3, 
  Trash2, 
  CalendarCheck2, 
  TrendingUp, 
  Lightbulb, 
  HeartHandshake, 
  Send, 
  ShieldAlert, 
  Award, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import client from '../api/client';
import RiskBadge from '../components/RiskBadge';
import StatusBadge from '../components/StatusBadge';
import AttendanceStrip from '../components/AttendanceStrip';
import StudentFormModal from '../components/StudentFormModal';
import { useAuth } from '../context/AuthContext';
import { useToast, errMsg } from '../context/ToastContext';
import { fmtDate } from '../utils/date';

const INDICATORS = [
  { key: 'attendance', label: 'Attendance', weight: '20%' },
  { key: 'assessmentMarks', label: 'Assessment (Mid/Final)', weight: '30%' },
  { key: 'assignmentCompletion', label: 'Assignments', weight: '10%' },
  { key: 'engagementScore', label: 'Class Engagement', weight: '10%' },
  { key: 'previousPerformance', label: 'Prior Performance', weight: '30%' },
];
const CATEGORIES = ['Academic Support', 'Attendance', 'Engagement', 'Counseling', 'General'];

export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [student, setStudent] = useState(null);
  const [history, setHistory] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [attendance, setAttendance] = useState({ records: [], summary: null });
  const [interventions, setInterventions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEdit, setShowEdit] = useState(false);
  const [custom, setCustom] = useState({ category: 'Academic Support', recommendation: '' });
  const [sending, setSending] = useState(false);

  const isMentor = user?.role === 'mentor';
  const canManage = user?.role === 'faculty' || user?.role === 'admin';

  const load = () => {
    setLoading(true);
    setError('');
    Promise.all([
      client.get(`/students/${id}`),
      client.get(`/interventions/suggestions/${id}`),
      client.get(`/attendance/student/${id}`, { params: { days: 60 } }),
      client.get('/interventions', { params: { studentId: id } }),
    ])
      .then(([sRes, sugRes, attRes, ivRes]) => {
        setStudent(sRes.data.student);
        setHistory(sRes.data.history.map((h) => ({ 
          ...h, 
          date: fmtDate(h.recordedAt, { month: 'short', day: 'numeric' }) 
        })));
        setSuggestions(sugRes.data);
        setAttendance(attRes.data);
        setInterventions(ivRes.data);
      })
      .catch((err) => setError(errMsg(err, 'Could not load this student profile')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleUpdate = async (form) => {
    await client.put(`/students/${id}`, form);
    setShowEdit(false);
    toast.success('Student profile updated & risk factors recalculated');
    load();
  };

  const handleDelete = async () => {
    if (!window.confirm(`Permanently remove ${student.name} from EduPre Plus?`)) return;
    try {
      await client.delete(`/students/${id}`);
      toast.success('Student removed from database');
      navigate('/students');
    } catch (err) {
      toast.error(errMsg(err, 'Could not delete student'));
    }
  };

  const createIntervention = async (category, recommendation) => {
    setSending(true);
    try {
      await client.post('/interventions', { student: id, category, recommendation });
      toast.success(isMentor ? 'Intervention proposal submitted for faculty approval' : 'Intervention registered');
      setCustom((c) => ({ ...c, recommendation: '' }));
      load();
    } catch (err) {
      toast.error(errMsg(err, 'Could not save the intervention'));
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center">
        <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-600">Loading student analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-4">
        <Link 
          to="/students" 
          className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 hover:text-primary-800"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to student directory</span>
        </Link>
        <div className="card p-6 border-rose-200 bg-rose-50 text-rose-700 text-sm flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  const sum = attendance.summary;
  const actionLabel = isMentor ? '+ Propose to Faculty' : '+ Add Action';

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Nav Breadcrumb */}
      <div>
        <Link 
          to="/students" 
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to {isMentor ? 'my mentees' : 'all students'}</span>
        </Link>
      </div>

      {/* Main Student Profile Card */}
      <div className="card p-6 sm:p-7 bg-white border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-600 text-white flex items-center justify-center font-extrabold text-2xl sm:text-3xl shadow-md shadow-primary-500/20 shrink-0">
              {student.name[0]}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  {student.name}
                </h1>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
                  {student.rollNumber}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Department of IT • Year {student.year} • Section {student.section}
              </p>
              <p className="text-xs text-slate-400">
                Mentor: <strong className="text-slate-600">{student.mentor?.name || 'Not Assigned'}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 self-end md:self-center">
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                Current Risk Assessment
              </span>
              <div className="flex items-center gap-2 justify-end">
                <span className="text-3xl font-extrabold text-slate-900">{student.riskScore}</span>
                <span className="text-xs text-slate-400 font-bold">/100</span>
                <RiskBadge level={student.riskLevel} />
              </div>
            </div>

            {canManage && (
              <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
                <button 
                  onClick={() => setShowEdit(true)} 
                  className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button 
                  onClick={handleDelete} 
                  className="text-xs py-2 px-3 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Risk Factors Pills */}
        {student.riskFactors?.length > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1">
              Active Flags:
            </span>
            {student.riskFactors.map((f) => (
              <span 
                key={f} 
                className="text-xs font-bold px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200/80 flex items-center gap-1"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                <span>{f}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 5 Indicators Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {INDICATORS.map(({ key, label, weight }) => {
          const val = student[key] ?? 0;
          return (
            <div key={key} className="card p-4 bg-white border border-slate-200/90 card-hover">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-500 truncate">{label}</span>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                  {weight}
                </span>
              </div>
              <p className="text-2xl font-extrabold text-slate-900 mt-1">{val}%</p>
              {key === 'attendance' && student.attendanceTotalDays > 0 && (
                <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                  {student.attendancePresentDays} of {student.attendanceTotalDays} days present
                </p>
              )}
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
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <CalendarCheck2 className="w-4 h-4 text-primary-600" />
              <span>Daily Attendance History (Last 30 Recorded Days)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {sum && sum.total > 0 
                ? `${sum.present} of ${sum.total} days present (${sum.percent}%). Recorded automatically from the daily register.` 
                : 'No attendance recorded yet for this student.'}
            </p>
          </div>
          <Link 
            to="/attendance" 
            className="text-xs font-bold text-primary-600 hover:text-primary-800 flex items-center gap-1 hover:underline"
          >
            <span>Open Attendance Register</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <AttendanceStrip records={attendance.records} days={30} />
      </div>

      {/* Performance Trends & Suggested Interventions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Graph */}
        <div className="card p-6 lg:col-span-2 flex flex-col justify-between border border-slate-200">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary-600" />
              <span>Academic Trajectory & Risk Trend</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Historical progression recalculated on each attendance and assessment update
            </p>
          </div>

          <div className="h-64 my-4">
            {history.length < 2 ? (
              <div className="h-full flex items-center justify-center text-xs font-semibold text-slate-400 bg-slate-50 rounded-xl">
                Insufficient history points recorded yet. History builds automatically with attendance.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
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
                  <Line 
                    type="monotone" 
                    dataKey="riskScore" 
                    name="Risk Score" 
                    stroke="#ef4444" 
                    strokeWidth={2.5} 
                    dot={false} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="attendance" 
                    name="Attendance %" 
                    stroke="#3b82f6" 
                    strokeWidth={2} 
                    dot={false} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="assessmentMarks" 
                    name="Marks %" 
                    stroke="#10b981" 
                    strokeWidth={2} 
                    dot={false} 
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>Risk Score line inversely mirrors performance and attendance gains.</span>
          </div>
        </div>

        {/* AI Suggested Actions */}
        <div className="card p-6 flex flex-col justify-between border border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-slate-900 text-base">Recommended Actions</h3>
            </div>
            <p className="text-xs text-slate-400">
              {isMentor ? 'Submit action directly to faculty for approval' : 'Add to intervention ledger'}
            </p>
          </div>

          <div className="space-y-2.5 my-3">
            {suggestions.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No specific recommendations at this time.</p>
            ) : (
              suggestions.map((sug, i) => (
                <div key={i} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/80 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-primary-700 bg-primary-100/70 px-2 py-0.5 rounded-md">
                      {sug.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 font-medium leading-relaxed mt-1">
                    {sug.recommendation}
                  </p>
                  <button 
                    disabled={sending} 
                    onClick={() => createIntervention(sug.category, sug.recommendation)} 
                    className="mt-2.5 text-xs font-bold text-primary-600 hover:text-primary-800 flex items-center gap-1 disabled:opacity-50"
                  >
                    <span>{actionLabel}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400">
            Tailored based on attendance flags and low weighted factors.
          </div>
        </div>
      </div>

      {/* Interventions History & Custom Proposal */}
      <div className="card p-6 sm:p-7 bg-white border border-slate-200 shadow-sm space-y-5">
        <div>
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <HeartHandshake className="w-4 h-4 text-primary-600" />
            <span>Interventions Assigned to {student.name.split(' ')[0]}</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            {isMentor 
              ? 'Proposals require faculty approval before commencement.' 
              : 'Directly track mentorship support and intervention milestones.'}
          </p>
        </div>

        {interventions.length === 0 ? (
          <div className="py-8 text-center text-xs font-semibold text-slate-400 bg-slate-50 rounded-xl">
            No active or historical interventions logged for this student yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl overflow-hidden">
            {interventions.map((it) => (
              <div key={it._id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-900">{it.recommendation}</p>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span className="font-semibold text-slate-600">{it.category}</span>
                    <span>•</span>
                    <span>
                      Proposed by{' '}
                      <strong className="text-slate-700">
                        {it.proposedBy?.name || 'Mentor'}{String(it.proposedBy?._id || it.proposedBy) === String(user?.id) ? ' (You)' : ''}
                      </strong>
                    </span>
                    <span>•</span>
                    <span>{fmtDate(it.createdAt)}</span>
                  </div>
                  {it.decisionNote && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg mt-1">
                      <strong>
                        Faculty note ({it.approvedBy?.name || 'Reviewer'}{String(it.approvedBy?._id || it.approvedBy) === String(user?.id) ? ' - You' : ''}):
                      </strong>{' '}
                      {it.decisionNote}
                    </p>
                  )}
                </div>
                <StatusBadge status={it.status} />
              </div>
            ))}
          </div>
        )}

        {/* Custom Intervention Input */}
        <form
          onSubmit={(e) => { 
            e.preventDefault(); 
            if (custom.recommendation.trim()) createIntervention(custom.category, custom.recommendation.trim()); 
          }}
          className="rounded-2xl bg-slate-50 border border-slate-200/80 p-4 sm:p-5 space-y-3"
        >
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-primary-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
              {isMentor ? 'Submit Custom Mentee Intervention Proposal' : 'Add Custom Corrective Intervention'}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <select 
              className="input-field sm:w-48 font-semibold text-slate-700" 
              value={custom.category} 
              onChange={(e) => setCustom({ ...custom, category: e.target.value })}
            >
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>

            <input 
              className="input-field flex-1" 
              maxLength={500} 
              placeholder="Detail the proposed intervention strategy, remedial steps, or counseling..." 
              value={custom.recommendation} 
              onChange={(e) => setCustom({ ...custom, recommendation: e.target.value })} 
            />

            <button 
              type="submit" 
              disabled={sending || !custom.recommendation.trim()} 
              className="btn-primary shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isMentor ? 'Submit for Review' : 'Add Intervention'}</span>
            </button>
          </div>
        </form>
      </div>

      {showEdit && (
        <StudentFormModal 
          initial={student} 
          onClose={() => setShowEdit(false)} 
          onSubmit={handleUpdate} 
        />
      )}
    </div>
  );
}
