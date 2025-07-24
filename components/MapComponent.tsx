import React, { Suspense } from 'react';
import { Platform, StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { Report } from '@/types';
import { Colors } from '@/constants/Colors';

interface MapComponentProps {
  center: [number, number];
  zoom: number;
  reports: Report[];
  selectedReport: Report | null;
  highlightedReports?: Report[];
  filteredCategories?: ReportCategory[];
  onMarkerClick: (report: Report) => void;
  onScroll?: (event: any) => void;
}

const WebMapComponent = React.lazy(() => import('./WebMapComponent'));
const MobileMapComponent = React.lazy(() => import('./MobileMapComponent'));

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

  // Use lazy loading for native platforms as well
  return (
    <Suspense fallback={
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    }>
      <MobileMapComponent {...props} />
    </Suspense>
  );
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
  },
});