import { MapPin } from 'lucide-react';
import { HeroBanner } from './HeroBanner';
import { QuickActions } from './QuickActions';
import { UserStats } from './UserStats';
import { Button } from '../common/Button';
import { HistoryList } from '../history/HistoryList';
import { useApp } from '../../context/AppContext';

export function HomeView() {
  const { t, setTab, history } = useApp();

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <HeroBanner />

      {/* Quick Action Grid */}
      <QuickActions />

      {/* Main Action: Find Nearby Bins */}
      <Button
        onClick={() => setTab('map')}
        className="w-full bg-gp hover:bg-gp-d text-white py-4 text-base shadow-md"
      >
        <MapPin className="w-5 h-5" />
        <span>{t.find}</span>
      </Button>

      {/* Summary Statistics */}
      <UserStats />

      {/* Recent Activity & Featured Reward Card */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <h3 className="font-bold text-gray-900 mb-2">{t.recent}</h3>
          <HistoryList hist={history.slice(0, 3)} />
        </div>

        <button
          onClick={() => setTab('rewards')}
          className="rounded-2xl overflow-hidden bg-gradient-to-r from-orange-100 to-amber-50 border border-orange-200/60 p-5 flex items-center justify-between text-left hover:shadow-md hover:-translate-y-0.5 transition duration-200 cursor-pointer h-full"
        >
          <div>
            <div className="text-lg font-bold text-gray-900">Lunch Set & Drink</div>
            <div className="text-xs font-semibold text-gp mt-1">{t.redeem} →</div>
          </div>
          <div className="text-6xl drop-shadow-sm select-none">🍱</div>
        </button>
      </div>
    </div>
  );
}
