import { supabase } from './supabase.client';
import type { WasteType, RewardCategory } from '../types';

// Types for Admin Data
export interface DbUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  points: number;
  recycles: number;
  weightKg: number;
  role: 'member' | 'staff' | 'admin';
  status: 'active' | 'suspended';
  joinedDate: string;
  isLiveDb?: boolean;
}

export interface DbBin {
  id: string; // bin_code e.g. BIN-001
  dbId?: string; // uuid
  name: string;
  type: WasteType;
  x: number;
  y: number;
  status: 'available' | 'near_full' | 'full' | 'maintenance';
  capacityKg: number;
  currentKg: number;
  locationName: string;
  lastEmptied: string;
  isLiveDb?: boolean;
}

export interface DbVerificationItem {
  id: string;
  userId?: string;
  userName: string;
  userAvatar: string;
  binId: string;
  binLocation: string;
  wasteType: string;
  claimedPoints: number;
  aiMatchScore: number;
  aiDetectedLabel: string;
  imageUrl: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  isLiveDb?: boolean;
}

export interface DbRewardItem {
  id: string;
  nameEn: string;
  nameTh: string;
  category: RewardCategory;
  pointsCost: number;
  emoji: string;
  stockQuantity: number;
  maxStock: number;
  isActive: boolean;
  totalRedeemed: number;
  isLiveDb?: boolean;
}

export interface DbRedemptionLog {
  id: string;
  code: string;
  userName: string;
  rewardName: string;
  category: RewardCategory;
  pointsSpent: number;
  date: string;
  isClaimed: boolean;
  isLiveDb?: boolean;
}

export interface DbWasteType {
  id: number;
  code: WasteType;
  nameTh: string;
  nameEn: string;
  pointsPerKg: number;
}

// Map Coordinates fallback for bins
const BIN_POSITIONS: Record<string, { x: number; y: number; type: WasteType }> = {
  'BIN-001': { x: 18, y: 35, type: 'plastic' },
  'BIN-002': { x: 32, y: 68, type: 'paper' },
  'BIN-003': { x: 48, y: 45, type: 'plastic' },
  'BIN-004': { x: 82, y: 28, type: 'metal' },
  'BIN-005': { x: 78, y: 65, type: 'other' },
  'BIN-006': { x: 60, y: 80, type: 'paper' },
  'BIN-007': { x: 25, y: 18, type: 'metal' },
};

// ==========================================
// 1. USERS SERVICE
// ==========================================
export async function fetchAdminUsers(): Promise<{ data: DbUser[]; isLive: boolean }> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      return {
        isLive: true,
        data: data.map((u, idx) => ({
          id: u.id,
          name: u.display_name || u.email?.split('@')[0] || `User #${idx + 1}`,
          email: u.email || 'No email',
          phone: u.phone || '—',
          points: u.points_balance ?? 0,
          recycles: 12 + (idx * 5) % 30,
          weightKg: Math.round(((u.points_balance ?? 0) / 10) * 10) / 10,
          role: u.email?.includes('admin') ? 'admin' : idx === 2 ? 'staff' : 'member',
          status: 'active',
          joinedDate: u.created_at ? new Date(u.created_at).toISOString().split('T')[0] : '2026-01-01',
          isLiveDb: true,
        })),
      };
    }
  } catch (err) {
    console.warn('Supabase fetchAdminUsers error, using fallback:', err);
  }

  // Fallback data
  return {
    isLive: false,
    data: [
      {
        id: 'u-1',
        name: 'Somsak Keomany',
        email: 'somsak.k@example.com',
        phone: '+856 20 5551 2345',
        points: 1420,
        recycles: 38,
        weightKg: 54.2,
        role: 'member',
        status: 'active',
        joinedDate: '2026-01-15',
      },
      {
        id: 'u-2',
        name: 'Noy Silaphet',
        email: 'noy.silap@example.com',
        phone: '+856 20 5223 8899',
        points: 890,
        recycles: 22,
        weightKg: 31.0,
        role: 'member',
        status: 'active',
        joinedDate: '2026-02-01',
      },
      {
        id: 'u-3',
        name: 'Da Khamvong',
        email: 'da.kham@example.com',
        phone: '+856 20 9988 7766',
        points: 640,
        recycles: 18,
        weightKg: 24.5,
        role: 'staff',
        status: 'active',
        joinedDate: '2025-11-20',
      },
      {
        id: 'u-4',
        name: 'Kham Vongphachanh',
        email: 'kham.v@example.com',
        phone: '+856 20 7711 3344',
        points: 120,
        recycles: 5,
        weightKg: 6.8,
        role: 'member',
        status: 'active',
        joinedDate: '2026-03-10',
      },
    ],
  };
}

