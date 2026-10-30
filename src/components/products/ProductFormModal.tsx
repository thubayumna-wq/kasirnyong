import React, { useState, useEffect } from 'react';
import { Product, Category, Unit, UnitConversion, Supplier } from '../../types/pos';
import { formatRupiah } from '../../lib/printerService';
import {
  X,
  Plus,
  Trash2,
  Package,
  Barcode,
  Layers,
  Scale,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
  categories: Category[];
  units: Unit[];
  suppliers: Supplier[];
  onSave: (productData: any) => Promise<void>;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
  categories,
  units,
  suppliers,
  onSave,
}) => {
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brandVariant, setBrandVariant] = useState('');
  const [description, setDescription] = useState('');
  const [costPrice, setCostPrice] = useState<number>(0);
  const [sellPrice, setSellPrice] = useState<number>(0);
  const [baseUnit, setBaseUnit] = useState('pcs');
  const [currentStock, setCurrentStock] = useState<number>(0);
  const [minStock, setMinStock] = useState<number>(5);
  const [supplierId, setSupplierId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [conversions, setConversions] = useState<UnitConversion[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Suggested unit conversion helpers
  const unitPresets = [
    { unit: 'renteng', factor: 10, label: 'Renteng (10 pcs)' },
    { unit: 'dus', factor: 40, label: 'Dus / Karton (40 pcs)' },
    { unit: 'pak', factor: 12, label: 'Pak (12 pcs)' },
    { unit: 'karton', factor: 120, label: 'Karton Besar (120 pcs)' },
  ];

  useEffect(() => {
    if (productToEdit) {
      setSku(productToEdit.sku || '');
      setBarcode(productToEdit.barcode || '');
      setName(productToEdit.name || '');
      setCategoryId(productToEdit.category_id || categories[0]?.id || '');
      setBrandVariant(productToEdit.brand_variant || '');
      setDescription(productToEdit.description || '');
      setCostPrice(productToEdit.cost_price || 0);
      setSellPrice(productToEdit.sell_price || 0);
      setBaseUnit(productToEdit.base_unit || 'pcs');
      setCurrentStock(productToEdit.current_stock || 0);
      setMinStock(productToEdit.min_stock || 5);
      setSupplierId(productToEdit.supplier_id || '');
      setIsActive(productToEdit.is_active !== undefined ? productToEdit.is_active : true);
      setConversions(productToEdit.unit_conversions ? [...productToEdit.unit_conversions] : []);
    } else {
      // New product defaults
      const randSku = `BRG-${Math.floor(1000 + Math.random() * 9000)}`;
      setSku(randSku);
      setBarcode(`899${Math.floor(100000000 + Math.random() * 900000000)}`);
      setName('');
      setCategoryId(categories[0]?.id || '');
      setBrandVariant('');
      setDescription('');
      setCostPrice(0);
      setSellPrice(0);
      setBaseUnit('pcs');
      setCurrentStock(100);
      setMinStock(10);
      setSupplierId(suppliers[0]?.id || '');
      setIsActive(true);
      setConversions([]);
    }
    setErrorMsg(null);
    setIsSubmitting(false);
  }, [productToEdit, isOpen, categories, suppliers]);

  if (!isOpen) return null;

  const handleAddConversion = () => {
    setConversions([
      ...conversions,
      {
        unit: 'renteng',
        factor: 10,
        price: sellPrice > 0 ? sellPrice * 9.5 : 0, // default slight discount for bulk
      },
    ]);
  };

  const handleUpdateConversion = (index: number, field: keyof UnitConversion, value: any) => {
    setConversions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleRemoveConversion = (index: number) => {
    setConversions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Nama barang wajib diisi');
      return;
    }
    if (!sku.trim()) {
      setErrorMsg('SKU / Kode barang wajib diisi');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        id: productToEdit?.id,
        sku: sku.trim(),
        barcode: barcode.trim(),
        name: name.trim(),
        category_id: categoryId,
        brand_variant: brandVariant.trim(),
        description: description.trim(),
        cost_price: Number(costPrice) || 0,
        sell_price: Number(sellPrice) || 0,
        base_unit: baseUnit,
        current_stock: Number(currentStock) || 0,
        min_stock: Number(minStock) || 0,
        supplier_id: supplierId,
        is_active: isActive,
        unit_conversions: conversions.map((c) => ({
          ...c,
          factor: Number(c.factor) || 1,
          price: Number(c.price) || 0,
        })),
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan barang');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-amber-500/30 rounded-2xl overflow-hidden shadow-2xl flex flex-col text-slate-100 max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border-b border-amber-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-extrabold text-amber-300">
              {productToEdit ? 'Edit Data Barang' : 'Tambah Master Barang Baru'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-500/60 text-rose-300 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Row 1: SKU & Barcode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Kode Barang / SKU <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="Misal: SBK-MIE-001"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Nomor Barcode (EAN / UPC / Scanner)
              </label>
              <div className="relative">
                <Barcode className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="Scan atau ketik barcode..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Row 2: Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Nama Barang <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Kopi Kapal Api Special Mix Sachet"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-semibold focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Kategori</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Brand & Base Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Merek / Varian / Ukuran
              </label>
              <input
                type="text"
                value={brandVariant}
                onChange={(e) => setBrandVariant(e.target.value)}
                placeholder="Contoh: Kapal Api Sachet 24g / Merah M"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Satuan Dasar Penjualan
              </label>
              <select
                value={baseUnit}
                onChange={(e) => setBaseUnit(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
              >
                {units.map((u) => (
                  <option key={u.id} value={u.symbol}>
                    {u.name} ({u.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 4: Pricing (Modal & Jual) */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
              Harga Satuan Dasar ({baseUnit})
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Harga Modal / Beli (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  value={costPrice}
                  onChange={(e) => setCostPrice(Number(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-semibold text-slate-200 focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Harga Jual Satuan (Rp)
                </label>
                <input
                  type="number"
                  min="0"
                  value={sellPrice}
                  onChange={(e) => setSellPrice(Number(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>

          {/* Row 5: Multi-unit Conversions (Renteng, Dus, Karton, dsb.) */}
          <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider block">
                  Konversi Satuan Penjualan (Grosir / Renteng / Dus)
                </span>
                <span className="text-[10px] text-slate-400">
                  Misal: 1 renteng = 10 {baseUnit}, 1 karton = 120 {baseUnit}
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddConversion}
                className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-bold flex items-center gap-1 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Konversi</span>
              </button>
            </div>

            {conversions.length === 0 ? (
              <div className="text-[11px] text-slate-500 italic py-1">
                Belum ada konversi satuan khusus. Barang hanya dijual per {baseUnit}.
              </div>
            ) : (
              <div className="space-y-2">
                {conversions.map((conv, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center gap-2"
                  >
                    <div className="flex items-center gap-1.5 w-full sm:w-auto">
                      <span className="text-[11px] text-slate-400">1</span>
                      <input
                        type="text"
                        value={conv.unit}
                        onChange={(e) => handleUpdateConversion(idx, 'unit', e.target.value)}
                        placeholder="renteng / dus"
                        className="w-24 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-emerald-300 font-semibold"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 w-full sm:w-auto">
                      <span className="text-[11px] text-slate-400">=</span>
                      <input
                        type="number"
                        min="1"
                        value={conv.factor}
                        onChange={(e) => handleUpdateConversion(idx, 'factor', Number(e.target.value) || 1)}
                        className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-center text-slate-200"
                      />
                      <span className="text-[11px] text-slate-400">{baseUnit}</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-1 w-full sm:w-auto">
                      <span className="text-[11px] text-slate-400">Harga:</span>
                      <input
                        type="number"
                        min="0"
                        value={conv.price}
                        onChange={(e) => handleUpdateConversion(idx, 'price', Number(e.target.value) || 0)}
                        placeholder="Harga Jual"
                        className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs font-mono font-bold text-amber-300"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveConversion(idx)}
                      className="p-1 rounded text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Row 6: Stock & Supplier */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Stok Fisik Saat Ini ({baseUnit})
              </label>
              <input
                type="number"
                value={currentStock}
                onChange={(e) => setCurrentStock(Number(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 font-bold focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Batas Stok Minimum
              </label>
              <input
                type="number"
                min="0"
                value={minStock}
                onChange={(e) => setMinStock(Number(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Pemasok</label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
              >
                <option value="">-- Tanpa Pemasok Tetap --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-0"
            />
            <span>Status Barang Aktif untuk Penjualan</span>
          </label>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-extrabold shadow-lg shadow-amber-950/50 flex items-center gap-1.5 transition active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4 text-slate-950" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Barang'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
