import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

const ROLE_OPTIONS = ['viewer', 'manager'];

export default function AdminUsers() {
  const { user, logout, getIdToken } = useAuth();
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const token = await getIdToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch('/api/admin/users', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // 404 expected on static deployment (no backend API)
        if (response.status === 404) {
          throw new Error('Admin API not available in static deployment. User management requires backend.');
        }
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Unable to load users');
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      // Suppress logging for expected 404 errors
      if (!err.message.includes('static deployment')) {
        console.debug('AdminUsers fetch error:', err.message);
      }
      setError(err.message || 'Could not load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-10">
        <div className="max-w-xl w-full rounded-3xl border border-slate-800 bg-slate-900/90 p-10 text-center text-slate-200 shadow-2xl shadow-slate-950/30">
          <h1 className="text-2xl font-semibold">Access denied</h1>
          <p className="mt-3 text-sm text-slate-400">You must be an administrator to manage users.</p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mt-6 rounded-2xl bg-slate-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-600"
          >
            Return to dashboard
          </button>
        </div>
      </div>
    );
  }

  const handleUpdate = async (userId, updates) => {
    setMessage('');
    setError('');
    try {
      const token = await getIdToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch('/api/admin/user', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, ...updates }),
      });

      if (!response.ok) {
        // 404 expected on static deployment (no backend API)
        if (response.status === 404) {
          throw new Error('Admin API not available in static deployment. User management requires backend.');
        }
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Unable to update user.');
      }

      const data = await response.json();
      setMessage('User updated successfully.');
      setUsers((current) => current.map((item) => (item.id === userId ? data.user : item)));
    } catch (err) {
      if (!err.message.includes('static deployment')) {
        console.debug('AdminUsers update error:', err.message);
      }
      setError(err.message || 'Update failed.');
    }
  };

  const handleDelete = async (userId) => {
    setMessage('');
    setError('');
    try {
      const token = await getIdToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch('/api/admin/user', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        // 404 expected on static deployment (no backend API)
        if (response.status === 404) {
          throw new Error('Admin API not available in static deployment. User management requires backend.');
        }
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Unable to remove user.');
      }

      setMessage('User removed successfully.');
      setUsers((current) => current.filter((item) => item.id !== userId));
    } catch (err) {
      if (!err.message.includes('static deployment')) {
        console.debug('AdminUsers delete error:', err.message);
      }
      setError(err.message || 'Remove failed.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl shadow-slate-950/30">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-sky-300">User management</p>
              <h1 className="mt-2 text-3xl font-semibold text-white">Manage application users</h1>
              <p className="mt-2 text-sm text-slate-400">Edit user roles, remove users, or ban/unban accounts.</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => logout()}
                className="rounded-2xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-400"
              >
                Logout
              </button>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="rounded-2xl bg-slate-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-600"
              >
                Dashboard
              </button>
            </div>
          </div>

          {message && (
            <div className="mt-6 rounded-2xl border border-emerald-800 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-300">
              {message}
            </div>
          )}
          {error && (
            <div className="mt-6 rounded-2xl border border-rose-800 bg-rose-950/40 px-4 py-3 text-sm text-rose-300">
              {error}
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 shadow-2xl shadow-slate-950/30">
          {loading ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-8 text-center text-slate-300">
              <p className="text-lg font-medium">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-8 text-center text-slate-300">
              <p className="text-lg font-medium">No users found</p>
              <p className="mt-2 text-sm text-slate-500">New users will appear here after they sign in.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((appUser) => (
                <div key={appUser.id} className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5 sm:flex sm:items-center sm:justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-white">{appUser.name}</p>
                    <p className="text-sm text-slate-400">{appUser.email}</p>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      Role: <span className="font-medium text-slate-200">{appUser.role}</span>
                      {appUser.banned ? ' · BANNED' : ''}
                    </p>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2 sm:mt-0">
                    <select
                      value={appUser.role}
                      onChange={(event) => handleUpdate(appUser.id, { role: event.target.value })}
                      className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none"
                      disabled={appUser.email === user.email}
                    >
                      {appUser.email === user.email ? (
                        <option value={appUser.role}>{appUser.role}</option>
                      ) : (
                        ROLE_OPTIONS.map((role) => (
                          <option key={role} value={role}>{role}</option>
                        ))
                      )}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleUpdate(appUser.id, { banned: !appUser.banned })}
                      className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${appUser.banned ? 'bg-emerald-500 text-white hover:bg-emerald-400' : 'bg-yellow-500 text-slate-950 hover:bg-yellow-400'}`}
                    >
                      {appUser.banned ? 'Unban' : 'Ban'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(appUser.id)}
                      className="rounded-2xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-400"
                      disabled={appUser.email === user.email}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
