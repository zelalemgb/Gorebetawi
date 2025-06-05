import { useState, useEffect, useRef } from 'react';
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
    let locationSubscription: Location.LocationSubscription;

    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (!mounted.current) return;

        if (status !== 'granted') {
          setState({
            location: null,
            errorMsg: 'Permission to access location was denied',
            loading: false,
          });
          return;
        }

        // Get initial location
        const initialLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        
        if (!mounted.current) return;
        setState({
          location: initialLocation,
          errorMsg: null,
          loading: false,
        });

        // Subscribe to location updates
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 10000, // Update every 10 seconds
            distanceInterval: 10, // Update if moved by 10 meters
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
      } catch (error) {
        if (mounted.current) {
          setState({
            location: null,
            errorMsg: 'Failed to get location',
            loading: false,
          });
        }
      }
    })();

    // Cleanup subscription and mounted ref on unmount
    return () => {
      mounted.current = false;
      if (locationSubscription) {
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