import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { firestore } from '@/lib/firebase';
import { collection, query, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';

const ROLE_OPTIONS = ['viewer', 'manager', 'admin'];

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

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

      // Try API first (backend deployment)
      try {
        const response = await fetch('/api/admin/users', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUsers(data.users || []);
          return;
        }
      } catch (apiError) {
        // API failed, will try Firestore
      }

      // Fallback: Query Firestore directly (static deployment)
      const usersCollection = collection(firestore, 'flowsense_users');
      const q = query(usersCollection);
      const snapshot = await getDocs(q);
      const firestoreUsers = snapshot.docs.map((doc) => ({
        id: doc.id,
        name: doc.data().name || 'User',
        email: doc.data().email || '',
        displayName: doc.data().name || 'User',
        role: doc.data().role || 'viewer',
        banned: doc.data().banned || false,
        createdAt: doc.data().createdAt || new Date().toISOString(),
        updatedAt: doc.data().updatedAt || new Date().toISOString(),
      }));

      setUsers(firestoreUsers);
    } catch (err) {
      console.debug('AdminUsers fetch error:', err.message);
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

      // Try API first (backend deployment)
      try {
        const response = await fetch('/api/admin/user', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ userId, ...updates }),
        });

        if (response.ok) {
          const data = await response.json();
          setMessage('User updated successfully.');
          setUsers((current) => current.map((item) => (item.id === userId ? data.user : item)));
          return;
        }
      } catch (apiError) {
        // API failed, will try Firestore
      }

      // Fallback: Update Firestore directly (static deployment)
      const normalizedUserId = normalizeEmail(userId);
      const userRef = doc(firestore, 'flowsense_users', normalizedUserId);
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      await updateDoc(userRef, updateData);
      
      setMessage('User updated successfully.');
      setUsers((current) =>
        current.map((item) =>
          item.id === userId ? { ...item, ...updateData } : item
        )
      );
    } catch (err) {
      console.debug('AdminUsers update error:', err.message);
      setError(err.message || 'Update failed.');
    }
  };

  const handleDelete = async (userId) => {
    setMessage('');
    setError('');
    try {
      const token = await getIdToken();
      if (!token) throw new Error('Not authenticated');

      // Try API first (backend deployment)
      try {
        const response = await fetch('/api/admin/user', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ userId }),
        });

        if (response.ok) {
          setMessage('User removed successfully.');
          setUsers((current) => current.filter((item) => item.id !== userId));
          return;
        }
      } catch (apiError) {
        // API failed, will try Firestore
      }

      // Fallback: Delete from Firestore directly (static deployment)
      const normalizedUserId = normalizeEmail(userId);
      const userRef = doc(firestore, 'flowsense_users', normalizedUserId);
      await deleteDoc(userRef);
      
      setMessage('User removed successfully.');
      setUsers((current) => current.filter((item) => item.id !== userId));
    } catch (err) {
      console.debug('AdminUsers delete error:', err.message);
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
              <p className="mt-2 text-sm text-slate-400">View and manage roles, ban/unban users, and remove user accounts.</p>
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
              {users.some(u => u.isCurrentUser) && (
                <div className="rounded-2xl border border-blue-800 bg-blue-950/40 px-4 py-3 text-sm text-blue-300">
                  ✅ Static deployment: Full user management enabled via Firestore. All admin operations work on static deployments.
                </div>
              )}
              {users.map((appUser) => (
                <div key={appUser.id} className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5 sm:flex sm:items-center sm:justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-white">{appUser.displayName || appUser.email.split('@')[0]}</p>
                      {appUser.isCurrentUser && <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">Current User</span>}
                    </div>
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
                      className="rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none hover:border-slate-600"
                      disabled={appUser.email === user.email}
                      title={appUser.email === user.email ? 'Cannot change your own role' : 'Manage role'}
                    >
                      {ROLE_OPTIONS.map((role) => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleUpdate(appUser.id, { banned: !appUser.banned })}
                      className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${appUser.banned ? 'bg-emerald-500 text-white hover:bg-emerald-400' : 'bg-yellow-500 text-slate-950 hover:bg-yellow-400'} ${appUser.email === user.email ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={appUser.email === user.email}
                      title={appUser.email === user.email ? 'Cannot ban yourself' : ''}
                    >
                      {appUser.banned ? 'Unban' : 'Ban'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Remove user ${appUser.email}? This cannot be undone.`)) {
                          handleDelete(appUser.id);
                        }
                      }}
                      className={`rounded-2xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-400 ${appUser.email === user.email ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={appUser.email === user.email}
                      title={appUser.email === user.email ? 'Cannot remove yourself' : ''}
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
