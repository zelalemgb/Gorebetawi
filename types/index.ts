// Report Types - Updated to match database ENUMs
export type ReportCategory =
  | 'light'
  | 'water'
  | 'fuel'
  | 'price'
  | 'security'
  | 'health'
  | 'infrastructure'
  | 'other';

export type ReportStatus = 'open' | 'in_progress' | 'resolved' | 'rejected';

export type UserRole = 'citizen' | 'business' | 'admin' | 'observer' | 'reporter' | 'verifier' | 'partner';

export type BusinessType = 'gas_station' | 'water_supplier' | 'other';

export type BusinessCategory = ReportCategory;

export type BusinessStatus = 'pending' | 'approved' | 'rejected';

export interface User {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  role: UserRole;
  preferences?: {
    interestedCategories?: ReportCategory[];
    alwaysAnonymous?: boolean;
    enableLocationAccess?: boolean;
  };
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface Business {
  id: string;
  name: string;
  type: BusinessType;
  category: BusinessCategory;
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
  userId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
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
  imageUrl?: string;
  userId?: string | null;
  anonymous: boolean;
  confirmations: number;
  isSponsored: boolean;
  sponsoredBy?: string | null;
  expiresAt?: string | null;
  metadata?: {
    severity?: 'light' | 'moderate' | 'heavy';
    availability?: boolean;
    queueLength?: 'none' | 'short' | 'medium' | 'long';
    duration?: 'new' | '2-3days' | 'ongoing';
    subcategory?: string;
    priceDetails?: PriceDetails;
    fuelStation?: FuelStation;
  };
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

// New types for enhanced features
export interface ReportConfirmation {
  id: string;
  reportId: string;
  userId: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  tableName: string;
  recordId: string;
  action: 'insert' | 'update' | 'delete';
  oldData?: Record<string, any>;
  newData?: Record<string, any>;
  changedBy?: string;
  changedAt: string;
}

export interface ReportStatusHistory {
  id: string;
  reportId: string;
  oldStatus?: ReportStatus;
  newStatus: ReportStatus;
  changedBy?: string;
  notes?: string;
  changedAt: string;
}

export interface BusinessVerification {
  id: string;
  businessId: string;
  verifiedBy?: string;
  status: BusinessStatus;
  notes?: string;
  verifiedAt: string;
}
