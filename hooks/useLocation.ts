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

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;

    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (!mounted.current) return;

        if (status !== 'granted') {
          setState({
            location: null,
            errorMsg: 'Enable location to see what\'s happening near you',
            loading: false,
          });
          return;
        }

        // Get initial location
        const initialLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
          maximumAge: 10000, // Use cached location if less than 10 seconds old
        });
        
        if (!mounted.current) return;
        
        setState({
          location: initialLocation,
          errorMsg: null,
          loading: false,
        });

        // Only set up location subscription on native platforms
        if (Platform.OS !== 'web') {
          locationSubscription = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.High,
              timeInterval: 10000,
              distanceInterval: 20, // Update when user moves 20m
            },
            (newLocation) => {
              if (mounted.current) {
                setState(prev => ({
                  ...prev,
                  location: newLocation,
                }));
              }
            }
          );
        }
      } catch (error) {
        if (mounted.current) {
          setState({
            location: null,
            errorMsg: 'Enable location to see what\'s happening near you',
            loading: false,
          });
        }
      }
    })();

    return () => {
      mounted.current = false;
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