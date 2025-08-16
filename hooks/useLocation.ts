import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';

interface LocationState {
  location: Location.LocationObject | null;
  errorMsg: string | null;
  loading: boolean;
}

export function useLocation() {
  const [state, setState] = useState<LocationState>({
    location: null,
    errorMsg: null,
    loading: true,
  });
  const mounted = useRef(true);
  const locationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;

    (async () => {
      try {
        console.log('🌍 Starting location request...');
        
        // Set a timeout for location request (10 seconds)
        locationTimeoutRef.current = setTimeout(() => {
          if (mounted.current) {
            console.log('⏰ Location request timed out, using fallback');
            setState({
              location: null,
              errorMsg: 'Location request timed out. Using default location.',
              loading: false,
            });
          }
        }, 10000);

        let { status } = await Location.requestForegroundPermissionsAsync();
        if (!mounted.current) return;

        if (status !== 'granted') {
          if (locationTimeoutRef.current) {
            clearTimeout(locationTimeoutRef.current);
          }
          setState({
            location: null,
            errorMsg: 'Enable location to see what\'s happening near you',
            loading: false,
          });
          return;
        }

        console.log('📍 Location permission granted, getting position...');
        
        // Try to get cached location first (faster)
        try {
          const cachedLocation = await Location.getLastKnownPositionAsync({
            maxAge: 300000, // 5 minutes
            requiredAccuracy: 1000, // 1km accuracy is fine for initial load
          });
          
          if (cachedLocation && mounted.current) {
            console.log('⚡ Using cached location');
            if (locationTimeoutRef.current) {
              clearTimeout(locationTimeoutRef.current);
            }
            setState({
              location: cachedLocation,
              errorMsg: null,
              loading: false,
            });
            
            // Still get fresh location in background for better accuracy
            getCurrentLocationInBackground();
            return;
          }
        } catch (cachedError) {
          console.log('📍 No cached location available, getting fresh location');
        }

        // Get fresh location with optimized settings
        const initialLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced, // Faster than High accuracy
          maximumAge: 60000, // Use cached location if less than 1 minute old
          timeout: 8000, // 8 second timeout
        });
        
        if (!mounted.current) return;
        
        if (locationTimeoutRef.current) {
          clearTimeout(locationTimeoutRef.current);
        }
        
        console.log('✅ Fresh location obtained');
        setState({
          location: initialLocation,
          errorMsg: null,
          loading: false,
        });

        // Only set up location subscription on native platforms
        if (Platform.OS !== 'web') {
          locationSubscription = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.Balanced,
              timeInterval: 10000,
              distanceInterval: 20, // Update when user moves 20m
            },
            (newLocation) => {
              if (mounted.current) {
                console.log('📍 Location updated');
                setState(prev => ({
                  ...prev,
                  location: newLocation,
                }));
              }
            }
          );
        }
      } catch (error) {
        console.error('❌ Location error:', error);
        if (locationTimeoutRef.current) {
          clearTimeout(locationTimeoutRef.current);
        }
        if (mounted.current) {
          setState({
            location: null,
            errorMsg: 'Unable to get location. Using default area.',
            loading: false,
          });
        }
      }
    })();

    // Background function to get more accurate location
    const getCurrentLocationInBackground = async () => {
      try {
        const freshLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
          timeout: 15000,
        });
        
        if (mounted.current) {
          console.log('🎯 Updated to high accuracy location');
          setState(prev => ({
            ...prev,
            location: freshLocation,
          }));
        }
      } catch (error) {
        console.log('📍 High accuracy location failed, keeping current location');
      }
    };
    return () => {
      mounted.current = false;
      if (locationTimeoutRef.current) {
        clearTimeout(locationTimeoutRef.current);
      }
      if (locationSubscription && Platform.OS !== 'web') {
        locationSubscription.remove();
      }
    };
  }, []);

  const getAddressFromCoordinates = async (
    latitude: number,
    longitude: number
  ): Promise<string | null> => {
    try {
      const results = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (results.length > 0) {
        const { street, name, city, region, country } = results[0];
        const addressParts = [
          street || name,
          city,
          region,
          country,
        ].filter(Boolean);
        
        return addressParts.join(', ');
      }
      
      return null;
    } catch (error) {
      console.error('Error getting address:', error);
      return null;
    }
  };

  return {
    ...state,
    getAddressFromCoordinates,
  };
}