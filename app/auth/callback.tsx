import { useEffect } from 'react';
import { Text, View, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { LightTheme } from '@/constants/Colors';

export default function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    async function handleCallback() {
      console.log('🔄 Processing OAuth callback...');
      console.log('📋 Search params:', searchParams);
      
      const access_token = searchParams.access_token as string;
      const refresh_token = searchParams.refresh_token as string;
      const error = searchParams.error as string;
      const error_description = searchParams.error_description as string;
      
      // Also check for hash parameters (common in OAuth flows)
      if (typeof window !== 'undefined' && window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const hashAccessToken = hashParams.get('access_token');
        const hashRefreshToken = hashParams.get('refresh_token');
        const hashError = hashParams.get('error');
        const hashErrorDescription = hashParams.get('error_description');
        
        console.log('🔗 Hash params:', {
          access_token: hashAccessToken,
          refresh_token: hashRefreshToken,
          error: hashError,
          error_description: hashErrorDescription
        });
        
        if (hashAccessToken && hashRefreshToken) {
          console.log('🔐 Setting OAuth session from hash...');
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: hashAccessToken,
            refresh_token: hashRefreshToken,
          });

          if (!sessionError) {
            console.log('✅ OAuth session set successfully, redirecting to app');
            router.replace('/(tabs)');
            return;
          } else {
            console.error('❌ Error setting OAuth session:', sessionError);
            router.replace('/auth/login?error=' + encodeURIComponent('Failed to complete sign in'));
            return;
          }
        }
        
        if (hashError) {
          console.error('❌ OAuth error from hash:', hashError, hashErrorDescription);
          router.replace('/auth/login?error=' + encodeURIComponent(hashErrorDescription || hashError));
          return;
        }
      }
      
      if (error) {
        console.error('❌ OAuth error:', error, error_description);
        router.replace('/auth/login?error=' + encodeURIComponent(error_description || error));
        return;
      }
      
      if (access_token && refresh_token) {
        console.log('🔐 Setting OAuth session...');
        const { error: sessionError } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });

        if (!sessionError) {
          console.log('✅ OAuth session set successfully, redirecting to app');
          router.replace('/(tabs)');
        } else {
          console.error('❌ Error setting OAuth session:', sessionError);
          router.replace('/auth/login?error=' + encodeURIComponent('Failed to complete sign in'));
        }
      } else {
        console.log('⚠️ No tokens received, checking for implicit flow...');
        
        // Wait a moment for potential auth state change
        setTimeout(async () => {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            console.log('✅ Session found, redirecting to app');
            router.replace('/(tabs)');
          } else {
            console.log('⚠️ No session found, redirecting to login');
            router.replace('/auth/login');
          }
        }, 1000);
      }
    }

    handleCallback();
  }, [searchParams, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={LightTheme.accent} />
      <Text style={styles.text}>Completing sign in...</Text>
      <Text style={styles.subText}>Please wait while we set up your account</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: LightTheme.background,
    paddingHorizontal: 24,
  },
  text: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: LightTheme.text,
    marginTop: 16,
    textAlign: 'center',
  },
  subText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: LightTheme.secondaryText,
    marginTop: 8,
    textAlign: 'center',
  },
});