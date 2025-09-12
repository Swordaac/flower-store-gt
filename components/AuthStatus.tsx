'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useUser } from '@/contexts/UserContext';

export default function AuthStatus() {
  const { currentUser, session, loading } = useUser();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const authenticated = !!(currentUser && session?.access_token);
    setIsAuthenticated(authenticated);
    setIsLoading(loading);
  }, [currentUser, session, loading]);

  const handleLogin = () => {
    window.location.href = '/auth/signin';
  };

  const handleLogout = () => {
    // The logout will be handled by the AuthContext
    window.location.href = '/auth/signin';
  };

  if (isLoading) {
    return (
      <div className="text-sm text-gray-500">
        Checking authentication...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-yellow-800">
              Authentication Required
            </h3>
            <p className="text-sm text-yellow-700 mt-1">
              Please sign in to continue with checkout.
            </p>
          </div>
          <Button onClick={handleLogin} size="sm">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-green-800">
            Signed In
          </h3>
          <p className="text-sm text-green-700 mt-1">
            You're ready to proceed with checkout.
          </p>
        </div>
        <Button onClick={handleLogout} variant="outline" size="sm">
          Sign Out
        </Button>
      </div>
    </div>
  );
}

