import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, googleProvider } from './firebase.js';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';

const AuthContext = createContext();

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();
const ADMIN_EMAIL = normalizeEmail(import.meta.env.VITE_ADMIN_EMAIL || '');

const getRoleFromEmail = (email) => (normalizeEmail(email) === ADMIN_EMAIL ? 'admin' : 'viewer');

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
    setIsLoadingAuth(true);
    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        if (firebaseUser) {
          const email = firebaseUser.email || '';
          setUser({
            id: firebaseUser.uid,
            name: firebaseUser.displayName || 'User',
            email,
            role: getRoleFromEmail(email),
          });
          setIsAuthenticated(true);
          setAuthError(null);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
        setIsLoadingAuth(false);
        setAuthChecked(true);
      },
      (error) => {
        setUser(null);
        setIsAuthenticated(false);
        setAuthError({ type: 'server_error', message: error.message || 'Unable to verify authentication.' });
        setIsLoadingAuth(false);
        setAuthChecked(true);
      }
    );

    return unsubscribe;
  }, []);

  const login = async () => {
    setAuthError(null);
    try {
      const response = await signInWithPopup(auth, googleProvider);
      const firebaseUser = response.user;
      const email = firebaseUser.email || '';
      setUser({
        id: firebaseUser.uid,
        name: firebaseUser.displayName || 'User',
        email,
        role: getRoleFromEmail(email),
      });
      setIsAuthenticated(true);
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
