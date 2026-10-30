import React, { useState, useEffect } from 'react';
import { syncService } from '../../lib/syncService';
import {
  getPendingOfflineTransactions,
  removePendingOfflineTransaction,
} from '../../lib/indexedDb';
import { ConnectionState, SyncConflict } from '../../types/pos';
import { formatRupiah, formatDateTime } from '../../lib/printerService';
import {
  RefreshCw,
  Wifi,
  WifiOff,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Database,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';

export const SyncStatusPage: React.FC = () => {
  const [connState, setConnState] = useState<ConnectionState>(syncService.getState());
  const [pendingQueue, setPendingQueue] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);

  const loadQueue = async () => {
    const list = await getPendingOfflineTransactions();
    setPendingQueue(list);
  };

  useEffect(() => {
    loadQueue();
    const unsub = syncService.subscribeStatus((st) => {
      setConnState(st);
      loadQueue();
    });
    const unsubConf = syncService.subscribeConflicts((confs) => {
      setConflicts(confs);
    });

    return () => {
      unsub();
      unsubConf();
    };
  }, []);

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const res = await syncService.syncAll();
      setSyncMessage(res.message);
      if (res.conflicts) setConflicts(res.conflicts);
      await loadQueue();
    } catch (e: any) {
      setSyncMessage(e.message || 'Sinkronisasi gagal');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRemoveQueueItem = async (id: string, invoice: string) => {
    if (confirm(`Hapus transaksi ${invoice} dari antrean offline? Transaksi tidak akan dikirim ke server.`)) {
      await removePendingOfflineTransaction(id);
      await syncService.refreshPendingCount();
      await loadQueue();
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border border-amber-500/20 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-amber-400" />
            <h1 className="text-xl font-black text-slate-100 font-serif">
              Status Sinkronisasi & Antrean Offline
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Pantau status koneksi server, antrean transaksi lokal IndexedDB, dan rekonsiliasi data.
          </p>
        </div>

        <button
          onClick={handleTriggerSync}
          disabled={isSyncing}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black shadow-lg shadow-amber-950/50 flex items-center gap-2 transition active:scale-95 disabled:opacity-40"
        >
          <RefreshCw className={`w-4 h-4 text-slate-950 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronisasi Sekarang'}</span>
        </button>
      </div>

      {syncMessage && (
        <div className="p-3.5 rounded-xl bg-slate-900 border border-amber-500/50 text-amber-300 text-xs font-bold flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{syncMessage}</span>
        </div>
      )}

      {/* Connectivity Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Connection State */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Kondisi Jaringan
          </span>
          <div className="flex items-center gap-2.5">
            {connState === 'online' ? (
              <>
                <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-lg font-black text-emerald-400">Online & Terhubung</span>
              </>
            ) : connState === 'offline' ? (
              <>
                <div className="w-3 h-3 rounded-full bg-amber-400 animate-ping" />
                <span className="text-lg font-black text-amber-400">Offline (Lokal)</span>
              </>
            ) : connState === 'syncing' ? (
              <>
                <RefreshCw className="w-4 h-4 text-sky-400 animate-spin" />
                <span className="text-lg font-black text-sky-400">Sedang Sinkronisasi</span>
              </>
            ) : (
              <>
                <div className="w-3 h-3 rounded-full bg-rose-400" />
                <span className="text-lg font-black text-rose-400">Gagal Sinkronisasi</span>
              </>
            )}
          </div>
          <span className="text-[11px] text-slate-400 block">
            {connState === 'offline'
              ? 'Kasir tetap dapat bertransaksi, data tersimpan di IndexedDB browser.'
              : 'Siap mengirim dan menerima data terbaru dari server pusat.'}
          </span>
        </div>

        {/* Offline Queue Items Count */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Antrean Transaksi Belum Terkirim
          </span>
          <div className="text-2xl font-black text-amber-300 font-mono">
            {pendingQueue.length} <span className="text-sm font-sans font-medium text-slate-400">transaksi</span>
          </div>
          <span className="text-[11px] text-slate-400 block">
            Tersimpan aman di IndexedDB perangkat ini.
          </span>
        </div>

        {/* Local Storage Engine */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Penyimpanan Offline Lokal
          </span>
          <div className="flex items-center gap-2 text-slate-200 font-bold text-sm">
            <Database className="w-4 h-4 text-emerald-400" />
            <span>IndexedDB (HILALPOS_LOCAL_DB)</span>
          </div>
          <span className="text-[11px] text-slate-400 block">
            Mendukung jutaan barang tanpa batasan localStorage 5MB.
          </span>
        </div>
      </div>

      {/* Conflicts section if any */}
      {conflicts.length > 0 && (
        <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-500/40 space-y-3">
          <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <span>Catatan Rekonsiliasi & Konflik Stok Terdeteksi</span>
          </div>
          <div className="space-y-2">
            {conflicts.map((conf, idx) => (
              <div key={idx} className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-300">
                <div className="font-bold text-amber-300">{conf.transaction_invoice} — {conf.product_name}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{conf.message}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Transactions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <h3 className="font-bold text-xs uppercase tracking-wider text-amber-400">
            Daftar Rincian Antrean Transaksi Offline
          </h3>
          <span className="text-xs text-slate-400">{pendingQueue.length} antrean</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3.5">No. Transaksi</th>
                <th className="p-3.5">Waktu Transaksi</th>
                <th className="p-3.5">Pelanggan</th>
                <th className="p-3.5">Jumlah Item</th>
                <th className="p-3.5">Total Belanja</th>
                <th className="p-3.5">Metode Bayar</th>
                <th className="p-3.5">Status Sinkron</th>
                <th className="p-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {pendingQueue.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-emerald-400">
                    Semua transaksi telah tersinkronisasi ke server pusat. Tidak ada antrean offline yang tertunda.
                  </td>
                </tr>
              ) : (
                pendingQueue.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-3.5 font-mono font-bold text-amber-300">{item.invoice_number}</td>
                    <td className="p-3.5 text-slate-400">{formatDateTime(item.created_at)}</td>
                    <td className="p-3.5 text-slate-200">{item.customer_name}</td>
                    <td className="p-3.5 font-mono text-slate-400">{item.items?.length || 0} item</td>
                    <td className="p-3.5 font-mono font-bold text-amber-400">{formatRupiah(item.total)}</td>
                    <td className="p-3.5 text-slate-300">{item.payment_method}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-800 text-[10px] font-bold">
                        Menunggu Kirim
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => handleRemoveQueueItem(item.id, item.invoice_number)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition"
                        title="Hapus dari antrean"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
