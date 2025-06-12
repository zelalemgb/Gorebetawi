import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  withDelay,
  withSequence,
  interpolate
} from 'react-native-reanimated';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { Report } from '@/types';

interface StoryTile {
  id: string;
  position: { x: number; y: number };
  title: string;
  description: string;
  type: 'trend' | 'alert' | 'positive' | 'info';
  icon: React.ReactNode;
  color: string;
  reports: Report[];
}

interface NeighborhoodStoryTilesProps {
  reports: Report[];
  mapBounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  zoom: number;
  visible: boolean;
}

export default function NeighborhoodStoryTiles({ 
  reports, 
  mapBounds, 
  zoom,
  visible 
}: NeighborhoodStoryTilesProps) {
  const [storyTiles, setStoryTiles] = useState<StoryTile[]>([]);
  const opacity = useSharedValue(0);
  
  // Generate story tiles from reports
  useEffect(() => {
    if (!visible || zoom < 13) {
      setStoryTiles([]);
      return;
    }
    
    const tiles = generateStoryTiles(reports, mapBounds);
    setStoryTiles(tiles);
  }, [reports, mapBounds, zoom, visible]);
  
  // Animate visibility
  useEffect(() => {
    if (visible && storyTiles.length > 0 && zoom >= 13) {
      opacity.value = withDelay(500, withTiming(1, { duration: 800 }));
    } else {
      opacity.value = withTiming(0, { duration: 400 });
    }
  }, [visible, storyTiles.length, zoom]);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });
  
  if (!visible || zoom < 13 || storyTiles.length === 0) {
    return null;
  }
  
  return (
    <Animated.View style={[styles.container, animatedStyle]} pointerEvents="none">
      {storyTiles.map((tile, index) => (
        <StoryTileComponent 
          key={tile.id} 
          tile={tile} 
          index={index}
        />
      ))}
    </Animated.View>
  );
}

function StoryTileComponent({ tile, index }: { tile: StoryTile; index: number }) {
  const scale = useSharedValue(0);
  const translateY = useSharedValue(20);
  
  useEffect(() => {
    scale.value = withDelay(
      index * 200,
      withSequence(
        withTiming(1.1, { duration: 300 }),
        withTiming(1, { duration: 200 })
      )
    );
    translateY.value = withDelay(
      index * 200,
      withTiming(0, { duration: 400 })
    );
  }, [index]);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { translateY: translateY.value }
      ],
    };
  });
  
  return (
    <Animated.View 
      style={[
        styles.tile,
        {
          left: tile.position.x,
          top: tile.position.y,
          backgroundColor: `${tile.color}15`,
          borderLeftColor: tile.color,
        },
        animatedStyle
      ]}
    >
      <View style={styles.tileHeader}>
        <View style={[styles.iconContainer, { backgroundColor: `${tile.color}25` }]}>
          {tile.icon}
        </View>
        <Text style={styles.tileTitle} numberOfLines={1}>
          {tile.title}
        </Text>
      </View>
      <Text style={styles.tileDescription} numberOfLines={2}>
        {tile.description}
      </Text>
      <View style={styles.tileFooter}>
        <Text style={styles.reportCount}>
          {tile.reports.length} report{tile.reports.length !== 1 ? 's' : ''}
        </Text>
      </View>
    </Animated.View>
  );
}

function generateStoryTiles(reports: Report[], mapBounds: any): StoryTile[] {
  const tiles: StoryTile[] = [];
  const now = Date.now();
  
  // Group reports by area (simplified clustering)
  const areas = groupReportsByArea(reports, mapBounds);
  
  areas.forEach((areaReports, areaKey) => {
    if (areaReports.length < 2) return; // Only show areas with multiple reports
    
    const [x, y] = areaKey.split(',').map(Number);
    
    // Analyze area patterns
    const recentReports = areaReports.filter(r => now - r.timestamp < 86400000); // Last 24h
    const ongoingIssues = areaReports.filter(r => r.metadata?.duration === 'ongoing');
    const resolvedIssues = areaReports.filter(r => r.status === 'resolved');
    
    // Generate different types of story tiles
    if (ongoingIssues.length >= 2) {
      tiles.push({
        id: `ongoing-${areaKey}`,
        position: { x: x * 300 + 50, y: y * 200 + 100 },
        title: '⚠️ Ongoing Issues',
        description: `${ongoingIssues.length} persistent problems in this area`,
        type: 'alert',
        icon: <AlertTriangle size={16} color={Colors.danger} />,
        color: Colors.danger,
        reports: ongoingIssues
      });
    }
    
    if (resolvedIssues.length >= 3) {
      tiles.push({
        id: `positive-${areaKey}`,
        position: { x: x * 300 + 150, y: y * 200 + 80 },
        title: '👍 Community Action',
        description: `${resolvedIssues.length} issues resolved recently`,
        type: 'positive',
        icon: <CheckCircle size={16} color={Colors.success} />,
        color: Colors.success,
        reports: resolvedIssues
      });
    }
    
    // Price trend analysis
    const priceReports = areaReports.filter(r => r.category === 'price');
    if (priceReports.length >= 2) {
      const avgPrice = priceReports.reduce((sum, r) => 
        sum + (r.metadata?.priceDetails?.price || 0), 0) / priceReports.length;
      
      tiles.push({
        id: `price-${areaKey}`,
        position: { x: x * 300 + 100, y: y * 200 + 150 },
        title: '🛒 Price Activity',
        description: `Average price: ${avgPrice.toFixed(0)} birr`,
        type: 'info',
        icon: <TrendingUp size={16} color={Colors.price} />,
        color: Colors.price,
        reports: priceReports
      });
    }
    
    // Infrastructure cluster
    const infraReports = areaReports.filter(r => r.category === 'infrastructure');
    if (infraReports.length >= 3) {
      tiles.push({
        id: `infra-${areaKey}`,
        position: { x: x * 300 + 200, y: y * 200 + 120 },
        title: '🚧 Infrastructure',
        description: `${infraReports.length} road issues reported`,
        type: 'alert',
        icon: <AlertTriangle size={16} color={Colors.infrastructure} />,
        color: Colors.infrastructure,
        reports: infraReports
      });
    }
  });
  
  return tiles.slice(0, 6); // Limit to 6 tiles to avoid clutter
}

function groupReportsByArea(reports: Report[], mapBounds: any): Map<string, Report[]> {
  const areas = new Map<string, Report[]>();
  const gridSize = 0.01; // Roughly 1km grid
  
  reports.forEach(report => {
    const gridX = Math.floor(report.location.latitude / gridSize);
    const gridY = Math.floor(report.location.longitude / gridSize);
    const key = `${gridX},${gridY}`;
    
    if (!areas.has(key)) {
      areas.set(key, []);
    }
    areas.get(key)!.push(report);
  });
  
  return areas;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
    zIndex: 5,
  },
  tile: {
    position: 'absolute',
    width: 200,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    backdropFilter: 'blur(10px)',
  },
  tileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  tileTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  tileDescription: {
    fontSize: 12,
    color: Colors.secondaryText,
    lineHeight: 16,
    marginBottom: 8,
  },
  tileFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reportCount: {
    fontSize: 10,
    color: Colors.neutralDark,
    fontWeight: '500',
  },
});