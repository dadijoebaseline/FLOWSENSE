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
      <div className="w-full max-w-sm aspect-[2/3] rounded-3xl border border-white/10 bg-slate-900/90 p-8 shadow-2xl shadow-slate-950/40 backdrop-blur-xl flex flex-col justify-between">
        <div>
          <div className="mb-8 text-center">
            <img src="/images/logo.png" alt="FlowSense logo" className="mx-auto h-20 w-auto" />
            <p className="mt-6 text-sm uppercase tracking-[0.3em] text-sky-300">FlowSense access</p>
            <h1 className="mt-4 text-3xl font-semibold text-white">Sign in with Google</h1>
          </div>

          <div className="mb-8 flex items-center justify-center">
            <div className="aspect-square w-full max-w-xs overflow-hidden rounded-[2rem] border border-slate-700 bg-slate-950/80 shadow-inner">
              <video
                className="h-full w-full object-cover"
                src="/logovid.mp4"
                poster="/images/logo.png"
                autoPlay
                loop
                muted
                playsInline
              >
                <img
                  className="h-full w-full object-cover"
                  src="/images/logo.png"
                  alt="FlowSense video preview"
                />
              </video>
            </div>
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
        </div>

        <div className="space-y-5">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full rounded-2xl bg-slate-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  );
}
