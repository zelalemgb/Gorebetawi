import { useState, useEffect } from 'react';
import { User } from '@/types';
import { 
  supabase, 
  getCurrentUser, 
  signInWithEmail, 
  signUpWithEmail, 
  signInWithSocial,
  signOut as supabaseSignOut,
  createUserProfile,
  updateUserProfile,
  getUserProfile
} from '@/lib/supabase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkUser();
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        try {
          // Get or create user profile
          const { data: profile, error: profileError } = await getUserProfile(session.user.id);
          
          if (profileError && profileError.code === 'PGRST116') {
            // User profile doesn't exist, create it
            await createUserProfile(session.user.id, {
              email: session.user.email!,
              name: session.user.user_metadata.name || session.user.user_metadata.full_name,
              role: session.user.user_metadata.role || 'observer',
              preferences: session.user.user_metadata.preferences || {},
            });
            
            // Fetch the newly created profile
            const { data: newProfile } = await getUserProfile(session.user.id);
            if (newProfile) {
              setUser({
                id: newProfile.id,
                email: newProfile.email,
                name: newProfile.name,
                role: newProfile.role as User['role'],
                preferences: newProfile.preferences,
              });
            }
          } else if (profile) {
            setUser({
              id: profile.id,
              email: profile.email,
              name: profile.name,
              role: profile.role as User['role'],
              preferences: profile.preferences,
            });
          }
        } catch (err) {
          console.error('Error handling auth state change:', err);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function checkUser() {
    try {
      const { data: { user: authUser }, error: authError } = await getCurrentUser();
      
      if (authUser) {
        // Get user profile from database
        const { data: profile, error: profileError } = await getUserProfile(authUser.id);
        
        if (profile) {
          setUser({
            id: profile.id,
            email: profile.email,
            name: profile.name,
            role: profile.role as User['role'],
            preferences: profile.preferences,
          });
        } else if (profileError) {
          console.error('Error fetching user profile:', profileError);
          setError('Failed to load user profile');
        }
      } else {
        // No user logged in - this is a normal state, not an error
        setUser(null);
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
      
      const { error: signInError } = await signInWithEmail(email, password);

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
      
      const { error: signUpError } = await signUpWithEmail(email, password);

      if (signUpError) throw signUpError;
      
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signInWithSocialProvider = async (provider: 'google' | 'apple') => {
    try {
      setLoading(true);
      setError(null);
      
      const { error: socialError } = await signInWithSocial(provider);

      if (socialError) throw socialError;
      
      return true;
    } catch (err: any) {
      setError(err.message || `Failed to sign in with ${provider}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { error: signOutError } = await supabaseSignOut();
      
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
      
      if (!user) throw new Error('No user logged in');

      const { error: updateError } = await updateUserProfile(user.id, { role });

      if (updateError) throw updateError;
      
      setUser({ ...user, role });
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
      
      if (!user) throw new Error('No user logged in');

      const updatedPreferences = {
        ...(user.preferences || {}),
        ...preferences
      };

      const { error: updateError } = await updateUserProfile(user.id, { 
        preferences: updatedPreferences 
      });

      if (updateError) throw updateError;
      
      setUser({
        ...user,
        preferences: updatedPreferences
      });
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
    signInWithSocial: signInWithSocialProvider,
    signOut,
    updateUserRole,
    updateUserPreferences,
  };
}