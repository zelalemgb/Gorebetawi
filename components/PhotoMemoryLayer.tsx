import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Image, TouchableOpacity } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  withDelay,
  withSequence
} from 'react-native-reanimated';
import { Camera } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { Report } from '@/types';

interface PhotoMemory {
  id: string;
  imageUrl: string;
  location: { latitude: number; longitude: number };
  timestamp: number;
  report: Report;
}

interface PhotoMemoryLayerProps {
  reports: Report[];
  zoom: number;
  visible: boolean;
  onPhotoPress: (report: Report) => void;
}

export default function PhotoMemoryLayer({ 
  reports, 
  zoom,
  visible,
  onPhotoPress 
}: PhotoMemoryLayerProps) {
  const [photoMemories, setPhotoMemories] = useState<PhotoMemory[]>([]);
  const opacity = useSharedValue(0);
  
  useEffect(() => {
    if (!visible || zoom < 15) {
      setPhotoMemories([]);
      return;
    }
    
    // Filter reports with images from the last 7 days
    const now = Date.now();
    const weekAgo = now - 604800000; // 7 days
    
    const reportsWithPhotos = reports.filter(report => 
      report.imageUrl && 
      report.timestamp > weekAgo
    );
    
    const memories: PhotoMemory[] = reportsWithPhotos.map(report => ({
      id: report.id,
      imageUrl: report.imageUrl!,
      location: report.location,
      timestamp: report.timestamp,
      report,
    }));
    
    setPhotoMemories(memories.slice(0, 20)); // Limit to 20 photos
  }, [reports, zoom, visible]);
  
  useEffect(() => {
    if (visible && photoMemories.length > 0 && zoom >= 15) {
      opacity.value = withDelay(300, withTiming(0.8, { duration: 600 }));
    } else {
      opacity.value = withTiming(0, { duration: 400 });
    }
  }, [visible, photoMemories.length, zoom]);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });
  
  if (!visible || zoom < 15 || photoMemories.length === 0) {
    return null;
  }
  
  return (
    <Animated.View style={[styles.container, animatedStyle]} pointerEvents="box-none">
      {photoMemories.map((memory, index) => (
        <PhotoThumbnail 
          key={memory.id} 
          memory={memory} 
          index={index}
          onPress={() => onPhotoPress(memory.report)}
        />
      ))}
    </Animated.View>
  );
}

function PhotoThumbnail({ 
  memory, 
  index, 
  onPress 
}: { 
  memory: PhotoMemory; 
  index: number; 
  onPress: () => void; 
}) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  
  useEffect(() => {
    scale.value = withDelay(
      index * 150,
      withSequence(
        withTiming(1.2, { duration: 200 }),
        withTiming(1, { duration: 200 })
      )
    );
    opacity.value = withDelay(
      index * 150,
      withTiming(1, { duration: 300 })
    );
  }, [index]);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });
  
  // Convert lat/lng to screen position (simplified)
  // In a real app, this would use proper map projection
  const x = (memory.location.longitude - 38.7) * 8000 + 200;
  const y = (9.1 - memory.location.latitude) * 8000 + 200;
  
  // Calculate age-based opacity
  const now = Date.now();
  const age = now - memory.timestamp;
  const maxAge = 604800000; // 7 days
  const ageOpacity = Math.max(0.3, 1 - (age / maxAge) * 0.7);
  
  return (
    <Animated.View 
      style={[
        styles.photoContainer,
        {
          left: Math.max(0, Math.min(x, 300)), // Keep within bounds
          top: Math.max(0, Math.min(y, 600)),
          opacity: ageOpacity,
        },
        animatedStyle
      ]}
    >
      <TouchableOpacity 
        style={styles.photoThumbnail}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Image 
          source={{ uri: memory.imageUrl }} 
          style={styles.photo}
          resizeMode="cover"
        />
        <View style={styles.photoOverlay}>
          <Camera size={12} color="white" />
        </View>
        
        {/* Freshness indicator */}
        {age < 86400000 && ( // Less than 24 hours
          <View style={styles.freshIndicator}>
            <View style={styles.freshDot} />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 4,
  },
  photoContainer: {
    position: 'absolute',
    width: 40,
    height: 40,
  },
  photoThumbnail: {
    width: 36,
    height: 36,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 2,
    borderColor: 'white',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  freshIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  freshDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
});