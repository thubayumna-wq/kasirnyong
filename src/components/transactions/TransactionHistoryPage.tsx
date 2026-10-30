import React, { useState, useEffect } from 'react';
import { Transaction, StoreSettings } from '../../types/pos';
import { formatRupiah, formatDateTime, triggerReceiptPrint } from '../../lib/printerService';
import { ReceiptModal } from '../pos/ReceiptModal';
import {
  Receipt,
  Search,
  Filter,
  Printer,
  RotateCcw,
  Ban,
  Eye,
  CheckCircle2,
  Clock,
  Calendar,
  AlertTriangle,
  RefreshCw,
  X,
} from 'lucide-react';

interface TransactionHistoryPageProps {
  store: StoreSettings;
}

export const TransactionHistoryPage: React.FC<TransactionHistoryPageProps> = ({ store }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');

  // Selected for reprint / view
  const [selectedTrx, setSelectedTrx] = useState<Transaction | null>(null);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);

  // Return / Cancel Modal
  const [showReturnModal, setShowReturnModal] = useState<boolean>(false);
  const [trxToReturn, setTrxToReturn] = useState<Transaction | null>(null);
  const [returnReason, setReturnReason] = useState<string>('');
  const [returnQtyMap, setReturnQtyMap] = useState<Record<string, number>>({});
  const [isProcessingReturn, setIsProcessingReturn] = useState<boolean>(false);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/transactions');
      if (res.ok) {
        setTransactions(await res.json());
      }
    } catch (err) {
      console.error('Failed to load transactions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleOpenReceipt = async (trx: Transaction) => {
    try {
      const res = await fetch(`/api/transactions/${trx.id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedTrx(data.transaction);
        setSelectedItems(data.items);
        setShowReceiptModal(true);
      }
    } catch {
      // If offline, use cached items_detail if present
      setSelectedTrx(trx);
      setSelectedItems(trx.items_detail || []);
      setShowReceiptModal(true);
    }
  };

  const handleOpenReturn = async (trx: Transaction) => {
    try {
      const res = await fetch(`/api/transactions/${trx.id}`);
      if (res.ok) {
        const data = await res.json();
        setTrxToReturn(data.transaction);
        setSelectedItems(data.items);
        // Initialize return qty to 0
        const initialQty: Record<string, number> = {};
        data.items.forEach((it: any) => {
          initialQty[it.id] = 0;
        });
        setReturnQtyMap(initialQty);
        setReturnReason('Barang rusak / pelanggan ingin tukar');
        setShowReturnModal(true);
      }
    } catch {
      alert('Gagal mengambil rincian barang untuk retur');
    }
  };

  const handleSubmitReturn = async () => {
    if (!trxToReturn) return;

    const itemsToReturn = Object.entries(returnQtyMap)
      .filter(([_, qty]) => qty > 0)
      .map(([itemId, qty]) => ({ item_id: itemId, qty }));

    if (itemsToReturn.length === 0) {
      alert('Tentukan jumlah barang yang akan diretur minimal 1');
      return;
    }

    setIsProcessingReturn(true);
    try {
      const res = await fetch(`/api/transactions/${trxToReturn.id}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items_to_return: itemsToReturn,
          reason: returnReason,
          user_name: 'Supervisor',
        }),
      });

      if (res.ok) {
        alert('Retur barang berhasil diproses dan stok telah dikembalikan ke inventaris');
        setShowReturnModal(false);
        fetchTransactions();
      }
    } catch {
      alert('Gagal memproses retur');
    } finally {
      setIsProcessingReturn(false);
    }
  };

  const filteredTransactions = transactions.filter((t) => {
    if (statusFilter !== 'all' && t.payment_status.toLowerCase() !== statusFilter.toLowerCase()) return false;
    if (methodFilter !== 'all' && t.payment_method.toLowerCase() !== methodFilter.toLowerCase()) return false;
    if (dateFilter && !t.created_at.startsWith(dateFilter)) return false;
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      return (
        t.invoice_number.toLowerCase().includes(q) ||
        (t.customer_name && t.customer_name.toLowerCase().includes(q)) ||
        t.cashier_name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border border-amber-500/20 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-400" />
            <h1 className="text-xl font-black text-slate-100 font-serif">Riwayat Transaksi Penjualan</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Lihat riwayat lengkap transaksi, cetak ulang struk thermal, status sinkronisasi, dan prosedur retur resmi.
          </p>
        </div>

        <button
          onClick={fetchTransactions}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="w-full md:w-72 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari No. Struk, kasir, pelanggan..."
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="w-full md:w-auto flex flex-wrap items-center gap-2">
          {/* Date */}
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
          />

          {/* Payment Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
          >
            <option value="all">Semua Status</option>
            <option value="lunas">Lunas</option>
            <option value="sebagian">Sebagian / Tempo</option>
            <option value="belum lunas">Belum Lunas</option>
          </select>

          {/* Payment Method */}
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
          >
            <option value="all">Semua Metode</option>
            <option value="tunai">Tunai</option>
            <option value="qris">QRIS</option>
            <option value="transfer">Transfer</option>
            <option value="debit">Debit</option>
            <option value="kredit">Kredit</option>
            <option value="tempo">Tempo</option>
          </select>

          {(statusFilter !== 'all' || methodFilter !== 'all' || dateFilter || search) && (
            <button
              onClick={() => {
                setStatusFilter('all');
                setMethodFilter('all');
                setDateFilter('');
                setSearch('');
              }}
              className="text-[11px] text-amber-400 hover:underline px-1"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3.5">No. Transaksi</th>
                <th className="p-3.5">Waktu</th>
                <th className="p-3.5">Kasir</th>
                <th className="p-3.5">Pelanggan</th>
                <th className="p-3.5">Item</th>
                <th className="p-3.5">Total Belanja</th>
                <th className="p-3.5">Metode</th>
                <th className="p-3.5">Status Bayar</th>
                <th className="p-3.5">Sinkronisasi</th>
                <th className="p-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-500">
                    Tidak ada transaksi ditemukan.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((trx) => (
                  <tr key={trx.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3.5 font-mono font-bold text-amber-300">{trx.invoice_number}</td>
                    <td className="p-3.5 text-slate-400">{formatDateTime(trx.created_at)}</td>
                    <td className="p-3.5 text-slate-300 font-medium">{trx.cashier_name}</td>
                    <td className="p-3.5 text-slate-200">{trx.customer_name || 'Umum'}</td>
                    <td className="p-3.5 font-mono text-slate-400">{trx.items_count || '-'} item</td>
                    <td className="p-3.5 font-mono font-bold text-amber-400">
                      {formatRupiah(trx.total)}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold text-[10px]">
                        {trx.payment_method}
                      </span>
                    </td>
                    <td className="p-3.5">
                      {trx.payment_status === 'Lunas' ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                          Lunas
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                          Tempo ({formatRupiah(trx.remaining_debt || 0)})
                        </span>
                      )}
                    </td>
                    <td className="p-3.5">
                      {trx.offline_created ? (
                        <span className="px-2 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-800 text-[10px] font-semibold">
                          Tersimpan Offline
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-semibold">
                          Online Server
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenReceipt(trx)}
                          className="p-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-600/40 text-emerald-300 hover:text-amber-300 transition"
                          title="Cetak Ulang Struk / Unduh / WhatsApp"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenReturn(trx)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-950 text-slate-400 hover:text-amber-400 transition"
                          title="Proses Retur Barang"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reprint Receipt Modal */}
      {selectedTrx && (
        <ReceiptModal
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
          transaction={selectedTrx}
          items={selectedItems}
          store={store}
          onNewTransaction={() => setShowReceiptModal(false)}
        />
      )}

      {/* Return Modal */}
      {showReturnModal && trxToReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-amber-500/30 rounded-2xl overflow-hidden shadow-2xl flex flex-col text-slate-100 max-h-[88vh]">
            <div className="p-4 bg-emerald-950/80 border-b border-amber-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm text-slate-100">
                  Retur Barang Transaksi #{trxToReturn.invoice_number}
                </h3>
              </div>
              <button
                onClick={() => setShowReturnModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              <p className="text-xs text-slate-400">
                Pilih kuantitas barang yang ingin dikembalikan ke stok toko. Sistem akan mencatat riwayat mutasi retur dan penyesuaian nominal secara transparan.
              </p>

              <div className="space-y-2 border border-slate-800 rounded-xl p-3 bg-slate-950">
                {selectedItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 py-1.5 border-b border-slate-900 last:border-0">
                    <div>
                      <div className="text-xs font-bold text-slate-200">{item.name_snapshot || item.name}</div>
                      <div className="text-[10px] text-slate-500">
                        Beli: {item.qty} {item.unit || 'pcs'} @ {formatRupiah(item.sell_price_snapshot || item.unit_price || 0)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400">Jml Retur:</span>
                      <input
                        type="number"
                        min="0"
                        max={item.qty}
                        value={returnQtyMap[item.id] || 0}
                        onChange={(e) => {
                          const val = Math.min(item.qty, Math.max(0, Number(e.target.value) || 0));
                          setReturnQtyMap((prev) => ({ ...prev, [item.id]: val }));
                        }}
                        className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-center font-mono font-bold text-amber-300"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Alasan Retur / Pembatalan
                </label>
                <textarea
                  rows={2}
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="Misal: Kemasan rusak, tukar varian lain, salah beli..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end gap-2">
              <button
                onClick={() => setShowReturnModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
              >
                Batal
              </button>
              <button
                onClick={handleSubmitReturn}
                disabled={isProcessingReturn}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 transition"
              >
                <CheckCircle2 className="w-4 h-4 text-slate-950" />
                <span>{isProcessingReturn ? 'Memproses...' : 'Konfirmasi Retur'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
