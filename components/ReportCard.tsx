import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { TriangleAlert as AlertTriangle, Droplet, DollarSign, Leaf, Clock, MapPin, Check } from 'lucide-react-native';
import { LightTheme, Colors } from '@/constants/Colors';
import { Report, ReportCategory } from '@/types';
import { formatDistanceToNow } from '@/utils/dateUtils';

interface ReportCardProps {
  report: Report;
  onPress: (report: Report) => void;
  style?: any;
}

export default function ReportCard({ report, onPress, style }: ReportCardProps) {
  const getCategoryIcon = (category: ReportCategory) => {
    switch (category) {
      case 'security':
        return <AlertTriangle size={20} color={Colors.safety} />;
      case 'fuel':
        return <Droplet size={20} color={Colors.fuel} />;
      case 'price':
        return <DollarSign size={20} color={Colors.price} />;
      case 'health':
        return <Leaf size={20} color={Colors.environment} />;
      default:
        return <AlertTriangle size={20} color={Colors.safety} />;
    }
  };

  const getCategoryName = (category: ReportCategory) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  const timeAgo = formatDistanceToNow(new Date(report.createdAt).getTime());

  return (
    <TouchableOpacity 
      style={[styles.container, style]} 
      onPress={() => onPress(report)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.categoryContainer}>
          {getCategoryIcon(report.category)}
          <Text style={styles.category}>{getCategoryName(report.category)}</Text>
        </View>
        <View style={styles.statusContainer}>
          {report.status === 'resolved' && (
            <View style={styles.badge}>
              <Check size={12} color={LightTheme.white} />
              <Text style={styles.badgeText}>Resolved</Text>
            </View>
          )}
          {report.status === 'in_progress' && (
            <View style={[styles.badge, { backgroundColor: '#48bb78' }]}>
              <Clock size={12} color={LightTheme.white} />
              <Text style={styles.badgeText}>In Progress</Text>
            </View>
          )}
        </View>
      </View>

      <Text style={styles.title} numberOfLines={2}>{report.title}</Text>
      
      {report.imageUrl && (
        <Image source={{ uri: report.imageUrl }} style={styles.image} />
      )}
      
      <View style={styles.footer}>
        <View style={styles.metaItem}>
          <Clock size={14} color={LightTheme.secondaryText} />
          <Text style={styles.metaText}>{timeAgo}</Text>
        </View>
        
        {report.address && (
          <View style={styles.metaItem}>
            <MapPin size={14} color={LightTheme.secondaryText} />
            <Text style={styles.metaText} numberOfLines={1}>{report.address}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: LightTheme.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: LightTheme.border,
    shadowColor: LightTheme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  category: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: LightTheme.secondaryText,
  },
  statusContainer: {
    flexDirection: 'row',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.green,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: LightTheme.white,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: LightTheme.text,
    marginBottom: 12,
  },
  image: {
    width: '100%',
    height: 160,
    borderRadius: 8,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metaText: {
    marginLeft: 4,
    fontSize: 12,
    color: LightTheme.secondaryText,
  },
});