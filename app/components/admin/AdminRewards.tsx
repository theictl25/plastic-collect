import { useState, useEffect } from 'react';
import {
  Gift,
  Plus,
  Coins,
  Package,
  AlertCircle,
  CheckCircle2,
  Ticket,
  X,
  Trash2,
  Edit2,
  ShoppingBag,
  Database,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import type { RewardCategory } from '../../types';
import {
  fetchAdminRewards,
  fetchAdminRedemptionLogs,
  createRewardInSupabase,
  toggleRewardActiveInSupabase,
  deleteRewardInSupabase,
  claimVoucherInSupabase,
  type DbRewardItem,
  type DbRedemptionLog,
} from '../../lib/admin.service';

export function AdminRewards() {
  const [rewards, setRewards] = useState<DbRewardItem[]>([]);
  const [logs, setLogs] = useState<DbRedemptionLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLiveDb, setIsLiveDb] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'catalog' | 'logs'>('catalog');
  
  // Voucher search
  const [voucherCodeInput, setVoucherCodeInput] = useState('');
  
  // Add reward modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [modalError, setModalError] = useState('');
  const [newRewardNameEn, setNewRewardNameEn] = useState('');
  const [newRewardNameTh, setNewRewardNameTh] = useState('');
  const [newRewardCategory, setNewRewardCategory] = useState<RewardCategory>('food');
  const [newRewardPoints, setNewRewardPoints] = useState('50');
  const [newRewardEmoji, setNewRewardEmoji] = useState('🎁');
  const [newRewardStock, setNewRewardStock] = useState('50');
  
  const [toastMsg, setToastMsg] = useState('');

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  // Load from Supabase
  const loadData = async () => {
    setIsLoading(true);
    const [rewRes, logRes] = await Promise.all([
      fetchAdminRewards(),
      fetchAdminRedemptionLogs(),
    ]);
    setRewards(rewRes.data);
    setLogs(logRes.data);
    setIsLiveDb(rewRes.isLive || logRes.isLive);
    setIsLoading(false);
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleToggleRewardActive = async (id: string) => {
    const target = rewards.find((r) => r.id === id);
    if (!target) return;
    const newActiveState = !target.isActive;

    const res = await toggleRewardActiveInSupabase(id, newActiveState);
    if (!res.success) {
      triggerToast(`❌ อัปเดตไม่สำเร็จ: ${res.error || 'Permission error'}`);
      return;
    }

    setRewards((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          return { ...r, isActive: newActiveState };
        }
        return r;
      })
    );
    triggerToast(`ของรางวัล "${target.nameEn}" เปลี่ยนเป็น ${newActiveState ? 'เปิดใช้งาน' : 'ปิดใช้งาน'} ใน Supabase แล้ว`);
  };

  const handleDeleteReward = async (reward: DbRewardItem) => {
    if (!confirm(`คุณต้องการลบของรางวัล "${reward.nameEn}" ออกจากฐานข้อมูล Supabase ใช่หรือไม่?`)) {
      return;
    }

    const res = await deleteRewardInSupabase(reward.id);
    if (!res.success) {
      triggerToast(`❌ ลบไม่สำเร็จ: ${res.error || 'Supabase delete failed'}`);
      return;
    }

    setRewards((prev) => prev.filter((r) => r.id !== reward.id));
    triggerToast(`🗑️ ลบของรางวัล "${reward.nameEn}" ออกจาก Supabase เรียบร้อยแล้ว`);
  };

  const handleCreateReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRewardNameEn.trim()) return;

    const points = parseInt(newRewardPoints, 10) || 50;
    const stock = parseInt(newRewardStock, 10) || 20;

    setIsSaving(true);
    setModalError('');

    // Send real insert to Supabase
    const res = await createRewardInSupabase({
      name_en: newRewardNameEn.trim(),
      name_th: newRewardNameTh.trim() || newRewardNameEn.trim(),
      category: newRewardCategory,
      points_cost: points,
      image_url: newRewardEmoji.trim() || '🎁',
      stock_quantity: stock,
    });

    setIsSaving(false);

    if (!res.success) {
      console.error('Failed to insert reward into Supabase:', res.error);
      setModalError(res.error || 'Failed to insert into Supabase table.');
      triggerToast(`❌ บันทึกลง Supabase ล้มเหลว: ${res.error}`);
      return;
    }

    // Successfully inserted in Supabase!
    if (res.data) {
      setRewards((prev) => [res.data!, ...prev.filter((r) => r.id !== res.data!.id)]);
    }

    triggerToast(`🎉 บันทึกของรางวัล "${newRewardNameEn.trim()}" ลงตาราง rewards ใน Supabase สำเร็จแล้ว!`);
    setAddModalOpen(false);
    setNewRewardNameEn('');
    setNewRewardNameTh('');
    setNewRewardPoints('50');
    setNewRewardStock('50');
    setModalError('');
  };

  const handleClaimVoucher = async (logId: string) => {
    const success = await claimVoucherInSupabase(logId);
    if (!success) {
      triggerToast('❌ ไม่สามารถตัดจ่ายคูปองใน Supabase ได้');
      return;
    }

    setLogs((prev) =>
      prev.map((l) => {
        if (l.id === logId) {
          triggerToast(`Voucher ${l.code} marked as Claimed in Supabase!`);
          return { ...l, isClaimed: true };
        }
        return l;
      })
    );
  };

  const handleQuickClaimByCode = (e: React.FormEvent) => {
    e.preventDefault();
    const code = voucherCodeInput.trim().toUpperCase();
    if (!code) return;

    const target = logs.find((l) => l.code === code);
    if (!target) {
      triggerToast(`Voucher code "${code}" not found!`);
      return;
    }

    if (target.isClaimed) {
      triggerToast(`Notice: Voucher "${code}" was ALREADY claimed previously.`);
      return;
    }

    void handleClaimVoucher(target.id);
    setVoucherCodeInput('');
  };

  const totalRedeemedCount = rewards.reduce((acc, r) => acc + (r.totalRedeemed || 0), 0);
  const lowStockCount = rewards.filter((r) => r.stockQuantity <= 5).length;

  return (
    <div className="space-y-5">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-sm animate-fade-in border border-gray-700">
          <CheckCircle2 className="w-4 h-4 text-gp-m" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid sm:grid-cols-4 gap-3">
        <Card className="p-4 flex items-center gap-3">
          <span className="w-11 h-11 rounded-xl bg-gp-l text-gp flex items-center justify-center shrink-0">
            <Gift className="w-5 h-5" />
          </span>
          <div>
            <div className="text-xs text-gp-gray font-medium">Catalog Items</div>
            <div className="text-xl font-bold text-gray-900">
              {isLoading ? '...' : `${rewards.length} Rewards`}
            </div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <span className="w-11 h-11 rounded-xl bg-emerald-100 text-gp flex items-center justify-center shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </span>
          <div>
            <div className="text-xs text-gp-gray font-medium">Total Redeemed</div>
            <div className="text-xl font-bold text-gray-900">
              {isLoading ? '...' : `${totalRedeemedCount} Units`}
            </div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <span className="w-11 h-11 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Coins className="w-5 h-5" />
          </span>
          <div>
            <div className="text-xs text-gp-gray font-medium">Points Burned</div>
            <div className="text-xl font-bold text-gray-900">
              {isLoading ? '...' : `${logs.reduce((acc, l) => acc + l.pointsSpent, 0).toLocaleString()} Pts`}
            </div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <span className="w-11 h-11 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </span>
          <div>
            <div className="text-xs text-gp-gray font-medium">Low Stock Alert (&le;5)</div>
            <div className="text-xl font-bold text-gray-900">
              {isLoading ? '...' : `${lowStockCount} Items`}
            </div>
          </div>
        </Card>
      </div>

      {/* Sub-tab & Actions Toolbar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveSubTab('catalog')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeSubTab === 'catalog'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gp-gray hover:text-gray-900'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Reward Catalog</span>
              </button>

              <button
                onClick={() => setActiveSubTab('logs')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  activeSubTab === 'logs'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gp-gray hover:text-gray-900'
                }`}
              >
                <Ticket className="w-3.5 h-3.5" />
                <span>Redemption Claims</span>
                <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded-full text-[10px] font-bold">
                  {logs.filter((l) => !l.isClaimed).length} Unclaimed
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
              <span>{isLiveDb ? 'Live Supabase' : 'Offline / Mock'}</span>
            </span>
          </div>

          {activeSubTab === 'catalog' ? (
            <Button
              onClick={() => {
                setModalError('');
                setAddModalOpen(true);
              }}
              className="text-xs px-3.5 py-2 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Reward</span>
            </Button>
          ) : (
            <form onSubmit={handleQuickClaimByCode} className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Enter claim code (e.g. GP-8F92A1)"
                value={voucherCodeInput}
                onChange={(e) => setVoucherCodeInput(e.target.value)}
                className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono uppercase focus:outline-none focus:border-gp"
              />
              <Button type="submit" className="text-xs px-3 py-1.5">
                Verify Code
              </Button>
            </form>
          )}
        </div>
      </Card>

      {/* Main content: Catalog or Logs */}
      {isLoading ? (
        <Card className="p-12 text-center text-gp-gray">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-gp" />
          <span>Loading rewards catalog from Supabase...</span>
        </Card>
      ) : activeSubTab === 'catalog' ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rewards.map((reward) => {
            const isOutOfStock = reward.stockQuantity === 0;
            const isLowStock = reward.stockQuantity > 0 && reward.stockQuantity <= 5;

            return (
              <Card
                key={reward.id}
                className={`p-5 flex flex-col justify-between transition ${
                  !reward.isActive ? 'opacity-60 bg-gray-50/80' : 'hover:border-gray-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-3xl shadow-xs border border-gray-100">
                      {reward.emoji}
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                          reward.category === 'food'
                            ? 'bg-amber-100 text-amber-800'
                            : reward.category === 'merch'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {reward.category}
                      </span>

                      <div className="flex items-center gap-1 font-bold text-gp text-sm">
                        <Coins className="w-3.5 h-3.5 text-amber-500" />
                        <span>{reward.pointsCost} pts</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-gray-900 text-base">{reward.nameEn}</h4>
                    <p className="text-xs text-gp-gray">{reward.nameTh}</p>
                  </div>

                  {/* Stock progress */}
                  <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-medium text-gray-600">Stock Availability</span>
                      <span
                        className={`font-bold ${
                          isOutOfStock
                            ? 'text-red-600'
                            : isLowStock
                            ? 'text-amber-600'
                            : 'text-gray-900'
                        }`}
                      >
                        {reward.stockQuantity} left
                      </span>
                    </div>

                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          isOutOfStock
                            ? 'bg-red-500'
                            : isLowStock
                            ? 'bg-amber-500'
                            : 'bg-gp'
                        }`}
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round((reward.stockQuantity / (reward.maxStock || reward.stockQuantity || 1)) * 100)
                          )}%`,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-gp-gray mt-2">
                      <span>Database ID:</span>
                      <span className="font-mono text-[10px] text-gray-500 truncate max-w-[140px]">
                        {reward.id}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card footer: Toggle active & Delete */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-4">
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={reward.isActive}
                      onChange={() => handleToggleRewardActive(reward.id)}
                      className="accent-gp w-4 h-4 rounded cursor-pointer"
                    />
                    <span>{reward.isActive ? 'Active in App' : 'Inactive'}</span>
                  </label>

                  <div className="flex items-center gap-1">
                    <button
                      title="Delete from Supabase"
                      onClick={() => handleDeleteReward(reward)}
                      className="p-1.5 text-gp-gray hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Tab 2: Redemption Claims Table */
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="bg-gray-50/80 text-left text-xs text-gp-gray border-b border-gray-100 font-semibold">
                  <th className="py-3 px-4">Claim Voucher Code</th>
                  <th className="py-3 px-4">User Member</th>
                  <th className="py-3 px-4">Reward Item</th>
                  <th className="py-3 px-4">Points Spent</th>
                  <th className="py-3 px-4">Date &amp; Time</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gp-gray text-xs">
                      No redemption records found.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/50 transition">
                      <td className="py-3 px-4">
                        <span className="font-mono font-bold text-xs bg-gray-100 px-2 py-1 rounded-md text-gray-900 border border-gray-200">
                          {log.code}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-900">{log.userName}</td>
                      <td className="py-3 px-4 font-medium text-gray-800">{log.rewardName}</td>
                      <td className="py-3 px-4 font-bold text-amber-600">-{log.pointsSpent} pts</td>
                      <td className="py-3 px-4 text-xs text-gp-gray">{log.date}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            log.isClaimed
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              log.isClaimed ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                          />
                          {log.isClaimed ? 'Claimed' : 'Unclaimed'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {!log.isClaimed ? (
                          <button
                            onClick={() => handleClaimVoucher(log.id)}
                            className="px-3 py-1 bg-gp hover:bg-gp-d text-white text-xs font-semibold rounded-lg transition cursor-pointer"
                          >
                            Mark as Given
                          </button>
                        ) : (
                          <span className="text-xs text-gp-gray font-medium">Delivered</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add Reward Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-5 border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gp-l text-gp flex items-center justify-center">
                  <Gift className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-gray-900 text-base">Add New Reward</h3>
              </div>
              <button
                onClick={() => setAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Message Box if Supabase rejected */}
            {modalError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <strong>เกิดข้อผิดพลาดจาก Supabase:</strong>
                  <div className="mt-0.5 font-mono text-[11px]">{modalError}</div>
                  {modalError.includes('violates row-level security policy') && (
                    <div className="mt-1 text-red-800">
                      💡 <strong>วิธีแก้:</strong> กรุณารันไฟล์ <code>supabase/fix_rewards_rls.sql</code> ใน Supabase SQL Editor เพื่อเปิดสิทธิ์การบันทึกของรางวัลครับ
                    </div>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleCreateReward} className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    English Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Eco Mug"
                    value={newRewardNameEn}
                    onChange={(e) => setNewRewardNameEn(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gp"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Thai Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. แก้วน้ำรักษ์โลก"
                    value={newRewardNameTh}
                    onChange={(e) => setNewRewardNameTh(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gp"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={newRewardCategory}
                    onChange={(e) => setNewRewardCategory(e.target.value as RewardCategory)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gp bg-white"
                  >
                    <option value="food">Food &amp; Drink</option>
                    <option value="merch">Merchandise</option>
                    <option value="discount">Gift Discount</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Emoji Icon *
                  </label>
                  <input
                    type="text"
                    value={newRewardEmoji}
                    onChange={(e) => setNewRewardEmoji(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gp text-center"
                    placeholder="🍱"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Points Cost *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newRewardPoints}
                    onChange={(e) => setNewRewardPoints(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gp"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newRewardStock}
                    onChange={(e) => setNewRewardStock(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gp"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setAddModalOpen(false)}
                  disabled={isSaving}
                  className="text-xs px-4 py-2"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="text-xs px-4 py-2 min-w-[160px]"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving to Supabase...</span>
                    </>
                  ) : (
                    <span>Save Reward to Supabase</span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}