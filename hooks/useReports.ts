import { useState, useEffect, useCallback, useRef } from 'react';
import { Report, ReportCategory, FuelStation } from '@/types';
import { 
  createReport, 
  getReports, 
  updateReportConfirmations,
  getBusinesses 
} from '@/lib/supabase';

// Enhanced sample data for demonstration with more diverse locations and scenarios
const SAMPLE_REPORTS: Report[] = [
  // Fresh reports (< 1 hour)
  {
    id: '1',
    title: 'Street Light Out',
    description: 'Main street light has been out for 3 days',
    category: 'light',
    status: 'pending',
    location: { latitude: 8.9806, longitude: 38.7578 },
    address: 'Bole Road, near Edna Mall',
    timestamp: Date.now() - 1800000, // 30 minutes ago (fresh)
    userId: 'user1',
    anonymous: false,
    confirmations: 2,
    metadata: { severity: 'moderate', duration: 'ongoing' }
  },
  {
    id: '2',
    title: 'Water Shortage',
    description: 'No water supply since yesterday morning',
    category: 'water',
    status: 'confirmed',
    location: { latitude: 8.9856, longitude: 38.7628 },
    address: 'Bole Sub City, Kebele 03',
    timestamp: Date.now() - 172800000, // 2 days ago
    userId: 'user2',
    anonymous: true,
    confirmations: 5,
    metadata: { duration: 'ongoing' }
  },
  {
    id: '3',
    title: 'Fuel Available',
    description: 'Both gasoline and diesel available, short queue',
    category: 'fuel',
    status: 'confirmed',
    location: { latitude: 8.9906, longitude: 38.7678 },
    address: 'Total Station, Bole Road',
    timestamp: Date.now() - 2700000, // 45 minutes ago (fresh)
    userId: 'user3',
    anonymous: false,
    confirmations: 8,
    metadata: { 
      availability: true,
      queueLength: 'short',
      fuelStation: {
        id: 'total-bole',
        name: 'Total Bole',
        address: 'Bole Road',
        location: { latitude: 8.9906, longitude: 38.7678 }
      }
    }
  },
  {
    id: '4',
    title: 'Bread Price Increase',
    description: 'Local bakery increased bread price to 45 birr',
    category: 'price',
    status: 'pending',
    location: { latitude: 8.9756, longitude: 38.7528 },
    address: 'Bole Medhanialem Area',
    timestamp: Date.now() - 7200000, // 2 hours ago
    userId: 'user4',
    anonymous: false,
    confirmations: 1,
    metadata: {
      priceDetails: {
        itemName: 'Bread',
        unitOfMeasure: 'loaf',
        quantity: 1,
        price: 45,
        previousPrice: 40
      }
    }
  },
  {
    id: '5',
    title: 'Heavy Traffic',
    description: 'Accident causing major delays on main road',
    category: 'traffic',
    status: 'confirmed',
    location: { latitude: 9.0184, longitude: 38.7578 },
    address: 'Stadium Area, near roundabout',
    timestamp: Date.now() - 1800000, // 30 minutes ago
    userId: 'user5',
    anonymous: false,
    confirmations: 12,
    metadata: { severity: 'heavy' }
  },
  {
    id: '6',
    title: 'Large Pothole',
    description: 'Dangerous pothole causing vehicle damage',
    category: 'infrastructure',
    status: 'pending',
    location: { latitude: 9.0284, longitude: 38.7478 },
    address: 'Kazanchis Road',
    timestamp: Date.now() - 259200000, // 3 days ago
    userId: 'user6',
    anonymous: true,
    confirmations: 7,
    metadata: { subcategory: 'Pothole' }
  },
  {
    id: '7',
    title: 'Garbage Overflow',
    description: 'Dumpster overflowing, creating health hazard',
    category: 'environment',
    status: 'confirmed',
    location: { latitude: 9.0334, longitude: 38.7428 },
    address: 'Piassa Market Area',
    timestamp: Date.now() - 432000000, // 5 days ago
    userId: 'user7',
    anonymous: false,
    confirmations: 4,
    metadata: { subcategory: 'Garbage overflow' }
  },
  {
    id: '8',
    title: 'Road Construction',
    description: 'Road blocked due to ongoing construction work',
    category: 'infrastructure',
    status: 'confirmed',
    location: { latitude: 8.9956, longitude: 38.7728 },
    address: 'Bole Atlas Road',
    timestamp: Date.now() - 604800000, // 1 week ago
    userId: 'user8',
    anonymous: false,
    confirmations: 15,
    metadata: { subcategory: 'Road Block' }
  },
  // Additional fresh reports for better visualization
  {
    id: '9',
    title: 'Power Outage',
    description: 'Entire neighborhood without electricity',
    category: 'light',
    status: 'pending',
    location: { latitude: 8.9706, longitude: 38.7478 },
    address: 'Bole Michael Area',
    timestamp: Date.now() - 900000, // 15 minutes ago (very fresh)
    userId: 'user9',
    anonymous: false,
    confirmations: 0,
    metadata: { severity: 'heavy', duration: 'ongoing' }
  },
  {
    id: '10',
    title: 'Safety Concern',
    description: 'Broken street barrier creating hazard',
    category: 'safety',
    status: 'pending',
    location: { latitude: 8.9856, longitude: 38.7478 },
    address: 'Bole Brass Junction',
    timestamp: Date.now() - 3600000, // 1 hour ago
    userId: 'user10',
    anonymous: true,
    confirmations: 3,
    metadata: { severity: 'moderate' }
  },
  // Sponsored report
  {
    id: '11',
    title: 'Quality Fuel Available',
    description: 'Premium gasoline and diesel now available with no waiting time',
    category: 'fuel',
    status: 'confirmed',
    location: { latitude: 9.0084, longitude: 38.7648 },
    address: 'Shell Station, Meskel Square',
    timestamp: Date.now() - 1800000, // 30 minutes ago
    userId: 'shell_station',
    anonymous: false,
    confirmations: 15,
    isSponsored: true,
    sponsoredBy: 'shell_station',
    expiresAt: Date.now() + 86400000, // Expires in 24 hours
    metadata: { 
      availability: true,
      queueLength: 'none',
      fuelStation: {
        id: 'shell-meskel',
        name: 'Shell Meskel Square',
        address: 'Meskel Square',
        location: { latitude: 9.0084, longitude: 38.7648 }
      }
    }
  },
  // More infrastructure issues for clustering demo
  {
    id: '12',
    title: 'Road Damage',
    description: 'Multiple potholes on main road',
    category: 'infrastructure',
    status: 'pending',
    location: { latitude: 9.0294, longitude: 38.7488 },
    address: 'Kazanchis Main Road',
    timestamp: Date.now() - 86400000, // 1 day ago
    userId: 'user12',
    anonymous: false,
    confirmations: 2,
    metadata: { subcategory: 'Pothole' }
  },
  {
    id: '13',
    title: 'Manhole Cover Missing',
    description: 'Open manhole creating danger for vehicles',
    category: 'infrastructure',
    status: 'confirmed',
    location: { latitude: 9.0274, longitude: 38.7468 },
    address: 'Kazanchis Side Street',
    timestamp: Date.now() - 172800000, // 2 days ago
    userId: 'user13',
    anonymous: true,
    confirmations: 8,
    metadata: { subcategory: 'Open Manhole' }
  },
  // More traffic reports
  {
    id: '14',
    title: 'Moderate Traffic',
    description: 'Slow moving traffic due to construction',
    category: 'traffic',
    status: 'pending',
    location: { latitude: 8.9906, longitude: 38.7578 },
    address: 'Bole Road Junction',
    timestamp: Date.now() - 2700000, // 45 minutes ago
    userId: 'user14',
    anonymous: false,
    confirmations: 5,
    metadata: { severity: 'moderate' }
  },
  // Environmental issues
  {
    id: '15',
    title: 'Stagnant Water',
    description: 'Standing water creating mosquito breeding ground',
    category: 'environment',
    status: 'pending',
    location: { latitude: 9.0384, longitude: 38.7378 },
    address: 'Piassa Back Street',
    timestamp: Date.now() - 259200000, // 3 days ago
    userId: 'user15',
    anonymous: false,
    confirmations: 1,
    metadata: { subcategory: 'Stagnant water' }
  }
];

