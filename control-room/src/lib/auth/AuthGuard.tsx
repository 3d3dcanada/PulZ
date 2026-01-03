'use client';

/**
 * PulZ Authentication Guard
 * Phase D0 Hard Execution Mode
 *
 * Protects pages from unauthenticated access.
 * Shows loading state while checking auth, then redirects or shows content.
 */

import React from 'react';
import { useAuth } from './AuthContext';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-400">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] text-white flex items-center justify-center">
        <div className="text-center max-w-md p-8 border border-red-500 rounded-lg bg-[#1a1f2e]">
          <h1 className="text-3xl font-bold text-red-500 mb-4">🔐 Authentication Required</h1>
          <p className="text-gray-400 mb-4">
            PulZ is only accessible to logged-in OpenWebUI users.
          </p>
          <p className="text-gray-500 text-sm">
            This page should only be accessed through OpenWebUI.
          </p>
          <a
            href="/"
            className="mt-6 inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
          >
            Return to OpenWebUI
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function withAuthGuard<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> {
  const GuardedComponent: React.FC<P> = (props) => (
    <AuthGuard>
      <Component {...props} />
    </AuthGuard>
  );

  GuardedComponent.displayName = `withAuthGuard(${Component.displayName || Component.name})`;

  return GuardedComponent;
}
