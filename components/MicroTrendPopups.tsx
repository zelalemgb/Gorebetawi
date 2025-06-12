import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  withDelay,
  withSequence,
  runOnJS
} from 'react-native-reanimated';
import { TrendingUp, Eye, MapPin, X } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { Report, ReportCategory } from '@/types';

interface TrendData {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  category: ReportCategory;
  reportCount: number;
  location?: { latitude: number; longitude: number };
}

interface MicroTrendPopupsProps {
  reports: Report[];
  currentLocation: [number, number];
  onTrendTap: (trend: TrendData) => void;
  visible: boolean;
}

export default function MicroTrendPopups({ 
  reports, 
  currentLocation,
  onTrendTap,
  visible 
}: MicroTrendPopupsProps) {
  const [currentTrend, setCurrentTrend] = useState<TrendData | null>(null);
  const [trendQueue, setTrendQueue] = useState<TrendData[]>([]);
  
  useEffect(() => {
    if (!visible) return;
    
    const trends = generateTrends(reports, currentLocation);
    setTrendQueue(trends);
    
    // Show first trend after a delay
    if (trends.length > 0) {
      const timer = setTimeout(() => {
        setCurrentTrend(trends[0]);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [reports, currentLocation, visible]);
  
  useEffect(() => {
    if (!currentTrend) return;
    
    // Auto-dismiss after 8 seconds and show next trend
    const timer = setTimeout(() => {
      handleDismiss();
    }, 8000);
    
    return () => clearTimeout(timer);
  }, [currentTrend]);
  
  const handleDismiss = () => {
    setCurrentTrend(null);
    
    // Show next trend after a delay
    setTimeout(() => {
      setTrendQueue(prev => {
        const remaining = prev.slice(1);
        if (remaining.length > 0) {
          setCurrentTrend(remaining[0]);
        }
        return remaining;
      });
    }, 5000);
  };
  
  const handleTrendPress = () => {
    if (currentTrend) {
      onTrendTap(currentTrend);
      handleDismiss();
    }
  };
  
  if (!visible || !currentTrend) {
    return null;
  }
  
  return (
    <TrendPopup 
      trend={currentTrend}
      onPress={handleTrendPress}
      onDismiss={handleDismiss}
    />
  );
}

function TrendPopup({ 
  trend, 
  onPress, 
  onDismiss 
}: { 
  trend: TrendData; 
  onPress: () => void; 
  onDismiss: () => void; 
}) {
  const translateY = useSharedValue(100);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);
  
  useEffect(() => {
    // Slide in animation
    opacity.value = withTiming(1, { duration: 300 });
    translateY.value = withTiming(0, { duration: 400 });
    scale.value = withSequence(
      withTiming(1.05, { duration: 200 }),
      withTiming(1, { duration: 200 })
    );
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { translateY: translateY.value },
        { scale: scale.value }
      ],
    };
  });
  
  const handleDismissPress = () => {
    opacity.value = withTiming(0, { duration: 300 });
    translateY.value = withTiming(100, { duration: 400 });
    
    setTimeout(() => {
      runOnJS(onDismiss)();
    }, 400);
  };
  
  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <TouchableOpacity 
        style={styles.popup}
        onPress={onPress}
        activeOpacity={0.9}
      >
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: `${trend.color}20` }]}>
            {trend.icon}
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.title}>{trend.title}</Text>
            <Text style={styles.description}>{trend.description}</Text>
          </View>
          <TouchableOpacity 
            style={styles.dismissButton}
            onPress={handleDismissPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={16} color={Colors.neutralDark} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.footer}>
          <View style={styles.tapHint}>
            <Eye size={14} color={Colors.accent} />
            <Text style={styles.tapText}>Tap to explore</Text>
          </View>
          <Text style={styles.reportCount}>
            {trend.reportCount} report{trend.reportCount !== 1 ? 's' : ''}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

