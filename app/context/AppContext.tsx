import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import type {
  AppMode,
  TabType,
  Language,
  TranslationStrings,
  HistoryItem,
  Reward,
  Bin,
  UserProfile,
} from '../types';
import { TRANSLATIONS } from '../data/translations';
import { BINS } from '../data/bins';
import { REWARDS } from '../data/rewards';
import { loadAppData, recordRecycling, redeemReward, updateMyProfile } from '../lib/green-point.client';

interface AppContextType {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  tab: TabType;
  setTab: (tab: TabType) => void;
  lang: Language;
  setLang: (lang: Language) => void;
  t: TranslationStrings;
  points: number;
  profile: UserProfile | null;
  history: HistoryItem[];
  bins: Bin[];
  rewards: Reward[];
  isLoadingData: boolean;
  isScanning: boolean;
  scanBinId: string;
  startScan: (binId?: string) => void;
  cancelScan: () => void;
  handleScanComplete: (binId: string) => Promise<boolean>;
  handleRedeem: (reward: Reward) => Promise<boolean>;
  saveProfile: (input: { displayName: string; phone: string; avatarUrl: string }) => Promise<boolean>;
  toast: string;
  showToast: (message: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<AppMode>('user');
  const [tab, setTabState] = useState<TabType>('home');
  const [lang, setLang] = useState<Language>('th');
  const [points, setPoints] = useState<number>(0);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [bins, setBins] = useState<Bin[]>(BINS);
  const [rewards, setRewards] = useState<Reward[]>(REWARDS);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanBinId, setScanBinId] = useState<string>('BIN-003');
  const [toast, setToast] = useState<string>('');

  const [history, setHistory] = useState<HistoryItem[]>([]);

  const showToast = useCallback((message: string) => {
    setToast(message);
    const timer = setTimeout(() => {
      setToast('');
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const refreshAppData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const data = await loadAppData();
      setBins(data.bins);
      setRewards(data.rewards);
      setHistory(data.history);
      setPoints(data.points);
      setProfile(data.profile);
    } catch (error) {
      console.error('Supabase data load failed:', error);
      showToast(lang === 'th' ? 'ไม่สามารถดึงข้อมูลจาก Supabase ได้' : 'Unable to load data from Supabase');
    } finally {
      setIsLoadingData(false);
    }
  }, [lang, showToast]);

  useEffect(() => {
    void refreshAppData();
  }, [refreshAppData]);

  const setTab = useCallback((newTab: TabType) => {
    setIsScanning(false);
    setTabState(newTab);
  }, []);

  const startScan = useCallback((binId?: string) => {
    if (binId) {
      setScanBinId(binId);
    }
    setIsScanning(true);
  }, []);

  const cancelScan = useCallback(() => {
    setIsScanning(false);
  }, []);

  const handleScanComplete = useCallback(
    async (binId: string) => {
      try {
        const result = await recordRecycling(binId);
        await refreshAppData();
        setIsScanning(false);
        setTabState('history');
        showToast(lang === 'th' ? `ได้รับ +${result.points_awarded} แต้มสะสมแล้ว!` : `+${result.points_awarded} points earned!`);
        return true;
      } catch (error) {
        console.error('Supabase recycling save failed:', error);
        showToast(lang === 'th' ? 'บันทึกการทิ้งขยะไม่สำเร็จ' : 'Unable to save recycling activity');
        return false;
      }
    },
    [lang, refreshAppData, showToast]
  );

  const handleRedeem = useCallback(
    async (reward: Reward): Promise<boolean> => {
      if (points < reward.p) {
        showToast(lang === 'th' ? 'แต้มสะสมของคุณไม่เพียงพอ' : 'Not enough points');
        return false;
      }
      try {
        const result = await redeemReward(reward.id);
        await refreshAppData();
        showToast(lang === 'th' ? `แลกรางวัลสำเร็จ: ${reward.n} (${result.redemption_code})` : `Redeemed: ${reward.n} (${result.redemption_code})`);
        return true;
      } catch (error) {
        console.error('Supabase reward redemption failed:', error);
        showToast(lang === 'th' ? 'แลกรางวัลไม่สำเร็จ' : 'Unable to redeem reward');
        return false;
      }
    },
    [points, lang, refreshAppData, showToast]
  );

  const saveProfile = useCallback(async (input: { displayName: string; phone: string; avatarUrl: string }) => {
    if (!input.displayName.trim()) {
      showToast(lang === 'th' ? 'กรุณาระบุชื่อที่ต้องการแสดง' : 'Display name is required');
      return false;
    }
    try {
      await updateMyProfile(input);
      await refreshAppData();
      showToast(lang === 'th' ? 'บันทึกข้อมูลโปรไฟล์แล้ว' : 'Profile updated');
      return true;
    } catch (error) {
      console.error('Supabase profile update failed:', error);
      showToast(lang === 'th' ? 'บันทึกโปรไฟล์ไม่สำเร็จ' : 'Unable to update profile');
      return false;
    }
  }, [lang, refreshAppData, showToast]);

  const t = useMemo(() => TRANSLATIONS[lang], [lang]);

  const value = {
    mode,
    setMode,
    tab,
    setTab,
    lang,
    setLang,
    t,
    points,
    profile,
    history,
    bins,
    rewards,
    isLoadingData,
    isScanning,
    scanBinId,
    startScan,
    cancelScan,
    handleScanComplete,
    handleRedeem,
    saveProfile,
    toast,
    showToast,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
