import { supabase } from './supabase.client';
import type { Bin, HistoryItem, Reward, RewardCategory, WasteType } from '../types';

const positions: Record<string, Pick<Bin, 'x' | 'y' | 't'>> = {
  'BIN-001': { x: 12, y: 38, t: 'plastic' }, 'BIN-002': { x: 30, y: 72, t: 'paper' },
  'BIN-003': { x: 46, y: 48, t: 'plastic' }, 'BIN-004': { x: 82, y: 28, t: 'metal' },
  'BIN-005': { x: 80, y: 62, t: 'other' }, 'BIN-006': { x: 60, y: 80, t: 'paper' },
  'BIN-007': { x: 22, y: 15, t: 'metal' },
};

const categoryEmoji: Record<RewardCategory, string> = { food: '🍱', merch: '🎁', discount: '🎟️' };

function category(value: string): RewardCategory {
  return value === 'food' || value === 'merch' ? value : 'discount';
}

async function requireCurrentUserId() {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) throw new Error('Enable Anonymous Sign-Ins in Supabase Auth before using this app.');
    if (!data.user) throw new Error('Unable to create a Supabase user session.');
    return data.user.id;
  }
  return sessionData.session.user.id;
}

export async function loadAppData(): Promise<{ bins: Bin[]; rewards: Reward[]; history: HistoryItem[]; points: number }> {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  const [binsResult, rewardsResult] = await Promise.all([
    supabase.from('bins').select('bin_code, status').order('bin_code'),
    supabase.from('rewards').select('id, name_th, name_en, category, points_cost, image_url').eq('is_active', true).order('points_cost'),
  ]);
  if (binsResult.error) throw binsResult.error;
  if (rewardsResult.error) throw rewardsResult.error;

  const bins = (binsResult.data ?? []).map((row, index): Bin => {
    const fallback = positions[row.bin_code] ?? { x: 20 + (index * 17) % 65, y: 20 + (index * 21) % 60, t: 'plastic' as WasteType };
    return { id: row.bin_code, ...fallback, ok: row.status === 'available', d: '' };
  });
  const rewards = (rewardsResult.data ?? []).map((row): Reward => {
    const cat = category(row.category);
    return { id: row.id, n: row.name_en || row.name_th, cat, p: row.points_cost, e: row.image_url || categoryEmoji[cat] };
  });
  if (!userId) return { bins, rewards, history: [], points: 0 };

  const [profileResult, ledgerResult] = await Promise.all([
    supabase.from('users').select('points_balance').eq('id', userId).single(),
    supabase.from('point_ledger').select('id, points_delta, note, created_at').eq('user_id', userId).order('created_at', { ascending: false }),
  ]);
  if (profileResult.error) throw profileResult.error;
  if (ledgerResult.error) throw ledgerResult.error;
  const history = (ledgerResult.data ?? []).map((row): HistoryItem => ({
    id: row.id,
    t: row.note || 'Green Point activity',
    when: new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(row.created_at)),
    d: row.points_delta,
  }));
  return { bins, rewards, history, points: profileResult.data.points_balance };
}

export async function recordRecycling(binCode: string) {
  await requireCurrentUserId();
  const { data, error } = await supabase.rpc('record_recycling', { p_bin_code: binCode, p_waste_type: 'plastic' });
  if (error) throw error;
  return data as { points_awarded: number; points_balance: number };
}

export async function redeemReward(rewardId: string) {
  await requireCurrentUserId();
  const { data, error } = await supabase.rpc('redeem_reward', { p_reward_id: rewardId });
  if (error) throw error;
  return data as { redemption_code: string; points_balance: number };
}
