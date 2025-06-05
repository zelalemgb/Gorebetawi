import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  SafeAreaView, 
  TouchableOpacity,
  ScrollView,
  Switch,
  Image
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { LogOut, User, Settings, ChevronRight, TriangleAlert as AlertTriangle, Shield } from 'lucide-react-native';
import { LightTheme } from '@/constants/Colors';
import AppButton from '@/components/AppButton';
import { useAuth } from '@/hooks/useAuth';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  
  const [alwaysAnonymous, setAlwaysAnonymous] = React.useState(
    user?.preferences?.alwaysAnonymous || false
  );
  
  const handleSignOut = async () => {
    await signOut();
    router.replace('/welcome');
  };

  const handleLogin = () => {
    router.push('/auth/login');
  };

  const getUserRoleIcon = () => {
    if (!user?.role) return <User size={20} color={LightTheme.white} />;
    
    switch (user.role) {
      case 'reporter':
        return <AlertTriangle size={20} color={LightTheme.white} />;
      case 'validator':
        return <Shield size={20} color={LightTheme.white} />;
      case 'partner':
        return <Settings size={20} color={LightTheme.white} />;
      default:
        return <User size={20} color={LightTheme.white} />;
    }
  };

  const getUserRoleName = () => {
    if (!user?.role) return 'Observer';
    
    return user.role.charAt(0).toUpperCase() + user.role.slice(1);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {user ? (
          <>
            <View style={styles.profileCard}>
              <View style={styles.profileHeader}>
                <View style={styles.avatarContainer}>
                  <Text style={styles.avatarText}>
                    {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </Text>
                </View>
                
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>{user.name || 'User'}</Text>
                  <Text style={styles.profileEmail}>{user.email}</Text>
                  
                  <View style={styles.roleContainer}>
                    <View style={styles.roleIconContainer}>
                      {getUserRoleIcon()}
                    </View>
                    <Text style={styles.roleText}>{getUserRoleName()}</Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{user.reports || 0}</Text>
                  <Text style={styles.statLabel}>Reports</Text>
                </View>
                
                <View style={styles.statDivider} />
                
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{user.confirmations || 0}</Text>
                  <Text style={styles.statLabel}>Confirmations</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Settings</Text>
              
              <View style={styles.settingItem}>
                <View>
                  <Text style={styles.settingTitle}>Always report anonymously</Text>
                  <Text style={styles.settingDescription}>Your name will never be shown with your reports</Text>
                </View>
                <Switch
                  value={alwaysAnonymous}
                  onValueChange={setAlwaysAnonymous}
                  trackColor={{ false: LightTheme.neutralDark, true: `${LightTheme.accent}80` }}
                  thumbColor={alwaysAnonymous ? LightTheme.accent : LightTheme.neutral}
                />
              </View>
              
              <TouchableOpacity style={styles.settingItem}>
                <View>
                  <Text style={styles.settingTitle}>Update Role</Text>
                  <Text style={styles.settingDescription}>Change how you participate in your community</Text>
                </View>
                <ChevronRight size={20} color={LightTheme.secondaryText} />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.settingItem}>
                <View>
                  <Text style={styles.settingTitle}>Notification Preferences</Text>
                  <Text style={styles.settingDescription}>Manage what alerts you receive</Text>
                </View>
                <ChevronRight size={20} color={LightTheme.secondaryText} />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.settingItem}>
                <View>
                  <Text style={styles.settingTitle}>Account Settings</Text>
                  <Text style={styles.settingDescription}>Update your personal information</Text>
                </View>
                <ChevronRight size={20} color={LightTheme.secondaryText} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.footer}>
              <AppButton
                title="Log Out"
                onPress={handleSignOut}
                variant="outline"
                loading={loading}
                disabled={loading}
                style={styles.logoutButton}
                textStyle={styles.logoutButtonText}
              />
            </View>
          </>
        ) : (
          <View style={styles.signInContainer}>
            <View style={styles.iconContainer}>
              <User size={48} color={LightTheme.accent} />
            </View>
            
            <Text style={styles.signInTitle}>Sign In Required</Text>
            <Text style={styles.signInText}>
              Please sign in to view your profile and customize your experience
            </Text>
            
            <AppButton
              title="Sign In"
              onPress={handleLogin}
              style={styles.signInButton}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LightTheme.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: LightTheme.text,
  },
  scrollView: {
    flex: 1,
  },
  profileCard: {
    backgroundColor: LightTheme.white,
    borderRadius: 16,
    margin: 16,
    padding: 16,
    shadowColor: LightTheme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: LightTheme.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: LightTheme.white,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: LightTheme.text,
    marginBottom: 4,
  },
  profileEmail: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: LightTheme.secondaryText,
    marginBottom: 8,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: LightTheme.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  roleText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: LightTheme.secondaryText,
  },
  statsContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: LightTheme.border,
    paddingTop: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: LightTheme.border,
  },
  statValue: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: LightTheme.text,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: LightTheme.secondaryText,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: LightTheme.text,
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: LightTheme.border,
  },
  settingTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: LightTheme.text,
    marginBottom: 4,
  },
  settingDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: LightTheme.secondaryText,
    width: '90%',
  },
  footer: {
    padding: 16,
    marginBottom: 32,
  },
  logoutButton: {
    borderColor: LightTheme.danger,
  },
  logoutButtonText: {
    color: LightTheme.danger,
  },
  signInContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(63, 81, 181, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  signInTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: LightTheme.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  signInText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: LightTheme.secondaryText,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  signInButton: {
    width: '100%',
  },
});