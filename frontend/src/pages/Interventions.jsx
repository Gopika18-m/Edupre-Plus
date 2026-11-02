import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  HeartHandshake, 
  Check, 
  X, 
  Play, 
  CheckCheck, 
  Clock, 
  AlertTriangle, 
  Filter, 
  MessageSquareQuote,
  Sparkles,
  ArrowRight,
  PlusCircle,
  Search,
  User,
  Lightbulb,
  Send
} from 'lucide-react';
import client from '../api/client';
import RiskBadge from '../components/RiskBadge';
import StatusBadge from '../components/StatusBadge';
import ActionModal from '../components/ActionModal';
import { useAuth } from '../context/AuthContext';
import { useToast, errMsg } from '../context/ToastContext';
import { fmtDate } from '../utils/date';

const FILTERS = [
  { value: '', label: 'All Statuses' },
  { value: 'Proposed', label: 'Awaiting Approval' },
  { value: 'Approved', label: 'Approved' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Resolved', label: 'Resolved' },
  { value: 'Rejected', label: 'Rejected' },
];

const CATEGORIES = ['Academic Support', 'Attendance', 'Engagement', 'Counseling', 'General'];

function ProposeModal({ onClose, onSuccess }) {
  const toast = useToast();
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [category, setCategory] = useState('Academic Support');
  const [recommendation, setRecommendation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  const isMentor = user?.role === 'mentor';

  useEffect(() => {
    client
      .get('/students', { params: { all: 'true', limit: 100 } })
      .then((res) => {
        const list = res.data.students || [];
        setStudents(list);
        if (list.length > 0) {
          if (isMentor) {
            const myFirst = list.find((s) => String(s.mentor?._id || s.mentor) === String(user?.id)) ||
                            list.find((s) => !s.mentor) || list[0];
            setSelectedStudentId(myFirst._id);
          } else {
            setSelectedStudentId(list[0]._id);
          }
        }
      })
      .catch((err) => toast.error(errMsg(err, 'Failed to load students')))
      .finally(() => setLoadingStudents(false));
  }, [toast, isMentor, user?.id]);

  useEffect(() => {
    if (!selectedStudentId) {
      setSuggestions([]);
      return;
    }
    setLoadingSuggestions(true);
    client
      .get(`/interventions/suggestions/${selectedStudentId}`)
      .then((res) => setSuggestions(res.data || []))
      .catch(() => setSuggestions([]))
      .finally(() => setLoadingSuggestions(false));
  }, [selectedStudentId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudentId || !recommendation.trim()) return;
    setSubmitting(true);
    try {
      await client.post('/interventions', {
        student: selectedStudentId,
        category,
        recommendation: recommendation.trim(),
      });
      toast.success(
        isMentor
          ? 'Intervention proposal submitted for faculty approval!'
          : 'Intervention created and approved successfully!'
      );
      onSuccess();
    } catch (err) {
      toast.error(errMsg(err, 'Failed to submit intervention proposal'));
    } finally {
      setSubmitting(false);
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(search.toLowerCase())
  );

  const selectedStudent = students.find((s) => s._id === selectedStudentId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="card w-full max-w-xl bg-white p-6 sm:p-7 border border-slate-200 shadow-2xl rounded-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center font-bold">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                {isMentor ? 'Propose Student Intervention' : 'Add Direct Intervention'}
              </h2>
              <p className="text-xs text-slate-400">
                {isMentor
                  ? 'Recommend corrective academic or attendance actions for faculty approval.'
                  : 'Register and activate a corrective intervention for a student.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Select Student */}
          <div>
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 block">
              1. Select Student
            </label>
            {loadingStudents ? (
              <div className="p-3 text-center text-xs text-slate-400">Loading student directory...</div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by student name or roll number..."
                    className="input-field pl-9 py-2 text-xs"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <select
                  required
                  className="input-field font-semibold text-slate-800"
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                >
                  {filteredStudents.map((st) => {
                    const isMine = String(st.mentor?._id || st.mentor) === String(user?.id);
                    const isUnassigned = !st.mentor;
                    const tag = isMentor
                      ? (isMine ? ' [My Mentee]' : (isUnassigned ? ' [Unassigned]' : ` [Mentor: ${st.mentor?.name || 'Assigned'}]`))
                      : '';
                    return (
                      <option 
                        key={st._id} 
                        value={st._id}
                        disabled={isMentor && !isMine && !isUnassigned}
                      >
                        {st.name} ({st.rollNumber}){tag} — {st.riskLevel} Risk ({st.attendance}%)
                      </option>
                    );
                  })}
                </select>
              </div>
            )}
          </div>

          {/* AI Recommended Suggestions */}
          {selectedStudent && (
            <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200/70 space-y-2">
              <div className="flex items-center gap-1.5 text-amber-800 text-xs font-bold">
                <Lightbulb className="w-4 h-4 text-amber-600" />
                <span>Recommended Strategies for {selectedStudent.name.split(' ')[0]}</span>
              </div>
              {loadingSuggestions ? (
                <p className="text-[11px] text-amber-700">Loading tailored suggestions...</p>
              ) : suggestions.length === 0 ? (
                <p className="text-[11px] text-amber-700">No rule flags; student is within normal thresholds. Custom recommendations can still be entered below.</p>
              ) : (
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {suggestions.map((sug, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setCategory(sug.category);
                        setRecommendation(sug.recommendation);
                      }}
                      className="w-full text-left p-2 rounded-xl bg-white border border-amber-200/60 hover:border-amber-400 hover:shadow-xs transition-all text-xs group"
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[10px] font-bold text-amber-800 uppercase px-1.5 py-0.2 rounded bg-amber-100">
                          {sug.category}
                        </span>
                        <span className="text-[10px] text-primary-600 font-semibold group-hover:underline">Use this ↗</span>
                      </div>
                      <p className="text-slate-700 font-medium line-clamp-2">{sug.recommendation}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Category */}
          <div>
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 block">
              2. Intervention Category
            </label>
            <select
              className="input-field font-semibold text-slate-700"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Recommendation Description */}
          <div>
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 block">
              3. Proposed Action / Recommendation
            </label>
            <textarea
              required
              rows={3}
              maxLength={500}
              className="input-field py-2 text-sm"
              placeholder="e.g. Conduct weekly 20-minute mentor check-ins and coordinate peer tutoring for Data Structures..."
              value={recommendation}
              onChange={(e) => setRecommendation(e.target.value)}
            />
            <p className="text-[11px] text-slate-400 text-right mt-1">
              {recommendation.length}/500 characters
            </p>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-xs py-2.5 px-4"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !recommendation.trim()}
              className="btn-primary text-xs py-2.5 px-5"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>{isMentor ? 'Submit for Faculty Review' : 'Register Intervention'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Interventions() {
  const { user } = useAuth();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || '';
  const filterMine = params.get('mine') === 'true';
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [proposeOpen, setProposeOpen] = useState(false);
  const [reload, setReload] = useState(0);

  const isStaff = user?.role === 'faculty' || user?.role === 'admin';
  const isMentor = user?.role === 'mentor';

  useEffect(() => {
    setLoading(true);
    const query = {};
    if (status) query.status = status;
    if (isMentor && !filterMine) query.all = 'true';

    client
      .get('/interventions', { params: query })
      .then((res) => {
        let list = res.data || [];
        if (filterMine) {
          list = list.filter(
            (i) =>
              String(i.proposedBy?._id || i.proposedBy) === String(user?.id) ||
              String(i.approvedBy?._id || i.approvedBy) === String(user?.id)
          );
        }
        setItems(list);
      })
      .catch((err) => toast.error(errMsg(err, 'Could not load interventions')))
      .finally(() => setLoading(false));
  }, [status, filterMine, reload, isMentor, user?.id, toast]);

  const done = (msg) => { 
    toast.success(msg); 
    setModal(null); 
    setReload((r) => r + 1); 
  };

  const decide = (item, decision) => async (note) => {
    await client.put(`/interventions/${item._id}/decision`, { decision, note });
    done(decision === 'Approved' ? 'Intervention approved successfully' : 'Intervention proposal rejected');
  };
  
  const progress = (item, next) => async (note) => {
    await client.put(`/interventions/${item._id}`, { status: next, progressNote: note || undefined });
    done(next === 'Resolved' ? 'Intervention marked as resolved' : 'Intervention marked as in progress');
  };

  const pendingCount = items.filter((i) => i.status === 'Proposed').length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Intervention Lifecycle Workflow
            </h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
              Multi-Tier Review
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1 max-w-3xl">
            {isStaff
              ? 'Review and decide on mentoring intervention proposals submitted by mentors. Approved actions can then be tracked through to resolution.'
              : 'Propose targeted interventions for your mentees or students. Once approved by faculty, monitor your progress and mark actions resolved.'}
          </p>
        </div>

        {/* Propose Action Button */}
        <button
          onClick={() => setProposeOpen(true)}
          className="btn-primary text-xs sm:text-sm py-2.5 px-4 shrink-0 shadow-md shadow-primary-500/20"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{isMentor ? 'Propose Intervention' : 'Add Intervention'}</span>
        </button>
      </div>

      {/* Filter Tabs & Mine Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100/90 rounded-2xl w-fit">
          {FILTERS.map((f) => {
            const isActive = status === f.value;
            return (
              <button
                key={f.value}
                onClick={() => {
                  const n = new URLSearchParams(params);
                  if (f.value) n.set('status', f.value);
                  else n.delete('status');
                  setParams(n);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isActive 
                    ? 'bg-white text-primary-700 shadow-xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Personal filter toggle */}
        <button
          onClick={() => {
            const n = new URLSearchParams(params);
            if (!filterMine) n.set('mine', 'true');
            else n.delete('mine');
            setParams(n);
          }}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
            filterMine
              ? 'bg-primary-600 text-white border-primary-600 shadow-xs'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          {filterMine ? '✓ Showing My Proposals & Actions' : 'Show Only My Interventions'}
        </button>
      </div>

      {/* Staff Pending Approvals Banner */}
      {isStaff && !status && pendingCount > 0 && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/90 text-amber-900 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-bold">
                {pendingCount} Proposal{pendingCount > 1 ? 's' : ''} Awaiting Faculty Review
              </p>
              <p className="text-xs text-amber-700">
                Mentors have suggested corrective actions that require formal approval before commencement.
              </p>
            </div>
          </div>
          <button 
            onClick={() => {
              const n = new URLSearchParams(params);
              n.set('status', 'Proposed');
              setParams(n);
            }} 
            className="text-xs font-bold text-amber-800 hover:underline px-3 py-1.5 bg-white/70 rounded-lg border border-amber-200 shrink-0"
          >
            Filter Awaiting
          </button>
        </div>
      )}

      {/* Interventions Ledger */}
      <div className="card overflow-hidden border border-slate-200 shadow-sm">
        {loading ? (
          <div className="p-16 text-center">
            <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-600">Loading intervention records...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <HeartHandshake className="w-10 h-10 text-slate-300 mx-auto" />
            <div>
              <p className="text-sm font-bold text-slate-700">No interventions found in this view</p>
              <p className="text-xs text-slate-400 mt-1">
                You can propose a new intervention anytime using the button above.
              </p>
            </div>
            <button
              onClick={() => setProposeOpen(true)}
              className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1.5 mx-auto"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Propose an Intervention</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {items.map((it) => {
              const isProposer = String(it.proposedBy?._id || it.proposedBy) === String(user?.id);
              const isApprover = String(it.approvedBy?._id || it.approvedBy) === String(user?.id);

              return (
                <div 
                  key={it._id} 
                  className="p-5 sm:p-6 flex flex-col md:flex-row md:items-start justify-between gap-5 hover:bg-slate-50/60 transition-colors"
                >
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <Link 
                        to={`/students/${it.student?._id}`} 
                        className="font-bold text-slate-900 text-base hover:text-primary-600 transition-colors"
                      >
                        {it.student?.name || 'Unknown Student'}
                      </Link>
                      {it.student?.riskLevel && <RiskBadge level={it.student.riskLevel} size="sm" />}
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-primary-50 text-primary-700 border border-primary-100">
                        {it.category}
                      </span>
                      <StatusBadge status={it.status} />
                    </div>

                    <p className="text-sm text-slate-800 leading-relaxed font-medium">
                      {it.recommendation}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                      <span>
                        Proposed by{' '}
                        <strong className="text-slate-700">
                          {it.proposedBy?.name || 'Mentor'} {isProposer && '(You)'}
                        </strong>{' '}
                        ({it.proposedBy?.role || 'mentor'})
                      </span>
                      <span>•</span>
                      <span>{fmtDate(it.createdAt)}</span>
                    </div>

                    {it.decisionNote && it.status !== 'Proposed' && (
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs text-slate-600 space-y-0.5">
                        <span className="font-bold text-slate-700">
                          {it.approvedBy?.name ? `${it.approvedBy.name}${isApprover ? ' (You)' : ''}` : 'Faculty Decision Note'}:
                        </span>
                        <p className="text-slate-600">{it.decisionNote}</p>
                      </div>
                    )}

                    {it.progressNote && (
                      <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-900 space-y-0.5">
                        <span className="font-bold text-indigo-800">Latest Progress Log:</span>
                        <p>{it.progressNote}</p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons Column */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    {it.status === 'Proposed' && isStaff && (
                      <div className="flex items-center gap-2">
                        <button 
                          className="btn-primary text-xs py-2 px-3.5" 
                          onClick={() => setModal({ kind: 'approve', item: it })}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        <button 
                          className="text-xs px-3 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-semibold transition-colors flex items-center gap-1" 
                          onClick={() => setModal({ kind: 'reject', item: it })}
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>
                    )}

                    {it.status === 'Proposed' && !isStaff && (
                      <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Pending Faculty Review</span>
                      </span>
                    )}

                    {it.status === 'Approved' && (
                      <div className="flex items-center gap-2">
                        <button 
                          className="btn-secondary text-xs py-2 px-3.5" 
                          onClick={() => setModal({ kind: 'start', item: it })}
                        >
                          <Play className="w-3.5 h-3.5 text-primary-600" />
                          <span>Start Action</span>
                        </button>
                        <button 
                          className="btn-primary text-xs py-2 px-3.5" 
                          onClick={() => setModal({ kind: 'resolve', item: it })}
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>Resolve</span>
                        </button>
                      </div>
                    )}

                    {it.status === 'In Progress' && (
                      <button 
                        className="btn-primary text-xs py-2 px-3.5" 
                        onClick={() => setModal({ kind: 'resolve', item: it })}
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>Mark Resolved</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Propose Intervention Modal */}
      {proposeOpen && (
        <ProposeModal
          onClose={() => setProposeOpen(false)}
          onSuccess={() => {
            setProposeOpen(false);
            setReload((r) => r + 1);
          }}
        />
      )}

      {modal?.kind === 'approve' && (
        <ActionModal 
          title="Approve Intervention Proposal" 
          description={`${modal.item.student?.name}: ${modal.item.recommendation}`} 
          label="Advisory note for mentor"
          confirmText="Approve Intervention" 
          onClose={() => setModal(null)} 
          onSubmit={decide(modal.item, 'Approved')} 
        />
      )}
      {modal?.kind === 'reject' && (
        <ActionModal 
          title="Reject Intervention Proposal" 
          description={`${modal.item.student?.name}: ${modal.item.recommendation}`} 
          label="Mandatory Reason for rejection" 
          required 
          danger
          confirmText="Confirm Rejection" 
          onClose={() => setModal(null)} 
          onSubmit={decide(modal.item, 'Rejected')} 
        />
      )}
      {modal?.kind === 'start' && (
        <ActionModal 
          title="Initiate Intervention Progress" 
          description={`${modal.item.student?.name}: ${modal.item.recommendation}`} 
          label="Progress notes / initial action taken"
          confirmText="Mark In Progress" 
          onClose={() => setModal(null)} 
          onSubmit={progress(modal.item, 'In Progress')} 
        />
      )}
      {modal?.kind === 'resolve' && (
        <ActionModal 
          title="Mark Intervention as Resolved" 
          description={`${modal.item.student?.name}: ${modal.item.recommendation}`} 
          label="Outcome summary & student response"
          confirmText="Confirm Resolution" 
          onClose={() => setModal(null)} 
          onSubmit={progress(modal.item, 'Resolved')} 
        />
      )}
    </div>
  );
}