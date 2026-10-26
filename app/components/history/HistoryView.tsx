import { HistoryList } from './HistoryList';
import { useApp } from '../../context/AppContext';

export function HistoryView() {
  const { history, t } = useApp();

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">{t.history}</h2>
        <p className="text-sm text-gp-gray">All your recycling activities and redeemed rewards</p>
      </div>
      <HistoryList hist={history} />
    </div>
  );
}
