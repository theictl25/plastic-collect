import { Trash2, Gift } from 'lucide-react';
import { Card } from '../common/Card';
import type { HistoryItem } from '../../types';

interface HistoryListProps {
  hist: HistoryItem[];
}

export function HistoryList({ hist }: HistoryListProps) {
  if (hist.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-gp-gray">
        No recent activities yet.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {hist.map((h, i) => {
        const isEarned = h.d > 0;
        return (
          <Card key={i} className="p-3 flex items-center gap-3 hover:border-emerald-200 transition">
            <span
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                isEarned ? 'bg-gp-l text-gp' : 'bg-amber-100 text-amber-600'
              }`}
            >
              {isEarned ? <Trash2 className="w-4 h-4" /> : <Gift className="w-4 h-4" />}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate text-gray-900">{h.t}</div>
              <div className="text-[11px] text-gp-gray">{h.when}</div>
            </div>
            <div
              className={`font-bold text-sm whitespace-nowrap ${
                isEarned ? 'text-gp' : 'text-red-700'
              }`}
            >
              {isEarned ? `+${h.d}` : h.d} pts
            </div>
          </Card>
        );
      })}
    </div>
  );
}
