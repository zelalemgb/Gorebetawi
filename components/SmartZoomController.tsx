import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  withDelay
} from 'react-native-reanimated';
import { MapPin, Activity, Navigation } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { Report } from '@/types';

interface SmartZoomControllerProps {
  reports: Report[];
  currentLocation: [number, number];
  onZoomToLocation: (location: [number, number], zoom: number) => void;
  onZoomToActivity: () => void;
  visible: boolean;
}

interface ActivityHotspot {
  location: [number, number];
  reportCount: number;
  categories: string[];
  recentActivity: number; // Reports in last 2 hours
}

export default function SmartZoomController({ 
  reports, 
  currentLocation,
  onZoomToLocation,
  onZoomToActivity,
  visible 
}: SmartZoomControllerProps) {
  const [hotspots, setHotspots] = React.useState<ActivityHotspot[]>([]);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const opacity = useSharedValue(0);
  
  useEffect(() => {
    if (!visible) return;
    
    const activityHotspots = findActivityHotspots(reports);
    setHotspots(activityHotspots);
    
    // Show suggestions if there's significant activity
    const hasSignificantActivity = activityHotspots.some(h => h.recentActivity >= 3);
    setShowSuggestions(hasSignificantActivity);
  }, [reports, visible]);
  
  useEffect(() => {
    if (visible && showSuggestions) {
      opacity.value = withDelay(2000, withTiming(1, { duration: 600 }));
      
      // Auto-hide after 10 seconds
      const timer = setTimeout(() => {
        opacity.value = withTiming(0, { duration: 400 });
        setTimeout(() => setShowSuggestions(false), 400);
      }, 10000);
      
      return () => clearTimeout(timer);
    } else {
      opacity.value = withTiming(0, { duration: 400 });
    }
  }, [visible, showSuggestions]);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: (1 - opacity.value) * 20 }],
    };
  });
  
  const handleZoomToHotspot = (hotspot: ActivityHotspot) => {
    onZoomToLocation(hotspot.location, 16);
    setShowSuggestions(false);
  };
  
  const handleZoomToMyLocation = () => {
    onZoomToLocation(currentLocation, 15);
    setShowSuggestions(false);
  };
  
  const handleDismiss = () => {
    opacity.value = withTiming(0, { duration: 400 });
    setTimeout(() => setShowSuggestions(false), 400);
  };
  
  if (!visible || !showSuggestions || hotspots.length === 0) {
    return null;
  }
  
  const topHotspot = hotspots[0];
  
  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={styles.suggestionCard}>
        <View style={styles.header}>
          <Activity size={20} color={Colors.accent} />
          <Text style={styles.title}>Activity Nearby</Text>
          <TouchableOpacity 
            style={styles.dismissButton}
            onPress={handleDismiss}
          >
            <Text style={styles.dismissText}>×</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.description}>
          {topHotspot.recentActivity} recent reports in nearby area
        </Text>
        
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleZoomToHotspot(topHotspot)}
          >
            <MapPin size={16} color={Colors.accent} />
            <Text style={styles.actionText}>See Activity</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={handleZoomToMyLocation}
          >
            <Navigation size={16} color={Colors.secondaryText} />
            <Text style={[styles.actionText, styles.secondaryText]}>My Location</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.categories}>
          {topHotspot.categories.slice(0, 3).map((category, index) => (
            <View key={category} style={styles.categoryTag}>
              <Text style={styles.categoryText}>
                {getCategoryEmoji(category)} {category}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </Animated.View>
  );
}

function findActivityHotspots(reports: Report[]): ActivityHotspot[] {
  const now = Date.now();
  const recentThreshold = now - 7200000; // 2 hours
  const gridSize = 0.005; // Roughly 500m grid
  
  // Group reports by grid cells
  const grid = new Map<string, Report[]>();
  
  reports.forEach(report => {
    const gridX = Math.floor(report.location.latitude / gridSize);
    const gridY = Math.floor(report.location.longitude / gridSize);
    const key = `${gridX},${gridY}`;
    
    if (!grid.has(key)) {
      grid.set(key, []);
    }
    grid.get(key)!.push(report);
  });
  
  // Convert to hotspots and calculate metrics
  const hotspots: ActivityHotspot[] = [];
  
  grid.forEach((gridReports, key) => {
    if (gridReports.length < 2) return; // Need at least 2 reports
    
    const [gridX, gridY] = key.split(',').map(Number);
    const centerLat = gridX * gridSize + gridSize / 2;
    const centerLng = gridY * gridSize + gridSize / 2;
    
    const recentActivity = gridReports.filter(r => r.timestamp > recentThreshold).length;
    const categories = [...new Set(gridReports.map(r => r.category))];
    
    hotspots.push({
      location: [centerLat, centerLng],
      reportCount: gridReports.length,
      categories,
      recentActivity,
    });
  });
  
  // Sort by recent activity and total reports
  return hotspots
    .sort((a, b) => {
      if (a.recentActivity !== b.recentActivity) {
        return b.recentActivity - a.recentActivity;
      }
      return b.reportCount - a.reportCount;
    })
    .slice(0, 3); // Top 3 hotspots
}

function getCategoryEmoji(category: string): string {
  const emojis: Record<string, string> = {
    light: '💡',
    water: '💧',
    fuel: '⛽',
    price: '🛒',
    traffic: '🚦',
    infrastructure: '🛠️',
    environment: '🌿',
    safety: '⚠️',
  };
  return emojis[category] || '📍';
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 140,
    left: 16,
    right: 16,
    zIndex: 25,
  },
  suggestionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    backdropFilter: 'blur(20px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 8,
  },
  dismissButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.neutral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissText: {
    fontSize: 16,
    color: Colors.neutralDark,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  description: {
    fontSize: 14,
    color: Colors.secondaryText,
    marginBottom: 16,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${Colors.accent}15`,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  secondaryButton: {
    backgroundColor: Colors.neutral,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.accent,
    marginLeft: 6,
  },
  secondaryText: {
    color: Colors.secondaryText,
  },
  categories: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  categoryTag: {
    backgroundColor: Colors.neutral,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  categoryText: {
    fontSize: 12,
    color: Colors.secondaryText,
    fontWeight: '500',
  },
});