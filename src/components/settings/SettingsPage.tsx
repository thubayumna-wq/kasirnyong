import React, { useState, useEffect } from 'react';
import { StoreSettings } from '../../types/pos';
import { BrandLogo } from '../common/BrandLogo';
import {
  Settings,
  Printer,
  MessageSquare,
  Database,
  Save,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Store,
} from 'lucide-react';

interface SettingsPageProps {
  store: StoreSettings;
  onUpdateStore: (newSettings: StoreSettings) => void;
  defaultTab?: 'store' | 'receipt' | 'whatsapp' | 'backup';
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  store,
  onUpdateStore,
  defaultTab = 'store',
}) => {
  const [activeTab, setActiveTab] = useState<'store' | 'receipt' | 'whatsapp' | 'backup'>(defaultTab);

  // Form states
  const [name, setName] = useState(store.name || '');
  const [tagline, setTagline] = useState(store.tagline || '');
  const [address, setAddress] = useState(store.address || '');
  const [phone, setPhone] = useState(store.phone || '');
  const [taxRate, setTaxRate] = useState<number>(store.tax_rate || 0);
  const [receiptPaper, setReceiptPaper] = useState<'58mm' | '80mm'>(store.receipt_paper || '58mm');
  const [receiptHeader, setReceiptHeader] = useState(store.receipt_header || '');
  const [receiptFooter, setReceiptFooter] = useState(store.receipt_footer || '');
  const [whatsappSender, setWhatsappSender] = useState(store.whatsapp_sender || '');
  const [whatsappTemplate, setWhatsappTemplate] = useState(store.whatsapp_template || '');

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  const showMsg = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      name: name.trim(),
      tagline: tagline.trim(),
      address: address.trim(),
      phone: phone.trim(),
      tax_rate: Number(taxRate) || 0,
      receipt_paper: receiptPaper,
      receipt_header: receiptHeader.trim(),
      receipt_footer: receiptFooter.trim(),
      whatsapp_sender: whatsappSender.trim(),
      whatsapp_template: whatsappTemplate.trim(),
    };

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        onUpdateStore(data.store);
        showMsg('Pengaturan toko berhasil disimpan');
      }
    } catch {
      alert('Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadBackup = () => {
    window.location.href = '/api/backup';
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        const dataToRestore = parsed.data || parsed;

        const res = await fetch('/api/restore', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: dataToRestore }),
        });

        if (res.ok) {
          alert('Pemulihan database cadangan berhasil! Halaman akan dimuat ulang.');
          window.location.reload();
        } else {
          alert('File cadangan tidak valid atau rusak');
        }
      } catch {
        alert('Gagal membaca file cadangan');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border border-amber-500/20 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-400" />
            <h1 className="text-xl font-black text-slate-100 font-serif">Pengaturan Sistem HILALPOS</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Konfigurasi profil toko, printer thermal 58mm/80mm, pesan struk digital WhatsApp, dan cadangan data.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap bg-slate-900 p-1 rounded-xl border border-slate-800 gap-1">
          <button
            onClick={() => setActiveTab('store')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'store' ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Profil Toko</span>
          </button>
          <button
            onClick={() => setActiveTab('receipt')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'receipt' ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Struk Thermal</span>
          </button>
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'whatsapp' ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>WhatsApp</span>
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'backup' ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Backup & Restore</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-4 h-4" />
          <span>{feedback}</span>
        </div>
      )}

      {/* TAB 1: PROFIL TOKO */}
      {activeTab === 'store' && (
        <form onSubmit={handleSaveSettings} className="max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <h3 className="font-bold text-sm text-amber-300 pb-2 border-b border-slate-800">
            Identitas & Profil Usaha
          </h3>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Nama Toko / Usaha</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-semibold focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Tagline Slogan</label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="SATU SISTEM, SEMUA USAHA"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Alamat Lengkap Toko</label>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Nomor Telepon Toko</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Pajak Penjualan Default (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-lg shadow-amber-950/50 flex items-center gap-2 transition"
          >
            <Save className="w-4 h-4 text-slate-950" />
            <span>{saving ? 'Menyimpan...' : 'Simpan Profil Toko'}</span>
          </button>
        </form>
      )}

      {/* TAB 2: PENGATURAN STRUK THERMAL */}
      {activeTab === 'receipt' && (
        <form onSubmit={handleSaveSettings} className="max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <h3 className="font-bold text-sm text-amber-300 pb-2 border-b border-slate-800">
            Format & Lebar Kertas Struk Thermal
          </h3>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Pilihan Lebar Printer Thermal
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer p-3 rounded-xl border border-slate-800 bg-slate-950 text-xs">
                <input
                  type="radio"
                  name="paper"
                  value="58mm"
                  checked={receiptPaper === '58mm'}
                  onChange={() => setReceiptPaper('58mm')}
                  className="text-amber-500"
                />
                <span>Thermal 58 mm (Printer Mini / Mobile Bluetooth)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-3 rounded-xl border border-slate-800 bg-slate-950 text-xs">
                <input
                  type="radio"
                  name="paper"
                  value="80mm"
                  checked={receiptPaper === '80mm'}
                  onChange={() => setReceiptPaper('80mm')}
                  className="text-amber-500"
                />
                <span>Thermal 80 mm (Printer Desktop Kasir Standar)</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Pesan Sambutan Header Struk
            </label>
            <input
              type="text"
              value={receiptHeader}
              onChange={(e) => setReceiptHeader(e.target.value)}
              placeholder="Selamat Datang di HILALPOS Toko Berkah"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Pesan Penutup Struk (Footer)
            </label>
            <textarea
              rows={3}
              value={receiptFooter}
              onChange={(e) => setReceiptFooter(e.target.value)}
              placeholder="Terima kasih atas kunjungan Anda!..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-lg shadow-amber-950/50 flex items-center gap-2 transition"
          >
            <Save className="w-4 h-4 text-slate-950" />
            <span>{saving ? 'Menyimpan...' : 'Simpan Format Struk'}</span>
          </button>
        </form>
      )}

      {/* TAB 3: WHATSAPP */}
      {activeTab === 'whatsapp' && (
        <form onSubmit={handleSaveSettings} className="max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <h3 className="font-bold text-sm text-amber-300 pb-2 border-b border-slate-800">
            Integrasi Struk Digital WhatsApp
          </h3>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Nomor WhatsApp Pengirim Toko
            </label>
            <input
              type="text"
              value={whatsappSender}
              onChange={(e) => setWhatsappSender(e.target.value)}
              placeholder="081234567890"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Template Pesan Struk Digital
            </label>
            <textarea
              rows={4}
              value={whatsappTemplate}
              onChange={(e) => setWhatsappTemplate(e.target.value)}
              placeholder="Halo {customer}, terima kasih telah berbelanja di {store}..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
            />
            <span className="text-[10px] text-slate-500 block mt-1">
              Variabel yang didukung: <code>{'{customer}'}</code>, <code>{'{store}'}</code>, <code>{'{invoice}'}</code>, <code>{'{total}'}</code>, <code>{'{date}'}</code>.
            </span>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-lg shadow-amber-950/50 flex items-center gap-2 transition"
          >
            <Save className="w-4 h-4 text-slate-950" />
            <span>{saving ? 'Menyimpan...' : 'Simpan Konfigurasi WhatsApp'}</span>
          </button>
        </form>
      )}

      {/* TAB 4: BACKUP & RESTORE */}
      {activeTab === 'backup' && (
        <div className="max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-xl">
          <h3 className="font-bold text-sm text-amber-300 pb-2 border-b border-slate-800">
            Cadangan & Pemulihan Database (Backup & Restore)
          </h3>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-slate-200 block">1. Unduh Cadangan Data Lengkap</span>
            <p className="text-[11px] text-slate-400">
              Ekspor seluruh master barang, riwayat transaksi, mutasi stok, pelanggan, dan pengaturan toko ke file JSON yang aman.
            </p>
            <button
              onClick={handleDownloadBackup}
              className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Download className="w-4 h-4" />
              <span>Unduh File Cadangan (.JSON)</span>
            </button>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-slate-200 block">2. Pulihkan Data Dari Cadangan</span>
            <p className="text-[11px] text-slate-400">
              Pilih file cadangan JSON yang sebelumnya pernah diunduh untuk mengembalikan data toko secara utuh.
            </p>
            <label className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold cursor-pointer transition">
              <Upload className="w-4 h-4 text-amber-400" />
              <span>Pilih File Backup untuk Dipulihkan</span>
              <input type="file" accept=".json" onChange={handleRestoreFile} className="hidden" />
            </label>
          </div>
        </div>
      )}
    </div>
  );
};
