import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  SafeAreaView, 
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Eye, TriangleAlert as AlertTriangle, Shield, Building } from 'lucide-react-native';
import { LightTheme } from '@/constants/Colors';
import AppButton from '@/components/AppButton';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types';

export default function RoleSelectionScreen() {
  const router = useRouter();
  const { updateUserRole, loading, error } = useAuth();
  
  const [selectedRole, setSelectedRole] = useState<UserRole>('observer');
  
  const roles: { key: UserRole; title: string; description: string; icon: JSX.Element }[] = [
    {
      key: 'observer',
      title: 'Observer',
      description: 'View reports in your area without actively contributing',
      icon: <Eye size={24} color={LightTheme.accent} />
    },
    {
      key: 'reporter',
      title: 'Reporter',
      description: 'Submit reports about issues in your neighborhood',
      icon: <AlertTriangle size={24} color={LightTheme.accent} />
    },
    {
      key: 'validator',
      title: 'Validator',
      description: 'Help confirm the accuracy of reports in your area',
      icon: <Shield size={24} color={LightTheme.accent} />
    },
    {
      key: 'partner',
      title: 'Community Partner',
      description: 'Represent an organization that responds to community issues',
      icon: <Building size={24} color={LightTheme.accent} />
    }
  ];

  const handleContinue = async () => {
    await updateUserRole(selectedRole);
    router.push('/auth/preferences');
  };

  const handleSkip = () => {
    router.push('/auth/preferences');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color={LightTheme.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Select Your Role</Text>
      </View>
      
      <Text style={styles.subtitle}>
        How would you like to participate in your community?
      </Text>
      
      <ScrollView contentContainerStyle={styles.scrollView}>
        {roles.map((role) => (
          <TouchableOpacity
            key={role.key}
            style={[
              styles.roleCard,
              selectedRole === role.key && styles.selectedRoleCard
            ]}
            onPress={() => setSelectedRole(role.key)}
            activeOpacity={0.7}
          >
            <View style={[
              styles.roleIconContainer,
              selectedRole === role.key && styles.selectedRoleIconContainer
            ]}>
              {role.icon}
            </View>
            
            <View style={styles.roleTextContainer}>
              <Text style={styles.roleTitle}>{role.title}</Text>
              <Text style={styles.roleDescription}>{role.description}</Text>
            </View>
            
            <View style={[
              styles.radioButton,
              selectedRole === role.key && styles.selectedRadioButton
            ]}>
              {selectedRole === role.key && <View style={styles.radioButtonInner} />}
            </View>
          </TouchableOpacity>
        ))}
        
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </ScrollView>
      
      <View style={styles.footer}>
        <AppButton
          title="Continue"
          onPress={handleContinue}
          loading={loading}
          disabled={loading}
          style={styles.button}
        />
        
        <TouchableOpacity onPress={handleSkip}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LightTheme.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginHorizontal: 24,
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
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: LightTheme.secondaryText,
    marginTop: 8,
    marginBottom: 24,
    marginHorizontal: 24,
  },
  scrollView: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: LightTheme.white,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: LightTheme.border,
  },
  selectedRoleCard: {
    borderColor: LightTheme.accent,
    backgroundColor: 'rgba(63, 81, 181, 0.05)',
  },
  roleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(63, 81, 181, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  selectedRoleIconContainer: {
    backgroundColor: 'rgba(63, 81, 181, 0.2)',
  },
  roleTextContainer: {
    flex: 1,
  },
  roleTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: LightTheme.text,
    marginBottom: 4,
  },
  roleDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: LightTheme.secondaryText,
    lineHeight: 20,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: LightTheme.neutralDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  selectedRadioButton: {
    borderColor: LightTheme.accent,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: LightTheme.accent,
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: LightTheme.danger,
    marginTop: 8,
    marginBottom: 16,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: LightTheme.border,
  },
  button: {
    marginBottom: 16,
  },
  skipText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: LightTheme.secondaryText,
    textAlign: 'center',
  },
});