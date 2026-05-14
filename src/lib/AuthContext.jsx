import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState({
    id: 'static-user',
    name: 'Demo User',
    email: 'demo@example.com',
    role: 'admin' // Static version - full admin access
  });
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(true);
  const [appPublicSettings, setAppPublicSettings] = useState({
    id: 'flowsense-demo',
    public_settings: {}
  });

  useEffect(() => {
    // Static version - always authenticated
    setIsAuthenticated(true);
    setAuthChecked(true);
  }, []);

  const logout = (shouldRedirect = true) => {
    // Static version - no logout functionality
    console.log('Logout called in static version');
  };

  const navigateToLogin = () => {
    // Static version - no login required
    console.log('Login navigation called in static version');
  };

  const checkUserAuth = async () => {
    // Static version - always authenticated
    return true;
  };

  const checkAppState = async () => {
    // Static version - always ready
    return true;
  };

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
      checkAppState
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