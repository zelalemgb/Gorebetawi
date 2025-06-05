import { useEffect } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { useRouter, useSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();
  const { access_token, refresh_token } = useSearchParams();

  useEffect(() => {
    async function handleCallback() {
      if (access_token && refresh_token) {
        const { error } = await supabase.auth.setSession({
          access_token: access_token as string,
          refresh_token: refresh_token as string,
        });

        if (!error) {
          router.replace('/(tabs)');
        }
      }
    }

    handleCallback();
  }, [access_token, refresh_token]);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Setting up your account...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 16,
    color: '#666',
  },
});