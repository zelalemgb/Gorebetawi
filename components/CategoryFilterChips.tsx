import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  withSpring
} from 'react-native-reanimated';
import { LightbulbOff, Droplet, Fuel, ShoppingCart, Car, Wrench, Leaf, TriangleAlert as AlertTriangle } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { ReportCategory } from '@/types';

interface CategoryFilterChipsProps {
  selectedCategories: ReportCategory[];
  onToggleCategory: (category: ReportCategory) => void;
  reportCounts?: Record<ReportCategory, number>;
}

const CATEGORY_CHIPS = [
  {
    key: 'light' as ReportCategory,
    label: 'Light',
    icon: LightbulbOff,
    color: '#FDD835'
  },
  {
    key: 'water' as ReportCategory,
    label: 'Water',
    icon: Droplet,
    color: '#2196F3'
  },
  {
    key: 'fuel' as ReportCategory,
    label: 'Fuel',
    icon: Fuel,
    color: '#43A047'
  },
  {
    key: 'price' as ReportCategory,
    label: 'Price',
    icon: ShoppingCart,
    color: '#FF9800'
  },
  {
    key: 'traffic' as ReportCategory,
    label: 'Traffic',
    icon: Car,
    color: '#F44336'
  },
  {
    key: 'infrastructure' as ReportCategory,
    label: 'Roads',
    icon: Wrench,
    color: '#9E9E9E'
  },
  {
    key: 'environment' as ReportCategory,
    label: 'Environment',
    icon: Leaf,
    color: '#4CAF50'
  },
  {
    key: 'safety' as ReportCategory,
    label: 'Safety',
    icon: AlertTriangle,
    color: '#E53935'
  }
];

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function CategoryFilterChips({ 
  selectedCategories, 
  onToggleCategory,
  reportCounts = {}
}: CategoryFilterChipsProps) {
  
  const ChipComponent = ({ category }: { category: typeof CATEGORY_CHIPS[0] }) => {
    const isSelected = selectedCategories.includes(category.key);
    const count = reportCounts[category.key] || 0;
    const scale = useSharedValue(1);
    
    const IconComponent = category.icon;
    
    const handlePress = () => {
      scale.value = withSpring(0.95, { damping: 10, stiffness: 300 }, () => {
        scale.value = withSpring(1, { damping: 10, stiffness: 300 });
      });
      onToggleCategory(category.key);
    };
    
    const animatedStyle = useAnimatedStyle(() => {
      return {
        transform: [{ scale: scale.value }],
      };
    });
    
    return (
      <AnimatedTouchableOpacity
        style={[
          styles.chip,
          isSelected && {
            backgroundColor: category.color,
            borderColor: category.color,
          },
          animatedStyle
        ]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <IconComponent 
          size={16} 
          color={isSelected ? 'white' : category.color}
          strokeWidth={2}
        />
        <Text style={[
          styles.chipText,
          isSelected && styles.chipTextSelected
        ]}>
          {category.label}
        </Text>
        {count > 0 && (
          <View style={[
            styles.countBadge,
            isSelected && styles.countBadgeSelected
          ]}>
            <Text style={[
              styles.countText,
              isSelected && styles.countTextSelected
            ]}>
              {count}
            </Text>
          </View>
        )}
      </AnimatedTouchableOpacity>
    );
  };
  
  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {CATEGORY_CHIPS.map((category) => (
          <ChipComponent key={category.key} category={category} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    zIndex: 15,
  },
  scrollView: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.6)',
    shadowColor: 'rgba(102, 126, 234, 0.2)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
    backdropFilter: 'blur(10px)',
  },
  chipText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: '500',
    color: '#2d3748',
    letterSpacing: '0.2px',
  },
  chipTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  countBadge: {
    marginLeft: 6,
    backgroundColor: '#667eea',
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    shadowColor: 'rgba(102, 126, 234, 0.3)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  countBadgeSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    backdropFilter: 'blur(4px)',
  },
  countText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 14,
    letterSpacing: '0.2px',
  },
  countTextSelected: {
    color: 'white',
  },
});