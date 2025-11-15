import React, { useState, useEffect, useRef } from 'react';
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
import { TrendingUp, Users, Clock, MapPin, X, LightbulbOff, Droplet, Fuel, DollarSign, Car, HardHat, Leaf, TriangleAlert as AlertTriangle } from 'lucide-react-native';
import { LightTheme } from '@/constants/Colors';
import { Report, ReportCategory } from '@/types';
import { formatDistanceToNow } from '@/utils/dateUtils';

interface TrendInsightBubbleProps {
  reports: Report[];
  userLocation: {
    latitude: number;
    longitude: number;
  } | null;
  isMapIdle: boolean;
  onHighlightReports?: (reports: Report[]) => void;
  onDismiss?: () => void;
}

interface TrendPattern {
  category: ReportCategory;
  reports: Report[];
  type: 'cluster' | 'frequency' | 'confirmation' | 'price_trend';
  message: string;
  emoji: string;
  severity: 'low' | 'medium' | 'high';
  confidence: number;
}

const CATEGORY_CONFIG = {
  light: { icon: LightbulbOff, emoji: '💡', color: '#FDD835' },
  water: { icon: Droplet, emoji: '💧', color: '#2196F3' },
  fuel: { icon: Fuel, emoji: '⛽', color: '#43A047' },
  price: { icon: DollarSign, emoji: '📈', color: '#FF9800' },
  traffic: { icon: Car, emoji: '🚦', color: '#F44336' },
  infrastructure: { icon: HardHat, emoji: '🚧', color: '#9E9E9E' },
  environment: { icon: Leaf, emoji: '🌿', color: '#4CAF50' },
  safety: { icon: AlertTriangle, emoji: '⚠️', color: '#E53935' }
};

const ANALYSIS_DELAY = 12000; // 12 seconds of idle time
const DISPLAY_DURATION = 7000; // 7 seconds display time
const NEARBY_RADIUS_KM = 2; // 2km radius for trend analysis

