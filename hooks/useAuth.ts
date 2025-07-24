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
      console.log('Auth state change:', event, session?.user?.id);
      
      if (session?.user) {
        try {
          // Get or create user profile
          const { data: profile, error: profileError } = await getUserProfile(session.user.id);
          
          if (profileError && profileError.code === 'PGRST116') {
            // User profile doesn't exist, create it
            console.log('Creating new user profile for:', session.user.email);
            await createUserProfile(session.user.id, {
              email: session.user.email!,
              name: session.user.user_metadata.name || session.user.user_metadata.full_name,
              role: session.user.user_metadata.role || 'observer',
              preferences: session.user.user_metadata.preferences || {},
            });
            
            // Fetch the newly created profile
            const { data: newProfile } = await getUserProfile(session.user.id);
            if (newProfile) {
              console.log('New profile created:', newProfile);
              setUser({
                id: newProfile.id,
                email: newProfile.email,
                name: newProfile.name,
                role: newProfile.role as User['role'],
                preferences: newProfile.preferences,
              });
            }
          } else if (profile) {
            console.log('Existing profile found:', profile);
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
          setError('Failed to load user profile');
        }
      } else {
        console.log('No user session, clearing user state');
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
      setLoading(true);
      const { data: { user: authUser }, error: authError } = await getCurrentUser();
      
      if (authError) {
        console.error('Auth error:', authError);
        setError('Authentication error');
        return;
      }
      
      if (authUser) {
        console.log('Found authenticated user:', authUser.id);
        // Get user profile from database
        const { data: profile, error: profileError } = await getUserProfile(authUser.id);
        
        if (profile) {
          console.log('User profile loaded:', profile);
          setUser({
            id: profile.id,
            email: profile.email,
            name: profile.name,
            role: profile.role as User['role'],
            preferences: profile.preferences,
          });
        } else if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error fetching user profile:', profileError);
          setError('Failed to load user profile');
        } else if (profileError?.code === 'PGRST116') {
          // Profile doesn't exist, create it
          console.log('Creating profile for existing user');
          await createUserProfile(authUser.id, {
            email: authUser.email!,
            name: authUser.user_metadata.name || authUser.user_metadata.full_name,
            role: 'observer',
            preferences: {},
          });
          
          // Fetch the newly created profile
          const { data: newProfile } = await getUserProfile(authUser.id);
          if (newProfile) {
            setUser({
              id: newProfile.id,
              email: newProfile.email,
              name: newProfile.name,
              role: newProfile.role as User['role'],
              preferences: newProfile.preferences,
            });
          }
        }
      } else {
        console.log('No authenticated user found');
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
      
      console.log('Attempting to sign in user:', email);
      const { error: signInError } = await signInWithEmail(email, password);

      if (signInError) {
        console.error('Sign in error:', signInError);
        throw signInError;
      }
      
      console.log('Sign in successful');
      return true;
    } catch (err: any) {
      console.error('Sign in failed:', err);
      setError(err.message || 'Failed to sign in');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Attempting to sign up user:', email);
      const { data, error: signUpError } = await signUpWithEmail(email, password);

      if (signUpError) {
        console.error('Sign up error:', signUpError);
        throw signUpError;
      }
      
      // If user was created and we have additional info, update metadata
      if (data.user && name) {
        console.log('Updating user metadata with name:', name);
        const { error: updateError } = await supabase.auth.updateUser({
          data: { name }
        });
        
        if (updateError) {
          console.error('Error updating user metadata:', updateError);
        }
      }
      
      console.log('Sign up successful');
      return true;
    } catch (err: any) {
      console.error('Sign up failed:', err);
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
      
      console.log('Attempting social sign in with:', provider);
      const { error: socialError } = await signInWithSocial(provider);

      if (socialError) {
        console.error('Social sign in error:', socialError);
        throw socialError;
      }
      
      console.log('Social sign in successful');
      return true;
    } catch (err: any) {
      console.error('Social sign in failed:', err);
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
      
      console.log('Attempting to sign out');
      const { error: signOutError } = await supabaseSignOut();
      
      if (signOutError) {
        console.error('Sign out error:', signOutError);
        throw signOutError;
      }
      
      setUser(null);
      console.log('Sign out successful');
    } catch (err: any) {
      console.error('Sign out failed:', err);
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

      console.log('Updating user role to:', role);
      const { error: updateError } = await updateUserProfile(user.id, { role });

      if (updateError) {
        console.error('Role update error:', updateError);
        throw updateError;
      }
      
      setUser({ ...user, role });
      console.log('Role updated successfully');
      return true;
    } catch (err: any) {
      console.error('Role update failed:', err);
      setError(err.message || 'Failed to update role');
      return false;
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

      console.log('Updating user preferences:', updatedPreferences);
      const { error: updateError } = await updateUserProfile(user.id, { 
        preferences: updatedPreferences 
      });

      if (updateError) {
        console.error('Preferences update error:', updateError);
        throw updateError;
      }
      
      setUser({
        ...user,
        preferences: updatedPreferences
      });
      console.log('Preferences updated successfully');
      return true;
    } catch (err: any) {
      console.error('Preferences update failed:', err);
      setError(err.message || 'Failed to update preferences');
      return false;
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