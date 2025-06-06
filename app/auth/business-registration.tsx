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
  Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Building, Phone, MapPin, Upload, Store, Fuel, ShoppingBag } from 'lucide-react-native';
import { LightTheme } from '@/constants/Colors';
import AppButton from '@/components/AppButton';
import { useBusiness } from '@/hooks/useBusiness';
import { useAuth } from '@/hooks/useAuth';
import { BusinessType, ReportCategory } from '@/types';
import { useLocation } from '@/hooks/useLocation';

const BUSINESS_TYPES: { key: BusinessType; label: string; icon: JSX.Element }[] = [
  {
    key: 'fuel_station',
    label: 'Fuel Station',
    icon: <Fuel size={24} color={LightTheme.accent} />
  },
  {
    key: 'retail_shop',
    label: 'Retail Shop',
    icon: <Store size={24} color={LightTheme.accent} />
  },
  {
    key: 'market',
    label: 'Market',
    icon: <ShoppingBag size={24} color={LightTheme.accent} />
  },
  {
    key: 'other',
    label: 'Other Business',
    icon: <Building size={24} color={LightTheme.accent} />
  }
];

const CATEGORIES: { key: ReportCategory; label: string }[] = [
  { key: 'fuel', label: 'Fuel' },
  { key: 'price', label: 'Goods & Services' }
];

