import { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Trash2,
  ShieldCheck,
  Gift,
  FileText,
  Settings,
  Bell,
} from 'lucide-react';
import { Logo } from '../common/Logo';
import { useApp } from '../../context/AppContext';
import type { AdminNavType } from '../../types';

// Child admin page components
import { AdminOverview } from './AdminOverview';
import { AdminUsers } from './AdminUsers';
import { AdminBins } from './AdminBins';
import { AdminVerification } from './AdminVerification';
import { AdminRewards } from './AdminRewards';
import { AdminReports } from './AdminReports';
import { AdminSettings } from './AdminSettings';

export function AdminDashboard() {
  const { setMode, t } = useApp();
  const [activeNav, setActiveNav] = useState<AdminNavType>('Dashboard');

  const navItems: Array<{
    id: AdminNavType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }> = [
    { id: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'Users', label: 'Users', icon: Users },
    { id: 'Bins', label: 'Bins', icon: Trash2 },
    { id: 'Verification', label: 'Verification', icon: ShieldCheck, badge: '3' },
    { id: 'Rewards', label: 'Rewards', icon: Gift },
    { id: 'Reports', label: 'Reports', icon: FileText },
    { id: 'Settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen md:flex bg-gp-bg">
      {/* Sidebar */}
      <aside className="md:w-64 bg-[#0f2a1d] text-white md:min-h-screen shrink-0 border-r border-emerald-950/40 flex flex-col justify-between">
        <div>
          {/* Logo & Mobile Mode Switch */}
          <div className="p-4 flex items-center justify-between md:block border-b border-white/10 md:border-b-0">
            <Logo sub="Admin Portal" />
            <button
              onClick={() => setMode('user')}
              className="md:hidden text-xs bg-white/10 hover:bg-white/20 rounded-lg px-3 py-1.5 transition cursor-pointer"
            >
              {t.userView}
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="flex md:flex-col overflow-x-auto md:overflow-visible p-3 gap-1 no-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveNav(item.id)}
                  className={`shrink-0 flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer ${
                    isActive
                      ? 'bg-gp text-white shadow-sm'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="hidden md:inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-400 text-gray-950">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer info */}
        <div className="hidden md:block p-4 border-t border-white/10 text-xs text-white/50">
          <div>Green Point v1.2</div>
          <div className="text-[11px] text-white/40 mt-0.5">Admin Management Console</div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-6 space-y-5 min-w-0">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{activeNav}</h2>
            <p className="text-xs text-gp-gray mt-0.5">
              {activeNav === 'Dashboard' && 'System overview and real-time recycling activity'}
              {activeNav === 'Users' && 'Manage members, points balance, and account permissions'}
              {activeNav === 'Bins' && 'Monitor smart bin capacities, fill levels, and print QR codes'}
              {activeNav === 'Verification' && 'Inspect photo submissions and confirm recycling points'}
              {activeNav === 'Rewards' && 'Manage reward catalog stock and handle voucher redemptions'}
              {activeNav === 'Reports' && 'ESG sustainability metrics, carbon offset, and trends'}
              {activeNav === 'Settings' && 'Configure point rules, anti-fraud limits, and alerts'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setMode('user')}
              className="hidden md:block text-xs font-semibold text-gp border border-gp rounded-lg px-3 py-1.5 hover:bg-gp-l transition cursor-pointer"
            >
              {t.userView}
            </button>
            <div className="relative w-8 h-8 rounded-full bg-white flex items-center justify-center text-gp-gray shadow-xs cursor-pointer hover:text-gray-900">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500" />
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
              <span className="w-8 h-8 rounded-full bg-gp text-white flex items-center justify-center font-bold shadow-xs">
                A
              </span>
              <span className="hidden sm:inline">Admin</span>
            </div>
          </div>
        </div>

        {/* Dynamic Nav View Rendering */}
        {activeNav === 'Dashboard' && (
          <AdminOverview onNavigateToRewards={() => setActiveNav('Rewards')} />
        )}
        {activeNav === 'Users' && <AdminUsers />}
        {activeNav === 'Bins' && <AdminBins />}
        {activeNav === 'Verification' && <AdminVerification />}
        {activeNav === 'Rewards' && <AdminRewards />}
        {activeNav === 'Reports' && <AdminReports />}
        {activeNav === 'Settings' && <AdminSettings />}
      </main>
    </div>
  );
}