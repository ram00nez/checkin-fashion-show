import { createClient } from '@supabase/supabase-js';
import { Participant, UserRole } from '../types';
import { SupabaseClient } from '@supabase/supabase-js';

interface UserMetadata {
  role?: UserRole;
}

interface AuthResponse {
  data: {
    user: {
      id: string;
      email?: string;
      user_metadata: UserMetadata;
    } | null;
  };
}

interface EnhancedSupabaseClient extends SupabaseClient {
  getCurrentUser: () => Promise<AuthResponse['data']['user'] | null>;
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dtqmuraseozqzbwivhoi.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0cW11cmFzZW96cXpid2l2aG9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Nzk2OTQxOSwiZXhwIjoyMDYzNTQ1NDE5fQ.z4sq7w5sdORZ706IF5RquRCrrqyY0KdNz8OvHASr-C0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey) as EnhancedSupabaseClient;

// Add getCurrentUser to supabase instance
supabase.getCurrentUser = async (): Promise<AuthResponse['data']['user'] | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    
    // Ensure user_metadata exists and has a role
    const metadata = user.user_metadata || {};
    const role = metadata.role || 'user';
    
    return {
      ...user,
      user_metadata: {
        role: role as UserRole
      }
    };
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Fungsi untuk memeriksa apakah user adalah admin
export const isAdmin = async (): Promise<boolean> => {
  try {
    const user = await supabase.getCurrentUser();
    return user?.user_metadata?.role === 'admin' || false;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
};

// Fungsi-fungsi utama
export async function getAllParticipants(): Promise<Participant[]> {
  const { data, error } = await supabase
    .from('participants')
    .select('*')
    .order('nama_anak', { ascending: true });
    
  if (error) {
    console.error('Error fetching participants:', error);
    throw new Error(error.message);
  }
  
  return data || [];
}

export async function searchParticipants(query: string): Promise<Participant[]> {
  if (!query.trim()) return [];
  
  // Format query for better search results
  const searchQuery = query.toLowerCase().trim();
  
  const { data, error } = await supabase
    .from('participants')
    .select('*')
    .or(`nama_anak.ilike.%${searchQuery}%,nama_orang_tua.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`)
    .order('nama_anak', { ascending: true })
    .limit(50); // Limit results to prevent overwhelming output
    
  if (error) {
    console.error('Error searching participants:', error);
    throw new Error(error.message);
  }
  
  return data || [];
}

export async function updateParticipantStatus(
  id: string, 
  updates: Partial<Participant>
): Promise<Participant> {
  console.log('Updating participant:', id, 'with updates:', updates);
  
  // Get current user role
  const { data: { user } } = await supabase.auth.getUser();
  
  // Check if user is logged in
  if (!user) {
    throw new Error('Unauthorized');
  }

  // Get user metadata
  const metadata = user.user_metadata || {};
  const role = metadata.role as UserRole;
  
  // Only allow admin to update check-in status
  if (role !== 'admin' && 
      (updates.check_in !== undefined || updates.snack_box_received !== undefined || updates.lunch_box_ticket_received !== undefined)) {
    throw new Error('Only admin can update check-in status');
  }

  // Get current participant data
  const { data: currentData, error: fetchError } = await supabase
    .from('participants')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError) {
    console.error('Error fetching current data:', fetchError);
    throw new Error('Failed to fetch current participant data');
  }

  if (!currentData) {
    throw new Error('Participant not found');
  }

  // Prepare updates with timestamps
  const finalUpdates: Partial<Participant> = {
    ...currentData, // Start with current data
    updated_at: new Date().toISOString(),
    check_in: currentData.check_in ?? false,
    check_in_time: currentData.check_in_time ?? null,
    status: currentData.status ?? 'pending',
    snack_box_received: currentData.snack_box_received ?? false,
    snack_box_time: currentData.snack_box_time ?? null,
    lunch_box_ticket_received: currentData.lunch_box_ticket_received ?? false,
    lunch_box_ticket_received_time: currentData.lunch_box_ticket_received_time ?? null,
    representative_name: updates.representative_name ?? currentData.representative_name,
    representative_phone: updates.representative_phone ?? currentData.representative_phone
  };

  // Update specific fields based on what was changed
  if (updates.check_in !== undefined) {
    finalUpdates.check_in = updates.check_in;
    if (updates.check_in) {
      finalUpdates.check_in_time = new Date().toISOString();
      finalUpdates.status = 'checked_in';
    }
  }
  if (updates.snack_box_received !== undefined) {
    finalUpdates.snack_box_received = updates.snack_box_received;
    if (updates.snack_box_received) {
      finalUpdates.snack_box_time = new Date().toISOString();
    }
  }
  if (updates.lunch_box_ticket_received !== undefined) {
    finalUpdates.lunch_box_ticket_received = updates.lunch_box_ticket_received;
    if (updates.lunch_box_ticket_received) {
      finalUpdates.lunch_box_ticket_received_time = new Date().toISOString();
    }
  }

  console.log('Final updates:', finalUpdates);

  // Try to update the record
  const { data, error } = await supabase
    .from('participants')
    .update(finalUpdates)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error('Error updating participant status:', error);
    throw new Error(error.message);
  }

  // Verify the update was successful
  if (!data) {
    console.error('No data returned from update');
    throw new Error('Failed to update participant status: No data returned');
  }

  // Verify the ID matches
  if (data.id !== id) {
    console.error('ID mismatch:', data.id, '!=', id);
    throw new Error('Failed to update participant status: ID mismatch');
  }

  // Verify all required fields exist in the response
  const requiredFields = [
    'check_in', 'check_in_time', 'status',
    'snack_box_received', 'snack_box_time',
    'lunch_box_ticket_received', 'lunch_box_ticket_received_time'
  ] as const;

  // Check if all required fields exist in the response
  for (const field of requiredFields) {
    if (data[field as keyof Participant] === undefined) {
      console.error('Missing field:', field);
      throw new Error(`Failed to update participant status: Missing field ${field}`);
    }
  }

  console.log('Successfully updated participant:', data);

  return data as Participant;
}

