'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function MockAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleMockLogin = () => {
    // Set a mock auth token for testing
    localStorage.setItem('auth-token', 'mock-token');
    setIsAuthenticated(true);
    window.location.reload();
  };

  const handleMockLogout = () => {
    localStorage.removeItem('auth-token');
    setIsAuthenticated(false);
    window.location.reload();
  };

  if (isAuthenticated) {
    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-green-600">Mock Authentication Active</CardTitle>
          <CardDescription>
            You're signed in with a mock token for testing purposes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleMockLogout} variant="outline">
            Sign Out (Mock)
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-yellow-600">Mock Authentication</CardTitle>
        <CardDescription>
          For testing purposes, you can use mock authentication to test the checkout flow.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={handleMockLogin}>
          Sign In (Mock)
        </Button>
      </CardContent>
    </Card>
  );
}
