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
        {/* Glow effect for active categories */}
        <Animated.View 
          style={[
            styles.glowRing,
            { backgroundColor: category.color },
            glowStyle
          ]} 
        />
        
        <AnimatedTouchableOpacity
          style={[
            styles.iconButton,
            isSelected && {
              backgroundColor: category.color,
              shadowColor: category.color,
            },
            animatedStyle
          ]}
          onPress={handlePress}
          activeOpacity={0.8}
        >
          <IconComponent 
            size={20} 
            color={isSelected ? 'white' : category.color}
            strokeWidth={2.5}
          />
          
          {/* Count badge for nearby reports */}
          {category.count > 0 && (
            <View style={[
              styles.countBadge,
              { backgroundColor: category.color }
            ]}>
              <Text style={styles.countText}>{category.count}</Text>
            </View>
          )}
          
          {/* Recent indicator dot */}
          {category.hasRecent && (
            <View style={[
              styles.recentDot,
              { backgroundColor: '#ff6b6b' }
            ]} />
          )}
        </AnimatedTouchableOpacity>
        
        {/* Category label */}
        <Text style={[
          styles.iconLabel,
          isSelected && { color: category.color, fontWeight: '600' }
        ]}>
          {category.label}
        </Text>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <View style={styles.iconRow}>
          {categoryAnalysis.map((category) => (
            <CategoryIcon key={category.key} category={category} />
          ))}
        </View>
        
        {/* Summary text */}
        {userLocation && (
          <Text style={styles.summaryText}>
            Tap icons to filter • {categoryAnalysis.filter(c => c.hasNearby).length} active nearby
          </Text>
        )}
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
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: 'rgba(102, 126, 234, 0.3)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backdropFilter: 'blur(12px)',
    maxWidth: '95%',
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    alignItems: 'center',
    position: 'relative',
    marginHorizontal: 4,
  },
  glowRing: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    top: -6,
    left: -6,
    zIndex: 1,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(248, 250, 252, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    zIndex: 2,
    shadowColor: 'rgba(102, 126, 234, 0.2)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.6)',
  },
  countBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
    zIndex: 3,
    shadowColor: 'rgba(102, 126, 234, 0.3)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  countText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 14,
    letterSpacing: '0.2px',
  },
  recentDot: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: 'white',
    zIndex: 4,
    shadowColor: 'rgba(255, 107, 107, 0.4)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  iconLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 10,
    color: '#64748b',
    marginTop: 4,
    letterSpacing: '0.2px',
  },
  summaryText: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    letterSpacing: '0.1px',
  },
});