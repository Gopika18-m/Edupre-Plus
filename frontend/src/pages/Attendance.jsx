import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Briefcase, 
  Save, 
  Clock, 
  Filter, 
  UserCheck, 
  Users,
  Check,
  AlertCircle
} from 'lucide-react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast, errMsg } from '../context/ToastContext';
import { todayStr } from '../utils/date';

const OPTIONS = [
  { 
    value: 'Present', 
    label: 'Present', 
    on: 'bg-emerald-600 text-white shadow-xs', 
    off: 'bg-white text-emerald-700 hover:bg-emerald-50' 
  },
  { 
    value: 'Absent', 
    label: 'Absent', 
    on: 'bg-rose-600 text-white shadow-xs', 
    off: 'bg-white text-rose-700 hover:bg-rose-50' 
  },
  { 
    value: 'OnDuty', 
    label: 'On Duty', 
    on: 'bg-sky-600 text-white shadow-xs', 
    off: 'bg-white text-sky-700 hover:bg-sky-50' 
  },
];

export default function Attendance() {
  const { user } = useAuth();
  const toast = useToast();
  const today = todayStr();
  const [date, setDate] = useState(today);
  const [year, setYear] = useState('');
  const [section, setSection] = useState('');
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    setLoading(true);
    const params = { date };
    if (year) params.year = year;
    if (section.trim()) params.section = section.trim();
    client
      .get('/attendance/roster', { params })
      .then((res) => {
        setRows(res.data.students);
        setStatus(Object.fromEntries(res.data.students.map((s) => [s._id, s.status || 'Present'])));
      })
      .catch((err) => toast.error(errMsg(err, 'Could not load the class list')))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, year, section, reload]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? rows.filter((r) => r.name.toLowerCase().includes(q) || r.rollNumber.toLowerCase().includes(q)) : rows;
  }, [rows, search]);

  const counts = useMemo(() => {
    const c = { Present: 0, Absent: 0, OnDuty: 0 };
    rows.forEach((r) => { if (c[status[r._id]] !== undefined) c[status[r._id]] += 1; });
    return c;
  }, [rows, status]);

  const markAll = (value) => setStatus((s) => ({ ...s, ...Object.fromEntries(shown.map((r) => [r._id, value])) }));

  const save = async () => {
    setSaving(true);
    try {
      const res = await client.post('/attendance/mark', { 
        date, 
        records: rows.map((r) => ({ student: r._id, status: status[r._id] })) 
      });
      const { highRisk, lowAttendance } = res.data.alerts;
      toast.success(`Attendance successfully recorded for ${res.data.saved} students`);
      if (lowAttendance) toast.info(`${lowAttendance} student${lowAttendance > 1 ? 's' : ''} fell below 75% attendance. Alerts generated.`);
      if (highRisk) toast.info(`${highRisk} student${highRisk > 1 ? 's' : ''} became High risk. Alerts generated.`);
      setReload((r) => r + 1);
    } catch (err) {
      toast.error(errMsg(err, 'Could not save attendance'));
    } finally {
      setSaving(false);
    }
  };

  const alreadyMarked = rows.length > 0 && rows.every((r) => r.status);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Daily Attendance Register
            </h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary-100 text-primary-700">
              Live Recalculation
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Mark daily presence. Attendance percentage, risk levels, and warning thresholds recalculate automatically upon save.
            {user?.role === 'mentor' && ' (Filtered to your assigned mentees).'}
          </p>
        </div>

        <button 
          className="btn-primary px-6 py-2.5 shrink-0" 
          onClick={save} 
          disabled={saving || rows.length === 0}
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Attendance ({rows.length})</span>
            </>
          )}
        </button>
      </div>

      {/* Filter Toolbar Card */}
      <div className="card p-5 bg-white border border-slate-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-primary-600" />
              <span>Attendance Date</span>
            </label>
            <input 
              type="date" 
              max={today} 
              value={date} 
              onChange={(e) => e.target.value && setDate(e.target.value)} 
              className="input-field font-medium text-slate-800" 
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-primary-600" />
              <span>Academic Year</span>
            </label>
            <select 
              className="input-field font-medium text-slate-800" 
              value={year} 
              onChange={(e) => setYear(e.target.value)}
            >
              <option value="">All Years</option>
              {[1, 2, 3, 4].map((y) => <option key={y} value={y}>Year {y}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-primary-600" />
              <span>Section</span>
            </label>
            <input 
              className="input-field font-medium text-slate-800" 
              placeholder="e.g. A, B, C (All)" 
              value={section} 
              onChange={(e) => setSection(e.target.value)} 
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-primary-600" />
              <span>Search Students</span>
            </label>
            <input 
              className="input-field" 
              placeholder="Filter by name or roll no..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </div>
        </div>
      </div>

      {/* Roster Controls & Tally Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-xs font-bold shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Present: {counts.Present}</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-800 border border-rose-200/80 text-xs font-bold shadow-2xs">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Absent: {counts.Absent}</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 text-sky-800 border border-sky-200/80 text-xs font-bold shadow-2xs">
            <Briefcase className="w-3.5 h-3.5 text-sky-600" />
            <span>On Duty: {counts.OnDuty}</span>
          </div>

          {alreadyMarked && (
            <span className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Marked for {date}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button 
            type="button"
            className="btn-secondary text-xs py-2 px-3.5" 
            onClick={() => markAll('Present')} 
            disabled={!shown.length}
          >
            Mark all Present
          </button>
          <button 
            type="button"
            className="btn-secondary text-xs py-2 px-3.5" 
            onClick={() => markAll('Absent')} 
            disabled={!shown.length}
          >
            Mark all Absent
          </button>
        </div>
      </div>

      {/* Students Attendance Table Card */}
      <div className="card overflow-hidden border border-slate-200 shadow-sm">
        {loading ? (
          <div className="p-16 text-center">
            <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-600">Loading student roster...</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="p-16 text-center">
            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No students matched the criteria</p>
            <p className="text-xs text-slate-400 mt-1">
              {user?.role === 'mentor' ? 'Ask faculty to assign students to your mentor roster.' : 'Try adjusting the year or section filter.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <th className="text-left px-6 py-3.5">Student</th>
                  <th className="text-left px-6 py-3.5">Class / Section</th>
                  <th className="text-left px-6 py-3.5">Cumulative Attendance</th>
                  <th className="text-left px-6 py-3.5">Status for {date}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shown.map((r) => {
                  const currentChoice = status[r._id];
                  return (
                    <tr key={r._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-3.5">
                        <Link to={`/students/${r._id}`} className="font-bold text-slate-900 hover:text-primary-600 transition-colors">
                          {r.name}
                        </Link>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">{r.rollNumber}</p>
                      </td>

                      <td className="px-6 py-3.5 text-slate-600 font-semibold whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                          Year {r.year} · Sec {r.section}
                        </span>
                      </td>

                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <span className={`text-sm font-extrabold ${r.attendance < 75 ? 'text-rose-600' : 'text-slate-800'}`}>
                            {r.attendance}%
                          </span>
                          <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
                            <div 
                              className={`h-full rounded-full ${r.attendance < 75 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                              style={{ width: `${Math.min(100, r.attendance)}%` }} 
                            />
                          </div>
                          <span className="text-xs text-slate-400 font-medium">({r.attendanceTotalDays}d)</span>
                        </div>
                      </td>

                      <td className="px-6 py-3.5">
                        <div className="inline-flex rounded-xl p-1 bg-slate-100 border border-slate-200/80 gap-1">
                          {OPTIONS.map((o) => {
                            const isSelected = currentChoice === o.value;
                            return (
                              <button
                                key={o.value}
                                type="button"
                                onClick={() => setStatus((s) => ({ ...s, [r._id]: o.value }))}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                  isSelected ? o.on : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                                }`}
                              >
                                {o.label}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
