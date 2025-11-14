import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  Animated,
  ActivityIndicator
} from 'react-native';
import { X, Lightbulb, MapPin, Navigation } from 'lucide-react-native';
import { LightTheme } from '@/constants/Colors';
import { useLocation } from '@/hooks/useLocation';
import { useAuth } from '@/hooks/useAuth';

interface LightReportModalProps {
  visible: boolean;
  onClose: () => void;
  onReportSubmit: (report: any) => Promise<string | null>;
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
}

export default function LightReportModal({
  visible,
  onClose,
  onReportSubmit,
  currentLocation: initialLocation
}: LightReportModalProps) {
  const { getAddressFromCoordinates, getCurrentLocation } = useLocation();
  const { user } = useAuth();

  const [location, setLocation] = useState(initialLocation);
  const [address, setAddress] = useState<string | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [lightOn, setLightOn] = useState(true);

  const brightnessAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const backgroundAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (location) {
      getAddressFromCoordinates(location.latitude, location.longitude)
        .then(addr => {
          if (addr) setAddress(addr);
        })
        .catch(error => {
          console.error('Error getting address:', error);
        });
    }
  }, [location]);

  useEffect(() => {
    if (visible) {
      setLightOn(true);
      brightnessAnim.setValue(1);
      scaleAnim.setValue(1);
      backgroundAnim.setValue(0);
    }
  }, [visible]);

  const handleGetCurrentLocation = async () => {
    setLoadingLocation(true);
    try {
      const loc = await getCurrentLocation();
      if (loc) {
        setLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      }
    } catch (error) {
      console.error('Error getting current location:', error);
    } finally {
      setLoadingLocation(false);
    }
  };

  const animateLightOff = () => {
    setLightOn(false);

    Animated.parallel([
      Animated.timing(brightnessAnim, {
        toValue: 0.1,
        duration: 800,
        useNativeDriver: false,
      }),
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(backgroundAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handleSubmit = async () => {
    if (!location || !user) {
      console.error('Missing required data for report submission');
      return;
    }

    animateLightOff();

    setTimeout(async () => {
      try {
        const reportData = {
          title: 'Light Outage Report',
          description: 'Light is off in this area',
          category: 'light' as const,
          status: 'pending' as const,
          location: location,
          address: address || undefined,
          userId: user.id,
          anonymous: false,
          metadata: {
            severity: 'moderate',
            duration: 'ongoing'
          }
        };

        await onReportSubmit(reportData);

        setTimeout(() => {
          onClose();
        }, 500);
      } catch (error) {
        console.error('Error submitting report:', error);
      }
    }, 800);
  };

  const backgroundColor = backgroundAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#FFFFFF', '#1A1A2E'],
  });

  const bulbColor = brightnessAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#4A5568', '#FDB022'],
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <Animated.View style={[styles.modalContent, { backgroundColor }]}>
          <View style={styles.header}>
            <Text style={[styles.title, !lightOn && styles.titleDark]}>Light Report</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={lightOn ? LightTheme.text : '#FFFFFF'} />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <Animated.View
              style={[
                styles.lightBulbContainer,
                { transform: [{ scale: scaleAnim }] }
              ]}
            >
              <Animated.View
                style={[
                  styles.glowEffect,
                  {
                    opacity: brightnessAnim,
                    backgroundColor: bulbColor,
                  }
                ]}
              />
              <Animated.View style={{ opacity: brightnessAnim }}>
                <Lightbulb
                  size={120}
                  color="#FDB022"
                  fill={lightOn ? '#FDB022' : 'transparent'}
                  strokeWidth={2}
                />
              </Animated.View>
              {!lightOn && (
                <Lightbulb
                  size={120}
                  color="#4A5568"
                  strokeWidth={2}
                  style={{ position: 'absolute' }}
                />
              )}
            </Animated.View>

            <Text style={[styles.statusText, !lightOn && styles.statusTextDark]}>
              {lightOn ? 'Tap below to report' : 'Report submitted!'}
            </Text>

            <View style={styles.locationSection}>
              <View style={styles.locationHeader}>
                <MapPin size={20} color={lightOn ? LightTheme.accent : '#FFFFFF'} />
                <Text style={[styles.locationTitle, !lightOn && styles.locationTitleDark]}>
                  Report Location
                </Text>
              </View>

              {address ? (
                <Text style={[styles.locationText, !lightOn && styles.locationTextDark]}>
                  {address}
                </Text>
              ) : (
                <Text style={[styles.locationText, !lightOn && styles.locationTextDark]}>
                  {location ? 'Getting address...' : 'No location set'}
                </Text>
              )}

              <TouchableOpacity
                style={[styles.locationButton, !lightOn && styles.locationButtonDark]}
                onPress={handleGetCurrentLocation}
                disabled={loadingLocation || !lightOn}
              >
                {loadingLocation ? (
                  <ActivityIndicator size="small" color={LightTheme.accent} />
                ) : (
                  <>
                    <Navigation size={18} color={lightOn ? LightTheme.accent : '#FFFFFF'} />
                    <Text style={[styles.locationButtonText, !lightOn && styles.locationButtonTextDark]}>
                      Use Current Location
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.reportButton,
                (!location || reportLoading || !lightOn) && styles.reportButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={!location || reportLoading || !lightOn}
              activeOpacity={0.8}
            >
              {reportLoading ? (
                <ActivityIndicator size="small" color={LightTheme.white} />
              ) : (
                <>
                  <Lightbulb size={24} color={LightTheme.white} strokeWidth={2} />
                  <Text style={styles.reportButtonText}>
                    Light is Off Where I Am
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
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
    minHeight: '75%',
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
    fontSize: 24,
    color: LightTheme.text,
  },
  titleDark: {
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  lightBulbContainer: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  glowEffect: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.3,
  },
  statusText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 20,
    color: LightTheme.text,
    marginBottom: 32,
    textAlign: 'center',
  },
  statusTextDark: {
    color: '#FFFFFF',
  },
  locationSection: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: LightTheme.text,
    marginLeft: 8,
  },
  locationTitleDark: {
    color: '#E2E8F0',
  },
  locationText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: LightTheme.secondaryText,
    marginBottom: 16,
    lineHeight: 20,
  },
  locationTextDark: {
    color: '#CBD5E0',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(63, 81, 181, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(63, 81, 181, 0.2)',
    gap: 8,
  },
  locationButtonDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  locationButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: LightTheme.accent,
  },
  locationButtonTextDark: {
    color: '#FFFFFF',
  },
  footer: {
    padding: 24,
    paddingBottom: 32,
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 12,
    shadowColor: 'rgba(239, 68, 68, 0.4)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  reportButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
  },
  reportButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    color: LightTheme.white,
  },
});
