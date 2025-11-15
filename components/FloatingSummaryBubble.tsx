import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Dimensions 
} from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSequence,
  withDelay,
  runOnJS,
  Easing
} from 'react-native-reanimated';
import {
  LightbulbOff,
  Droplet,
  Fuel,
  DollarSign,
  Car,
  HardHat,
  Leaf,
  TriangleAlert as AlertTriangle,
  ChevronDown,
  MapPin
} from 'lucide-react-native';
import { LightTheme } from '@/constants/Colors';
import { Report, ReportCategory } from '@/types';
import { formatDistanceToNow } from '@/utils/dateUtils';

interface FloatingSummaryBubbleProps {
  reports: Report[];
  userLocation: {
    latitude: number;
    longitude: number;
  } | null;
  onReportSelect?: (report: Report) => void;
  onExpand?: () => void;
}

interface SummaryItem {
  category: ReportCategory;
  icon: JSX.Element;
  emoji: string;
  count: number;
  latestReport: Report;
  distance: number;
}

const CATEGORY_CONFIG = {
  light: { icon: LightbulbOff, emoji: '💡', color: '#FDD835' },
  water: { icon: Droplet, emoji: '💧', color: '#2196F3' },
  fuel: { icon: Fuel, emoji: '⛽', color: '#43A047' },
  price: { icon: DollarSign, emoji: '🛒', color: '#FF9800' },
  traffic: { icon: Car, emoji: '🚦', color: '#F44336' },
  infrastructure: { icon: HardHat, emoji: '🚧', color: '#9E9E9E' },
  environment: { icon: Leaf, emoji: '🌿', color: '#4CAF50' },
  safety: { icon: AlertTriangle, emoji: '⚠️', color: '#E53935' }
};

const RADIUS_KM = 1; // 1km radius

