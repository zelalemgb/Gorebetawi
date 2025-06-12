import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  withDelay,
  interpolate
} from 'react-native-reanimated';
import { Colors } from '@/constants/Colors';

interface TrailPoint {
  id: string;
  latitude: number;
  longitude: number;
  timestamp: number;
  type: 'view' | 'report' | 'confirm';
}

interface UserTrailProps {
  trailPoints: TrailPoint[];
  currentLocation: [number, number];
  zoom: number;
  visible: boolean;
}

export default function UserTrail({ 
  trailPoints, 
  currentLocation, 
  zoom,
  visible 
}: UserTrailProps) {
  const [visiblePoints, setVisiblePoints] = useState<TrailPoint[]>([]);
  const opacity = useSharedValue(0);
  
  useEffect(() => {
    if (!visible || zoom < 14) {
      setVisiblePoints([]);
      return;
    }
    
    // Show only recent trail points (last 2 hours)
    const now = Date.now();
    const recentPoints = trailPoints.filter(point => 
      now - point.timestamp < 7200000 // 2 hours
    );
    
    setVisiblePoints(recentPoints.slice(-20)); // Last 20 points
  }, [trailPoints, zoom, visible]);
  
  useEffect(() => {
    if (visible && visiblePoints.length > 0 && zoom >= 14) {
      opacity.value = withTiming(0.6, { duration: 600 });
    } else {
      opacity.value = withTiming(0, { duration: 300 });
    }
  }, [visible, visiblePoints.length, zoom]);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });
  
  if (!visible || zoom < 14 || visiblePoints.length === 0) {
    return null;
  }
  
  return (
    <Animated.View style={[styles.container, animatedStyle]} pointerEvents="none">
      {/* Trail line */}
      <TrailLine points={visiblePoints} />
      
      {/* Trail points */}
      {visiblePoints.map((point, index) => (
        <TrailPoint 
          key={point.id} 
          point={point} 
          index={index}
          total={visiblePoints.length}
        />
      ))}
    </Animated.View>
  );
}

function TrailLine({ points }: { points: TrailPoint[] }) {
  if (points.length < 2) return null;
  
  // Create SVG path for the trail line
  const pathData = points.reduce((path, point, index) => {
    const x = (point.longitude - 38.7) * 10000; // Convert to screen coordinates
    const y = (9.1 - point.latitude) * 10000;
    
    if (index === 0) {
      return `M ${x} ${y}`;
    }
    return `${path} L ${x} ${y}`;
  }, '');
  
  return (
    <View style={styles.trailLine}>
      {/* This would be implemented with react-native-svg in a real app */}
      <View style={styles.trailPath} />
    </View>
  );
}

function TrailPoint({ 
  point, 
  index, 
  total 
}: { 
  point: TrailPoint; 
  index: number; 
  total: number; 
}) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  
  useEffect(() => {
    scale.value = withDelay(
      index * 100,
      withTiming(1, { duration: 300 })
    );
    opacity.value = withDelay(
      index * 100,
      withTiming(1, { duration: 300 })
    );
  }, [index]);
  
  const animatedStyle = useAnimatedStyle(() => {
    // Fade older points
    const age = (total - index) / total;
    const finalOpacity = interpolate(age, [0, 1], [0.2, 0.8]);
    
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value * finalOpacity,
    };
  });
  
  const getPointStyle = () => {
    switch (point.type) {
      case 'report':
        return {
          backgroundColor: Colors.accent,
          borderColor: Colors.white,
          width: 12,
          height: 12,
        };
      case 'confirm':
        return {
          backgroundColor: Colors.success,
          borderColor: Colors.white,
          width: 10,
          height: 10,
        };
      default: // 'view'
        return {
          backgroundColor: Colors.neutralDark,
          borderColor: Colors.white,
          width: 8,
          height: 8,
        };
    }
  };
  
  // Convert lat/lng to screen position (simplified)
  const x = (point.longitude - 38.7) * 10000;
  const y = (9.1 - point.latitude) * 10000;
  
  return (
    <Animated.View 
      style={[
        styles.trailPoint,
        getPointStyle(),
        {
          left: x,
          top: y,
        },
        animatedStyle
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
    zIndex: 3,
  },
  trailLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  trailPath: {
    // This would be an SVG path in a real implementation
    position: 'absolute',
    backgroundColor: Colors.accent,
    opacity: 0.3,
    height: 2,
  },
  trailPoint: {
    position: 'absolute',
    borderRadius: 10,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});