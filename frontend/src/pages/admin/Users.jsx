import React, { useEffect, useState } from 'react';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast, errMsg } from '../../context/ToastContext';

const ROLE_STYLE = {
  admin: 'bg-violet-50 text-violet-700',
  faculty: 'bg-primary-50 text-primary-700',
  mentor: 'bg-amber-50 text-amber-700',
  student: 'bg-emerald-50 text-emerald-700',
};

export default function Users() {
  const { user: me } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = () => {
    setLoading(true);
    client
      .get('/admin/users')
      .then((res) => setUsers(res.data))
      .catch((err) => toast.error(errMsg(err, 'Could not load users')))
      .finally(() => setLoading(false));
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, []);

  const changeRole = async (u, role) => {
    try {
      await client.put(`/admin/users/${u._id}`, { role });
      toast.success(`${u.name} is now ${role}`);
      load();
    } catch (err) {
      toast.error(errMsg(err, 'Could not change role'));
    }
  };

  const remove = async (u) => {
    if (!window.confirm(`Delete the account for ${u.name}? This cannot be undone.`)) return;
    try {
      await client.delete(`/admin/users/${u._id}`);
      toast.success('User deleted');
      load();
    } catch (err) {
      toast.error(errMsg(err, 'Could not delete user'));
    }
  };

  const create = async (form) => {
    await client.post('/admin/users', form);
    toast.success('User created');
    setShowForm(false);
    load();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Users</h1>
          <p className="text-sm text-slate-500 mt-1">
            Create accounts and manage roles. Mentors are assigned students from the Students page. A student account is linked to the student record with the same email.
          </p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">+ Add User</button>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-slate-400 text-sm">Loading users...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                  <th className="text-left px-5 py-3 font-semibold">Name</th>
                  <th className="text-left px-5 py-3 font-semibold">Email</th>
                  <th className="text-left px-5 py-3 font-semibold">Role</th>
                  <th className="text-right px-5 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => {
                  const isMe = u._id === me?.id;
                  return (
                    <tr key={u._id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-semibold text-slate-800">{u.name}{isMe && <span className="ml-2 text-xs text-slate-400">(you)</span>}</td>
                      <td className="px-5 py-3 text-slate-600">{u.email}</td>
                      <td className="px-5 py-3">
                        {isMe ? (
                          <span className={`badge ${ROLE_STYLE[u.role]} capitalize`}>{u.role}</span>
                        ) : (
                          <select value={u.role} onChange={(e) => changeRole(u, e.target.value)} className="text-xs border border-slate-300 rounded-lg px-2 py-1.5 capitalize">
                            <option value="faculty">faculty</option>
                            <option value="mentor">mentor</option>
                            <option value="admin">admin</option>
                            <option value="student">student</option>
                          </select>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {!isMe && (
                          <button onClick={() => remove(u)} className="text-xs px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50">Delete</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && <UserForm onClose={() => setShowForm(false)} onSubmit={create} />}
    </div>
  );
}

function UserForm({ onClose, onSubmit }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'faculty' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onSubmit(form);
    } catch (err) {
      setError(errMsg(err, 'Could not create user'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Add user</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          {error && <div className="px-3 py-2.5 rounded-lg bg-rose-50 text-rose-700 text-sm border border-rose-200">{error}</div>}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Full name</label>
            <input required className="input-field" value={form.name} onChange={(e) => set('name', e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Email</label>
            <input required type="email" className="input-field" value={form.email} onChange={(e) => set('email', e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Temporary password</label>
            <input required minLength={6} type="password" className="input-field" value={form.password} onChange={(e) => set('password', e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1 block">Role</label>
            <select className="input-field" value={form.role} onChange={(e) => set('role', e.target.value)}>
              <option value="faculty">Faculty (approves interventions)</option>
              <option value="mentor">Mentor (proposes interventions)</option>
              <option value="admin">Admin</option>
              <option value="student">Student</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Creating...' : 'Create user'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
