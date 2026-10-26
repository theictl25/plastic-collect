import { useState, useMemo } from 'react';
import { Star, History } from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { useApp } from '../../context/AppContext';

export function RewardsView() {
  const { t, points, rewards, handleRedeem, setTab } = useApp();
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories = [
    { key: 'all', label: t.all },
    { key: 'food', label: 'Food & Drink' },
    { key: 'merch', label: 'Merchandise' },
    { key: 'discount', label: 'Discount' },
  ];

  const filteredRewards = useMemo(() => {
    return rewards.filter(
      (r) => activeCategory === 'all' || r.cat === activeCategory
    );
  }, [activeCategory]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{t.rewards}</h2>
        <p className="text-sm text-gp-gray">Use your points to redeem rewards</p>
      </div>

      {/* Points Summary Header */}
      <Card className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-12 h-12 rounded-full bg-amber-100 text-amber-500 flex items-center justify-center shrink-0">
            <Star className="w-6 h-6 fill-amber-500" />
          </span>
          <div>
            <div className="text-xs text-gp-gray font-medium">{t.mypts}</div>
            <div className="text-3xl font-bold text-gray-900">
              {points} <span className="text-base font-normal text-gp-gray">{t.pts}</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setTab('history')}
          className="hidden sm:flex items-center gap-2 text-sm text-gp border border-gp/30 rounded-xl px-4 py-2 hover:bg-gp-l transition cursor-pointer font-medium"
        >
          <History className="w-4 h-4" />
          <span>{t.redemptionHistory}</span>
        </button>
      </Card>

      {/* Category Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {categories.map((c) => {
          const isActive = activeCategory === c.key;
          return (
            <button
              key={c.key}
              onClick={() => setActiveCategory(c.key)}
              className={`shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer ${
                isActive
                  ? 'bg-gp text-white shadow-xs'
                  : 'bg-white text-gp-gray border border-gray-200 hover:border-gp hover:text-gp'
              }`}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      {/* Rewards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {filteredRewards.map((reward) => {
          const canRedeem = points >= reward.p;
          return (
            <Card
              key={reward.id}
              className="overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition duration-200 flex flex-col justify-between"
            >
              <div className="h-28 bg-gradient-to-br from-emerald-50 to-amber-50 flex items-center justify-center text-5xl select-none">
                {reward.e}
              </div>

              <div className="p-3.5 space-y-2">
                <div className="font-semibold text-sm text-gray-900 line-clamp-1">
                  {reward.n}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-amber-600 font-bold text-sm flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>{reward.p} pts</span>
                  </span>

                  <Button
                    disabled={!canRedeem}
                    onClick={() => void handleRedeem(reward)}
                    className="text-xs px-3 py-1.5 shadow-none"
                  >
                    {t.redeem}
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
