import React, { useState, useEffect } from 'react';
import { Product, Category, Unit, Supplier } from '../../types/pos';
import { formatRupiah } from '../../lib/printerService';
import { ProductFormModal } from './ProductFormModal';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  Scale,
  Barcode,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes, unitRes, supRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/categories'),
        fetch('/api/units'),
        fetch('/api/suppliers'),
      ]);
      if (prodRes.ok) setProducts(await prodRes.json());
      if (catRes.ok) setCategories(await catRes.json());
      if (unitRes.ok) setUnits(await unitRes.json());
      if (supRes.ok) setSuppliers(await supRes.json());
    } catch (e) {
      console.error('Failed to fetch product data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showNotification = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleSaveProduct = async (productData: any) => {
    const isEdit = Boolean(productData.id);
    const url = isEdit ? `/api/products/${productData.id}` : '/api/products';
    const method = isEdit ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Gagal menyimpan barang');
    }

    showNotification(isEdit ? 'Data barang berhasil diperbarui' : 'Barang baru berhasil ditambahkan');
    await fetchData();
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!confirm(`Nonaktifkan barang "${product.name}"? Riwayat transaksi lama akan tetap aman tersimpan.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/products/${product.id}`, { method: 'DELETE' });
      if (res.ok) {
        showNotification(`Barang "${product.name}" dinonaktifkan`);
        await fetchData();
      }
    } catch {
      alert('Gagal memproses penonaktifan barang');
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['SKU', 'Barcode', 'Nama Barang', 'Kategori', 'Harga Modal', 'Harga Jual', 'Satuan Dasar', 'Stok', 'Stok Min', 'Status'];
    const rows = products.map((p) => {
      const cat = categories.find((c) => c.id === p.category_id)?.name || '';
      return [
        `"${p.sku}"`,
        `"${p.barcode || ''}"`,
        `"${p.name.replace(/"/g, '""')}"`,
        `"${cat}"`,
        p.cost_price,
        p.sell_price,
        `"${p.base_unit}"`,
        p.current_stock,
        p.min_stock,
        p.is_active ? 'Aktif' : 'Nonaktif',
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `HILALPOS_Master_Barang_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('File CSV berhasil diunduh');
  };

  const filteredProducts = products.filter((p) => {
    if (selectedCat !== 'all' && p.category_id !== selectedCat) return false;
    if (statusFilter === 'active' && !p.is_active) return false;
    if (statusFilter === 'inactive' && p.is_active) return false;
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      return (
        p.name.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q)) ||
        p.sku.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-slate-950 text-slate-100">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border border-amber-500/20 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-400" />
            <h1 className="text-xl font-black text-slate-100 font-serif">Master Data Barang</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Kelola katalog barang, barcode, SKU, multi-satuan konversi (renteng/karton), dan batas stok.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition"
            title="Ekspor ke CSV"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Ekspor CSV</span>
          </button>
          <button
            onClick={() => {
              setEditingProduct(null);
              setShowModal(true);
            }}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black shadow-lg shadow-amber-950/50 flex items-center gap-1.5 transition active:scale-95"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>Tambah Barang Baru</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-4 h-4" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="w-full md:w-80 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, SKU, atau barcode..."
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* Categories & Status Filter */}
        <div className="w-full md:w-auto flex flex-wrap items-center gap-2">
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
          >
            <option value="all">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif Saja</option>
            <option value="inactive">Nonaktif</option>
          </select>

          <button
            onClick={fetchData}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="p-3.5">Kode / SKU</th>
                <th className="p-3.5">Barcode</th>
                <th className="p-3.5">Nama Barang & Merek</th>
                <th className="p-3.5">Kategori</th>
                <th className="p-3.5">Harga Modal</th>
                <th className="p-3.5">Harga Jual</th>
                <th className="p-3.5">Konversi Satuan</th>
                <th className="p-3.5">Stok Fisik</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-500">
                    Tidak ada barang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const catName = categories.find((c) => c.id === p.category_id)?.name || '-';
                  const isLow = p.current_stock <= p.min_stock;

                  return (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3.5 font-mono font-bold text-amber-300">{p.sku}</td>
                      <td className="p-3.5 font-mono text-slate-400">{p.barcode || '-'}</td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-100">{p.name}</div>
                        {p.brand_variant && (
                          <div className="text-[10px] text-slate-400">{p.brand_variant}</div>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-300">{catName}</td>
                      <td className="p-3.5 font-mono text-slate-400">{formatRupiah(p.cost_price)}</td>
                      <td className="p-3.5 font-mono font-bold text-amber-400">
                        {formatRupiah(p.sell_price)}
                        <span className="text-[10px] text-slate-500 font-normal">/{p.base_unit}</span>
                      </td>
                      <td className="p-3.5">
                        {p.unit_conversions && p.unit_conversions.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {p.unit_conversions.map((conv, i) => (
                              <span
                                key={i}
                                className="px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-600/30 text-[10px] text-emerald-300 font-semibold"
                              >
                                1 {conv.unit} = {conv.factor} {p.base_unit} ({formatRupiah(conv.price)})
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500">Hanya {p.base_unit}</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                            isLow
                              ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                              : 'bg-slate-800 text-slate-200'
                          }`}
                        >
                          {p.current_stock} {p.base_unit}
                        </span>
                      </td>
                      <td className="p-3.5">
                        {p.is_active ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                            Aktif
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-bold">
                            Nonaktif
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setEditingProduct(p);
                              setShowModal(true);
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-300 transition"
                            title="Edit Barang"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition"
                            title="Nonaktifkan Barang"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      <ProductFormModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingProduct(null);
        }}
        productToEdit={editingProduct}
        categories={categories}
        units={units}
        suppliers={suppliers}
        onSave={handleSaveProduct}
      />
    </div>
  );
};
