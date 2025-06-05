import React from 'react';
import { Platform, StyleSheet, View, Text } from 'react-native';
import { Report } from '@/types';
import { Colors } from '@/constants/Colors';

interface MapComponentProps {
  center: [number, number];
  zoom: number;
  reports: Report[];
  selectedReport: Report | null;
  onMarkerClick: (report: Report) => void;
  onScroll?: (event: any) => void;
}

export default function MapComponent(props: MapComponentProps) {
  if (Platform.OS === 'web') {
    // Properly handle the module resolution for web platform
    const WebMapModule = require('./WebMapComponent.tsx');
    const WebMapComponent = WebMapModule.default || WebMapModule;
    return <WebMapComponent {...props} />;
  }

  // Return a placeholder for non-web platforms
  return (
    <View style={styles.container}>
      <Text>Map is only available on web platform</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});