export default function BusinessRegistrationScreen() {
  const router = useRouter();
  const { registerBusiness, loading, error } = useBusiness();
  const { user } = useAuth();
  const { location, getAddressFromCoordinates } = useLocation();
  
  const [businessName, setBusinessName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [type, setType] = useState<BusinessType | null>(null);
  const [category, setCategory] = useState<ReportCategory | null>(null);
  const [address, setAddress] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  
  const [nameError, setNameError] = useState('');
  const [contactError, setContactError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [typeError, setTypeError] = useState('');
  const [categoryError, setCategoryError] = useState('');
  
  const validateForm = () => {
    let isValid = true;
    
    if (!businessName.trim()) {
      setNameError('Business name is required');
      isValid = false;
    } else {
      setNameError('');
    }
    
    if (!contactPerson.trim()) {
      setContactError('Contact person is required');
      isValid = false;
    } else {
      setContactError('');
    }
    
    if (!phone.trim()) {
      setPhoneError('Phone number is required');
      isValid = false;
    } else if (!/^\+?[0-9]{10,15}$/.test(phone.replace(/\s/g, ''))) {
      setPhoneError('Invalid phone number');
      isValid = false;
    } else {
      setPhoneError('');
    }
    
    if (!type) {
      setTypeError('Business type is required');
      isValid = false;
    } else {
      setTypeError('');
    }
    
    if (!category) {
      setCategoryError('Category is required');
      isValid = false;
    } else {
      setCategoryError('');
    }
    
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !location || !user) return;
    
    try {
      const businessData = {
        name: businessName,
        type: type!,
        category: category!,
        contactPerson,
        phone,
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        address: address || await getAddressFromCoordinates(
          location.coords.latitude,
          location.coords.longitude
        ) || '',
        logoUrl,
        userId: user.id,
      };
      
      const businessId = await registerBusiness(businessData);
      if (businessId) {
        router.push('/auth/business-confirmation');
      }
    } catch (err) {
      console.error('Error registering business:', err);
    }
  };

  const handleUploadLogo = () => {
    // For demo, use a placeholder image
    setLogoUrl('https://images.pexels.com/photos/176342/pexels-photo-176342.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2');
  };

  const handleBack = () => {
    router.back();
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
            <Text style={styles.title}>Register Business</Text>
          </View>
          
          <View style={styles.formContainer}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Business Information</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Business Name</Text>
                <TextInput
                  style={styles.input}
                  value={businessName}
                  onChangeText={setBusinessName}
                  placeholder="Enter business name"
                  placeholderTextColor={LightTheme.neutralDark}
                />
                {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Contact Person</Text>
                <TextInput
                  style={styles.input}
                  value={contactPerson}
                  onChangeText={setContactPerson}
                  placeholder="Full name of contact person"
                  placeholderTextColor={LightTheme.neutralDark}
                />
                {contactError ? <Text style={styles.errorText}>{contactError}</Text> : null}
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+251 91 234 5678"
                  keyboardType="phone-pad"
                  placeholderTextColor={LightTheme.neutralDark}
                />
                {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
              </View>
            </View>
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Business Type</Text>
              <View style={styles.typeGrid}>
                {BUSINESS_TYPES.map((businessType) => (
                  <TouchableOpacity
                    key={businessType.key}
                    style={[
                      styles.typeCard,
                      type === businessType.key && styles.typeCardActive
                    ]}
                    onPress={() => setType(businessType.key)}
                  >
                    <View style={[
                      styles.typeIconContainer,
                      type === businessType.key && styles.typeIconContainerActive
                    ]}>
                      {businessType.icon}
                    </View>
                    <Text style={[
                      styles.typeText,
                      type === businessType.key && styles.typeTextActive
                    ]}>
                      {businessType.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {typeError ? <Text style={styles.errorText}>{typeError}</Text> : null}
            </View>
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Category</Text>
              <View style={styles.categoryContainer}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.key}
                    style={[
                      styles.categoryButton,
                      category === cat.key && styles.categoryButtonActive
                    ]}
                    onPress={() => setCategory(cat.key)}
                  >
                    <Text style={[
                      styles.categoryText,
                      category === cat.key && styles.categoryTextActive
                    ]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {categoryError ? <Text style={styles.errorText}>{categoryError}</Text> : null}
            </View>
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Location</Text>
              <View style={styles.locationContainer}>
                <MapPin size={20} color={LightTheme.accent} />
                <Text style={styles.locationText}>
                  {address || 'Using current location'}
                </Text>
              </View>
            </View>
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Business Logo (Optional)</Text>
              {logoUrl ? (
                <View style={styles.logoContainer}>
                  <Image source={{ uri: logoUrl }} style={styles.logo} />
                  <TouchableOpacity 
                    style={styles.changeLogoButton}
                    onPress={handleUploadLogo}
                  >
                    <Text style={styles.changeLogoText}>Change Logo</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.uploadButton}
                  onPress={handleUploadLogo}
                >
                  <Upload size={24} color={LightTheme.accent} />
                  <Text style={styles.uploadText}>Upload Logo</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>
        </ScrollView>
        
        <View style={styles.footer}>
          <AppButton
            title="Submit Registration"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading || !user}
          />
        </View>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
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
    flex: 1,
    paddingHorizontal: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: LightTheme.text,
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: LightTheme.text,
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: LightTheme.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: LightTheme.text,
    backgroundColor: LightTheme.white,
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: LightTheme.danger,
    marginTop: 4,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  typeCard: {
    width: '47%',
    padding: 16,
    backgroundColor: LightTheme.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: LightTheme.border,
    alignItems: 'center',
  },
  typeCardActive: {
    borderColor: LightTheme.accent,
    backgroundColor: 'rgba(63, 81, 181, 0.05)',
  },
  typeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(63, 81, 181, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeIconContainerActive: {
    backgroundColor: 'rgba(63, 81, 181, 0.2)',
  },
  typeText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: LightTheme.text,
    textAlign: 'center',
  },
  typeTextActive: {
    color: LightTheme.accent,
  },
  categoryContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  categoryButton: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: LightTheme.border,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: LightTheme.white,
  },
  categoryButtonActive: {
    borderColor: LightTheme.accent,
    backgroundColor: LightTheme.accent,
  },
  categoryText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: LightTheme.text,
  },
  categoryTextActive: {
    color: LightTheme.white,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: LightTheme.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: LightTheme.border,
  },
  locationText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: LightTheme.secondaryText,
    marginLeft: 12,
  },
  uploadButton: {
    height: 120,
    borderWidth: 2,
    borderColor: 'rgba(63, 81, 181, 0.2)',
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(63, 81, 181, 0.05)',
  },
  uploadText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: LightTheme.accent,
    marginTop: 8,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 12,
    marginBottom: 12,
  },
  changeLogoButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  changeLogoText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: LightTheme.accent,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: LightTheme.border,
  },
});