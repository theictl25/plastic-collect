export type WasteType = 'plastic' | 'paper' | 'metal' | 'other';

export interface Bin {
  id: string;
  t: WasteType;
  x: number; // percentage X position on map
  y: number; // percentage Y position on map
  ok: boolean; // available or full
  d: string; // distance string (e.g. '320 m')
}

export type RewardCategory = 'food' | 'merch' | 'discount';

export interface Reward {
  id: number;
  n: string;
  cat: RewardCategory;
  p: number; // required points
  e: string; // emoji icon
}

export interface HistoryItem {
  id?: string;
  t: string; // title / description
  when: string; // date string
  d: number; // point difference (+10 or -50)
  new?: number | boolean;
}

export type Language = 'th' | 'en';

export type TabType = 'home' | 'map' | 'rewards' | 'history';

export type AppMode = 'user' | 'admin';

export type AdminNavType =
  | 'Dashboard'
  | 'Users'
  | 'Bins'
  | 'Verification'
  | 'Rewards'
  | 'Reports'
  | 'Settings';

export interface TranslationStrings {
  home: string;
  map: string;
  rewards: string;
  history: string;
  tagline: string;
  pts: string;
  nearby: string;
  scan: string;
  photo: string;
  earn: string;
  redeem: string;
  find: string;
  mypts: string;
  recycled: string;
  visits: string;
  recent: string;
  all: string;
  plastic: string;
  paper: string;
  metal: string;
  other: string;
  available: string;
  full: string;
  viewScan: string;
  myLocation: string;
  searchBin: string;
  noBins: string;
  scanQrTitle: string;
  scanInstruction: string;
  enterManual: string;
  go: string;
  simulateScan: string;
  photoCaptured: string;
  takePhoto: string;
  retake: string;
  continueBtn: string;
  confirmDisposal: string;
  pointsEarned: string;
  viewHistory: string;
  thankYou: string;
  binId: string;
  wasteType: string;
  dateTime: string;
  photoAttached: string;
  attached: string;
  redemptionHistory: string;
  userView: string;
}