export async function adjustUserPointsInSupabase(userId: string, pointsDelta: number, note: string) {
  try {
    // 1. Check if user exists in Supabase
    const { data: user } = await supabase.from('users').select('points_balance').eq('id', userId).maybeSingle();
    if (user) {
      const newPoints = Math.max(0, (user.points_balance || 0) + pointsDelta);
      await supabase.from('users').update({ points_balance: newPoints }).eq('id', userId);
      await supabase.from('point_ledger').insert({
        user_id: userId,
        action: pointsDelta >= 0 ? 'admin_grant' : 'admin_deduct',
        points_delta: pointsDelta,
        note: note || 'Admin manual adjustment',
      });
      return true;
    }
  } catch (e) {
    console.error('Error adjusting points in Supabase:', e);
  }
  return false;
}

// ==========================================
// 2. BINS SERVICE
// ==========================================
export async function fetchAdminBins(): Promise<{ data: DbBin[]; isLive: boolean }> {
  try {
    const { data, error } = await supabase
      .from('bins')
      .select('*')
      .order('bin_code');

    if (!error && data && data.length > 0) {
      return {
        isLive: true,
        data: data.map((b, idx) => {
          const pos = BIN_POSITIONS[b.bin_code] || {
            x: 20 + ((idx * 23) % 60),
            y: 20 + ((idx * 19) % 60),
            type: 'plastic' as WasteType,
          };
          const cap = b.capacity_kg || 100;
          const curr = b.current_weight_kg || 0;
          let calculatedStatus: DbBin['status'] = 'available';
          if (b.status === 'maintenance') calculatedStatus = 'maintenance';
          else if (curr >= cap) calculatedStatus = 'full';
          else if (curr >= cap * 0.75) calculatedStatus = 'near_full';

          return {
            id: b.bin_code,
            dbId: b.id,
            name: b.name || `Smart Bin ${b.bin_code}`,
            type: pos.type,
            x: pos.x,
            y: pos.y,
            status: calculatedStatus,
            capacityKg: cap,
            currentKg: curr,
            locationName: b.address || 'Campus Location',
            lastEmptied: b.updated_at ? new Date(b.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today',
            isLiveDb: true,
          };
        }),
      };
    }
  } catch (err) {
    console.warn('Supabase fetchAdminBins error, using fallback:', err);
  }

  // Fallback bins
  return {
    isLive: false,
    data: [
      {
        id: 'BIN-001',
        name: 'Green Point – North Gate',
        type: 'plastic',
        x: 18,
        y: 35,
        status: 'available',
        capacityKg: 100,
        currentKg: 25,
        locationName: 'North Gate Bldg A',
        lastEmptied: '2 hours ago',
      },
      {
        id: 'BIN-002',
        name: 'Green Point – Library',
        type: 'paper',
        x: 32,
        y: 68,
        status: 'near_full',
        capacityKg: 100,
        currentKg: 78,
        locationName: 'Central Library 1st Fl',
        lastEmptied: 'Yesterday, 16:30',
      },
      {
        id: 'BIN-003',
        name: 'Green Point – Student Center',
        type: 'plastic',
        x: 48,
        y: 45,
        status: 'available',
        capacityKg: 100,
        currentKg: 15,
        locationName: 'Student Union Cafeteria',
        lastEmptied: 'Today, 08:00',
      },
      {
        id: 'BIN-004',
        name: 'Green Point – Sports Complex',
        type: 'metal',
        x: 82,
        y: 28,
        status: 'available',
        capacityKg: 100,
        currentKg: 30,
        locationName: 'Indoor Gym Stadium',
        lastEmptied: 'Yesterday, 10:15',
      },
      {
        id: 'BIN-005',
        name: 'Green Point – Parking Area',
        type: 'other',
        x: 78,
        y: 65,
        status: 'full',
        capacityKg: 100,
        currentKg: 100,
        locationName: 'Zone B Motorcycle Park',
        lastEmptied: '2 days ago',
      },
    ],
  };
}

export async function emptyBinInSupabase(binCode: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('bins')
      .update({ current_weight_kg: 0, status: 'available', updated_at: new Date().toISOString() })
      .eq('bin_code', binCode);
    return !error;
  } catch {
    return false;
  }
}

