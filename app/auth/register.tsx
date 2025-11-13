import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  SafeAreaView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Mail, Lock, User, Phone } from 'lucide-react-native';
import { LightTheme } from '@/constants/Colors';
import AppButton from '@/components/AppButton';
import { useAuth } from '@/hooks/useAuth';

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp, loading, error } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+251');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  
  const validateForm = () => {
    let isValid = true;
    
    console.log('🔍 Validating form with data:', { name, email, phone, password, confirmPassword });
    
    // Validate name
    if (!name.trim()) {
      setNameError('Name is required');
      isValid = false;
    } else {
      setNameError('');
    }
    
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
    
    // Validate phone (optional)
    if (phone.trim()) {
      const cleanPhone = phone.replace(/\s/g, '');
      // Ethiopian phone numbers are 9 digits (without country code)
      if (countryCode === '+251' && !/^[0-9]{9}$/.test(cleanPhone)) {
        setPhoneError('Phone number must be 9 digits');
        isValid = false;
      } else if (!/^[0-9]{7,12}$/.test(cleanPhone)) {
        setPhoneError('Phone number is invalid');
        isValid = false;
      } else {
        setPhoneError('');
      }
    } else {
      setPhoneError('');
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
    
    // Validate confirm password
    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      isValid = false;
    } else {
      setConfirmPasswordError('');
    }
    
    return isValid;
  };

  const handleRegister = async () => {
    console.log('🚀 Register button clicked');
    console.log('📋 Form data:', { name, email, phone, password: '***', confirmPassword: '***' });

    const isValid = validateForm();
    console.log('✅ Form validation result:', isValid);

    if (isValid) {
      console.log('📝 Starting registration process for:', email);
      const fullPhone = phone.trim() ? `${countryCode}${phone.trim()}` : undefined;
      const success = await signUp(email, password, name.trim(), fullPhone);
      console.log('📊 SignUp result:', success);

      if (success) {
        console.log('✅ Registration successful, navigating to role selection');
        router.push('/auth/role-selection');
      } else {
        console.log('❌ Registration failed');
      }
    } else {
      console.log('❌ Form validation failed');
      console.log('❌ Errors:', { nameError, emailError, phoneError, passwordError, confirmPasswordError });
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleLogin = () => {
    router.push('/auth/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollView}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <ArrowLeft size={24} color={LightTheme.text} />
            </TouchableOpacity>
            <Text style={styles.title}>Create Account</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <View style={styles.inputIconContainer}>
                <User size={20} color={LightTheme.secondaryText} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                value={name}
                onChangeText={setName}
                placeholderTextColor={LightTheme.neutralDark}
              />
            </View>
            {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
            
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
            
            <View style={styles.phoneContainer}>
              <View style={styles.countryCodeContainer}>
                <Phone size={20} color={LightTheme.secondaryText} style={styles.phoneIcon} />
                <TextInput
                  style={styles.countryCodeInput}
                  value={countryCode}
                  onChangeText={setCountryCode}
                  keyboardType="phone-pad"
                  placeholderTextColor={LightTheme.neutralDark}
                />
              </View>
              <View style={styles.phoneInputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="9XXXXXXXX"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  placeholderTextColor={LightTheme.neutralDark}
                  maxLength={countryCode === '+251' ? 9 : 12}
                />
              </View>
            </View>
            <Text style={styles.phoneHint}>Optional - Ethiopian format: 9 digits</Text>
            {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
            
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
            
            <View style={styles.inputContainer}>
              <View style={styles.inputIconContainer}>
                <Lock size={20} color={LightTheme.secondaryText} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                placeholderTextColor={LightTheme.neutralDark}
              />
            </View>
            {confirmPasswordError ? <Text style={styles.errorText}>{confirmPasswordError}</Text> : null}
            
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={styles.registerButton}
              onPress={() => {
                console.log('🔵 Button press detected!');
                handleRegister();
              }}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.registerButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>
          </View>
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <TouchableOpacity onPress={handleLogin}>
              <Text style={styles.footerLink}>Sign In</Text>
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
    paddingHorizontal: 24,
    paddingBottom: 40,
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
  phoneContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 12,
  },
  countryCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: LightTheme.border,
    borderRadius: 8,
    height: 56,
    paddingHorizontal: 12,
    backgroundColor: LightTheme.white,
    width: 110,
  },
  phoneIcon: {
    marginRight: 8,
  },
  countryCodeInput: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: LightTheme.text,
    width: 50,
  },
  phoneInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: LightTheme.border,
    borderRadius: 8,
    height: 56,
    paddingHorizontal: 16,
    backgroundColor: LightTheme.white,
  },
  phoneHint: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: LightTheme.secondaryText,
    marginBottom: 16,
    marginLeft: 4,
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
    marginTop: 24,
    marginBottom: 16,
  },
  registerButton: {
    backgroundColor: LightTheme.accent,
    height: 56,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  registerButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 16,
    color: LightTheme.white,
    fontWeight: '600',
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