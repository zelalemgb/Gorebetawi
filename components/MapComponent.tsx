import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Report } from '@/types';

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
    const WebMapComponent = require('./WebMapComponent').default;
    return <WebMapComponent {...props} />;
  } else {
    const NativeMapComponent = require('./NativeMapComponent').default;
    return <NativeMapComponent {...props} />;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});