function generateTrends(reports: Report[], currentLocation: [number, number]): TrendData[] {
  const trends: TrendData[] = [];
  const now = Date.now();
  const today = now - 86400000; // Last 24 hours
  
  // Recent price activity
  const recentPriceReports = reports.filter(r => 
    r.category === 'price' && r.timestamp > today
  );
  
  if (recentPriceReports.length >= 3) {
    const avgPrice = recentPriceReports.reduce((sum, r) => 
      sum + (r.metadata?.priceDetails?.price || 0), 0) / recentPriceReports.length;
    
    trends.push({
      id: 'price-trend',
      title: '👀 Price Activity',
      description: `More people in your area are reporting prices today. Avg: ${avgPrice.toFixed(0)} birr`,
      icon: <TrendingUp size={20} color={Colors.price} />,
      color: Colors.price,
      category: 'price',
      reportCount: recentPriceReports.length,
    });
  }
  
  // Power outage pattern
  const powerOutages = reports.filter(r => 
    r.category === 'light' && 
    r.metadata?.duration === 'ongoing' &&
    r.timestamp > now - 172800000 // Last 2 days
  );
  
  if (powerOutages.length >= 2) {
    const affectedAreas = new Set(powerOutages.map(r => 
      r.address?.split(',')[0] || 'area'
    )).size;
    
    trends.push({
      id: 'power-trend',
      title: '⚡ Power Outage Pattern',
      description: `Outages affecting ${affectedAreas} neighboring areas`,
      icon: <MapPin size={20} color={Colors.light} />,
      color: Colors.light,
      category: 'light',
      reportCount: powerOutages.length,
    });
  }
  
  // Traffic congestion
  const heavyTraffic = reports.filter(r => 
    r.category === 'traffic' && 
    r.metadata?.severity === 'heavy' &&
    r.timestamp > now - 3600000 // Last hour
  );
  
  if (heavyTraffic.length >= 2) {
    trends.push({
      id: 'traffic-trend',
      title: '🚦 Heavy Traffic Alert',
      description: `Multiple congestion reports in nearby areas`,
      icon: <TrendingUp size={20} color={Colors.traffic} />,
      color: Colors.traffic,
      category: 'traffic',
      reportCount: heavyTraffic.length,
    });
  }
  
  // Fuel availability
  const fuelAvailable = reports.filter(r => 
    r.category === 'fuel' && 
    r.metadata?.availability === true &&
    r.timestamp > now - 7200000 // Last 2 hours
  );
  
  if (fuelAvailable.length >= 2) {
    const stationsWithFuel = new Set(fuelAvailable.map(r => 
      r.metadata?.fuelStation?.name || 'station'
    )).size;
    
    trends.push({
      id: 'fuel-trend',
      title: '⛽ Fuel Available',
      description: `${stationsWithFuel} stations nearby have fuel`,
      icon: <TrendingUp size={20} color={Colors.fuel} />,
      color: Colors.fuel,
      category: 'fuel',
      reportCount: fuelAvailable.length,
    });
  }
  
  // Infrastructure issues clustering
  const infraIssues = reports.filter(r => 
    r.category === 'infrastructure' &&
    r.timestamp > now - 604800000 // Last week
  );
  
  if (infraIssues.length >= 4) {
    trends.push({
      id: 'infra-trend',
      title: '🚧 Infrastructure Issues',
      description: `${infraIssues.length} road problems reported this week`,
      icon: <TrendingUp size={20} color={Colors.infrastructure} />,
      color: Colors.infrastructure,
      category: 'infrastructure',
      reportCount: infraIssues.length,
    });
  }
  
  return trends.slice(0, 3); // Limit to 3 trends to avoid overwhelming
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 180,
    left: 16,
    right: 16,
    zIndex: 30,
  },
  popup: {
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
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: Colors.secondaryText,
    lineHeight: 20,
  },
  dismissButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.neutral,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tapHint: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tapText: {
    fontSize: 12,
    color: Colors.accent,
    fontWeight: '500',
    marginLeft: 4,
  },
  reportCount: {
    fontSize: 12,
    color: Colors.neutralDark,
    fontWeight: '500',
  },
});