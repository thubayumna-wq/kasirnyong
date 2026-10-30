import React, { useState, useEffect } from 'react';
import { Customer, Transaction } from '../../types/pos';
import { formatRupiah, formatDateTime } from '../../lib/printerService';
import {
  Users,
  Clock,
  Plus,
  Search,
  Phone,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Calendar,
  X,
  Wallet,
} from 'lucide-react';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [debtTransactions, setDebtTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'customers' | 'debt'>('customers');
  const [search, setSearch] = useState<string>('');

  // Add customer modal
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [debtLimit, setDebtLimit] = useState<number>(1000000);

  // Pay debt modal
  const [showPayModal, setShowPayModal] = useState<boolean>(false);
  const [selectedTrxForPay, setSelectedTrxForPay] = useState<Transaction | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<string>('Tunai');

  const [notification, setNotification] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [custRes, trxRes] = await Promise.all([
        fetch('/api/customers'),
        fetch('/api/transactions'),
      ]);
      if (custRes.ok) setCustomers(await custRes.json());
      if (trxRes.ok) {
        const allTrx: Transaction[] = await trxRes.json();
        // Filter transactions with outstanding tempo / debt
        setDebtTransactions(
          allTrx.filter((t) => t.remaining_debt > 0 || t.payment_status === 'Sebagian' || t.payment_status === 'Belum Lunas')
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showMsg = (txt: string) => {
    setNotification(txt);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim(),
          address: address.trim(),
          debt_limit: debtLimit,
        }),
      });

      if (res.ok) {
        showMsg(`Pelanggan "${name}" berhasil ditambahkan`);
        setShowAddModal(false);
        setName('');
        setPhone('');
        setEmail('');
        setAddress('');
        await fetchData();
      }
    } catch {
      alert('Gagal menambahkan pelanggan');
    }
  };

  const handleOpenPayModal = (trx: Transaction) => {
    setSelectedTrxForPay(trx);
    setPayAmount(trx.remaining_debt || 0);
    setPayMethod('Tunai');
    setShowPayModal(true);
  };

  const handleConfirmPayDebt = async () => {
    if (!selectedTrxForPay || payAmount <= 0) return;

    try {
      const res = await fetch(`/api/transactions/${selectedTrxForPay.id}/pay-debt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount_paid: payAmount,
          payment_method: payMethod,
          cashier_name: 'Kasir',
        }),
      });

      if (res.ok) {
        showMsg(`Pembayaran tempo sebesar Rp${payAmount.toLocaleString('id-ID')} berhasil dicatat`);
        setShowPayModal(false);
        await fetchData();
      }
    } catch {
      alert('Gagal memproses pembayaran tempo');
    }
  };

  const totalOutstanding = customers.reduce((sum, c) => sum + (c.total_debt || 0), 0);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      (c.address && c.address.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-slate-950 text-slate-100">
      {/* Top Header */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border border-amber-500/20 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            <h1 className="text-xl font-black text-slate-100 font-serif">
              Data Pelanggan & Buku Piutang Tempo
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manajemen pelanggan setia, pantauan batas kredit (plafon), dan pelunasan tagihan tempo.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tabs */}
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('customers')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'customers' ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:text-white'
              }`}
            >
              Data Pelanggan
            </button>
            <button
              onClick={() => setActiveTab('debt')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'debt' ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:text-white'
              }`}
            >
              Buku Piutang ({formatRupiah(totalOutstanding)})
            </button>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black shadow-lg shadow-amber-950/50 flex items-center gap-1.5 transition active:scale-95"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>Tambah Pelanggan</span>
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-3.5 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      {/* TAB 1: CUSTOMERS LIST */}
      {activeTab === 'customers' && (
        <div className="space-y-4">
          <div className="w-full sm:w-80 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, no. HP, atau alamat..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {filteredCustomers.map((c) => (
              <div
                key={c.id}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 transition space-y-2.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-sm text-slate-100">{c.name}</h3>
                    {c.total_debt > 0 ? (
                      <span className="px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 text-[10px] font-bold">
                        Hutang: {formatRupiah(c.total_debt)}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
                        Lunas
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                    <Phone className="w-3.5 h-3.5 text-amber-400" />
                    <span>{c.phone || 'Tidak ada no. telp'}</span>
                  </div>
                  {c.address && (
                    <div className="text-[11px] text-slate-500 mt-1">{c.address}</div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex justify-between items-center text-[11px]">
                  <span className="text-slate-400">Plafon Kredit:</span>
                  <span className="font-mono font-bold text-slate-200">{formatRupiah(c.debt_limit || 0)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: DEBT / PIUTANG LIST */}
      {activeTab === 'debt' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider text-amber-400">
                Daftar Tagihan Tempo & Piutang Pelanggan
              </h3>
              <span className="text-[11px] text-slate-400">
                Total Tagihan Belum Lunas: <strong className="text-rose-400">{formatRupiah(totalOutstanding)}</strong>
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3.5">No. Transaksi</th>
                  <th className="p-3.5">Tanggal</th>
                  <th className="p-3.5">Pelanggan</th>
                  <th className="p-3.5">Total Tagihan</th>
                  <th className="p-3.5">Sudah Dibayar</th>
                  <th className="p-3.5">Sisa Tempo</th>
                  <th className="p-3.5">Jatuh Tempo</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {debtTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-emerald-400">
                      Tidak ada piutang pelanggan saat ini. Seluruh transaksi telah lunas.
                    </td>
                  </tr>
                ) : (
                  debtTransactions.map((trx) => (
                    <tr key={trx.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3.5 font-mono font-bold text-amber-300">{trx.invoice_number}</td>
                      <td className="p-3.5 text-slate-400">{formatDateTime(trx.created_at)}</td>
                      <td className="p-3.5 font-bold text-slate-200">{trx.customer_name}</td>
                      <td className="p-3.5 font-mono">{formatRupiah(trx.total)}</td>
                      <td className="p-3.5 font-mono text-emerald-400">{formatRupiah(trx.total_paid)}</td>
                      <td className="p-3.5 font-mono font-bold text-rose-400">
                        {formatRupiah(trx.remaining_debt)}
                      </td>
                      <td className="p-3.5 text-slate-400">{trx.due_date || '-'}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                          {trx.payment_status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleOpenPayModal(trx)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition active:scale-95"
                        >
                          Catat Cicilan / Pelunasan
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-amber-500/30 rounded-2xl p-5 shadow-2xl text-slate-100 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="font-bold text-sm text-slate-100">Tambah Data Pelanggan Baru</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCustomer} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Nama Pelanggan <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Warung Bu Rini / Pak Sulaiman"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Nomor WhatsApp / HP
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Alamat</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Contoh: Jl. Melati RT 03 RW 05"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Plafon / Batas Hutang Maksimal (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  value={debtLimit}
                  onChange={(e) => setDebtLimit(Number(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-amber-300 focus:outline-none focus:border-amber-400"
                />
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
                  Simpan Pelanggan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Debt Modal */}
      {showPayModal && selectedTrxForPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-amber-500/30 rounded-2xl p-5 shadow-2xl text-slate-100 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <h3 className="font-bold text-sm text-slate-100">
                Pelunasan Tempo #{selectedTrxForPay.invoice_number}
              </h3>
              <button onClick={() => setShowPayModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Pelanggan:</span>
                <span className="font-bold text-slate-200">{selectedTrxForPay.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Tagihan:</span>
                <span className="font-mono">{formatRupiah(selectedTrxForPay.total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Sisa Tagihan Saat Ini:</span>
                <span className="font-mono font-bold text-rose-400">
                  {formatRupiah(selectedTrxForPay.remaining_debt)}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Nominal Pembayaran Diterima (Rp)
                </label>
                <input
                  type="number"
                  min="1"
                  max={selectedTrxForPay.remaining_debt}
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-base font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Metode Pembayaran</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
                >
                  <option value="Tunai">Tunai</option>
                  <option value="Transfer">Transfer Bank</option>
                  <option value="QRIS">QRIS</option>
                  <option value="Debit">Debit Card</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPayDebt}
                  className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 text-white rounded-xl text-xs font-black shadow-md"
                >
                  Simpan Pembayaran
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
