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
  TextInput
} from 'react-native';
import { useRouter } from 'expo-router';
import { X, Camera, Lightbulb, Droplet, Fuel, DollarSign, Car, HardHat, Trash2, MapPin } from 'lucide-react-native';
import { TriangleAlert as AlertTriangle } from 'lucide-react-native';
import { LightTheme, Colors } from '@/constants/Colors';
import AppButton from '@/components/AppButton';
import { useReports } from '@/hooks/useReports';
import { useLocation } from '@/hooks/useLocation';
import { useAuth } from '@/hooks/useAuth';
import { ReportCategory, PriceDetails, FuelStation } from '@/types';

interface ReportFormModalProps {
  visible: boolean;
  onClose: () => void;
  onLightReportRequest?: () => void;
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
}

const PRICE_ITEMS = [
  {
    name: 'Teff/Injera',
    units: ['kg', 'quintal'],
    defaultUnit: 'kg'
  },
  {
    name: 'Cooking Oil',
    units: ['liter', '5-liter', '20-liter'],
    defaultUnit: 'liter'
  },
  {
    name: 'House Rent',
    units: ['month'],
    defaultUnit: 'month'
  }
];

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
  onLightReportRequest,
  currentLocation
}: ReportFormModalProps) {
  const { addReport, loading, getNearbyFuelStations } = useReports();
  const { getAddressFromCoordinates } = useLocation();
  const { user } = useAuth();
  
  const [category, setCategory] = useState<ReportCategory | null>(null);
  const [description, setDescription] = useState<string>('');
  const [customDescription, setCustomDescription] = useState<string>('');
  const [location, setLocation] = useState(currentLocation);
  const [address, setAddress] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [anonymous, setAnonymous] = useState(false);
  const [metadata, setMetadata] = useState<any>({});
  const [priceDetails, setPriceDetails] = useState<PriceDetails>({
    itemName: '',
    unitOfMeasure: '',
    quantity: 1,
    price: 0
  });
  const [selectedStation, setSelectedStation] = useState<FuelStation | null>(null);

  const [nearbyStations, setNearbyStations] = useState<FuelStation[]>([]);

  // Fetch nearby fuel stations when location changes
  useEffect(() => {
    if (currentLocation && category === 'fuel') {
      getNearbyFuelStations(currentLocation.latitude, currentLocation.longitude)
        .then(stations => setNearbyStations(stations))
        .catch(error => console.error('Error fetching fuel stations:', error));
    }
  }, [currentLocation, category]);

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
    if (!category || !location || !user) {
      console.error('Missing required data for report submission');
      return;
    }
    
    try {
      const reportData = {
        title: `${CATEGORIES.find(c => c.key === category)?.title} Report`,
        description: customDescription || description,
        category,
        status: 'pending',
        location: location,
        address: address || undefined,
        imageUrl: imageUrl || undefined,
        userId: user.id,
        anonymous,
        metadata: {
          ...metadata,
          priceDetails: category === 'price' ? priceDetails : undefined,
          fuelStation: category === 'fuel' ? selectedStation : undefined
        }
      };
      
      await addReport(reportData);
      onClose();
    } catch (error) {
      console.error('Error submitting report:', error);
    }
  };

  const handleTakePhoto = () => {
    setImageUrl('https://images.pexels.com/photos/2096700/pexels-photo-2096700.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2');
  };

  const selectedCategory = CATEGORIES.find(c => c.key === category);

  const handleLightReportPress = () => {
    if (onLightReportRequest) {
      onClose();
      setTimeout(() => {
        onLightReportRequest();
      }, 300);
    } else {
      setCategory('light');
    }
  };

  const renderCategoryGrid = () => (
    <View style={styles.categoryGrid}>
      <TouchableOpacity
        style={styles.lightReportButton}
        onPress={handleLightReportPress}
        activeOpacity={0.85}
      >
        <View style={styles.lightReportIconContainer}>
          <Lightbulb size={32} color="#FFFFFF" strokeWidth={2.5} />
        </View>
        <View style={styles.lightReportTextContainer}>
          <Text style={styles.lightReportTitle}>Light is Off</Text>
          <Text style={styles.lightReportSubtitle}>Quick report for power outage</Text>
        </View>
      </TouchableOpacity>

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

  const renderPriceInputs = () => {
    const selectedItem = PRICE_ITEMS.find(item => item.name === priceDetails.itemName);
    
    return (
      <View style={styles.priceInputContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Select Item</Text>
          <View style={styles.buttonGroup}>
            {PRICE_ITEMS.map(item => (
              <TouchableOpacity
                key={item.name}
                style={[
                  styles.itemButton,
                  priceDetails.itemName === item.name && styles.itemButtonActive
                ]}
                onPress={() => setPriceDetails({
                  itemName: item.name,
                  unitOfMeasure: item.defaultUnit,
                  quantity: 1,
                  price: 0
                })}
              >
                <Text style={[
                  styles.itemButtonText,
                  priceDetails.itemName === item.name && styles.itemButtonTextActive
                ]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {selectedItem && (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Unit</Text>
              <View style={styles.buttonGroup}>
                {selectedItem.units.map(unit => (
                  <TouchableOpacity
                    key={unit}
                    style={[
                      styles.unitButton,
                      priceDetails.unitOfMeasure === unit && styles.unitButtonActive
                    ]}
                    onPress={() => setPriceDetails(prev => ({
                      ...prev,
                      unitOfMeasure: unit
                    }))}
                  >
                    <Text style={[
                      styles.unitButtonText,
                      priceDetails.unitOfMeasure === unit && styles.unitButtonTextActive
                    ]}>
                      {unit}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Quantity</Text>
                <TextInput
                  style={styles.numberInput}
                  keyboardType="numeric"
                  value={priceDetails.quantity.toString()}
                  onChangeText={(text) => setPriceDetails(prev => ({
                    ...prev,
                    quantity: parseFloat(text) || 0
                  }))}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Price (Birr)</Text>
                <TextInput
                  style={styles.numberInput}
                  keyboardType="numeric"
                  value={priceDetails.price.toString()}
                  onChangeText={(text) => setPriceDetails(prev => ({
                    ...prev,
                    price: parseFloat(text) || 0
                  }))}
                />
              </View>
            </View>
          </>
        )}
      </View>
    );
  };

  const renderDescriptionInput = () => (
    <View style={styles.descriptionContainer}>
      <Text style={styles.sectionTitle}>Description</Text>
      <TextInput
        style={styles.descriptionInput}
        placeholder="Add your description here..."
        value={customDescription}
        onChangeText={setCustomDescription}
        multiline
        numberOfLines={3}
      />
      <Text style={styles.orText}>or choose a quick description:</Text>
      <View style={styles.quickDescriptions}>
        {selectedCategory?.descriptions.map((desc, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.descriptionOption,
              description === desc && styles.descriptionOptionActive
            ]}
            onPress={() => {
              setDescription(desc);
              setCustomDescription('');
            }}
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

                {category === 'price' && renderPriceInputs()}
                {renderDescriptionInput()}

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
  lightReportButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FDB022',
    borderRadius: 16,
    marginBottom: 8,
    shadowColor: 'rgba(253, 176, 34, 0.4)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  lightReportIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  lightReportTextContainer: {
    flex: 1,
  },
  lightReportTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: LightTheme.white,
    marginBottom: 4,
  },
  lightReportSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
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
  descriptionContainer: {
    marginBottom: 24,
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: LightTheme.border,
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: LightTheme.text,
    backgroundColor: LightTheme.white,
    textAlignVertical: 'top',
  },
  orText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: LightTheme.secondaryText,
    marginVertical: 12,
    textAlign: 'center',
  },
  quickDescriptions: {
    gap: 8,
  },
  itemButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: LightTheme.neutral,
    marginBottom: 8,
    width: '100%',
  },
  itemButtonActive: {
    backgroundColor: LightTheme.accent,
  },
  itemButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: LightTheme.secondaryText,
    textAlign: 'center',
  },
  itemButtonTextActive: {
    color: LightTheme.white,
  },
  priceInputContainer: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: LightTheme.text,
    marginBottom: 8,
  },
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  unitButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: LightTheme.neutral,
  },
  unitButtonActive: {
    backgroundColor: LightTheme.accent,
  },
  unitButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: LightTheme.secondaryText,
  },
  unitButtonTextActive: {
    color: LightTheme.white,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 16,
  },
  numberInput: {
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
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: LightTheme.text,
    marginBottom: 12,
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
});