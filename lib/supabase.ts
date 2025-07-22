import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import 'react-native-url-polyfill/auto';

// Initialize the Supabase client
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Supabase credentials are missing. Copy `.env.example` to `.env`, add your credentials and restart the development server.'
  );
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Export helper functions for common operations
export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithEmail(email: string, password: string) {
  return supabase.auth.signUp({ 
    email, 
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    }
  });
}

export async function signInWithSocial(provider: 'google' | 'apple') {
  return supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    }
  });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getCurrentUser() {
  return supabase.auth.getUser();
}

export async function getSession() {
  return supabase.auth.getSession();
}

// User profile operations
export async function createUserProfile(userId: string, data: {
  email: string;
  name?: string;
  role?: string;
  preferences?: any;
}) {
  return supabase
    .from('users')
    .insert({
      id: userId,
      email: data.email,
      name: data.name,
      role: data.role,
      preferences: data.preferences || {},
    });
}

export async function updateUserProfile(userId: string, data: {
  name?: string;
  role?: string;
  preferences?: any;
}) {
  return supabase
    .from('users')
    .update(data)
    .eq('id', userId);
}

export async function getUserProfile(userId: string) {
  return supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
}

// Reports operations
export async function createReport(data: {
  title: string;
  description?: string;
  category: string;
  location: [number, number];
  address?: string;
  image_url?: string;
  user_id?: string;
  anonymous?: boolean;
  metadata?: any;
}) {
  return supabase
    .from('reports')
    .insert(data)
    .select()
    .single();
}

export async function getReports(filters?: {
  category?: string[];
  status?: string;
  limit?: number;
}) {
  let query = supabase
    .from('reports')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.category && filters.category.length > 0) {
    query = query.in('category', filters.category);
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  return query;
}

export async function updateReportConfirmations(reportId: string) {
  // First get current confirmations count
  const { data: report } = await supabase
    .from('reports')
    .select('confirmations')
    .eq('id', reportId)
    .single();

  if (!report) throw new Error('Report not found');

  const newConfirmations = report.confirmations + 1;
  const newStatus = newConfirmations >= 3 ? 'confirmed' : 'pending';

  return supabase
    .from('reports')
    .update({ 
      confirmations: newConfirmations,
      status: newStatus 
    })
    .eq('id', reportId);
}

// Business operations
export async function createBusiness(data: {
  name: string;
  type: string;
  category: string;
  contact_person: string;
  phone: string;
  location: [number, number];
  address: string;
  logo_url?: string;
  user_id: string;
}) {
  return supabase
    .from('businesses')
    .insert(data)
    .select()
    .single();
}

export async function getBusinesses(filters?: {
  status?: string;
  category?: string;
  user_id?: string;
}) {
  let query = supabase
    .from('businesses')
    .select('*')
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.category) {
    query = query.eq('category', filters.category);
  }

  if (filters?.user_id) {
    query = query.eq('user_id', filters.user_id);
  }

  return query;
}

export async function updateBusinessStatus(
  businessId: string, 
  status: string, 
  rejectionReason?: string
) {
  return supabase
    .from('businesses')
    .update({ 
      status, 
      rejection_reason: rejectionReason,
      updated_at: new Date().toISOString()
    })
    .eq('id', businessId);
}