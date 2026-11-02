import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from './supabase.client';

export async function isCurrentUserAdmin(
  client: SupabaseClient = supabase,
): Promise<boolean> {
  const { data, error } = await client.rpc('is_admin');
  if (error) throw error;
  return data === true;
}