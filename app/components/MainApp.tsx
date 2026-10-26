import { ShieldCheck } from 'lucide-react';
import { Header } from './layout/Header';
import { HomeView } from './home/HomeView';
import { MapView } from './map/MapView';
import { RewardsView } from './rewards/RewardsView';
import { HistoryView } from './history/HistoryView';
import { ScanFlow } from './scan/ScanFlow';
import { AdminDashboard } from './admin/AdminDashboard';
import { Toast } from './common/Toast';
import { useApp } from '../context/AppContext';

export function MainApp() {
  const { mode, setMode, tab, isScanning, toast } = useApp();

  if (mode === 'admin') {
    return (
      <>
        <AdminDashboard />
        <Toast message={toast} />
      </>
    );
  }

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
        ) : (
          <HistoryView />
        )}
      </main>

      {/* Mobile Floating Admin Button */}
      <button
        onClick={() => setMode('admin')}
        className="sm:hidden fixed right-4 bottom-4 bg-[#0f2a1d] text-white rounded-full p-3.5 shadow-xl z-20 hover:scale-105 active:scale-95 transition cursor-pointer"
        aria-label="Switch to Admin Panel"
      >
        <ShieldCheck className="w-5 h-5 text-emerald-400" />
      </button>

      {/* Notification Toast */}
      <Toast message={toast} />
    </div>
  );
}
