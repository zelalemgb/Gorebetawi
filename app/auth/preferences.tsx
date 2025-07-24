import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  SafeAreaView, 
  TouchableOpacity,
  Switch,
  ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, TriangleAlert as AlertTriangle, Droplet, DollarSign, Leaf } from 'lucide-react-native';
import { LightTheme, Colors } from '@/constants/Colors';
import AppButton from '@/components/AppButton';
import { useAuth } from '@/hooks/useAuth';
import { ReportCategory } from '@/types';

export default function PreferencesScreen() {
  const router = useRouter();
  const { updateUserPreferences, loading, error } = useAuth();
  
  const [selectedCategories, setSelectedCategories] = useState<ReportCategory[]>(['safety', 'environment']);
  const [alwaysAnonymous, setAlwaysAnonymous] = useState(false);
  const [enableLocation, setEnableLocation] = useState(true);
  
  const categories: { key: ReportCategory; title: string; icon: JSX.Element }[] = [
    {
      key: 'safety',
      title: 'Safety',
      icon: <AlertTriangle size={24} color={Colors.safety} />
    },
    {
      key: 'fuel',
      title: 'Fuel',
      icon: <Droplet size={24} color={Colors.fuel} />
    },
    {
      key: 'price',
      title: 'Price',
      icon: <DollarSign size={24} color={Colors.price} />
    },
    {
      key: 'environment',
      title: 'Environment',
      icon: <Leaf size={24} color={Colors.environment} />
    }
  ];

  const toggleCategory = (category: ReportCategory) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  const handleSave = async () => {
    const success = await updateUserPreferences({
      interestedCategories: selectedCategories,
      alwaysAnonymous,
      enableLocationAccess: enableLocation,
    });
    
    if (success) {
      router.replace('/(tabs)');
    }
  };

  const handleSkip = () => {
    router.replace('/(tabs)');
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
        <Text style={styles.title}>Set Preferences</Text>
      </View>
      
      <Text style={styles.subtitle}>
        Customize your experience with Gorebet
      </Text>
      
      <ScrollView contentContainerStyle={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferred Report Types</Text>
          <Text style={styles.sectionDescription}>
            Select the types of reports you're most interested in
          </Text>
          
          <View style={styles.categoriesContainer}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.key}
                style={[
                  styles.categoryCard,
                  selectedCategories.includes(category.key) && { 
                    borderColor: Colors[category.key],
                    backgroundColor: `${Colors[category.key]}10`
                  }
                ]}
                onPress={() => toggleCategory(category.key)}
                activeOpacity={0.7}
              >
                <View style={[
                  styles.categoryIconContainer,
                  { backgroundColor: `${Colors[category.key]}20` }
                ]}>
                  {category.icon}
                </View>
                
                <Text style={styles.categoryTitle}>{category.title}</Text>
                
                <View style={[
                  styles.checkBox,
                  selectedCategories.includes(category.key) && {
                    borderColor: Colors[category.key],
                    backgroundColor: Colors[category.key]
                  }
                ]}>
                  {selectedCategories.includes(category.key) && (
                    <Text style={styles.checkMark}>✓</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy Settings</Text>
          
          <View style={styles.toggleOption}>
            <View>
              <Text style={styles.toggleTitle}>Always report anonymously</Text>
              <Text style={styles.toggleDescription}>
                Your name will never be shown with your reports
              </Text>
            </View>
            <Switch
              value={alwaysAnonymous}
              onValueChange={setAlwaysAnonymous}
              trackColor={{ false: LightTheme.neutralDark, true: `${LightTheme.accent}80` }}
              thumbColor={alwaysAnonymous ? LightTheme.accent : LightTheme.neutral}
            />
          </View>
          
          <View style={styles.toggleOption}>
            <View>
              <Text style={styles.toggleTitle}>Enable location access</Text>
              <Text style={styles.toggleDescription}>
                Allow Gorebet to access your location while using the app
              </Text>
            </View>
            <Switch
              value={enableLocation}
              onValueChange={setEnableLocation}
              trackColor={{ false: LightTheme.neutralDark, true: `${LightTheme.accent}80` }}
              thumbColor={enableLocation ? LightTheme.accent : LightTheme.neutral}
            />
          </View>
        </View>
        
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </ScrollView>
      
      <View style={styles.footer}>
        <AppButton
          title="Save Preferences"
          onPress={handleSave}
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
    marginHorizontal: 24,
  },
  scrollView: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: LightTheme.text,
    marginBottom: 8,
  },
  sectionDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: LightTheme.secondaryText,
    marginBottom: 16,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    padding: 16,
    backgroundColor: LightTheme.white,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: LightTheme.border,
    alignItems: 'center',
  },
  categoryIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryTitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: LightTheme.text,
    marginBottom: 8,
  },
  checkBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: LightTheme.neutralDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkMark: {
    color: LightTheme.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  toggleOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: LightTheme.border,
  },
  toggleTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: LightTheme.text,
    marginBottom: 4,
  },
  toggleDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: LightTheme.secondaryText,
    maxWidth: '80%',
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