import React, { useEffect, useRef } from 'react';
import { StyleSheet, Dimensions, View, Text } from 'react-native';
import MapView, { Marker, UrlTile, Circle, Callout, PROVIDER_DEFAULT } from 'react-native-maps';
import { Report } from '@/types';
import { Colors } from '@/constants/Colors';
import ReportMarker from './ReportMarker';

interface MapComponentProps {
  center: [number, number];
  zoom: number;
  reports: Report[];
  selectedReport: Report | null;
  onMarkerClick: (report: Report) => void;
  onScroll?: (event: any) => void;
  filteredCategories?: string[];
}

const zoomToDelta = (zoom: number) => {
  const { width, height } = Dimensions.get('window');
  const latDelta = Math.exp(Math.log(360) - zoom * Math.LN2);
  const lngDelta = latDelta * (width / height);
  return { latitudeDelta: latDelta, longitudeDelta: lngDelta };
};

export default function MobileMapComponent({
  center,
  zoom,
  reports,
  selectedReport,
  onMarkerClick,
  onScroll,
  filteredCategories = [],
}: MapComponentProps) {
  const mapRef = useRef<MapView | null>(null);
  const region = {
    latitude: center[0],
    longitude: center[1],
    ...zoomToDelta(zoom),
  };

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.animateToRegion(region, 200);
    }
  }, [region]);

  const visibleReports =
    filteredCategories.length > 0
      ? reports.filter(r => filteredCategories.includes(r.category))
      : reports;

  return (
    <MapView
      ref={mapRef}
      style={styles.map}
      provider={PROVIDER_DEFAULT}
      onScroll={onScroll}
      initialRegion={region}
    >
      <UrlTile
        urlTemplate="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maximumZ={19}
      />
      <Circle
        center={{ latitude: center[0], longitude: center[1] }}
        radius={500}
        strokeColor="rgba(102, 126, 234, 0.4)"
        strokeWidth={1.5}
        fillColor="rgba(102, 126, 234, 0.06)"
        lineDashPattern={[3, 6]}
      />
      
      {/* Inner glow circle */}
      <Circle
        center={{ latitude: center[0], longitude: center[1] }}
        radius={150}
        strokeColor="transparent"
        fillColor="rgba(102, 126, 234, 0.12)"
      />
      
      <Marker
        coordinate={{ latitude: center[0], longitude: center[1] }}
        tracksViewChanges={false}
      >
        <View style={styles.userLocationContainer}>
          {/* Outer pulsing glow */}
          <View style={styles.userGlowRing} />
          
          {/* Middle soft ring */}
          <View style={styles.userSoftRing} />
          
          {/* Inner core dot */}
          <View style={styles.userCoreDot} />
        </View>
        
        <Callout>
          <CalloutView />
        </Callout>
      </Marker>
      
      {visibleReports.map(report => (
        <ReportMarker
          key={report.id}
          report={report}
          onPress={onMarkerClick}
          selected={selectedReport?.id === report.id}
        />
      ))}
    </MapView>
  );
}

function CalloutView() {
  return (
    <View style={styles.calloutContainer}>
      <Text style={styles.calloutTitle}>📍 Your Location</Text>
      <Text style={styles.calloutSubtitle}>Reports within 500m radius</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
  userLocationContainer: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  userGlowRing: {
    position: 'absolute',
    width: 32,
    height: 32,
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    borderRadius: 16,
    opacity: 0.6,
  },
  userSoftRing: {
    position: 'absolute',
    width: 20,
    height: 20,
    backgroundColor: 'rgba(102, 126, 234, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.3)',
    borderRadius: 10,
    opacity: 0.4,
  },
  userCoreDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    backgroundColor: '#667eea',
    borderWidth: 2,
    borderColor: 'white',
    borderRadius: 6,
    shadowColor: 'rgba(102, 126, 234, 0.4)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 5,
  },
  calloutContainer: {
    padding: 8,
    alignItems: 'center',
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 2,
  },
  calloutSubtitle: {
    fontSize: 11,
    color: '#718096',
    fontWeight: '500',
  },
});
