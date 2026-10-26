import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type {
  AppMode,
  TabType,
  Language,
  TranslationStrings,
  HistoryItem,
  Reward,
} from '../types';
import { TRANSLATIONS } from '../data/translations';

interface AppContextType {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  tab: TabType;
  setTab: (tab: TabType) => void;
  lang: Language;
  setLang: (lang: Language) => void;
  t: TranslationStrings;
  points: number;
  setPoints: React.Dispatch<React.SetStateAction<number>>;
  history: HistoryItem[];
  isScanning: boolean;
  scanBinId: string;
  startScan: (binId?: string) => void;
  cancelScan: () => void;
  handleScanComplete: (binId: string) => void;
  handleRedeem: (reward: Reward) => boolean;
  toast: string;
  showToast: (message: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<AppMode>('user');
  const [tab, setTabState] = useState<TabType>('home');
  const [lang, setLang] = useState<Language>('th');
  const [points, setPoints] = useState<number>(320);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanBinId, setScanBinId] = useState<string>('BIN-003');
  const [toast, setToast] = useState<string>('');

  const [history, setHistory] = useState<HistoryItem[]>([
    { t: 'BIN-003 · Plastic', when: '22 Oct 2026 10:24', d: 10 },
    { t: 'Lunch Set & Drink', when: '20 Oct 2026 12:30', d: -50 },
  ]);

  const showToast = useCallback((message: string) => {
    setToast(message);
    const timer = setTimeout(() => {
      setToast('');
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

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
    (binId: string) => {
      setPoints((prev) => prev + 10);
      setHistory((prev) => [
        {
          t: `${binId} · Plastic`,
          when: new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          d: 10,
          new: 1,
        },
        ...prev,
      ]);
      setIsScanning(false);
      setTabState('history');
      showToast(lang === 'th' ? 'ได้รับ +10 แต้มสะสมแล้ว!' : '+10 points earned!');
    },
    [lang, showToast]
  );

  const handleRedeem = useCallback(
    (reward: Reward): boolean => {
      if (points < reward.p) {
        showToast(lang === 'th' ? 'แต้มสะสมของคุณไม่เพียงพอ' : 'Not enough points');
        return false;
      }
      setPoints((prev) => prev - reward.p);
      setHistory((prev) => [
        {
          t: reward.n,
          when: new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          d: -reward.p,
        },
        ...prev,
      ]);
      showToast(
        lang === 'th'
          ? `แลกรางวัลสำเร็จ: ${reward.n}`
          : `Redeemed: ${reward.n}`
      );
      return true;
    },
    [points, lang, showToast]
  );

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
    setPoints,
    history,
    isScanning,
    scanBinId,
    startScan,
    cancelScan,
    handleScanComplete,
    handleRedeem,
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