export default function TrendInsightBubble({
  reports,
  userLocation,
  isMapIdle,
  onHighlightReports,
  onDismiss
}: TrendInsightBubbleProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentTrend, setCurrentTrend] = useState<TrendPattern | null>(null);
  const [hasShownTrend, setHasShownTrend] = useState(false);
  
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);
  
  const analysisTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dismissTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Analyze patterns in nearby reports
  const analyzePatterns = (): TrendPattern | null => {
    if (!userLocation || reports.length === 0) return null;

    // Filter nearby reports
    const nearbyReports = reports.filter(report => {
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        report.location.latitude,
        report.location.longitude
      );
      return distance <= NEARBY_RADIUS_KM;
    });

    if (nearbyReports.length < 3) return null;

    // Group by category
    const categoryGroups: Record<ReportCategory, Report[]> = {} as any;
    nearbyReports.forEach(report => {
      if (!categoryGroups[report.category]) {
        categoryGroups[report.category] = [];
      }
      categoryGroups[report.category].push(report);
    });

    // Analyze different pattern types
    const patterns: TrendPattern[] = [];

    // 1. Cluster Pattern - Multiple reports of same type
    Object.entries(categoryGroups).forEach(([category, categoryReports]) => {
      if (categoryReports.length >= 3) {
        const recentCount = categoryReports.filter(r => 
          Date.now() - r.timestamp < 21600000 // 6 hours
        ).length;
        
        if (recentCount >= 2) {
          patterns.push({
            category: category as ReportCategory,
            reports: categoryReports,
            type: 'cluster',
            message: getClusterMessage(category as ReportCategory, categoryReports.length),
            emoji: CATEGORY_CONFIG[category as ReportCategory].emoji,
            severity: categoryReports.length >= 5 ? 'high' : 'medium',
            confidence: Math.min(0.9, 0.5 + (categoryReports.length * 0.1))
          });
        }
      }
    });

    // 2. High Confirmation Pattern - Well-verified reports
    Object.entries(categoryGroups).forEach(([category, categoryReports]) => {
      const highlyConfirmed = categoryReports.filter(r => r.confirmations >= 5);
      if (highlyConfirmed.length >= 2) {
        const totalConfirmations = highlyConfirmed.reduce((sum, r) => sum + r.confirmations, 0);
        
        patterns.push({
          category: category as ReportCategory,
          reports: highlyConfirmed,
          type: 'confirmation',
          message: getConfirmationMessage(category as ReportCategory, totalConfirmations),
          emoji: '✅',
          severity: 'high',
          confidence: 0.85
        });
      }
    });

    // 3. Price Trend Pattern - Multiple price reports
    if (categoryGroups.price && categoryGroups.price.length >= 2) {
      const priceReports = categoryGroups.price.filter(r => r.metadata?.priceDetails);
      if (priceReports.length >= 2) {
        patterns.push({
          category: 'price',
          reports: priceReports,
          type: 'price_trend',
          message: getPriceTrendMessage(priceReports),
          emoji: '💰',
          severity: 'medium',
          confidence: 0.7
        });
      }
    }

    // 4. Frequency Pattern - Recent activity spike
    const recentReports = nearbyReports.filter(r => 
      Date.now() - r.timestamp < 10800000 // 3 hours
    );
    
    if (recentReports.length >= 4) {
      const dominantCategory = Object.entries(
        recentReports.reduce((acc, report) => {
          acc[report.category] = (acc[report.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      ).sort(([,a], [,b]) => b - a)[0];

      if (dominantCategory && dominantCategory[1] >= 2) {
        patterns.push({
          category: dominantCategory[0] as ReportCategory,
          reports: recentReports.filter(r => r.category === dominantCategory[0]),
          type: 'frequency',
          message: getFrequencyMessage(dominantCategory[0] as ReportCategory, dominantCategory[1]),
          emoji: '🔥',
          severity: 'high',
          confidence: 0.8
        });
      }
    }

    // Return highest confidence pattern
    return patterns.length > 0 
      ? patterns.sort((a, b) => b.confidence - a.confidence)[0]
      : null;
  };

  // Generate cluster messages
  const getClusterMessage = (category: ReportCategory, count: number): string => {
    const messages = {
      light: `${count} people reported power outages in your area`,
      water: `${count} water shortage reports confirmed nearby`,
      fuel: `${count} fuel stations reporting availability changes`,
      price: `${count} price changes reported by neighbors`,
      traffic: `${count} traffic incidents causing delays nearby`,
      infrastructure: `${count} road issues reported in your area`,
      environment: `${count} environmental concerns raised nearby`,
      safety: `${count} safety issues reported by community`
    };
    return messages[category] || `${count} ${category} reports in your area`;
  };

  // Generate confirmation messages
  const getConfirmationMessage = (category: ReportCategory, totalConfirmations: number): string => {
    const messages = {
      light: `${totalConfirmations} people confirmed power outages nearby`,
      water: `${totalConfirmations} neighbors verified water shortages`,
      fuel: `${totalConfirmations} confirmations on fuel availability`,
      price: `${totalConfirmations} people confirmed price changes`,
      traffic: `${totalConfirmations} drivers confirmed traffic issues`,
      infrastructure: `${totalConfirmations} people verified road problems`,
      environment: `${totalConfirmations} residents confirmed environmental issues`,
      safety: `${totalConfirmations} people verified safety concerns`
    };
    return messages[category] || `${totalConfirmations} people confirmed ${category} issues`;
  };

  // Generate price trend messages
  const getPriceTrendMessage = (priceReports: Report[]): string => {
    const items = priceReports
      .map(r => r.metadata?.priceDetails?.itemName)
      .filter(Boolean);
    
    const uniqueItems = [...new Set(items)];
    
    if (uniqueItems.length === 1) {
      return `Multiple ${uniqueItems[0]} price changes reported nearby`;
    } else {
      return `${uniqueItems.length} different items showing price changes`;
    }
  };

  // Generate frequency messages
  const getFrequencyMessage = (category: ReportCategory, count: number): string => {
    const messages = {
      light: `Spike in power outage reports - ${count} in last 3 hours`,
      water: `Water shortage reports increasing - ${count} recent reports`,
      fuel: `High fuel station activity - ${count} updates today`,
      price: `Price volatility detected - ${count} changes reported`,
      traffic: `Traffic congestion pattern - ${count} incidents today`,
      infrastructure: `Infrastructure issues trending - ${count} reports`,
      environment: `Environmental concerns rising - ${count} new reports`,
      safety: `Safety alerts increasing - ${count} recent reports`
    };
    return messages[category] || `${count} recent ${category} reports detected`;
  };

  // Handle idle state changes
  useEffect(() => {
    if (isMapIdle && !hasShownTrend && userLocation) {
      // Clear any existing timeout
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }

      // Start analysis after delay
      analysisTimeoutRef.current = setTimeout(() => {
        const pattern = analyzePatterns();
        if (pattern) {
          setCurrentTrend(pattern);
          setIsVisible(true);
          setHasShownTrend(true);
        }
      }, ANALYSIS_DELAY);
    } else if (!isMapIdle) {
      // Clear timeout if user becomes active
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
        analysisTimeoutRef.current = null;
      }
    }

    return () => {
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
    };
  }, [isMapIdle, hasShownTrend, userLocation, reports]);

  // Show animation when visible
  useEffect(() => {
    if (isVisible && currentTrend) {
      // Show animation
      translateY.value = withSequence(
        withTiming(-100, { duration: 0 }),
        withDelay(
          200,
          withTiming(0, { 
            duration: 800, 
            easing: Easing.out(Easing.back(1.1)) 
          })
        )
      );
      
      opacity.value = withDelay(
        200,
        withTiming(1, { duration: 600 })
      );
      
      scale.value = withSequence(
        withTiming(0.8, { duration: 0 }),
        withDelay(
          200,
          withTiming(1, { 
            duration: 700, 
            easing: Easing.out(Easing.back(1.05)) 
          })
        )
      );

      // Auto-dismiss after display duration
      dismissTimeoutRef.current = setTimeout(() => {
        hideBubble();
      }, DISPLAY_DURATION);
    }

    return () => {
      if (dismissTimeoutRef.current) {
        clearTimeout(dismissTimeoutRef.current);
      }
    };
  }, [isVisible, currentTrend]);

  const hideBubble = () => {
    translateY.value = withTiming(-100, { duration: 500 });
    opacity.value = withTiming(0, { duration: 400 });
    scale.value = withTiming(0.8, { duration: 500 });
    
    setTimeout(() => {
      runOnJS(setIsVisible)(false);
      runOnJS(setCurrentTrend)(null);
    }, 500);
  };

  const handlePress = () => {
    if (currentTrend && onHighlightReports) {
      onHighlightReports(currentTrend.reports);
    }
    hideBubble();
  };

  const handleDismiss = () => {
    onDismiss?.();
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

  if (!isVisible || !currentTrend) {
    return null;
  }

  const config = CATEGORY_CONFIG[currentTrend.category];
  const IconComponent = config.icon;

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <TouchableOpacity 
        style={[
          styles.bubble,
          { borderLeftColor: config.color }
        ]}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <View style={[
              styles.iconContainer,
              { backgroundColor: `${config.color}20` }
            ]}>
              <IconComponent size={18} color={config.color} />
            </View>
            <View style={styles.titleTextContainer}>
              <Text style={styles.trendLabel}>Community Insight</Text>
              <View style={styles.metaContainer}>
                <TrendingUp size={12} color="#667eea" />
                <Text style={styles.metaText}>Pattern detected</Text>
              </View>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.dismissButton}
            onPress={handleDismiss}
          >
            <X size={16} color="#718096" />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.message}>
          {currentTrend.emoji} {currentTrend.message}
        </Text>
        
        <View style={styles.footer}>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Users size={12} color="#718096" />
              <Text style={styles.statText}>
                {currentTrend.reports.length} report{currentTrend.reports.length !== 1 ? 's' : ''}
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <MapPin size={12} color="#718096" />
              <Text style={styles.statText}>
                Within {NEARBY_RADIUS_KM}km
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Clock size={12} color="#718096" />
              <Text style={styles.statText}>
                {formatDistanceToNow(Math.max(...currentTrend.reports.map(r => r.timestamp)))}
              </Text>
            </View>
          </View>
          
          <View style={[
            styles.confidenceBadge,
            { 
              backgroundColor: currentTrend.confidence > 0.8 ? '#48bb78' : 
                             currentTrend.confidence > 0.6 ? '#ed8936' : '#667eea'
            }
          ]}>
            <Text style={styles.confidenceText}>
              {Math.round(currentTrend.confidence * 100)}% confidence
            </Text>
          </View>
        </View>
        
        <View style={styles.actionHint}>
          <Text style={styles.hintText}>Tap to highlight related reports</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 140,
    left: 16,
    right: 16,
    zIndex: 25,
    alignItems: 'center',
  },
  bubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: 16,
    padding: 18,
    minWidth: Dimensions.get('window').width - 32,
    maxWidth: Dimensions.get('window').width - 32,
    shadowColor: 'rgba(102, 126, 234, 0.25)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderLeftWidth: 4,
    backdropFilter: 'blur(12px)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  titleTextContainer: {
    flex: 1,
  },
  trendLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    color: '#2d3748',
    marginBottom: 2,
    letterSpacing: '0.2px',
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    color: '#667eea',
    marginLeft: 4,
    letterSpacing: '0.3px',
  },
  dismissButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(113, 128, 150, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#2d3748',
    lineHeight: 22,
    marginBottom: 16,
    letterSpacing: '0.1px',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#718096',
    marginLeft: 4,
    letterSpacing: '0.2px',
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    color: 'white',
    letterSpacing: '0.3px',
  },
  actionHint: {
    alignItems: 'center',
  },
  hintText: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: '#a0aec0',
    fontStyle: 'italic',
    letterSpacing: '0.1px',
  },
});