import React, { useState } from 'react';
import { BrandLogo } from '../common/BrandLogo';
import { User, StoreSettings } from '../../types/pos';
import {
  Lock,
  User as UserIcon,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (user: User, store: StoreSettings) => void;
  onOpenSetup: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onOpenSetup }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        const data = await res.json();
        onLoginSuccess(data.user, data.store);
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Username atau password salah');
      }
    } catch {
      // Offline fallback: allow login with cached or demo user
      if (username === 'admin' || username === 'kasir') {
        const fallbackUser: User = {
          id: username === 'admin' ? 'usr-admin-01' : 'usr-kasir-01',
          store_id: 'store-hilal-01',
          username,
          name: username === 'admin' ? 'Ahmad Super Admin' : 'Siti Kasir Berkah',
          role: username === 'admin' ? 'superadmin' : 'kasir',
        };
        const fallbackStore: StoreSettings = {
          id: 'store-hilal-01',
          name: 'HILALPOS Toko Berkah Utama',
          tagline: 'SATU SISTEM, SEMUA USAHA',
          address: 'Jl. Pemuda No. 88, Pusat Perbelanjaan, Indonesia',
          phone: '081234567890',
          currency: 'IDR',
          timezone: 'Asia/Jakarta',
          tax_rate: 0,
          receipt_paper: '58mm',
          receipt_header: 'Selamat Datang di HILALPOS Toko Berkah',
          receipt_footer: 'Terima kasih atas kunjungan Anda!',
          negative_stock_allowed: false,
        };
        onLoginSuccess(fallbackUser, fallbackStore);
      } else {
        setErrorMsg('Tidak dapat terhubung ke server untuk verifikasi akun.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-emerald-950 via-slate-950 to-emerald-950 relative overflow-hidden text-slate-100">
      {/* Subtle luxury geometric backdrop */}
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/90 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative z-10 flex flex-col space-y-6">
        {/* Brand Logo & Presentation */}
        <div className="flex flex-col items-center text-center space-y-3">
          <BrandLogo size="lg" showTagline={true} />
          <p className="text-xs text-slate-400 max-w-xs mt-1">
            Sistem Kasir Universal Online & Offline untuk Segala Jenis Usaha Ritel & Kuliner.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Username Kasir / Admin
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Kata Sandi (Password)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-950/50 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
          >
            <span>{loading ? 'Masuk ke Sistem...' : 'Masuk Aplikasi POS'}</span>
            <ArrowRight className="w-4 h-4 text-slate-950" />
          </button>
        </form>

        {/* Demo Credentials Quick Click */}
        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-amber-400">
            <span>Pilih Akun Demo Cepat:</span>
            <span className="text-[10px] text-slate-500">Klik untuk isi otomatis</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => handleQuickDemoFill('admin', 'admin123')}
              className="p-2 rounded-lg bg-slate-900 hover:bg-emerald-950 border border-slate-800 hover:border-amber-500/40 text-left transition"
            >
              <div className="font-bold text-slate-200">👑 Super Admin</div>
              <div className="text-[10px] text-slate-400 font-mono">admin / admin123</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoFill('kasir', 'kasir123')}
              className="p-2 rounded-lg bg-slate-900 hover:bg-emerald-950 border border-slate-800 hover:border-amber-500/40 text-left transition"
            >
              <div className="font-bold text-slate-200">🛒 Kasir Toko</div>
              <div className="text-[10px] text-slate-400 font-mono">kasir / kasir123</div>
            </button>
          </div>
        </div>

        {/* Setup Wizard Link */}
        <div className="text-center pt-1 border-t border-slate-800 text-xs text-slate-500">
          Butuh konfigurasi ulang identitas toko?{' '}
          <button
            onClick={onOpenSetup}
            className="text-amber-400 hover:underline font-semibold"
          >
            Buka Setup Awal
          </button>
        </div>
      </div>
    </div>
  );
};
