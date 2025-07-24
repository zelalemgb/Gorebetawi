import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Marker, Callout } from 'react-native-maps';
import { Report, ReportCategory } from '@/types';
import AnimatedReportPin from './AnimatedReportPin';

interface ReportMarkerProps {
  report: Report;
  onPress: (report: Report) => void;
  selected?: boolean;
  highlighted?: boolean;
}

export default function ReportMarker({
  report,
  onPress,
  selected = false,
  highlighted = false
}: ReportMarkerProps) {
  return (
    <Marker
      coordinate={{
        latitude: report.location.latitude,
        longitude: report.location.longitude,
      }}
      tracksViewChanges={false}
      onPress={() => onPress(report)}
    >
      <AnimatedReportPin
        report={report}
        isSelected={selected}
        isHighlighted={highlighted}
      />
      <Callout tooltip>
        <View style={styles.calloutContainer}>
          <Text style={styles.calloutTitle}>{report.title}</Text>
          {report.description ? (
            <Text style={styles.calloutSubtitle} numberOfLines={2}>
              {report.description}
            </Text>
          ) : null}
        </View>
      </Callout>
    </Marker>
  );
}

const styles = StyleSheet.create({
  calloutContainer: {
    padding: 8,
    maxWidth: 200,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  calloutSubtitle: {
    fontSize: 12,
  },
});