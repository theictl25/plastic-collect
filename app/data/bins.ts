import type { Bin, WasteType } from '../types';

export const BINS: Bin[] = [
  { id: 'BIN-001', t: 'plastic', x: 12, y: 38, ok: true, d: '320 m' },
  { id: 'BIN-002', t: 'paper', x: 30, y: 72, ok: true, d: '210 m' },
  { id: 'BIN-003', t: 'plastic', x: 46, y: 48, ok: true, d: '120 m' },
  { id: 'BIN-004', t: 'metal', x: 82, y: 28, ok: true, d: '540 m' },
  { id: 'BIN-005', t: 'other', x: 80, y: 62, ok: false, d: '610 m' },
  { id: 'BIN-006', t: 'paper', x: 60, y: 80, ok: true, d: '380 m' },
  { id: 'BIN-007', t: 'metal', x: 22, y: 15, ok: true, d: '450 m' },
];

export const WASTE_TYPE_COLORS: Record<WasteType, string> = {
  plastic: 'bg-gp text-white',
  paper: 'bg-sky-600 text-white',
  metal: 'bg-orange-500 text-white',
  other: 'bg-gp-gray text-white',
};

export const WASTE_TYPE_NAMES: Record<WasteType, { lo: string; en: string }> = {
  plastic: { lo: 'ພລາສຕິກ', en: 'Plastic' },
  paper: { lo: 'ເຈ້ຍ', en: 'Paper' },
  metal: { lo: 'ໂລຫະ', en: 'Metal' },
  other: { lo: 'ອື່ນໆ', en: 'Other' },
};
