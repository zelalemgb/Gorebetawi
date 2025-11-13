import { useState, useEffect, useCallback, useRef } from 'react';
import { Report, ReportCategory, FuelStation } from '@/types';
import {
  createReport,
  getReports,
  confirmReport as confirmReportDB,
  unconfirmReport,
  getUserConfirmation,
  getBusinesses
} from '@/lib/supabase';

// Mock data for development
const SAMPLE_REPORTS: Report[] = [
  {
    id: '1',
    title: 'Power outage in Bole area',
    description: 'Electricity has been out since 2 PM. Affecting the entire neighborhood.',
    category: 'light',
    status: 'open',
    location: { latitude: 9.0320, longitude: 38.7469 },
    address: 'Bole, Addis Ababa',
    timestamp: Date.now() - 3600000, // 1 hour ago
    imageUrl: 'https://images.pexels.com/photos/2096700/pexels-photo-2096700.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    userId: 'user1',
    anonymous: false,
    confirmations: 5,
    metadata: { severity: 'moderate', duration: 'ongoing' }
  },
  {
    id: '2',
    title: 'Water shortage reported',
    description: 'No water supply for the past 6 hours in this area.',
    category: 'water',
    status: 'open',
    location: { latitude: 9.0280, longitude: 38.7520 },
    address: 'Kazanchis, Addis Ababa',
    timestamp: Date.now() - 7200000, // 2 hours ago
    userId: 'user2',
    anonymous: true,
    confirmations: 2,
    metadata: { severity: 'heavy', duration: '2-3days' }
  },
  {
    id: '3',
    title: 'Fuel available at Total station',
    description: 'Both gasoline and diesel available with short queue.',
    category: 'fuel',
    status: 'open',
    location: { latitude: 9.0350, longitude: 38.7400 },
    address: 'Mexico Square, Addis Ababa',
    timestamp: Date.now() - 1800000, // 30 minutes ago
    userId: 'user3',
    anonymous: false,
    confirmations: 8,
    metadata: { 
      availability: true, 
      queueLength: 'short',
      fuelStation: {
        id: 'station1',
        name: 'Total Mexico',
        address: 'Mexico Square, Addis Ababa',
        location: { latitude: 9.0350, longitude: 38.7400 }
      }
    }
  },
  {
    id: '4',
    title: 'Teff price increased',
    description: 'Price went up from 45 to 55 birr per kg at local market.',
    category: 'price',
    status: 'open',
    location: { latitude: 9.0250, longitude: 38.7550 },
    address: 'Merkato, Addis Ababa',
    timestamp: Date.now() - 5400000, // 1.5 hours ago
    userId: 'user4',
    anonymous: false,
    confirmations: 3,
    metadata: {
      priceDetails: {
        itemName: 'Teff/Injera',
        unitOfMeasure: 'kg',
        quantity: 1,
        price: 55,
        previousPrice: 45
      }
    }
  },
  {
    id: '5',
    title: 'Heavy traffic on Bole Road',
    description: 'Accident near Edna Mall causing major delays.',
    category: 'infrastructure',
    status: 'open',
    location: { latitude: 9.0180, longitude: 38.7580 },
    address: 'Bole Road, Addis Ababa',
    timestamp: Date.now() - 900000, // 15 minutes ago
    userId: 'user5',
    anonymous: false,
    confirmations: 12,
    metadata: { severity: 'heavy', subcategory: 'accident' }
  },
  {
    id: '6',
    title: 'Road construction blocking traffic',
    description: 'Major road work on CMC road, use alternative routes.',
    category: 'infrastructure',
    status: 'open',
    location: { latitude: 9.0100, longitude: 38.7650 },
    address: 'CMC Road, Addis Ababa',
    timestamp: Date.now() - 10800000, // 3 hours ago
    userId: 'user6',
    anonymous: false,
    confirmations: 7,
    metadata: { subcategory: 'Road Block', duration: 'ongoing' }
  },
  {
    id: '7',
    title: 'Garbage overflow near school',
    description: 'Uncollected garbage for over a week, creating health hazard.',
    category: 'other',
    status: 'open',
    location: { latitude: 9.0400, longitude: 38.7300 },
    address: 'Piassa, Addis Ababa',
    timestamp: Date.now() - 14400000, // 4 hours ago
    userId: 'user7',
    anonymous: true,
    confirmations: 4,
    metadata: { subcategory: 'Garbage overflow', severity: 'moderate' }
  },
  {
    id: '8',
    title: 'Street robbery reported',
    description: 'Multiple incidents reported in this area after dark.',
    category: 'security',
    status: 'open',
    location: { latitude: 9.0150, longitude: 38.7450 },
    address: 'Arat Kilo, Addis Ababa',
    timestamp: Date.now() - 21600000, // 6 hours ago
    userId: 'user8',
    anonymous: true,
    confirmations: 6,
    metadata: { severity: 'heavy', subcategory: 'theft' }
  },
  {
    id: '9',
    title: 'No fuel at Shell station',
    description: 'Station ran out of both gasoline and diesel.',
    category: 'fuel',
    status: 'open',
    location: { latitude: 9.0080, longitude: 38.7620 },
    address: 'Gotera, Addis Ababa',
    timestamp: Date.now() - 3600000, // 1 hour ago
    userId: 'user9',
    anonymous: false,
    confirmations: 9,
    metadata: { 
      availability: false,
      fuelStation: {
        id: 'station2',
        name: 'Shell Gotera',
        address: 'Gotera, Addis Ababa',
        location: { latitude: 9.0080, longitude: 38.7620 }
      }
    }
  },
  {
    id: '10',
    title: 'Cooking oil shortage',
    description: 'Most shops in the area are out of cooking oil.',
    category: 'price',
    status: 'open',
    location: { latitude: 9.0380, longitude: 38.7480 },
    address: 'Sidist Kilo, Addis Ababa',
    timestamp: Date.now() - 7200000, // 2 hours ago
    userId: 'user10',
    anonymous: false,
    confirmations: 1,
    metadata: {
      priceDetails: {
        itemName: 'Cooking Oil',
        unitOfMeasure: 'liter',
        quantity: 1,
        price: 0
      }
    }
  }
];

