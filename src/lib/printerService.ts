import { Transaction, TransactionItem, StoreSettings } from '../types/pos';

export interface ReceiptOptions {
  paperWidth: '58mm' | '80mm';
  fontSize: 'sm' | 'base' | 'lg';
  showLogo?: boolean;
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateTime(isoString: string): string {
  if (!isoString) return '-';
  const d = new Date(isoString);
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Triggers standard browser print dialog targeting the thermal print DOM element
 */
export function triggerReceiptPrint(): void {
  window.print();
}

/**
 * Generates an offline-compatible printable HTML / SVG receipt converted to a downloadable PDF or printable Blob
 */
export function downloadReceiptAsFile(
  transaction: Transaction,
  items: TransactionItem[] | any[],
  store: StoreSettings
): void {
  const invoice = transaction.invoice_number || 'TRX-UNKNOWN';
  const widthMm = store.receipt_paper === '80mm' ? 80 : 58;
  const is80 = widthMm === 80;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Struk-${invoice}</title>
  <style>
    @page { margin: 0; size: ${widthMm}mm auto; }
    body {
      font-family: 'JetBrains Mono', 'Courier New', Courier, monospace;
      font-size: ${is80 ? '12px' : '10.5px'};
      line-height: 1.3;
      margin: 0;
      padding: 4mm;
      width: ${widthMm - 8}mm;
      color: #000;
      background: #fff;
    }
    .center { text-align: center; }
    .right { text-align: right; }
    .bold { font-weight: bold; }
    .divider { border-top: 1px dashed #000; margin: 6px 0; }
    .double-divider { border-top: 2px solid #000; margin: 6px 0; }
    .item-row { display: flex; justify-content: space-between; }
    .item-detail { font-size: 0.9em; color: #333; margin-left: 4px; }
  </style>
</head>
<body>
  <div class="center bold" style="font-size: 1.25em;">${store.name || 'HILALPOS'}</div>
  <div class="center" style="font-size: 0.85em;">${store.tagline || 'SATU SISTEM, SEMUA USAHA'}</div>
  <div class="center" style="font-size: 0.85em; margin-top: 2px;">${store.address || ''}</div>
  <div class="center" style="font-size: 0.85em;">Telp: ${store.phone || '-'}</div>

  <div class="divider"></div>

  <div class="item-row"><span>No. Trx:</span><span class="bold">${invoice}</span></div>
  <div class="item-row"><span>Waktu:</span><span>${formatDateTime(transaction.created_at)}</span></div>
  <div class="item-row"><span>Kasir:</span><span>${transaction.cashier_name || 'Kasir'}</span></div>
  <div class="item-row"><span>Pelanggan:</span><span>${transaction.customer_name || 'Umum'}</span></div>
  ${transaction.offline_created ? '<div class="center bold" style="font-size: 0.8em; margin-top:2px;">[TRANSAKSI OFFLINE DISIMPAN LOKAL]</div>' : ''}

  <div class="divider"></div>

  <!-- Items -->
  ${items
    .map(
      (item) => `
    <div>
      <div class="bold">${item.name_snapshot || item.name}</div>
      <div class="item-row">
        <span>${item.qty} ${item.unit || 'pcs'} x ${formatRupiah(item.sell_price_snapshot || item.unit_price || 0)}</span>
        <span class="bold">${formatRupiah(item.subtotal || 0)}</span>
      </div>
      ${item.discount > 0 ? `<div class="item-detail right">(Diskon: -${formatRupiah(item.discount)})</div>` : ''}
    </div>
  `
    )
    .join('')}

  <div class="divider"></div>

  <div class="item-row"><span>Subtotal:</span><span>${formatRupiah(transaction.subtotal)}</span></div>
  ${transaction.discount > 0 ? `<div class="item-row"><span>Diskon:</span><span>-${formatRupiah(transaction.discount)}</span></div>` : ''}
  ${transaction.tax > 0 ? `<div class="item-row"><span>Pajak:</span><span>${formatRupiah(transaction.tax)}</span></div>` : ''}

  <div class="divider"></div>

  <div class="item-row bold" style="font-size: 1.15em;">
    <span>TOTAL:</span>
    <span>${formatRupiah(transaction.total)}</span>
  </div>

  <div class="item-row"><span>Metode:</span><span>${transaction.payment_method}</span></div>
  <div class="item-row"><span>Bayar:</span><span>${formatRupiah(transaction.total_paid)}</span></div>

  ${
    transaction.change_amount > 0
      ? `<div class="item-row"><span>Kembalian:</span><span>${formatRupiah(transaction.change_amount)}</span></div>`
      : ''
  }

  ${
    transaction.remaining_debt > 0
      ? `<div class="item-row bold" style="color:#b91c1c;"><span>SISA TEMPO:</span><span>${formatRupiah(transaction.remaining_debt)}</span></div>`
      : ''
  }

  <div class="double-divider"></div>

  <div class="center" style="font-size: 0.85em; white-space: pre-line; margin-top: 6px;">
    ${store.receipt_footer || 'Terima kasih atas kunjungan Anda!\nBarang yang sudah dibeli tidak dapat ditukar.'}
  </div>

  <div class="center bold" style="font-size: 0.75em; margin-top: 8px;">
    Powered by HILALPOS
  </div>
</body>
</html>
`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Struk-${invoice}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
