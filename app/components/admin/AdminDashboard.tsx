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
  Plus,
  Leaf,
  Star,
} from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Logo } from '../common/Logo';
import { useApp } from '../../context/AppContext';
import type { AdminNavType } from '../../types';

export function AdminDashboard() {
  const { setMode, t } = useApp();
  const [activeRange, setActiveRange] = useState<number>(0);
  const [activeNav, setActiveNav] = useState<AdminNavType>('Dashboard');

  const dataSets = [
    [40, 55, 48, 70, 64, 90, 82],
    [30, 45, 50, 60, 58, 72, 80, 76, 95, 88],
    [20, 35, 40, 52, 60, 75, 85, 92, 100, 110],
  ];

  const currentData = dataSets[activeRange];
  const chartWidth = 500;
  const chartHeight = 140;

  const points = currentData.map((val, idx) => [
    idx * (chartWidth / (currentData.length - 1)),
    chartHeight - val * 1.15,
  ]);
  const polylinePoints = points.map((p) => p.join(',')).join(' ');

  const navItems: Array<{ id: AdminNavType; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'Users', label: 'Users', icon: Users },
    { id: 'Bins', label: 'Bins', icon: Trash2 },
    { id: 'Verification', label: 'Verification', icon: ShieldCheck },
    { id: 'Rewards', label: 'Rewards', icon: Gift },
    { id: 'Reports', label: 'Reports', icon: FileText },
    { id: 'Settings', label: 'Settings', icon: Settings },
  ];

  const stats = [
    {
      icon: Users,
      label: 'Total Users',
      value: '1,248',
      color: 'bg-gp-l text-gp',
    },
    {
      icon: Leaf,
      label: 'Today Disposal',
      value: '356 kg',
      color: 'bg-emerald-100 text-gp',
    },
    {
      icon: Star,
      label: 'Total Points',
      value: '42,680',
      color: 'bg-amber-100 text-amber-500',
    },
  ];

  const wasteTypes = [
    { label: 'Plastic Bottle', value: 68, color: 'bg-gp' },
    { label: 'Paper', value: 15, color: 'bg-sky-500' },
    { label: 'Metal', value: 100, color: 'bg-orange-500' },
    { label: 'Glass', value: 80, color: 'bg-gp-m' },
    { label: 'Other', value: 60, color: 'bg-gp-gray' },
  ];

  const recentRows = [
    ['10:24', 'Somsak', 'BIN-003', 'Plastic', '+10'],
    ['10:12', 'Noy', 'BIN-007', 'Plastic', '+10'],
    ['09:45', 'Da', 'BIN-002', 'Paper', '+8'],
    ['09:30', 'Kham', 'BIN-005', 'Plastic', '+10'],
    ['09:20', 'May', 'BIN-001', 'Metal', '+6'],
  ];

  return (
    <div className="min-h-screen md:flex bg-gp-bg">
      {/* Sidebar */}
      <aside className="md:w-64 bg-[#0f2a1d] text-white md:min-h-screen shrink-0 border-r border-emerald-950/40">
        <div className="p-4 flex items-center justify-between md:block border-b border-white/10 md:border-b-0">
          <Logo sub="Admin Panel" />
          <button
            onClick={() => setMode('user')}
            className="md:hidden text-xs bg-white/10 hover:bg-white/20 rounded-lg px-3 py-1.5 transition cursor-pointer"
          >
            {t.userView}
          </button>
        </div>

        <nav className="flex md:flex-col overflow-x-auto md:overflow-visible p-3 gap-1 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className={`shrink-0 flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer ${
                  isActive
                    ? 'bg-gp text-white shadow-sm'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-6 space-y-5 min-w-0">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">{activeNav}</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMode('user')}
              className="hidden md:block text-xs font-semibold text-gp border border-gp rounded-lg px-3 py-1.5 hover:bg-gp-l transition cursor-pointer"
            >
              {t.userView}
            </button>
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gp-gray shadow-xs">
              <Bell className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
              <span className="w-8 h-8 rounded-full bg-gp text-white flex items-center justify-center font-bold">
                A
              </span>
              <span>Admin</span>
            </div>
          </div>
        </div>

        {/* Top 3 Stat Cards */}
        <div className="grid sm:grid-cols-3 gap-3">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.label} className="p-4 flex items-center gap-3">
                <span
                  className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${s.color}`}
                >
                  <Icon className="w-5 h-5" />
                </span>
                <div>
                  <div className="text-xs text-gp-gray font-medium">{s.label}</div>
                  <div className="text-2xl font-bold text-gray-900">{s.value}</div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Charts & Breakdown */}
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Disposal Statistics SVG Chart */}
          <Card className="lg:col-span-2 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="font-bold text-gray-900">Disposal Statistics</div>
              <div className="flex bg-gray-100 rounded-lg p-0.5 text-xs font-semibold">
                {['7d', '30d', '3m'].map((label, idx) => (
                  <button
                    key={label}
                    onClick={() => setActiveRange(idx)}
                    className={`px-3 py-1 rounded-md transition cursor-pointer ${
                      activeRange === idx
                        ? 'bg-gp text-white shadow-xs'
                        : 'text-gp-gray hover:text-gray-900'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="w-full overflow-hidden">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight + 10}`}
                className="w-full h-44 overflow-visible"
              >
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22C55E" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#22C55E" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal grid lines */}
                {[0, 1, 2].map((i) => (
                  <line
                    key={i}
                    x1="0"
                    x2={chartWidth}
                    y1={10 + i * 55}
                    y2={10 + i * 55}
                    stroke="#e5e7eb"
                    strokeDasharray="4 4"
                  />
                ))}

                {/* Area Fill */}
                <polygon
                  points={`0,${chartHeight} ${polylinePoints} ${chartWidth},${chartHeight}`}
                  fill="url(#chartGradient)"
                />

                {/* Stroke Line */}
                <polyline
                  points={polylinePoints}
                  fill="none"
                  stroke="#15803D"
                  strokeWidth="3"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />

                {/* Data points */}
                {points.map((p, i) => (
                  <circle
                    key={i}
                    cx={p[0]}
                    cy={p[1]}
                    r="4"
                    fill="#ffffff"
                    stroke="#15803D"
                    strokeWidth="2.5"
                  />
                ))}
              </svg>
            </div>
          </Card>

          {/* Waste Type Breakdown */}
          <Card className="p-5 flex flex-col justify-between">
            <div>
              <div className="font-bold text-gray-900 mb-3">Waste Type</div>
              <div className="space-y-3">
                {wasteTypes.map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-gray-700">{item.label}</span>
                      <span className="text-gp-gray font-semibold">{item.value}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-2 rounded-full ${item.color} transition-all duration-500`}
                        style={{ width: `${item.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button className="w-full mt-4 py-2.5 text-sm">
              <Plus className="w-4 h-4" />
              <span>Add reward</span>
            </Button>
          </Card>
        </div>

        {/* Recent Activities Table */}
        <Card className="p-5">
          <div className="font-bold text-gray-900 mb-3">Recent Activities</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[420px]">
              <thead>
                <tr className="text-left text-xs text-gp-gray border-b border-gray-100">
                  <th className="py-2.5 font-semibold">Time</th>
                  <th className="font-semibold">User</th>
                  <th className="font-semibold">Bin</th>
                  <th className="font-semibold">Type</th>
                  <th className="text-right font-semibold">Pts</th>
                </tr>
              </thead>
              <tbody>
                {recentRows.map((row) => (
                  <tr
                    key={row[0] + row[1]}
                    className="border-b border-gray-50 hover:bg-gray-50/60 transition"
                  >
                    <td className="py-2.5 text-gp-gray">{row[0]}</td>
                    <td className="font-semibold text-gray-900">{row[1]}</td>
                    <td className="text-gp font-medium">{row[2]}</td>
                    <td>{row[3]}</td>
                    <td className="text-right font-bold text-gp">{row[4]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </main>
    </div>
  );
}
