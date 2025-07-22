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
        strokeColor={Colors.accent}
        fillColor="rgba(63,81,181,0.05)"
      />
      <Marker
        coordinate={{ latitude: center[0], longitude: center[1] }}
        tracksViewChanges={false}
      >
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
    <View style={{ padding: 4 }}>
      <Text style={{ fontSize: 12, fontWeight: 'bold' }}>Your Location</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
