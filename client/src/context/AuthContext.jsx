import React, { createContext, useContext, useState } from 'react';

/**
 * TEMPORARY DEMONSTRATION AUTHENTICATION CONTEXT
 * 
 * IMPORTANT: This is for frontend demonstration and navigation flow only.
 * It is NOT secure authentication. It does not use JWT, sessions, or backend APIs.
 * State is stored in memory and will reset upon browser refresh.
 * Real production authentication with MongoDB, JWT, and password hashing will be
 * connected in subsequent backend steps.
 */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Demonstration-only authentication state (defaults to false for authentication-first flow)
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  /**
   * Simulated login function
   * Does NOT call any backend or store credentials in localStorage
   */
  const login = (email, password) => {
    // Basic demonstration mock user
    const mockUser = {
      name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'Campus Student',
      email: email,
      role: 'student',
    };

    setIsAuthenticated(true);
    setUser(mockUser);
    return true;
  };

  /**
   * Simulated logout function
   * Clears in-memory auth state
   */
  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook to consume authentication context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
