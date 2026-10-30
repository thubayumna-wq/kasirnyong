import React, { useState, useEffect, useRef } from 'react';
import {
  Product,
  CartItem,
  Customer,
  StoreSettings,
  User,
  Transaction,
  ParkedDraft,
} from '../../types/pos';
import { formatRupiah } from '../../lib/printerService';
import {
  getLocalProducts,
  updateLocalProductStock,
  addPendingOfflineTransaction,
  saveParkedDraft,
  getParkedDrafts,
  deleteParkedDraft,
} from '../../lib/indexedDb';
import { syncService } from '../../lib/syncService';
import { PaymentModal } from './PaymentModal';
import { ReceiptModal } from './ReceiptModal';
import { ParkedDraftsModal } from './ParkedDraftsModal';
import { CameraScannerModal } from './CameraScannerModal';
import {
  Search,
  Barcode,
  Camera,
  Plus,
  Minus,
  Trash2,
  PauseCircle,
  Play,
  CreditCard,
  UserCheck,
  AlertCircle,
  Sparkles,
  ShoppingBag,
  Layers,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';

interface PosPageProps {
  currentUser: User | null;
  store: StoreSettings;
  onRefreshHistory?: () => void;
}

export const PosPage: React.FC<PosPageProps> = ({
  currentUser,
  store,
  onRefreshHistory,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [orderDiscount, setOrderDiscount] = useState<number>(0);
  const [orderNotes, setOrderNotes] = useState<string>('');

  // Modals
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);
  const [showParkedModal, setShowParkedModal] = useState<boolean>(false);
  const [showCameraModal, setShowCameraModal] = useState<boolean>(false);
  const [parkedDrafts, setParkedDrafts] = useState<ParkedDraft[]>([]);
  const [lastCompletedTrx, setLastCompletedTrx] = useState<Transaction | null>(null);
  const [lastCompletedItems, setLastCompletedItems] = useState<any[]>([]);

  // Feedback notifications
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'warn' | 'error' } | null>(null);

  const barcodeInputRef = useRef<HTMLInputElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Load products & categories from server or local IndexedDB
  const loadCatalog = async () => {
    try {
      if (syncService.getState() === 'online') {
        const [prodRes, custRes, catRes] = await Promise.all([
          fetch('/api/products?activeOnly=true'),
          fetch('/api/customers'),
          fetch('/api/categories'),
        ]);
        if (prodRes.ok && custRes.ok) {
          const prods = await prodRes.json();
          const custs = await custRes.json();
          const cats = catRes.ok ? await catRes.json() : [];
          setProducts(prods);
          setCustomers(custs);
          setCategories(cats);
          return;
        }
      }
    } catch {
      // Offline fallback
    }

    const localProds = await getLocalProducts();
    setProducts(localProds);
  };

  const loadDrafts = async () => {
    const drafts = await getParkedDrafts();
    setParkedDrafts(drafts);
  };

  useEffect(() => {
    loadCatalog();
    loadDrafts();
  }, []);

  const showToast = (text: string, type: 'success' | 'warn' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Focus barcode input on mount and on F2
  useEffect(() => {
    barcodeInputRef.current?.focus();

    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      // F2 -> Focus Barcode / Search
      if (e.key === 'F2') {
        e.preventDefault();
        barcodeInputRef.current?.focus();
        barcodeInputRef.current?.select();
      }
      // F4 or END -> Open Payment if cart has items
      else if ((e.key === 'F4' || e.key === 'End') && !showPaymentModal && !showReceiptModal) {
        e.preventDefault();
        if (cart.length > 0) {
          setShowPaymentModal(true);
        } else {
          showToast('Keranjang masih kosong', 'warn');
        }
      }
      // ESC -> Close open modals
      else if (e.key === 'Escape') {
        if (showCameraModal) setShowCameraModal(false);
        if (showParkedModal) setShowParkedModal(false);
      }
    };

    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, [cart.length, showPaymentModal, showReceiptModal, showCameraModal, showParkedModal]);

  // Handle barcode scanned / entered
  const handleBarcodeSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = barcodeInput.trim();
    if (!code) return;

    processBarcodeScan(code);
    setBarcodeInput('');
    barcodeInputRef.current?.focus();
  };

  const processBarcodeScan = (barcode: string) => {
    const clean = barcode.trim().toLowerCase();
    const product = products.find(
      (p) =>
        (p.barcode && p.barcode.toLowerCase() === clean) ||
        p.sku.toLowerCase() === clean
    );

    if (product) {
      addProductToCart(product);
      showToast(`+1 ${product.name}`, 'success');
    } else {
      showToast(`Barcode "${barcode}" tidak ditemukan di database`, 'error');
    }
  };

  // Add product to cart with default base unit
  const addProductToCart = (product: Product, conversionUnit?: string) => {
    setCart((prev) => {
      // Determine unit and factor
      let unit = product.base_unit || 'pcs';
      let factor = 1;
      let unitPrice = product.sell_price;

      if (conversionUnit && product.unit_conversions) {
        const conv = product.unit_conversions.find((c) => c.unit === conversionUnit);
        if (conv) {
          unit = conv.unit;
          factor = conv.factor;
          unitPrice = conv.price;
        }
      }

      const existingIndex = prev.findIndex(
        (item) => item.product_id === product.id && item.unit === unit
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        const currentItem = updated[existingIndex];
        const newQty = currentItem.qty + 1;
        updated[existingIndex] = {
          ...currentItem,
          qty: newQty,
          subtotal: currentItem.unit_price * newQty - currentItem.discount,
        };
        return updated;
      } else {
        const newItem: CartItem = {
          id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          product_id: product.id,
          sku: product.sku,
          barcode: product.barcode,
          name: product.name,
          unit,
          factor,
          unit_price: unitPrice,
          cost_price: product.cost_price * factor,
          qty: 1,
          discount: 0,
          subtotal: unitPrice,
          available_stock: product.current_stock,
        };
        return [...prev, newItem];
      }
    });
  };

  // Update item unit (e.g. switch from pcs to renteng or karton)
  const handleChangeUnit = (cartItemId: string, newUnit: string) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id !== cartItemId) return item;

        const product = products.find((p) => p.id === item.product_id);
        if (!product) return item;

        if (newUnit === product.base_unit) {
          return {
            ...item,
            unit: newUnit,
            factor: 1,
            unit_price: product.sell_price,
            cost_price: product.cost_price,
            subtotal: product.sell_price * item.qty - item.discount,
          };
        }

        const conv = product.unit_conversions?.find((c) => c.unit === newUnit);
        if (conv) {
          return {
            ...item,
            unit: conv.unit,
            factor: conv.factor,
            unit_price: conv.price,
            cost_price: product.cost_price * conv.factor,
            subtotal: conv.price * item.qty - item.discount,
          };
        }

        return item;
      })
    );
  };

  const handleUpdateQty = (cartItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id !== cartItemId) return item;
          const newQty = Math.max(1, item.qty + delta);
          return {
            ...item,
            qty: newQty,
            subtotal: item.unit_price * newQty - item.discount,
          };
        })
        .filter((item) => item.qty > 0)
    );
  };

  const handleSetCustomQty = (cartItemId: string, val: number) => {
    const qty = Math.max(1, Number(val) || 1);
    setCart((prev) =>
      prev.map((item) => {
        if (item.id !== cartItemId) return item;
        return {
          ...item,
          qty,
          subtotal: item.unit_price * qty - item.discount,
        };
      })
    );
  };

  const handleUpdateDiscount = (cartItemId: string, disc: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id !== cartItemId) return item;
        const discountVal = Math.max(0, disc);
        return {
          ...item,
          discount: discountVal,
          subtotal: Math.max(0, item.unit_price * item.qty - discountVal),
        };
      })
    );
  };

  const handleRemoveItem = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== cartItemId));
  };

  const handleClearCart = () => {
    if (cart.length === 0) return;
    if (confirm('Kosongkan semua barang di keranjang?')) {
      setCart([]);
      setOrderDiscount(0);
      setOrderNotes('');
      barcodeInputRef.current?.focus();
    }
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.unit_price * item.qty, 0);
  const itemsDiscount = cart.reduce((sum, item) => sum + item.discount, 0);
  const totalDiscount = itemsDiscount + orderDiscount;
  const taxRate = store.tax_rate || 0;
  const taxableAmount = Math.max(0, subtotal - totalDiscount);
  const tax = taxRate > 0 ? Math.round((taxableAmount * taxRate) / 100) : 0;
  const total = taxableAmount + tax;
  const totalItemsCount = cart.reduce((sum, item) => sum + item.qty, 0);

  // Park Current Cart Draft
  const handleParkCart = async () => {
    if (cart.length === 0) {
      showToast('Keranjang belanja kosong', 'warn');
      return;
    }

    const currentCustomer = customers.find((c) => c.id === selectedCustomerId);
    const draft: ParkedDraft = {
      id: `draft-${Date.now()}`,
      created_at: new Date().toISOString(),
      customer_name: currentCustomer ? currentCustomer.name : 'Pelanggan Parkir',
      items: cart,
      notes: orderNotes,
    };

    await saveParkedDraft(draft);
    await loadDrafts();
    setCart([]);
    setOrderDiscount(0);
    setOrderNotes('');
    showToast('Transaksi berhasil diparkir / disimpan sementara', 'success');
  };

  const handleResumeDraft = async (draft: ParkedDraft) => {
    if (cart.length > 0) {
      if (!confirm('Keranjang saat ini akan digantikan oleh transaksi parkir. Lanjutkan?')) {
        return;
      }
    }

    setCart(draft.items);
    if (draft.notes) setOrderNotes(draft.notes);
    await deleteParkedDraft(draft.id);
    await loadDrafts();
    setShowParkedModal(false);
    showToast('Transaksi parkir dibuka kembali', 'success');
  };

  const handleDeleteDraft = async (id: string) => {
    await deleteParkedDraft(id);
    await loadDrafts();
    showToast('Draft parkir dihapus', 'warn');
  };

  // Final Checkout execution (supports online direct + offline local IndexedDB queue!)
  const handleConfirmPayment = async (paymentDetails: {
    payment_method: 'Tunai' | 'Debit' | 'Kredit' | 'Transfer' | 'QRIS' | 'Tempo';
    total_paid: number;
    change_amount: number;
    remaining_debt: number;
    due_date?: string | null;
    notes?: string;
  }) => {
    const currentCustomer = customers.find((c) => c.id === selectedCustomerId);
    const idempotencyKey = `idem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const dateStr = `${now.substring(0, 4)}${now.substring(5, 7)}${now.substring(8, 10)}`;
    const invoiceNumber = `TRX-${dateStr}-${Math.floor(100 + Math.random() * 900)}`;

    const transactionData = {
      id: `trx-${Date.now()}`,
      store_id: store.id,
      invoice_number: invoiceNumber,
      cashier_id: currentUser?.id || 'usr-kasir-01',
      cashier_name: currentUser?.name || 'Kasir Berkah',
      customer_id: selectedCustomerId || null,
      customer_name: currentCustomer ? currentCustomer.name : 'Umum (Pelanggan Walk-In)',
      subtotal,
      discount: totalDiscount,
      tax,
      total,
      payment_method: paymentDetails.payment_method,
      total_paid: paymentDetails.total_paid,
      change_amount: paymentDetails.change_amount,
      remaining_debt: paymentDetails.remaining_debt,
      due_date: paymentDetails.due_date,
      notes: paymentDetails.notes || orderNotes,
      offline_created: syncService.getState() === 'offline',
      idempotency_key: idempotencyKey,
      client_created_at: now,
      items: cart.map((it) => ({
        product_id: it.product_id,
        sku_snapshot: it.sku,
        name_snapshot: it.name,
        unit: it.unit,
        factor: it.factor,
        qty: it.qty,
        base_qty: it.qty * it.factor,
        cost_price_snapshot: it.cost_price,
        sell_price_snapshot: it.unit_price,
        discount: it.discount,
        subtotal: it.subtotal,
      })),
    };

    let savedTransaction: Transaction = transactionData as any;
    let savedItems: any[] = transactionData.items;

    // Check if online
    if (syncService.getState() === 'online') {
      try {
        const res = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transactionData),
          signal: AbortSignal.timeout(7000),
        });

        if (res.ok) {
          const data = await res.json();
          savedTransaction = data.transaction;
          savedItems = data.items;
          showToast(`Transaksi ${savedTransaction.invoice_number} berhasil disimpan`, 'success');
        } else {
          throw new Error('Server offline or busy');
        }
      } catch {
        // Fallback to offline queue
        await saveOfflineTransaction(transactionData);
      }
    } else {
      // Offline mode
      await saveOfflineTransaction(transactionData);
    }

    // Set state for receipt modal
    setLastCompletedTrx(savedTransaction);
    setLastCompletedItems(savedItems);
    setShowPaymentModal(false);
    setShowReceiptModal(true);

    // Refresh products catalog & stock
    await loadCatalog();
    if (onRefreshHistory) onRefreshHistory();
  };

  const saveOfflineTransaction = async (trxData: any) => {
    // 1. Add to IndexedDB pending queue
    await addPendingOfflineTransaction(trxData);

    // 2. Immediately decrement local stock for all items
    for (const item of trxData.items) {
      await updateLocalProductStock(item.product_id, item.base_qty);
    }

    await syncService.refreshPendingCount();
    showToast(`Transaksi tersimpan secara OFFLINE di perangkat (${trxData.invoice_number})`, 'warn');
  };

  const handleResetForNew = () => {
    setCart([]);
    setOrderDiscount(0);
    setOrderNotes('');
    setSelectedCustomerId('');
    barcodeInputRef.current?.focus();
  };

  // Filter products by category & search
  const filteredProducts = products.filter((p) => {
    if (!p.is_active) return false;
    if (selectedCategoryId !== 'all' && p.category_id !== selectedCategoryId) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        p.name.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q)) ||
        p.sku.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden bg-slate-950">
      {/* Toast floating notification */}
      {toastMsg && (
        <div
          className={`fixed top-16 right-6 z-50 px-4 py-2.5 rounded-xl shadow-2xl border text-xs font-bold flex items-center gap-2 animate-bounce ${
            toastMsg.type === 'success'
              ? 'bg-emerald-950/95 border-emerald-400 text-emerald-200'
              : toastMsg.type === 'warn'
              ? 'bg-amber-950/95 border-amber-400 text-amber-200'
              : 'bg-rose-950/95 border-rose-400 text-rose-200'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* LEFT COLUMN: Fast Barcode Scanner & Product Grid / Search */}
      <div className="flex-1 flex flex-col border-r border-amber-500/20 overflow-hidden">
        {/* Top Control Bar: Fast Barcode USB Input + Camera trigger + Category Pills */}
        <div className="p-3 bg-slate-900/90 border-b border-amber-500/20 space-y-2.5">
          <div className="flex items-center gap-2">
            {/* USB Barcode scanner input always focused */}
            <form onSubmit={handleBarcodeSubmit} className="flex-1 relative">
              <Barcode className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-amber-400 pointer-events-none" />
              <input
                ref={barcodeInputRef}
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Scan Barcode USB atau ketik kode barang (F2)..."
                className="w-full bg-slate-950 border border-amber-500/40 rounded-xl pl-9 pr-14 py-2 text-xs font-mono font-semibold text-amber-300 placeholder:text-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-amber-400 font-bold border border-slate-700">
                F2
              </span>
            </form>

            {/* Mobile / Tablet Camera Barcode Scanner */}
            <button
              onClick={() => setShowCameraModal(true)}
              className="p-2 rounded-xl bg-emerald-950 border border-emerald-600/50 hover:bg-emerald-900 text-emerald-300 transition active:scale-95"
              title="Scan Barcode menggunakan Kamera HP / Tablet"
            >
              <Camera className="w-4 h-4 text-amber-400" />
            </button>

            {/* Manual Search Input */}
            <div className="w-48 hidden sm:block relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama barang..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <button
              onClick={() => setSelectedCategoryId('all')}
              className={`px-3 py-1 rounded-lg font-semibold text-[11px] whitespace-nowrap transition ${
                selectedCategoryId === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Semua Barang
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategoryId(c.id)}
                className={`px-3 py-1 rounded-lg font-semibold text-[11px] whitespace-nowrap transition ${
                  selectedCategoryId === c.id
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Catalog Grid (Fast Touch & Click) */}
        <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-2.5 content-start">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-500 text-xs">
              Tidak ada produk yang cocok dengan pencarian.
            </div>
          ) : (
            filteredProducts.map((p) => {
              const hasConversions = p.unit_conversions && p.unit_conversions.length > 0;
              const isLowStock = p.current_stock <= p.min_stock;

              return (
                <div
                  key={p.id}
                  className="group relative bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 hover:border-amber-500/50 rounded-xl p-2.5 flex flex-col justify-between transition-all hover:shadow-lg hover:shadow-emerald-950/40 text-left"
                >
                  <button
                    onClick={() => {
                      addProductToCart(p);
                      barcodeInputRef.current?.focus();
                    }}
                    className="w-full text-left"
                  >
                    <div className="flex justify-between items-start gap-1 mb-1">
                      <span className="text-[10px] font-mono text-slate-500 truncate max-w-[80px]">
                        {p.sku}
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                          p.current_stock <= 0
                            ? 'bg-rose-950 text-rose-400 border border-rose-800/60'
                            : isLowStock
                            ? 'bg-amber-950 text-amber-400 border border-amber-800/60'
                            : 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                        }`}
                      >
                        Stok: {p.current_stock} {p.base_unit}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-200 line-clamp-2 group-hover:text-amber-300 transition-colors leading-snug">
                      {p.name}
                    </h4>

                    {p.brand_variant && (
                      <span className="text-[10px] text-slate-500 truncate block mt-0.5">
                        {p.brand_variant}
                      </span>
                    )}

                    <div className="mt-2 flex items-baseline justify-between">
                      <span className="text-xs font-black text-amber-400 font-mono">
                        {formatRupiah(p.sell_price)}
                      </span>
                      <span className="text-[10px] text-slate-400">/{p.base_unit}</span>
                    </div>
                  </button>

                  {/* Multi-Unit Quick Add Buttons (Pcs / Renteng / Dus) */}
                  {hasConversions && (
                    <div className="mt-2 pt-2 border-t border-slate-800/80 flex flex-wrap gap-1">
                      {p.unit_conversions.map((conv, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            addProductToCart(p, conv.unit);
                            barcodeInputRef.current?.focus();
                          }}
                          className="px-1.5 py-0.5 rounded bg-emerald-950 hover:bg-emerald-900 border border-emerald-600/40 text-[9px] font-bold text-emerald-300 hover:text-amber-300 transition"
                          title={`Beli 1 ${conv.unit} (${conv.factor} ${p.base_unit}) = ${formatRupiah(conv.price)}`}
                        >
                          +{conv.unit} ({formatRupiah(conv.price)})
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Active Cart, Customer Selector, Total & Checkout Actions */}
      <div className="w-full lg:w-[460px] flex flex-col bg-slate-900 border-l border-amber-500/20 h-full overflow-hidden">
        {/* Cart Top Bar: Customer Selector & Draft Park Controls */}
        <div className="p-3 bg-emerald-950/70 border-b border-amber-500/20 flex items-center justify-between gap-2">
          {/* Customer select */}
          <div className="flex-1 flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
            >
              <option value="">Umum (Pelanggan Walk-In)</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.total_debt > 0 ? `(Hutang: Rp${c.total_debt.toLocaleString('id-ID')})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Park draft buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleParkCart}
              disabled={cart.length === 0}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 transition disabled:opacity-40"
              title="Parkir Transaksi Ini"
            >
              <PauseCircle className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowParkedModal(true)}
              className="relative p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 transition"
              title="Buka Transaksi Diparkir"
            >
              <Play className="w-4 h-4 fill-current text-emerald-400" />
              {parkedDrafts.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[9px] font-black flex items-center justify-center">
                  {parkedDrafts.length}
                </span>
              )}
            </button>
            <button
              onClick={handleClearCart}
              disabled={cart.length === 0}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition disabled:opacity-40"
              title="Kosongkan Keranjang"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Cart Items Table */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 text-center p-6 space-y-2">
              <ShoppingBag className="w-12 h-12 text-slate-700" />
              <span className="text-xs font-semibold">Keranjang Masih Kosong</span>
              <p className="text-[11px] text-slate-600 max-w-[220px]">
                Scan barcode USB (F2) atau klik produk dari katalog untuk mulai transaksi.
              </p>
            </div>
          ) : (
            cart.map((item, index) => {
              const product = products.find((p) => p.id === item.product_id);
              const availableUnits = [
                product?.base_unit || 'pcs',
                ...(product?.unit_conversions?.map((c) => c.unit) || []),
              ];

              return (
                <div
                  key={item.id}
                  className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-amber-500/30 transition flex flex-col gap-1.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-slate-500">#{index + 1}</span>
                        <h4 className="text-xs font-bold text-slate-200 leading-snug">
                          {item.name}
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">SKU: {item.sku}</span>
                    </div>
                    {/* Item subtotal */}
                    <span className="text-xs font-mono font-bold text-amber-300">
                      {formatRupiah(item.subtotal)}
                    </span>
                  </div>

                  {/* Quantity, Unit Selector, and Actions */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-900">
                    {/* Unit Selector (Pcs, Renteng, Karton) */}
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-400">Satuan:</span>
                      <select
                        value={item.unit}
                        onChange={(e) => handleChangeUnit(item.id, e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-[11px] font-semibold text-emerald-300 focus:outline-none focus:border-amber-400"
                      >
                        {availableUnits.map((u, i) => (
                          <option key={i} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Qty controls */}
                    <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                      <button
                        onClick={() => handleUpdateQty(item.id, -1)}
                        className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) => handleSetCustomQty(item.id, Number(e.target.value))}
                        className="w-10 text-center bg-transparent text-xs font-mono font-bold text-amber-300 focus:outline-none"
                      />
                      <button
                        onClick={() => handleUpdateQty(item.id, 1)}
                        className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Delete Item */}
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition"
                      title="Hapus barang"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Cart Calculation & Big Payment Button */}
        <div className="p-3 bg-slate-950 border-t border-amber-500/20 space-y-2">
          {/* Subtotal & Discount row */}
          <div className="space-y-1 text-xs text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Subtotal ({totalItemsCount} item)</span>
              <span className="font-mono">{formatRupiah(subtotal)}</span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Total Diskon</span>
                <span className="font-mono">-{formatRupiah(totalDiscount)}</span>
              </div>
            )}
            {tax > 0 && (
              <div className="flex justify-between text-slate-400">
                <span>Pajak ({taxRate}%)</span>
                <span className="font-mono">{formatRupiah(tax)}</span>
              </div>
            )}
          </div>

          {/* Grand Total Display */}
          <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-950 to-slate-900 border border-emerald-500/30 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                Total Belanja
              </span>
              <span className="text-2xl font-black text-amber-300 font-mono">
                {formatRupiah(total)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-emerald-400 font-bold block">
                {cart.length > 0 ? 'Siap Bayar' : 'Kosong'}
              </span>
              <span className="text-[9px] text-slate-500 font-mono">Tekan F4 / END</span>
            </div>
          </div>

          {/* Primary Action: BAYAR SEKARANG */}
          <button
            onClick={() => {
              if (cart.length === 0) {
                showToast('Keranjang masih kosong', 'warn');
                return;
              }
              setShowPaymentModal(true);
            }}
            disabled={cart.length === 0}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-950/60 flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <CreditCard className="w-5 h-5 text-slate-950" />
            <span>Bayar Transaksi (F4 / END)</span>
            <ArrowRight className="w-4 h-4 text-slate-950" />
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          barcodeInputRef.current?.focus();
        }}
        subtotal={subtotal}
        discount={totalDiscount}
        tax={tax}
        total={total}
        totalItems={totalItemsCount}
        customers={customers}
        selectedCustomerId={selectedCustomerId}
        onConfirmPayment={handleConfirmPayment}
      />

      {/* Receipt Modal with 58mm/80mm print & WhatsApp */}
      {lastCompletedTrx && (
        <ReceiptModal
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
          transaction={lastCompletedTrx}
          items={lastCompletedItems}
          store={store}
          onNewTransaction={handleResetForNew}
        />
      )}

      {/* Parked Drafts Modal */}
      <ParkedDraftsModal
        isOpen={showParkedModal}
        onClose={() => setShowParkedModal(false)}
        drafts={parkedDrafts}
        onResumeDraft={handleResumeDraft}
        onDeleteDraft={handleDeleteDraft}
      />

      {/* Camera Barcode Scanner Modal */}
      <CameraScannerModal
        isOpen={showCameraModal}
        onClose={() => {
          setShowCameraModal(false);
          barcodeInputRef.current?.focus();
        }}
        onScanSuccess={(code) => {
          setShowCameraModal(false);
          processBarcodeScan(code);
        }}
      />
    </div>
  );
};
