import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, SafeAreaView, Animated, Platform, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Search, Menu, MapPin, TriangleAlert as AlertTriangle } from 'lucide-react-native';
import { LightTheme } from '@/constants/Colors';
import { useReports } from '@/hooks/useReports';
import { useLocation } from '@/hooks/useLocation';
import { useAuth } from '@/hooks/useAuth';
import { useUserTrail } from '@/hooks/useUserTrail';
import { useMapIdle } from '@/hooks/useMapIdle';
import { Report, ReportCategory } from '@/types';
import ReportPreview from '@/components/ReportPreview';
import FloatingActionButton from '@/components/FloatingActionButton';
import ReportFormModal from '@/components/ReportFormModal';
import MapComponent from '@/components/MapComponent';
import CategoryFilterChips from '@/components/CategoryFilterChips';
import FloatingSummaryBubble from '@/components/FloatingSummaryBubble';
import CategoryIconToolbar from '@/components/CategoryIconToolbar';
import TrendInsightBubble from '@/components/TrendInsightBubble';
import EmptyStateMessage from '@/components/EmptyStateMessage';
import LightReportModal from '@/components/LightReportModal';
import WaterReportModal from '@/components/WaterReportModal';
import QuickLightReportButton from '@/components/QuickLightReportButton';
import QuickWaterReportButton from '@/components/QuickWaterReportButton';
import QuickFuelReportButton from '@/components/QuickFuelReportButton';
import QuickPriceReportButton from '@/components/QuickPriceReportButton';

