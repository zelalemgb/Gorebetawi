import React, { useEffect } from 'react';
import { StyleSheet, View, Image, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin } from 'lucide-react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withDelay,
  withSequence,
  Easing 
} from 'react-native-reanimated';
import { LightTheme } from '@/constants/Colors';

export default function SplashScreen() {
  const router = useRouter();
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.9);
  const textOpacity = useSharedValue(0);

  useEffect(() => {
    // Animate logo
    opacity.value = withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) });
    scale.value = withSequence(
      withTiming(1.1, { duration: 600, easing: Easing.out(Easing.ease) }),
      withTiming(1, { duration: 400, easing: Easing.inOut(Easing.ease) })
    );
    
    // Animate text after logo
    textOpacity.value = withDelay(
      600, 
      withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) })
    );

    // Navigate to welcome screen after splash animation
    const timer = setTimeout(() => {
      router.replace('/welcome');
    }, 2500);
    
    return () => clearTimeout(timer);
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
    };
  });

  const textAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: textOpacity.value,
      transform: [
        { 
          translateY: withTiming(textOpacity.value * 0, { 
            duration: 800, 
            easing: Easing.out(Easing.ease) 
          })
        }
      ],
    };
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoContainer, animatedStyle]}>
        <MapPin size={64} color={LightTheme.accent} strokeWidth={2.5} />
      </Animated.View>
      
      <Animated.View style={[styles.textContainer, textAnimatedStyle]}>
        <Text style={styles.title}>Gorebet</Text>
        <Text style={styles.subtitle}>See. Share. Act.</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LightTheme.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    height: 100,
    borderRadius: 20,
    backgroundColor: 'rgba(63, 81, 181, 0.1)',
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 32,
    color: LightTheme.text,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: LightTheme.secondaryText,
  },
});