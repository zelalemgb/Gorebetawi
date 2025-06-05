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
  metadata?: {
    severity?: 'light' | 'moderate' | 'heavy';
    availability?: boolean;
    queueLength?: 'none' | 'short' | 'medium' | 'long';
    duration?: 'new' | '2-3days' | 'ongoing';
    subcategory?: string;
  };
}