import React, { useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  withSpring,
  runOnJS
} from 'react-native-reanimated';
import { Plus, MapPin } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';

interface BottomSlidePromptProps {
  visible: boolean;
  message: string;
  onCreateReport: () => void;
  onDismiss: () => void;
}

export default function BottomSlidePrompt({ 
  visible, 
  message, 
  onCreateReport,
  onDismiss 
}: BottomSlidePromptProps) {
  const translateY = useSharedValue(100);
  const opacity = useSharedValue(0);
  
  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 300 });
      translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
      
      // Auto dismiss after 8 seconds
      const timer = setTimeout(() => {
        opacity.value = withTiming(0, { duration: 300 });
        translateY.value = withTiming(100, { duration: 400 });
        setTimeout(() => runOnJS(onDismiss)(), 400);
      }, 8000);
      
      return () => clearTimeout(timer);
    } else {
      opacity.value = withTiming(0, { duration: 300 });
      translateY.value = withTiming(100, { duration: 400 });
    }
  }, [visible]);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: translateY.value }],
    };
  });
  
  if (!visible) return null;
  
  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <MapPin size={20} color={Colors.accent} />
        </View>
        
        <View style={styles.textContainer}>
          <Text style={styles.message}>{message}</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={onCreateReport}
          activeOpacity={0.8}
        >
          <Plus size={18} color="white" strokeWidth={2.5} />
          <Text style={styles.actionText}>Report</Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity 
        style={styles.dismissButton}
        onPress={onDismiss}
        activeOpacity={0.6}
      >
        <Text style={styles.dismissText}>×</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    zIndex: 25,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
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
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${Colors.accent}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  message: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
    lineHeight: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginLeft: 12,
  },
  actionText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  dismissButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.neutralDark,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  dismissText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 20,
  },
});