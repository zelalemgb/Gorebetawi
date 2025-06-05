import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { LightTheme } from '@/constants/Colors';

export default function InitialScreen() {
  const router = useRouter();

  useEffect(() => {
    // Navigate to tabs after initial render
    router.replace('/(tabs)');
  }, []);

  return (
    <View style={styles.container} />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LightTheme.background,
  },
});