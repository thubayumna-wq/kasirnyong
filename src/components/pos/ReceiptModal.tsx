import React, { useState } from 'react';
import { Transaction, TransactionItem, StoreSettings } from '../../types/pos';
import {
  formatRupiah,
  formatDateTime,
  triggerReceiptPrint,
  downloadReceiptAsFile,
} from '../../lib/printerService';
import {
  generateWhatsAppReceiptText,
  openWhatsAppClickToChat,
} from '../../lib/whatsappService';
import {
  Printer,
  Download,
  Send,
  RotateCcw,
  CheckCircle2,
  Share2,
  FileText,
  X,
  Smartphone,
} from 'lucide-react';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction;
  items: TransactionItem[] | any[];
  store: StoreSettings;
  onNewTransaction: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  transaction,
  items,
  store,
  onNewTransaction,
}) => {
  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>(store.receipt_paper || '58mm');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [showWhatsAppForm, setShowWhatsAppForm] = useState<boolean>(false);
  const [waSentStatus, setWaSentStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const invoice = transaction.invoice_number || 'TRX-UNKNOWN';
  const is80 = paperWidth === '80mm';

  const handlePrint = () => {
    triggerReceiptPrint();
  };

  const handleDownload = () => {
    downloadReceiptAsFile(transaction, items, { ...store, receipt_paper: paperWidth });
  };

  const handleSendWhatsApp = () => {
    if (!customerPhone) {
      alert('Masukkan nomor WhatsApp pelanggan terlebih dahulu.');
      return;
    }
    const text = generateWhatsAppReceiptText(transaction, items, store);
    openWhatsAppClickToChat(customerPhone, text);
    setWaSentStatus('WhatsApp terbuka dengan pesan siap kirim!');
    setTimeout(() => setWaSentStatus(null), 4000);
  };

  return (
    <>
      {/* Hidden printable receipt for standard window.print() */}
      <div id="thermal-receipt-print" className="hidden">
        <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: is80 ? '14px' : '12px' }}>
          {store.name || 'HILALPOS Toko Berkah'}
        </div>
        <div style={{ textAlign: 'center', fontSize: '10px' }}>
          {store.tagline || 'SATU SISTEM, SEMUA USAHA'}
        </div>
        <div style={{ textAlign: 'center', fontSize: '9px' }}>{store.address || ''}</div>
        <div style={{ textAlign: 'center', fontSize: '9px' }}>Telp: {store.phone || '-'}</div>

        <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>No. Trx:</span>
          <strong>{invoice}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Waktu:</span>
          <span>{formatDateTime(transaction.created_at)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Kasir:</span>
          <span>{transaction.cashier_name}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Pelanggan:</span>
          <span>{transaction.customer_name || 'Umum'}</span>
        </div>

        {transaction.offline_created && (
          <div style={{ textAlign: 'center', fontSize: '9px', fontWeight: 'bold', marginTop: '2px' }}>
            [TRANSAKSI OFFLINE DISIMPAN LOKAL]
          </div>
        )}

        <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />

        {items.map((it, idx) => (
          <div key={idx} style={{ marginBottom: '3px' }}>
            <div style={{ fontWeight: 'bold' }}>{it.name_snapshot || it.name}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>
                {it.qty} {it.unit || 'pcs'} x {formatRupiah(it.sell_price_snapshot || it.unit_price || 0)}
              </span>
              <span>{formatRupiah(it.subtotal || 0)}</span>
            </div>
          </div>
        ))}

        <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Subtotal:</span>
          <span>{formatRupiah(transaction.subtotal)}</span>
        </div>
        {transaction.discount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Diskon:</span>
            <span>-{formatRupiah(transaction.discount)}</span>
          </div>
        )}
        {transaction.tax > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Pajak:</span>
            <span>{formatRupiah(transaction.tax)}</span>
          </div>
        )}

        <div style={{ borderTop: '1px dashed #000', margin: '4px 0' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: is80 ? '13px' : '11px' }}>
          <span>TOTAL:</span>
          <span>{formatRupiah(transaction.total)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Metode:</span>
          <span>{transaction.payment_method}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Bayar:</span>
          <span>{formatRupiah(transaction.total_paid)}</span>
        </div>
        {transaction.change_amount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Kembalian:</span>
            <span>{formatRupiah(transaction.change_amount)}</span>
          </div>
        )}
        {transaction.remaining_debt > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
            <span>Sisa Tempo:</span>
            <span>{formatRupiah(transaction.remaining_debt)}</span>
          </div>
        )}

        <div style={{ borderTop: '2px solid #000', margin: '6px 0' }} />

        <div style={{ textAlign: 'center', fontSize: '9px', whiteSpace: 'pre-line' }}>
          {store.receipt_footer || 'Terima kasih atas kunjungan Anda!\nBarang yang sudah dibeli tidak dapat ditukar.'}
        </div>
        <div style={{ textAlign: 'center', fontSize: '8px', marginTop: '6px', fontWeight: 'bold' }}>
          Powered by HILALPOS
        </div>
      </div>

      {/* Interactive Modal UI */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 no-print">
        <div className="w-full max-w-xl bg-slate-900 border border-amber-500/30 rounded-2xl overflow-hidden shadow-2xl flex flex-col text-slate-100 max-h-[92vh]">
          {/* Top Status Banner */}
          <div className="p-4 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border-b border-amber-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-100">Transaksi Berhasil Disimpan</h3>
                <span className="text-[11px] text-amber-300 font-mono font-semibold">{invoice}</span>
              </div>
            </div>
            {/* Paper selector toggle */}
            <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700">
              <button
                onClick={() => setPaperWidth('58mm')}
                className={`px-2 py-1 rounded text-[11px] font-bold transition ${
                  paperWidth === '58mm' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                58 mm
              </button>
              <button
                onClick={() => setPaperWidth('80mm')}
                className={`px-2 py-1 rounded text-[11px] font-bold transition ${
                  paperWidth === '80mm' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                80 mm
              </button>
            </div>
          </div>

          {/* Receipt Preview Canvas / Box */}
          <div className="p-4 flex-1 overflow-y-auto bg-slate-950 flex flex-col items-center">
            <div
              className={`bg-white text-slate-950 p-4 rounded shadow-xl font-mono transition-all text-xs border border-slate-300 ${
                is80 ? 'w-full max-w-[340px]' : 'w-full max-w-[270px]'
              }`}
            >
              {/* Header */}
              <div className="text-center font-bold text-sm leading-tight text-slate-950">
                {store.name || 'HILALPOS Toko Berkah'}
              </div>
              <div className="text-center text-[10px] text-slate-700 font-sans font-semibold mt-0.5">
                {store.tagline || 'SATU SISTEM, SEMUA USAHA'}
              </div>
              <div className="text-center text-[10px] text-slate-600 mt-1">{store.address || ''}</div>
              <div className="text-center text-[10px] text-slate-600">Telp: {store.phone || '-'}</div>

              <div className="border-t border-dashed border-slate-400 my-2" />

              {/* Meta */}
              <div className="space-y-0.5 text-[11px]">
                <div className="flex justify-between">
                  <span>No. Trx:</span>
                  <span className="font-bold">{invoice}</span>
                </div>
                <div className="flex justify-between">
                  <span>Waktu:</span>
                  <span>{formatDateTime(transaction.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kasir:</span>
                  <span>{transaction.cashier_name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pelanggan:</span>
                  <span>{transaction.customer_name || 'Umum'}</span>
                </div>
                {transaction.offline_created && (
                  <div className="text-center text-[10px] font-bold text-amber-800 bg-amber-100 py-0.5 rounded mt-1">
                    [OFFLINE TERSIMPAN DI PERANGKAT]
                  </div>
                )}
              </div>

              <div className="border-t border-dashed border-slate-400 my-2" />

              {/* Line items */}
              <div className="space-y-1.5">
                {items.map((it, idx) => (
                  <div key={idx}>
                    <div className="font-bold text-[11px] text-slate-900 leading-tight">
                      {it.name_snapshot || it.name}
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-700">
                      <span>
                        {it.qty} {it.unit || 'pcs'} x {formatRupiah(it.sell_price_snapshot || it.unit_price || 0)}
                      </span>
                      <span className="font-semibold text-slate-950">
                        {formatRupiah(it.subtotal || 0)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-slate-400 my-2" />

              {/* Totals */}
              <div className="space-y-0.5 text-[11px]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatRupiah(transaction.subtotal)}</span>
                </div>
                {transaction.discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Diskon:</span>
                    <span>-{formatRupiah(transaction.discount)}</span>
                  </div>
                )}
                {transaction.tax > 0 && (
                  <div className="flex justify-between">
                    <span>Pajak:</span>
                    <span>{formatRupiah(transaction.tax)}</span>
                  </div>
                )}
                <div className="border-t border-slate-400 my-1" />
                <div className="flex justify-between font-bold text-sm text-slate-950">
                  <span>TOTAL:</span>
                  <span>{formatRupiah(transaction.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Metode:</span>
                  <span>{transaction.payment_method}</span>
                </div>
                <div className="flex justify-between">
                  <span>Bayar:</span>
                  <span>{formatRupiah(transaction.total_paid)}</span>
                </div>
                {transaction.change_amount > 0 && (
                  <div className="flex justify-between font-bold text-emerald-800">
                    <span>Kembalian:</span>
                    <span>{formatRupiah(transaction.change_amount)}</span>
                  </div>
                )}
                {transaction.remaining_debt > 0 && (
                  <div className="flex justify-between font-bold text-rose-800">
                    <span>Sisa Tempo:</span>
                    <span>{formatRupiah(transaction.remaining_debt)}</span>
                  </div>
                )}
              </div>

              <div className="border-t-2 border-slate-950 my-2" />

              {/* Footer */}
              <div className="text-center text-[9px] text-slate-600 whitespace-pre-line">
                {store.receipt_footer || 'Terima kasih atas kunjungan Anda!'}
              </div>
              <div className="text-center text-[8px] text-slate-400 font-bold mt-2">
                HILALPOS - SATU SISTEM, SEMUA USAHA
              </div>
            </div>

            {/* WhatsApp receipt input form */}
            {showWhatsAppForm && (
              <div className="w-full max-w-md mt-4 p-3.5 bg-slate-900 border border-emerald-500/30 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                    <Smartphone className="w-4 h-4" />
                    <span>Kirim Struk ke WhatsApp Pelanggan</span>
                  </div>
                  <button
                    onClick={() => setShowWhatsAppForm(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                  <button
                    onClick={handleSendWhatsApp}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Buka WhatsApp</span>
                  </button>
                </div>
                {waSentStatus && (
                  <span className="text-[11px] text-emerald-400 font-semibold block">{waSentStatus}</span>
                )}
              </div>
            )}
          </div>

          {/* Action buttons footer (Section L: Cetak, Unduh PDF, Kirim Struk Digital, Kembali ke Kasir) */}
          <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handlePrint}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-amber-950/40 transition active:scale-95"
              >
                <Printer className="w-4 h-4 text-slate-950" />
                <span>Cetak Struk Thermal</span>
              </button>

              <button
                onClick={handleDownload}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition"
                title="Unduh file struk format HTML/PDF"
              >
                <Download className="w-4 h-4 text-amber-400" />
                <span>Unduh File Struk</span>
              </button>

              <button
                onClick={() => setShowWhatsAppForm(!showWhatsAppForm)}
                className="px-3 py-2 rounded-xl bg-emerald-950/80 border border-emerald-500/40 hover:bg-emerald-900 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition"
              >
                <Share2 className="w-4 h-4 text-emerald-400" />
                <span>Kirim WhatsApp</span>
              </button>
            </div>

            <button
              onClick={() => {
                onClose();
                onNewTransaction();
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-md shadow-emerald-950/50 transition active:scale-95 ml-auto"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Kembali ke Kasir Baru</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
