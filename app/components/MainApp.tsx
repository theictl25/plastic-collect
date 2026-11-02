import { Header } from './layout/Header';
import { HomeView } from './home/HomeView';
import { MapView } from './map/MapView';
import { RewardsView } from './rewards/RewardsView';
import { HistoryView } from './history/HistoryView';
import { ProfileView } from './profile/ProfileView';
import { ScanFlow } from './scan/ScanFlow';
import { Toast } from './common/Toast';
import { useApp } from '../context/AppContext';

export function MainApp() {
  const { tab, isScanning, toast } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-gp-bg text-gray-900">
      {/* Top Navigation */}
      <Header />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        {isScanning ? (
          <ScanFlow />
        ) : tab === 'home' ? (
          <HomeView />
        ) : tab === 'map' ? (
          <MapView />
        ) : tab === 'rewards' ? (
          <RewardsView />
        ) : tab === 'history' ? (
          <HistoryView />
        ) : (
          <ProfileView />
        )}
      </main>

      {/* Notification Toast */}
      <Toast message={toast} />
    </div>
  );
}
