import { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  Coins,
  Shield,
  Bell,
  Users,
  Building,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  AlertTriangle,
  Database,
  Loader2,
} from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import {
  fetchWasteTypesFromSupabase,
  updateWasteTypePointsInSupabase,
  type DbWasteType,
} from '../../lib/admin.service';

interface AdminMember {
  id: string;
  name: string;
  email: string;
  role: 'Super Admin' | 'Verifier / Staff';
  addedDate: string;
}

export function AdminSettings() {
  const [activeTab, setActiveTab] = useState<'points' | 'antifraud' | 'alerts' | 'team' | 'org'>('points');
  const [showToast, setShowToast] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLiveDb, setIsLiveDb] = useState(false);

  // 1. Points Matrix
  const [plasticPoints, setPlasticPoints] = useState('10');
  const [paperPoints, setPaperPoints] = useState('8');
  const [metalPoints, setMetalPoints] = useState('12');
  const [otherPoints, setOtherPoints] = useState('5');

  // 2. Anti-fraud
  const [cooldownSeconds, setCooldownSeconds] = useState('60');
  const [dailyPointCap, setDailyPointCap] = useState('300');
  const [requirePhotoVerification, setRequirePhotoVerification] = useState(true);
  const [enableGpsGeofence, setEnableGpsGeofence] = useState(true);

  // 3. Bin Alerts
  const [nearFullThreshold, setNearFullThreshold] = useState('80');
  const [criticalFullThreshold, setCriticalFullThreshold] = useState('95');
  const [alertEmail, setAlertEmail] = useState('maintenance@greenpoint.org');
  const [enableLineNotify, setEnableLineNotify] = useState(true);
  const [enableInAppAlert, setEnableInAppAlert] = useState(true);

  // 4. Team
  const [teamMembers, setTeamMembers] = useState<AdminMember[]>([
    {
      id: 'adm-1',
      name: 'System Admin (You)',
      email: 'admin@greenpoint.org',
      role: 'Super Admin',
      addedDate: '2025-10-01',
    },
    {
      id: 'adm-2',
      name: 'Da Khamvong (Field Verifier)',
      email: 'da.kham@example.com',
      role: 'Verifier / Staff',
      addedDate: '2025-11-20',
    },
  ]);

  // 5. Org
  const [orgName, setOrgName] = useState('Green Point National University Campus');
  const [supportPhone, setSupportPhone] = useState('+856 20 5551 2345');
  const [contactEmail, setContactEmail] = useState('support@greenpoint.org');

  const triggerToast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(''), 3000);
  };

  // Fetch waste types from Supabase
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      const res = await fetchWasteTypesFromSupabase();
      if (isMounted) {
        setIsLiveDb(res.isLive);
        res.data.forEach((w) => {
          if (w.code === 'plastic') setPlasticPoints(String(w.pointsPerKg));
          if (w.code === 'paper') setPaperPoints(String(w.pointsPerKg));
          if (w.code === 'metal') setMetalPoints(String(w.pointsPerKg));
          if (w.code === 'other') setOtherPoints(String(w.pointsPerKg));
        });
        setIsLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSaveAll = async (e: React.FormEvent) => {
    e.preventDefault();

    // Update in Supabase
    await Promise.all([
      updateWasteTypePointsInSupabase('plastic', parseInt(plasticPoints, 10) || 10),
      updateWasteTypePointsInSupabase('paper', parseInt(paperPoints, 10) || 8),
      updateWasteTypePointsInSupabase('metal', parseInt(metalPoints, 10) || 12),
      updateWasteTypePointsInSupabase('other', parseInt(otherPoints, 10) || 5),
    ]);

    triggerToast('Settings saved and synchronized with Supabase!');
  };

  return (
    <div className="space-y-5">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-gp-m" />
          <span>{showToast}</span>
        </div>
      )}

      {/* Header bar with Save button */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl overflow-x-auto no-scrollbar">
              {[
                { id: 'points', label: 'Point Rules', icon: Coins },
                { id: 'antifraud', label: 'Anti-Fraud', icon: Shield },
                { id: 'alerts', label: 'Bin Alerts', icon: Bell },
                { id: 'team', label: 'Admin Team', icon: Users },
                { id: 'org', label: 'Organization', icon: Building },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                      activeTab === tab.id
                        ? 'bg-white text-gray-900 shadow-xs'
                        : 'text-gp-gray hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
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

          <Button
            onClick={handleSaveAll}
            className="text-xs px-4 py-2 shrink-0"
          >
            <Save className="w-4 h-4" />
            <span>Save to Supabase</span>
          </Button>
        </div>
      </Card>

      {/* Tab 1: Point Rules */}
      {activeTab === 'points' && (
        <Card className="p-6">
          <div className="mb-5 pb-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 text-base">Waste Type &amp; Points Matrix</h3>
            <p className="text-xs text-gp-gray mt-0.5">
              Configured directly with the <code>public.waste_types</code> table in Supabase.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 max-w-2xl">
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-gray-900 text-sm">Plastic Bottle (PET)</span>
                <span className="text-xs font-semibold px-2 py-0.5 bg-gp text-white rounded-md">
                  plastic
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={plasticPoints}
                  onChange={(e) => setPlasticPoints(e.target.value)}
                  className="w-24 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gp focus:outline-none focus:border-gp"
                />
                <span className="text-xs text-gp-gray font-medium">Points per deposit</span>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-gray-900 text-sm">Paper &amp; Cardboard</span>
                <span className="text-xs font-semibold px-2 py-0.5 bg-sky-600 text-white rounded-md">
                  paper
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={paperPoints}
                  onChange={(e) => setPaperPoints(e.target.value)}
                  className="w-24 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gp focus:outline-none focus:border-gp"
                />
                <span className="text-xs text-gp-gray font-medium">Points per deposit</span>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-gray-900 text-sm">Metal / Aluminum Can</span>
                <span className="text-xs font-semibold px-2 py-0.5 bg-orange-500 text-white rounded-md">
                  metal
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={metalPoints}
                  onChange={(e) => setMetalPoints(e.target.value)}
                  className="w-24 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gp focus:outline-none focus:border-gp"
                />
                <span className="text-xs text-gp-gray font-medium">Points per deposit</span>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-gray-900 text-sm">Glass &amp; Other Materials</span>
                <span className="text-xs font-semibold px-2 py-0.5 bg-gp-gray text-white rounded-md">
                  other
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={otherPoints}
                  onChange={(e) => setOtherPoints(e.target.value)}
                  className="w-24 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gp focus:outline-none focus:border-gp"
                />
                <span className="text-xs text-gp-gray font-medium">Points per deposit</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Tab 2: Anti-Fraud */}
      {activeTab === 'antifraud' && (
        <Card className="p-6">
          <div className="mb-5 pb-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 text-base">Anti-Fraud &amp; Abuse Prevention</h3>
            <p className="text-xs text-gp-gray mt-0.5">
              Prevent rapid QR scanning abuse, fraudulent photos, and automated bots.
            </p>
          </div>

          <div className="space-y-4 max-w-xl">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Cooldown Between Scans (Seconds)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={cooldownSeconds}
                  onChange={(e) => setCooldownSeconds(e.target.value)}
                  className="w-28 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gp"
                />
                <span className="text-xs text-gp-gray">
                  Users must wait this long before scanning the same bin again.
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Daily Point Cap per Member (Pts)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={dailyPointCap}
                  onChange={(e) => setDailyPointCap(e.target.value)}
                  className="w-28 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gp"
                />
                <span className="text-xs text-gp-gray">
                  Maximum total points a single user can accumulate in 24 hours.
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 space-y-3">
              <label className="flex items-center gap-3 text-xs font-semibold text-gray-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requirePhotoVerification}
                  onChange={(e) => setRequirePhotoVerification(e.target.checked)}
                  className="accent-gp w-4 h-4 rounded cursor-pointer"
                />
                <span>Require camera photo proof on all disposals</span>
              </label>

              <label className="flex items-center gap-3 text-xs font-semibold text-gray-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableGpsGeofence}
                  onChange={(e) => setEnableGpsGeofence(e.target.checked)}
                  className="accent-gp w-4 h-4 rounded cursor-pointer"
                />
                <span>Validate user GPS coordinates within 50m of bin location</span>
              </label>
            </div>
          </div>
        </Card>
      )}

      {/* Tab 3: Bin Alerts */}
      {activeTab === 'alerts' && (
        <Card className="p-6">
          <div className="mb-5 pb-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 text-base">Smart Bin Capacity Alerts</h3>
            <p className="text-xs text-gp-gray mt-0.5">
              Automated notifications sent to janitorial and field collection staff.
            </p>
          </div>

          <div className="space-y-4 max-w-xl">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Near Full Warning Trigger (%)
                </label>
                <input
                  type="number"
                  value={nearFullThreshold}
                  onChange={(e) => setNearFullThreshold(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gp"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Critical Full Alarm (%)
                </label>
                <input
                  type="number"
                  value={criticalFullThreshold}
                  onChange={(e) => setCriticalFullThreshold(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gp"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Dispatch Notification Email
              </label>
              <input
                type="email"
                value={alertEmail}
                onChange={(e) => setAlertEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gp"
              />
            </div>

            <div className="pt-2 space-y-2.5">
              <label className="flex items-center gap-2.5 text-xs font-semibold text-gray-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableInAppAlert}
                  onChange={(e) => setEnableInAppAlert(e.target.checked)}
                  className="accent-gp w-4 h-4 rounded cursor-pointer"
                />
                <span>Show in-app header alert badge when any bin exceeds 80%</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs font-semibold text-gray-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableLineNotify}
                  onChange={(e) => setEnableLineNotify(e.target.checked)}
                  className="accent-gp w-4 h-4 rounded cursor-pointer"
                />
                <span>Send LINE Notify message to custodial team group</span>
              </label>
            </div>
          </div>
        </Card>
      )}

      {/* Tab 4: Team */}
      {activeTab === 'team' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
            <div>
              <h3 className="font-bold text-gray-900 text-base">Admin Team &amp; Verifiers</h3>
              <p className="text-xs text-gp-gray mt-0.5">
                Staff accounts with elevated access to review photos, approve points, and manage bins.
              </p>
            </div>
            <Button
              onClick={() => triggerToast('Invited new admin member.')}
              className="text-xs px-3 py-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Invite Staff</span>
            </Button>
          </div>

          <div className="divide-y divide-gray-100">
            {teamMembers.map((member) => (
              <div key={member.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{member.name}</div>
                  <div className="text-xs text-gp-gray">{member.email} • Added {member.addedDate}</div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-md ${
                      member.role === 'Super Admin'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {member.role}
                  </span>
                  {member.role !== 'Super Admin' && (
                    <button
                      onClick={() => {
                        setTeamMembers((prev) => prev.filter((m) => m.id !== member.id));
                        triggerToast(`Removed ${member.name}`);
                      }}
                      className="text-gp-gray hover:text-red-600 p-1 rounded-md transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tab 5: Org */}
      {activeTab === 'org' && (
        <Card className="p-6">
          <div className="mb-5 pb-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900 text-base">Organization &amp; Campus Profile</h3>
            <p className="text-xs text-gp-gray mt-0.5">
              Contact and branding information displayed in the member application.
            </p>
          </div>

          <div className="space-y-4 max-w-xl">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Organization / Campus Name
              </label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gp"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Support Hotline
                </label>
                <input
                  type="text"
                  value={supportPhone}
                  onChange={(e) => setSupportPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gp"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Support Email
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gp"
                />
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}