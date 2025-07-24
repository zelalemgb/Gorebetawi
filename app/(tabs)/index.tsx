import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, SafeAreaView, Animated, Platform, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Search, Menu, MapPin } from 'lucide-react-native';
import { LightTheme } from '@/constants/Colors';
import { useReports } from '@/hooks/useReports';
import { useLocation } from '@/hooks/useLocation';
import { useUserTrail } from '@/hooks/useUserTrail';
import { Report, ReportCategory } from '@/types';
import ReportPreview from '@/components/ReportPreview';
import FloatingActionButton from '@/components/FloatingActionButton';
import ReportFormModal from '@/components/ReportFormModal';
import MapComponent from '@/components/MapComponent';
import CategoryFilterChips from '@/components/CategoryFilterChips';
import FloatingSummaryBubble from '@/components/FloatingSummaryBubble';
import CategoryIconToolbar from '@/components/CategoryIconToolbar';

export default function MapScreen() {
  const router = useRouter();
  const { reports, loading, error, confirmReport, filterReportsByCategory } = useReports();
  const { location, loading: locationLoading, errorMsg: locationError } = useLocation();
  const { 
    trailPoints, 
    addViewPoint, 
    addReportPoint, 
    addConfirmPoint 
  } = useUserTrail();
  
  const [selectedCategories, setSelectedCategories] = useState<ReportCategory[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>(reports);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [reportFormVisible, setReportFormVisible] = useState(false);
  
  const headerAnimation = useRef(new Animated.Value(0)).current;
  
  // Initial center - will be updated when location is available
  const [center, setCenter] = useState<[number, number]>([8.9806, 38.7578]); // Fallback to Bole, Addis Ababa
  const [zoom, setZoom] = useState(15);
  const [hasUserLocation, setHasUserLocation] = useState(false);

  // Update map center when user location is available for the first time
  useEffect(() => {
    if (location && !hasUserLocation) {
      setCenter([location.coords.latitude, location.coords.longitude]);
      setZoom(16); // Closer zoom for user area focus
      addViewPoint(location.coords.latitude, location.coords.longitude);
      setHasUserLocation(true);
    }
  }, [location, hasUserLocation, addViewPoint]);

  // Filter reports when categories or reports change
  useEffect(() => {
    setFilteredReports(
      selectedCategories.length > 0
        ? filterReportsByCategory(selectedCategories)
        : reports
    );
  }, [selectedCategories, reports, filterReportsByCategory]);

  const handleMarkerClick = (report: Report) => {
    setSelectedReport(report);
    addViewPoint(report.location.latitude, report.location.longitude);
  };

  const handleClosePreview = () => {
    setSelectedReport(null);
  };

  const handleViewDetails = (report: Report) => {
    // In a real app, this would navigate to a detail page
    console.log('View details for report:', report.id);
    handleClosePreview();
  };

  const handleConfirmReport = async (reportId: string) => {
    await confirmReport(reportId);
    const report = reports.find(r => r.id === reportId);
    if (report) {
      addConfirmPoint(report.location.latitude, report.location.longitude);
    }
    
    // Refresh selected report to show updated confirmations
    if (selectedReport && selectedReport.id === reportId) {
      const updatedReport = reports.find(r => r.id === reportId);
      if (updatedReport) {
        setSelectedReport(updatedReport);
      }
    }
  };

  const handleToggleCategory = (category: ReportCategory) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleAddReport = () => {
    setReportFormVisible(true);
    if (location) {
      addReportPoint(location.coords.latitude, location.coords.longitude);
    }
  };

  const handleCloseReportForm = () => {
    setReportFormVisible(false);
  };

  const handleSummaryReportSelect = (report: Report) => {
    setSelectedReport(report);
    // Center map on selected report
    setCenter([report.location.latitude, report.location.longitude]);
    setZoom(17);
  };

  const handleSummaryExpand = () => {
    // Optional: Could trigger additional UI changes when summary expands
    console.log('Summary expanded');
  };

  // Calculate report counts by category
  const reportCounts = reports.reduce((acc, report) => {
    acc[report.category] = (acc[report.category] || 0) + 1;
    return acc;
  }, {} as Record<ReportCategory, number>);

  const headerHeight = headerAnimation.interpolate({
    inputRange: [0, 100],
    outputRange: [100, 60],
    extrapolate: 'clamp',
  });

  const headerOpacity = headerAnimation.interpolate({
    inputRange: [0, 60],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <MapComponent
        center={center}
        zoom={zoom}
        reports={filteredReports}
        selectedReport={selectedReport}
        onMarkerClick={handleMarkerClick}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: headerAnimation } } }],
          { useNativeDriver: false }
        )}
        filteredCategories={selectedCategories}
      />
      
      {/* Clean Header */}
      <Animated.View style={[styles.header, { height: headerHeight }]}>
        <Animated.View 
          style={[
            styles.headerBackground, 
            { opacity: headerOpacity }
          ]} 
        />
        
        <SafeAreaView style={styles.headerContent}>
          <View style={styles.searchContainer}>
            <TouchableOpacity style={styles.menuButton}>
              <Menu size={24} color={LightTheme.text} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.searchBar}>
              <Search size={20} color={LightTheme.secondaryText} />
              <Text style={styles.searchPlaceholder}>Search reports...</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Animated.View>
      
      {/* Location Status Overlay */}
      {(locationLoading || locationError) && (
        <View style={styles.locationStatusOverlay}>
          <View style={styles.locationStatusCard}>
            {locationLoading ? (
              <>
                <ActivityIndicator size="small" color={LightTheme.accent} />
                <Text style={styles.locationStatusText}>Getting your location...</Text>
              </>
            ) : locationError ? (
              <>
                <MapPin size={20} color={LightTheme.secondaryText} />
                <Text style={styles.locationStatusText}>
                  Enable location to see what's happening near you
                </Text>
              </>
            ) : null}
          </View>
        </View>
      )}
      
      {/* Category Filter Chips - Only show when needed */}
      <CategoryIconToolbar
        reports={reports}
        selectedCategories={selectedCategories}
        onToggleCategory={handleToggleCategory}
        userLocation={location ? {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        } : null}
      />
      
      {/* Floating Summary Bubble */}
      <FloatingSummaryBubble
        reports={reports}
        userLocation={location ? {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        } : null}
        onReportSelect={handleSummaryReportSelect}
        onExpand={handleSummaryExpand}
      />
      
      {/* Report Preview */}
      {selectedReport && (
        <View style={styles.previewContainer}>
          <ReportPreview
            report={selectedReport}
            onClose={handleClosePreview}
            onViewDetails={handleViewDetails}
            onConfirm={handleConfirmReport}
          />
        </View>
      )}
      
      {/* Add Report Button */}
      <FloatingActionButton onPress={handleAddReport} />
      
      {/* Report Form Modal */}
      {reportFormVisible && (
        <ReportFormModal
          visible={reportFormVisible}
          onClose={handleCloseReportForm}
          currentLocation={location ? {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          } : undefined}
        />
      )}
      
      {/* Loading Error */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LightTheme.background,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: LightTheme.background,
    shadowColor: LightTheme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerContent: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 40 : 0,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: LightTheme.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: LightTheme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchBar: {
    flex: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 22,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: 'rgba(102, 126, 234, 0.3)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  },
  searchPlaceholder: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: '#718096',
    marginLeft: 8,
  },
  locationStatusOverlay: {
    position: 'absolute',
    top: 120,
    left: 16,
    right: 16,
    zIndex: 20,
    alignItems: 'center',
  },
  locationStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: 'rgba(102, 126, 234, 0.3)',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
    backdropFilter: 'blur(10px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  locationStatusText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: LightTheme.secondaryText,
    marginLeft: 8,
  },
  previewContainer: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  errorContainer: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  errorText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: LightTheme.white,
    backgroundColor: LightTheme.danger,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
});