import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
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

export default function NativeMapComponent({
  center,
  zoom,
  reports,
  selectedReport,
  onMarkerClick
}: MapComponentProps) {
  const getCategoryColor = (category: string) => {
    return Colors[category as keyof typeof Colors];
  };

  // Convert zoom level to region delta
  const zoomToDelta = (zoom: number) => {
    return 360 / Math.pow(2, zoom);
  };

  const delta = zoomToDelta(zoom);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: center[0],
          longitude: center[1],
          latitudeDelta: delta,
          longitudeDelta: delta,
        }}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {/* User location radius */}
        <Circle
          center={{
            latitude: center[0],
            longitude: center[1],
          }}
          radius={1000} // 1km radius
          strokeWidth={1}
          strokeColor={Colors.accent}
          fillColor={`${Colors.accent}20`}
        />

        {reports.map((report) => {
          const color = getCategoryColor(report.category);
          const isSelected = selectedReport?.id === report.id;
          
          return (
            <Marker
              key={report.id}
              coordinate={{
                latitude: report.location.latitude,
                longitude: report.location.longitude,
              }}
              onPress={() => onMarkerClick(report)}
              pinColor={color}
              style={{
                transform: [{ scale: isSelected ? 1.2 : 1 }],
              }}
            />
          );
        })}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
});