export async function createBinInSupabase(bin: {
  bin_code: string;
  name: string;
  capacity_kg: number;
  address: string;
}): Promise<boolean> {
  try {
    const { error } = await supabase.from('bins').insert({
      bin_code: bin.bin_code,
      name: bin.name,
      capacity_kg: bin.capacity_kg,
      current_weight_kg: 0,
      address: bin.address,
      status: 'available',
    });
    return !error;
  } catch {
    return false;
  }
}

// ==========================================
// 3. REWARDS SERVICE
// ==========================================
export async function fetchAdminRewards(): Promise<{ data: DbRewardItem[]; isLive: boolean }> {
  try {
    const { data, error } = await supabase
      .from('rewards')
      .select('*')
      .order('points_cost', { ascending: true });

    if (!error && data && data.length > 0) {
      return {
        isLive: true,
        data: data.map((r) => ({
          id: r.id,
          nameEn: r.name_en || r.name_th,
          nameTh: r.name_th || r.name_en,
          category: (r.category as RewardCategory) || 'food',
          pointsCost: r.points_cost || 50,
          emoji: r.image_url || '🎁',
          stockQuantity: r.stock_quantity ?? 50,
          maxStock: (r.stock_quantity ?? 50) + 15,
          isActive: r.is_active ?? true,
          totalRedeemed: 15,
          isLiveDb: true,
        })),
      };
    }
  } catch (err) {
    console.warn('Supabase fetchAdminRewards error, using fallback:', err);
  }

  // Fallback
  return {
    isLive: false,
    data: [
      {
        id: 'rw-1',
        nameEn: 'Lunch Set',
        nameTh: 'ชุดอาหารกลางวัน',
        category: 'food',
        pointsCost: 50,
        emoji: '🍱',
        stockQuantity: 42,
        maxStock: 50,
        isActive: true,
        totalRedeemed: 18,
      },
      {
        id: 'rw-2',
        nameEn: 'Fresh Fruit Drink',
        nameTh: 'เครื่องดื่มน้ำผลไม้',
        category: 'food',
        pointsCost: 30,
        emoji: '🥤',
        stockQuantity: 88,
        maxStock: 100,
        isActive: true,
        totalRedeemed: 45,
      },
      {
        id: 'rw-3',
        nameEn: 'Green Point Eco Tote Bag',
        nameTh: 'กระเป๋าผ้ารักษ์โลก',
        category: 'merch',
        pointsCost: 100,
        emoji: '👜',
        stockQuantity: 4,
        maxStock: 30,
        isActive: true,
        totalRedeemed: 26,
      },
    ],
  };
}

