import React, { useState } from 'react';

// A small popup with a note box. Used to approve / reject / resolve with a comment.
export default function ActionModal({ title, description, label = 'Note', required = false, confirmText = 'Confirm', danger = false, onClose, onSubmit }) {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (required && !note.trim()) {
      setError('Please write a short reason.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await onSubmit(note.trim());
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <form onSubmit={submit} className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">{title}</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>
        <div className="p-6 space-y-3">
          {description && <p className="text-sm text-slate-600">{description}</p>}
          {error && <div className="px-3 py-2 rounded-lg bg-rose-50 text-rose-700 text-sm border border-rose-200">{error}</div>}
          <label className="text-sm font-medium text-slate-700 block">
            {label}{required ? '' : ' (optional)'}
            <textarea className="input-field mt-1" rows={3} maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={busy}
              className={danger ? 'bg-rose-600 hover:bg-rose-700 text-white font-medium px-4 py-2 rounded-lg disabled:opacity-50' : 'btn-primary'}>
              {busy ? 'Saving...' : confirmText}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
