import React from 'react';
import { StyleSheet, TouchableOpacity, Text, ViewStyle } from 'react-native';
import { Droplet } from 'lucide-react-native';
import { LightTheme } from '@/constants/Colors';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay
} from 'react-native-reanimated';

interface QuickWaterReportButtonProps {
  onPress: () => void;
  style?: ViewStyle;
}

export default function QuickWaterReportButton({ onPress, style }: QuickWaterReportButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(0.95, { damping: 10, stiffness: 300 }),
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
        activeOpacity={0.9}
      >
        <Droplet size={18} color={LightTheme.white} strokeWidth={2.5} />
        <Text style={styles.buttonText}>Water</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    right: 196,
    shadowColor: 'rgba(33, 150, 243, 0.5)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#2196F3',
    gap: 6,
  },
  buttonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: LightTheme.white,
  },
});
