import { Star } from 'lucide-react';
import { Card } from '../common/Card';
import { useApp } from '../../context/AppContext';

export function UserStats() {
  const { points, history, t } = useApp();

  const totalKg = (
    12.5 +
    history.filter((h) => h.d > 0).length * 0.1
  ).toFixed(1);

  const totalVisits = 8 + history.filter((h) => h.new).length;

  return (
    <Card className="grid grid-cols-3 divide-x divide-gray-100 p-4">
      {/* Points */}
      <div className="flex items-center gap-3 px-2">
        <span className="w-10 h-10 rounded-full bg-amber-100 text-amber-500 flex items-center justify-center shrink-0">
          <Star className="w-5 h-5 fill-amber-500" />
        </span>
        <div>
          <div className="text-[11px] text-gp-gray font-medium">{t.mypts}</div>
          <div className="text-xl font-bold text-gray-900">
            {points} <span className="text-xs font-normal text-gp-gray">{t.pts}</span>
          </div>
        </div>
      </div>

      {/* Recycled weight */}
      <div className="px-3 sm:px-6">
        <div className="text-[11px] text-gp-gray font-medium">{t.recycled}</div>
        <div className="text-xl font-bold text-gray-900">
          {totalKg} <span className="text-xs font-normal text-gp-gray">kg</span>
        </div>
      </div>

      {/* Visits */}
      <div className="px-3 sm:px-6">
        <div className="text-[11px] text-gp-gray font-medium">{t.visits}</div>
        <div className="text-xl font-bold text-gray-900">
          {totalVisits} <span className="text-xs font-normal text-gp-gray">×</span>
        </div>
      </div>
    </Card>
  );
}
