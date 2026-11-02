import React, { useEffect, useState } from 'react';
import client from '../api/client';

const DEFAULTS = {
  name: '',
  rollNumber: '',
  email: '',
  year: 1,
  section: 'A',
  mentor: '',
  attendance: 80,
  assessmentMarks: 80,
  assignmentCompletion: 80,
  engagementScore: 80,
  previousPerformance: 80,
};

const SLIDERS = [
  { key: 'attendance', label: 'Attendance %' },
  { key: 'assessmentMarks', label: 'Assessment Marks %' },
  { key: 'assignmentCompletion', label: 'Assignment Completion %' },
  { key: 'engagementScore', label: 'Engagement Score %' },
  { key: 'previousPerformance', label: 'Previous Performance %' },
];

export default function StudentFormModal({ initial, onClose, onSubmit }) {
  const [form, setForm] = useState(initial ? { ...DEFAULTS, ...initial, mentor: initial.mentor?._id || '' } : DEFAULTS);
  const [mentors, setMentors] = useState([]);
  const autoAttendance = (initial?.attendanceTotalDays || 0) > 0;
  useEffect(() => {
    client.get('/admin/mentors').then((res) => setMentors(res.data)).catch(() => {});
  }, []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save student');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
          <h3 className="font-semibold text-slate-900">{initial ? 'Edit Student' : 'Add Student'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="px-3 py-2.5 rounded-lg bg-rose-50 text-rose-700 text-sm border border-rose-200">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Full name</label>
              <input
                required
                className="input-field"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Roll number</label>
              <input
                required
                disabled={!!initial}
                className="input-field disabled:bg-slate-50 disabled:text-slate-400"
                value={form.rollNumber}
                onChange={(e) => handleChange('rollNumber', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Email</label>
              <input
                type="email"
                className="input-field"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Mentor</label>
              <select className="input-field" value={form.mentor} onChange={(e) => handleChange('mentor', e.target.value)}>
                <option value="">No mentor assigned</option>
                {mentors.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Year</label>
              <select
                className="input-field"
                value={form.year}
                onChange={(e) => handleChange('year', Number(e.target.value))}
              >
                {[1, 2, 3, 4].map((y) => (
                  <option key={y} value={y}>
                    Year {y}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 mb-1 block">Section</label>
              <input
                className="input-field"
                value={form.section}
                onChange={(e) => handleChange('section', e.target.value)}
              />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <p className="text-sm font-semibold text-slate-700 mb-3">Academic Indicators</p>
            <div className="space-y-4">
              {SLIDERS.map(({ key, label }) => (
                <div key={key}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600">
                      {label}
                      {key === 'attendance' && autoAttendance && <span className="ml-2 text-xs text-emerald-700">calculated from daily attendance</span>}
                    </span>
                    <span className="font-semibold text-slate-900">{form[key]}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    disabled={key === 'attendance' && autoAttendance}
                    value={form[key]}
                    onChange={(e) => handleChange(key, Number(e.target.value))}
                    className="w-full accent-primary-600"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : initial ? 'Save Changes' : 'Add Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
