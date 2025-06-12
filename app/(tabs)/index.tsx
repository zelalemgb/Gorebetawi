import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, SafeAreaView, Animated, Platform, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Search, Menu } from 'lucide-react-native';
import { LightTheme } from '@/constants/Colors';
import { useReports } from '@/hooks/useReports';
import { useLocation } from '@/hooks/useLocation';
import { useUserTrail } from '@/hooks/useUserTrail';
import { Report, ReportCategory } from '@/types';
import ReportPreview from '@/components/ReportPreview';
import FloatingActionButton from '@/components/FloatingActionButton';
import ReportFormModal from '@/components/ReportFormModal';
import MapComponent from '@/components/MapComponent';
import FloatingIncidentSummary from '@/components/FloatingIncidentSummary';
import CategoryFilterChips from '@/components/CategoryFilterChips';
import BottomSlidePrompt from '@/components/BottomSlidePrompt';
import NeighborhoodStoryTiles from '@/components/NeighborhoodStoryTiles';
import UserTrail from '@/components/UserTrail';
import MicroTrendPopups from '@/components/MicroTrendPopups';
import SmartZoomController from '@/components/SmartZoomController';
import PhotoMemoryLayer from '@/components/PhotoMemoryLayer';

export default function MapScreen() {
  const router = useRouter();
  const { reports, loading, error, confirmReport, filterReportsByCategory } = useReports();
  const { location } = useLocation();
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
  const [summaryVisible, setSummaryVisible] = useState(false);
  const [slidePromptVisible, setSlidePromptVisible] = useState(false);
  const [slidePromptMessage, setSlidePromptMessage] = useState('');
  
  const headerAnimation = useRef(new Animated.Value(0)).current;
  
  // Initial center - Bole, Addis Ababa
  const [center, setCenter] = useState<[number, number]>([8.9806, 38.7578]);
  const [zoom, setZoom] = useState(13);

  // Update map center when user location is available
  useEffect(() => {
    if (location) {
      setCenter([location.coords.latitude, location.coords.longitude]);
      setZoom(15);
      addViewPoint(location.coords.latitude, location.coords.longitude);
    }
  }, [location, addViewPoint]);

  // Filter reports when categories or reports change
  useEffect(() => {
    setFilteredReports(
      selectedCategories.length > 0
        ? filterReportsByCategory(selectedCategories)
        : reports
    );
  }, [selectedCategories, reports, filterReportsByCategory]);

  // Show summary on app load
  useEffect(() => {
    if (reports.length > 0 && !summaryVisible) {
      const timer = setTimeout(() => {
        setSummaryVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [reports.length]);

  // Check for congested zones and show slide prompt
  useEffect(() => {
    if (zoom >= 15 && reports.length > 0) {
      const trafficReports = reports.filter(r => 
        r.category === 'traffic' && 
        r.metadata?.severity === 'heavy' &&
        Date.now() - r.timestamp < 3600000 // Within last hour
      );
      
      const infrastructureIssues = reports.filter(r => 
        r.category === 'infrastructure' &&
        Math.abs(r.location.latitude - center[0]) < 0.01 &&
        Math.abs(r.location.longitude - center[1]) < 0.01
      );
      
      if (trafficReports.length > 0) {
        setSlidePromptMessage('🚦 Heavy congestion here. Want to report current status?');
        setSlidePromptVisible(true);
      } else if (infrastructureIssues.length >= 2) {
        setSlidePromptMessage('🚧 Multiple road issues reported. See something new?');
        setSlidePromptVisible(true);
      }
    }
  }, [zoom, center, reports]);

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
    setSlidePromptVisible(false);
    if (location) {
      addReportPoint(location.coords.latitude, location.coords.longitude);
    }
  };

  const handleCloseReportForm = () => {
    setReportFormVisible(false);
  };

  const handleDismissSummary = () => {
    setSummaryVisible(false);
  };

  const handleDismissSlidePrompt = () => {
    setSlidePromptVisible(false);
  };

  const handleZoomToLocation = (location: [number, number], zoomLevel: number) => {
    setCenter(location);
    setZoom(zoomLevel);
    addViewPoint(location[0], location[1]);
  };

  const handleTrendTap = (trend: any) => {
    // Filter to show only reports of this category
    setSelectedCategories([trend.category]);
    
    // If trend has a specific location, zoom to it
    if (trend.location) {
      handleZoomToLocation(trend.location, 16);
    }
  };

  const handlePhotoPress = (report: Report) => {
    setSelectedReport(report);
    addViewPoint(report.location.latitude, report.location.longitude);
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

  // Calculate map bounds for story tiles
  const mapBounds = {
    north: center[0] + 0.01,
    south: center[0] - 0.01,
    east: center[1] + 0.01,
    west: center[1] - 0.01,
  };

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
      
      {/* Immersive Features */}
      <NeighborhoodStoryTiles
        reports={reports}
        mapBounds={mapBounds}
        zoom={zoom}
        visible={true}
      />
      
      <UserTrail
        trailPoints={trailPoints}
        currentLocation={center}
        zoom={zoom}
        visible={true}
      />
      
      <PhotoMemoryLayer
        reports={reports}
        zoom={zoom}
        visible={true}
        onPhotoPress={handlePhotoPress}
      />
      
      {/* Header */}
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
      
      {/* Smart Zoom Controller */}
      <SmartZoomController
        reports={reports}
        currentLocation={center}
        onZoomToLocation={handleZoomToLocation}
        onZoomToActivity={() => {}}
        visible={true}
      />
      
      {/* Floating Incident Summary */}
      <FloatingIncidentSummary
        reports={reports}
        visible={summaryVisible}
        onDismiss={handleDismissSummary}
      />
      
      {/* Micro Trend Popups */}
      <MicroTrendPopups
        reports={reports}
        currentLocation={center}
        onTrendTap={handleTrendTap}
        visible={true}
      />
      
      {/* Category Filter Chips */}
      <CategoryFilterChips
        selectedCategories={selectedCategories}
        onToggleCategory={handleToggleCategory}
        reportCounts={reportCounts}
      />
      
      {/* Bottom Slide Prompt */}
      <BottomSlidePrompt
        visible={slidePromptVisible}
        message={slidePromptMessage}
        onCreateReport={handleAddReport}
        onDismiss={handleDismissSlidePrompt}
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
    backgroundColor: LightTheme.white,
    borderRadius: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: LightTheme.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchPlaceholder: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: LightTheme.secondaryText,
    marginLeft: 8,
  },
  previewContainer: {
    position: 'absolute',
    bottom: 180,
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