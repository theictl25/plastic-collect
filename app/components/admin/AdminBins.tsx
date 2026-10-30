import { useState, useEffect } from 'react';
import {
  Trash2,
  Plus,
  QrCode,
  MapPin,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Wrench,
  Grid,
  Map as MapIcon,
  X,
  Printer,
  Download,
  Database,
  Loader2,
} from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import type { WasteType } from '../../types';
import { WASTE_TYPE_COLORS, WASTE_TYPE_NAMES } from '../../data/bins';
import {
  fetchAdminBins,
  emptyBinInSupabase,
  createBinInSupabase,
  type DbBin,
} from '../../lib/admin.service';

export function AdminBins() {
  const [bins, setBins] = useState<DbBin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiveDb, setIsLiveDb] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Modals
  const [qrModalBin, setQrModalBin] = useState<DbBin | null>(null);
  const [addBinModalOpen, setAddBinModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // New bin form state
  const [newBinId, setNewBinId] = useState('');
  const [newBinName, setNewBinName] = useState('');
  const [newBinType, setNewBinType] = useState<WasteType>('plastic');
  const [newBinLocation, setNewBinLocation] = useState('');
  const [newBinCapacity, setNewBinCapacity] = useState('100');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  // Fetch Bins on mount
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      const res = await fetchAdminBins();
      if (isMounted) {
        setBins(res.data);
        setIsLiveDb(res.isLive);
        setIsLoading(false);
        setNewBinId(`BIN-00${res.data.length + 1}`);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredBins = bins.filter((bin) => {
    const matchesType = typeFilter === 'all' || bin.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || bin.status === statusFilter;
    return matchesType && matchesStatus;
  });

  const handleEmptyBin = async (binId: string) => {
    // Call Supabase update
    await emptyBinInSupabase(binId);

    setBins((prev) =>
      prev.map((b) => {
        if (b.id === binId) {
          showToast(`Bin ${b.id} has been emptied (0 kg) in Supabase.`);
          return {
            ...b,
            currentKg: 0,
            status: 'available',
            lastEmptied: 'Just now',
          };
        }
        return b;
      })
    );
  };

  const handleToggleMaintenance = (binId: string) => {
    setBins((prev) =>
      prev.map((b) => {
        if (b.id === binId) {
          const nextStatus = b.status === 'maintenance' ? 'available' : 'maintenance';
          showToast(`Bin ${b.id} set to ${nextStatus}.`);
          return { ...b, status: nextStatus };
        }
        return b;
      })
    );
  };

  const handleCreateBin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBinName || !newBinLocation) return;

    const binCode = newBinId.trim().toUpperCase();
    const capacity = parseInt(newBinCapacity, 10) || 100;

    // Call Supabase insert
    await createBinInSupabase({
      bin_code: binCode,
      name: newBinName.trim(),
      capacity_kg: capacity,
      address: newBinLocation.trim(),
    });

    const newBin: DbBin = {
      id: binCode,
      name: newBinName.trim(),
      type: newBinType,
      x: Math.floor(Math.random() * 60) + 20,
      y: Math.floor(Math.random() * 60) + 20,
      status: 'available',
      capacityKg: capacity,
      currentKg: 0,
      locationName: newBinLocation.trim(),
      lastEmptied: 'Never',
      isLiveDb: true,
    };

    setBins((prev) => [...prev, newBin]);
    showToast(`Bin ${newBin.id} saved to Supabase!`);
    setAddBinModalOpen(false);
    setNewBinName('');
    setNewBinLocation('');
    setNewBinId(`BIN-00${bins.length + 2}`);
  };

  return (
    <div className="space-y-5">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-gp-m" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid sm:grid-cols-4 gap-3">
        <Card className="p-4 flex items-center gap-3">
          <span className="w-11 h-11 rounded-xl bg-gp-l text-gp flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5" />
          </span>
          <div>
            <div className="text-xs text-gp-gray font-medium">Total Smart Bins</div>
            <div className="text-xl font-bold text-gray-900">
              {isLoading ? '...' : `${bins.length} Units`}
            </div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <span className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </span>
          <div>
            <div className="text-xs text-gp-gray font-medium">Available Normal</div>
            <div className="text-xl font-bold text-gray-900">
              {isLoading ? '...' : bins.filter((b) => b.status === 'available').length}
            </div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <span className="w-11 h-11 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </span>
          <div>
            <div className="text-xs text-gp-gray font-medium">Near Full (&gt;75%)</div>
            <div className="text-xl font-bold text-gray-900">
              {isLoading ? '...' : bins.filter((b) => b.status === 'near_full').length}
            </div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <span className="w-11 h-11 rounded-xl bg-red-100 text-red-700 flex items-center justify-center shrink-0">
            <Wrench className="w-5 h-5" />
          </span>
          <div>
            <div className="text-xs text-gp-gray font-medium">Full / Maintenance</div>
            <div className="text-xl font-bold text-gray-900">
              {isLoading ? '...' : bins.filter((b) => b.status === 'full' || b.status === 'maintenance').length}
            </div>
          </div>
        </Card>
      </div>

      {/* Control Bar: View switch + Filters + Add Bin button */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Toggle */}
            <div className="bg-gray-100 rounded-xl p-1 flex items-center gap-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gp-gray hover:text-gray-900'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>Grid View</span>
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  viewMode === 'map'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gp-gray hover:text-gray-900'
                }`}
              >
                <MapIcon className="w-3.5 h-3.5" />
                <span>Map View</span>
              </button>
            </div>

            {/* Supabase status badge */}
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

            {/* Waste Type filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 cursor-pointer focus:outline-none focus:border-gp"
            >
              <option value="all">All Waste Types</option>
              <option value="plastic">Plastic Bottles</option>
              <option value="paper">Paper</option>
              <option value="metal">Metal &amp; Cans</option>
              <option value="other">Other</option>
            </select>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 cursor-pointer focus:outline-none focus:border-gp"
            >
              <option value="all">All Statuses</option>
              <option value="available">Available</option>
              <option value="near_full">Near Full</option>
              <option value="full">Full</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>

          <Button
            onClick={() => setAddBinModalOpen(true)}
            className="text-xs px-3.5 py-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Smart Bin</span>
          </Button>
        </div>
      </Card>

      {/* Main Content: Loading or View */}
      {isLoading ? (
        <Card className="p-12 text-center text-gp-gray">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-gp" />
          <span>Fetching smart bins from Supabase...</span>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBins.map((bin) => {
            const fillPercentage = Math.min(100, Math.round((bin.currentKg / bin.capacityKg) * 100));
            const progressColor =
              fillPercentage >= 90
                ? 'bg-red-500'
                : fillPercentage >= 70
                ? 'bg-amber-500'
                : 'bg-gp';

            return (
              <Card key={bin.id} className="p-4 flex flex-col justify-between hover:border-gray-300 transition">
                <div>
                  {/* Card Header: Bin code + status pill */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 text-base">{bin.id}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                          WASTE_TYPE_COLORS[bin.type]
                        }`}
                      >
                        {WASTE_TYPE_NAMES[bin.type].en}
                      </span>
                    </div>

                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${
                        bin.status === 'available'
                          ? 'bg-emerald-50 text-emerald-700'
                          : bin.status === 'near_full'
                          ? 'bg-amber-50 text-amber-700'
                          : bin.status === 'full'
                          ? 'bg-red-50 text-red-700 font-bold animate-pulse'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {bin.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Bin location & details */}
                  <div className="flex items-center gap-1.5 text-xs text-gp-gray mb-3">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-gp" />
                    <span className="truncate">{bin.locationName}</span>
                  </div>

                  {/* Capacity Bar */}
                  <div className="bg-gray-50 p-3 rounded-xl mb-4 border border-gray-100">
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className="font-semibold text-gray-700">Capacity Load</span>
                      <span className="font-bold text-gray-900">
                        {bin.currentKg} / {bin.capacityKg} kg ({fillPercentage}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${progressColor} transition-all duration-500`}
                        style={{ width: `${fillPercentage}%` }}
                      />
                    </div>
                    <div className="text-[11px] text-gp-gray mt-1.5">
                      Last updated: <span className="font-medium text-gray-700">{bin.lastEmptied}</span>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 gap-2">
                  <button
                    onClick={() => setQrModalBin(bin)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5 text-gp" />
                    <span>Print QR</span>
                  </button>

                  <button
                    onClick={() => handleEmptyBin(bin.id)}
                    title="Mark as emptied"
                    className="flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Empty</span>
                  </button>

                  <button
                    onClick={() => handleToggleMaintenance(bin.id)}
                    title="Toggle maintenance"
                    className={`p-1.5 rounded-lg transition cursor-pointer ${
                      bin.status === 'maintenance'
                        ? 'bg-amber-100 text-amber-700'
                        : 'text-gp-gray hover:bg-gray-100'
                    }`}
                  >
                    <Wrench className="w-3.5 h-3.5" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Map View */
        <Card className="p-4">
          <div className="relative h-96 w-full rounded-xl overflow-hidden map-bg border border-emerald-950/20">
            <div className="absolute inset-0 roads opacity-60" />

            {/* Pins on map */}
            {filteredBins.map((b) => (
              <div
                key={b.id}
                style={{ left: `${b.x}%`, top: `${b.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                onClick={() => setQrModalBin(b)}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-white shadow-md border-2 border-white transition group-hover:scale-125 ${
                    b.status === 'full'
                      ? 'bg-red-600 animate-bounce'
                      : b.status === 'near_full'
                      ? 'bg-amber-500'
                      : 'bg-gp'
                  }`}
                >
                  <Trash2 className="w-4 h-4" />
                </div>

                {/* Popover badge on hover */}
                <div className="absolute bottom-11 left-1/2 -translate-x-1/2 hidden group-hover:block bg-gray-900 text-white text-[11px] font-semibold py-1 px-2.5 rounded-lg shadow-xl whitespace-nowrap z-20">
                  <div className="font-bold">{b.id} ({b.type})</div>
                  <div>{b.currentKg} kg ({Math.round((b.currentKg / b.capacityKg) * 100)}%)</div>
                </div>
              </div>
            ))}

            <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-xs px-3 py-2 rounded-xl text-xs font-semibold text-gray-800 shadow-sm flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-gp" /> Available
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Near Full
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600" /> Full / Urgent
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* QR Code Modal for Printing */}
      {qrModalBin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center border border-gray-100">
            <div className="flex justify-end">
              <button
                onClick={() => setQrModalBin(null)}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="inline-block p-4 bg-emerald-50 rounded-2xl border border-gp-l mb-3">
              <div className="w-44 h-44 bg-white p-3 rounded-xl border-2 border-gp shadow-inner flex flex-col items-center justify-center mx-auto">
                <QrCode className="w-32 h-32 text-gp" />
                <span className="font-mono text-xs font-bold text-gray-900 mt-1">
                  {qrModalBin.id}
                </span>
              </div>
            </div>

            <h3 className="font-bold text-lg text-gray-900">{qrModalBin.name}</h3>
            <p className="text-xs text-gp-gray mt-0.5">{qrModalBin.locationName}</p>

            <div className="mt-2 inline-block px-3 py-1 rounded-full text-xs font-bold text-white bg-gp">
              Accepted: {WASTE_TYPE_NAMES[qrModalBin.type]?.en || 'Recyclable'}
            </div>

            <p className="text-[11px] text-gp-gray mt-4">
              Scan this QR code with the Green Point app to earn points when recycling.
            </p>

            <div className="flex items-center gap-2 mt-5">
              <Button
                variant="outline"
                onClick={() => showToast(`Printing sticker for ${qrModalBin.id}...`)}
                className="flex-1 text-xs py-2"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Sticker</span>
              </Button>
              <Button
                onClick={() => showToast(`Downloaded QR Code (${qrModalBin.id}.png)`)}
                className="flex-1 text-xs py-2"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Bin Modal */}
      {addBinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-5 border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gp-l text-gp flex items-center justify-center">
                  <Trash2 className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-gray-900 text-base">Add New Smart Bin</h3>
              </div>
              <button
                onClick={() => setAddBinModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBin} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Bin Identifier
                  </label>
                  <input
                    type="text"
                    value={newBinId}
                    onChange={(e) => setNewBinId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-mono uppercase focus:outline-none focus:border-gp"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Waste Type
                  </label>
                  <select
                    value={newBinType}
                    onChange={(e) => setNewBinType(e.target.value as WasteType)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gp bg-white"
                  >
                    <option value="plastic">Plastic Bottle</option>
                    <option value="paper">Paper</option>
                    <option value="metal">Metal</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Bin Display Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Green Point – Science Bldg"
                  value={newBinName}
                  onChange={(e) => setNewBinName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gp"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Location / Floor / Landmark
                </label>
                <input
                  type="text"
                  placeholder="e.g. Science Complex, 2nd Floor Corridor"
                  value={newBinLocation}
                  onChange={(e) => setNewBinLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gp"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Max Capacity (kg)
                </label>
                <input
                  type="number"
                  value={newBinCapacity}
                  onChange={(e) => setNewBinCapacity(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gp"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setAddBinModalOpen(false)}
                  className="text-xs px-4 py-2"
                >
                  Cancel
                </Button>
                <Button type="submit" className="text-xs px-4 py-2">
                  Save to Supabase
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}