const SAMPLE_FUEL_STATIONS: FuelStation[] = [
  {
    id: 'station1',
    name: 'Total Mexico',
    address: 'Mexico Square, Addis Ababa',
    location: { latitude: 9.0350, longitude: 38.7400 }
  },
  {
    id: 'station2',
    name: 'Shell Gotera',
    address: 'Gotera, Addis Ababa',
    location: { latitude: 9.0080, longitude: 38.7620 }
  },
  {
    id: 'station3',
    name: 'NOC Bole',
    address: 'Bole Road, Addis Ababa',
    location: { latitude: 9.0200, longitude: 38.7500 }
  },
  {
    id: 'station4',
    name: 'Oilibya Kazanchis',
    address: 'Kazanchis, Addis Ababa',
    location: { latitude: 9.0300, longitude: 38.7550 }
  }
];

export function useReports() {
  const [reports, setReports] = useState<Report[]>(SAMPLE_REPORTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  // Initialize with mock data
  useEffect(() => {
    setReports(SAMPLE_REPORTS);
    setLoading(false);
    setError(null);

    return () => {
      mounted.current = false;
    };
  }, []);

  // Add a new report (with database backup)
  const addReport = useCallback(async (report: Omit<Report, 'id' | 'timestamp' | 'confirmations'> & { userId: string }) => {
    try {
      setLoading(true);
      setError(null);

      console.log('📝 Creating new report...');

      // Create new report with mock ID
      const newReport: Report = {
        id: `report_${Date.now()}`,
        title: report.title,
        description: report.description,
        category: report.category,
        status: 'open',
        location: report.location,
        address: report.address,
        imageUrl: report.imageUrl,
        userId: report.userId,
        anonymous: report.anonymous,
        confirmations: 0,
        isSponsored: false,
        sponsoredBy: report.sponsoredBy,
        expiresAt: report.expiresAt,
        metadata: report.metadata,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (!mounted.current) return null;

      // Add to local state immediately
      setReports(prev => [newReport, ...prev]);

      // Try to save to database in background
      try {
        await createReport({
          title: report.title,
          description: report.description,
          category: report.category,
          location: [report.location.longitude, report.location.latitude],
          address: report.address,
          image_url: report.imageUrl,
          user_id: report.userId,
          anonymous: report.anonymous,
          metadata: report.metadata,
        });
        console.log('✅ Report saved to database');
      } catch (dbError) {
        console.warn('⚠️ Failed to save to database, using local storage:', dbError);
      }

      return newReport.id;
    } catch (err: any) {
      if (mounted.current) {
        setError(err.message || 'Failed to submit report');
        console.error('Error creating report:', err);
      }
      return null;
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
  }, []);

  // Add a sponsored report
  const addSponsoredReport = useCallback(async (
    report: Omit<Report, 'id' | 'timestamp' | 'confirmations'> & { 
      sponsoredBy: string;
      expiresAt: number;
    }
  ) => {
    try {
      setLoading(true);
      setError(null);

      console.log('📝 Creating sponsored report...');

      const newReport: Report = {
        id: `sponsored_${Date.now()}`,
        title: report.title,
        description: report.description,
        category: report.category,
        status: 'open',
        location: report.location,
        address: report.address,
        imageUrl: report.imageUrl,
        userId: report.userId,
        anonymous: report.anonymous,
        confirmations: 0,
        isSponsored: true,
        sponsoredBy: report.sponsoredBy,
        expiresAt: report.expiresAt ? new Date(report.expiresAt).toISOString() : undefined,
        metadata: report.metadata,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (!mounted.current) return null;

      setReports(prev => [newReport, ...prev]);

      // Try to save to database in background
      try {
        await createReport({
          title: report.title,
          description: report.description,
          category: report.category,
          location: [report.location.longitude, report.location.latitude],
          address: report.address,
          image_url: report.imageUrl,
          user_id: report.userId,
          anonymous: report.anonymous,
          is_sponsored: true,
          sponsored_by: report.sponsoredBy,
          expires_at: new Date(report.expiresAt).toISOString(),
          metadata: report.metadata,
        });
        console.log('✅ Sponsored report saved to database');
      } catch (dbError) {
        console.warn('⚠️ Failed to save sponsored report to database:', dbError);
      }

      return newReport.id;
    } catch (err: any) {
      if (mounted.current) {
        setError(err.message || 'Failed to submit sponsored report');
        console.error('Error creating sponsored report:', err);
      }
      return null;
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
  }, []);

  const confirmReport = useCallback(async (reportId: string, userId: string) => {
    try {
      console.log('👍 Confirming report:', reportId);

      if (!mounted.current) return false;

      // Try to confirm in database
      const { data, error: confirmError } = await confirmReportDB(reportId, userId);

      if (confirmError) {
        // Check if already confirmed
        if (confirmError.code === '23505') {
          console.log('ℹ️ Report already confirmed by this user');
          return false;
        }
        throw confirmError;
      }

      // Update local state
      setReports(prev =>
        prev.map(report =>
          report.id === reportId
            ? {
                ...report,
                confirmations: report.confirmations + 1,
              }
            : report
        )
      );

      console.log('✅ Report confirmation added');
      return true;
    } catch (err: any) {
      if (mounted.current) {
        setError(err.message || 'Failed to confirm report');
        console.error('Error confirming report:', err);
      }
      return false;
    }
  }, []);

  // Filter reports by category
  const filterReportsByCategory = useCallback((categories: ReportCategory[]) => {
    if (categories.length === 0) {
      return reports;
    }
    return reports.filter(report => categories.includes(report.category));
  }, [reports]);

  // Get nearby fuel stations
  const getNearbyFuelStations = useCallback(async (
    latitude: number, 
    longitude: number, 
    radius: number = 2
  ): Promise<FuelStation[]> => {
    try {
      console.log('⛽ Getting nearby fuel stations...');
      
      // Filter mock stations by distance
      const nearbyStations = SAMPLE_FUEL_STATIONS.filter(station => {
        const latDiff = Math.abs(station.location.latitude - latitude);
        const lonDiff = Math.abs(station.location.longitude - longitude);
        const distance = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff) * 111; // Rough km conversion
        return distance <= radius;
      });

      console.log(`✅ Found ${nearbyStations.length} nearby fuel stations`);
      return nearbyStations;
    } catch (err) {
      console.error('❌ Error fetching fuel stations:', err);
      return SAMPLE_FUEL_STATIONS; // Return all stations as fallback
    }
  }, []);

  // Refresh reports (reload mock data)
  const refreshReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    // Simulate network delay
    setTimeout(() => {
      setReports(SAMPLE_REPORTS);
      setLoading(false);
    }, 500);
  }, []);

  return {
    reports,
    loading,
    error,
    addReport,
    addSponsoredReport,
    confirmReport,
    filterReportsByCategory,
    getNearbyFuelStations,
    refreshReports,
  };
}