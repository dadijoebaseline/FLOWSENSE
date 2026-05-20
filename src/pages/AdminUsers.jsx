import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

export default function AdminUsers() {
  const { user, logout } = useAuth();
  const [pendingUsers, setPendingUsers] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadPendingUsers = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/admin/pending');
        if (!response.ok) {
          throw new Error('Unable to load pending users');
        }
        const data = await response.json();
        setPendingUsers(data.pendingUsers || []);
      } catch (err) {
        setError(err.message || 'Could not load pending users.');
      } finally {
        setLoading(false);
      }
    };

    loadPendingUsers();
  }, []);

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-10">
        <div className="max-w-xl w-full rounded-3xl border border-slate-800 bg-slate-900/90 p-10 text-center text-slate-200 shadow-2xl shadow-slate-950/30">
          <h1 className="text-2xl font-semibold">Access denied</h1>
          <p className="mt-3 text-sm text-slate-400">You must be an administrator to review pending signup requests.</p>
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

  const handleApprove = async (userId) => {
    setMessage('');
    setError('');
    try {
      const response = await fetch('/api/admin/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Unable to approve user.');
      }
      const data = await response.json();
      setMessage('User approved successfully.');
      setPendingUsers((current) => current.filter((item) => item.id !== userId));
    } catch (err) {
      setError(err.message || 'Approval failed.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl shadow-slate-950/30">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-sky-300">Admin approval</p>
              <h1 className="mt-2 text-3xl font-semibold text-white">Pending signup requests</h1>
              <p className="mt-2 text-sm text-slate-400">
                Approve new email signups before they can access the application.
              </p>
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
              <p className="text-lg font-medium">Loading pending requests...</p>
            </div>
          ) : pendingUsers.length === 0 ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-8 text-center text-slate-300">
              <p className="text-lg font-medium">No pending requests</p>
              <p className="mt-2 text-sm text-slate-500">New signup requests will appear here when users request access.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingUsers.map((pendingUser) => (
                <div key={pendingUser.id} className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5 sm:flex sm:items-center sm:justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-white">{pendingUser.name}</p>
                    <p className="text-sm text-slate-400">{pendingUser.email}</p>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Requested on {new Date(pendingUser.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="mt-4 sm:mt-0">
                    <button
                      type="button"
                      onClick={() => handleApprove(pendingUser.id)}
                      className="rounded-2xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-400"
                    >
                      Approve account
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
