import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { Marker } from 'react-native-maps';
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
    >
      <TouchableOpacity onPress={() => onPress(report)} activeOpacity={0.8}>
        <AnimatedReportPin
          report={report}
          isSelected={selected}
          isHighlighted={highlighted}
        />
      </TouchableOpacity>
    </Marker>
  );
}

const styles = StyleSheet.create({});