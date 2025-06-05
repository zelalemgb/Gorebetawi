import React, { useState, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Report } from '@/types';
import { Colors } from '@/constants/Colors';
import dynamic from 'next/dynamic';

interface MapComponentProps {
  center: [number, number];
  zoom: number;
  reports: Report[];
  selectedReport: Report | null;
  onMarkerClick: (report: Report) => void;
  onScroll?: (event: any) => void;
}

// Dynamically import the map component to avoid SSR issues
const MapWithNoSSR = dynamic(
  () => import('./WebMapComponentClient'), 
  { 
    ssr: false,
    loading: () => (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingIndicator} />
      </View>
    )
  }
);

export default function WebMapComponent(props: MapComponentProps) {
  return <MapWithNoSSR {...props} />;
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