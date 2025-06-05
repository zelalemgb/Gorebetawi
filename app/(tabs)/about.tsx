import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  Linking 
} from 'react-native';
import { Stack } from 'expo-router';
import { MapPin, Info, Heart, Mail, Github, Twitter, Shield, TriangleAlert as AlertTriangle, User, Building } from 'lucide-react-native';
import { LightTheme } from '@/constants/Colors';

export default function AboutScreen() {
  const handleEmailPress = () => {
    Linking.openURL('mailto:contact@gorebet.com');
  };

  const handleTwitterPress = () => {
    Linking.openURL('https://twitter.com/gorebetapp');
  };

  const handleGithubPress = () => {
    Linking.openURL('https://github.com/gorebet');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <Text style={styles.title}>About Gorebet</Text>
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.logoContainer}>
          <View style={styles.logoIconContainer}>
            <MapPin size={48} color={LightTheme.accent} />
          </View>
          <Text style={styles.logoText}>Gorebet</Text>
          <Text style={styles.version}>Version 1.0.0</Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Mission</Text>
          <Text style={styles.paragraph}>
            Gorebet is a civic-tech app that empowers citizens to report and view real-time issues in their neighborhoods. 
            Our goal is to create more transparent, responsive communities where information flows freely and everyone can contribute.
          </Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          
          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: 'rgba(229, 57, 53, 0.1)' }]}>
              <AlertTriangle size={24} color={LightTheme.danger} />
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Report Issues</Text>
              <Text style={styles.featureDescription}>
                Report safety concerns, price changes, fuel availability, and environmental issues in your area
              </Text>
            </View>
          </View>
          
          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: 'rgba(67, 160, 71, 0.1)' }]}>
              <Shield size={24} color={LightTheme.success} />
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Validate Reports</Text>
              <Text style={styles.featureDescription}>
                Confirm reports from other users to increase reliability and trust in the information
              </Text>
            </View>
          </View>
          
          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: 'rgba(63, 81, 181, 0.1)' }]}>
              <User size={24} color={LightTheme.accent} />
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Choose Your Role</Text>
              <Text style={styles.featureDescription}>
                Be an Observer, Reporter, Validator, or Community Partner based on how you want to participate
              </Text>
            </View>
          </View>
          
          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: 'rgba(158, 158, 158, 0.1)' }]}>
              <Building size={24} color={LightTheme.neutralDark} />
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Community Action</Text>
              <Text style={styles.featureDescription}>
                Turn information into action with community-led responses to local issues
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy & Data</Text>
          <Text style={styles.paragraph}>
            We're committed to protecting your privacy. You can choose to report anonymously, and we only collect location data with your permission to show relevant reports in your area.
          </Text>
          <TouchableOpacity style={styles.link}>
            <Text style={styles.linkText}>View Privacy Policy</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <Text style={styles.paragraph}>
            Have questions, feedback, or want to report an issue with the app? Reach out to our team:
          </Text>
          
          <View style={styles.contactButtons}>
            <TouchableOpacity style={styles.contactButton} onPress={handleEmailPress}>
              <Mail size={20} color={LightTheme.accent} />
              <Text style={styles.contactButtonText}>Email</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.contactButton} onPress={handleTwitterPress}>
              <Twitter size={20} color={LightTheme.accent} />
              <Text style={styles.contactButtonText}>Twitter</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.contactButton} onPress={handleGithubPress}>
              <Github size={20} color={LightTheme.accent} />
              <Text style={styles.contactButtonText}>GitHub</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>Made with</Text>
          <Heart size={16} color={LightTheme.danger} style={styles.heartIcon} />
          <Text style={styles.footerText}>for communities everywhere</Text>
        </View>
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
  logoContainer: {
    alignItems: 'center',
    marginVertical: 32,
  },
  logoIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: 'rgba(63, 81, 181, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: LightTheme.text,
  },
  version: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: LightTheme.secondaryText,
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 20,
    color: LightTheme.text,
    marginBottom: 16,
  },
  paragraph: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: LightTheme.secondaryText,
    lineHeight: 24,
    marginBottom: 16,
  },
  link: {
    marginBottom: 8,
  },
  linkText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: LightTheme.accent,
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
  contactButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  contactButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(63, 81, 181, 0.1)',
    borderRadius: 8,
    paddingVertical: 12,
    marginHorizontal: 4,
  },
  contactButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: LightTheme.accent,
    marginLeft: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: LightTheme.secondaryText,
  },
  heartIcon: {
    marginHorizontal: 4,
  },
});