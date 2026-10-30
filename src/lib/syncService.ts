import {
  cacheProducts,
  cacheMasterData,
  getPendingOfflineTransactions,
  removePendingOfflineTransaction,
  updatePendingTransactionError,
  cacheTransactionLocally,
  saveLocalSetting,
} from './indexedDb';
import { ConnectionState, SyncConflict } from '../types/pos';

type StatusListener = (state: ConnectionState, pendingCount: number) => void;
type ConflictListener = (conflicts: SyncConflict[]) => void;

class SyncService {
  private state: ConnectionState = navigator.onLine ? 'online' : 'offline';
  private pendingCount = 0;
  private statusListeners: Set<StatusListener> = new Set();
  private conflictListeners: Set<ConflictListener> = new Set();
  private syncInProgress = false;
  private pingIntervalId: any = null;
  private lastSuccessfulSync: string | null = null;

  constructor() {
    this.initListeners();
    this.startHealthPing();
    this.refreshPendingCount();
  }

  private initListeners() {
    window.addEventListener('online', () => {
      this.checkConnectionAndSync();
    });

    window.addEventListener('offline', () => {
      this.setState('offline');
    });
  }

  private startHealthPing() {
    // Check health every 15 seconds
    this.pingIntervalId = setInterval(() => {
      this.checkConnection();
    }, 15000);
  }

  public async checkConnection(): Promise<boolean> {
    if (!navigator.onLine) {
      this.setState('offline');
      return false;
    }

    try {
      const res = await fetch('/api/health', {
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache' },
        signal: AbortSignal.timeout(3000),
      });

      if (res.ok) {
        if (this.state === 'offline') {
          // Connection just restored!
          this.checkConnectionAndSync();
        } else if (this.state !== 'syncing') {
          this.setState('online');
        }
        return true;
      } else {
        this.setState('offline');
        return false;
      }
    } catch {
      this.setState('offline');
      return false;
    }
  }

  private async checkConnectionAndSync() {
    this.setState('online');
    await this.syncAll();
  }

  public subscribeStatus(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.state, this.pendingCount);
    return () => this.statusListeners.delete(listener);
  }

  public subscribeConflicts(listener: ConflictListener): () => void {
    this.conflictListeners.add(listener);
    return () => this.conflictListeners.delete(listener);
  }

  private setState(newState: ConnectionState) {
    this.state = newState;
    this.notifyStatus();
  }

  private notifyStatus() {
    this.statusListeners.forEach((l) => l(this.state, this.pendingCount));
  }

  public async refreshPendingCount(): Promise<number> {
    try {
      const list = await getPendingOfflineTransactions();
      this.pendingCount = list.length;
      this.notifyStatus();
      return this.pendingCount;
    } catch {
      return 0;
    }
  }

  public getState(): ConnectionState {
    return this.state;
  }

  public getPendingCount(): number {
    return this.pendingCount;
  }

  public getLastSyncTime(): string | null {
    return this.lastSuccessfulSync;
  }

  /**
   * Pull master data from server and cache into IndexedDB
   */
  public async pullServerData(): Promise<boolean> {
    try {
      const res = await fetch('/api/sync/pull', { signal: AbortSignal.timeout(6000) });
      if (!res.ok) throw new Error('Gagal mengunduh katalog data server');

      const data = await res.json();
      if (data.products && Array.isArray(data.products)) {
        await cacheProducts(data.products);
      }
      if (data.categories && data.units && data.customers) {
        await cacheMasterData(data.categories, data.units, data.customers);
      }
      if (data.store) {
        await saveLocalSetting('store_profile', data.store);
      }

      this.lastSuccessfulSync = new Date().toISOString();
      return true;
    } catch (err) {
      console.warn('Pull server data skipped or failed:', err);
      return false;
    }
  }

  /**
   * Push pending offline transactions to server with idempotency & stock reconciliation
   */
  public async pushPendingTransactions(): Promise<{ synced: number; conflicts: SyncConflict[] }> {
    const queue = await getPendingOfflineTransactions();
    if (queue.length === 0) {
      return { synced: 0, conflicts: [] };
    }

    try {
      const deviceId = localStorage.getItem('hilalpos_device_id') || `POS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      localStorage.setItem('hilalpos_device_id', deviceId);

      const res = await fetch('/api/sync/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: deviceId,
          transactions: queue,
        }),
        signal: AbortSignal.timeout(12000),
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const result = await res.json();

      // Successfully pushed! Remove processed items from local queue and cache them into synced transactions
      for (const item of queue) {
        await removePendingOfflineTransaction(item.id);
        await cacheTransactionLocally({
          ...item,
          synced_at: result.timestamp || new Date().toISOString(),
          sync_status: 'SYNCED',
        });
      }

      // Notify any stock conflicts
      if (result.conflicts && result.conflicts.length > 0) {
        this.conflictListeners.forEach((l) => l(result.conflicts));
      }

      await this.refreshPendingCount();
      return { synced: result.synced_count || queue.length, conflicts: result.conflicts || [] };
    } catch (err: any) {
      console.error('Error during push sync:', err);
      for (const item of queue) {
        await updatePendingTransactionError(item.id, err.message || 'Gagal terhubung ke server');
      }
      throw err;
    }
  }

  /**
   * Trigger full two-way synchronization
   */
  public async syncAll(): Promise<{ success: boolean; message: string; conflicts: SyncConflict[] }> {
    if (this.syncInProgress) {
      return { success: false, message: 'Sinkronisasi sedang berjalan', conflicts: [] };
    }

    this.syncInProgress = true;
    this.setState('syncing');

    try {
      // Step 1: Push offline transactions
      const pushResult = await this.pushPendingTransactions();

      // Step 2: Pull latest master catalog
      await this.pullServerData();

      this.setState('online');
      await this.refreshPendingCount();
      this.syncInProgress = false;

      let msg = 'Sinkronisasi selesai sempurna!';
      if (pushResult.synced > 0) {
        msg = `${pushResult.synced} transaksi offline berhasil terkirim ke server.`;
      }
      if (pushResult.conflicts.length > 0) {
        msg += ` (${pushResult.conflicts.length} konflik stok disesuaikan)`;
      }

      return { success: true, message: msg, conflicts: pushResult.conflicts };
    } catch (err: any) {
      this.syncInProgress = false;
      this.setState('error');
      await this.refreshPendingCount();
      return {
        success: false,
        message: err.message || 'Sinkronisasi gagal, antrean tetap tersimpan aman di perangkat lokal.',
        conflicts: [],
      };
    }
  }
}

export const syncService = new SyncService();
