import React, { useState, useEffect } from 'react';
import { Transaction } from '../../types/pos';
import { formatRupiah, formatDateTime } from '../../lib/printerService';
import { syncService } from '../../lib/syncService';
import {
  BarChart3,
  Calendar,
  Download,
  Printer,
  DollarSign,
  TrendingUp,
  CreditCard,
  Layers,
  Filter,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('month');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/transactions');
      if (res.ok) {
        setTransactions(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  // Filter transactions by selected period or custom dates
  const filteredTrx = transactions.filter((t) => {
    const tDate = t.created_at.substring(0, 10);
    const today = new Date().toISOString().substring(0, 10);

    if (dateFrom && tDate < dateFrom) return false;
    if (dateTo && tDate > dateTo) return false;

    if (!dateFrom && !dateTo) {
      if (period === 'today') return tDate === today;
      if (period === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return tDate >= weekAgo.toISOString().substring(0, 10);
      }
      if (period === 'month') {
        return tDate.substring(0, 7) === today.substring(0, 7);
      }
    }
    return true;
  });

  // Calculate Aggregations
  const totalRevenue = filteredTrx.reduce((sum, t) => sum + (t.total || 0), 0);
  const totalSubtotal = filteredTrx.reduce((sum, t) => sum + (t.subtotal || 0), 0);
  const totalDiscount = filteredTrx.reduce((sum, t) => sum + (t.discount || 0), 0);
  const totalTax = filteredTrx.reduce((sum, t) => sum + (t.tax || 0), 0);
  const totalCashReceived = filteredTrx.reduce((sum, t) => sum + (t.total_paid || 0), 0);
  const totalOutstandingDebt = filteredTrx.reduce((sum, t) => sum + (t.remaining_debt || 0), 0);

  // Approximate COGS / Modal from transaction items if present
  let totalCostOfGoods = 0;
  filteredTrx.forEach((t) => {
    if (t.items_detail) {
      t.items_detail.forEach((it) => {
        totalCostOfGoods += (it.cost_price_snapshot || 0) * (it.qty || 1);
      });
    }
  });
  const grossProfit = Math.max(0, totalRevenue - totalCostOfGoods);

  // Method breakdown
  const methodMap: Record<string, { count: number; total: number }> = {};
  filteredTrx.forEach((t) => {
    const m = t.payment_method || 'Tunai';
    if (!methodMap[m]) methodMap[m] = { count: 0, total: 0 };
    methodMap[m].count += 1;
    methodMap[m].total += t.total || 0;
  });

  const handleExportCSV = () => {
    const headers = ['No. Invoice', 'Tanggal & Waktu', 'Kasir', 'Pelanggan', 'Metode Bayar', 'Subtotal', 'Diskon', 'Pajak', 'Total Belanja', 'Dibayar', 'Sisa Tempo', 'Status'];
    const rows = filteredTrx.map((t) => [
      `"${t.invoice_number}"`,
      `"${t.created_at}"`,
      `"${t.cashier_name}"`,
      `"${t.customer_name || 'Umum'}"`,
      `"${t.payment_method}"`,
      t.subtotal,
      t.discount,
      t.tax,
      t.total,
      t.total_paid,
      t.remaining_debt,
      `"${t.payment_status}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Penjualan_HILALPOS_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border border-amber-500/20 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-400" />
            <h1 className="text-xl font-black text-slate-100 font-serif">
              Laporan Keuangan & Analisis Penjualan
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Rekap omzet, arus kas pembayaran diterima, laba kotor, piutang tempo, dan ekspor pembukuan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Ekspor CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-xl bg-emerald-950 hover:bg-emerald-900 border border-emerald-600/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>Cetak Laporan</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3">
        {/* Period Buttons */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
          {[
            { id: 'today', label: 'Hari Ini' },
            { id: 'week', label: '7 Hari Terakhir' },
            { id: 'month', label: 'Bulan Ini' },
            { id: 'all', label: 'Semua Periode' },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setPeriod(p.id as any);
                setDateFrom('');
                setDateTo('');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                period === p.id && !dateFrom
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Custom Date Range */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Rentang Tanggal:</span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200"
          />
          <span className="text-slate-400">s/d</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200"
          />
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-500/30">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Omzet Penjualan
          </span>
          <div className="text-2xl font-black text-amber-300 font-mono mt-2">
            {formatRupiah(totalRevenue)}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            Dari {filteredTrx.length} transaksi selesai
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-500/30">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Pembayaran Diterima (Kas Masuk)
          </span>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-2">
            {formatRupiah(totalCashReceived)}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Arus kas tunai & nontunai</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-amber-500/30">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Perkiraan Laba Kotor
          </span>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-2">
            {formatRupiah(grossProfit)}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            Margin: {totalRevenue > 0 ? `${Math.round((grossProfit / totalRevenue) * 100)}%` : '0%'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-rose-500/30">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Piutang / Tempo Belum Lunas
          </span>
          <div className="text-2xl font-black text-rose-400 font-mono mt-2">
            {formatRupiah(totalOutstandingDebt)}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">Tagihan pelanggan berjalan</span>
        </div>
      </div>

      {/* Breakdown by Payment Method */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-amber-400" />
          <span>Rincian Berdasarkan Metode Pembayaran</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {Object.entries(methodMap).map(([method, val], i) => (
            <div key={i} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase">{method}</span>
              <div className="text-sm font-black text-amber-300 font-mono">{formatRupiah(val.total)}</div>
              <span className="text-[10px] text-slate-500">{val.count} transaksi</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
