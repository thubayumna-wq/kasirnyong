import React from 'react';
import { User } from '../../types/pos';
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Package,
  PackagePlus,
  Tags,
  Scale,
  Layers,
  Truck,
  Users,
  RotateCcw,
  BarChart3,
  Boxes,
  CreditCard,
  Clock,
  UserCheck,
  Settings,
  Printer,
  MessageSquare,
  RefreshCw,
  Database,
  X,
} from 'lucide-react';

export type NavMenuKey =
  | 'dashboard'
  | 'pos'
  | 'transactions'
  | 'products'
  | 'add-product'
  | 'categories'
  | 'units'
  | 'stock'
  | 'stock-in'
  | 'suppliers'
  | 'customers'
  | 'returns'
  | 'report-sales'
  | 'report-stock'
  | 'report-payments'
  | 'debt'
  | 'users'
  | 'settings-store'
  | 'settings-receipt'
  | 'settings-whatsapp'
  | 'sync-status'
  | 'backup';

interface SidebarProps {
  currentMenu: NavMenuKey;
  onSelectMenu: (menu: NavMenuKey) => void;
  currentUser: User | null;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  pendingSyncCount: number;
}

interface MenuItemConfig {
  key: NavMenuKey;
  label: string;
  icon: React.ElementType;
  badge?: string | number;
  allowedRoles?: string[]; // undefined means all roles
}

interface MenuSection {
  title: string;
  items: MenuItemConfig[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentMenu,
  onSelectMenu,
  currentUser,
  isOpenMobile,
  onCloseMobile,
  pendingSyncCount,
}) => {
  const userRole = currentUser?.role || 'kasir';

  const menuSections: MenuSection[] = [
    {
      title: 'Penjualan & Kasir',
      items: [
        { key: 'dashboard', label: '1. Dashboard', icon: LayoutDashboard },
        { key: 'pos', label: '2. Kasir / POS', icon: ShoppingCart },
        { key: 'transactions', label: '3. Riwayat Transaksi', icon: Receipt },
        { key: 'returns', label: '4. Retur & Pembatalan', icon: RotateCcw, allowedRoles: ['superadmin', 'admin', 'supervisor'] },
      ],
    },
    {
      title: 'Master Barang & Stok',
      items: [
        { key: 'products', label: '5. Data Barang', icon: Package },
        { key: 'add-product', label: '6. Tambah Barang', icon: PackagePlus, allowedRoles: ['superadmin', 'admin', 'supervisor'] },
        { key: 'categories', label: '7. Kategori Barang', icon: Tags, allowedRoles: ['superadmin', 'admin', 'supervisor'] },
        { key: 'units', label: '8. Satuan & Konversi', icon: Scale, allowedRoles: ['superadmin', 'admin', 'supervisor'] },
        { key: 'stock', label: '9. Stok Barang', icon: Layers },
        { key: 'stock-in', label: '10. Barang Masuk', icon: Boxes, allowedRoles: ['superadmin', 'admin', 'supervisor'] },
        { key: 'suppliers', label: '11. Pembelian & Pemasok', icon: Truck, allowedRoles: ['superadmin', 'admin', 'supervisor'] },
      ],
    },
    {
      title: 'Pelanggan & Piutang',
      items: [
        { key: 'customers', label: '12. Pelanggan', icon: Users },
        { key: 'debt', label: '13. Piutang & Pembayaran Tempo', icon: Clock },
      ],
    },
    {
      title: 'Laporan & Keuangan',
      items: [
        { key: 'report-sales', label: '14. Laporan Penjualan', icon: BarChart3, allowedRoles: ['superadmin', 'admin', 'supervisor'] },
        { key: 'report-stock', label: '15. Laporan Stok', icon: Layers, allowedRoles: ['superadmin', 'admin', 'supervisor'] },
        { key: 'report-payments', label: '16. Laporan Pembayaran', icon: CreditCard, allowedRoles: ['superadmin', 'admin', 'supervisor'] },
      ],
    },
    {
      title: 'Pengaturan & Sistem',
      items: [
        { key: 'users', label: '17. Pengguna & Hak Akses', icon: UserCheck, allowedRoles: ['superadmin'] },
        { key: 'settings-store', label: '18. Pengaturan Toko', icon: Settings, allowedRoles: ['superadmin', 'admin'] },
        { key: 'settings-receipt', label: '19. Pengaturan Struk', icon: Printer, allowedRoles: ['superadmin', 'admin'] },
        { key: 'settings-whatsapp', label: '20. Integrasi WhatsApp', icon: MessageSquare, allowedRoles: ['superadmin', 'admin'] },
        {
          key: 'sync-status',
          label: '21. Status Sinkronisasi',
          icon: RefreshCw,
          badge: pendingSyncCount > 0 ? pendingSyncCount : undefined,
        },
        { key: 'backup', label: '22. Backup & Pemulihan Data', icon: Database, allowedRoles: ['superadmin', 'admin'] },
      ],
    },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar aside */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-gradient-to-b from-slate-950 via-emerald-950/70 to-slate-950 border-r border-amber-500/20 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header */}
        <div className="p-4 border-b border-amber-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-900/80 border border-amber-500/40 p-1 flex items-center justify-center">
              <img src="/logo.svg" alt="HILALPOS" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-extrabold text-amber-300 font-serif tracking-wider">
                HILALPOS
              </span>
              <span className="text-[9px] text-emerald-400/80 uppercase font-semibold">
                Satu Sistem, Semua Usaha
              </span>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1 rounded-lg text-slate-400 hover:text-white lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
          {menuSections.map((section, idx) => {
            // Filter items permitted for user's role
            const permittedItems = section.items.filter(
              (item) => !item.allowedRoles || item.allowedRoles.includes(userRole)
            );

            if (permittedItems.length === 0) return null;

            return (
              <div key={idx} className="space-y-1">
                <div className="px-3 text-[10px] uppercase font-bold tracking-wider text-amber-500/70">
                  {section.title}
                </div>
                {permittedItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentMenu === item.key;

                  return (
                    <button
                      key={item.key}
                      onClick={() => {
                        onSelectMenu(item.key);
                        onCloseMobile();
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group ${
                        isActive
                          ? 'bg-gradient-to-r from-emerald-800/90 to-amber-600/80 text-white shadow-md shadow-emerald-950/50 border border-amber-400/30'
                          : 'text-slate-300 hover:bg-emerald-900/40 hover:text-amber-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon
                          className={`w-4 h-4 flex-shrink-0 transition-transform ${
                            isActive ? 'text-amber-300 scale-110' : 'text-slate-400 group-hover:text-amber-300'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge !== undefined && (
                        <span className="ml-2 px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-amber-500/20 bg-slate-950/80 text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 font-medium">Versi 1.0 PWA</span>
            <span className="text-emerald-400 font-semibold">Online & Offline Sync</span>
          </div>
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      </aside>
    </>
  );
};
