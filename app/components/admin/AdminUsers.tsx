import { useState, useEffect } from 'react';
import {
  Users,
  Search,
  UserCheck,
  UserX,
  Award,
  MoreVertical,
  Plus,
  Coins,
  ShieldAlert,
  ArrowUpDown,
  Download,
  X,
  CheckCircle2,
  Database,
  Loader2,
} from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { fetchAdminUsers, adjustUserPointsInSupabase, type DbUser } from '../../lib/admin.service';

export function AdminUsers() {
  const [users, setUsers] = useState<DbUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiveDb, setIsLiveDb] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Modals state
  const [selectedUser, setSelectedUser] = useState<DbUser | null>(null);
  const [adjustPointsModalOpen, setAdjustPointsModalOpen] = useState(false);
  const [pointsDelta, setPointsDelta] = useState<string>('50');
  const [adjustReason, setAdjustReason] = useState<string>('Bonus points for campus clean-up event');
  const [showToast, setShowToast] = useState<string>('');

  const triggerToast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(''), 3000);
  };

  // Load from Supabase on mount
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      const res = await fetchAdminUsers();
      if (isMounted) {
        setUsers(res.data);
        setIsLiveDb(res.isLive);
        setIsLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone.includes(searchQuery);

    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleToggleStatus = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const newStatus = u.status === 'active' ? 'suspended' : 'active';
          triggerToast(`User ${u.name} status updated to ${newStatus}`);
          return { ...u, status: newStatus };
        }
        return u;
      })
    );
  };

  const handleAdjustPointsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    const delta = parseInt(pointsDelta, 10);
    if (isNaN(delta)) return;

    // Call Supabase update
    await adjustUserPointsInSupabase(selectedUser.id, delta, adjustReason);

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === selectedUser.id) {
          const newPts = Math.max(0, u.points + delta);
          return { ...u, points: newPts };
        }
        return u;
      })
    );

    triggerToast(`Adjusted ${delta > 0 ? `+${delta}` : delta} points for ${selectedUser.name}`);
    setAdjustPointsModalOpen(false);
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

      {/* KPI Stats */}
      <div className="grid sm:grid-cols-4 gap-3">
        <Card className="p-4 flex items-center gap-3">
          <span className="w-11 h-11 rounded-xl bg-gp-l text-gp flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </span>
          <div>
            <div className="text-xs text-gp-gray font-medium">Total Users</div>
            <div className="text-xl font-bold text-gray-900">
              {isLoading ? '...' : users.length}
            </div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <span className="w-11 h-11 rounded-xl bg-emerald-100 text-gp flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5" />
          </span>
          <div>
            <div className="text-xs text-gp-gray font-medium">Active Today</div>
            <div className="text-xl font-bold text-gray-900">
              {isLoading ? '...' : users.filter((u) => u.status === 'active').length}
            </div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <span className="w-11 h-11 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </span>
          <div>
            <div className="text-xs text-gp-gray font-medium">Total Points</div>
            <div className="text-xl font-bold text-gray-900">
              {isLoading ? '...' : users.reduce((acc, u) => acc + u.points, 0).toLocaleString()}
            </div>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-3">
          <span className="w-11 h-11 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </span>
          <div>
            <div className="text-xs text-gp-gray font-medium">Suspended</div>
            <div className="text-xl font-bold text-gray-900">
              {isLoading ? '...' : users.filter((u) => u.status === 'suspended').length}
            </div>
          </div>
        </Card>
      </div>

      {/* Filter & Search Toolbar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gp-gray absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, email, or phone number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gp focus:bg-white transition"
            />
          </div>

          {/* Database indicator + Filters + Export */}
          <div className="flex items-center gap-2 flex-wrap">
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

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 cursor-pointer focus:outline-none focus:border-gp"
            >
              <option value="all">All Roles</option>
              <option value="member">Members</option>
              <option value="staff">Staff</option>
              <option value="admin">Admins</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 cursor-pointer focus:outline-none focus:border-gp"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>

            <button
              onClick={() => triggerToast('Exported users list as CSV')}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-gp-gray" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </Card>

      {/* Users Data Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="bg-gray-50/80 text-left text-xs text-gp-gray border-b border-gray-100 font-semibold">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Recycling Stats</th>
                <th className="py-3 px-4">Points</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gp-gray">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-gp" />
                    <span>Loading users from Supabase...</span>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gp-gray text-sm">
                    No users found matching your search criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition">
                    {/* User info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gp-l text-gp font-bold flex items-center justify-center shrink-0">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{user.name}</div>
                          <div className="text-[11px] text-gp-gray">Joined {user.joinedDate}</div>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="py-3 px-4">
                      <div className="text-gray-900 font-medium text-xs">{user.email}</div>
                      <div className="text-[11px] text-gp-gray">{user.phone}</div>
                    </td>

                    {/* Recycling stats */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-900">{user.recycles} times</div>
                      <div className="text-[11px] text-gp font-medium">{user.weightKg} kg recycled</div>
                    </td>

                    {/* Points balance */}
                    <td className="py-3 px-4 font-bold text-gp">
                      <div className="flex items-center gap-1">
                        <Coins className="w-3.5 h-3.5 text-amber-500" />
                        <span>{user.points.toLocaleString()}</span>
                      </div>
                    </td>

                    {/* Role badge */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold uppercase tracking-wider ${
                          user.role === 'admin'
                            ? 'bg-purple-100 text-purple-700'
                            : user.role === 'staff'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>

                    {/* Status badge */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          user.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-red-50 text-red-700'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            user.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'
                          }`}
                        />
                        {user.status === 'active' ? 'Active' : 'Suspended'}
                      </span>
                    </td>

                    {/* Action buttons */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          title="Adjust Points"
                          onClick={() => {
                            setSelectedUser(user);
                            setAdjustPointsModalOpen(true);
                          }}
                          className="p-1.5 text-gp-gray hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                        >
                          <Coins className="w-4 h-4" />
                        </button>

                        <button
                          title={user.status === 'active' ? 'Suspend User' : 'Reactivate User'}
                          onClick={() => handleToggleStatus(user.id)}
                          className={`p-1.5 rounded-lg transition cursor-pointer ${
                            user.status === 'active'
                              ? 'text-gp-gray hover:text-red-600 hover:bg-red-50'
                              : 'text-red-600 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          {user.status === 'active' ? (
                            <UserX className="w-4 h-4" />
                          ) : (
                            <UserCheck className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination summary */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs text-gp-gray">
          <div>
            Showing <span className="font-semibold text-gray-900">{filteredUsers.length}</span> members
          </div>
          <div className="flex items-center gap-1">
            <button className="px-2.5 py-1 rounded-md border border-gray-200 hover:bg-gray-50 text-gray-600 cursor-pointer disabled:opacity-40" disabled>
              Previous
            </button>
            <span className="px-3 py-1 rounded-md bg-gp text-white font-semibold">1</span>
            <button className="px-2.5 py-1 rounded-md border border-gray-200 hover:bg-gray-50 text-gray-600 cursor-pointer">
              Next
            </button>
          </div>
        </div>
      </Card>

      {/* Adjust Points Modal */}
      {adjustPointsModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-5 border border-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Adjust Points</h3>
                  <p className="text-xs text-gp-gray">{selectedUser.name}</p>
                </div>
              </div>
              <button
                onClick={() => setAdjustPointsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustPointsSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Current Balance
                </label>
                <div className="text-lg font-bold text-gp">
                  {selectedUser.points.toLocaleString()} pts
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Points Adjustment (+ or -)
                </label>
                <input
                  type="number"
                  value={pointsDelta}
                  onChange={(e) => setPointsDelta(e.target.value)}
                  placeholder="e.g. 50 or -30"
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gp"
                  required
                />
                <p className="text-[11px] text-gp-gray mt-1">
                  Use negative values (e.g. -20) to deduct points.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Reason / Adjustment Note
                </label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Manual correction for missed QR scan"
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-gp"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setAdjustPointsModalOpen(false)}
                  className="text-xs px-4 py-2"
                >
                  Cancel
                </Button>
                <Button type="submit" className="text-xs px-4 py-2">
                  Confirm Adjustment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}