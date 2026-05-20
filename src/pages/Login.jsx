import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

export default function Login() {
  const { isAuthenticated, login } = useAuth();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleGoogleSignIn = async () => {
    setMessage('');
    setError('');

    const result = await login();
    if (result.success) {
      setMessage('Signed in with Google. Redirecting...');
      return;
    }

    setError(result.message || 'Google sign-in failed. Please try again.');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-900/90 p-10 shadow-2xl shadow-slate-950/40 backdrop-blur-xl">
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-sky-300">FlowSense access</p>
          <h1 className="mt-4 text-3xl font-semibold text-white">Sign in with Google</h1>
          <p className="mt-3 text-sm text-slate-400">
            Authenticate through Firebase and use your Google account to access the dashboard.
          </p>
        </div>

        {message && (
          <div className="mb-4 rounded-2xl border border-slate-700 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-300">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-2xl border border-slate-700 bg-red-950/40 px-4 py-3 text-sm text-rose-300">
            {error}
          </div>
        )}

        <div className="space-y-5">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full rounded-2xl bg-slate-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Sign in with Google
          </button>

          <div className="rounded-2xl border border-slate-700 bg-slate-950/80 px-5 py-4 text-sm text-slate-300">
            <p>
              To sign in as administrator, set <strong>VITE_ADMIN_EMAIL</strong> to your admin Google address in your environment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
