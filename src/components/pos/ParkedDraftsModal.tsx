import React from 'react';
import { ParkedDraft } from '../../types/pos';
import { formatRupiah } from '../../lib/printerService';
import { Clock, Play, Trash2, X } from 'lucide-react';

interface ParkedDraftsModalProps {
  isOpen: boolean;
  onClose: () => void;
  drafts: ParkedDraft[];
  onResumeDraft: (draft: ParkedDraft) => void;
  onDeleteDraft: (id: string) => void;
}

export const ParkedDraftsModal: React.FC<ParkedDraftsModalProps> = ({
  isOpen,
  onClose,
  drafts,
  onResumeDraft,
  onDeleteDraft,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-amber-500/30 rounded-2xl overflow-hidden shadow-2xl flex flex-col text-slate-100 max-h-[85vh]">
        {/* Header */}
        <div className="p-4 bg-emerald-950/80 border-b border-amber-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm text-slate-100">Daftar Transaksi Diparkir / Tertunda</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex-1 overflow-y-auto space-y-3">
          {drafts.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Tidak ada transaksi yang sedang diparkir saat ini.
            </div>
          ) : (
            drafts.map((d) => {
              const totalItems = d.items.reduce((acc, it) => acc + it.qty, 0);
              const totalAmount = d.items.reduce((acc, it) => acc + it.subtotal, 0);

              return (
                <div
                  key={d.id}
                  className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-amber-500/40 transition flex items-center justify-between gap-3"
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-amber-300">
                        {d.customer_name || 'Pelanggan Walk-In'}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                        {new Date(d.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-300 mt-1">
                      {totalItems} item barang — <span className="font-semibold text-emerald-400">{formatRupiah(totalAmount)}</span>
                    </div>
                    {d.notes && (
                      <div className="text-[10px] text-slate-500 italic mt-0.5">Catatan: {d.notes}</div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onResumeDraft(d)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition active:scale-95 shadow-sm"
                      title="Lanjutkan transaksi ini di kasir"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Lanjutkan</span>
                    </button>
                    <button
                      onClick={() => onDeleteDraft(d.id)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 transition"
                      title="Hapus draft parkir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
