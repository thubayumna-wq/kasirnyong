import { Transaction, TransactionItem, StoreSettings } from '../types/pos';
import { formatRupiah, formatDateTime } from './printerService';

export function normalizeWhatsAppNumber(phone: string): string {
  if (!phone) return '';
  let clean = phone.replace(/[^0-9]/g, '');
  if (clean.startsWith('0')) {
    clean = '62' + clean.slice(1);
  } else if (!clean.startsWith('62')) {
    clean = '62' + clean;
  }
  return clean;
}

export function generateWhatsAppReceiptText(
  transaction: Transaction,
  items: TransactionItem[] | any[],
  store: StoreSettings
): string {
  const storeName = store.name || 'HILALPOS Toko Berkah';
  const invoice = transaction.invoice_number || 'TRX-UNKNOWN';
  const dateFormatted = formatDateTime(transaction.created_at);

  let itemList = '';
  items.forEach((item, idx) => {
    const itemName = item.name_snapshot || item.name;
    const unitPrice = formatRupiah(item.sell_price_snapshot || item.unit_price || 0);
    const subtotal = formatRupiah(item.subtotal || 0);
    itemList += `${idx + 1}. *${itemName}*\n   ${item.qty} ${item.unit || 'pcs'} x ${unitPrice} = ${subtotal}\n`;
  });

  return (
    `🧾 *STRUK PEMBELIAN RESMI*\n` +
    `🏪 *${storeName.toUpperCase()}*\n` +
    `📍 ${store.address || 'Pusat Usaha'}\n` +
    `📞 ${store.phone || '-'}\n` +
    `------------------------------------------\n` +
    `No. Transaksi : \`${invoice}\`\n` +
    `Waktu         : ${dateFormatted}\n` +
    `Kasir         : ${transaction.cashier_name || 'Kasir'}\n` +
    `Pelanggan     : ${transaction.customer_name || 'Umum'}\n` +
    `------------------------------------------\n` +
    `*RINCIAN BELANJA:*\n` +
    itemList +
    `------------------------------------------\n` +
    `Subtotal   : ${formatRupiah(transaction.subtotal)}\n` +
    (transaction.discount > 0 ? `Diskon     : -${formatRupiah(transaction.discount)}\n` : '') +
    (transaction.tax > 0 ? `Pajak      : ${formatRupiah(transaction.tax)}\n` : '') +
    `*TOTAL AKHIR : ${formatRupiah(transaction.total)}*\n` +
    `Metode     : ${transaction.payment_method}\n` +
    `Dibayar    : ${formatRupiah(transaction.total_paid)}\n` +
    (transaction.change_amount > 0 ? `Kembalian  : ${formatRupiah(transaction.change_amount)}\n` : '') +
    (transaction.remaining_debt > 0 ? `*Sisa Tempo : ${formatRupiah(transaction.remaining_debt)}*\n` : '') +
    `------------------------------------------\n` +
    `${store.receipt_footer || 'Terima kasih telah berbelanja! Semoga berkah melimpah.'}\n\n` +
    `_HILALPOS - Satu Sistem, Semua Usaha_`
  );
}

export function openWhatsAppClickToChat(phone: string, text: string): void {
  const cleanPhone = normalizeWhatsAppNumber(phone);
  const encoded = encodeURIComponent(text);
  const url = `https://wa.me/${cleanPhone}?text=${encoded}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}
