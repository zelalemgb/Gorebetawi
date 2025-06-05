import { useState, useEffect } from 'react';
import { User } from '@/types';
import { supabase, getCurrentUser } from '@/lib/supabase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkUser();
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata.name,
          role: session.user.user_metadata.role,
          preferences: session.user.user_metadata.preferences,
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function checkUser() {
    try {
      const { data: { user: authUser }, error: authError } = await getCurrentUser();
      
      if (authError) throw authError;
      
      if (authUser) {
        setUser({
          id: authUser.id,
          email: authUser.email!,
          name: authUser.user_metadata.name,
          role: authUser.user_metadata.role,
          preferences: authUser.user_metadata.preferences,
        });
      }
    } catch (err) {
      console.error('Error checking auth state:', err);
      setError('Failed to check authentication state');
    } finally {
      setLoading(false);
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;
      
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (signUpError) throw signUpError;
      
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { error: signOutError } = await supabase.auth.signOut();
      
      if (signOutError) throw signOutError;
      
      setUser(null);
    } catch (err: any) {
      setError(err.message || 'Failed to sign out');
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (role: User['role']) => {
    try {
      setLoading(true);
      setError(null);
      
      const { error: updateError } = await supabase.auth.updateUser({
        data: { role }
      });

      if (updateError) throw updateError;
      
      if (user) {
        setUser({ ...user, role });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update role');
    } finally {
      setLoading(false);
    }
  };

  const updateUserPreferences = async (preferences: Partial<User['preferences']>) => {
    try {
      setLoading(true);
      setError(null);
      
      const { error: updateError } = await supabase.auth.updateUser({
        data: { 
          preferences: {
            ...(user?.preferences || {}),
            ...preferences
          }
        }
      });

      if (updateError) throw updateError;
      
      if (user) {
        setUser({
          ...user,
          preferences: {
            ...(user.preferences || {}),
            ...preferences
          }
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update preferences');
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    updateUserRole,
    updateUserPreferences,
  };
}