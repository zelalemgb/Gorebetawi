import { useState, useCallback } from 'react';
import { Business, BusinessType, ReportCategory } from '@/types';

// Mock data for demonstration
const MOCK_BUSINESSES: Business[] = [
  {
    id: 'total1',
    name: 'Total Bole',
    type: 'fuel_station',
    category: 'fuel',
    contactPerson: 'John Doe',
    phone: '+251911234567',
    location: {
      latitude: 8.9778,
      longitude: 38.7991,
    },
    address: 'Bole Road, Near Bole Medhanialem',
    logoUrl: 'https://example.com/total-logo.png',
    status: 'verified',
    createdAt: Date.now() - 3600000 * 24 * 7, // 7 days ago
    updatedAt: Date.now() - 3600000 * 24 * 7,
  },
  {
    id: 'market1',
    name: 'Bole Rwanda Market',
    type: 'market',
    category: 'price',
    contactPerson: 'Jane Smith',
    phone: '+251922345678',
    location: {
      latitude: 8.9845,
      longitude: 38.7925,
    },
    address: 'Rwanda Street, Near Rwanda Embassy',
    status: 'pending',
    createdAt: Date.now() - 3600000 * 2, // 2 hours ago
    updatedAt: Date.now() - 3600000 * 2,
  },
];

export function useBusiness() {
  const [businesses, setBusinesses] = useState<Business[]>(MOCK_BUSINESSES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registerBusiness = useCallback(async (
    data: Omit<Business, 'id' | 'status' | 'createdAt' | 'updatedAt'>
  ) => {
    try {
      setLoading(true);
      // In a real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newBusiness: Business = {
        ...data,
        id: Math.random().toString(36).substring(7),
        status: 'pending',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      setBusinesses(prev => [...prev, newBusiness]);
      return newBusiness.id;
    } catch (err) {
      setError('Failed to register business');
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
      // In a real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 500));

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
    } catch (err) {
      setError('Failed to update business status');
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
  };
}