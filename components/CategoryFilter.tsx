import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { TriangleAlert as AlertTriangle, Droplet, DollarSign, Leaf } from 'lucide-react-native';
import { LightTheme, Colors } from '@/constants/Colors';
import { ReportCategory } from '@/types';

interface CategoryFilterProps {
  selectedCategories: ReportCategory[];
  onToggleCategory: (category: ReportCategory) => void;
}

export default function CategoryFilter({ 
  selectedCategories, 
  onToggleCategory 
}: CategoryFilterProps) {
  const categories: { key: ReportCategory; label: string; icon: JSX.Element }[] = [
    {
      key: 'safety',
      label: 'Safety',
      icon: <AlertTriangle size={16} color={selectedCategories.includes('safety') ? LightTheme.white : Colors.safety} />
    },
    {
      key: 'fuel',
      label: 'Fuel',
      icon: <Droplet size={16} color={selectedCategories.includes('fuel') ? LightTheme.white : Colors.fuel} />
    },
    {
      key: 'price',
      label: 'Price',
      icon: <DollarSign size={16} color={selectedCategories.includes('price') ? LightTheme.white : Colors.price} />
    },
    {
      key: 'environment',
      label: 'Environment',
      icon: <Leaf size={16} color={selectedCategories.includes('environment') ? LightTheme.white : Colors.environment} />
    }
  ];

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {categories.map((category) => {
        const isSelected = selectedCategories.includes(category.key);
        
        return (
          <TouchableOpacity
            key={category.key}
            style={[
              styles.categoryButton,
              isSelected && { backgroundColor: Colors[category.key] }
            ]}
            onPress={() => onToggleCategory(category.key)}
            activeOpacity={0.7}
          >
            {category.icon}
            <Text 
              style={[
                styles.categoryText,
                isSelected && styles.selectedCategoryText
              ]}
            >
              {category.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: LightTheme.neutral,
  },
  categoryText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    color: LightTheme.secondaryText,
  },
  selectedCategoryText: {
    color: LightTheme.white,
  }
});