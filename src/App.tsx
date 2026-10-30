/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, StoreSettings, SyncConflict } from './types/pos';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, NavMenuKey } from './components/layout/Sidebar';
import { LoginPage } from './components/auth/LoginPage';
import { SetupWizardModal } from './components/auth/SetupWizardModal';
import { PosPage } from './components/pos/PosPage';
import { DashboardPage } from './components/dashboard/DashboardPage';
import { ProductsPage } from './components/products/ProductsPage';
import { TransactionHistoryPage } from './components/transactions/TransactionHistoryPage';
import { InventoryPage } from './components/inventory/InventoryPage';
import { CustomersPage } from './components/customers/CustomersPage';
import { ReportsPage } from './components/reports/ReportsPage';
import { SettingsPage } from './components/settings/SettingsPage';
import { UsersPage } from './components/users/UsersPage';
import { SyncStatusPage } from './components/sync/SyncStatusPage';
import { CategoriesAndUnitsPage } from './components/master/CategoriesAndUnitsPage';
import { SuppliersPage } from './components/master/SuppliersPage';
import { syncService } from './lib/syncService';
import { getLocalSetting, saveLocalSetting } from './lib/indexedDb';
import { ShieldAlert, X } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [store, setStore] = useState<StoreSettings>({
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
    receipt_footer: 'Terima kasih atas kunjungan Anda!\nBarang yang sudah dibeli tidak dapat ditukar kecuali perjanjian.',
    whatsapp_sender: '6281234567890',
    whatsapp_template: 'Halo {customer}, terima kasih telah berbelanja di {store}!',
    negative_stock_allowed: false,
  });

  const [currentMenu, setCurrentMenu] = useState<NavMenuKey>('pos');
  const [isOpenMobile, setIsOpenMobile] = useState<boolean>(false);
  const [showSetupModal, setShowSetupModal] = useState<boolean>(false);
  const [activeConflicts, setActiveConflicts] = useState<SyncConflict[]>([]);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [initialized, setInitialized] = useState<boolean>(false);

  // Initialize and check session / store settings
  useEffect(() => {
    const initApp = async () => {
      // 1. Try restore session from local IndexedDB
      try {
        const cachedUser = await getLocalSetting<User>('current_session_user');
        const cachedStore = await getLocalSetting<StoreSettings>('store_profile');
        if (cachedUser) setCurrentUser(cachedUser);
        if (cachedStore) setStore(cachedStore);
      } catch (e) {
        console.warn('Session cache read error', e);
      }

      // 2. Fetch fresh store info from backend if online
      try {
        const res = await fetch('/api/settings');
        if (res.ok) {
          const freshStore = await res.json();
          if (freshStore && freshStore.name) {
            setStore(freshStore);
            await saveLocalSetting('store_profile', freshStore);
          }
        }
      } catch {
        // Offline
      }

      // 3. Initial sync catalog pull
      syncService.pullServerData();

      setInitialized(true);
    };

    initApp();

    const unsub = syncService.subscribeStatus((_, count) => {
      setPendingSyncCount(count);
    });
    const unsubConf = syncService.subscribeConflicts((confs) => {
      setActiveConflicts(confs);
    });

    return () => {
      unsub();
      unsubConf();
    };
  }, []);

  const handleLoginSuccess = async (user: User, storeData: StoreSettings) => {
    setCurrentUser(user);
    if (storeData) setStore(storeData);
    await saveLocalSetting('current_session_user', user);
    if (storeData) await saveLocalSetting('store_profile', storeData);

    // If cashier, jump straight to POS screen!
    if (user.role === 'kasir') {
      setCurrentMenu('pos');
    } else {
      setCurrentMenu('dashboard');
    }
  };

  const handleLogout = async () => {
    if (confirm('Keluar dari sesi akun saat ini?')) {
      setCurrentUser(null);
      await saveLocalSetting('current_session_user', null);
    }
  };

  const handleSetupComplete = async (user: User, storeData: StoreSettings) => {
    setStore(storeData);
    setCurrentUser(user);
    await saveLocalSetting('current_session_user', user);
    await saveLocalSetting('store_profile', storeData);
    setShowSetupModal(false);
  };

  // If not logged in, display login screen
  if (!currentUser) {
    return (
      <>
        <LoginPage
          onLoginSuccess={handleLoginSuccess}
          onOpenSetup={() => setShowSetupModal(true)}
        />
        <SetupWizardModal
          isOpen={showSetupModal}
          onClose={() => setShowSetupModal(false)}
          onSetupComplete={handleSetupComplete}
        />
      </>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Navbar with brand monogram H, online status, pending count, and store pill */}
      <Navbar
        currentUser={currentUser}
        store={store}
        onLogout={handleLogout}
        onToggleSidebar={() => setIsOpenMobile(!isOpenMobile)}
        onShowConflicts={(confs) => setActiveConflicts(confs)}
        onOpenStoreSettings={() => setCurrentMenu('settings-store')}
      />

      {/* Main Container: Sidebar + Active Screen */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar with all 23 functions */}
        <Sidebar
          currentMenu={currentMenu}
          onSelectMenu={(menu) => setCurrentMenu(menu)}
          currentUser={currentUser}
          isOpenMobile={isOpenMobile}
          onCloseMobile={() => setIsOpenMobile(false)}
          pendingSyncCount={pendingSyncCount}
        />

        {/* Dynamic Main Workspace */}
        <main className="flex-1 flex flex-col overflow-hidden bg-slate-950">
          {currentMenu === 'pos' && (
            <PosPage
              currentUser={currentUser}
              store={store}
              onRefreshHistory={() => {}}
            />
          )}

          {currentMenu === 'dashboard' && (
            <DashboardPage
              store={store}
              onNavigateToPOS={() => setCurrentMenu('pos')}
              onNavigateToStock={() => setCurrentMenu('stock')}
              onNavigateToDebt={() => setCurrentMenu('debt')}
            />
          )}

          {currentMenu === 'products' && <ProductsPage />}
          {currentMenu === 'add-product' && <ProductsPage />}

          {(currentMenu === 'transactions' || currentMenu === 'returns') && (
            <TransactionHistoryPage store={store} />
          )}

          {(currentMenu === 'stock' || currentMenu === 'stock-in') && (
            <InventoryPage />
          )}

          {currentMenu === 'suppliers' && <SuppliersPage />}

          {(currentMenu === 'customers' || currentMenu === 'debt') && (
            <CustomersPage />
          )}

          {(currentMenu === 'report-sales' ||
            currentMenu === 'report-stock' ||
            currentMenu === 'report-payments') && <ReportsPage />}

          {currentMenu === 'categories' && (
            <CategoriesAndUnitsPage initialTab="categories" />
          )}

          {currentMenu === 'units' && (
            <CategoriesAndUnitsPage initialTab="units" />
          )}

          {currentMenu === 'users' && <UsersPage />}

          {currentMenu === 'settings-store' && (
            <SettingsPage
              store={store}
              defaultTab="store"
              onUpdateStore={(s) => setStore(s)}
            />
          )}

          {currentMenu === 'settings-receipt' && (
            <SettingsPage
              store={store}
              defaultTab="receipt"
              onUpdateStore={(s) => setStore(s)}
            />
          )}

          {currentMenu === 'settings-whatsapp' && (
            <SettingsPage
              store={store}
              defaultTab="whatsapp"
              onUpdateStore={(s) => setStore(s)}
            />
          )}

          {currentMenu === 'backup' && (
            <SettingsPage
              store={store}
              defaultTab="backup"
              onUpdateStore={(s) => setStore(s)}
            />
          )}

          {currentMenu === 'sync-status' && <SyncStatusPage />}
        </main>
      </div>

      {/* Conflict Reconciliation Modal Notice if any */}
      {activeConflicts.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-amber-500/40 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                <span>Pemberitahuan Rekonsiliasi Stok Offline</span>
              </div>
              <button
                onClick={() => setActiveConflicts([])}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-300">
              Beberapa transaksi offline yang baru saja dikirim ke server mengalami selisih stok terhadap inventaris pusat:
            </p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {activeConflicts.map((conf, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs"
                >
                  <div className="font-bold text-amber-300">
                    {conf.transaction_invoice} — {conf.product_name}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">{conf.message}</div>
                </div>
              ))}
            </div>
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setActiveConflicts([])}
                className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs hover:bg-amber-400 transition"
              >
                Tutup & Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Setup Wizard Modal */}
      <SetupWizardModal
        isOpen={showSetupModal}
        onClose={() => setShowSetupModal(false)}
        onSetupComplete={handleSetupComplete}
      />
    </div>
  );
}
