import React, { useState, useEffect } from 'react';
import { Category, Unit } from '../../types/pos';
import { Tags, Scale, Plus, CheckCircle2, X } from 'lucide-react';

interface CategoriesAndUnitsPageProps {
  initialTab?: 'categories' | 'units';
}

export const CategoriesAndUnitsPage: React.FC<CategoriesAndUnitsPageProps> = ({
  initialTab = 'categories',
}) => {
  const [activeTab, setActiveTab] = useState<'categories' | 'units'>(initialTab);
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [newUnitName, setNewUnitName] = useState('');
  const [newUnitSymbol, setNewUnitSymbol] = useState('');
  const [newUnitIsBase, setNewUnitIsBase] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [catRes, unitRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/units'),
      ]);
      if (catRes.ok) setCategories(await catRes.json());
      if (unitRes.ok) setUnits(await unitRes.json());
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showMsg = (txt: string) => {
    setNotification(txt);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCatName.trim() }),
      });
      if (res.ok) {
        showMsg(`Kategori "${newCatName}" berhasil ditambahkan`);
        setNewCatName('');
        await fetchData();
      }
    } catch {
      alert('Gagal menambahkan kategori');
    }
  };

  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUnitName.trim() || !newUnitSymbol.trim()) return;

    try {
      const res = await fetch('/api/units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newUnitName.trim(),
          symbol: newUnitSymbol.trim(),
          is_base: newUnitIsBase,
        }),
      });
      if (res.ok) {
        showMsg(`Satuan "${newUnitName}" (${newUnitSymbol}) berhasil ditambahkan`);
        setNewUnitName('');
        setNewUnitSymbol('');
        setNewUnitIsBase(false);
        await fetchData();
      }
    } catch {
      alert('Gagal menambahkan satuan');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-slate-950 text-slate-100">
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border border-amber-500/20 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Tags className="w-5 h-5 text-amber-400" />
            <h1 className="text-xl font-black text-slate-100 font-serif">
              Kategori Barang, Satuan & Konversi
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Konfigurasi kategori produk dan satuan universal (Pcs, Renteng, Dus, Karton, Kg, Porsi).
          </p>
        </div>

        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'categories' ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Tags className="w-3.5 h-3.5" />
            <span>Kategori Barang</span>
          </button>
          <button
            onClick={() => setActiveTab('units')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'units' ? 'bg-amber-500 text-slate-950' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Satuan & Simbol</span>
          </button>
        </div>
      </div>

      {notification && (
        <div className="p-3.5 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      {/* CATEGORIES TAB */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Add Category Form */}
          <form onSubmit={handleAddCategory} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 h-fit shadow-xl">
            <h3 className="font-bold text-sm text-amber-300 pb-2 border-b border-slate-800">
              Tambah Kategori Baru
            </h3>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Nama Kategori</label>
              <input
                type="text"
                required
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Contoh: Sembako & Pangan..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Kategori</span>
            </button>
          </form>

          {/* Categories Grid */}
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {categories.map((c) => (
              <div
                key={c.id}
                className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center">
                    <Tags className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">{c.name}</h4>
                    <span className="text-[10px] text-slate-500 font-mono">ID: {c.id}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* UNITS TAB */}
      {activeTab === 'units' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Add Unit Form */}
          <form onSubmit={handleAddUnit} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 h-fit shadow-xl">
            <h3 className="font-bold text-sm text-amber-300 pb-2 border-b border-slate-800">
              Tambah Satuan Baru
            </h3>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Nama Satuan</label>
              <input
                type="text"
                required
                value={newUnitName}
                onChange={(e) => setNewUnitName(e.target.value)}
                placeholder="Contoh: Renteng, Bal, Porsi..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Simbol / Singkatan</label>
              <input
                type="text"
                required
                value={newUnitSymbol}
                onChange={(e) => setNewUnitSymbol(e.target.value)}
                placeholder="Contoh: rtg, bal, cup..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-400"
              />
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={newUnitIsBase}
                onChange={(e) => setNewUnitIsBase(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-amber-500"
              />
              <span>Satuan Dasar Utama (Basis Hitung Stok)</span>
            </label>
            <button
              type="submit"
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Satuan</span>
            </button>
          </form>

          {/* Units List */}
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {units.map((u) => (
              <div
                key={u.id}
                className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-200">{u.name}</h4>
                  <span className="text-[11px] font-mono font-semibold text-amber-400">
                    Simbol: {u.symbol}
                  </span>
                </div>
                {u.is_base ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
                    Satuan Dasar
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px]">
                    Satuan Konversi
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
