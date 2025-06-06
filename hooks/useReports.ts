import { useState, useEffect, useCallback, useRef } from 'react';
import { Report, ReportCategory, FuelStation } from '@/types';
import { 
  createReport, 
  getReports, 
  updateReportConfirmations,
  getBusinesses 
} from '@/lib/supabase';

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

      const { data, error: fetchError } = await getReports({
        category: filters?.category,
        status: filters?.status,
        limit: filters?.limit || 50,
      });

      if (fetchError) throw fetchError;

      if (!mounted.current) return;

      // Transform database format to app format
      const transformedReports: Report[] = (data || []).map(dbReport => ({
        id: dbReport.id,
        title: dbReport.title,
        description: dbReport.description || undefined,
        category: dbReport.category as ReportCategory,
        status: dbReport.status as Report['status'],
        location: {
          latitude: dbReport.location[0],
          longitude: dbReport.location[1],
        },
        address: dbReport.address || undefined,
        timestamp: new Date(dbReport.created_at).getTime(),
        imageUrl: dbReport.image_url || undefined,
        userId: dbReport.user_id || 'anonymous',
        anonymous: dbReport.anonymous,
        confirmations: dbReport.confirmations,
        isSponsored: dbReport.is_sponsored,
        sponsoredBy: dbReport.sponsored_by || undefined,
        expiresAt: dbReport.expires_at ? new Date(dbReport.expires_at).getTime() : undefined,
        metadata: dbReport.metadata || undefined,
      }));

      setReports(transformedReports);
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

      const { data, error: createError } = await createReport({
        title: report.title,
        description: report.description,
        category: report.category,
        location: [report.location.latitude, report.location.longitude],
        address: report.address,
        image_url: report.imageUrl,
        user_id: report.userId === 'anonymous' ? null : report.userId,
        anonymous: report.anonymous,
        metadata: report.metadata,
      });

      if (createError) throw createError;

      if (!mounted.current) return null;

      // Transform and add to local state
      const newReport: Report = {
        id: data.id,
        title: data.title,
        description: data.description || undefined,
        category: data.category as ReportCategory,
        status: data.status as Report['status'],
        location: {
          latitude: data.location[0],
          longitude: data.location[1],
        },
        address: data.address || undefined,
        timestamp: new Date(data.created_at).getTime(),
        imageUrl: data.image_url || undefined,
        userId: data.user_id || 'anonymous',
        anonymous: data.anonymous,
        confirmations: data.confirmations,
        isSponsored: data.is_sponsored,
        sponsoredBy: data.sponsored_by || undefined,
        expiresAt: data.expires_at ? new Date(data.expires_at).getTime() : undefined,
        metadata: data.metadata || undefined,
      };

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

      const { data, error: createError } = await createReport({
        title: report.title,
        description: report.description,
        category: report.category,
        location: [report.location.latitude, report.location.longitude],
        address: report.address,
        image_url: report.imageUrl,
        user_id: report.userId === 'anonymous' ? null : report.userId,
        anonymous: report.anonymous,
        metadata: report.metadata,
      });

      if (createError) throw createError;

      if (!mounted.current) return null;

      // Transform and add to local state
      const newReport: Report = {
        id: data.id,
        title: data.title,
        description: data.description || undefined,
        category: data.category as ReportCategory,
        status: data.status as Report['status'],
        location: {
          latitude: data.location[0],
          longitude: data.location[1],
        },
        address: data.address || undefined,
        timestamp: new Date(data.created_at).getTime(),
        imageUrl: data.image_url || undefined,
        userId: data.user_id || 'anonymous',
        anonymous: data.anonymous,
        confirmations: data.confirmations,
        isSponsored: true,
        sponsoredBy: report.sponsoredBy,
        expiresAt: report.expiresAt,
        metadata: data.metadata || undefined,
      };

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
      const { error: updateError } = await updateReportConfirmations(reportId);

      if (updateError) throw updateError;

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
  const getNearbyFuelStations = useCallback(async (
    latitude: number, 
    longitude: number, 
    radius: number = 2
  ): Promise<FuelStation[]> => {
    try {
      const { data, error } = await getBusinesses({
        status: 'verified',
        category: 'fuel',
      });

      if (error) throw error;

      // Transform database format to app format
      const fuelStations: FuelStation[] = (data || []).map(business => ({
        id: business.id,
        name: business.name,
        address: business.address,
        location: {
          latitude: business.location[0],
          longitude: business.location[1],
        },
      }));

      // In a real app, you would filter by distance here
      return fuelStations;
    } catch (err) {
      console.error('Error fetching fuel stations:', err);
      return [];
    }
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