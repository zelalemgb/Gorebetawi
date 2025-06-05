import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  ScrollView,
  Switch,
  KeyboardAvoidingView,
  Platform,
  Image,
  Pressable
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  X, 
  Camera, 
  Lightbulb,
  Droplet,
  Fuel,
  DollarSign,
  Car,
  HardHat,
  Trash2,
  MapPin,
  Clock,
  CheckCircle2
} from 'lucide-react-native';
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

const CATEGORIES: {
  key: ReportCategory;
  title: string;
  icon: JSX.Element;
  color: string;
  descriptions: string[];
  metadata?: {
    toggles?: { label: string; value: string }[];
    subcategories?: string[];
    severityLevels?: { label: string; value: string }[];
  };
}[] = [
  {
    key: 'light',
    title: 'Light Outage',
    icon: <Lightbulb size={24} color={Colors.light} />,
    color: Colors.light,
    descriptions: [
      'Street light is off',
      'Entire area blackout',
      'Intermittent outage'
    ]
  },
  {
    key: 'water',
    title: 'Water Outage',
    icon: <Droplet size={24} color={Colors.water} />,
    color: Colors.water,
    descriptions: [
      'No water since this morning',
      'Low pressure',
      'Ongoing problem for days'
    ]
  },
  {
    key: 'fuel',
    title: 'Fuel Availability',
    icon: <Fuel size={24} color={Colors.fuel} />,
    color: Colors.fuel,
    descriptions: [
      'No fuel at this station',
      'Long queue for diesel',
      'Fuel available now'
    ],
    metadata: {
      toggles: [
        { label: 'Gasoline', value: 'gasoline' },
        { label: 'Diesel', value: 'diesel' }
      ],
      severityLevels: [
        { label: 'No Queue', value: 'none' },
        { label: 'Short Queue', value: 'short' },
        { label: 'Medium Queue', value: 'medium' },
        { label: 'Long Queue', value: 'long' }
      ]
    }
  },
  {
    key: 'price',
    title: 'Price Changes',
    icon: <DollarSign size={24} color={Colors.price} />,
    color: Colors.price,
    descriptions: [
      'Paid more than usual',
      'Price drop this week',
      'Hard to find this item'
    ],
    metadata: {
      subcategories: [
        'House Rent',
        'Teff/Injera',
        'Cooking Oil'
      ]
    }
  },
  {
    key: 'traffic',
    title: 'Traffic',
    icon: <Car size={24} color={Colors.traffic} />,
    color: Colors.traffic,
    descriptions: [
      'Stuck here for 30+ minutes',
      'Traffic due to accident',
      'Road blockage ahead'
    ],
    metadata: {
      severityLevels: [
        { label: 'Light', value: 'light' },
        { label: 'Moderate', value: 'moderate' },
        { label: 'Heavy', value: 'heavy' }
      ]
    }
  },
  {
    key: 'infrastructure',
    title: 'Infrastructure',
    icon: <HardHat size={24} color={Colors.infrastructure} />,
    color: Colors.infrastructure,
    descriptions: [
      'Dangerous pothole',
      'Blocked due to construction',
      'Manhole left open'
    ],
    metadata: {
      subcategories: [
        'Pothole',
        'Road Block',
        'Open Manhole'
      ]
    }
  },
  {
    key: 'environment',
    title: 'Environment',
    icon: <Trash2 size={24} color={Colors.environment} />,
    color: Colors.environment,
    descriptions: [
      'Uncollected garbage for days',
      'Flooded after last rain',
      'Smelly stagnant water'
    ],
    metadata: {
      subcategories: [
        'Garbage overflow',
        'Flooding',
        'Stagnant water'
      ]
    }
  }
];

