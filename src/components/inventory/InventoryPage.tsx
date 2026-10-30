import React, { useState, useEffect } from 'react';
import { Product, Supplier, StockMutation } from '../../types/pos';
import { formatRupiah, formatDateTime } from '../../lib/printerService';
import {
  Layers,
  Boxes,
  Plus,
  SlidersHorizontal,
  History,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  RotateCcw,
  RefreshCw,
  CheckCircle2,
  X,
} from 'lucide-react';

export const InventoryPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [mutations, setMutations] = useState<StockMutation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'stock' | 'stock-in' | 'adjustment' | 'mutations'>('stock');

  // Stock In Form
  const [inProductId, setInProductId] = useState<string>('');
  const [inQty, setInQty] = useState<number>(10);
  const [inCostPrice, setInCostPrice] = useState<number>(0);
  const [inSupplierId, setInSupplierId] = useState<string>('');
  const [inInvoiceRef, setInInvoiceRef] = useState<string>('');
  const [inNotes, setInNotes] = useState<string>('');

  // Adjustment Form
  const [adjProductId, setAdjProductId] = useState<string>('');
  const [adjActualStock, setAdjActualStock] = useState<number>(0);
  const [adjReason, setAdjReason] = useState<string>('Stok Opname Rutin');

  const [notification, setNotification] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, supRes, mutRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/suppliers'),
        fetch('/api/inventory/mutations'),
      ]);
      if (prodRes.ok) {
        const pList = await prodRes.json();
        setProducts(pList);
        if (pList.length > 0) {
          if (!inProductId) {
            setInProductId(pList[0].id);
            setInCostPrice(pList[0].cost_price);
          }
          if (!adjProductId) {
            setAdjProductId(pList[0].id);
            setAdjActualStock(pList[0].current_stock);
          }
        }
      }
      if (supRes.ok) setSuppliers(await supRes.json());
      if (mutRes.ok) setMutations(await mutRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showMsg = (txt: string) => {
    setNotification(txt);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleStockInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inProductId || inQty <= 0) {
      alert('Pilih produk dan jumlah barang masuk dengan benar');
      return;
    }

    try {
      const res = await fetch('/api/inventory/stock-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: inProductId,
          qty: inQty,
          cost_price: inCostPrice,
          supplier_id: inSupplierId,
          invoice_ref: inInvoiceRef || `IN-${Date.now().toString().slice(-6)}`,
          notes: inNotes || 'Penerimaan barang dari supplier',
          user_name: 'Admin Toko',
        }),
      });

      if (res.ok) {
        showMsg(`Barang masuk sebanyak ${inQty} berhasil ditambahkan ke stok`);
        setInNotes('');
        setInInvoiceRef('');
        await fetchData();
        setActiveTab('stock');
      }
    } catch {
      alert('Gagal memproses barang masuk');
    }
  };

  const handleAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjProductId) return;

    try {
      const res = await fetch('/api/inventory/adjustment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: adjProductId,
          actual_stock: adjActualStock,
          reason: adjReason,
          user_name: 'Admin Opname',
        }),
      });

      if (res.ok) {
        showMsg('Penyesuaian stok opname berhasil disimpan');
        await fetchData();
        setActiveTab('stock');
      }
    } catch {
      alert('Gagal memproses penyesuaian stok');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border border-amber-500/20 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" />
            <h1 className="text-xl font-black text-slate-100 font-serif">
              Manajemen Stok & Inventaris Toko
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Pantau ketersediaan barang fisik, penerimaan barang masuk supplier, penyesuaian opname, dan riwayat mutasi.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap items-center bg-slate-900 p-1 rounded-xl border border-slate-800 gap-1">
          <button
            onClick={() => setActiveTab('stock')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'stock' ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:text-white'
            }`}
          >
            Stok Barang
          </button>
          <button
            onClick={() => setActiveTab('stock-in')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'stock-in' ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:text-white'
            }`}
          >
            Barang Masuk
          </button>
          <button
            onClick={() => setActiveTab('adjustment')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'adjustment' ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:text-white'
            }`}
          >
            Stok Opname
          </button>
          <button
            onClick={() => setActiveTab('mutations')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              activeTab === 'mutations' ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:text-white'
            }`}
          >
            Mutasi Stok
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-3.5 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      {/* TAB 1: STOK BARANG */}
      {activeTab === 'stock' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center">
            <h3 className="font-bold text-xs uppercase tracking-wider text-amber-400">
              Daftar Ketersediaan Stok Terkini
            </h3>
            <span className="text-xs text-slate-400">{products.length} barang terdaftar</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3.5">SKU</th>
                  <th className="p-3.5">Nama Barang</th>
                  <th className="p-3.5">Harga Modal</th>
                  <th className="p-3.5">Harga Jual</th>
                  <th className="p-3.5">Stok Saat Ini</th>
                  <th className="p-3.5">Batas Minimum</th>
                  <th className="p-3.5">Nilai Aset Stok</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {products.map((p) => {
                  const isLow = p.current_stock <= p.min_stock;
                  const totalAsset = p.current_stock * p.cost_price;

                  return (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3.5 font-mono font-bold text-amber-300">{p.sku}</td>
                      <td className="p-3.5 font-bold text-slate-200">{p.name}</td>
                      <td className="p-3.5 font-mono text-slate-400">{formatRupiah(p.cost_price)}</td>
                      <td className="p-3.5 font-mono font-bold text-slate-200">{formatRupiah(p.sell_price)}</td>
                      <td className="p-3.5">
                        <span
                          className={`font-mono font-bold px-2.5 py-1 rounded text-xs ${
                            isLow
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          }`}
                        >
                          {p.current_stock} {p.base_unit}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-400">{p.min_stock} {p.base_unit}</td>
                      <td className="p-3.5 font-mono text-amber-400">{formatRupiah(totalAsset)}</td>
                      <td className="p-3.5">
                        {isLow ? (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[10px] font-bold">
                            Perlu Restock
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                            Aman
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: BARANG MASUK */}
      {activeTab === 'stock-in' && (
        <div className="max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Boxes className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm text-slate-100">Catat Penerimaan Barang Masuk / Pembelian</h3>
          </div>

          <form onSubmit={handleStockInSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Pilih Produk</label>
              <select
                value={inProductId}
                onChange={(e) => {
                  setInProductId(e.target.value);
                  const selected = products.find((p) => p.id === e.target.value);
                  if (selected) setInCostPrice(selected.cost_price);
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Stok Saat Ini: {p.current_stock} {p.base_unit})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Jumlah Barang Masuk (Satuan Dasar)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={inQty}
                  onChange={(e) => setInQty(Number(e.target.value) || 1)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Harga Beli / Modal Baru per Unit (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  value={inCostPrice}
                  onChange={(e) => setInCostPrice(Number(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Pemasok / Supplier</label>
                <select
                  value={inSupplierId}
                  onChange={(e) => setInSupplierId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                >
                  <option value="">-- Pilih Supplier --</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  No. Surat Jalan / Faktur Beli
                </label>
                <input
                  type="text"
                  value={inInvoiceRef}
                  onChange={(e) => setInInvoiceRef(e.target.value)}
                  placeholder="Contoh: SJ-2026/10/889"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Catatan</label>
              <input
                type="text"
                value={inNotes}
                onChange={(e) => setInNotes(e.target.value)}
                placeholder="Catatan tambahan penerimaan barang..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
              />
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black shadow-lg shadow-amber-950/50 flex items-center gap-2 transition active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4 text-slate-950" />
              <span>Simpan Penerimaan Barang Masuk</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: STOK OPNAME / PENYESUAIAN */}
      {activeTab === 'adjustment' && (
        <div className="max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <SlidersHorizontal className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm text-slate-100">Penyesuaian Stok Opname (Hitung Fisik)</h3>
          </div>

          <form onSubmit={handleAdjustmentSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Pilih Produk</label>
              <select
                value={adjProductId}
                onChange={(e) => {
                  setAdjProductId(e.target.value);
                  const selected = products.find((p) => p.id === e.target.value);
                  if (selected) setAdjActualStock(selected.current_stock);
                }}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (Stok Sistem: {p.current_stock} {p.base_unit})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Stok Fisik Sebenarnya di Gudang/Toko
              </label>
              <input
                type="number"
                min="0"
                required
                value={adjActualStock}
                onChange={(e) => setAdjActualStock(Number(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Alasan Penyesuaian</label>
              <input
                type="text"
                required
                value={adjReason}
                onChange={(e) => setAdjReason(e.target.value)}
                placeholder="Misal: Selisih hitung fisik bulanan, barang rusak, dsb."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
              />
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black shadow-lg shadow-amber-950/50 flex items-center gap-2 transition active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4 text-slate-950" />
              <span>Simpan Penyesuaian Opname</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: RIWAYAT MUTASI STOK */}
      {activeTab === 'mutations' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center">
            <h3 className="font-bold text-xs uppercase tracking-wider text-amber-400">
              Audit Trail Pergerakan Mutasi Stok
            </h3>
            <span className="text-xs text-slate-400">{mutations.length} catatan mutasi</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Waktu</th>
                  <th className="p-3.5">Nama Barang</th>
                  <th className="p-3.5">Tipe Mutasi</th>
                  <th className="p-3.5">Perubahan (+/-)</th>
                  <th className="p-3.5">Sisa Akhir</th>
                  <th className="p-3.5">Referensi</th>
                  <th className="p-3.5">Petugas</th>
                  <th className="p-3.5">Catatan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {mutations.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-500">
                      Belum ada catatan mutasi stok.
                    </td>
                  </tr>
                ) : (
                  mutations.map((m) => {
                    const isPositive = m.qty_delta > 0;
                    return (
                      <tr key={m.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3.5 text-slate-400">{formatDateTime(m.created_at)}</td>
                        <td className="p-3.5 font-bold text-slate-200">{m.product_name || 'Barang'}</td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded uppercase font-mono text-[9px] font-bold bg-slate-800 text-slate-300">
                            {m.mutation_type}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono font-bold">
                          <span className={isPositive ? 'text-emerald-400' : 'text-rose-400'}>
                            {isPositive ? `+${m.qty_delta}` : m.qty_delta}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono font-bold text-amber-300">{m.remaining_stock}</td>
                        <td className="p-3.5 font-mono text-slate-400">{m.reference_id || '-'}</td>
                        <td className="p-3.5 text-slate-300">{m.user_name || '-'}</td>
                        <td className="p-3.5 text-slate-400 text-[11px]">{m.notes}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
