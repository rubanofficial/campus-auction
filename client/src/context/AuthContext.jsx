import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Check current session on mount and restore authentication state
   * Calls GET /api/auth/me with credentials
   */
  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setIsAuthenticated(true);
          setUser({
            ...data.user,
            name: data.user.displayName, // Compatibility alias for navbar and profile display
          });
          return data.user;
        }
      }
      setIsAuthenticated(false);
      setUser(null);
      return null;
    } catch (error) {
      console.warn('[AuthContext] Session verification unreachable:', error.message);
      setIsAuthenticated(false);
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  /**
   * Real student login calling backend POST /api/auth/login
   */
  const login = async (email, password) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data.message || data.error || 'Invalid email or password.';
      throw new Error(errorMsg);
    }

    if (data.user) {
      setIsAuthenticated(true);
      setUser({
        ...data.user,
        name: data.user.displayName,
      });
    } else {
      await checkAuth();
    }

    return data;
  };

  /**
   * Real student logout calling backend POST /api/auth/logout
   */
  const logout = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('[AuthContext] Logout request error:', error.message);
    } finally {
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        isLoading,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
