import React, { Suspense } from 'react';
import { Platform, StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { Report } from '@/types';
import { Colors } from '@/constants/Colors';

interface MapComponentProps {
  center: [number, number];
  zoom: number;
  reports: Report[];
  selectedReport: Report | null;
  onMarkerClick: (report: Report) => void;
  onScroll?: (event: any) => void;
  filteredCategories?: string[];
}

const WebMapComponent = React.lazy(() => import('./WebMapComponent'));

export default function MapComponent(props: MapComponentProps) {
  if (Platform.OS === 'web') {
    return (
      <Suspense fallback={
        <View style={styles.container}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      }>
        <WebMapComponent {...props} />
      </Suspense>
    );
  }

  // Only require MobileMapComponent on native platforms
  if (Platform.OS !== 'web') {
    const MobileMapComponent = require('./MobileMapComponent').default;
    return <MobileMapComponent {...props} />;
  }

  // Fallback (should not reach here)
  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: Colors.primary,
  }
});