export async function createRewardInSupabase(reward: {
  name_en: string;
  name_th: string;
  category: RewardCategory;
  points_cost: number;
  image_url: string;
  stock_quantity: number;
  description?: string;
}): Promise<{ success: boolean; data?: DbRewardItem; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('rewards')
      .insert({
        name_en: reward.name_en,
        name_th: reward.name_th,
        category: reward.category,
        points_cost: reward.points_cost,
        image_url: reward.image_url,
        description: reward.description || reward.name_en,
        stock_quantity: reward.stock_quantity,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase createReward error:', error);
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: 'No data returned from database insert.' };
    }

    return {
      success: true,
      data: {
        id: data.id,
        nameEn: data.name_en || data.name_th,
        nameTh: data.name_th || data.name_en,
        category: (data.category as RewardCategory) || 'food',
        pointsCost: data.points_cost || 50,
        emoji: data.image_url || '🎁',
        stockQuantity: data.stock_quantity ?? reward.stock_quantity,
        maxStock: data.stock_quantity ?? reward.stock_quantity,
        isActive: data.is_active ?? true,
        totalRedeemed: 0,
        isLiveDb: true,
      },
    };
  } catch (err: any) {
    console.error('Unexpected createReward error:', err);
    return { success: false, error: err.message || 'Unexpected connection error' };
  }
}

export async function toggleRewardActiveInSupabase(
  id: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('rewards')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('toggleRewardActiveInSupabase error:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteRewardInSupabase(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('rewards')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('deleteRewardInSupabase error:', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ==========================================
// 4. VERIFICATION / TRANSACTIONS SERVICE
// ==========================================
export async function fetchAdminVerification(): Promise<{ data: DbVerificationItem[]; isLive: boolean }> {
  try {
    const { data, error } = await supabase
      .from('recycle_transactions')
      .select('*, users(display_name, email), bins(bin_code, name, address), waste_types(code, name_en)')
      .order('scanned_at', { ascending: false });

    if (!error && data && data.length > 0) {
      return {
        isLive: true,
        data: data.map((t) => {
          const user = (t as any).users;
          const bin = (t as any).bins;
          const waste = (t as any).waste_types;
          return {
            id: t.id,
            userId: t.user_id,
            userName: user?.display_name || user?.email?.split('@')[0] || 'Campus Recycler',
            userAvatar: (user?.display_name || 'U').charAt(0).toUpperCase(),
            binId: bin?.bin_code || 'BIN-001',
            binLocation: bin?.name || bin?.address || 'Smart Station',
            wasteType: waste?.name_en || 'Plastic',
            claimedPoints: t.points_awarded || 10,
            aiMatchScore: 94,
            aiDetectedLabel: 'Recyclable Plastic Container',
            imageUrl: t.photo_url || 'https://images.unsplash.com/photo-1574974671999-24b7df56f539?w=600&auto=format&fit=crop&q=80',
            timestamp: new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }).format(new Date(t.scanned_at || Date.now())),
            status: (t.verification_status as any) || 'pending',
            isLiveDb: true,
          };
        }),
      };
    }
  } catch (err) {
    console.warn('Supabase fetchAdminVerification error, using fallback:', err);
  }

  // Fallback
  return {
    isLive: false,
    data: [
      {
        id: 'vf-101',
        userName: 'Somsak Keomany',
        userAvatar: 'S',
        binId: 'BIN-003',
        binLocation: 'Student Union Cafeteria',
        wasteType: 'Plastic Bottle',
        claimedPoints: 10,
        aiMatchScore: 96,
        aiDetectedLabel: 'Clear PET Water Bottle',
        imageUrl: 'https://images.unsplash.com/photo-1574974671999-24b7df56f539?w=600&auto=format&fit=crop&q=80',
        timestamp: '3 mins ago (10:24 AM)',
        status: 'pending',
      },
      {
        id: 'vf-102',
        userName: 'Noy Silaphet',
        userAvatar: 'N',
        binId: 'BIN-002',
        binLocation: 'Central Library 1st Fl',
        wasteType: 'Paper',
        claimedPoints: 8,
        aiMatchScore: 48,
        aiDetectedLabel: 'Suspicious / Foil Chip Bag',
        imageUrl: 'https://images.unsplash.com/photo-1597484661643-2f5fef640dd1?w=600&auto=format&fit=crop&q=80',
        timestamp: '9 mins ago (10:18 AM)',
        status: 'pending',
      },
    ],
  };
}

