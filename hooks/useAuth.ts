import { useState, useEffect } from 'react';
import { User } from '@/types';
import { 
  supabase, 
  signInWithEmail,
  signUpWithEmail,
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
    initializeAuth();
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth state change:', event, session?.user?.id);
      
      if (session?.user) {
        await handleUserSession(session.user);
      } else {
        console.log('🚪 No user session, clearing user state');
        setUser(null);
        setError(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function initializeAuth() {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('❌ Session error:', sessionError);
        setError('Failed to check authentication status');
        return;
      }
      
      if (session?.user) {
        console.log('🔍 Found existing session for user:', session.user.email);
        await handleUserSession(session.user);
      } else {
        console.log('🔍 No existing session found');
        setUser(null);
      }
    } catch (err) {
      console.error('❌ Error initializing auth:', err);
      setError('Failed to initialize authentication');
    } finally {
      setLoading(false);
    }
  }

  async function handleUserSession(authUser: any) {
    try {
      console.log('👤 Handling user session for:', authUser.email);

      // Add timeout to prevent infinite hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Profile load timeout')), 10000)
      );

      const profilePromise = (async () => {
        // Try to get existing user profile
        let { data: profile, error: profileError } = await getUserProfile(authUser.id);

        // If profile doesn't exist, create it (fallback in case trigger didn't work)
        if (profileError && profileError.code === 'PGRST116') {
          console.log('📝 Profile not found, creating for:', authUser.email);
          const { data: newProfile, error: createError } = await createUserProfile(authUser.id, {
            email: authUser.email!,
            name: authUser.user_metadata?.name || authUser.user_metadata?.full_name || null,
            role: 'citizen',
            preferences: {},
          });

          if (createError) {
            console.error('❌ Error creating user profile:', createError);
            throw createError;
          }

          profile = newProfile;
        } else if (profileError) {
          console.error('❌ Error fetching user profile:', profileError);
          throw profileError;
        }

        return profile;
      })();

      const profile = await Promise.race([profilePromise, timeoutPromise]);

      if (profile) {
        console.log('✅ Profile loaded successfully:', (profile as any).email);
        setUser({
          id: (profile as any).id,
          email: (profile as any).email,
          name: (profile as any).name,
          role: (profile as any).role as User['role'],
          preferences: (profile as any).preferences || {},
        });
      }
    } catch (err: any) {
      console.error('❌ Error handling user session:', err);
      setError(err.message || 'Failed to load user profile');
      setLoading(false);
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔐 Attempting to sign in user:', email);
      const { error: signInError } = await signInWithEmail(email, password);

      if (signInError) {
        console.error('❌ Sign in error:', signInError);
        throw signInError;
      }
      
      console.log('✅ Sign in successful for:', email);
      return true;
    } catch (err: any) {
      console.error('❌ Sign in failed:', err);
      const errorMessage = err.message === 'Invalid login credentials' 
        ? 'Invalid email or password' 
        : err.message || 'Failed to sign in';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name?: string) => {
    try {
      setLoading(true);
      setError(null);

      console.log('📝 Attempting to sign up user:', email);
      console.log('📝 Sign up data:', { email, passwordLength: password.length, name });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout - please try again')), 30000)
      );

      const signUpPromise = signUpWithEmail(email, password);

      const { data, error: signUpError } = await Promise.race([
        signUpPromise,
        timeoutPromise
      ]) as any;

      if (signUpError) {
        console.error('❌ Sign up error:', signUpError);
        setError(signUpError.message || 'Failed to create account');
        setLoading(false);
        return false;
      }

      if (data.user) {
        console.log('✅ User created successfully:', data.user.email);

        // Update user metadata with name if provided
        if (name) {
          console.log('📝 Updating user metadata with name:', name);
          try {
            const { error: updateError } = await supabase.auth.updateUser({
              data: { name }
            });

            if (updateError) {
              console.error('⚠️ Error updating user metadata:', updateError);
            }
          } catch (updateErr) {
            console.error('⚠️ Error updating user metadata:', updateErr);
          }
        }
      }

      console.log('✅ Sign up process completed');
      setLoading(false);
      return true;
    } catch (err: any) {
      console.error('❌ Sign up failed:', err);
      const errorMessage = err.message === 'User already registered'
        ? 'An account with this email already exists'
        : err.message || 'Failed to create account';
      setError(errorMessage);
      setLoading(false);
      return false;
    }
  };

  const signInWithSocialProvider = async (provider: 'google' | 'apple') => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔐 Attempting social sign in with:', provider);
      const { error: socialError } = await signInWithSocial(provider);

      if (socialError) {
        console.error('❌ Social sign in error:', socialError);
        throw socialError;
      }
      
      console.log('✅ Social sign in initiated - redirecting to provider');
      return true;
    } catch (err: any) {
      console.error('❌ Social sign in failed:', err);
      let errorMessage = `Failed to sign in with ${provider}`;
      
      if (err.message?.includes('OAuth provider not enabled')) {
        errorMessage = `${provider.charAt(0).toUpperCase() + provider.slice(1)} sign-in is not configured yet`;
      } else if (err.message?.includes('redirect_uri')) {
        errorMessage = 'OAuth configuration error. Please check redirect URLs.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🚪 Attempting to sign out');
      const { error: signOutError } = await supabaseSignOut();
      
      if (signOutError) {
        console.error('❌ Sign out error:', signOutError);
        throw signOutError;
      }
      
      setUser(null);
      console.log('✅ Sign out successful');
    } catch (err: any) {
      console.error('❌ Sign out failed:', err);
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

      console.log('👤 Updating user role to:', role);
      const { error: updateError } = await updateUserProfile(user.id, { role });

      if (updateError) {
        console.error('❌ Role update error:', updateError);
        throw updateError;
      }
      
      setUser({ ...user, role });
      console.log('✅ Role updated successfully');
      return true;
    } catch (err: any) {
      console.error('❌ Role update failed:', err);
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

      console.log('⚙️ Updating user preferences:', updatedPreferences);
      const { error: updateError } = await updateUserProfile(user.id, { 
        preferences: updatedPreferences 
      });

      if (updateError) {
        console.error('❌ Preferences update error:', updateError);
        throw updateError;
      }
      
      setUser({
        ...user,
        preferences: updatedPreferences
      });
      console.log('✅ Preferences updated successfully');
      return true;
    } catch (err: any) {
      console.error('❌ Preferences update failed:', err);
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