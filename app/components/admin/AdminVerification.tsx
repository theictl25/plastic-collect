import { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  Eye,
  AlertTriangle,
  Clock,
  Sparkles,
  Camera,
  Coins,
  MapPin,
  X,
  CheckCircle2,
  Filter,
  Database,
  Loader2,
} from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import {
  fetchAdminVerification,
  updateVerificationStatusInSupabase,
  type DbVerificationItem,
} from '../../lib/admin.service';

export function AdminVerification() {
  const [items, setItems] = useState<DbVerificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiveDb, setIsLiveDb] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [selectedItem, setSelectedItem] = useState<DbVerificationItem | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState('');
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Fetch from Supabase
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      const res = await fetchAdminVerification();
      if (isMounted) {
        setItems(res.data);
        setIsLiveDb(res.isLive);
        setIsLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const pendingCount = items.filter((i) => i.status === 'pending').length;
  const approvedCount = items.filter((i) => i.status === 'approved').length;
  const rejectedCount = items.filter((i) => i.status === 'rejected').length;

  const filteredItems = items.filter((item) => item.status === activeTab);

  const handleApprove = async (id: string) => {
    // Call Supabase update
    await updateVerificationStatusInSupabase(id, 'approved');

    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          triggerToast(`Approved +${item.claimedPoints} pts for ${item.userName} in Supabase`);
          return { ...item, status: 'approved' };
        }
        return item;
      })
    );
    if (selectedItem?.id === id) setSelectedItem(null);
  };

  const handleBatchApproveHighConfidence = () => {
    let count = 0;
    setItems((prev) =>
      prev.map((item) => {
        if (item.status === 'pending' && item.aiMatchScore >= 90) {
          count++;
          void updateVerificationStatusInSupabase(item.id, 'approved');
          return { ...item, status: 'approved' };
        }
        return item;
      })
    );
    triggerToast(`Batch approved ${count} submissions with high AI confidence!`);
  };

  const handleOpenRejectModal = (item: DbVerificationItem) => {
    setSelectedItem(item);
    setRejectReasonInput('The submitted item does not match recyclable plastic specifications.');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    await updateVerificationStatusInSupabase(selectedItem.id, 'rejected', rejectReasonInput);

    setItems((prev) =>
      prev.map((item) => {
        if (item.id === selectedItem.id) {
          return {
            ...item,
            status: 'rejected',
            rejectionReason: rejectReasonInput,
          };
        }
        return item;
      })
    );

    triggerToast(`Rejected submission from ${selectedItem.userName} in Supabase`);
    setRejectModalOpen(false);
    setSelectedItem(null);
  };

  return (
    <div className="space-y-5">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-gp-m" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid sm:grid-cols-4 gap-3">
        <Card className="p-4 flex items-center gap-3">
          <span className="w-11 h-11 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </span>
          <div>
            <div className="text-xs text-gp-gray font-medium">Pending Review</div>
            <div className="text-xl font-bold text-gray-900">
              {isLoading ? '...' : `${pendingCount} Items`}
            </div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <span className="w-11 h-11 rounded-xl bg-gp-l text-gp flex items-center justify-center shrink-0">
            <CheckCircle className="w-5 h-5" />
          </span>
          <div>
            <div className="text-xs text-gp-gray font-medium">Approved Items</div>
            <div className="text-xl font-bold text-gray-900">
              {isLoading ? '...' : `${approvedCount} Scans`}
            </div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <span className="w-11 h-11 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
            <XCircle className="w-5 h-5" />
          </span>
          <div>
            <div className="text-xs text-gp-gray font-medium">Rejected Claims</div>
            <div className="text-xl font-bold text-gray-900">
              {isLoading ? '...' : `${rejectedCount} Items`}
            </div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <span className="w-11 h-11 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </span>
          <div>
            <div className="text-xs text-gp-gray font-medium">AI Verification Rate</div>
            <div className="text-xl font-bold text-gray-900">92.4% Match</div>
          </div>
        </Card>
      </div>

      {/* Controls: Tab selector + Supabase indicator + Batch action */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'pending'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gp-gray hover:text-gray-900'
                }`}
              >
                <span>Pending Review</span>
                <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded-full text-[10px] font-bold">
                  {pendingCount}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('approved')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'approved'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gp-gray hover:text-gray-900'
                }`}
              >
                <span>Approved</span>
                <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
                  {approvedCount}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('rejected')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'rejected'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gp-gray hover:text-gray-900'
                }`}
              >
                <span>Rejected</span>
                <span className="px-1.5 py-0.2 bg-red-100 text-red-800 rounded-full text-[10px] font-bold">
                  {rejectedCount}
                </span>
              </button>
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

          {activeTab === 'pending' && (
            <Button
              onClick={handleBatchApproveHighConfidence}
              className="text-xs px-3.5 py-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Approve All High AI Match (&ge;90%)</span>
            </Button>
          )}
        </div>
      </Card>

      {/* Verification Queue Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="bg-gray-50/80 text-left text-xs text-gp-gray border-b border-gray-100 font-semibold">
                <th className="py-3 px-4">Proof Photo</th>
                <th className="py-3 px-4">Member &amp; Time</th>
                <th className="py-3 px-4">Bin &amp; Waste Type</th>
                <th className="py-3 px-4">AI Vision Match</th>
                <th className="py-3 px-4">Points</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gp-gray">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-gp" />
                    <span>Loading verification queue from Supabase...</span>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gp-gray text-sm">
                    No verification records in this tab.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition">
                    {/* Thumbnail */}
                    <td className="py-3 px-4">
                      <div
                        onClick={() => setSelectedItem(item)}
                        className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 cursor-pointer group shrink-0"
                      >
                        <img
                          src={item.imageUrl}
                          alt="Proof"
                          className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                          <Eye className="w-4 h-4" />
                        </div>
                      </div>
                    </td>

                    {/* Member & Time */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-900">{item.userName}</div>
                      <div className="text-[11px] text-gp-gray">{item.timestamp}</div>
                    </td>

                    {/* Bin & Waste */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-medium text-gray-900">
                        <span className="font-bold text-gp">{item.binId}</span>
                        <span>•</span>
                        <span>{item.wasteType}</span>
                      </div>
                      <div className="text-[11px] text-gp-gray flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-gp" />
                        <span>{item.binLocation}</span>
                      </div>
                    </td>

                    {/* AI Vision Match */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              item.aiMatchScore >= 80
                                ? 'bg-gp'
                                : item.aiMatchScore >= 50
                                ? 'bg-amber-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${item.aiMatchScore}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-gray-800">
                          {item.aiMatchScore}%
                        </span>
                      </div>
                      <div className="text-[11px] text-gp-gray mt-0.5 truncate max-w-[160px]">
                        {item.aiDetectedLabel}
                      </div>
                    </td>

                    {/* Points */}
                    <td className="py-3 px-4">
                      <span className="font-bold text-gp flex items-center gap-1">
                        <Coins className="w-3.5 h-3.5 text-amber-500" />
                        +{item.claimedPoints}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      {item.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedItem(item)}
                            title="Inspect details"
                            className="p-1.5 text-gp-gray hover:text-gray-900 hover:bg-gray-100 rounded-lg transition cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleApprove(item.id)}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-gp hover:bg-gp-d rounded-lg transition cursor-pointer shadow-xs"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleOpenRejectModal(item)}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      ) : (
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                            item.status === 'approved'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-red-50 text-red-700'
                          }`}
                        >
                          {item.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Detail / Inspection Modal */}
      {selectedItem && !rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl p-6 border border-gray-100 flex flex-col md:flex-row gap-6 max-h-[90vh] overflow-y-auto">
            {/* Left: Photo preview */}
            <div className="md:w-1/2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gp-gray">Submission Photo</span>
                  <span className="text-[11px] font-mono text-gray-500">{selectedItem.id}</span>
                </div>
                <div className="rounded-xl overflow-hidden border border-gray-200 aspect-square bg-gray-900 flex items-center justify-center">
                  <img
                    src={selectedItem.imageUrl}
                    alt="Proof high resolution"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="mt-3 p-3 bg-gray-50 rounded-xl text-xs text-gp-gray">
                Captured via in-app camera with timestamp &amp; GPS geofence match.
              </div>
            </div>

            {/* Right: Inspection analysis */}
            <div className="md:w-1/2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <h3 className="font-bold text-gray-900 text-lg">Inspection Review</h3>
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="mt-4 space-y-3 text-xs">
                  <div>
                    <span className="text-gp-gray font-medium">Recycler Member:</span>
                    <div className="font-semibold text-gray-900 text-sm mt-0.5">
                      {selectedItem.userName}
                    </div>
                  </div>

                  <div>
                    <span className="text-gp-gray font-medium">Location &amp; Smart Bin:</span>
                    <div className="font-semibold text-gray-900 mt-0.5">
                      {selectedItem.binId} — {selectedItem.binLocation}
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 space-y-1.5">
                    <div className="flex items-center justify-between font-semibold">
                      <span className="text-emerald-900 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-gp" /> AI Vision Analysis
                      </span>
                      <span className="text-gp font-bold">{selectedItem.aiMatchScore}% Match</span>
                    </div>
                    <div className="text-gray-700">
                      Detected Object: <span className="font-bold">{selectedItem.aiDetectedLabel}</span>
                    </div>
                    <div className="text-gray-700">
                      Claimed Waste: <span className="font-bold">{selectedItem.wasteType}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-gp-gray font-medium">Points to Award:</span>
                    <div className="text-lg font-bold text-gp mt-0.5 flex items-center gap-1">
                      <Coins className="w-4 h-4 text-amber-500" />
                      +{selectedItem.claimedPoints} Points
                    </div>
                  </div>

                  {selectedItem.rejectionReason && (
                    <div className="p-2.5 bg-red-50 rounded-xl text-red-700 text-xs border border-red-100">
                      <strong>Rejection reason:</strong> {selectedItem.rejectionReason}
                    </div>
                  )}
                </div>
              </div>

              {selectedItem.status === 'pending' ? (
                <div className="flex items-center gap-2 pt-4 border-t border-gray-100 mt-4">
                  <Button
                    onClick={() => handleOpenRejectModal(selectedItem)}
                    variant="outline"
                    className="flex-1 text-xs py-2 text-red-600 border-red-300 hover:bg-red-50"
                  >
                    Reject Claim
                  </Button>
                  <Button
                    onClick={() => handleApprove(selectedItem.id)}
                    className="flex-1 text-xs py-2"
                  >
                    Confirm &amp; Award
                  </Button>
                </div>
              ) : (
                <div className="pt-4 border-t border-gray-100 mt-4 text-right">
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedItem(null)}
                    className="text-xs px-4 py-2"
                  >
                    Close
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-5 border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-base">Specify Rejection Reason</h3>
              <button
                onClick={() => setRejectModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmReject} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Reason sent to user
                </label>
                <textarea
                  rows={3}
                  value={rejectReasonInput}
                  onChange={(e) => setRejectReasonInput(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setRejectModalOpen(false)}
                  className="text-xs px-4 py-2"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="text-xs px-4 py-2 bg-red-600 hover:bg-red-700 text-white"
                >
                  Reject Submission
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}