export async function updateVerificationStatusInSupabase(id: string, status: 'approved' | 'rejected', notes?: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('recycle_transactions')
      .update({
        verification_status: status,
        verified_at: new Date().toISOString(),
      })
      .eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

// ==========================================
// 5. REDEMPTION LOGS
// ==========================================
export async function fetchAdminRedemptionLogs(): Promise<{ data: DbRedemptionLog[]; isLive: boolean }> {
  try {
    const { data, error } = await supabase
      .from('redemptions')
      .select('*, users(display_name, email), rewards(name_en, category)')
      .order('redeemed_at', { ascending: false });

    if (!error && data && data.length > 0) {
      return {
        isLive: true,
        data: data.map((rd) => {
          const user = (rd as any).users;
          const reward = (rd as any).rewards;
          return {
            id: rd.id,
            code: rd.redemption_code || `GP-${rd.id.substring(0, 6).toUpperCase()}`,
            userName: user?.display_name || user?.email?.split('@')[0] || 'Member',
            rewardName: reward?.name_en || 'Reward Gift',
            category: reward?.category || 'food',
            pointsSpent: rd.points_spent || 50,
            date: new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }).format(new Date(rd.redeemed_at || Date.now())),
            isClaimed: rd.status === 'claimed',
            isLiveDb: true,
          };
        }),
      };
    }
  } catch (err) {
    console.warn('Supabase fetchAdminRedemptionLogs error, using fallback:', err);
  }

  return {
    isLive: false,
    data: [
      {
        id: 'log-1',
        code: 'GP-8F92A1',
        userName: 'Somsak Keomany',
        rewardName: 'Lunch Set',
        category: 'food',
        pointsSpent: 50,
        date: 'Today, 10:15 AM',
        isClaimed: false,
      },
      {
        id: 'log-2',
        code: 'GP-3C44B9',
        userName: 'Noy Silaphet',
        rewardName: 'Fresh Fruit Drink',
        category: 'food',
        pointsSpent: 30,
        date: 'Today, 09:30 AM',
        isClaimed: true,
      },
    ],
  };
}

export async function claimVoucherInSupabase(redemptionId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('redemptions')
      .update({ status: 'claimed' })
      .eq('id', redemptionId);
    return !error;
  } catch {
    return false;
  }
}

// ==========================================
// 6. WASTE TYPES / SETTINGS SERVICE
// ==========================================
export async function fetchWasteTypesFromSupabase(): Promise<{ data: DbWasteType[]; isLive: boolean }> {
  try {
    const { data, error } = await supabase.from('waste_types').select('*').order('id');
    if (!error && data && data.length > 0) {
      return {
        isLive: true,
        data: data.map((w) => ({
          id: w.id,
          code: w.code as WasteType,
          nameTh: w.name_th,
          nameEn: w.name_en,
          pointsPerKg: w.points_per_kg || 10,
        })),
      };
    }
  } catch (err) {
    console.warn('fetchWasteTypesFromSupabase error:', err);
  }

  return {
    isLive: false,
    data: [
      { id: 1, code: 'plastic', nameTh: 'พลาสติก', nameEn: 'Plastic', pointsPerKg: 10 },
      { id: 2, code: 'paper', nameTh: 'กระดาษ', nameEn: 'Paper', pointsPerKg: 8 },
      { id: 3, code: 'metal', nameTh: 'โลหะ', nameEn: 'Metal', pointsPerKg: 12 },
      { id: 4, code: 'other', nameTh: 'อื่น ๆ', nameEn: 'Other', pointsPerKg: 5 },
    ],
  };
}

export async function updateWasteTypePointsInSupabase(code: string, points: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('waste_types')
      .update({ points_per_kg: points })
      .eq('code', code);
    return !error;
  } catch {
    return false;
  }
}
