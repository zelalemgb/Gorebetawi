import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  SafeAreaView, 
  TouchableOpacity, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Mail, Lock } from 'lucide-react-native';
import { LightTheme } from '@/constants/Colors';
import AppButton from '@/components/AppButton';
import { useAuth } from '@/hooks/useAuth';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, signInWithSocial, loading, error } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  const validateForm = () => {
    let isValid = true;
    
    // Validate email
    if (!email.trim()) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Email is invalid');
      isValid = false;
    } else {
      setEmailError('');
    }
    
    // Validate password
    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    } else {
      setPasswordError('');
    }
    
    return isValid;
  };

  const handleLogin = async () => {
    if (validateForm()) {
      console.log('🔐 Starting login process for:', email);
      const success = await signIn(email, password);
      if (success) {
        console.log('✅ Login successful, navigating to main app');
        router.replace('/(tabs)');
      } else {
        console.log('❌ Login failed');
      }
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    console.log(`🔐 Starting ${provider} login process`);
    const success = await signInWithSocial(provider);
    if (success) {
      console.log(`✅ ${provider} login successful, navigating to main app`);
      // Note: For OAuth, the redirect will be handled by the callback
      // router.replace('/(tabs)');
    } else {
      console.log(`❌ ${provider} login failed`);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleRegister = () => {
    router.push('/auth/register');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView contentContainerStyle={styles.scrollView}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <ArrowLeft size={24} color={LightTheme.text} />
            </TouchableOpacity>
            <Text style={styles.title}>Sign In</Text>
          </View>
          
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <View style={styles.inputIconContainer}>
                <Mail size={20} color={LightTheme.secondaryText} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor={LightTheme.neutralDark}
              />
            </View>
            {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
            
            <View style={styles.inputContainer}>
              <View style={styles.inputIconContainer}>
                <Lock size={20} color={LightTheme.secondaryText} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholderTextColor={LightTheme.neutralDark}
              />
            </View>
            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
            
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <AppButton
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              style={styles.button}
            />
            
            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.divider} />
            </View>
            
            <View style={styles.socialButtons}>
              <TouchableOpacity 
                style={[styles.socialButton, styles.googleButton]}
                onPress={() => handleSocialLogin('google')}
                disabled={loading || socialLoading !== null}
              >
                {socialLoading === 'google' ? (
                  <ActivityIndicator size="small" color="#db4437" />
                ) : (
                  <View style={styles.socialButtonContent}>
                    <Text style={styles.socialButtonIcon}>🔍</Text>
                    <Text style={styles.socialButtonText}>Google</Text>
                  </View>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.socialButton, styles.appleButton]}
                onPress={() => handleSocialLogin('apple')}
                disabled={loading || socialLoading !== null}
              >
                {socialLoading === 'apple' ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <View style={styles.socialButtonContent}>
                    <Text style={styles.socialButtonIcon}>🍎</Text>
                    <Text style={styles.socialButtonText}>Apple</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account?</Text>
            <TouchableOpacity onPress={handleRegister}>
              <Text style={styles.footerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LightTheme.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 32,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: LightTheme.text,
  },
  formContainer: {
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: LightTheme.border,
    borderRadius: 8,
    height: 56,
    paddingHorizontal: 16,
    marginBottom: 16,
    backgroundColor: LightTheme.white,
  },
  inputIconContainer: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: LightTheme.text,
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: LightTheme.danger,
    marginTop: -8,
    marginBottom: 16,
    marginLeft: 4,
  },
  button: {
    marginTop: 8,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: LightTheme.border,
  },
  dividerText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: LightTheme.secondaryText,
    paddingHorizontal: 16,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: LightTheme.white,
    shadowColor: LightTheme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  googleButton: {
    borderColor: '#db4437',
  },
  appleButton: {
    borderColor: '#000000',
  },
  socialButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  socialButtonIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  socialButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: LightTheme.text,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 24,
  },
  footerText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: LightTheme.secondaryText,
  },
  footerLink: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: LightTheme.accent,
    marginLeft: 4,
  },
});