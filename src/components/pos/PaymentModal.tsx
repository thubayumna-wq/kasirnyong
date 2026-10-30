import React, { useState, useEffect } from 'react';
import { formatRupiah } from '../../lib/printerService';
import { Customer } from '../../types/pos';
import {
  Banknote,
  CreditCard,
  QrCode,
  ArrowRightLeft,
  Calendar,
  CheckCircle2,
  X,
  Coins,
  AlertCircle,
} from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  totalItems: number;
  customers: Customer[];
  selectedCustomerId?: string | null;
  onConfirmPayment: (paymentDetails: {
    payment_method: 'Tunai' | 'Debit' | 'Kredit' | 'Transfer' | 'QRIS' | 'Tempo';
    total_paid: number;
    change_amount: number;
    remaining_debt: number;
    due_date?: string | null;
    notes?: string;
  }) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  subtotal,
  discount,
  tax,
  total,
  totalItems,
  customers,
  selectedCustomerId,
  onConfirmPayment,
}) => {
  const [method, setMethod] = useState<'Tunai' | 'Debit' | 'Kredit' | 'Transfer' | 'QRIS' | 'Tempo'>('Tunai');
  const [cashGiven, setCashGiven] = useState<number>(total);
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14); // default 14 days for tempo
    return d.toISOString().substring(0, 10);
  });
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setCashGiven(total);
      setMethod('Tunai');
      setIsSubmitting(false);
    }
  }, [isOpen, total]);

  // Keyboard shortcut listener for ENTER and ESC inside modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Enter' && !e.shiftKey) {
        // Prevent default form submit and trigger pay if valid
        const target = e.target as HTMLElement;
        if (target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          handleSubmit();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, method, cashGiven, total, dueDate, notes]);

  if (!isOpen) return null;

  const currentCustomer = customers.find((c) => c.id === selectedCustomerId);

  // Quick cash preset amounts
  const quickCashPresets = [
    { label: 'Uang Pas', amount: total },
    { label: '10.000', amount: 10000 },
    { label: '20.000', amount: 20000 },
    { label: '50.000', amount: 50000 },
    { label: '100.000', amount: 100000 },
    { label: '200.000', amount: 200000 },
    { label: '500.000', amount: 500000 },
  ];

  // Calculation
  let actualPaid = cashGiven;
  let change = 0;
  let remainingDebt = 0;

  if (method === 'Tunai') {
    actualPaid = Number(cashGiven) || 0;
    change = Math.max(0, actualPaid - total);
    remainingDebt = Math.max(0, total - actualPaid);
  } else if (method === 'Tempo') {
    // If tempo, cashGiven can be down payment (DP)
    actualPaid = Number(cashGiven) || 0;
    change = 0;
    remainingDebt = Math.max(0, total - actualPaid);
  } else {
    // Non-cash electronic payments default to exact total paid
    actualPaid = total;
    change = 0;
    remainingDebt = 0;
  }

  const handleSubmit = () => {
    if (method === 'Tunai' && actualPaid < total) {
      if (!confirm(`Nominal bayar (Rp${actualPaid.toLocaleString('id-ID')}) kurang dari total belanja (Rp${total.toLocaleString('id-ID')}). Simpan sisa sebagai piutang tempo?`)) {
        return;
      }
    }

    if (method === 'Tempo' && !selectedCustomerId) {
      alert('Untuk pembayaran Tempo / Kredit, silakan pilih data Pelanggan terlebih dahulu agar tercatat di buku piutang.');
      return;
    }

    setIsSubmitting(true);
    onConfirmPayment({
      payment_method: method,
      total_paid: actualPaid,
      change_amount: change,
      remaining_debt: remainingDebt,
      due_date: remainingDebt > 0 || method === 'Tempo' ? dueDate : null,
      notes: notes.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-amber-500/30 rounded-2xl overflow-hidden shadow-2xl flex flex-col text-slate-100 max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border-b border-amber-500/20 flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-amber-300">Pembayaran Transaksi</h2>
            <p className="text-xs text-slate-400">Total {totalItems} item barang</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-5">
          {/* Summary Box */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-950/80 to-slate-950 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs uppercase font-bold text-amber-400 tracking-wider">Total Tagihan</span>
              <div className="text-3xl font-black text-amber-300 font-mono mt-1">
                {formatRupiah(total)}
              </div>
            </div>
            <div className="text-xs text-slate-300 space-y-0.5 border-t sm:border-t-0 sm:border-l border-slate-700 sm:pl-4 pt-2 sm:pt-0">
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Subtotal:</span>
                <span className="font-semibold">{formatRupiah(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between gap-4 text-emerald-400">
                  <span>Diskon:</span>
                  <span>-{formatRupiah(discount)}</span>
                </div>
              )}
              {tax > 0 && (
                <div className="flex justify-between gap-4">
                  <span className="text-slate-400">Pajak:</span>
                  <span>{formatRupiah(tax)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Pilih Metode Pembayaran
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[
                { id: 'Tunai', label: 'Tunai', icon: Banknote },
                { id: 'QRIS', label: 'QRIS', icon: QrCode },
                { id: 'Transfer', label: 'Transfer', icon: ArrowRightLeft },
                { id: 'Debit', label: 'Debit', icon: CreditCard },
                { id: 'Kredit', label: 'Kredit', icon: CreditCard },
                { id: 'Tempo', label: 'Tempo', icon: Calendar },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = method === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setMethod(m.id as any);
                      if (m.id !== 'Tunai' && m.id !== 'Tempo') {
                        setCashGiven(total);
                      }
                    }}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition active:scale-95 ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md shadow-amber-950/40 ring-1 ring-amber-400'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:border-slate-600 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5 mb-1.5" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cash Input & Quick Presets (For Tunai & Tempo) */}
          {(method === 'Tunai' || method === 'Tempo') && (
            <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-300">
                  {method === 'Tempo' ? 'Uang Muka / DP Diterima (Rp)' : 'Nominal Uang Diterima (Rp)'}
                </label>
                <span className="text-[11px] text-amber-400 font-mono">
                  {formatRupiah(cashGiven || 0)}
                </span>
              </div>

              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">
                  Rp
                </span>
                <input
                  type="number"
                  autoFocus
                  value={cashGiven || ''}
                  onChange={(e) => setCashGiven(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-lg font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                />
              </div>

              {/* Quick Cash Buttons */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {quickCashPresets.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCashGiven(p.amount)}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-semibold text-slate-200 transition active:scale-95"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tempo Details (if Tempo or remaining debt) */}
          {(method === 'Tempo' || remainingDebt > 0) && (
            <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/40 space-y-2">
              <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span>Transaksi Tempo / Piutang</span>
              </div>
              <div className="text-xs text-slate-300">
                Pelanggan: <strong className="text-white">{currentCustomer ? currentCustomer.name : 'Belum dipilih (Pilih pelanggan di kasir)'}</strong>
              </div>
              <div className="flex items-center gap-3 pt-1">
                <label className="text-xs text-slate-400">Jatuh Tempo:</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          )}

          {/* Change or Remaining Debt Indicator */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-0.5">Kembalian</span>
              <span className={`text-xl font-bold font-mono ${change > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                {formatRupiah(change)}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-0.5">Sisa Tagihan / Tempo</span>
              <span className={`text-xl font-bold font-mono ${remainingDebt > 0 ? 'text-rose-400' : 'text-slate-500'}`}>
                {formatRupiah(remainingDebt)}
              </span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">
              Catatan Transaksi (Opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Titip di pos satpam, meja 4, pesanan khusus..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400 hidden sm:block">
            Tekan <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-amber-300 font-mono">ENTER</kbd> untuk konfirmasi, <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-300 font-mono">ESC</kbd> batal
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-extrabold shadow-lg shadow-amber-950/50 flex items-center justify-center gap-2 transition active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4 text-slate-950" />
              <span>{isSubmitting ? 'Memproses...' : 'Selesaikan Pembayaran (ENTER)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
