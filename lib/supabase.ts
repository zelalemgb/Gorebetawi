import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import 'react-native-url-polyfill/auto';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Missing Supabase environment variables:',
    {
      url: supabaseUrl ? 'Found' : 'Missing',
      key: supabaseAnonKey ? 'Found' : 'Missing'
    }
  );
  throw new Error('Missing Supabase environment variables');
}

console.log('Connecting to Supabase:', {
  url: supabaseUrl,
  keyLength: supabaseAnonKey?.length
});

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export async function signInWithEmail(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: undefined
    }
  });

  if (error) {
    console.error('❌ Supabase signUp error:', error);
    return { data: null, error };
  }

  console.log('✅ Supabase signUp successful:', data.user?.email);
  return { data, error: null };
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

export async function createUserProfile(userId: string, data: {
  email: string;
  name?: string;
  role?: 'citizen' | 'business' | 'admin';
  preferences?: any;
}) {
  console.log('📝 Creating user profile in database:', { userId, email: data.email });

  const { data: profile, error } = await supabase
    .from('users')
    .upsert({
      id: userId,
      email: data.email,
      name: data.name || null,
      role: data.role || 'citizen',
      preferences: data.preferences || {},
    }, {
      onConflict: 'id'
    })
    .select()
    .maybeSingle();

  if (error) {
    console.error('❌ Error creating user profile:', error);
  } else {
    console.log('✅ User profile created successfully:', profile);
  }

  return { data: profile, error };
}

export async function updateUserProfile(userId: string, data: {
  name?: string;
  role?: 'citizen' | 'business' | 'admin';
  preferences?: any;
}) {
  console.log('📝 Updating user profile:', { userId, ...data });

  const { data: profile, error } = await supabase
    .from('users')
    .update(data)
    .eq('id', userId)
    .select()
    .maybeSingle();

  if (error) {
    console.error('❌ Error updating user profile:', error);
  } else {
    console.log('✅ User profile updated successfully');
  }

  return { data: profile, error };
}

export async function getUserProfile(userId: string) {
  console.log('👤 Fetching user profile for:', userId);

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .is('deleted_at', null)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    console.error('❌ Error fetching user profile:', error);
  } else if (data) {
    console.log('✅ User profile fetched successfully:', data.email);
  } else {
    console.log('ℹ️ No user profile found for:', userId);
  }

  return { data, error };
}

export async function createReport(data: {
  title: string;
  description?: string;
  category: string;
  location: [number, number];
  address?: string;
  image_url?: string;
  user_id?: string;
  anonymous?: boolean;
  is_sponsored?: boolean;
  sponsored_by?: string;
  expires_at?: string;
  metadata?: any;
}) {
  const locationPoint = `POINT(${data.location[0]} ${data.location[1]})`;

  return supabase
    .from('reports')
    .insert({
      ...data,
      location: locationPoint as any,
    })
    .select()
    .maybeSingle();
}

export async function getReports(filters?: {
  category?: string[];
  status?: string;
  limit?: number;
  search?: string;
}) {
  let query = supabase
    .from('reports')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (filters?.category && filters.category.length > 0) {
    query = query.in('category', filters.category);
  }

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.search) {
    query = query.textSearch('search_vector', filters.search);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  return query;
}

export async function getReportById(reportId: string) {
  return supabase
    .from('reports')
    .select('*')
    .eq('id', reportId)
    .is('deleted_at', null)
    .maybeSingle();
}

export async function updateReport(reportId: string, data: {
  title?: string;
  description?: string;
  status?: string;
  metadata?: any;
}) {
  return supabase
    .from('reports')
    .update(data)
    .eq('id', reportId)
    .select()
    .maybeSingle();
}

export async function softDeleteReport(reportId: string) {
  return supabase
    .from('reports')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', reportId)
    .is('deleted_at', null);
}

export async function restoreReport(reportId: string) {
  return supabase
    .from('reports')
    .update({ deleted_at: null })
    .eq('id', reportId)
    .not('deleted_at', 'is', null);
}

export async function confirmReport(reportId: string, userId: string) {
  const { data, error } = await supabase
    .from('report_confirmations')
    .insert({
      report_id: reportId,
      user_id: userId,
    })
    .select()
    .maybeSingle();

  return { data, error };
}

export async function unconfirmReport(reportId: string, userId: string) {
  return supabase
    .from('report_confirmations')
    .delete()
    .eq('report_id', reportId)
    .eq('user_id', userId);
}

export async function getUserConfirmation(reportId: string, userId: string) {
  return supabase
    .from('report_confirmations')
    .select('*')
    .eq('report_id', reportId)
    .eq('user_id', userId)
    .maybeSingle();
}

export async function getReportConfirmations(reportId: string) {
  return supabase
    .from('report_confirmations')
    .select('*, users(id, name, email)')
    .eq('report_id', reportId)
    .order('created_at', { ascending: false });
}

export async function getReportStatusHistory(reportId: string) {
  return supabase
    .from('report_status_history')
    .select('*, users(id, name, email)')
    .eq('report_id', reportId)
    .order('changed_at', { ascending: false });
}

export async function searchReports(searchQuery: string, filters?: {
  category?: string[];
  status?: string;
  limit?: number;
}) {
  let query = supabase
    .from('reports')
    .select('*')
    .is('deleted_at', null)
    .textSearch('search_vector', searchQuery, {
      type: 'websearch',
      config: 'english'
    })
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

export async function getNearbyReports(
  longitude: number,
  latitude: number,
  radiusMeters: number = 5000,
  filters?: {
    category?: string[];
    status?: string;
    limit?: number;
  }
) {
  const point = `POINT(${longitude} ${latitude})`;

  let query = supabase.rpc('nearby_reports', {
    lat: latitude,
    long: longitude,
    radius_meters: radiusMeters
  });

  return query;
}

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
  const locationPoint = `POINT(${data.location[0]} ${data.location[1]})`;

  return supabase
    .from('businesses')
    .insert({
      ...data,
      location: locationPoint as any,
    })
    .select()
    .maybeSingle();
}

export async function getBusinesses(filters?: {
  status?: string;
  category?: string;
  user_id?: string;
}) {
  let query = supabase
    .from('businesses')
    .select('*')
    .is('deleted_at', null)
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

export async function getBusinessById(businessId: string) {
  return supabase
    .from('businesses')
    .select('*')
    .eq('id', businessId)
    .is('deleted_at', null)
    .maybeSingle();
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
    })
    .eq('id', businessId);
}

export async function softDeleteBusiness(businessId: string) {
  return supabase
    .from('businesses')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', businessId)
    .is('deleted_at', null);
}

export async function restoreBusiness(businessId: string) {
  return supabase
    .from('businesses')
    .update({ deleted_at: null })
    .eq('id', businessId)
    .not('deleted_at', 'is', null);
}

export async function getBusinessVerifications(businessId: string) {
  return supabase
    .from('business_verifications')
    .select('*, users(id, name, email)')
    .eq('business_id', businessId)
    .order('verified_at', { ascending: false });
}

export async function getAuditLogs(filters?: {
  table_name?: string;
  record_id?: string;
  changed_by?: string;
  limit?: number;
}) {
  let query = supabase
    .from('audit_logs')
    .select('*, users(id, name, email)')
    .order('changed_at', { ascending: false });

  if (filters?.table_name) {
    query = query.eq('table_name', filters.table_name);
  }

  if (filters?.record_id) {
    query = query.eq('record_id', filters.record_id);
  }

  if (filters?.changed_by) {
    query = query.eq('changed_by', filters.changed_by);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  return query;
}
