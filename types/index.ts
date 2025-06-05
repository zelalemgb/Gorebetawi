// Report Types
export type ReportCategory = 
  | 'light' 
  | 'water' 
  | 'fuel' 
  | 'price' 
  | 'traffic' 
  | 'infrastructure' 
  | 'environment';

export type ReportStatus = 'pending' | 'confirmed' | 'resolved';

export type UserRole = 'observer' | 'reporter' | 'validator' | 'partner' | 'business';

export type BusinessType = 'fuel_station' | 'retail_shop' | 'market' | 'other';

export type BusinessStatus = 'pending' | 'verified' | 'rejected';

export interface Business {
  id: string;
  name: string;
  type: BusinessType;
  category: ReportCategory;
  contactPerson: string;
  phone: string;
  location: {
    latitude: number;
    longitude: number;
  };
  address: string;
  logoUrl?: string;
  status: BusinessStatus;
  rejectionReason?: string;
  createdAt: number;
  updatedAt: number;
}

export interface PriceDetails {
  itemName: string;
  unitOfMeasure: string;
  quantity: number;
  price: number;
  previousPrice?: number;
}

export interface FuelStation {
  id: string;
  name: string;
  address: string;
  location: {
    latitude: number;
    longitude: number;
  };
}

export interface Report {
  id: string;
  title: string;
  description?: string;
  category: ReportCategory;
  status: ReportStatus;
  location: {
    latitude: number;
    longitude: number;
  };
  address?: string;
  timestamp: number;
  imageUrl?: string;
  userId: string;
  anonymous: boolean;
  confirmations: number;
  isSponsored?: boolean;
  sponsoredBy?: string;
  expiresAt?: number;
  metadata?: {
    severity?: 'light' | 'moderate' | 'heavy';
    availability?: boolean;
    queueLength?: 'none' | 'short' | 'medium' | 'long';
    duration?: 'new' | '2-3days' | 'ongoing';
    subcategory?: string;
    priceDetails?: PriceDetails;
    fuelStation?: FuelStation;
  };
}