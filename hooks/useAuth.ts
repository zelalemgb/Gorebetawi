import { useState, useEffect } from 'react';
import { User } from '@/types';

// Mock authentication for demonstration
// In a real app, this would connect to Firebase Auth or similar

const MOCK_USER: User = {
  id: 'user123',
  name: 'Demo User',
  email: 'demo@example.com',
  preferences: {
    interestedCategories: ['safety', 'environment'],
    alwaysAnonymous: false,
    enableLocationAccess: true,
  },
  reports: 5,
  confirmations: 12,
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuthState = async () => {
      try {
        // In a real app, you would use Firebase or similar to check auth state
        const storedUser = localStorage.getItem('gorebet_user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
        setLoading(false);
      } catch (err) {
        setError('Failed to check authentication state');
        setLoading(false);
      }
    };

    checkAuthState();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      // Mock authentication
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, you would use Firebase Auth or similar
      localStorage.setItem('gorebet_user', JSON.stringify(MOCK_USER));
      setUser(MOCK_USER);
      setError(null);
    } catch (err) {
      setError('Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const signInWithSocial = async (provider: 'google' | 'apple') => {
    try {
      setLoading(true);
      // Mock social authentication
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, you would use Firebase Auth or similar
      localStorage.setItem('gorebet_user', JSON.stringify(MOCK_USER));
      setUser(MOCK_USER);
      setError(null);
    } catch (err) {
      setError(`Failed to sign in with ${provider}`);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true);
      // Mock sign up
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, you would use Firebase Auth or similar
      localStorage.setItem('gorebet_user', JSON.stringify(MOCK_USER));
      setUser(MOCK_USER);
      setError(null);
    } catch (err) {
      setError('Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      // Mock sign out
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // In a real app, you would use Firebase Auth or similar
      localStorage.removeItem('gorebet_user');
      setUser(null);
    } catch (err) {
      setError('Failed to sign out');
    } finally {
      setLoading(false);
    }
  };

  const updateUserPreferences = async (preferences: Partial<User['preferences']>) => {
    try {
      if (!user) return;
      
      const updatedUser = {
        ...user,
        preferences: {
          ...user.preferences,
          ...preferences,
        },
      };
      
      // In a real app, you would update the user in Firebase or similar
      localStorage.setItem('gorebet_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (err) {
      setError('Failed to update preferences');
    }
  };

  const updateUserRole = async (role: User['role']) => {
    try {
      if (!user) return;
      
      const updatedUser = {
        ...user,
        role,
      };
      
      // In a real app, you would update the user in Firebase or similar
      localStorage.setItem('gorebet_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (err) {
      setError('Failed to update role');
    }
  };

  return {
    user,
    loading,
    error,
    signIn,
    signInWithSocial,
    signUp,
    signOut,
    updateUserPreferences,
    updateUserRole,
  };
}