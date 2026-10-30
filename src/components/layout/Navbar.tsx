import React from 'react';
import { BrandLogo } from '../common/BrandLogo';
import { ConnectionBadge } from '../common/ConnectionBadge';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { User, StoreSettings, SyncConflict } from '../../types/pos';
import { Menu, LogOut, Store, ShieldCheck, UserCheck } from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  store: StoreSettings | null;
  onLogout: () => void;
  onToggleSidebar: () => void;
  onShowConflicts?: (conflicts: SyncConflict[]) => void;
  onOpenStoreSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  store,
  onLogout,
  onToggleSidebar,
  onShowConflicts,
  onOpenStoreSettings,
}) => {
  const roleBadge = (role: string) => {
    switch (role) {
      case 'superadmin':
        return <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded text-[10px] font-bold">Super Admin</span>;
      case 'admin':
        return <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.5 rounded text-[10px] font-bold">Admin Toko</span>;
      case 'supervisor':
        return <span className="bg-purple-500/20 text-purple-300 border border-purple-500/40 px-1.5 py-0.5 rounded text-[10px] font-bold">Supervisor</span>;
      default:
        return <span className="bg-sky-500/20 text-sky-300 border border-sky-500/40 px-1.5 py-0.5 rounded text-[10px] font-bold">Kasir</span>;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950/90 border-b border-amber-500/20 backdrop-blur-md px-3 sm:px-6 py-2.5 flex items-center justify-between shadow-xl">
      {/* Left: Mobile hamburger & Logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-amber-400 hover:border-amber-500/40 transition lg:hidden"
          title="Buka Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <BrandLogo size="sm" showTagline={false} />
      </div>

      {/* Center: Store name pill */}
      <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/40 border border-emerald-500/30 text-emerald-200 text-xs">
        <Store className="w-3.5 h-3.5 text-amber-400" />
        <span className="font-semibold text-slate-200">{store?.name || 'HILALPOS Toko Berkah'}</span>
        <button
          onClick={onOpenStoreSettings}
          className="text-amber-400 hover:underline text-[11px] ml-1 font-medium"
        >
          Ubah
        </button>
      </div>

      {/* Right: Sync Status, PWA Install, Profile, Logout */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Connection & Offline Sync Status Indicator */}
        <ConnectionBadge onShowConflicts={onShowConflicts} />

        {/* PWA Install Button */}
        <PWAInstallButton />

        {/* User Profile Info */}
        {currentUser && (
          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-700/60">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-slate-950 font-black text-xs shadow-md">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-slate-200 leading-tight truncate max-w-[120px]">
                {currentUser.name}
              </span>
              <div className="flex items-center gap-1 mt-0.5">
                {roleBadge(currentUser.role)}
              </div>
            </div>
          </div>
        )}

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="p-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-400 hover:text-rose-400 hover:border-rose-500/40 transition"
          title="Keluar Akun"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