export default function MapScreen() {
  const router = useRouter();
  const { reports, loading, error, confirmReport, filterReportsByCategory, addReport } = useReports();
  const { location, loading: locationLoading, errorMsg: locationError } = useLocation();
  const { user } = useAuth();
  const { 
    trailPoints, 
    addViewPoint, 
    addReportPoint, 
    addConfirmPoint 
  } = useUserTrail();
  
  const { isIdle, trackInteraction } = useMapIdle({ 
    idleDelay: 10000, // 10 seconds before considering idle
    resetOnInteraction: true 
  });
  
  const [selectedCategories, setSelectedCategories] = useState<ReportCategory[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [reportFormVisible, setReportFormVisible] = useState(false);
  const [lightReportVisible, setLightReportVisible] = useState(false);
  const [waterReportVisible, setWaterReportVisible] = useState(false);
  const [highlightedReports, setHighlightedReports] = useState<Report[]>([]);
  
  const headerAnimation = useRef(new Animated.Value(0)).current;
  
  // Initial center - will be updated when location is available
  const [center, setCenter] = useState<[number, number]>([9.0320, 38.7469]); // Fallback to Addis Ababa center
  const [zoom, setZoom] = useState(15);
  const [hasUserLocation, setHasUserLocation] = useState(false);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Update map center when user location is available for the first time
  useEffect(() => {
    if (location && !hasUserLocation && mountedRef.current) {
      console.log('🗺️ Setting map center to user location');
      setCenter([location.coords.latitude, location.coords.longitude]);
      setZoom(16); // Closer zoom for user area focus
      addViewPoint(location.coords.latitude, location.coords.longitude);
      setHasUserLocation(true);
    } else if (locationError && !hasUserLocation && mountedRef.current) {
      // If location fails, use default location (Addis Ababa, Bole)
      console.log('🗺️ Using default location due to location error');
      setCenter([9.0320, 38.7469]);
      setZoom(15);
      setHasUserLocation(true);
    }
  }, [location, locationError, hasUserLocation, addViewPoint]);

  // Calculate filtered reports based on selected categories
  const filteredReports = React.useMemo(() => {
    return selectedCategories.length > 0
      ? filterReportsByCategory(selectedCategories)
      : reports;
  }, [selectedCategories, reports, filterReportsByCategory]);

  // Calculate distance between two coordinates in kilometers
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Check if there are reports within 1km radius
  const nearbyReports = React.useMemo(() => {
    if (!location) return filteredReports;

    return filteredReports.filter(report => {
      const distance = calculateDistance(
        location.coords.latitude,
        location.coords.longitude,
        report.location.latitude,
        report.location.longitude
      );
      return distance <= 1; // Within 1km
    });
  }, [location, filteredReports]);

  // Determine if we should show empty state
  const shouldShowEmptyState = user && location && !loading && nearbyReports.length === 0;

  const handleMarkerClick = (report: Report) => {
    setSelectedReport(report);
    addViewPoint(report.location.latitude, report.location.longitude);
    trackInteraction(); // Reset idle timer on interaction
  };

  const handleMarkerHover = (report: Report) => {
    setSelectedReport(report);
  };

  const handleMarkerHoverOut = () => {
    setSelectedReport(null);
  };

  const handleClosePreview = () => {
    setSelectedReport(null);
    trackInteraction();
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
    trackInteraction();
  };

  const handleAddReport = (category?: ReportCategory) => {
    // Check if user is authenticated before allowing report creation
    if (!user) {
      // Redirect to login if not authenticated
      router.push('/auth/login');
      return;
    }

    // Use simplified modals for light and water categories
    if (category === 'light') {
      setLightReportVisible(true);
    } else if (category === 'water') {
      setWaterReportVisible(true);
    } else {
      setReportFormVisible(true);
    }

    if (location) {
      addReportPoint(location.coords.latitude, location.coords.longitude);
    }
    trackInteraction();
  };

  const handleCloseReportForm = () => {
    setReportFormVisible(false);
    trackInteraction();
  };

  const handleCloseLightReport = () => {
    setLightReportVisible(false);
    trackInteraction();
  };

  const handleCloseWaterReport = () => {
    setWaterReportVisible(false);
    trackInteraction();
  };

  const handleSummaryReportSelect = (report: Report) => {
    setSelectedReport(report);
    // Center map on selected report
    setCenter([report.location.latitude, report.location.longitude]);
    setZoom(17);
    trackInteraction();
  };

  const handleSummaryExpand = () => {
    // Optional: Could trigger additional UI changes when summary expands
    console.log('Summary expanded');
  };

  const handleHighlightReports = (reports: Report[]) => {
    setHighlightedReports(reports);
    // Clear highlights after 5 seconds
    setTimeout(() => {
      setHighlightedReports([]);
    }, 5000);
  };

  const handleTrendDismiss = () => {
    // Optional: Could track dismissal analytics
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
        onMarkerHover={handleMarkerHover}
        onMarkerHoverOut={handleMarkerHoverOut}
        highlightedReports={highlightedReports}
        {...(Platform.OS !== 'web' && {
          onScroll: Animated.event(
            [{ nativeEvent: { contentOffset: { y: headerAnimation } } }],
            { useNativeDriver: false }
          )
        })}
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
      
      {/* Category Filter - Only show when not filtering */}
      {selectedCategories.length === 0 && (
        <CategoryIconToolbar
          reports={reports}
          selectedCategories={selectedCategories}
          onToggleCategory={handleToggleCategory}
          userLocation={location ? {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          } : null}
        />
      )}

      {/* Show category filter chips when filtering */}
      {selectedCategories.length > 0 && (
        <CategoryFilterChips
          selectedCategories={selectedCategories}
          onToggleCategory={handleToggleCategory}
          reportCounts={reportCounts}
        />
      )}

      {/* Only show summary when no report is selected and there are nearby reports */}
      {!selectedReport && nearbyReports.length > 0 && (
        <FloatingSummaryBubble
          reports={reports}
          userLocation={location ? {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          } : null}
          onReportSelect={handleSummaryReportSelect}
          onExpand={handleSummaryExpand}
        />
      )}

      {/* Empty State - Show when user is logged in and no reports nearby */}
      {shouldShowEmptyState && !selectedReport && (
        <EmptyStateMessage
          onCreateReport={handleAddReport}
          userLocation={location ? {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          } : null}
        />
      )}
      
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

      {/* Quick Report Buttons */}
      <QuickPriceReportButton onPress={() => handleAddReport('price')} />
      <QuickFuelReportButton onPress={() => handleAddReport('fuel')} />
      <QuickWaterReportButton onPress={() => handleAddReport('water')} />
      <QuickLightReportButton onPress={() => handleAddReport('light')} />
      
      {/* Report Form Modal */}
      {reportFormVisible && (
        <ReportFormModal
          visible={reportFormVisible}
          onClose={handleCloseReportForm}
          onLightReportRequest={() => handleAddReport('light')}
          onWaterReportRequest={() => handleAddReport('water')}
          currentLocation={location ? {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          } : undefined}
        />
      )}

      {/* Light Report Modal */}
      {lightReportVisible && (
        <LightReportModal
          visible={lightReportVisible}
          onClose={handleCloseLightReport}
          onReportSubmit={addReport}
          currentLocation={location ? {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          } : undefined}
        />
      )}

      {/* Water Report Modal */}
      {waterReportVisible && (
        <WaterReportModal
          visible={waterReportVisible}
          onReportSubmit={addReport}
          onClose={handleCloseWaterReport}
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
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
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