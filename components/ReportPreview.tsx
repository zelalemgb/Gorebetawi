import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { TriangleAlert as AlertTriangle, Droplet, DollarSign, Leaf, ThumbsUp } from 'lucide-react-native';
import { LightTheme, Colors } from '@/constants/Colors';
import { Report, ReportCategory } from '@/types';
import { formatDistanceToNow } from '@/utils/dateUtils';
import AppButton from './AppButton';

interface ReportPreviewProps {
  report: Report;
  onClose: () => void;
  onViewDetails: (report: Report) => void;
  onConfirm: (reportId: string) => void;
  style?: any;
}

export default function ReportPreview({ 
  report, 
  onClose, 
  onViewDetails, 
  onConfirm,
  style 
}: ReportPreviewProps) {
  const getCategoryIcon = (category: ReportCategory) => {
    switch (category) {
      case 'safety':
        return <AlertTriangle size={20} color={Colors.safety} />;
      case 'fuel':
        return <Droplet size={20} color={Colors.fuel} />;
      case 'price':
        return <DollarSign size={20} color={Colors.price} />;
      case 'environment':
        return <Leaf size={20} color={Colors.environment} />;
      default:
        return <AlertTriangle size={20} color={Colors.safety} />;
    }
  };
  
  const timeAgo = formatDistanceToNow(new Date(report.createdAt).getTime());

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <View style={styles.categoryContainer}>
          {getCategoryIcon(report.category)}
          <Text style={styles.category}>
            {report.category.charAt(0).toUpperCase() + report.category.slice(1)}
          </Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeText}>×</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.title}>{report.title}</Text>
      
      {report.imageUrl && (
        <Image source={{ uri: report.imageUrl }} style={styles.image} />
      )}
      
      <Text style={styles.timeText}>{timeAgo}</Text>
      
      {report.description && (
        <Text style={styles.description} numberOfLines={2}>{report.description}</Text>
      )}
      
      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.confirmButton} 
          onPress={() => onConfirm(report.id)}
        >
          <ThumbsUp size={16} color={LightTheme.accent} />
          <Text style={styles.confirmText}>Confirm ({report.confirmations})</Text>
        </TouchableOpacity>
        
        <AppButton
          title="View Details"
          onPress={() => onViewDetails(report)}
          variant="primary"
          size="small"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 18,
    borderWidth: 0,
    shadowColor: 'rgba(102, 126, 234, 0.25)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    width: '90%',
    maxWidth: 350,
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
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
  closeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: LightTheme.neutral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 18,
    color: LightTheme.secondaryText,
    lineHeight: 22,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: LightTheme.text,
    marginBottom: 8,
  },
  image: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
  },
  timeText: {
    fontSize: 12,
    color: LightTheme.secondaryText,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: LightTheme.secondaryText,
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(63, 81, 181, 0.1)',
  },
  confirmText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
    color: LightTheme.accent,
  },
});