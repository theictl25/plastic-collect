import { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Leaf,
  Globe,
  TreeDeciduous,
  Award,
  Clock,
  CheckCircle2,
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

export function AdminReports() {
  const [selectedRange, setSelectedRange] = useState<'7d' | '30d' | '3m' | '1y'>('30d');
  const [isLoading, setIsLoading] = useState(true);
  const [isLiveDb, setIsLiveDb] = useState(false);
  const [users, setUsers] = useState<DbUser[]>([]);
  const [bins, setBins] = useState<DbBin[]>([]);
  const [toastMsg, setToastMsg] = useState('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      const [uRes, bRes] = await Promise.all([
        fetchAdminUsers(),
        fetchAdminBins(),
      ]);
      if (isMounted) {
        setUsers(uRes.data);
        setBins(bRes.data);
        setIsLiveDb(uRes.isLive || bRes.isLive);
        setIsLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Mock metrics by range
  const metricsMap = {
    '7d': {
      recycledKg: '385',
      co2Reduced: '730',
      trees: '33',
      points: '12,450',
      change: '+14% vs prev week',
      chartData: [40, 52, 60, 48, 70, 85, 92],
    },
    '30d': {
      recycledKg: '1,482',
      co2Reduced: '2,845',
      trees: '128',
      points: '48,600',
      change: '+18% vs prev month',
      chartData: [20, 35, 45, 50, 65, 80, 95, 110, 105, 125, 140],
    },
    '3m': {
      recycledKg: '4,620',
      co2Reduced: '8,780',
      trees: '398',
      points: '142,300',
      change: '+26% vs prev quarter',
      chartData: [60, 75, 90, 85, 110, 130, 145, 160, 180],
    },
    '1y': {
      recycledKg: '18,500',
      co2Reduced: '35,150',
      trees: '1,590',
      points: '580,000',
      change: '+42% year-on-year',
      chartData: [40, 55, 70, 90, 110, 130, 150, 175, 200, 220, 240, 260],
    },
  };

  const currentMetric = metricsMap[selectedRange];

  // SVG Chart calculation
  const chartWidth = 560;
  const chartHeight = 150;
  const maxVal = Math.max(...currentMetric.chartData);
  const points = currentMetric.chartData.map((val, idx) => [
    idx * (chartWidth / (currentMetric.chartData.length - 1)),
    chartHeight - (val / (maxVal * 1.15)) * chartHeight,
  ]);
  const polylinePoints = points.map((p) => p.join(',')).join(' ');

  const wasteDistribution = [
    { label: 'Plastic Bottles (PET)', weight: '860 kg', percent: 58, color: 'bg-gp' },
    { label: 'Clean Paper & Cardboard', weight: '326 kg', percent: 22, color: 'bg-sky-500' },
    { label: 'Aluminum Cans & Metal', weight: '178 kg', percent: 12, color: 'bg-orange-500' },
    { label: 'Glass Bottles & Other', weight: '118 kg', percent: 8, color: 'bg-gp-m' },
  ];

  // Top recyclers from loaded users
  const topRecyclers = users.slice(0, 5).map((u, index) => ({
    rank: index + 1,
    name: u.name,
    weight: `${u.weightKg} kg`,
    points: `${u.points.toLocaleString()} pts`,
    badge: index === 0 ? '🥇 Top Recycler' : index === 1 ? '🥈 Silver Member' : index === 2 ? '🥉 Bronze Member' : '⭐ Green Star',
  }));

  const peakHours = [
    { time: '11:30 - 13:30', label: 'Lunch Break Drop-offs', percent: 42, color: 'bg-gp' },
    { time: '16:30 - 18:00', label: 'After School & Work', percent: 35, color: 'bg-emerald-500' },
    { time: '08:00 - 09:30', label: 'Morning Campus Arrival', percent: 15, color: 'bg-teal-500' },
    { time: 'Other Times', label: 'Midday / Evening', percent: 8, color: 'bg-gray-400' },
  ];

  return (
    <div className="space-y-5">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-gp-m" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Date Range Selector & Export Header */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-gp-gray flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-gp" />
              <span>Reporting Period:</span>
            </span>
            <div className="flex bg-gray-100 rounded-xl p-1 text-xs font-semibold">
              {[
                { id: '7d', label: 'Last 7 Days' },
                { id: '30d', label: 'Last 30 Days' },
                { id: '3m', label: 'Last 3 Months' },
                { id: '1y', label: 'This Year' },
              ].map((range) => (
                <button
                  key={range.id}
                  onClick={() => setSelectedRange(range.id as any)}
                  className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                    selectedRange === range.id
                      ? 'bg-white text-gray-900 shadow-xs'
                      : 'text-gp-gray hover:text-gray-900'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>

            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold ${
                isLiveDb
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>{isLiveDb ? 'Live Supabase' : 'Offline Mode'}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => showToast('Generated Environmental Impact CSV file.')}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-gp-gray" />
              <span>Export CSV</span>
            </button>
            <Button
              onClick={() => showToast('Generated ESG Executive Summary (PDF).')}
              className="text-xs px-3.5 py-2"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Executive PDF Report</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* ESG Impact KPI Cards */}
      <div className="grid sm:grid-cols-4 gap-3">
        <Card className="p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-gp-gray font-medium">Recycled Weight</div>
            <div className="text-2xl font-bold text-gray-900 mt-0.5">
              {currentMetric.recycledKg} <span className="text-sm font-semibold text-gp-gray">kg</span>
            </div>
            <div className="text-[11px] font-semibold text-emerald-600 mt-1 flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />
              <span>{currentMetric.change}</span>
            </div>
          </div>
          <span className="w-12 h-12 rounded-xl bg-gp-l text-gp flex items-center justify-center shrink-0">
            <Leaf className="w-6 h-6" />
          </span>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-gp-gray font-medium">CO2 Emission Offset</div>
            <div className="text-2xl font-bold text-gray-900 mt-0.5">
              {currentMetric.co2Reduced} <span className="text-sm font-semibold text-gp-gray">kg CO2e</span>
            </div>
            <div className="text-[11px] text-gp-gray mt-1">Verified emission savings</div>
          </div>
          <span className="w-12 h-12 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
            <Globe className="w-6 h-6" />
          </span>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-gp-gray font-medium">Trees Equivalent</div>
            <div className="text-2xl font-bold text-gray-900 mt-0.5">
              {currentMetric.trees} <span className="text-sm font-semibold text-gp-gray">Trees</span>
            </div>
            <div className="text-[11px] text-gp-gray mt-1">Annual carbon absorption</div>
          </div>
          <span className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <TreeDeciduous className="w-6 h-6" />
          </span>
        </Card>

        <Card className="p-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-gp-gray font-medium">Points Distributed</div>
            <div className="text-2xl font-bold text-gray-900 mt-0.5">
              {currentMetric.points}
            </div>
            <div className="text-[11px] text-amber-600 font-semibold mt-1">89% active redemption</div>
          </div>
          <span className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </span>
        </Card>
      </div>

      {/* Main Charts: Trend + Waste breakdown */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Trend Area Chart */}
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900 text-base">Recycling Growth &amp; Trajectory</h3>
              <p className="text-xs text-gp-gray">Daily collected waste in kg over the selected timeframe</p>
            </div>
            <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-gp">
              Trend: Upward +18.4%
            </span>
          </div>

          <div className="w-full overflow-hidden">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight + 15}`}
              className="w-full h-48 overflow-visible"
            >
              <defs>
                <linearGradient id="reportGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22C55E" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#22C55E" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {[0, 1, 2, 3].map((i) => (
                <line
                  key={i}
                  x1="0"
                  x2={chartWidth}
                  y1={15 + i * 40}
                  y2={15 + i * 40}
                  stroke="#e5e7eb"
                  strokeDasharray="4 4"
                />
              ))}

              <polygon
                points={`0,${chartHeight} ${polylinePoints} ${chartWidth},${chartHeight}`}
                fill="url(#reportGrad)"
              />

              <polyline
                points={polylinePoints}
                fill="none"
                stroke="#0A7B4F"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {points.map((p, i) => (
                <circle
                  key={i}
                  cx={p[0]}
                  cy={p[1]}
                  r="4.5"
                  fill="#ffffff"
                  stroke="#0A7B4F"
                  strokeWidth="2.5"
                />
              ))}
            </svg>
          </div>
        </Card>

        {/* Waste Breakdown Card */}
        <Card className="p-5 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-gray-900 text-base mb-1">Waste Type Proportion</h3>
            <p className="text-xs text-gp-gray mb-4">Volume distribution by material type</p>

            <div className="space-y-3.5">
              {wasteDistribution.map((w) => (
                <div key={w.label}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-gray-800">{w.label}</span>
                    <span className="text-gp font-bold">{w.weight} ({w.percent}%)</span>
                  </div>
                  <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${w.color} transition-all duration-500`}
                      style={{ width: `${w.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 p-3 bg-gp-l/50 rounded-xl border border-gp-l text-xs text-gp-d">
            💡 <strong>Observation:</strong> Plastic bottle collection makes up the bulk (&gt;50%) of all campus deposits.
          </div>
        </Card>
      </div>

      {/* Secondary Row: Top Recyclers & Busiest Hours */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Top Recyclers Leaderboard */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900 text-base">Top Recyclers Leaderboard</h3>
              <p className="text-xs text-gp-gray">Highest volume contributors from database</p>
            </div>
            <Award className="w-5 h-5 text-amber-500" />
          </div>

          <div className="divide-y divide-gray-100">
            {isLoading ? (
              <div className="py-6 text-center text-gp-gray text-xs">
                <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1 text-gp" />
                <span>Loading leaderboard...</span>
              </div>
            ) : topRecyclers.length === 0 ? (
              <div className="py-6 text-center text-gp-gray text-xs">No recyclers recorded yet.</div>
            ) : (
              topRecyclers.map((user) => (
                <div key={user.rank} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center font-bold text-sm text-gp-gray">
                      #{user.rank}
                    </span>
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">{user.name}</div>
                      <div className="text-[11px] text-gp-gray">{user.badge}</div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-gp text-sm">{user.weight}</div>
                    <div className="text-xs text-amber-600 font-medium">{user.points}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Busiest Drop-off Hours Analysis */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-gray-900 text-base">Busiest Drop-Off Windows</h3>
              <p className="text-xs text-gp-gray">Peak usage periods across campus smart bins</p>
            </div>
            <Clock className="w-5 h-5 text-gp" />
          </div>

          <div className="space-y-4">
            {peakHours.map((h) => (
              <div key={h.time}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <div>
                    <span className="font-bold text-gray-900">{h.time}</span>
                    <span className="text-gp-gray ml-2">({h.label})</span>
                  </div>
                  <span className="font-bold text-gp">{h.percent}% of deposits</span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${h.color} transition-all duration-500`}
                    style={{ width: `${h.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-gray-50 rounded-xl text-xs text-gp-gray border border-gray-100">
            Recommended janitorial collection schedule: <strong>13:45 PM</strong> and <strong>18:15 PM</strong>.
          </div>
        </Card>
      </div>
    </div>
  );
}