// Fungsi autentikasi
export async function signIn(email: string, password: string): Promise<any> {
  const { data: { user }, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error('Error signing in:', error);
    throw new Error(error.message);
  }

  if (!user) {
    throw new Error('No user data returned');
  }

  // Update user metadata with admin role
  await supabase.auth.updateUser({
    data: {
      role: 'admin' as UserRole
    }
  });

  return user;
}

export async function signUp(email: string, password: string, isAdmin: boolean = true): Promise<any> {
  const { data: { user }, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: isAdmin ? 'admin' : 'user' as UserRole
      }
    }
  });

  if (error) {
    console.error('Error signing up:', error);
    throw new Error(error.message);
  }
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.error('Error getting user:', error);
    throw new Error('Failed to get user');
  }
}

export async function updateRole(userId: string, role: UserRole): Promise<void> {
  const { error } = await supabase.auth.admin.updateUserById(userId, {
    user_metadata: {
      role: role
    }
  });

  if (error) {
    console.error('Error updating role:', error);
    throw new Error('Failed to update role');
  }
}

// Fungsi session
export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  
  if (error) throw error;
}

// Fungsi statistik admin
export async function getAdminStats() {
  try {
    const [checkedInRes, notCheckedInRes, snackDistributedRes, lunchDistributedRes] = await Promise.all([
      supabase
        .from('participants')
        .select('count')
        .eq('status', 'checked_in'),
      
      supabase
        .from('participants')
        .select('count')
        .eq('status', 'pending'),
      
      supabase
        .from('participants')
        .select('count')
        .eq('snack_box_received', true),
      
      supabase
        .from('participants')
        .select('count')
        .eq('lunch_box_ticket_received', true)
    ]);

    return {
      checkedIn: checkedInRes.data?.[0]?.count || 0,
      notCheckedIn: notCheckedInRes.data?.[0]?.count || 0,
      snackDistributed: snackDistributedRes.data?.[0]?.count || 0,
      lunchDistributed: lunchDistributedRes.data?.[0]?.count || 0
    };
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    throw new Error('Failed to fetch admin stats');
  }
}

// Fungsi check-in
export async function checkInParticipant(id: string): Promise<Participant> {
  const { data, error } = await supabase
    .from('participants')
    .update({
      status: 'hadir',
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getParticipantsForCheckIn(query: string = ''): Promise<Participant[]> {
  const { data, error } = await supabase
    .from('participants')
    .select('*')
    .or(`nama_anak.ilike.%${query}%,nama_orang_tua.ilike.%${query}%,email.ilike.%${query}%`)
    .eq('status', 'tidak hadir')
    .order('nama_anak', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}


