import { useState, useEffect, useCallback } from 'react';
import { Report, ReportCategory } from '@/types';

// Mock data centered around Bole, Addis Ababa
const MOCK_REPORTS: Report[] = [
  {
    id: '1',
    title: 'Road Construction Delay',
    description: 'Major delays due to ongoing road construction near Bole Medhanialem Church. Heavy machinery blocking one lane.',
    category: 'safety',
    status: 'pending',
    location: {
      latitude: 8.9898,
      longitude: 38.7967,
    },
    address: 'Bole Medhanialem, Addis Ababa',
    timestamp: Date.now() - 3600000 * 2,
    imageUrl: 'https://images.pexels.com/photos/1117452/pexels-photo-1117452.jpeg',
    userId: 'user123',
    anonymous: false,
    confirmations: 5,
  },
  {
    id: '2',
    title: 'Fuel Shortage at Total',
    description: 'Total gas station near Bole Airport is running low on fuel. Long queues forming.',
    category: 'fuel',
    status: 'confirmed',
    location: {
      latitude: 8.9778,
      longitude: 38.7991,
    },
    address: 'Bole Airport Road, Addis Ababa',
    timestamp: Date.now() - 3600000 * 4,
    userId: 'user456',
    anonymous: true,
    confirmations: 12,
  },
  {
    id: '3',
    title: 'Price Surge at Local Market',
    description: 'Significant price increases for basic goods at Bole Rwanda Market. Prices up by 15% since last week.',
    category: 'price',
    status: 'pending',
    location: {
      latitude: 8.9845,
      longitude: 38.7925,
    },
    address: 'Bole Rwanda Market, Addis Ababa',
    timestamp: Date.now() - 3600000 * 8,
    userId: 'user789',
    anonymous: false,
    confirmations: 3,
  },
  {
    id: '4',
    title: 'Waste Collection Issue',
    description: 'Uncollected garbage near Bole Brass Hospital causing environmental concerns. Need immediate attention.',
    category: 'environment',
    status: 'confirmed',
    location: {
      latitude: 8.9912,
      longitude: 38.7899,
    },
    address: 'Bole Brass Area, Addis Ababa',
    timestamp: Date.now() - 3600000 * 24,
    imageUrl: 'https://images.pexels.com/photos/2768957/pexels-photo-2768957.jpeg',
    userId: 'user123',
    anonymous: false,
    confirmations: 8,
  },
  {
    id: '5',
    title: 'Traffic Signal Malfunction',
    description: 'Traffic lights not working at Bole Atlas intersection. Causing traffic congestion and safety concerns.',
    category: 'safety',
    status: 'pending',
    location: {
      latitude: 8.9867,
      longitude: 38.7945,
    },
    address: 'Bole Atlas, Addis Ababa',
    timestamp: Date.now() - 3600000 * 1,
    userId: 'user456',
    anonymous: true,
    confirmations: 4,
  },
  {
    id: '6',
    title: 'Water Supply Interruption',
    description: 'No water supply in Bole Bulbula area for the past 12 hours. Multiple households affected.',
    category: 'environment',
    status: 'pending',
    location: {
      latitude: 8.9823,
      longitude: 38.8012,
    },
    address: 'Bole Bulbula, Addis Ababa',
    timestamp: Date.now() - 3600000 * 12,
    userId: 'user789',
    anonymous: false,
    confirmations: 6,
  },
  {
    id: '7',
    title: 'New Fuel Prices',
    description: 'NOC gas station implementing new fuel prices. Premium now at 48 birr/liter.',
    category: 'price',
    status: 'confirmed',
    location: {
      latitude: 8.9934,
      longitude: 38.7978,
    },
    address: 'Bole NOC Station, Addis Ababa',
    timestamp: Date.now() - 3600000 * 6,
    userId: 'user123',
    anonymous: true,
    confirmations: 15,
  }
];

export function useReports() {
  const [reports, setReports] = useState<Report[]>(MOCK_REPORTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch reports
  useEffect(() => {
    const fetchReports = async () => {
      try {
        // In a real app, you would fetch data from an API
        await new Promise(resolve => setTimeout(resolve, 1000));
        setReports(MOCK_REPORTS);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch reports');
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  // Add a new report
  const addReport = useCallback(async (report: Omit<Report, 'id' | 'timestamp' | 'confirmations'>) => {
    try {
      setLoading(true);
      // In a real app, you would submit to an API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newReport: Report = {
        ...report,
        id: Math.random().toString(36).substring(7),
        timestamp: Date.now(),
        confirmations: 0,
      };
      
      setReports(prev => [newReport, ...prev]);
      return newReport.id;
    } catch (err) {
      setError('Failed to submit report');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Confirm a report
  const confirmReport = useCallback(async (reportId: string) => {
    try {
      // In a real app, you would submit to an API
      await new Promise(resolve => setTimeout(resolve, 500));
      
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
    } catch (err) {
      setError('Failed to confirm report');
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

  return {
    reports,
    loading,
    error,
    addReport,
    confirmReport,
    filterReportsByCategory,
  };
}