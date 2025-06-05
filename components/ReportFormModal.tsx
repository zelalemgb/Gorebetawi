import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  Modal, 
  TouchableOpacity, 
  ScrollView,
  Switch,
  KeyboardAvoidingView,
  Platform,
  Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { X, Camera, TriangleAlert as AlertTriangle, Droplet, DollarSign, Leaf, MapPin } from 'lucide-react-native';
import { LightTheme, Colors } from '@/constants/Colors';
import AppButton from '@/components/AppButton';
import { useReports } from '@/hooks/useReports';
import { useLocation } from '@/hooks/useLocation';
import { ReportCategory } from '@/types';

interface ReportFormModalProps {
  visible: boolean;
  onClose: () => void;
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
}

export default function ReportFormModal({ 
  visible, 
  onClose,
  currentLocation
}: ReportFormModalProps) {
  const router = useRouter();
  const { addReport, loading } = useReports();
  const { getAddressFromCoordinates } = useLocation();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ReportCategory>('safety');
  const [anonymous, setAnonymous] = useState(false);
  const [location, setLocation] = useState(currentLocation);
  const [address, setAddress] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  
  // Form validation
  const [titleError, setTitleError] = useState('');
  const [locationError, setLocationError] = useState('');
  
  // Get address from coordinates when location changes
  useEffect(() => {
    if (location) {
      getAddressFromCoordinates(location.latitude, location.longitude)
        .then(address => {
          if (address) {
            setAddress(address);
          }
        })
        .catch(error => {
          console.error('Error getting address:', error);
        });
    }
  }, [location]);

  const categories: { key: ReportCategory; title: string; icon: JSX.Element; color: string }[] = [
    {
      key: 'safety',
      title: 'Safety',
      icon: <AlertTriangle size={24} color={Colors.safety} />,
      color: Colors.safety
    },
    {
      key: 'fuel',
      title: 'Fuel',
      icon: <Droplet size={24} color={Colors.fuel} />,
      color: Colors.fuel
    },
    {
      key: 'price',
      title: 'Price',
      icon: <DollarSign size={24} color={Colors.price} />,
      color: Colors.price
    },
    {
      key: 'environment',
      title: 'Environment',
      icon: <Leaf size={24} color={Colors.environment} />,
      color: Colors.environment
    }
  ];

  const validateForm = () => {
    let isValid = true;
    
    // Validate title
    if (!title.trim()) {
      setTitleError('Title is required');
      isValid = false;
    } else {
      setTitleError('');
    }
    
    // Validate location
    if (!location) {
      setLocationError('Location is required');
      isValid = false;
    } else {
      setLocationError('');
    }
    
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      const reportData = {
        title,
        description,
        category,
        status: 'pending',
        location: location!,
        address: address || undefined,
        imageUrl: imageUrl || undefined,
        userId: 'user123', // In a real app, this would be the actual user ID
        anonymous,
      };
      
      await addReport(reportData);
      onClose();
    } catch (error) {
      console.error('Error submitting report:', error);
    }
  };

  // For demo purposes, let's use a placeholder image when camera button is pressed
  const handleTakePhoto = () => {
    setImageUrl('https://images.pexels.com/photos/2096700/pexels-photo-2096700.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Report an Issue</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={LightTheme.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.scrollView}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Category</Text>
              <View style={styles.categoriesContainer}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.key}
                    style={[
                      styles.categoryButton,
                      category === cat.key && { 
                        borderColor: cat.color,
                        backgroundColor: `${cat.color}10`
                      }
                    ]}
                    onPress={() => setCategory(cat.key)}
                  >
                    <View style={[
                      styles.categoryIconContainer,
                      { backgroundColor: `${cat.color}20` }
                    ]}>
                      {cat.icon}
                    </View>
                    <Text style={styles.categoryTitle}>{cat.title}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Details</Text>
              <TextInput
                style={styles.input}
                placeholder="Title of your report"
                value={title}
                onChangeText={setTitle}
                placeholderTextColor={LightTheme.neutralDark}
              />
              {titleError ? <Text style={styles.errorText}>{titleError}</Text> : null}
              
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe the issue (optional)"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                placeholderTextColor={LightTheme.neutralDark}
                textAlignVertical="top"
              />
            </View>
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Location</Text>
              <View style={styles.locationContainer}>
                <View style={styles.locationIcon}>
                  <MapPin size={24} color={LightTheme.accent} />
                </View>
                <View style={styles.locationTextContainer}>
                  {address ? (
                    <Text style={styles.locationText}>{address}</Text>
                  ) : (
                    <Text style={styles.locationPlaceholder}>
                      {location ? 'Getting address...' : 'No location selected'}
                    </Text>
                  )}
                  {locationError ? <Text style={styles.errorText}>{locationError}</Text> : null}
                </View>
              </View>
            </View>
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Photo</Text>
              <TouchableOpacity style={styles.photoButton} onPress={handleTakePhoto}>
                <Camera size={24} color={LightTheme.accent} />
                <Text style={styles.photoButtonText}>Take a Photo</Text>
              </TouchableOpacity>
              
              {imageUrl && (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: imageUrl }} style={styles.imagePreview} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => setImageUrl(null)}
                  >
                    <X size={20} color={LightTheme.white} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
            
            <View style={styles.section}>
              <View style={styles.toggleContainer}>
                <View>
                  <Text style={styles.toggleTitle}>Report Anonymously</Text>
                  <Text style={styles.toggleDescription}>
                    Your name will not be visible to others
                  </Text>
                </View>
                <Switch
                  value={anonymous}
                  onValueChange={setAnonymous}
                  trackColor={{ false: LightTheme.neutralDark, true: `${LightTheme.accent}80` }}
                  thumbColor={anonymous ? LightTheme.accent : LightTheme.neutral}
                />
              </View>
            </View>
          </ScrollView>
          
          <View style={styles.footer}>
            <AppButton
              title="Submit Report"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: LightTheme.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: LightTheme.border,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: LightTheme.text,
  },
  closeButton: {
    padding: 8,
  },
  scrollView: {
    maxHeight: '70%',
  },
  section: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: LightTheme.border,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: LightTheme.text,
    marginBottom: 16,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryButton: {
    width: '48%',
    padding: 12,
    backgroundColor: LightTheme.white,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: LightTheme.border,
    alignItems: 'center',
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryTitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: LightTheme.text,
  },
  input: {
    backgroundColor: LightTheme.white,
    borderWidth: 1,
    borderColor: LightTheme.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: LightTheme.text,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: LightTheme.white,
    borderWidth: 1,
    borderColor: LightTheme.border,
    borderRadius: 8,
    padding: 12,
  },
  locationIcon: {
    marginRight: 12,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: LightTheme.text,
  },
  locationPlaceholder: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: LightTheme.neutralDark,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(63, 81, 181, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  photoButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: LightTheme.accent,
    marginLeft: 8,
  },
  imagePreviewContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    marginTop: -8,
    marginBottom: 16,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: LightTheme.border,
  },
});