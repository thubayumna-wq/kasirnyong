import React, { useState, useEffect } from 'react';
import { User } from '../../types/pos';
import {
  UserCheck,
  Plus,
  Shield,
  Key,
  Trash2,
  CheckCircle2,
  X,
  User as UserIcon,
} from 'lucide-react';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'superadmin' | 'admin' | 'kasir' | 'supervisor'>('kasir');
  const [notification, setNotification] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      if (res.ok) setUsers(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const showMsg = (txt: string) => {
    setNotification(txt);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password || !name.trim()) return;

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password,
          name: name.trim(),
          role,
        }),
      });

      if (res.ok) {
        showMsg(`Pengguna "${name}" (${role}) berhasil ditambahkan`);
        setShowAddModal(false);
        setUsername('');
        setPassword('');
        setName('');
        setRole('kasir');
        await fetchUsers();
      } else {
        const err = await res.json();
        alert(err.error || 'Gagal menambahkan user');
      }
    } catch {
      alert('Gagal menambahkan user');
    }
  };

  const roleNameMap: Record<string, { label: string; color: string }> = {
    superadmin: { label: 'Super Admin', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
    admin: { label: 'Admin Toko', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
    supervisor: { label: 'Supervisor', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40' },
    kasir: { label: 'Kasir', color: 'bg-sky-500/20 text-sky-300 border-sky-500/40' },
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border border-amber-500/20 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-amber-400" />
            <h1 className="text-xl font-black text-slate-100 font-serif">
              Pengguna & Hak Akses (Role-Based Access)
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Kelola akun Super Admin, Admin Toko, Kasir, dan Supervisor untuk operasional toko yang aman.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black shadow-lg shadow-amber-950/50 flex items-center gap-1.5 transition active:scale-95"
        >
          <Plus className="w-4 h-4 text-slate-950" />
          <span>Tambah Pengguna</span>
        </button>
      </div>

      {notification && (
        <div className="p-3.5 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {users.map((u) => {
          const rInfo = roleNameMap[u.role] || { label: u.role, color: 'bg-slate-800 text-slate-300' };

          return (
            <div
              key={u.id}
              className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-800 to-amber-500 text-slate-950 font-black flex items-center justify-center text-sm shadow-md">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-100">{u.name}</h3>
                    <span className="text-xs text-slate-400 font-mono">@{u.username}</span>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${rInfo.color}`}>
                  {rInfo.label}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-800 text-xs text-slate-400 flex justify-between items-center">
                <span>Status Akun:</span>
                <span className="text-emerald-400 font-semibold">Aktif</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-amber-500/30 rounded-2xl p-5 shadow-2xl text-slate-100 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="font-bold text-sm text-slate-100">Tambah Akun Pengguna Kasir / Admin</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Rina Kasir Pagi"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Username Login</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Contoh: rina"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password akun..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Peran / Hak Akses (Role)</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                >
                  <option value="kasir">Kasir (Transaksi POS & riwayat)</option>
                  <option value="supervisor">Supervisor (POS, retur, stok, laporan)</option>
                  <option value="admin">Admin Toko (Kelola barang, harga, laporan, pengaturan)</option>
                  <option value="superadmin">Super Admin (Akses penuh seluruh sistem)</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black"
                >
                  Simpan Pengguna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
