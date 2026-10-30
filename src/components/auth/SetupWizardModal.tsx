import React, { useState } from 'react';
import { BrandLogo } from '../common/BrandLogo';
import { StoreSettings, User } from '../../types/pos';
import {
  Store,
  ShieldCheck,
  CheckCircle2,
  X,
  ArrowRight,
  Database,
  Printer,
} from 'lucide-react';

interface SetupWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSetupComplete: (user: User, store: StoreSettings) => void;
}

export const SetupWizardModal: React.FC<SetupWizardModalProps> = ({
  isOpen,
  onClose,
  onSetupComplete,
}) => {
  const [storeName, setStoreName] = useState('HILALPOS Toko Berkah Utama');
  const [address, setAddress] = useState('Jl. Pemuda No. 88, Pusat Perbelanjaan, Indonesia');
  const [phone, setPhone] = useState('081234567890');
  const [receiptPaper, setReceiptPaper] = useState<'58mm' | '80mm'>('58mm');
  const [adminUsername, setAdminUsername] = useState('admin');
  const [adminPassword, setAdminPassword] = useState('admin123');
  const [adminName, setAdminName] = useState('Ahmad Super Admin');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeName,
          address,
          phone,
          receiptPaper,
          adminUsername,
          adminPassword,
          adminName,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        onSetupComplete(data.user, data.store);
        onClose();
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Setup gagal disimpan');
      }
    } catch {
      setErrorMsg('Gagal terhubung ke server untuk setup');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-xl bg-slate-900 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-100 max-h-[92vh] overflow-y-auto space-y-6">
        <div className="flex justify-between items-start">
          <BrandLogo size="md" showTagline={true} />
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="border-b border-slate-800 pb-3">
          <h2 className="text-lg font-black text-amber-300">Konfigurasi Awal Sistem HILALPOS</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Atur identitas toko dan akun Super Administrator pertama Anda.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500 text-rose-300 text-xs font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <span className="text-xs uppercase font-extrabold text-amber-400 tracking-wider block">
              1. Identitas Toko / Unit Usaha
            </span>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Nama Toko</label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Nomor Telepon Toko</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Printer Thermal</label>
                <select
                  value={receiptPaper}
                  onChange={(e) => setReceiptPaper(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                >
                  <option value="58mm">Thermal 58 mm (Printer Mini / Mobile)</option>
                  <option value="80mm">Thermal 80 mm (Printer Desktop)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Alamat Toko</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-slate-800">
            <span className="text-xs uppercase font-extrabold text-amber-400 tracking-wider block">
              2. Akun Super Administrator
            </span>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Nama Lengkap Admin</label>
              <input
                type="text"
                required
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Username Admin</label>
                <input
                  type="text"
                  required
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Password Admin</label>
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black shadow-lg shadow-amber-950/50 flex items-center gap-2 transition"
            >
              <CheckCircle2 className="w-4 h-4 text-slate-950" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Selesaikan Setup'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
