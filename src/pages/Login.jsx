import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

export default function Login() {
  const { isAuthenticated, login, signup } = useAuth();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const resetFeedback = () => {
    setMessage('');
    setError('');
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    resetFeedback();

    const result = await login(email);
    if (result.success) {
      if (result.previewLink) {
        setMessage(`Magic link generated. Preview it here: ${result.previewLink}`);
      } else {
        setMessage('Check your email for a sign-in link. It may take a few moments to arrive.');
      }
      return;
    }

    if (result.error === 'signup_pending') {
      setMessage('Your signup request is pending approval. Please wait for an admin to approve your account.');
    } else if (result.error === 'user_not_registered') {
      setError('Email not registered. Switch to signup to request access.');
    } else {
      setError('Unable to sign in with that email.');
    }
  };

  const handleSignup = async (event) => {
    event.preventDefault();
    resetFeedback();

    const result = await signup({ name, email });
    if (result.success) {
      if (result.adminApproved) {
        setMessage('You are the first signup and have been approved as admin automatically. Please sign in with your email.');
      } else {
        setMessage('Signup request submitted. Admin approval is required before access is granted.');
      }
      return;
    }

    if (result.error === 'already_registered') {
      setError('This email already exists. Please log in.');
    } else if (result.error === 'signup_pending') {
      setMessage('A signup request is already pending for this email.');
    } else {
      setError('Unable to submit signup request.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-900/90 p-10 shadow-2xl shadow-slate-950/40 backdrop-blur-xl">
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-sky-300">FlowSense access</p>
          <h1 className="mt-4 text-3xl font-semibold text-white">Email sign-in and approval</h1>
          <p className="mt-3 text-sm text-slate-400">
            Sign in with your email or request access. The first signup will become the admin automatically.
          </p>
        </div>

        <div className="mb-6 flex items-center justify-center gap-2 text-sm text-slate-400">
          <button
            type="button"
            className={`rounded-full px-4 py-2 transition ${mode === 'login' ? 'bg-slate-800 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
            onClick={() => { resetFeedback(); setMode('login'); }}
          >
            Sign in
          </button>
          <button
            type="button"
            className={`rounded-full px-4 py-2 transition ${mode === 'signup' ? 'bg-slate-800 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
            onClick={() => { resetFeedback(); setMode('signup'); }}
          >
            Request access
          </button>
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

        <form onSubmit={mode === 'login' ? handleLogin : handleSignup} className="space-y-5">
          {mode === 'signup' && (
            <label className="block">
              <span className="text-sm font-medium text-slate-300">Name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                placeholder="Your full name"
                className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950/90 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
              />
            </label>
          )}

          <label className="block">
            <span className="text-sm font-medium text-slate-300">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              placeholder="you@example.com"
              className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950/90 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20"
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-400"
          >
            {mode === 'login' ? 'Sign in' : 'Request access'}
          </button>
        </form>

        <div className="mt-6 text-sm text-slate-500">
          <p>
            Use <strong>admin@flowsense.app</strong> to sign in as the administrator and approve pending signup requests.
          </p>
        </div>
      </div>
    </div>
  );
}
