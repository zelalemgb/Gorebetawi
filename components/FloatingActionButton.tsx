import React from 'react';
import { StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Plus } from 'lucide-react-native';
import { LightTheme } from '@/constants/Colors';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withSequence, 
  withDelay 
} from 'react-native-reanimated';

interface FloatingActionButtonProps {
  onPress: () => void;
  style?: ViewStyle;
}

export default function FloatingActionButton({ onPress, style }: FloatingActionButtonProps) {
  const scale = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(0.9, { damping: 10, stiffness: 300 }),
      withDelay(
        100,
        withSpring(1, { damping: 10, stiffness: 300 })
      )
    );
    onPress();
  };

  return (
    <Animated.View style={[styles.container, animatedStyle, style]}>
      <TouchableOpacity
        style={styles.button}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <Plus size={24} color={LightTheme.white} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    shadowColor: LightTheme.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: LightTheme.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
});