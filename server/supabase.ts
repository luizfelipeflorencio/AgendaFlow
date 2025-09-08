import { createClient } from '@supabase/supabase-js';

if (!process.env.SUPABASE_URL) {
  throw new Error('Missing SUPABASE_URL environment variable');
}

if (!process.env.SUPABASE_ANON_KEY) {
  throw new Error('Missing SUPABASE_ANON_KEY environment variable');
}

// Create Supabase client
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Database types (based on our schema)
export interface SupabaseAppointment {
  id: string;
  client_name: string;
  client_phone: string;
  date: string;
  time: string;
  status: string;
  created_at: string;
}

export interface SupabaseManager {
  id: string;
  username: string;
  password: string;
}

export interface SupabaseTimeSlot {
  id: string;
  slot_time: string;
  is_active: boolean;
}

export interface SupabaseScheduleClosure {
  id: string;
  closure_type: string;
  day_of_week: string | null;
  specific_date: string | null;
  reason: string | null;
  is_active: boolean;
  created_at: string;
}

export interface SupabaseTimeSlotBlock {
  id: string;
  specific_date: string;
  start_time: string;
  end_time: string;
  reason: string | null;
  is_active: boolean;
  created_at: string;
}