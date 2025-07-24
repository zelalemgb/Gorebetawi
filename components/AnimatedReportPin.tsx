import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  interpolate,
  Easing
} from 'react-native-reanimated';
import { Lightbulb, Droplet, Fuel, ShoppingCart, Car, Wrench, Leaf, MapPin, TriangleAlert as AlertTriangle } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { Report, ReportCategory } from '@/types';

interface AnimatedReportPinProps {
  report: Report;
  isSelected?: boolean;
  isHighlighted?: boolean;
}

const CATEGORY_CONFIG = {
  light: {
    icon: Lightbulb,
    color: '#FDD835',
    animation: 'pulse'
  },
  water: {
    icon: Droplet,
    color: '#2196F3',
    animation: 'ripple'
  },
  fuel: {
    icon: Fuel,
    color: '#43A047',
    animation: 'glow'
  },
  price: {
    icon: ShoppingCart,
    color: '#FF9800',
    animation: 'scale'
  },
  traffic: {
    icon: Car,
    color: '#F44336',
    animation: 'heavyPulse'
  },
  infrastructure: {
    icon: Wrench,
    color: '#9E9E9E',
    animation: 'static'
  },
  environment: {
    icon: Leaf,
    color: '#4CAF50',
    animation: 'fadeIn'
  },
  safety: {
    icon: AlertTriangle,
    color: '#E53935',
    animation: 'pulse'
  }
};

export default function AnimatedReportPin({
  report,
  isSelected = false,
  isHighlighted = false,
}: AnimatedReportPinProps) {
  const config = CATEGORY_CONFIG[report.category];
  const IconComponent = config.icon;
  
  // Animation values
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const rotation = useSharedValue(0);
  const glowScale = useSharedValue(1);
  const highlightScale = useSharedValue(1);
  
  // Determine if report is fresh (< 2 hours)
  const isFresh = Date.now() - report.timestamp < 7200000;
  
  // Determine if report is ongoing
  const isOngoing = report.metadata?.duration === 'ongoing' || 
                   (report.category === 'traffic' && report.metadata?.severity === 'heavy');
  
  // Determine if report is expired
  const isExpired = report.expiresAt ? Date.now() > report.expiresAt : false;

  useEffect(() => {
    // Fresh report animation - ping + drop-in + glow
    if (isFresh) {
      scale.value = withSequence(
        withTiming(0, { duration: 0 }),
        withTiming(1.3, { duration: 300, easing: Easing.out(Easing.back(1.7)) }),
        withTiming(1, { duration: 200 })
      );
      
      glowScale.value = withRepeat(
        withSequence(
          withTiming(1.5, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        3,
        false
      );
    }
    
    // Ongoing incident animations
    if (isOngoing && !isExpired) {
      switch (config.animation) {
        case 'pulse':
          scale.value = withRepeat(
            withSequence(
              withTiming(1.1, { duration: 1000 }),
              withTiming(1, { duration: 1000 })
            ),
            -1,
            false
          );
          break;
          
        case 'ripple':
          glowScale.value = withRepeat(
            withSequence(
              withTiming(1.8, { duration: 1500 }),
              withTiming(1, { duration: 500 })
            ),
            -1,
            false
          );
          break;
          
        case 'glow':
          opacity.value = withRepeat(
            withSequence(
              withTiming(0.7, { duration: 800 }),
              withTiming(1, { duration: 800 })
            ),
            -1,
            true
          );
          break;
          
        case 'heavyPulse':
          scale.value = withRepeat(
            withSequence(
              withTiming(1.2, { duration: 600 }),
              withTiming(1, { duration: 600 })
            ),
            -1,
            false
          );
          break;
      }
    }
    
    // Sponsored report animation - orbit
    if (report.isSponsored) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 4000, easing: Easing.linear }),
        -1,
        false
      );
    }
    
    // Expired report animation
    if (isExpired) {
      opacity.value = withTiming(0.3, { duration: 1000 });
      scale.value = withTiming(0.8, { duration: 1000 });
    }
    
    // Selected state
    if (isSelected) {
      scale.value = withTiming(1.3, { duration: 200 });
    } else if (!isFresh && !isOngoing) {
      scale.value = withTiming(1, { duration: 200 });
    }
    
    // Highlighted state for trend insights
    if (isHighlighted) {
      highlightScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        3, // Pulse 3 times
        false
      );
    } else {
      scale.value = withTiming(1, { duration: 200 });
    }
  }, [isFresh, isOngoing, isExpired, isSelected, isHighlighted, report.isSponsored]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value * highlightScale.value },
        { rotate: `${rotation.value}deg` }
      ],
      opacity: opacity.value,
    };
  });

  const glowStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: glowScale.value }],
      opacity: interpolate(glowScale.value, [1, 1.5], [0.3, 0]),
    };
  });

  const sponsoredHaloStyle = useAnimatedStyle(() => {
    if (!report.isSponsored) return { opacity: 0 };
    
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
      opacity: 0.6,
    };
  });

  return (
    <View style={styles.container}>
      {/* Highlight ring for trend insights */}
      {isHighlighted && (
        <Animated.View style={[styles.highlightRing, { borderColor: CATEGORY_CONFIG[report.category].color }]}>
          <View style={[styles.highlightInner, { borderColor: CATEGORY_CONFIG[report.category].color }]} />
        </Animated.View>
      )}
      
      {/* Sponsored halo */}
      {report.isSponsored && (
        <Animated.View style={[styles.sponsoredHalo, sponsoredHaloStyle]}>
          <View style={[styles.haloRing, { borderColor: Colors.accent }]} />
        </Animated.View>
      )}
      
      {/* Glow effect for ongoing incidents */}
      {(isOngoing || isFresh) && (
        <Animated.View 
          style={[
            styles.glow, 
            { backgroundColor: config.color },
            glowStyle
          ]} 
        />
      )}
      
      {/* Main pin */}
      <Animated.View style={[styles.pin, animatedStyle]}>
        <View style={[styles.pinBody, { backgroundColor: config.color }]}>
          <IconComponent 
            size={16} 
            color="white" 
            strokeWidth={2}
          />
        </View>
        
        {/* Confirmation badge */}
        {report.confirmations > 0 && (
          <View style={styles.confirmationBadge}>
            <Text style={styles.confirmationText}>
              {report.confirmations}
            </Text>
          </View>
        )}
        
        {/* Status indicators */}
        {report.status === 'confirmed' && (
          <View style={[styles.statusDot, { backgroundColor: Colors.success }]} />
        )}
        
        {isExpired && (
          <View style={[styles.statusDot, { backgroundColor: Colors.neutralDark }]} />
        )}
      </Animated.View>
      
      {/* Fresh report ping effect */}
      {isFresh && (
        <Animated.View style={[styles.pingRing, glowStyle]}>
          <View style={[styles.ping, { borderColor: config.color }]} />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pin: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 3,
  },
  pinBody: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 2,
    borderColor: 'white',
  },
  glow: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    zIndex: 1,
  },
  sponsoredHalo: {
    position: 'absolute',
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  haloRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  confirmationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.accent,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'white',
  },
  confirmationText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    lineHeight: 12,
  },
  statusDot: {
    position: 'absolute',
    bottom: -2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'white',
  },
  pingRing: {
    position: 'absolute',
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  ping: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
  },
  highlightRing: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderStyle: 'solid',
    zIndex: 2,
    top: -5,
    left: -5,
  },
  highlightInner: {
    position: 'absolute',
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderStyle: 'dashed',
    top: 2,
    left: 2,
    opacity: 0.6,
  },
});