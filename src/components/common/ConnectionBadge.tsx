import React, { useEffect, useState } from 'react';
import { syncService } from '../../lib/syncService';
import { ConnectionState, SyncConflict } from '../../types/pos';
import { Wifi, WifiOff, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface ConnectionBadgeProps {
  onShowConflicts?: (conflicts: SyncConflict[]) => void;
}

export const ConnectionBadge: React.FC<ConnectionBadgeProps> = ({ onShowConflicts }) => {
  const [state, setState] = useState<ConnectionState>(syncService.getState());
  const [pendingCount, setPendingCount] = useState<number>(syncService.getPendingCount());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastMessage, setLastMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = syncService.subscribeStatus((newState, count) => {
      setState(newState);
      setPendingCount(count);
    });

    const unsubscribeConflicts = syncService.subscribeConflicts((conflicts) => {
      if (onShowConflicts && conflicts.length > 0) {
        onShowConflicts(conflicts);
      }
    });

    return () => {
      unsubscribe();
      unsubscribeConflicts();
    };
  }, [onShowConflicts]);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const res = await syncService.syncAll();
      setLastMessage(res.message);
      if (res.conflicts.length > 0 && onShowConflicts) {
        onShowConflicts(res.conflicts);
      }
      setTimeout(() => setLastMessage(null), 4000);
    } catch {
      setLastMessage('Sinkronisasi gagal');
      setTimeout(() => setLastMessage(null), 4000);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Dynamic Status Badge */}
      {state === 'offline' && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-semibold animate-pulse">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Offline Kasir</span>
        </div>
      )}

      {state === 'syncing' && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-500/15 border border-sky-500/40 text-sky-300 text-xs font-semibold">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>Menyinkronkan...</span>
        </div>
      )}

      {state === 'error' && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-semibold">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Gagal Sinkronisasi</span>
        </div>
      )}

      {state === 'online' && pendingCount === 0 && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Online & Sinkron</span>
        </div>
      )}

      {/* Pending count badge if any */}
      {pendingCount > 0 && (
        <button
          onClick={handleManualSync}
          disabled={isSyncing}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-950/80 border border-sky-400/50 text-sky-200 text-xs font-bold hover:bg-sky-900 transition shadow-sm active:scale-95"
          title="Ada transaksi offline menunggu kirim. Klik untuk sinkronisasi ke server"
        >
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
          <span>{pendingCount} Transaksi Offline</span>
          <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
        </button>
      )}

      {/* Quick sync trigger button */}
      <button
        onClick={handleManualSync}
        disabled={isSyncing}
        className="p-1.5 rounded-lg bg-emerald-950 border border-emerald-700/50 text-emerald-300 hover:text-amber-300 hover:border-amber-500/40 transition active:scale-95"
        title="Sinkronkan data sekarang"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-amber-400' : ''}`} />
      </button>

      {lastMessage && (
        <div className="fixed bottom-4 right-4 z-50 bg-slate-900/95 border border-amber-500/50 text-amber-200 text-xs px-3.5 py-2 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{lastMessage}</span>
        </div>
      )}
    </div>
  );
};