export default function ReportFormModal({ 
  visible, 
  onClose,
  currentLocation
}: ReportFormModalProps) {
  const { addReport, loading } = useReports();
  const { getAddressFromCoordinates } = useLocation();
  
  const [category, setCategory] = useState<ReportCategory | null>(null);
  const [description, setDescription] = useState<string>('');
  const [location, setLocation] = useState(currentLocation);
  const [address, setAddress] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [anonymous, setAnonymous] = useState(false);
  const [metadata, setMetadata] = useState<any>({});
  
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

  const handleSubmit = async () => {
    if (!category || !location) return;
    
    try {
      const reportData = {
        title: `${CATEGORIES.find(c => c.key === category)?.title} Report`,
        description,
        category,
        status: 'pending',
        location: location,
        address: address || undefined,
        imageUrl: imageUrl || undefined,
        userId: 'user123', // In a real app, this would be the actual user ID
        anonymous,
        metadata
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

  const selectedCategory = CATEGORIES.find(c => c.key === category);

  const renderCategoryGrid = () => (
    <View style={styles.categoryGrid}>
      {CATEGORIES.map((cat) => (
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
  );

  const renderMetadataInputs = () => {
    if (!selectedCategory?.metadata) return null;

    return (
      <View style={styles.metadataContainer}>
        {selectedCategory.metadata.toggles && (
          <View style={styles.toggleGroup}>
            {selectedCategory.metadata.toggles.map(toggle => (
              <TouchableOpacity
                key={toggle.value}
                style={[
                  styles.toggleButton,
                  metadata.toggle === toggle.value && styles.toggleButtonActive
                ]}
                onPress={() => setMetadata({ ...metadata, toggle: toggle.value })}
              >
                <Text style={[
                  styles.toggleButtonText,
                  metadata.toggle === toggle.value && styles.toggleButtonTextActive
                ]}>
                  {toggle.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {selectedCategory.metadata.severityLevels && (
          <View style={styles.severityContainer}>
            <Text style={styles.sectionTitle}>Severity</Text>
            <View style={styles.severityButtons}>
              {selectedCategory.metadata.severityLevels.map(level => (
                <TouchableOpacity
                  key={level.value}
                  style={[
                    styles.severityButton,
                    metadata.severity === level.value && styles.severityButtonActive
                  ]}
                  onPress={() => setMetadata({ ...metadata, severity: level.value })}
                >
                  <Text style={[
                    styles.severityButtonText,
                    metadata.severity === level.value && styles.severityButtonTextActive
                  ]}>
                    {level.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {selectedCategory.metadata.subcategories && (
          <View style={styles.subcategoryContainer}>
            <Text style={styles.sectionTitle}>Type</Text>
            <View style={styles.subcategoryButtons}>
              {selectedCategory.metadata.subcategories.map(sub => (
                <TouchableOpacity
                  key={sub}
                  style={[
                    styles.subcategoryButton,
                    metadata.subcategory === sub && styles.subcategoryButtonActive
                  ]}
                  onPress={() => setMetadata({ ...metadata, subcategory: sub })}
                >
                  <Text style={[
                    styles.subcategoryButtonText,
                    metadata.subcategory === sub && styles.subcategoryButtonTextActive
                  ]}>
                    {sub}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderDescriptionOptions = () => {
    if (!selectedCategory) return null;

    return (
      <View style={styles.descriptionContainer}>
        <Text style={styles.sectionTitle}>Quick Description</Text>
        <View style={styles.descriptionOptions}>
          {selectedCategory.descriptions.map((desc, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.descriptionOption,
                description === desc && styles.descriptionOptionActive
              ]}
              onPress={() => setDescription(desc)}
            >
              <Text style={[
                styles.descriptionOptionText,
                description === desc && styles.descriptionOptionTextActive
              ]}>
                {desc}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
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
            {!category ? (
              renderCategoryGrid()
            ) : (
              <View style={styles.detailsContainer}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => setCategory(null)}
                >
                  <Text style={styles.backButtonText}>← Change Category</Text>
                </TouchableOpacity>

                {renderMetadataInputs()}
                {renderDescriptionOptions()}

                <View style={styles.locationContainer}>
                  <View style={styles.locationHeader}>
                    <MapPin size={20} color={LightTheme.accent} />
                    <Text style={styles.locationTitle}>Location</Text>
                  </View>
                  <Text style={styles.locationText}>
                    {address || 'Getting location...'}
                  </Text>
                </View>

                <TouchableOpacity style={styles.photoButton} onPress={handleTakePhoto}>
                  <Camera size={24} color={LightTheme.accent} />
                  <Text style={styles.photoButtonText}>Add Photo</Text>
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
            )}
          </ScrollView>
          
          {category && (
            <View style={styles.footer}>
              <AppButton
                title="Submit Report"
                onPress={handleSubmit}
                loading={loading}
                disabled={loading}
              />
            </View>
          )}
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
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  categoryButton: {
    width: '48%',
    padding: 16,
    backgroundColor: LightTheme.white,
    borderRadius: 12,
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
    textAlign: 'center',
  },
  detailsContainer: {
    padding: 16,
  },
  backButton: {
    paddingVertical: 8,
    marginBottom: 16,
  },
  backButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: LightTheme.accent,
  },
  metadataContainer: {
    marginBottom: 24,
  },
  toggleGroup: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: LightTheme.border,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: LightTheme.accent,
    borderColor: LightTheme.accent,
  },
  toggleButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: LightTheme.text,
  },
  toggleButtonTextActive: {
    color: LightTheme.white,
  },
  severityContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: LightTheme.text,
    marginBottom: 12,
  },
  severityButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  severityButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: LightTheme.neutral,
    alignItems: 'center',
  },
  severityButtonActive: {
    backgroundColor: LightTheme.accent,
  },
  severityButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: LightTheme.secondaryText,
  },
  severityButtonTextActive: {
    color: LightTheme.white,
  },
  subcategoryContainer: {
    marginBottom: 16,
  },
  subcategoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  subcategoryButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: LightTheme.neutral,
  },
  subcategoryButtonActive: {
    backgroundColor: LightTheme.accent,
  },
  subcategoryButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: LightTheme.secondaryText,
  },
  subcategoryButtonTextActive: {
    color: LightTheme.white,
  },
  descriptionContainer: {
    marginBottom: 24,
  },
  descriptionOptions: {
    gap: 8,
  },
  descriptionOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: LightTheme.neutral,
  },
  descriptionOptionActive: {
    backgroundColor: LightTheme.accent,
  },
  descriptionOptionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: LightTheme.secondaryText,
  },
  descriptionOptionTextActive: {
    color: LightTheme.white,
  },
  locationContainer: {
    backgroundColor: LightTheme.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: LightTheme.border,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: LightTheme.text,
    marginLeft: 8,
  },
  locationText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: LightTheme.secondaryText,
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
    marginBottom: 16,
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
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: LightTheme.border,
  },
});