export function useReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  // Fetch reports
  useEffect(() => {
    fetchReports();

    return () => {
      mounted.current = false;
    };
  }, []);

  const fetchReports = async (filters?: {
    category?: ReportCategory[];
    status?: string;
    limit?: number;
  }) => {
    try {
      setLoading(true);
      setError(null);

      // For demo purposes, use sample data
      // In production, this would fetch from Supabase
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
      
      if (!mounted.current) return;

      let filteredReports = [...SAMPLE_REPORTS];

      if (filters?.category && filters.category.length > 0) {
        filteredReports = filteredReports.filter(report => 
          filters.category!.includes(report.category)
        );
      }

      if (filters?.status) {
        filteredReports = filteredReports.filter(report => 
          report.status === filters.status
        );
      }

      if (filters?.limit) {
        filteredReports = filteredReports.slice(0, filters.limit);
      }

      setReports(filteredReports);
    } catch (err: any) {
      if (mounted.current) {
        setError(err.message || 'Failed to fetch reports');
        console.error('Error fetching reports:', err);
      }
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
  };

  // Add a new report
  const addReport = useCallback(async (report: Omit<Report, 'id' | 'timestamp' | 'confirmations'>) => {
    try {
      setLoading(true);
      setError(null);

      // For demo purposes, add to local state
      // In production, this would create in Supabase
      const newReport: Report = {
        ...report,
        id: `report_${Date.now()}`,
        timestamp: Date.now(),
        confirmations: 0,
      };

      if (!mounted.current) return null;

      setReports(prev => [newReport, ...prev]);
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

      const newReport: Report = {
        ...report,
        id: `sponsored_${Date.now()}`,
        timestamp: Date.now(),
        confirmations: 0,
        isSponsored: true,
      };

      if (!mounted.current) return null;

      setReports(prev => [newReport, ...prev]);
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

  // Confirm a report
  const confirmReport = useCallback(async (reportId: string) => {
    try {
      if (!mounted.current) return false;

      setReports(prev => 
        prev.map(report => 
          report.id === reportId 
            ? { 
                ...report, 
                confirmations: report.confirmations + 1,
                status: report.confirmations >= 2 ? 'confirmed' : report.status
              } 
            : report
        )
      );
      
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
  const getNearbyFuelStations = useCallback((
    latitude: number, 
    longitude: number, 
    radius: number = 2
  ): FuelStation[] => {
    // Sample fuel stations for demo
    const fuelStations: FuelStation[] = [
      {
        id: 'total-bole',
        name: 'Total Bole',
        address: 'Bole Road, near Edna Mall',
        location: { latitude: 8.9906, longitude: 38.7678 }
      },
      {
        id: 'noc-kazanchis',
        name: 'NOC Kazanchis',
        address: 'Kazanchis Road',
        location: { latitude: 9.0284, longitude: 38.7478 }
      },
      {
        id: 'shell-stadium',
        name: 'Shell Stadium',
        address: 'Stadium Area',
        location: { latitude: 9.0184, longitude: 38.7578 }
      },
      {
        id: 'shell-meskel',
        name: 'Shell Meskel Square',
        address: 'Meskel Square',
        location: { latitude: 9.0084, longitude: 38.7648 }
      }
    ];

    return fuelStations;
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
    refreshReports: fetchReports,
  };
}