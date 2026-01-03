'use client';

/**
 * PulZ Authentication Context
 * Phase D0 Hard Execution Mode
 *
 * Provides user authentication state from OpenWebUI session.
 * User info is injected by the OpenWebUI extension via window.__PULZ_USER__
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface PulzUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: PulzUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PulzUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Read user info from window.__PULZ_USER__ (injected by OpenWebUI extension)
    if (typeof window !== 'undefined') {
      const pulzUser = (window as any).__PULZ_USER__;

      if (pulzUser && pulzUser.id) {
        setUser({
          id: pulzUser.id,
          email: pulzUser.email || '',
          name: pulzUser.name || 'User',
          role: pulzUser.role || 'user',
        });
      }

      setIsLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
