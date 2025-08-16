import { useEffect } from 'react';
import { Text, View, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { LightTheme } from '@/constants/Colors';

export default function AuthCallback() {
  const router = useRouter();
  const { access_token, refresh_token, error, error_description } = useSearchParams();

  useEffect(() => {
    async function handleCallback() {
      console.log('🔄 Processing OAuth callback...');
      
      if (error) {
        console.error('❌ OAuth error:', error, error_description);
        router.replace('/auth/login?error=' + encodeURIComponent(error_description || error));
        return;
      }
      
      if (access_token && refresh_token) {
        console.log('🔐 Setting OAuth session...');
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: access_token as string,
          refresh_token: refresh_token as string,
        });

        if (!sessionError) {
          console.log('✅ OAuth session set successfully, redirecting to app');
          router.replace('/(tabs)');
        } else {
          console.error('❌ Error setting OAuth session:', sessionError);
          router.replace('/auth/login?error=' + encodeURIComponent('Failed to complete sign in'));
        }
      } else {
        console.log('⚠️ No tokens received, redirecting to login');
        router.replace('/auth/login');
      }
    }

    handleCallback();
  }, [access_token, refresh_token, error, error_description, router]);

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