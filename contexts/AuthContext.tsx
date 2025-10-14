'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { supabase, type AuthUser, type AuthSession } from '@/lib/supabase';
import { User, AuthResponse, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: AuthSession | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  createUserInBackend: (token: string, userData: { email: string; fullName?: string }) => Promise<void>;
  refreshSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('AuthContext - Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('AuthContext - Error getting session:', error);
          return;
        }
        
        if (session) {
          console.log('AuthContext - Session found:', {
            hasAccessToken: !!session.access_token,
            hasRefreshToken: !!session.refresh_token,
            userEmail: session.user?.email,
            expiresAt: session.expires_at
          });
          setSession(session as AuthSession);
          setUser(session.user);
        } else {
          console.log('AuthContext - No session found');
        }
      } catch (error) {
        console.error('AuthContext - Error getting initial session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthContext - Auth state changed:', {
          event,
          hasSession: !!session,
          userEmail: session?.user?.email,
          hasAccessToken: !!session?.access_token,
          hasRefreshToken: !!session?.refresh_token
        });
        
        if (session) {
          setSession(session as AuthSession);
          setUser(session.user);
        } else {
          setSession(null);
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error }: AuthResponse = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      if (data.session) {
        setSession(data.session as AuthSession);
        setUser(data.user);
      }

      return { error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: 'An unexpected error occurred' };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      setLoading(true);
      const { data, error }: AuthResponse = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        return { error: error.message };
      }

      // Check if email confirmation is required
      if (data.user && !data.session) {
        return { error: 'Please check your email and confirm your account before signing in.' };
      }

      // If session exists, user is automatically signed in
      if (data.user && data.session) {
        setSession(data.session as AuthSession);
        setUser(data.user);
        
        // Create user in MongoDB backend immediately after signup
        try {
          if (data.session?.access_token && data.user.email) {
            await createUserInBackend(data.session.access_token, {
              email: data.user.email,
              fullName: fullName
            });
          }
        } catch (backendError) {
          console.warn('Failed to create user in backend:', backendError);
          // Don't fail signup if backend creation fails
        }
      }

      return { error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error: 'An unexpected error occurred' };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
      }
      
      setSession(null);
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (error) {
      console.error('Reset password error:', error);
      return { error: 'An unexpected error occurred' };
    } finally {
      setLoading(false);
    }
  };

  const createUserInBackend = async (token: string, userData: { email: string; fullName?: string }) => {
    try {
      // Call the backend server directly
      const response: Response = await apiFetch('/api/auth/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Backend error: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }

      const result = await response.json();
      console.log('User created successfully in backend:', result);
    } catch (error) {
      console.error('Error creating user in backend:', error);
      throw error;
    }
  };

  const refreshSession = async () => {
    try {
      console.log('AuthContext - Refreshing session...');
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('AuthContext - Error refreshing session:', error);
        return false;
      }
      
      if (data.session) {
        console.log('AuthContext - Session refreshed successfully');
        setSession(data.session as AuthSession);
        setUser(data.user);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('AuthContext - Error refreshing session:', error);
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    createUserInBackend,
    refreshSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
