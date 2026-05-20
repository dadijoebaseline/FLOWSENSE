import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

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
    const fetchSession = async () => {
      setIsLoadingAuth(true);
      try {
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          const payload = await response.json();
          if (payload.authenticated) {
            setUser(payload.user);
            setIsAuthenticated(true);
            setAuthError(null);
          } else {
            setUser(null);
            setIsAuthenticated(false);
            setAuthError({ type: 'auth_required', message: 'Please log in.' });
          }
        } else {
          setUser(null);
          setIsAuthenticated(false);
          setAuthError({ type: 'auth_required', message: 'Please log in.' });
        }
      } catch (error) {
        setUser(null);
        setIsAuthenticated(false);
        setAuthError({ type: 'server_error', message: 'Unable to check authentication.' });
      } finally {
        setIsLoadingAuth(false);
        setAuthChecked(true);
      }
    };

    fetchSession();
  }, []);

  const navigateToLogin = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  const login = async (email) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error };
      }
      return { success: true, ...data };
    } catch (error) {
      return { success: false, error: 'server_error', message: error.message };
    }
  };

  const signup = async ({ name, email }) => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });
      const data = await response.json();
      if (!response.ok && response.status !== 200 && response.status !== 201) {
        return { success: false, error: data.error };
      }
      return { success: true, ...data };
    } catch (error) {
      return { success: false, error: 'server_error', message: error.message };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      // ignore
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
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState,
      login,
      signup,
    }}>
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
