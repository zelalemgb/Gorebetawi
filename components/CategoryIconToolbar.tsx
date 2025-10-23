import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withSequence,
  withTiming,
  interpolate
} from 'react-native-reanimated';
import { 
  Lightbulb, 
  Droplet, 
  Fuel, 
  DollarSign, 
  Car, 
  HardHat, 
  Leaf, 
  TriangleAlert as AlertTriangle 
} from 'lucide-react-native';
import { LightTheme } from '@/constants/Colors';
import { Report, ReportCategory } from '@/types';

interface CategoryIconToolbarProps {
  reports: Report[];
  selectedCategories: ReportCategory[];
  onToggleCategory: (category: ReportCategory) => void;
  userLocation?: {
    latitude: number;
    longitude: number;
  } | null;
}

const CATEGORY_CONFIG = [
  {
    key: 'light' as ReportCategory,
    icon: Lightbulb,
    color: '#FDD835',
    label: 'Light'
  },
  {
    key: 'water' as ReportCategory,
    icon: Droplet,
    color: '#2196F3',
    label: 'Water'
  },
  {
    key: 'fuel' as ReportCategory,
    icon: Fuel,
    color: '#43A047',
    label: 'Fuel'
  },
  {
    key: 'price' as ReportCategory,
    icon: DollarSign,
    color: '#FF9800',
    label: 'Price'
  },
  {
    key: 'traffic' as ReportCategory,
    icon: Car,
    color: '#F44336',
    label: 'Traffic'
  },
  {
    key: 'infrastructure' as ReportCategory,
    icon: HardHat,
    color: '#9E9E9E',
    label: 'Roads'
  },
  {
    key: 'environment' as ReportCategory,
    icon: Leaf,
    color: '#4CAF50',
    label: 'Environment'
  },
  {
    key: 'safety' as ReportCategory,
    icon: AlertTriangle,
    color: '#E53935',
    label: 'Safety'
  }
];

const NEARBY_RADIUS_KM = 1; // 1km radius

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function CategoryIconToolbar({
  reports,
  selectedCategories,
  onToggleCategory,
  userLocation
}: CategoryIconToolbarProps) {
  
  // Calculate distance between two coordinates
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

  // Analyze nearby reports for each category
  const categoryAnalysis = useMemo(() => {
    if (!userLocation) {
      return CATEGORY_CONFIG.map(config => ({
        ...config,
        hasNearby: false,
        hasRecent: false,
        count: 0,
        closestDistance: Infinity
      }));
    }

    return CATEGORY_CONFIG.map(config => {
      const categoryReports = reports.filter(report => report.category === config.key);
      
      // Filter nearby reports
      const nearbyReports = categoryReports.filter(report => {
        const distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          report.location.latitude,
          report.location.longitude
        );
        return distance <= NEARBY_RADIUS_KM;
      });

      // Check for recent reports (within 3 hours)
      const threeHoursAgo = Date.now() - 10800000;
      const hasRecent = nearbyReports.some(report => report.timestamp > threeHoursAgo);

      // Find closest distance
      const closestDistance = nearbyReports.length > 0 
        ? Math.min(...nearbyReports.map(report => 
            calculateDistance(
              userLocation.latitude,
              userLocation.longitude,
              report.location.latitude,
              report.location.longitude
            )
          ))
        : Infinity;

      return {
        ...config,
        hasNearby: nearbyReports.length > 0,
        hasRecent,
        count: nearbyReports.length,
        closestDistance
      };
    });
  }, [reports, userLocation]);

  const CategoryIcon = ({ category }: { category: typeof categoryAnalysis[0] }) => {
    const isSelected = selectedCategories.includes(category.key);
    const IconComponent = category.icon;
    
    // Animation values
    const scale = useSharedValue(1);
    const glowOpacity = useSharedValue(0);
    const pulseScale = useSharedValue(1);
    
    // Trigger animations based on state
    React.useEffect(() => {
      if (category.hasRecent) {
        // Glow animation for recent reports
        glowOpacity.value = withSequence(
          withTiming(0.6, { duration: 800 }),
          withTiming(0.2, { duration: 1200 }),
          withTiming(0.6, { duration: 800 })
        );
        
        // Subtle pulse for recent activity
        pulseScale.value = withSequence(
          withSpring(1.05, { damping: 10, stiffness: 300 }),
          withSpring(1, { damping: 10, stiffness: 300 })
        );
      } else if (category.hasNearby) {
        // Gentle glow for nearby reports
        glowOpacity.value = withTiming(0.3, { duration: 600 });
      } else {
        // No glow for categories without nearby reports
        glowOpacity.value = withTiming(0, { duration: 400 });
      }
    }, [category.hasRecent, category.hasNearby]);

    const handlePress = () => {
      // Press animation
      scale.value = withSequence(
        withSpring(0.9, { damping: 10, stiffness: 300 }),
        withSpring(1, { damping: 10, stiffness: 300 })
      );
      
      onToggleCategory(category.key);
    };

    const animatedStyle = useAnimatedStyle(() => {
      return {
        transform: [
          { scale: scale.value * pulseScale.value }
        ],
      };
    });

    const glowStyle = useAnimatedStyle(() => {
      return {
        opacity: glowOpacity.value,
        transform: [
          { scale: interpolate(glowOpacity.value, [0, 0.6], [1, 1.2]) }
        ],
      };
    });

    const containerStyle = useAnimatedStyle(() => {
      return {
        opacity: category.hasNearby ? 1 : 0.4,
      };
    });

    return (
      <Animated.View style={[styles.iconContainer, containerStyle]}>
        <AnimatedTouchableOpacity
          style={[
            styles.iconButton,
            isSelected && {
              backgroundColor: category.color,
            },
            animatedStyle
          ]}
          onPress={handlePress}
          activeOpacity={0.7}
        >
          <IconComponent
            size={18}
            color={isSelected ? 'white' : category.color}
            strokeWidth={2}
          />

          {/* Count badge for nearby reports - only if more than 1 */}
          {category.count > 1 && (
            <View style={[
              styles.countBadge,
              { backgroundColor: category.color }
            ]}>
              <Text style={styles.countText}>{category.count}</Text>
            </View>
          )}
        </AnimatedTouchableOpacity>
      </Animated.View>
    );
  };

  // Only show categories that have nearby reports
  const activeCategoryAnalysis = categoryAnalysis.filter(c => c.hasNearby);

  if (activeCategoryAnalysis.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <View style={styles.iconRow}>
          {activeCategoryAnalysis.map((category) => (
            <CategoryIcon key={category.key} category={category} />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 90,
    left: 0,
    right: 0,
    zIndex: 15,
    alignItems: 'center',
  },
  toolbar: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    maxWidth: '95%',
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(248, 250, 252, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  countBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'white',
    shadowColor: 'rgba(0, 0, 0, 0.15)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  countText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
  },
});