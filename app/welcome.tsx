import React from 'react';
import { StyleSheet, View, Text, Image, SafeAreaView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { MapPin, Users } from 'lucide-react-native';
import { LightTheme } from '@/constants/Colors';
import AppButton from '@/components/AppButton';
import { useAuth } from '@/hooks/useAuth';

export default function WelcomeScreen() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // Redirect to main app if user is already logged in
  useFocusEffect(
    React.useCallback(() => {
      if (!loading && user) {
        router.replace('/(tabs)');
      }
    }, [user, loading, router])
  );

  const handleCreateAccount = () => {
    router.push('/auth/register');
  };

  const handleBrowseWithoutAccount = () => {
    router.push('/(tabs)');
  };

  // Show loading state while checking auth
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <MapPin size={48} color={LightTheme.accent} />
        </View>
        
        <Text style={styles.title}>Welcome to Gorebet</Text>
        
        <Text style={styles.message}>
          You are now part of a neighborhood that sees, shares, and acts.
        </Text>
        
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <MapPin size={24} color={LightTheme.accent} />
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Report Issues</Text>
              <Text style={styles.featureDescription}>
                Share local concerns about safety, prices, environment and more
              </Text>
            </View>
          </View>
          
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Users size={24} color={LightTheme.accent} />
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Community Validated</Text>
              <Text style={styles.featureDescription}>
                Neighbors confirm reports for reliable, trusted information
              </Text>
            </View>
          </View>
        </View>
      </View>
      
      <View style={styles.footer}>
        <AppButton
          title="Create Account & Contribute"
          onPress={handleCreateAccount}
          variant="primary"
          style={styles.button}
        />
        
        <AppButton
          title="Browse Without Account"
          onPress={handleBrowseWithoutAccount}
          variant="outline"
          style={styles.button}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LightTheme.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: 'rgba(63, 81, 181, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: LightTheme.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: LightTheme.secondaryText,
    marginBottom: 40,
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresContainer: {
    width: '100%',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(63, 81, 181, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: LightTheme.text,
    marginBottom: 4,
  },
  featureDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: LightTheme.secondaryText,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  button: {
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: LightTheme.secondaryText,
  },
});