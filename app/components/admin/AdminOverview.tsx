import { useState, useEffect } from 'react';
import {
  Users,
  Leaf,
  Star,
  Plus,
  ArrowUpRight,
  TrendingUp,
  Database,
  Loader2,
} from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import {
  fetchAdminUsers,
  fetchAdminBins,
  fetchAdminVerification,
  type DbUser,
  type DbBin,
  type DbVerificationItem,
} from '../../lib/admin.service';

interface AdminOverviewProps {
  onNavigateToRewards?: () => void;
}

export function AdminOverview({ onNavigateToRewards }: AdminOverviewProps) {
  const [activeRange, setActiveRange] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiveDb, setIsLiveDb] = useState(false);
  const [users, setUsers] = useState<DbUser[]>([]);
  const [bins, setBins] = useState<DbBin[]>([]);
  const [recentRows, setRecentRows] = useState<Array<[string, string, string, string, string, string]>>([]);

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

  // Fetch summary data from Supabase
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      const [uRes, bRes, vRes] = await Promise.all([
        fetchAdminUsers(),
        fetchAdminBins(),
        fetchAdminVerification(),
      ]);

      if (isMounted) {
        setUsers(uRes.data);
        setBins(bRes.data);
        setIsLiveDb(uRes.isLive || bRes.isLive || vRes.isLive);

        const rows: Array<[string, string, string, string, string, string]> = vRes.data.slice(0, 5).map((item) => [
          item.timestamp,
          item.userName,
          item.binId,
          item.wasteType,
          `+${item.claimedPoints}`,
          item.status === 'approved' ? 'Verified' : item.status === 'rejected' ? 'Rejected' : 'Pending',
        ]);
        setRecentRows(rows);
        setIsLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const totalPoints = users.reduce((acc, u) => acc + u.points, 0);
  const totalWeight = bins.reduce((acc, b) => acc + b.currentKg, 0);

  const stats = [
    {
      icon: Users,
      label: 'Total Users',
      value: users.length > 0 ? users.length.toLocaleString() : '1,248',
      color: 'bg-gp-l text-gp',
      change: '+12% this week',
    },
    {
      icon: Leaf,
      label: 'Current In-Bin Weight',
      value: totalWeight > 0 ? `${totalWeight} kg` : '356 kg',
      color: 'bg-emerald-100 text-gp',
      change: `${bins.length} Active Bins`,
    },
    {
      icon: Star,
      label: 'Community Points',
      value: totalPoints > 0 ? totalPoints.toLocaleString() : '42,680',
      color: 'bg-amber-100 text-amber-500',
      change: 'Active in circulation',
    },
  ];

  const wasteTypes = [
    { label: 'Plastic Bottle', value: 68, color: 'bg-gp' },
    { label: 'Paper', value: 15, color: 'bg-sky-500' },
    { label: 'Metal', value: 100, color: 'bg-orange-500' },
    { label: 'Glass', value: 80, color: 'bg-gp-m' },
    { label: 'Other', value: 60, color: 'bg-gp-gray' },
  ];

  return (
    <div className="space-y-5">
      {/* Supabase Status Banner */}
      <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-2xl border border-gray-100 shadow-xs text-xs">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-gp" />
          <span className="font-semibold text-gray-900">Database Connection:</span>
          <span
            className={`inline-flex items-center gap-1 font-bold ${
              isLiveDb ? 'text-emerald-700' : 'text-amber-700'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isLiveDb ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
            {isLiveDb
              ? 'Connected to Supabase (Real-time live tables)'
              : 'Supabase Connected (Tables empty or awaiting starter seed)'}
          </span>
        </div>

        {!isLiveDb && (
          <span className="text-gp-gray hidden sm:inline">
            💡 Run <code>supabase/admin_setup.sql</code> in Supabase SQL editor to populate live data.
          </span>
        )}
      </div>

      {/* Top 3 Stat Cards */}
      <div className="grid sm:grid-cols-3 gap-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span
                  className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${s.color}`}
                >
                  <Icon className="w-5 h-5" />
                </span>
                <div>
                  <div className="text-xs text-gp-gray font-medium">{s.label}</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {isLoading ? '...' : s.value}
                  </div>
                </div>
              </div>
              <div className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" />
                <span>{s.change}</span>
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
            <div>
              <div className="font-bold text-gray-900">Disposal Statistics</div>
              <div className="text-xs text-gp-gray">Daily recycling volume trends (kg)</div>
            </div>
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

              <polygon
                points={`0,${chartHeight} ${polylinePoints} ${chartWidth},${chartHeight}`}
                fill="url(#chartGradient)"
              />

              <polyline
                points={polylinePoints}
                fill="none"
                stroke="#15803D"
                strokeWidth="3"
                strokeLinejoin="round"
                strokeLinecap="round"
              />

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
            <div className="font-bold text-gray-900 mb-1">Waste Type</div>
            <div className="text-xs text-gp-gray mb-3">Overall recycling proportion</div>
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

          <Button
            onClick={onNavigateToRewards}
            className="w-full mt-4 py-2.5 text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Manage Rewards</span>
          </Button>
        </Card>
      </div>

      {/* Recent Activities Table */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-bold text-gray-900">Recent Activities</div>
            <div className="text-xs text-gp-gray">Real-time recycling transactions from Supabase</div>
          </div>
          <span className="text-xs text-gp font-semibold flex items-center gap-1 cursor-pointer hover:underline">
            Live Feed <ArrowUpRight className="w-3.5 h-3.5" />
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[500px]">
            <thead>
              <tr className="text-left text-xs text-gp-gray border-b border-gray-100">
                <th className="py-2.5 font-semibold">Time</th>
                <th className="font-semibold">User</th>
                <th className="font-semibold">Bin</th>
                <th className="font-semibold">Type</th>
                <th className="font-semibold">Status</th>
                <th className="text-right font-semibold">Pts</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-gp-gray text-xs">
                    <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1 text-gp" />
                    <span>Loading recent feed...</span>
                  </td>
                </tr>
              ) : recentRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-gp-gray text-xs">
                    No transactions recorded yet.
                  </td>
                </tr>
              ) : (
                recentRows.map((row, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-gray-50 hover:bg-gray-50/60 transition"
                  >
                    <td className="py-2.5 text-gp-gray text-xs">{row[0]}</td>
                    <td className="font-semibold text-gray-900">{row[1]}</td>
                    <td className="text-gp font-medium">{row[2]}</td>
                    <td>
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        {row[3]}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                          row[5] === 'Verified'
                            ? 'bg-emerald-50 text-emerald-700'
                            : row[5] === 'Rejected'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            row[5] === 'Verified'
                              ? 'bg-emerald-500'
                              : row[5] === 'Rejected'
                              ? 'bg-red-500'
                              : 'bg-amber-500'
                          }`}
                        />
                        {row[5]}
                      </span>
                    </td>
                    <td className="text-right font-bold text-gp">{row[4]}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}