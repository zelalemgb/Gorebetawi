import { useState, useCallback } from 'react';
import { Business, BusinessType, ReportCategory } from '@/types';
import { 
  createBusiness, 
  getBusinesses, 
  updateBusinessStatus as updateBusinessStatusDB 
} from '@/lib/supabase';

export function useBusiness() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBusinesses = useCallback(async (filters?: {
    status?: Business['status'];
    category?: ReportCategory;
    userId?: string;
  }) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await getBusinesses({
        status: filters?.status,
        category: filters?.category,
        user_id: filters?.userId,
      });

      if (fetchError) throw fetchError;

      // Transform database format to app format
      const transformedBusinesses: Business[] = (data || []).map(dbBusiness => ({
        id: dbBusiness.id,
        name: dbBusiness.name,
        type: dbBusiness.type as BusinessType,
        category: dbBusiness.category as ReportCategory,
        contactPerson: dbBusiness.contact_person,
        phone: dbBusiness.phone,
        location: {
          latitude: dbBusiness.location[1],
          longitude: dbBusiness.location[0],
        },
        address: dbBusiness.address,
        logoUrl: dbBusiness.logo_url || undefined,
        status: dbBusiness.status as Business['status'],
        rejectionReason: dbBusiness.rejection_reason || undefined,
        createdAt: new Date(dbBusiness.created_at).getTime(),
        updatedAt: new Date(dbBusiness.updated_at).getTime(),
      }));

      setBusinesses(transformedBusinesses);
      return transformedBusinesses;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch businesses');
      console.error('Error fetching businesses:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const registerBusiness = useCallback(async (
    data: Omit<Business, 'id' | 'status' | 'createdAt' | 'updatedAt'> & { userId: string }
  ) => {
    try {
      setLoading(true);
      setError(null);

      const { data: newBusiness, error: createError } = await createBusiness({
        name: data.name,
        type: data.type,
        category: data.category,
        contact_person: data.contactPerson,
        phone: data.phone,
        location: [data.location.longitude, data.location.latitude],
        address: data.address,
        logo_url: data.logoUrl,
        user_id: data.userId,
      });

      if (createError) throw createError;

      // Transform and add to local state
      const transformedBusiness: Business = {
        id: newBusiness.id,
        name: newBusiness.name,
        type: newBusiness.type as BusinessType,
        category: newBusiness.category as ReportCategory,
        contactPerson: newBusiness.contact_person,
        phone: newBusiness.phone,
        location: {
          latitude: newBusiness.location[1],
          longitude: newBusiness.location[0],
        },
        address: newBusiness.address,
        logoUrl: newBusiness.logo_url || undefined,
        status: newBusiness.status as Business['status'],
        rejectionReason: newBusiness.rejection_reason || undefined,
        createdAt: new Date(newBusiness.created_at).getTime(),
        updatedAt: new Date(newBusiness.updated_at).getTime(),
      };

      setBusinesses(prev => [transformedBusiness, ...prev]);
      return transformedBusiness.id;
    } catch (err: any) {
      setError(err.message || 'Failed to register business');
      console.error('Error registering business:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateBusinessStatus = useCallback(async (
    businessId: string,
    status: Business['status'],
    rejectionReason?: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      const { error: updateError } = await updateBusinessStatusDB(
        businessId, 
        status, 
        rejectionReason
      );

      if (updateError) throw updateError;

      setBusinesses(prev => 
        prev.map(business => 
          business.id === businessId
            ? {
                ...business,
                status,
                rejectionReason,
                updatedAt: Date.now(),
              }
            : business
        )
      );

      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to update business status');
      console.error('Error updating business status:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const getBusinessById = useCallback((businessId: string) => {
    return businesses.find(b => b.id === businessId) || null;
  }, [businesses]);

  const getVerifiedBusinessesByCategory = useCallback((category: ReportCategory) => {
    return businesses.filter(b => b.status === 'verified' && b.category === category);
  }, [businesses]);

  return {
    businesses,
    loading,
    error,
    registerBusiness,
    updateBusinessStatus,
    getBusinessById,
    getVerifiedBusinessesByCategory,
    fetchBusinesses,
  };
}