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

  // Fetch reports from database
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

      console.log('📊 Fetching reports from database...');
      
      const { data, error: fetchError } = await getReports({
        category: filters?.category,
        status: filters?.status,
        limit: filters?.limit,
      });

      if (fetchError) {
        console.error('❌ Error fetching reports:', fetchError);
        throw fetchError;
      }

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
        metadata: dbReport.metadata || {},
      }));

      console.log(`✅ Loaded ${transformedReports.length} reports from database`);
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
  const addReport = useCallback(async (report: Omit<Report, 'id' | 'timestamp' | 'confirmations'> & { userId: string }) => {
    try {
      setLoading(true);
      setError(null);

      console.log('📝 Creating new report in database...');

      // Create report in Supabase database
      const { data: supabaseReportData, error: createError } = await createReport({
        title: report.title,
        description: report.description,
        category: report.category,
        location: [report.location.latitude, report.location.longitude],
        address: report.address,
        image_url: report.imageUrl,
        user_id: report.userId,
        anonymous: report.anonymous,
        metadata: report.metadata,
      });

      if (createError) {
        console.error('❌ Error creating report in database:', createError);
        throw createError;
      }

      console.log('✅ Report created successfully in database:', supabaseReportData.id);

      // Transform database format to app format
      const newReport: Report = {
        id: supabaseReportData.id,
        title: supabaseReportData.title,
        description: supabaseReportData.description,
        category: supabaseReportData.category as ReportCategory,
        status: supabaseReportData.status as Report['status'],
        location: {
          latitude: supabaseReportData.location[0],
          longitude: supabaseReportData.location[1],
        },
        address: supabaseReportData.address,
        timestamp: new Date(supabaseReportData.created_at).getTime(),
        imageUrl: supabaseReportData.image_url,
        userId: supabaseReportData.user_id,
        anonymous: supabaseReportData.anonymous,
        confirmations: 0,
        isSponsored: supabaseReportData.is_sponsored,
        sponsoredBy: supabaseReportData.sponsored_by,
        expiresAt: supabaseReportData.expires_at ? new Date(supabaseReportData.expires_at).getTime() : undefined,
        metadata: supabaseReportData.metadata,
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

      console.log('📝 Creating sponsored report in database...');

      // Create sponsored report in Supabase database
      const { data: supabaseReportData, error: createError } = await createReport({
        title: report.title,
        description: report.description,
        category: report.category,
        location: [report.location.latitude, report.location.longitude],
        address: report.address,
        image_url: report.imageUrl,
        user_id: report.userId,
        anonymous: report.anonymous,
        is_sponsored: true,
        sponsored_by: report.sponsoredBy,
        expires_at: new Date(report.expiresAt).toISOString(),
        metadata: report.metadata,
      });

      if (createError) {
        console.error('❌ Error creating sponsored report:', createError);
        throw createError;
      }

      console.log('✅ Sponsored report created successfully:', supabaseReportData.id);

      // Transform database format to app format
      const newReport: Report = {
        id: supabaseReportData.id,
        title: supabaseReportData.title,
        description: supabaseReportData.description,
        category: supabaseReportData.category as ReportCategory,
        status: supabaseReportData.status as Report['status'],
        location: {
          latitude: supabaseReportData.location[0],
          longitude: supabaseReportData.location[1],
        },
        address: supabaseReportData.address,
        timestamp: new Date(supabaseReportData.created_at).getTime(),
        imageUrl: supabaseReportData.image_url,
        userId: supabaseReportData.user_id,
        anonymous: supabaseReportData.anonymous,
        confirmations: 0,
        isSponsored: true,
        sponsoredBy: report.sponsoredBy,
        expiresAt: report.expiresAt,
        metadata: supabaseReportData.metadata,
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
      console.log('👍 Confirming report:', reportId);
      
      // Update confirmations in database
      const { error: updateError } = await updateReportConfirmations(reportId);
      
      if (updateError) {
        console.error('❌ Error updating confirmations in database:', updateError);
        throw updateError;
      }

      if (!mounted.current) return false;

      // Update local state
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
      
      console.log('✅ Report confirmation updated successfully');
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

  // Get nearby fuel stations from businesses table
  const getNearbyFuelStations = useCallback(async (
    latitude: number, 
    longitude: number, 
    radius: number = 2
  ): Promise<FuelStation[]> => {
    try {
      console.log('⛽ Fetching nearby fuel stations from database...');
      
      const { data, error } = await getBusinesses({
        status: 'verified',
        category: 'fuel',
      });

      if (error) {
        console.error('❌ Error fetching fuel stations:', error);
        return [];
      }

      // Transform businesses to fuel stations and filter by distance
      const fuelStations: FuelStation[] = (data || [])
        .map(business => ({
          id: business.id,
          name: business.name,
          address: business.address,
          location: {
            latitude: business.location[0],
            longitude: business.location[1],
          },
        }))
        .filter(station => {
          // Calculate distance (simple approximation)
          const latDiff = Math.abs(station.location.latitude - latitude);
          const lonDiff = Math.abs(station.location.longitude - longitude);
          const distance = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff) * 111; // Rough km conversion
          return distance <= radius;
        });

      console.log(`✅ Found ${fuelStations.length} nearby fuel stations`);
      return fuelStations;
    } catch (err) {
      console.error('❌ Error fetching fuel stations:', err);
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