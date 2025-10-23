import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Report } from '@/types';

interface MapComponentProps {
  center: [number, number];
  zoom: number;
  reports: Report[];
  selectedReport: Report | null;
  highlightedReports?: Report[];
  filteredCategories?: string[];
  onMarkerClick: (report: Report) => void;
  onMarkerHover?: (report: Report) => void;
  onMarkerHoverOut?: () => void;
  onScroll?: (event: any) => void;
}

export default function MobileMapComponent(props: MapComponentProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Mobile map is not available on web</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.lightGray,
  },
  text: {
    color: Colors.text,
    fontSize: 16,
  },
});
