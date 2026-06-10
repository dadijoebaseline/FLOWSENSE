import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, googleProvider } from './firebase.js';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';

const AuthContext = createContext();

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const ADMIN_EMAIL = normalizeEmail(import.meta.env.VITE_ADMIN_EMAIL || '');

const getRoleFromEmail = (email) => (normalizeEmail(email) === ADMIN_EMAIL ? 'admin' : 'viewer');

const fetchUserSession = async (idToken) => {
  try {
    const response = await fetch('/api/auth/session', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });

    // Handle 404 gracefully (static deployment scenario)
    if (response.status === 404) {
      // On static deployments without backend, assume user is authenticated
      return { success: true, user: { email: 'demo@example.com' } };
    }

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      return { success: false, ...data };
    }

    return { success: true, ...(await response.json()) };
  } catch (error) {
    // Network error or other fetch issue - gracefully handle for static deployment
    if (error.message && error.message.includes('Failed to fetch')) {
      return { success: true, user: { email: 'demo@example.com' } };
    }
    throw error;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings] = useState({
    id: 'flowsense-demo',
    public_settings: {},
  });

  useEffect(() => {
    let disposed = false;

    const syncSession = async (firebaseUser) => {
      if (!firebaseUser) return;

      try {
        const token = await firebaseUser.getIdToken(true);
        const session = await fetchUserSession(token);

        if (disposed) return;

        if (session.success && session.user) {
          setUser(session.user);
          setIsAuthenticated(true);
          setAuthError(null);
        } else {
          setUser(null);
          setIsAuthenticated(false);
          setAuthError({ type: session.error || 'auth_required', message: session.message || 'Authentication failed.' });
          await signOut(auth);
        }
      } catch (error) {
        if (disposed) return;
        setUser(null);
        setIsAuthenticated(false);
        setAuthError({ type: 'server_error', message: error.message || 'Unable to verify authentication.' });
      } finally {
        if (disposed) return;
        setIsLoadingAuth(false);
        setAuthChecked(true);
      }
    };

    setIsLoadingAuth(true);
    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        if (firebaseUser) {
          syncSession(firebaseUser);
        } else {
          setUser(null);
          setIsAuthenticated(false);
          setIsLoadingAuth(false);
          setAuthChecked(true);
        }
      },
      (error) => {
        if (disposed) return;
        setUser(null);
        setIsAuthenticated(false);
        setAuthError({ type: 'server_error', message: error.message || 'Unable to verify authentication.' });
        setIsLoadingAuth(false);
        setAuthChecked(true);
      }
    );

    return () => {
      disposed = true;
      unsubscribe();
    };
  }, []);

  const getIdToken = async () => {
    if (!auth.currentUser) return null;
    return auth.currentUser.getIdToken(true);
  };

  const login = async () => {
    setAuthError(null);
    try {
      const response = await signInWithPopup(auth, googleProvider);
      const firebaseUser = response.user;
      const token = await firebaseUser.getIdToken(true);
      const session = await fetchUserSession(token);

      if (!session.success) {
        await signOut(auth);
        setUser(null);
        setIsAuthenticated(false);
        setAuthError({ type: session.error || 'auth_required', message: session.message || 'Authentication failed.' });
        return { success: false, error: session.error || 'auth_required', message: session.message || 'Authentication failed.' };
      }

      setUser(session.user);
      setIsAuthenticated(true);
      setAuthError(null);
      return { success: true };
    } catch (error) {
      const message = error?.message || 'Google sign-in failed.';
      setAuthError({ type: 'sign_in_failed', message });
      return { success: false, error: 'sign_in_failed', message };
    }
  };

  const signup = async () => ({
    success: false,
    error: 'signup_disabled',
    message: 'Sign up is handled through Firebase Google sign-in.',
  });

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      // ignore failures during sign out
    }
    setUser(null);
    setIsAuthenticated(false);
    setAuthError({ type: 'auth_required', message: 'Please log in.' });
  };

  const checkUserAuth = async () => {
    if (isAuthenticated) return true;
    setAuthError({ type: 'auth_required', message: 'Please log in.' });
    return false;
  };

  const checkAppState = async () => true;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        appPublicSettings,
        authChecked,
        logout,
        checkUserAuth,
        checkAppState,
        login,
        signup,
        getIdToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