export default function FloatingSummaryBubble({
  reports,
  userLocation,
  onReportSelect,
  onExpand
}: FloatingSummaryBubbleProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [summaryItems, setSummaryItems] = useState<SummaryItem[]>([]);
  
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const expandHeight = useSharedValue(0);

  // Calculate distance between two coordinates in km
  const calculateDistance = (
    lat1: number, 
    lon1: number, 
    lat2: number, 
    lon2: number
  ): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Process nearby reports
  useEffect(() => {
    if (!userLocation || reports.length === 0) {
      setIsVisible(false);
      return;
    }

    // Filter reports within radius
    const nearbyReports = reports.filter(report => {
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        report.location.latitude,
        report.location.longitude
      );
      return distance <= RADIUS_KM;
    });

    if (nearbyReports.length === 0) {
      setIsVisible(false);
      return;
    }

    // Group by category and prioritize
    const categoryGroups: Record<ReportCategory, Report[]> = {} as any;
    
    nearbyReports.forEach(report => {
      if (!categoryGroups[report.category]) {
        categoryGroups[report.category] = [];
      }
      categoryGroups[report.category].push(report);
    });

    // Create summary items
    const items: SummaryItem[] = Object.entries(categoryGroups)
      .map(([category, categoryReports]) => {
        // Sort by recency and proximity
        const sortedReports = categoryReports.sort((a, b) => {
          const aDistance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            a.location.latitude,
            a.location.longitude
          );
          const bDistance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            b.location.latitude,
            b.location.longitude
          );
          
          // Prioritize recent reports (within 3 hours)
          const threeHoursAgo = Date.now() - 10800000;
          const aIsRecent = a.timestamp > threeHoursAgo;
          const bIsRecent = b.timestamp > threeHoursAgo;
          
          if (aIsRecent && !bIsRecent) return -1;
          if (!aIsRecent && bIsRecent) return 1;
          
          // Then by distance
          return aDistance - bDistance;
        });

        const latestReport = sortedReports[0];
        const distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          latestReport.location.latitude,
          latestReport.location.longitude
        );

        const config = CATEGORY_CONFIG[category as ReportCategory];
        const IconComponent = config.icon;

        return {
          category: category as ReportCategory,
          icon: <IconComponent size={16} color={config.color} />,
          emoji: config.emoji,
          count: categoryReports.length,
          latestReport,
          distance
        };
      })
      .sort((a, b) => {
        // Sort by priority: recent first, then by distance
        const threeHoursAgo = Date.now() - 10800000;
        const aIsRecent = a.latestReport.timestamp > threeHoursAgo;
        const bIsRecent = b.latestReport.timestamp > threeHoursAgo;
        
        if (aIsRecent && !bIsRecent) return -1;
        if (!aIsRecent && bIsRecent) return 1;
        
        return a.distance - b.distance;
      })
      .slice(0, 3); // Show top 3 categories

    setSummaryItems(items);
    setIsVisible(items.length > 0);
  }, [reports, userLocation]);

  // Auto-show and auto-dismiss animation
  useEffect(() => {
    if (isVisible && !isExpanded) {
      // Show animation
      translateY.value = withSequence(
        withTiming(-100, { duration: 0 }),
        withDelay(
          300,
          withTiming(0, { 
            duration: 600, 
            easing: Easing.out(Easing.back(1.2)) 
          })
        )
      );
      
      opacity.value = withDelay(
        300,
        withTiming(1, { duration: 400 })
      );
      
      scale.value = withSequence(
        withTiming(0.8, { duration: 0 }),
        withDelay(
          300,
          withTiming(1, { 
            duration: 500, 
            easing: Easing.out(Easing.back(1.1)) 
          })
        )
      );

      // Auto-dismiss after 4 seconds
      const dismissTimer = setTimeout(() => {
        if (!isExpanded) {
          hideBubble();
        }
      }, 4000);

      return () => clearTimeout(dismissTimer);
    }
  }, [isVisible, isExpanded]);

  const hideBubble = () => {
    translateY.value = withTiming(-100, { duration: 400 });
    opacity.value = withTiming(0, { duration: 300 });
    scale.value = withTiming(0.8, { duration: 400 });
    
    setTimeout(() => {
      runOnJS(setIsVisible)(false);
    }, 400);
  };

  const handlePress = () => {
    if (isExpanded) {
      // Collapse
      expandHeight.value = withTiming(0, { duration: 300 });
      setIsExpanded(false);
    } else {
      // Expand
      setIsExpanded(true);
      expandHeight.value = withTiming(200, { duration: 400, easing: Easing.out(Easing.quad) });
      onExpand?.();
    }
  };

  const handleReportPress = (report: Report) => {
    onReportSelect?.(report);
    hideBubble();
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: translateY.value },
        { scale: scale.value }
      ],
      opacity: opacity.value,
    };
  });

  const expandedStyle = useAnimatedStyle(() => {
    return {
      height: expandHeight.value,
      opacity: expandHeight.value > 0 ? 1 : 0,
    };
  });

  if (!isVisible || summaryItems.length === 0) {
    return null;
  }

  const totalReports = summaryItems.reduce((sum, item) => sum + item.count, 0);

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <TouchableOpacity 
        style={styles.bubble}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        <View style={styles.summaryContent}>
          <MapPin size={14} color="#667eea" />
          <Text style={styles.summaryText} numberOfLines={1}>
            {summaryItems[0].emoji} {getSummaryText(summaryItems[0])}
            {totalReports > 1 && ` +${totalReports - 1} more`}
          </Text>
        </View>
      </TouchableOpacity>
      
      {/* Expanded content */}
      <Animated.View style={[styles.expandedContent, expandedStyle]}>
        <View style={styles.expandedList}>
          {summaryItems.map((item) => (
            <TouchableOpacity
              key={item.category}
              style={styles.expandedItem}
              onPress={() => handleReportPress(item.latestReport)}
              activeOpacity={0.7}
            >
              <View style={styles.expandedItemHeader}>
                <View style={styles.expandedIconContainer}>
                  {item.icon}
                </View>
                <View style={styles.expandedTextContainer}>
                  <Text style={styles.expandedTitle} numberOfLines={1}>
                    {item.latestReport.title}
                  </Text>
                  <Text style={styles.expandedMeta}>
                    {formatDistanceToNow(item.latestReport.timestamp)} • {(item.distance * 1000).toFixed(0)}m away
                  </Text>
                </View>
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>{item.count}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
    </Animated.View>
  );
}

function getSummaryText(item: SummaryItem): string {
  const { category, latestReport, distance } = item;
  const distanceText = distance < 0.1 ? 'here' : `${(distance * 1000).toFixed(0)}m away`;
  
  switch (category) {
    case 'light':
      return `Light outage ${distanceText}`;
    case 'water':
      return `Water issue ${distanceText}`;
    case 'fuel':
      return latestReport.metadata?.availability 
        ? `Fuel available ${distanceText}`
        : `Fuel shortage ${distanceText}`;
    case 'price':
      return `Price change ${distanceText}`;
    case 'traffic':
      return `Traffic jam ${distanceText}`;
    case 'infrastructure':
      return `Road issue ${distanceText}`;
    case 'environment':
      return `Environmental issue ${distanceText}`;
    case 'safety':
      return `Safety concern ${distanceText}`;
    default:
      return `Issue ${distanceText}`;
  }
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 120,
    left: 16,
    right: 16,
    zIndex: 20,
    alignItems: 'center',
  },
  bubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 12,
    padding: 12,
    minWidth: Dimensions.get('window').width - 32,
    maxWidth: Dimensions.get('window').width - 32,
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  summaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryText: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: '#2d3748',
    flex: 1,
    letterSpacing: '0.1px',
  },
  expandedContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    marginTop: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: 'rgba(102, 126, 234, 0.2)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  expandedList: {
    padding: 12,
  },
  expandedItem: {
    marginBottom: 12,
  },
  expandedItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expandedIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  expandedTextContainer: {
    flex: 1,
  },
  expandedTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#2d3748',
    marginBottom: 2,
  },
  expandedMeta: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: '#718096',
  },
  countBadge: {
    backgroundColor: '#667eea',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  countText: {
    fontFamily: 'Inter-Bold',
    fontSize: 11,
    color: 'white',
    lineHeight: 14,
  },
});