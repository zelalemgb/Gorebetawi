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
        <Droplet size={20} color={LightTheme.white} strokeWidth={2.5} />
        <Text style={styles.buttonText}>Water Out</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 88,
    right: 96,
    shadowColor: 'rgba(33, 150, 243, 0.5)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 28,
    backgroundColor: '#2196F3',
    gap: 8,
  },
  buttonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    color: LightTheme.white,
  },
});
