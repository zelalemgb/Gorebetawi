import { useState, useEffect } from 'react';
import { User } from '@/types';
import { 
  supabase, 
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
      
      // Try to get existing user profile
      let { data: profile, error: profileError } = await getUserProfile(authUser.id);
      
      // If profile doesn't exist, create it (fallback in case trigger didn't work)
      if (profileError && profileError.code === 'PGRST116') {
        console.log('📝 Profile not found, creating for:', authUser.email);
        const { data: newProfile, error: createError } = await createUserProfile(authUser.id, {
          email: authUser.email!,
          name: authUser.user_metadata?.name || authUser.user_metadata?.full_name || null,
          role: 'observer',
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
      
      if (profile) {
        console.log('✅ Profile loaded successfully:', profile.email);
        setUser({
          id: profile.id,
          email: profile.email,
          name: profile.name,
          role: profile.role as User['role'],
          preferences: profile.preferences || {},
        });
      }
    } catch (err: any) {
      console.error('❌ Error handling user session:', err);
      setError(err.message || 'Failed to load user profile');
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
      const { data, error: signUpError } = await signUpWithEmail(email, password);

      if (signUpError) {
        console.error('❌ Sign up error:', signUpError);
        throw signUpError;
      }
      
      if (data.user) {
        console.log('✅ User created successfully:', data.user.email);
        
        // Update user metadata with name if provided
        if (name) {
          console.log('📝 Updating user metadata with name:', name);
          const { error: updateError } = await supabase.auth.updateUser({
            data: { name }
          });
          
          if (updateError) {
            console.error('⚠️ Error updating user metadata:', updateError);
            // Don't throw here, as the user was created successfully
          }
        }
        
        // Create user profile in database
        console.log('📝 Creating user profile in database');
        const { error: updateError } = await supabase.auth.updateUser({
          data: { name }
        });
        
        if (updateError) {
          console.error('⚠️ Error updating user metadata:', updateError);
        }
      }
      
      console.log('✅ Sign up process completed');
      return true;
    } catch (err: any) {
      console.error('❌ Sign up failed:', err);
      const errorMessage = err.message === 'User already registered' 
        ? 'An account with this email already exists' 
        : err.message || 'Failed to create account';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signInWithSocialProvider = async (provider: 'google' | 'apple') => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔐 Attempting social sign in with:', provider);
      const { data, error: socialError } = await signInWithSocial(provider);

      if (socialError) {
        console.error('❌ Social sign in error:', socialError);
        throw socialError;
      }
      
      // For web, the OAuth flow will redirect to the callback URL
      // For mobile, we need to handle the response differently
      if (data?.url) {
        console.log('🌐 Redirecting to OAuth provider:', data.url);
        // On web, this will redirect to the OAuth provider
        window.location.href = data.url;
        return true;
      }
      
      console.log('✅ Social sign in successful');
      return true;
    } catch (err: any) {
      console.error('❌ Social sign in failed:', err);
      const errorMessage = err.message === 'OAuth provider not enabled' 
        ? `${provider.charAt(0).toUpperCase() + provider.slice(1)} sign-in is not available yet`
        : err.message || `Failed to sign in with ${provider}`;
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