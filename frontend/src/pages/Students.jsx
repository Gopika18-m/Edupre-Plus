import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Users, 
  Search, 
  Filter, 
  Upload, 
  UserPlus, 
  ChevronLeft, 
  ChevronRight, 
  ArrowRight,
  AlertCircle,
  GraduationCap,
  Sparkles
} from 'lucide-react';
import client from '../api/client';
import RiskBadge from '../components/RiskBadge';
import StudentFormModal from '../components/StudentFormModal';
import BulkUploadModal from '../components/BulkUploadModal';
import { useToast, errMsg } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

const PAGE_SIZE = 10;

export default function Students() {
  const toast = useToast();
  const { user } = useAuth();
  const isMentor = user?.role === 'mentor';
  const [mentors, setMentors] = useState([]);
  const [mentorId, setMentorId] = useState('');
  const [mentorScope, setMentorScope] = useState('mine');
  const [data, setData] = useState({ students: [], total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const riskFilter = searchParams.get('riskLevel') || '';

  useEffect(() => {
    if (!isMentor) client.get('/admin/mentors').then((res) => setMentors(res.data)).catch(() => {});
  }, [isMentor]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => setPage(1), [riskFilter, debounced, mentorId, mentorScope]);

  useEffect(() => {
    setLoading(true);
    const params = { page, limit: PAGE_SIZE };
    if (riskFilter) params.riskLevel = riskFilter;
    if (debounced) params.search = debounced;
    if (mentorId) params.mentor = mentorId;
    if (isMentor && mentorScope === 'all') params.all = 'true';
    client
      .get('/students', { params })
      .then((res) => setData(res.data))
      .catch((err) => toast.error(errMsg(err, 'Could not load students')))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, riskFilter, debounced, mentorId, mentorScope, reload]);

  const handleCreate = async (form) => {
    await client.post('/students', form);
    setShowModal(false);
    toast.success('Student record created successfully');
    setReload((r) => r + 1);
  };

  const handleBulkDone = (r) => {
    toast.success(`${r.createdCount} students added${r.skippedCount ? `, ${r.skippedCount} skipped` : ''}`);
    setReload((r2) => r2 + 1);
  };

  const setRiskFilter = (level) => setSearchParams(level ? { riskLevel: level } : {});

  const from = data.total === 0 ? 0 : (data.page - 1) * PAGE_SIZE + 1;
  const to = Math.min(data.page * PAGE_SIZE, data.total);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Heading & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {isMentor ? 'My Mentee Roster' : 'Student Directory'}
            </h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {data.total} Total
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {isMentor 
              ? 'Students under your mentorship guidance. Select any profile to record interventions or review progress.' 
              : 'Complete cohort analytics, early risk predictions, and mentor assignments.'}
          </p>
        </div>

        {isMentor ? (
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200/60 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setMentorScope('mine')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                mentorScope === 'mine'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              My Mentees
            </button>
            <button
              type="button"
              onClick={() => setMentorScope('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                mentorScope === 'all'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Students (Propose Interventions)
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <button 
              onClick={() => setShowBulk(true)} 
              className="btn-secondary text-xs sm:text-sm py-2 sm:py-2.5"
            >
              <Upload className="w-4 h-4 text-slate-500" />
              <span>Bulk CSV</span>
            </button>
            <button 
              onClick={() => setShowModal(true)} 
              className="btn-primary text-xs sm:text-sm py-2 sm:py-2.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Student</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="card p-4 bg-white border border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              className="input-field pl-10"
              placeholder="Search by student name or roll number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {!isMentor && (
            <div className="relative min-w-[200px]">
              <select 
                className="input-field font-medium text-slate-700" 
                value={mentorId} 
                onChange={(e) => setMentorId(e.target.value)}
              >
                <option value="">All Mentors</option>
                {mentors.map((m) => (
                  <option key={m._id} value={m._id}>{m.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Risk Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl self-start sm:self-auto overflow-x-auto">
          <button
            onClick={() => setRiskFilter('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              !riskFilter ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setRiskFilter('Low')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              riskFilter === 'Low' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            Low Risk
          </button>
          <button
            onClick={() => setRiskFilter('Moderate')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              riskFilter === 'Moderate' ? 'bg-amber-500 text-white shadow-xs' : 'text-amber-700 hover:bg-amber-50'
            }`}
          >
            Moderate
          </button>
          <button
            onClick={() => setRiskFilter('High')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              riskFilter === 'High' ? 'bg-rose-600 text-white shadow-xs' : 'text-rose-700 hover:bg-rose-50'
            }`}
          >
            High Risk
          </button>
        </div>
      </div>

      {/* Students Table */}
      <div className="card overflow-hidden border border-slate-200 shadow-sm">
        {loading ? (
          <div className="p-16 text-center">
            <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-600">Loading student directory...</p>
          </div>
        ) : data.students.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
            <div>
              <p className="text-sm font-bold text-slate-700">
                {isMentor && mentorScope === 'mine'
                  ? 'No mentees currently assigned to your roster'
                  : 'No students match your query'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {isMentor && mentorScope === 'mine'
                  ? 'You can switch to All Students to explore student analytics and propose interventions.'
                  : 'Try clearing the search query or risk filter.'}
              </p>
            </div>
            {isMentor && mentorScope === 'mine' && (
              <button
                type="button"
                onClick={() => setMentorScope('all')}
                className="btn-primary text-xs py-2 px-4 mx-auto inline-flex items-center gap-1.5"
              >
                <span>View All Campus Students</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <th className="text-left px-6 py-3.5">Student</th>
                  <th className="text-left px-6 py-3.5">Class / Section</th>
                  {!isMentor && <th className="text-left px-6 py-3.5">Assigned Mentor</th>}
                  <th className="text-left px-6 py-3.5">Attendance</th>
                  <th className="text-left px-6 py-3.5">Assessment</th>
                  <th className="text-left px-6 py-3.5">Risk Score</th>
                  <th className="text-left px-6 py-3.5">Status</th>
                  <th className="text-right px-6 py-3.5">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.students.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-3.5">
                      <Link to={`/students/${s._id}`} className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-100 to-indigo-100 text-primary-700 flex items-center justify-center font-bold text-xs shrink-0 border border-primary-200/60 shadow-2xs group-hover:scale-105 transition-transform">
                          {s.name[0]}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 group-hover:text-primary-600 transition-colors">
                            {s.name}
                          </p>
                          <p className="text-xs text-slate-400 font-mono mt-0.5">{s.rollNumber}</p>
                        </div>
                      </Link>
                    </td>

                    <td className="px-6 py-3.5 text-slate-600 font-semibold whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                        Year {s.year} · Sec {s.section}
                      </span>
                    </td>

                    {!isMentor && (
                      <td className="px-6 py-3.5 text-slate-600 whitespace-nowrap font-medium text-xs">
                        {s.mentor?.name ? (
                          <span className="text-slate-800 font-semibold">{s.mentor.name}</span>
                        ) : (
                          <span className="text-slate-400 italic">Not Assigned</span>
                        )}
                      </td>
                    )}

                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <span className={`font-extrabold text-sm ${s.attendance < 75 ? 'text-rose-600' : 'text-slate-800'}`}>
                        {s.attendance}%
                      </span>
                    </td>

                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <span className="font-semibold text-slate-700">{s.assessmentMarks}%</span>
                    </td>

                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <span className="font-extrabold text-slate-900">{s.riskScore}</span>
                      <span className="text-xs text-slate-400">/100</span>
                    </td>

                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <RiskBadge level={s.riskLevel} size="sm" />
                    </td>

                    <td className="px-6 py-3.5 text-right whitespace-nowrap">
                      <Link
                        to={`/students/${s._id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-primary-700 hover:text-primary-900 bg-primary-50 hover:bg-primary-100/80 px-3 py-1.5 rounded-lg border border-primary-200/80 transition-colors"
                      >
                        <span>{isMentor ? 'Propose Action' : 'View Profile'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <p className="text-xs font-semibold text-slate-500">
          Showing {from}-{to} of {data.total} students
        </p>
        <div className="flex items-center gap-2">
          <button 
            className="btn-secondary text-xs px-3 py-1.5" 
            disabled={page <= 1} 
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>
          <span className="text-xs font-bold text-slate-700 px-2">
            Page {data.page} of {data.pages}
          </span>
          <button 
            className="btn-secondary text-xs px-3 py-1.5" 
            disabled={page >= data.pages} 
            onClick={() => setPage((p) => p + 1)}
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {showModal && <StudentFormModal onClose={() => setShowModal(false)} onSubmit={handleCreate} />}
      {showBulk && <BulkUploadModal onClose={() => setShowBulk(false)} onDone={handleBulkDone} />}
    </div>
  );
}
