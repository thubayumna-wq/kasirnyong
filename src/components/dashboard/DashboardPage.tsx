import React, { useState, useEffect } from 'react';
import { formatRupiah } from '../../lib/printerService';
import { syncService } from '../../lib/syncService';
import { ConnectionState, StoreSettings } from '../../types/pos';
import {
  TrendingUp,
  Receipt,
  Wallet,
  Clock,
  AlertTriangle,
  Package,
  Layers,
  ArrowUpRight,
  RefreshCw,
  ShoppingBag,
  DollarSign,
  PieChart,
  Calendar,
} from 'lucide-react';

interface DashboardPageProps {
  store: StoreSettings;
  onNavigateToPOS: () => void;
  onNavigateToStock: () => void;
  onNavigateToDebt: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  store,
  onNavigateToPOS,
  onNavigateToStock,
  onNavigateToDebt,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [connState, setConnState] = useState<ConnectionState>(syncService.getState());
  const [pendingOfflineCount, setPendingOfflineCount] = useState<number>(syncService.getPendingCount());

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      if (syncService.getState() === 'online') {
        const res = await fetch('/api/reports/dashboard');
        if (res.ok) {
          const data = await res.json();
          setDashboardData(data);
          setLoading(false);
          return;
        }
      }
    } catch {
      // Offline fallback
    }

    // Default sample metrics if offline
    setDashboardData({
      today: {
        revenue: 52000,
        transactions_count: 1,
        cash_received: 60000,
        gross_profit: 7000,
      },
      total_debt: 125000,
      payment_methods: {
        Tunai: { count: 1, total: 52000 },
      },
      top_products: [
        { name: 'Kopi Kapal Api Special Mix', sku: 'SBK-KOP-001', qty: 10, revenue: 18000 },
        { name: 'Minyak Goreng Sania Pouch 2L', sku: 'SBK-MYK-001', qty: 1, revenue: 34000 },
      ],
      low_stock_products: [
        { id: 'prod-006', name: 'Kabel Fast Charging Type-C 65W', sku: 'ELK-KBL-001', current_stock: 5, min_stock: 5, base_unit: 'pcs' },
      ],
      weekly_trends: [
        { date: '2026-10-23', label: 'Jum (23)', revenue: 450000, profit: 120000, transactions: 15 },
        { date: '2026-10-24', label: 'Sab (24)', revenue: 680000, profit: 195000, transactions: 24 },
        { date: '2026-10-25', label: 'Min (25)', revenue: 720000, profit: 210000, transactions: 28 },
        { date: '2026-10-26', label: 'Sen (26)', revenue: 390000, profit: 98000, transactions: 12 },
        { date: '2026-10-27', label: 'Sel (27)', revenue: 510000, profit: 140000, transactions: 18 },
        { date: '2026-10-28', label: 'Rab (28)', revenue: 630000, profit: 185000, transactions: 22 },
        { date: '2026-10-29', label: 'Kam (29)', revenue: 52000, profit: 7000, transactions: 1 },
      ],
      total_active_products: 7,
      total_customers: 2,
    });
    setLoading(false);
  };

  useEffect(() => {
    fetchDashboardData();
    const unsub = syncService.subscribeStatus((st, count) => {
      setConnState(st);
      setPendingOfflineCount(count);
    });
    return () => unsub();
  }, []);

  const d = dashboardData;
  const maxWeeklyRevenue = Math.max(...(d?.weekly_trends?.map((t: any) => t.revenue) || [100000]));

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-950 text-slate-100">
      {/* Top Welcome & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border border-amber-500/30 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-extrabold tracking-widest text-amber-400">
              Dashboard Operasional
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span className="text-xs text-emerald-300 font-semibold">{store.name}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-100 font-serif">
            Ringkasan Penjualan & Performa Usaha
          </h1>
          <p className="text-xs text-slate-400">
            Data terintegrasi realtime dengan dukungan sinkronisasi kasir online & offline.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchDashboardData}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Muat Ulang Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          </button>
          <button
            onClick={onNavigateToPOS}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-950/50 flex items-center gap-2 transition active:scale-95"
          >
            <ShoppingBag className="w-4 h-4 text-slate-950" />
            <span>Buka Kasir / POS</span>
          </button>
        </div>
      </div>

      {/* Offline Pending Queue Notice if any */}
      {pendingOfflineCount > 0 && (
        <div className="p-4 rounded-xl bg-sky-950/70 border border-sky-400/50 text-sky-200 text-xs flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2.5">
            <RefreshCw className="w-4 h-4 text-sky-400 animate-spin" />
            <span>
              Ada <strong>{pendingOfflineCount} transaksi kasir</strong> tersimpan di perangkat lokal yang belum tersinkron ke server.
            </span>
          </div>
          <button
            onClick={() => syncService.syncAll()}
            className="px-3 py-1.5 rounded-lg bg-sky-500 text-slate-950 font-bold hover:bg-sky-400 transition"
          >
            Kirim ke Server Sekarang
          </button>
        </div>
      )}

      {/* 4 Key Stat Cards (Omzet, Transaksi, Laba, Piutang) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Omzet Hari Ini */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-500/30 flex flex-col justify-between shadow-lg">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Omzet Penjualan Hari Ini
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-300 font-mono">
              {formatRupiah(d?.today?.revenue || 0)}
            </div>
            <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 mt-1">
              <ArrowUpRight className="w-3 h-3" />
              Pembayaran Diterima: {formatRupiah(d?.today?.cash_received || 0)}
            </span>
          </div>
        </div>

        {/* Jumlah Transaksi Hari Ini */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-amber-500/30 flex flex-col justify-between shadow-lg">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Transaksi Hari Ini
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-100 font-mono">
              {d?.today?.transactions_count || 0} <span className="text-sm font-sans font-medium text-slate-400">struk</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Rata-rata: {d?.today?.transactions_count > 0 ? formatRupiah((d.today.revenue || 0) / d.today.transactions_count) : 'Rp0'}
            </span>
          </div>
        </div>

        {/* Perkiraan Laba Kotor Hari Ini */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-emerald-500/30 flex flex-col justify-between shadow-lg">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Perkiraan Laba Kotor (Margin)
            </span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-400 font-mono">
              {formatRupiah(d?.today?.gross_profit || 0)}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              {d?.today?.revenue > 0 ? `Margin: ${Math.round(((d.today.gross_profit || 0) / d.today.revenue) * 100)}% dari omzet` : 'Belum ada transaksi'}
            </span>
          </div>
        </div>

        {/* Saldo Piutang / Tempo Aktif */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-amber-500/30 flex flex-col justify-between shadow-lg">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Saldo Piutang / Tempo Pelanggan
            </span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-400 font-mono">
              {formatRupiah(d?.total_debt || 0)}
            </div>
            <button
              onClick={onNavigateToDebt}
              className="text-[10px] text-amber-300 hover:underline font-semibold mt-1 block"
            >
              Lihat Buku Piutang & Pelunasan &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Middle Section: Weekly Trend Chart & Payment Methods Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Trend Bar Chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-sm text-slate-100">Tren Penjualan 7 Hari Terakhir</h3>
            </div>
            <span className="text-[11px] text-slate-400">Total Omzet per Hari</span>
          </div>

          {/* Bar Chart Visualization */}
          <div className="h-44 flex items-end justify-between gap-2 pt-4 px-2">
            {d?.weekly_trends?.map((item: any, idx: number) => {
              const heightPercent = maxWeeklyRevenue > 0 ? Math.round((item.revenue / maxWeeklyRevenue) * 100) : 10;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <span className="text-[9px] font-mono text-amber-300 opacity-0 group-hover:opacity-100 transition-opacity">
                    {formatRupiah(item.revenue)}
                  </span>
                  <div
                    style={{ height: `${Math.max(12, heightPercent)}%` }}
                    className="w-full max-w-[42px] rounded-t-lg bg-gradient-to-t from-emerald-800 via-emerald-600 to-amber-500 group-hover:brightness-125 transition-all relative"
                  />
                  <span className="text-[10px] text-slate-400 font-mono">{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-sm text-slate-100">Metode Pembayaran Hari Ini</h3>
          </div>

          <div className="space-y-3 pt-2">
            {d?.payment_methods && Object.keys(d.payment_methods).length > 0 ? (
              Object.entries(d.payment_methods).map(([method, val]: any, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-200">{method}</span>
                    <span className="font-mono font-bold text-amber-300">{formatRupiah(val.total)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>{val.count} transaksi</span>
                    <span>{d.today.revenue > 0 ? `${Math.round((val.total / d.today.revenue) * 100)}%` : '0%'}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-500">
                Belum ada transaksi tercatat hari ini.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section: Top Selling Products & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-sm text-slate-100">Produk Terlaris</h3>
            </div>
            <span className="text-[11px] text-slate-400">Berdasarkan volume</span>
          </div>

          <div className="space-y-2.5">
            {d?.top_products?.length > 0 ? (
              d.top_products.map((tp: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-emerald-950 text-amber-400 border border-emerald-600/40 text-xs font-black flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">{tp.name}</h4>
                      <span className="text-[10px] text-slate-500 font-mono">SKU: {tp.sku}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-amber-300 block">
                      {tp.qty} terjual
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {formatRupiah(tp.revenue)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-500">Belum ada data barang terjual</div>
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-sm text-slate-100">Peringatan Stok Menipis</h3>
            </div>
            <button
              onClick={onNavigateToStock}
              className="text-[11px] text-amber-400 hover:underline font-semibold"
            >
              Kelola Stok &rarr;
            </button>
          </div>

          <div className="space-y-2.5">
            {d?.low_stock_products?.length > 0 ? (
              d.low_stock_products.map((lp: any) => (
                <div
                  key={lp.id}
                  className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 flex items-center justify-between gap-3"
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">{lp.name}</h4>
                    <span className="text-[10px] text-slate-500 font-mono">SKU: {lp.sku}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-amber-400 block">
                      Sisa: {lp.current_stock} {lp.base_unit}
                    </span>
                    <span className="text-[10px] text-slate-500">Min. {lp.min_stock} {lp.base_unit}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-emerald-400 flex items-center justify-center gap-2">
                <span>Seluruh stok barang aman di atas batas minimum.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
