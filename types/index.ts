// Report Types
export type ReportCategory = 'safety' | 'fuel' | 'price' | 'environment';

export type ReportStatus = 'pending' | 'confirmed' | 'resolved';

export type UserRole = 'observer' | 'reporter' | 'validator' | 'partner';

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
}

export interface UserPreferences {
  interestedCategories: ReportCategory[];
  alwaysAnonymous: boolean;
  enableLocationAccess: boolean;
}

export interface User {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: UserRole;
  preferences: UserPreferences;
  reports: number;
  confirmations: number;
}