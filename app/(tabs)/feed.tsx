import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  SafeAreaView, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { SlidersHorizontal } from 'lucide-react-native';
import { LightTheme } from '@/constants/Colors';
import { useReports } from '@/hooks/useReports';
import { Report, ReportCategory } from '@/types';
import ReportCard from '@/components/ReportCard';
import CategoryFilter from '@/components/CategoryFilter';

export default function FeedScreen() {
  const router = useRouter();
  const { reports, loading, error, filterReportsByCategory } = useReports();
  
  const [selectedCategories, setSelectedCategories] = useState<ReportCategory[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>(reports);
  
  // Filter reports when categories or reports change
  useEffect(() => {
    setFilteredReports(
      selectedCategories.length > 0
        ? filterReportsByCategory(selectedCategories)
        : reports
    );
  }, [selectedCategories, reports, filterReportsByCategory]);

  const handleToggleCategory = (category: ReportCategory) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleReportPress = (report: Report) => {
    // In a real app, this would navigate to a detail page
    console.log('View details for report:', report.id);
  };

  const renderItem = ({ item }: { item: Report }) => (
    <ReportCard
      report={item}
      onPress={handleReportPress}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <Text style={styles.title}>Recent Reports</Text>
        <TouchableOpacity style={styles.filterButton}>
          <SlidersHorizontal size={20} color={LightTheme.text} />
        </TouchableOpacity>
      </View>
      
      <CategoryFilter
        selectedCategories={selectedCategories}
        onToggleCategory={handleToggleCategory}
      />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={LightTheme.accent} />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : filteredReports.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>No reports found</Text>
          <Text style={styles.emptyText}>
            {selectedCategories.length > 0
              ? 'Try selecting different categories'
              : 'Be the first to report an issue in your area'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredReports}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LightTheme.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    color: LightTheme.text,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: LightTheme.neutral,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: LightTheme.danger,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: LightTheme.text,
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: LightTheme.secondaryText,
    textAlign: 'center',
  },
});