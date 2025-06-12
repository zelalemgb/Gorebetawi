import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withDelay,
  withSequence,
  runOnJS
} from 'react-native-reanimated';
import { 
  Lightbulb, 
  Droplet, 
  Car, 
  Wrench,
  Clock
} from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { Report } from '@/types';
import { formatDistanceToNow } from '@/utils/dateUtils';

interface FloatingIncidentSummaryProps {
  reports: Report[];
  visible: boolean;
  onDismiss?: () => void;
}

interface SummaryItem {
  id: string;
  icon: React.ReactNode;
  text: string;
  color: string;
  priority: number;
}

export default function FloatingIncidentSummary({ 
  reports, 
  visible, 
  onDismiss 
}: FloatingIncidentSummaryProps) {
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);
  
  // Generate summary items from reports
  const generateSummaryItems = (): SummaryItem[] => {
    const items: SummaryItem[] = [];
    
    // Water outages
    const waterOutages = reports.filter(r => 
      r.category === 'water' && 
      r.metadata?.duration === 'ongoing'
    );
    if (waterOutages.length > 0) {
      const latest = waterOutages[0];
      items.push({
        id: 'water',
        icon: <Droplet size={16} color="#2196F3" />,
        text: `💧 Water outage in ${latest.address?.split(',')[0] || 'area'} since ${formatDistanceToNow(latest.timestamp)}`,
        color: '#2196F3',
        priority: 1
      });
    }
    
    // Light outages
    const lightOutages = reports.filter(r => 
      r.category === 'light' && 
      r.metadata?.duration === 'ongoing'
    );
    if (lightOutages.length > 0) {
      const latest = lightOutages[0];
      items.push({
        id: 'light',
        icon: <Lightbulb size={16} color="#FDD835" />,
        text: `⚡ Light outage in ${latest.address?.split(',')[0] || 'area'} since ${formatDistanceToNow(latest.timestamp)}`,
        color: '#FDD835',
        priority: 2
      });
    }
    
    // Infrastructure issues
    const potholes = reports.filter(r => 
      r.category === 'infrastructure' && 
      r.metadata?.subcategory === 'Pothole'
    );
    if (potholes.length >= 3) {
      items.push({
        id: 'potholes',
        icon: <Wrench size={16} color="#9E9E9E" />,
        text: `🚧 ${potholes.length} potholes nearby`,
        color: '#9E9E9E',
        priority: 3
      });
    }
    
    // Heavy traffic
    const heavyTraffic = reports.filter(r => 
      r.category === 'traffic' && 
      r.metadata?.severity === 'heavy' &&
      Date.now() - r.timestamp < 3600000 // Within last hour
    );
    if (heavyTraffic.length > 0) {
      const latest = heavyTraffic[0];
      items.push({
        id: 'traffic',
        icon: <Car size={16} color="#F44336" />,
        text: `🚦 Heavy congestion at ${latest.address?.split(',')[0] || 'intersection'}`,
        color: '#F44336',
        priority: 1
      });
    }
    
    // Fuel availability
    const fuelAvailable = reports.filter(r => 
      r.category === 'fuel' && 
      r.metadata?.availability === true &&
      Date.now() - r.timestamp < 7200000 // Within last 2 hours
    );
    if (fuelAvailable.length > 0) {
      const latest = fuelAvailable[0];
      const queueText = latest.metadata?.queueLength === 'none' ? 'no queue' : 
                       latest.metadata?.queueLength === 'short' ? 'short queue' : 'queue';
      items.push({
        id: 'fuel',
        icon: <Droplet size={16} color="#43A047" />,
        text: `⛽ Fuel available at ${latest.metadata?.fuelStation?.name || 'station'} - ${queueText}`,
        color: '#43A047',
        priority: 2
      });
    }
    
    return items.sort((a, b) => a.priority - b.priority).slice(0, 2); // Show max 2 items
  };
  
  const summaryItems = generateSummaryItems();
  
  useEffect(() => {
    if (visible && summaryItems.length > 0) {
      // Fade in
      opacity.value = withTiming(1, { duration: 300 });
      translateY.value = withTiming(0, { duration: 400 });
      
      // Auto dismiss after 6 seconds
      const timer = setTimeout(() => {
        opacity.value = withTiming(0, { duration: 300 });
        translateY.value = withTiming(-100, { duration: 400 });
        if (onDismiss) {
          setTimeout(() => runOnJS(onDismiss)(), 400);
        }
      }, 6000);
      
      return () => clearTimeout(timer);
    } else {
      opacity.value = withTiming(0, { duration: 300 });
      translateY.value = withTiming(-100, { duration: 400 });
    }
  }, [visible, summaryItems.length]);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });
  
  if (summaryItems.length === 0) return null;
  
  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      {summaryItems.map((item, index) => (
        <View 
          key={item.id} 
          style={[
            styles.summaryItem,
            { 
              backgroundColor: `${item.color}15`,
              borderLeftColor: item.color,
              marginBottom: index < summaryItems.length - 1 ? 8 : 0
            }
          ]}
        >
          <View style={styles.iconContainer}>
            {item.icon}
          </View>
          <Text style={styles.summaryText}>{item.text}</Text>
          <View style={styles.timeContainer}>
            <Clock size={12} color={Colors.secondaryText} />
          </View>
        </View>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 120,
    left: 16,
    right: 16,
    zIndex: 20,
    maxWidth: 400,
    alignSelf: 'center',
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    backdropFilter: 'blur(10px)',
  },
  iconContainer: {
    marginRight: 12,
  },
  summaryText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    lineHeight: 18,
  },
  timeContainer: {
    marginLeft: 8,
  },
});