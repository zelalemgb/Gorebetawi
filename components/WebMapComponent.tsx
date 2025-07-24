import React, { Suspense } from 'react';
import { StyleSheet, View } from 'react-native';
import { Report } from '@/types';
import { Colors } from '@/constants/Colors';
import WebMapComponentClient from './WebMapComponentClient';

interface MapComponentProps {
  center: [number, number];
  zoom: number;
  reports: Report[];
  selectedReport: Report | null;
  onMarkerClick: (report: Report) => void;
  onMarkerHover?: (report: Report) => void;
  onMarkerHoverOut?: () => void;
  onScroll?: (event: any) => void;
}

export default function WebMapComponent(props: MapComponentProps) {
  return (
    <Suspense fallback={
      <View style={styles.loadingContainer}>
        <View style={styles.loadingIndicator} />
      </View>
    }>
      <WebMapComponentClient {...props} />
    </Suspense>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#ddd',
    borderTopColor: Colors.accent,
    transform: [{ rotate: '45deg' }],
  },
});