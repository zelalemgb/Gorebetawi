import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Marker } from 'react-native-maps';
import { MapPin } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { Report, ReportCategory } from '@/types';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

interface ReportMarkerProps {
  report: Report;
  onPress: (report: Report) => void;
  selected?: boolean;
}

export default function ReportMarker({ report, onPress, selected = false }: ReportMarkerProps) {
  const scale = useSharedValue(selected ? 1.2 : 1);
  
  // Update scale when selected state changes
  React.useEffect(() => {
    scale.value = withSpring(selected ? 1.2 : 1, {
      damping: 20,
      stiffness: 200,
    });
  }, [selected, scale]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const getCategoryColor = (category: ReportCategory) => {
    return Colors[category];
  };

  return (
    <Marker
      coordinate={{
        latitude: report.location.latitude,
        longitude: report.location.longitude,
      }}
      onPress={() => onPress(report)}
      tracksViewChanges={false}
    >
      <Animated.View style={[styles.markerContainer, animatedStyle]}>
        <MapPin
          size={32}
          color={getCategoryColor(report.category)}
          fill={selected ? getCategoryColor(report.category) : 'transparent'}
          strokeWidth={selected ? 2.5 : 2}
        />
        {selected && (
          <View 
            style={[
              styles.dot, 
              { backgroundColor: getCategoryColor(report.category) }
            ]} 
          />
        )}
      </Animated.View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
  },
  dot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    top: 12,
    backgroundColor: Colors.indigo,
  },
});