import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const app = express();
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'hilalpos_db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Relational in-memory / file-backed DB schema
interface DatabaseSchema {
  stores: any[];
  users: any[];
  categories: any[];
  units: any[];
  products: any[];
  transactions: any[];
  transaction_items: any[];
  stock_mutations: any[];
  customers: any[];
  suppliers: any[];
  sync_logs: any[];
  system_config: {
    initialized: boolean;
    version: string;
    last_sync: string;
  };
}

// Initial seed template for HILALPOS
function getInitialData(): DatabaseSchema {
  const storeId = 'store-hilal-01';
  const now = new Date().toISOString();

  return {
    stores: [
      {
        id: storeId,
        name: 'HILALPOS Toko Berkah Utama',
        tagline: 'SATU SISTEM, SEMUA USAHA',
        address: 'Jl. Pemuda No. 88, Pusat Perbelanjaan, Indonesia',
        phone: '081234567890',
        currency: 'IDR',
        timezone: 'Asia/Jakarta',
        tax_rate: 0, // default 0% or customizable
        receipt_paper: '58mm', // '58mm' or '80mm'
        receipt_header: 'Selamat Datang di HILALPOS Toko Berkah',
        receipt_footer: 'Terima kasih atas kunjungan Anda!\nBarang yang sudah dibeli tidak dapat ditukar kecuali perjanjian.',
        whatsapp_sender: '6281234567890',
        whatsapp_template: 'Halo {customer}, terima kasih telah berbelanja di {store}. Berikut struk transaksi #{invoice} senilai Rp{total}. Tanggal: {date}. Semoga berkah selalu!',
        negative_stock_allowed: false,
        created_at: now,
        updated_at: now,
      },
    ],
    users: [
      {
        id: 'usr-admin-01',
        store_id: storeId,
        username: 'admin',
        password_hash: 'admin123', // Demo initial password
        name: 'Ahmad Super Admin',
        role: 'superadmin',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'usr-kasir-01',
        store_id: storeId,
        username: 'kasir',
        password_hash: 'kasir123',
        name: 'Siti Kasir Berkah',
        role: 'kasir',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'usr-spv-01',
        store_id: storeId,
        username: 'supervisor',
        password_hash: 'spv123',
        name: 'Budi Supervisor',
        role: 'supervisor',
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ],
    categories: [
      { id: 'cat-sembako', store_id: storeId, name: 'Sembako & Pangan', icon: 'ShoppingBag', created_at: now, updated_at: now },
      { id: 'cat-minuman', store_id: storeId, name: 'Minuman & Kopi', icon: 'Coffee', created_at: now, updated_at: now },
      { id: 'cat-snack', store_id: storeId, name: 'Snack & Makanan Ringan', icon: 'Cookie', created_at: now, updated_at: now },
      { id: 'cat-personal', store_id: storeId, name: 'Kebutuhan Pribadi & Sabun', icon: 'Sparkles', created_at: now, updated_at: now },
      { id: 'cat-elektronik', store_id: storeId, name: 'Aksesoris & Elektronik', icon: 'Cpu', created_at: now, updated_at: now },
      { id: 'cat-fashion', store_id: storeId, name: 'Pakaian & Perlengkapan', icon: 'Shirt', created_at: now, updated_at: now },
    ],
    units: [
      { id: 'u-pcs', store_id: storeId, name: 'Pcs / Buah', symbol: 'pcs', is_base: true, created_at: now, updated_at: now },
      { id: 'u-renteng', store_id: storeId, name: 'Renteng', symbol: 'rtg', is_base: false, created_at: now, updated_at: now },
      { id: 'u-pak', store_id: storeId, name: 'Pak / Pack', symbol: 'pak', is_base: false, created_at: now, updated_at: now },
      { id: 'u-karton', store_id: storeId, name: 'Karton / Dus', symbol: 'dus', is_base: false, created_at: now, updated_at: now },
      { id: 'u-kg', store_id: storeId, name: 'Kilogram', symbol: 'kg', is_base: true, created_at: now, updated_at: now },
      { id: 'u-porsi', store_id: storeId, name: 'Porsi / Cup', symbol: 'porsi', is_base: true, created_at: now, updated_at: now },
    ],
    products: [
      {
        id: 'prod-001',
        store_id: storeId,
        sku: 'SBK-KOP-001',
        barcode: '899100100101',
        name: 'Kopi Kapal Api Special Mix',
        category_id: 'cat-minuman',
        brand_variant: 'Kapal Api Sachet 24gr',
        description: 'Kopi bubuk instan gula paduan mantap.',
        cost_price: 1300,
        sell_price: 2000,
        base_unit: 'pcs',
        current_stock: 450,
        min_stock: 50,
        supplier_id: 'sup-001',
        is_active: true,
        unit_conversions: [
          { unit: 'renteng', factor: 10, price: 18000, name: 'Renteng (10 sachet)' },
          { unit: 'karton', factor: 120, price: 205000, name: 'Karton (12 renteng / 120 pcs)' },
        ],
        created_at: now,
        updated_at: now,
        updated_by: 'admin',
      },
      {
        id: 'prod-002',
        store_id: storeId,
        sku: 'SBK-MIE-001',
        barcode: '899886620022',
        name: 'Indomie Goreng Spesial',
        category_id: 'cat-sembako',
        brand_variant: 'Indofood 85gr',
        description: 'Mie instan goreng rasa spesial legendaris.',
        cost_price: 2800,
        sell_price: 3500,
        base_unit: 'pcs',
        current_stock: 320,
        min_stock: 40,
        supplier_id: 'sup-001',
        is_active: true,
        unit_conversions: [
          { unit: 'dus', factor: 40, price: 130000, name: 'Karton / Dus (40 pcs)' },
        ],
        created_at: now,
        updated_at: now,
        updated_by: 'admin',
      },
      {
        id: 'prod-003',
        store_id: storeId,
        sku: 'SBK-MYK-001',
        barcode: '899300500303',
        name: 'Minyak Goreng Sania Pouch 2L',
        category_id: 'cat-sembako',
        brand_variant: 'Sania 2 Liter',
        description: 'Minyak goreng kelapa sawit higienis bermutu.',
        cost_price: 32000,
        sell_price: 36500,
        base_unit: 'pcs',
        current_stock: 85,
        min_stock: 15,
        supplier_id: 'sup-001',
        is_active: true,
        unit_conversions: [
          { unit: 'dus', factor: 6, price: 215000, name: 'Karton / Dus (6 pouch)' },
        ],
        created_at: now,
        updated_at: now,
        updated_by: 'admin',
      },
      {
        id: 'prod-004',
        store_id: storeId,
        sku: 'SNK-CHIP-001',
        barcode: '899200400404',
        name: 'Chitato Sapi Panggang 68g',
        category_id: 'cat-snack',
        brand_variant: 'Indofood Fritolay',
        description: 'Keripik kentang bergelombang rasa sapi panggang.',
        cost_price: 8500,
        sell_price: 11500,
        base_unit: 'pcs',
        current_stock: 60,
        min_stock: 12,
        supplier_id: 'sup-002',
        is_active: true,
        unit_conversions: [
          { unit: 'dus', factor: 30, price: 330000, name: 'Dus (30 pcs)' },
        ],
        created_at: now,
        updated_at: now,
        updated_by: 'admin',
      },
      {
        id: 'prod-005',
        store_id: storeId,
        sku: 'KFE-LTT-001',
        barcode: '899554400505',
        name: 'Kopi Susu Gula Aren HILAL',
        category_id: 'cat-minuman',
        brand_variant: 'Fresh Brew 16oz',
        description: 'Espresso arabika blend dengan susu segar & gula aren murni.',
        cost_price: 7000,
        sell_price: 18000,
        base_unit: 'porsi',
        current_stock: 150,
        min_stock: 20,
        supplier_id: 'sup-002',
        is_active: true,
        unit_conversions: [],
        created_at: now,
        updated_at: now,
        updated_by: 'admin',
      },
      {
        id: 'prod-006',
        store_id: storeId,
        sku: 'ELK-KBL-001',
        barcode: '899665500606',
        name: 'Kabel Fast Charging Type-C 65W',
        category_id: 'cat-elektronik',
        brand_variant: 'Braided Nylon 1.2M',
        description: 'Kabel data dan charging tahan tekukan daya tinggi.',
        cost_price: 18000,
        sell_price: 35000,
        base_unit: 'pcs',
        current_stock: 28,
        min_stock: 5,
        supplier_id: 'sup-002',
        is_active: true,
        unit_conversions: [],
        created_at: now,
        updated_at: now,
        updated_by: 'admin',
      },
      {
        id: 'prod-007',
        store_id: storeId,
        sku: 'SBK-BRS-001',
        barcode: '899778800707',
        name: 'Beras Premium Ramos Wangi 5kg',
        category_id: 'cat-sembako',
        brand_variant: 'Karung 5kg',
        description: 'Beras pulen bersih kualitas super.',
        cost_price: 68000,
        sell_price: 75000,
        base_unit: 'pcs',
        current_stock: 45,
        min_stock: 10,
        supplier_id: 'sup-001',
        is_active: true,
        unit_conversions: [
          { unit: 'karton', factor: 5, price: 365000, name: 'Bal (5 karung / 25kg)' },
        ],
        created_at: now,
        updated_at: now,
        updated_by: 'admin',
      },
    ],
    transactions: [
      {
        id: 'trx-sample-01',
        store_id: storeId,
        invoice_number: 'TRX-20261029-001',
        cashier_id: 'usr-kasir-01',
        cashier_name: 'Siti Kasir Berkah',
        customer_id: 'cust-001',
        customer_name: 'Pak H. Sulaiman (Langganan)',
        subtotal: 54500,
        discount: 2500,
        tax: 0,
        total: 52000,
        payment_method: 'Tunai',
        payment_status: 'Lunas',
        total_paid: 60000,
        change_amount: 8000,
        remaining_debt: 0,
        due_date: null,
        notes: 'Pelanggan setia toko',
        offline_created: false,
        idempotency_key: 'idem-sample-01',
        synced_at: now,
        created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
        updated_at: new Date(Date.now() - 3600000 * 3).toISOString(),
      },
    ],
    transaction_items: [
      {
        id: 'item-sample-01',
        transaction_id: 'trx-sample-01',
        product_id: 'prod-001',
        sku_snapshot: 'SBK-KOP-001',
        name_snapshot: 'Kopi Kapal Api Special Mix',
        unit: 'renteng',
        factor: 10,
        qty: 1,
        base_qty: 10,
        cost_price_snapshot: 13000,
        sell_price_snapshot: 18000,
        discount: 0,
        subtotal: 18000,
      },
      {
        id: 'item-sample-02',
        transaction_id: 'trx-sample-01',
        product_id: 'prod-003',
        sku_snapshot: 'SBK-MYK-001',
        name_snapshot: 'Minyak Goreng Sania Pouch 2L',
        unit: 'pcs',
        factor: 1,
        qty: 1,
        base_qty: 1,
        cost_price_snapshot: 32000,
        sell_price_snapshot: 36500,
        discount: 2500,
        subtotal: 34000,
      },
    ],
    stock_mutations: [
      {
        id: 'mut-sample-01',
        store_id: storeId,
        product_id: 'prod-001',
        mutation_type: 'sale',
        qty_delta: -10,
        remaining_stock: 450,
        reference_id: 'trx-sample-01',
        notes: 'Penjualan TRX-20261029-001 (1 renteng = 10 pcs)',
        user_id: 'usr-kasir-01',
        user_name: 'Siti Kasir Berkah',
        created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
      },
      {
        id: 'mut-sample-02',
        store_id: storeId,
        product_id: 'prod-003',
        mutation_type: 'sale',
        qty_delta: -1,
        remaining_stock: 85,
        reference_id: 'trx-sample-01',
        notes: 'Penjualan TRX-20261029-001 (1 pcs)',
        user_id: 'usr-kasir-01',
        user_name: 'Siti Kasir Berkah',
        created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
      },
    ],
    customers: [
      {
        id: 'cust-001',
        store_id: storeId,
        name: 'Pak H. Sulaiman (Langganan)',
        phone: '081298765432',
        email: 'sulaiman@gmail.com',
        address: 'Jl. Merak No. 12',
        total_debt: 0,
        debt_limit: 1000000,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'cust-002',
        store_id: storeId,
        name: 'Warung Bu Rini',
        phone: '085712348899',
        email: '',
        address: 'Gang Kelapa 2',
        total_debt: 125000,
        debt_limit: 500000,
        created_at: now,
        updated_at: now,
      },
    ],
    suppliers: [
      {
        id: 'sup-001',
        store_id: storeId,
        name: 'Distributor Sembako Nusantara PT',
        phone: '02155667788',
        contact_person: 'Pak Hendra',
        address: 'Kawasan Industri Pulo Gadung, Jakarta',
        created_at: now,
        updated_at: now,
      },
      {
        id: 'sup-002',
        store_id: storeId,
        name: 'CV Berkah Grosir Snack & Minuman',
        phone: '081399887766',
        contact_person: 'Bu Maya',
        address: 'Pasar Induk Kramat Jati',
        created_at: now,
        updated_at: now,
      },
    ],
    sync_logs: [
      {
        id: 'sync-001',
        store_id: storeId,
        device_id: 'POS-TERMINAL-01',
        transactions_synced: 1,
        conflicts_resolved: 0,
        status: 'SUCCESS',
        created_at: now,
      },
    ],
    system_config: {
      initialized: true,
      version: '1.0.0',
      last_sync: now,
    },
  };
}

// Database Helper
let dbCache: DatabaseSchema | null = null;

function loadDatabase(): DatabaseSchema {
  if (dbCache) return dbCache;

  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      dbCache = JSON.parse(content);
      return dbCache!;
    } catch (e) {
      console.error('Error reading DB_FILE, reinitializing...', e);
    }
  }

  const initial = getInitialData();
  saveDatabase(initial);
  dbCache = initial;
  return dbCache;
}

function saveDatabase(data: DatabaseSchema): void {
  dbCache = data;
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write database file', err);
  }
}

// Ensure database is initialized
loadDatabase();

// ----------------- API ROUTES -----------------

// 1. Health check
app.get('/api/health', (req, res) => {
  const db = loadDatabase();
  res.json({
    status: 'ok',
    store: db.stores[0]?.name || 'HILALPOS',
    initialized: db.system_config.initialized,
    version: db.system_config.version,
    timestamp: new Date().toISOString(),
  });
});

// 2. Setup status and setup wizard
app.get('/api/auth/setup-status', (req, res) => {
  const db = loadDatabase();
  res.json({
    isSetup: db.system_config.initialized && db.users.length > 0,
    store: db.stores[0] || null,
  });
});

app.post('/api/auth/setup', (req, res) => {
  const db = loadDatabase();
  const { storeName, address, phone, adminUsername, adminPassword, adminName, receiptPaper } = req.body;

  if (!adminUsername || !adminPassword) {
    return res.status(400).json({ error: 'Username dan password admin wajib diisi' });
  }

  const now = new Date().toISOString();
  const storeId = db.stores[0]?.id || `store-${Date.now()}`;

  db.stores[0] = {
    ...(db.stores[0] || {}),
    id: storeId,
    name: storeName || 'HILALPOS Toko Berkah',
    tagline: 'SATU SISTEM, SEMUA USAHA',
    address: address || 'Jl. Utama Pasar Kasir No. 1',
    phone: phone || '081234567890',
    receipt_paper: receiptPaper || '58mm',
    updated_at: now,
  };

  const adminIndex = db.users.findIndex((u) => u.username === adminUsername || u.role === 'superadmin');
  const newAdmin = {
    id: adminIndex >= 0 ? db.users[adminIndex].id : `usr-${Date.now()}`,
    store_id: storeId,
    username: adminUsername,
    password_hash: adminPassword,
    name: adminName || 'Administrator',
    role: 'superadmin',
    is_active: true,
    created_at: adminIndex >= 0 ? db.users[adminIndex].created_at : now,
    updated_at: now,
  };

  if (adminIndex >= 0) {
    db.users[adminIndex] = newAdmin;
  } else {
    db.users.push(newAdmin);
  }

  db.system_config.initialized = true;
  saveDatabase(db);

  res.json({
    success: true,
    message: 'Setup awal berhasil disimpan',
    user: { id: newAdmin.id, username: newAdmin.username, name: newAdmin.name, role: newAdmin.role },
    store: db.stores[0],
  });
});

// 3. Auth login
app.post('/api/auth/login', (req, res) => {
  const db = loadDatabase();
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username dan password wajib diisi' });
  }

  const user = db.users.find(
    (u) => (u.username.toLowerCase() === username.toLowerCase().trim()) && u.password_hash === password
  );

  if (!user) {
    return res.status(401).json({ error: 'Username atau password tidak sesuai' });
  }

  if (!user.is_active) {
    return res.status(403).json({ error: 'Akun ini telah dinonaktifkan oleh administrator' });
  }

  // Create lightweight session token
  const token = crypto.randomBytes(24).toString('hex');
  const safeUser = {
    id: user.id,
    store_id: user.store_id,
    username: user.username,
    name: user.name,
    role: user.role,
    token,
  };

  res.json({
    success: true,
    user: safeUser,
    store: db.stores[0],
  });
});

// 4. Products CRUD & Stock
app.get('/api/products', (req, res) => {
  const db = loadDatabase();
  const { search, category, activeOnly } = req.query;

  let results = [...db.products];

  if (activeOnly === 'true') {
    results = results.filter((p) => p.is_active);
  }

  if (category) {
    results = results.filter((p) => p.category_id === category);
  }

  if (search) {
    const q = (search as string).toLowerCase().trim();
    results = results.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.brand_variant && p.brand_variant.toLowerCase().includes(q))
    );
  }

  res.json(results);
});

app.post('/api/products', (req, res) => {
  const db = loadDatabase();
  const data = req.body;

  if (!data.name || !data.sku) {
    return res.status(400).json({ error: 'Nama barang dan SKU wajib diisi' });
  }

  // Check unique barcode & sku
  const existsSku = db.products.some((p) => p.sku.toLowerCase() === data.sku.toLowerCase());
  if (existsSku) {
    return res.status(400).json({ error: `SKU '${data.sku}' sudah digunakan oleh produk lain` });
  }

  if (data.barcode) {
    const existsBarcode = db.products.some((p) => p.barcode && p.barcode === data.barcode);
    if (existsBarcode) {
      return res.status(400).json({ error: `Barcode '${data.barcode}' sudah terdaftar pada produk lain` });
    }
  }

  const now = new Date().toISOString();
  const newProduct = {
    id: data.id || `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    store_id: db.stores[0]?.id || 'store-hilal-01',
    sku: data.sku.trim(),
    barcode: (data.barcode || '').trim(),
    name: data.name.trim(),
    category_id: data.category_id || 'cat-sembako',
    brand_variant: data.brand_variant || '',
    description: data.description || '',
    cost_price: Number(data.cost_price) || 0,
    sell_price: Number(data.sell_price) || 0,
    base_unit: data.base_unit || 'pcs',
    current_stock: Number(data.current_stock) || 0,
    min_stock: Number(data.min_stock) || 5,
    supplier_id: data.supplier_id || '',
    is_active: data.is_active !== undefined ? Boolean(data.is_active) : true,
    unit_conversions: Array.isArray(data.unit_conversions) ? data.unit_conversions : [],
    created_at: now,
    updated_at: now,
    updated_by: data.updated_by || 'admin',
  };

  db.products.unshift(newProduct);

  // If initial stock > 0, log mutation
  if (newProduct.current_stock > 0) {
    db.stock_mutations.unshift({
      id: `mut-${Date.now()}`,
      store_id: newProduct.store_id,
      product_id: newProduct.id,
      mutation_type: 'in',
      qty_delta: newProduct.current_stock,
      remaining_stock: newProduct.current_stock,
      reference_id: 'INIT-STOCK',
      notes: 'Stok awal barang baru',
      user_id: data.updated_by || 'admin',
      user_name: data.user_name || 'Admin',
      created_at: now,
    });
  }

  saveDatabase(db);
  res.status(201).json(newProduct);
});

app.put('/api/products/:id', (req, res) => {
  const db = loadDatabase();
  const { id } = req.params;
  const data = req.body;

  const index = db.products.findIndex((p) => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Produk tidak ditemukan' });
  }

  const existing = db.products[index];

  // Unique barcode check if changing
  if (data.barcode && data.barcode !== existing.barcode) {
    const dup = db.products.some((p) => p.id !== id && p.barcode === data.barcode);
    if (dup) {
      return res.status(400).json({ error: `Barcode '${data.barcode}' sudah dipakai barang lain` });
    }
  }

  const now = new Date().toISOString();
  const oldStock = existing.current_stock;
  const newStock = data.current_stock !== undefined ? Number(data.current_stock) : oldStock;

  const updatedProduct = {
    ...existing,
    ...data,
    sku: data.sku !== undefined ? data.sku.trim() : existing.sku,
    barcode: data.barcode !== undefined ? (data.barcode || '').trim() : existing.barcode,
    name: data.name !== undefined ? data.name.trim() : existing.name,
    cost_price: data.cost_price !== undefined ? Number(data.cost_price) : existing.cost_price,
    sell_price: data.sell_price !== undefined ? Number(data.sell_price) : existing.sell_price,
    current_stock: newStock,
    min_stock: data.min_stock !== undefined ? Number(data.min_stock) : existing.min_stock,
    unit_conversions: data.unit_conversions !== undefined ? data.unit_conversions : existing.unit_conversions,
    updated_at: now,
  };

  db.products[index] = updatedProduct;

  // If stock was adjusted directly in edit modal, log adjustment
  if (newStock !== oldStock) {
    const diff = newStock - oldStock;
    db.stock_mutations.unshift({
      id: `mut-${Date.now()}`,
      store_id: updatedProduct.store_id,
      product_id: updatedProduct.id,
      mutation_type: 'adjustment',
      qty_delta: diff,
      remaining_stock: newStock,
      reference_id: 'MANUAL-EDIT',
      notes: data.adjustment_reason || 'Penyesuaian stok manual master barang',
      user_id: data.updated_by || 'admin',
      user_name: data.user_name || 'Admin',
      created_at: now,
    });
  }

  saveDatabase(db);
  res.json(updatedProduct);
});

app.delete('/api/products/:id', (req, res) => {
  const db = loadDatabase();
  const { id } = req.params;

  const index = db.products.findIndex((p) => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Produk tidak ditemukan' });
  }

  // Soft delete / deactivate to protect past transaction snapshots
  const prod = db.products[index];
  prod.is_active = false;
  prod.updated_at = new Date().toISOString();

  saveDatabase(db);
  res.json({ success: true, message: `Produk '${prod.name}' dinonaktifkan` });
});

// 5. Categories, Units, Customers, Suppliers
app.get('/api/categories', (req, res) => {
  res.json(loadDatabase().categories);
});

app.post('/api/categories', (req, res) => {
  const db = loadDatabase();
  const { name, icon } = req.body;
  if (!name) return res.status(400).json({ error: 'Nama kategori wajib diisi' });

  const now = new Date().toISOString();
  const item = {
    id: `cat-${Date.now()}`,
    store_id: db.stores[0]?.id || 'store-hilal-01',
    name: name.trim(),
    icon: icon || 'Tag',
    created_at: now,
    updated_at: now,
  };
  db.categories.push(item);
  saveDatabase(db);
  res.status(201).json(item);
});

app.get('/api/units', (req, res) => {
  res.json(loadDatabase().units);
});

app.post('/api/units', (req, res) => {
  const db = loadDatabase();
  const { name, symbol, is_base } = req.body;
  if (!name || !symbol) return res.status(400).json({ error: 'Nama dan simbol satuan wajib diisi' });

  const now = new Date().toISOString();
  const item = {
    id: `u-${Date.now()}`,
    store_id: db.stores[0]?.id || 'store-hilal-01',
    name: name.trim(),
    symbol: symbol.trim(),
    is_base: Boolean(is_base),
    created_at: now,
    updated_at: now,
  };
  db.units.push(item);
  saveDatabase(db);
  res.status(201).json(item);
});

app.get('/api/customers', (req, res) => {
  res.json(loadDatabase().customers);
});

app.post('/api/customers', (req, res) => {
  const db = loadDatabase();
  const { name, phone, email, address, debt_limit } = req.body;
  if (!name) return res.status(400).json({ error: 'Nama pelanggan wajib diisi' });

  const now = new Date().toISOString();
  const item = {
    id: `cust-${Date.now()}`,
    store_id: db.stores[0]?.id || 'store-hilal-01',
    name: name.trim(),
    phone: (phone || '').trim(),
    email: (email || '').trim(),
    address: (address || '').trim(),
    total_debt: 0,
    debt_limit: Number(debt_limit) || 1000000,
    created_at: now,
    updated_at: now,
  };
  db.customers.push(item);
  saveDatabase(db);
  res.status(201).json(item);
});

app.get('/api/suppliers', (req, res) => {
  res.json(loadDatabase().suppliers);
});

app.post('/api/suppliers', (req, res) => {
  const db = loadDatabase();
  const { name, phone, contact_person, address } = req.body;
  if (!name) return res.status(400).json({ error: 'Nama pemasok wajib diisi' });

  const now = new Date().toISOString();
  const item = {
    id: `sup-${Date.now()}`,
    store_id: db.stores[0]?.id || 'store-hilal-01',
    name: name.trim(),
    phone: (phone || '').trim(),
    contact_person: (contact_person || '').trim(),
    address: (address || '').trim(),
    created_at: now,
    updated_at: now,
  };
  db.suppliers.push(item);
  saveDatabase(db);
  res.status(201).json(item);
});

// 6. POS Checkout with Idempotency Key & Unit Conversion
app.post('/api/transactions', (req, res) => {
  const db = loadDatabase();
  const {
    idempotency_key,
    items,
    customer_id,
    customer_name,
    cashier_id,
    cashier_name,
    subtotal,
    discount,
    tax,
    total,
    payment_method,
    total_paid,
    change_amount,
    remaining_debt,
    due_date,
    notes,
    offline_created,
    client_created_at,
  } = req.body;

  // 1. Check idempotency: If already recorded with same key, return existing without re-processing!
  if (idempotency_key) {
    const existingTrx = db.transactions.find((t) => t.idempotency_key === idempotency_key);
    if (existingTrx) {
      const existingItems = db.transaction_items.filter((i) => i.transaction_id === existingTrx.id);
      return res.json({
        success: true,
        transaction: existingTrx,
        items: existingItems,
        is_idempotent_duplicate: true,
      });
    }
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Keranjang belanja tidak boleh kosong' });
  }

  const now = new Date().toISOString();
  const trxDate = client_created_at || now;

  // Generate unique invoice number: TRX-YYYYMMDD-XXX
  const d = new Date(trxDate);
  const dateStr = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const countToday = db.transactions.filter((t) => t.created_at.startsWith(trxDate.substring(0, 10))).length + 1;
  const invoiceNumber = req.body.invoice_number || `TRX-${dateStr}-${String(countToday).padStart(3, '0')}`;

  const trxId = req.body.id || `trx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const storeId = db.stores[0]?.id || 'store-hilal-01';

  // Determine payment status
  let paymentStatus = 'Lunas';
  const debt = Number(remaining_debt) || 0;
  if (debt > 0 || payment_method === 'Tempo' || payment_method === 'Kredit') {
    paymentStatus = Number(total_paid) > 0 ? 'Sebagian' : 'Belum Lunas';
  }

  const newTransaction = {
    id: trxId,
    store_id: storeId,
    invoice_number: invoiceNumber,
    cashier_id: cashier_id || 'usr-kasir-01',
    cashier_name: cashier_name || 'Kasir',
    customer_id: customer_id || null,
    customer_name: customer_name || 'Umum (Pelanggan Walk-In)',
    subtotal: Number(subtotal) || 0,
    discount: Number(discount) || 0,
    tax: Number(tax) || 0,
    total: Number(total) || 0,
    payment_method: payment_method || 'Tunai',
    payment_status: paymentStatus,
    total_paid: Number(total_paid) || 0,
    change_amount: Number(change_amount) || 0,
    remaining_debt: debt,
    due_date: due_date || null,
    notes: notes || '',
    offline_created: Boolean(offline_created),
    idempotency_key: idempotency_key || `idem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    synced_at: now,
    created_at: trxDate,
    updated_at: now,
  };

  const savedItems: any[] = [];

  // Deduct stock and save snapshots
  for (const item of items) {
    const product = db.products.find((p) => p.id === item.product_id);
    const factor = Number(item.factor) || 1;
    const qty = Number(item.qty) || 1;
    const baseQty = qty * factor;

    const trxItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      transaction_id: trxId,
      product_id: item.product_id,
      sku_snapshot: item.sku_snapshot || product?.sku || 'SKU-UNKNOWN',
      name_snapshot: item.name_snapshot || product?.name || 'Produk',
      unit: item.unit || 'pcs',
      factor,
      qty,
      base_qty: baseQty,
      cost_price_snapshot: item.cost_price_snapshot !== undefined ? Number(item.cost_price_snapshot) : (product ? product.cost_price * factor : 0),
      sell_price_snapshot: Number(item.sell_price_snapshot) || Number(item.price) || 0,
      discount: Number(item.discount) || 0,
      subtotal: Number(item.subtotal) || (Number(item.sell_price_snapshot || item.price) * qty - (Number(item.discount) || 0)),
    };

    savedItems.push(trxItem);
    db.transaction_items.push(trxItem);

    // Update product stock on server
    if (product) {
      product.current_stock -= baseQty;
      product.updated_at = now;

      // Add stock mutation record
      db.stock_mutations.unshift({
        id: `mut-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        store_id: storeId,
        product_id: product.id,
        mutation_type: 'sale',
        qty_delta: -baseQty,
        remaining_stock: product.current_stock,
        reference_id: invoiceNumber,
        notes: `Penjualan ${invoiceNumber} (${qty} ${item.unit || 'pcs'})`,
        user_id: newTransaction.cashier_id,
        user_name: newTransaction.cashier_name,
        created_at: now,
      });
    }
  }

  // If customer has credit/debt, update customer debt balance
  if (customer_id && debt > 0) {
    const cust = db.customers.find((c) => c.id === customer_id);
    if (cust) {
      cust.total_debt = (cust.total_debt || 0) + debt;
      cust.updated_at = now;
    }
  }

  db.transactions.unshift(newTransaction);
  saveDatabase(db);

  res.status(201).json({
    success: true,
    transaction: newTransaction,
    items: savedItems,
  });
});

// 7. Get transactions & details
app.get('/api/transactions', (req, res) => {
  const db = loadDatabase();
  const { dateFrom, dateTo, cashierId, paymentMethod, status, search } = req.query;

  let list = [...db.transactions];

  if (dateFrom) {
    list = list.filter((t) => t.created_at >= (dateFrom as string));
  }
  if (dateTo) {
    list = list.filter((t) => t.created_at <= (dateTo as string) + 'T23:59:59.999Z');
  }
  if (cashierId) {
    list = list.filter((t) => t.cashier_id === cashierId);
  }
  if (paymentMethod) {
    list = list.filter((t) => t.payment_method.toLowerCase() === (paymentMethod as string).toLowerCase());
  }
  if (status) {
    list = list.filter((t) => t.payment_status.toLowerCase() === (status as string).toLowerCase());
  }
  if (search) {
    const q = (search as string).toLowerCase().trim();
    list = list.filter(
      (t) =>
        t.invoice_number.toLowerCase().includes(q) ||
        (t.customer_name && t.customer_name.toLowerCase().includes(q)) ||
        t.cashier_name.toLowerCase().includes(q)
    );
  }

  // Include line items count & brief summary
  const enriched = list.map((t) => {
    const items = db.transaction_items.filter((i) => i.transaction_id === t.id);
    return {
      ...t,
      items_count: items.reduce((sum, i) => sum + i.qty, 0),
      items_detail: items,
    };
  });

  res.json(enriched);
});

app.get('/api/transactions/:id', (req, res) => {
  const db = loadDatabase();
  const { id } = req.params;

  const trx = db.transactions.find((t) => t.id === id || t.invoice_number === id);
  if (!trx) return res.status(404).json({ error: 'Transaksi tidak ditemukan' });

  const items = db.transaction_items.filter((i) => i.transaction_id === trx.id);
  res.json({ transaction: trx, items });
});

// 8. Return / Void / Debt Repayment
app.post('/api/transactions/:id/return', (req, res) => {
  const db = loadDatabase();
  const { id } = req.params;
  const { items_to_return, reason, user_name, user_id } = req.body;

  const trx = db.transactions.find((t) => t.id === id);
  if (!trx) return res.status(404).json({ error: 'Transaksi tidak ditemukan' });

  const now = new Date().toISOString();
  let refundTotal = 0;

  if (Array.isArray(items_to_return)) {
    for (const ret of items_to_return) {
      const trxItem = db.transaction_items.find((i) => i.id === ret.item_id);
      if (trxItem) {
        const retQty = Number(ret.qty) || 1;
        const retBaseQty = retQty * (trxItem.factor || 1);
        const itemRefund = (trxItem.sell_price_snapshot || 0) * retQty;
        refundTotal += itemRefund;

        // Restore stock
        const prod = db.products.find((p) => p.id === trxItem.product_id);
        if (prod) {
          prod.current_stock += retBaseQty;
          prod.updated_at = now;

          db.stock_mutations.unshift({
            id: `mut-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            store_id: trx.store_id,
            product_id: prod.id,
            mutation_type: 'return',
            qty_delta: retBaseQty,
            remaining_stock: prod.current_stock,
            reference_id: `RET-${trx.invoice_number}`,
            notes: `Retur ${retQty} ${trxItem.unit}: ${reason || 'Barang ditukar/dikembalikan'}`,
            user_id: user_id || 'supervisor',
            user_name: user_name || 'Supervisor',
            created_at: now,
          });
        }
      }
    }
  }

  trx.notes = `${trx.notes ? trx.notes + ' | ' : ''}Retur Rp${refundTotal} (${reason || 'Pengembalian barang'}) oleh ${user_name || 'Kasir'}`;
  trx.updated_at = now;

  saveDatabase(db);
  res.json({ success: true, message: `Retur senilai Rp${refundTotal.toLocaleString('id-ID')} berhasil diproses`, trx });
});

// Pay outstanding debt (Cicilan / Pelunasan Piutang)
app.post('/api/transactions/:id/pay-debt', (req, res) => {
  const db = loadDatabase();
  const { id } = req.params;
  const { amount_paid, payment_method, cashier_name } = req.body;

  const trx = db.transactions.find((t) => t.id === id);
  if (!trx) return res.status(404).json({ error: 'Transaksi tidak ditemukan' });

  const payAmount = Number(amount_paid) || 0;
  if (payAmount <= 0) return res.status(400).json({ error: 'Nominal pembayaran tidak valid' });

  const now = new Date().toISOString();
  trx.total_paid = (trx.total_paid || 0) + payAmount;
  trx.remaining_debt = Math.max(0, (trx.remaining_debt || 0) - payAmount);
  trx.payment_status = trx.remaining_debt === 0 ? 'Lunas' : 'Sebagian';
  trx.notes = `${trx.notes ? trx.notes + ' | ' : ''}Bayar tempo Rp${payAmount.toLocaleString('id-ID')} via ${payment_method || 'Tunai'} (${now.substring(0, 10)})`;
  trx.updated_at = now;

  // Deduct customer balance
  if (trx.customer_id) {
    const cust = db.customers.find((c) => c.id === trx.customer_id);
    if (cust) {
      cust.total_debt = Math.max(0, (cust.total_debt || 0) - payAmount);
      cust.updated_at = now;
    }
  }

  saveDatabase(db);
  res.json({ success: true, transaction: trx });
});

// 9. Stock In & Adjustments
app.post('/api/inventory/stock-in', (req, res) => {
  const db = loadDatabase();
  const { product_id, qty, cost_price, supplier_id, invoice_ref, notes, user_id, user_name } = req.body;

  const product = db.products.find((p) => p.id === product_id);
  if (!product) return res.status(404).json({ error: 'Produk tidak ditemukan' });

  const inQty = Number(qty) || 0;
  if (inQty <= 0) return res.status(400).json({ error: 'Jumlah barang masuk harus lebih dari 0' });

  const now = new Date().toISOString();
  product.current_stock += inQty;
  if (cost_price) {
    product.cost_price = Number(cost_price);
  }
  product.updated_at = now;

  const mut = {
    id: `mut-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    store_id: product.store_id,
    product_id: product.id,
    mutation_type: 'purchase',
    qty_delta: inQty,
    remaining_stock: product.current_stock,
    reference_id: invoice_ref || `IN-${Date.now().toString().slice(-6)}`,
    notes: notes || `Barang Masuk (${inQty} ${product.base_unit})`,
    user_id: user_id || 'admin',
    user_name: user_name || 'Admin',
    created_at: now,
  };

  db.stock_mutations.unshift(mut);
  saveDatabase(db);

  res.status(201).json({ success: true, product, mutation: mut });
});

app.post('/api/inventory/adjustment', (req, res) => {
  const db = loadDatabase();
  const { product_id, actual_stock, reason, user_id, user_name } = req.body;

  const product = db.products.find((p) => p.id === product_id);
  if (!product) return res.status(404).json({ error: 'Produk tidak ditemukan' });

  const targetStock = Number(actual_stock);
  const diff = targetStock - product.current_stock;
  const now = new Date().toISOString();

  product.current_stock = targetStock;
  product.updated_at = now;

  const mut = {
    id: `mut-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    store_id: product.store_id,
    product_id: product.id,
    mutation_type: 'adjustment',
    qty_delta: diff,
    remaining_stock: targetStock,
    reference_id: 'OPNAME',
    notes: reason || 'Stok Opname / Penyesuaian Fisik',
    user_id: user_id || 'admin',
    user_name: user_name || 'Admin',
    created_at: now,
  };

  db.stock_mutations.unshift(mut);
  saveDatabase(db);

  res.status(201).json({ success: true, product, mutation: mut });
});

app.get('/api/inventory/mutations', (req, res) => {
  const db = loadDatabase();
  const { productId, limit } = req.query;

  let list = [...db.stock_mutations];
  if (productId) {
    list = list.filter((m) => m.product_id === productId);
  }

  const enriched = list.slice(0, Number(limit) || 100).map((m) => {
    const prod = db.products.find((p) => p.id === m.product_id);
    return {
      ...m,
      product_name: prod ? prod.name : 'Unknown Product',
      product_sku: prod ? prod.sku : '',
    };
  });

  res.json(enriched);
});

// 10. Two-Way Sync Engine (Pull & Push)
// Pull: Client downloads updated master data
app.get('/api/sync/pull', (req, res) => {
  const db = loadDatabase();
  const { since } = req.query;

  let products = db.products;
  let categories = db.categories;
  let units = db.units;
  let customers = db.customers;

  if (since) {
    const sinceDate = new Date(since as string);
    products = products.filter((p) => new Date(p.updated_at) > sinceDate);
  }

  res.json({
    timestamp: new Date().toISOString(),
    store: db.stores[0],
    products,
    categories,
    units,
    customers,
  });
});

// Push: Client pushes pending offline transactions
app.post('/api/sync/push', (req, res) => {
  const db = loadDatabase();
  const { device_id, transactions } = req.body;

  if (!Array.isArray(transactions) || transactions.length === 0) {
    return res.json({ success: true, synced_count: 0, conflicts: [] });
  }

  const now = new Date().toISOString();
  const conflicts: any[] = [];
  let syncedCount = 0;

  for (const trx of transactions) {
    // Check idempotency key
    const existing = db.transactions.find((t) => t.idempotency_key === trx.idempotency_key);
    if (existing) {
      // Already recorded!
      syncedCount++;
      continue;
    }

    // Process items and check for stock conflicts
    const storeId = db.stores[0]?.id || 'store-hilal-01';
    const items = trx.items || [];

    for (const item of items) {
      const prod = db.products.find((p) => p.id === item.product_id);
      const factor = Number(item.factor) || 1;
      const baseQty = (Number(item.qty) || 1) * factor;

      if (prod) {
        // Stock conflict check: Did stock drop below 0 while both devices were offline?
        if (prod.current_stock < baseQty) {
          conflicts.push({
            transaction_invoice: trx.invoice_number,
            product_id: prod.id,
            product_name: prod.name,
            requested_base_qty: baseQty,
            available_stock: prod.current_stock,
            message: `Stok offline ${prod.name} melebihi ketersediaan server saat sinkronisasi (sisa server: ${prod.current_stock}). Transaksi tetap dicatat, stok disesuaikan.`,
          });
        }

        prod.current_stock -= baseQty;
        prod.updated_at = now;

        db.stock_mutations.unshift({
          id: `mut-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          store_id: storeId,
          product_id: prod.id,
          mutation_type: 'sale',
          qty_delta: -baseQty,
          remaining_stock: prod.current_stock,
          reference_id: trx.invoice_number,
          notes: `Sinkronisasi Offline ${trx.invoice_number} (${item.qty} ${item.unit || 'pcs'})`,
          user_id: trx.cashier_id,
          user_name: trx.cashier_name,
          created_at: trx.created_at || now,
        });
      }

      // Record transaction item
      db.transaction_items.push({
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        transaction_id: trx.id,
        product_id: item.product_id,
        sku_snapshot: item.sku_snapshot || prod?.sku || 'SKU',
        name_snapshot: item.name_snapshot || prod?.name || 'Item',
        unit: item.unit || 'pcs',
        factor,
        qty: Number(item.qty) || 1,
        base_qty: baseQty,
        cost_price_snapshot: Number(item.cost_price_snapshot) || 0,
        sell_price_snapshot: Number(item.sell_price_snapshot) || 0,
        discount: Number(item.discount) || 0,
        subtotal: Number(item.subtotal) || 0,
      });
    }

    // Add transaction to server
    const serverTrx = {
      ...trx,
      synced_at: now,
      offline_created: true,
      updated_at: now,
    };
    delete serverTrx.items;

    db.transactions.unshift(serverTrx);
    syncedCount++;
  }

  // Log sync event
  db.sync_logs.unshift({
    id: `sync-${Date.now()}`,
    store_id: db.stores[0]?.id || 'store-hilal-01',
    device_id: device_id || 'UNKNOWN-DEVICE',
    transactions_synced: syncedCount,
    conflicts_resolved: conflicts.length,
    status: conflicts.length > 0 ? 'WARNING_CONFLICTS' : 'SUCCESS',
    created_at: now,
  });

  saveDatabase(db);

  res.json({
    success: true,
    synced_count: syncedCount,
    conflicts,
    timestamp: now,
  });
});

// 11. Reports & Dashboard
app.get('/api/reports/dashboard', (req, res) => {
  const db = loadDatabase();
  const todayStr = new Date().toISOString().substring(0, 10);

  const todayTrx = db.transactions.filter((t) => t.created_at.startsWith(todayStr));
  const todayRevenue = todayTrx.reduce((sum, t) => sum + (t.total || 0), 0);
  const todayCashReceived = todayTrx.reduce((sum, t) => sum + (t.total_paid || 0), 0);

  // Profit calculation (Laba Kotor = Total Jual - Total Modal)
  let todayCostOfGoods = 0;
  for (const t of todayTrx) {
    const items = db.transaction_items.filter((i) => i.transaction_id === t.id);
    for (const item of items) {
      todayCostOfGoods += (item.cost_price_snapshot || 0) * (item.qty || 1);
    }
  }
  const todayGrossProfit = Math.max(0, todayRevenue - todayCostOfGoods);

  // Payment methods breakdown
  const paymentMethods: Record<string, { count: number; total: number }> = {};
  for (const t of todayTrx) {
    const method = t.payment_method || 'Tunai';
    if (!paymentMethods[method]) paymentMethods[method] = { count: 0, total: 0 };
    paymentMethods[method].count += 1;
    paymentMethods[method].total += t.total || 0;
  }

  // Top selling products
  const productSalesMap: Record<string, { name: string; sku: string; qty: number; revenue: number }> = {};
  for (const t of db.transactions) {
    const items = db.transaction_items.filter((i) => i.transaction_id === t.id);
    for (const item of items) {
      if (!productSalesMap[item.product_id]) {
        productSalesMap[item.product_id] = {
          name: item.name_snapshot,
          sku: item.sku_snapshot,
          qty: 0,
          revenue: 0,
        };
      }
      productSalesMap[item.product_id].qty += item.qty;
      productSalesMap[item.product_id].revenue += item.subtotal;
    }
  }
  const topProducts = Object.values(productSalesMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  // Low stock products
  const lowStockProducts = db.products
    .filter((p) => p.is_active && p.current_stock <= p.min_stock)
    .map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      current_stock: p.current_stock,
      min_stock: p.min_stock,
      base_unit: p.base_unit,
    }));

  // Total outstanding debt (Piutang)
  const totalDebt = db.customers.reduce((sum, c) => sum + (c.total_debt || 0), 0);

  // Weekly sales trend (last 7 days)
  const weeklyTrends = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateKey = d.toISOString().substring(0, 10);
    const dayTrx = db.transactions.filter((t) => t.created_at.startsWith(dateKey));
    const dayTotal = dayTrx.reduce((sum, t) => sum + (t.total || 0), 0);
    const dayProfit = dayTrx.reduce((sum, t) => {
      const items = db.transaction_items.filter((it) => it.transaction_id === t.id);
      const cost = items.reduce((c, it) => c + (it.cost_price_snapshot || 0) * (it.qty || 1), 0);
      return sum + (t.total - cost);
    }, 0);

    const dayName = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'][d.getDay()];
    weeklyTrends.push({
      date: dateKey,
      label: `${dayName} (${dateKey.slice(8, 10)})`,
      revenue: dayTotal,
      profit: Math.max(0, dayProfit),
      transactions: dayTrx.length,
    });
  }

  res.json({
    today: {
      revenue: todayRevenue,
      transactions_count: todayTrx.length,
      cash_received: todayCashReceived,
      gross_profit: todayGrossProfit,
    },
    total_debt: totalDebt,
    payment_methods: paymentMethods,
    top_products: topProducts,
    low_stock_products: lowStockProducts,
    weekly_trends: weeklyTrends,
    total_active_products: db.products.filter((p) => p.is_active).length,
    total_customers: db.customers.length,
  });
});

// 12. Settings & WhatsApp API
app.get('/api/settings', (req, res) => {
  const db = loadDatabase();
  res.json(db.stores[0] || {});
});

app.put('/api/settings', (req, res) => {
  const db = loadDatabase();
  const data = req.body;
  const now = new Date().toISOString();

  db.stores[0] = {
    ...db.stores[0],
    ...data,
    updated_at: now,
  };

  saveDatabase(db);
  res.json({ success: true, store: db.stores[0] });
});

// WhatsApp receipt dispatch helper
app.post('/api/whatsapp/send', (req, res) => {
  const db = loadDatabase();
  const { phone, invoice_number, customer_name, total, message_custom } = req.body;

  if (!phone) {
    return res.status(400).json({ error: 'Nomor WhatsApp pelanggan wajib diisi' });
  }

  // Normalize Indonesian phone numbers: e.g. 0812... -> 62812...
  let cleanPhone = phone.replace(/[^0-9]/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '62' + cleanPhone.slice(1);
  } else if (!cleanPhone.startsWith('62')) {
    cleanPhone = '62' + cleanPhone;
  }

  const store = db.stores[0] || {};
  const defaultText = `*STRUK DIGITAL HILALPOS*\n` +
    `🏪 *${store.name || 'HILALPOS Toko Berkah'}*\n` +
    `📍 ${store.address || ''}\n` +
    `--------------------------------\n` +
    `No. Transaksi : ${invoice_number}\n` +
    `Pelanggan     : ${customer_name || 'Pelanggan'}\n` +
    `Total Belanja : Rp${Number(total || 0).toLocaleString('id-ID')}\n` +
    `Status        : LUNAS\n` +
    `--------------------------------\n` +
    `Terima kasih telah berbelanja! Semoga berkah dan sehat selalu. 🙏✨\n` +
    `_Satu Sistem, Semua Usaha_`;

  const finalMessage = message_custom || defaultText;
  const encodedText = encodeURIComponent(finalMessage);
  const clickToChatUrl = `https://wa.me/${cleanPhone}?text=${encodedText}`;

  res.json({
    success: true,
    recipient_phone: cleanPhone,
    message: finalMessage,
    click_to_chat_url: clickToChatUrl,
    status: 'READY_TO_SEND',
  });
});

// 13. Backup & Restore Data
app.get('/api/backup', (req, res) => {
  const db = loadDatabase();
  const backupData = {
    timestamp: new Date().toISOString(),
    version: db.system_config.version,
    data: db,
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=HILALPOS_Backup_${new Date().toISOString().substring(0, 10)}.json`);
  res.json(backupData);
});

app.post('/api/restore', (req, res) => {
  const { data } = req.body;
  if (!data || !data.products || !data.stores) {
    return res.status(400).json({ error: 'Format data backup tidak valid' });
  }

  saveDatabase(data);
  res.json({ success: true, message: 'Database berhasil dipulihkan dari cadangan' });
});

// 14. Users Management
app.get('/api/users', (req, res) => {
  const db = loadDatabase();
  const safeUsers = db.users.map(({ password_hash, ...u }) => u);
  res.json(safeUsers);
});

app.post('/api/users', (req, res) => {
  const db = loadDatabase();
  const { username, password, name, role } = req.body;

  if (!username || !password || !name) {
    return res.status(400).json({ error: 'Username, password, dan nama wajib diisi' });
  }

  const dup = db.users.some((u) => u.username.toLowerCase() === username.toLowerCase().trim());
  if (dup) return res.status(400).json({ error: 'Username sudah digunakan' });

  const now = new Date().toISOString();
  const newUser = {
    id: `usr-${Date.now()}`,
    store_id: db.stores[0]?.id || 'store-hilal-01',
    username: username.trim(),
    password_hash: password,
    name: name.trim(),
    role: role || 'kasir',
    is_active: true,
    created_at: now,
    updated_at: now,
  };

  db.users.push(newUser);
  saveDatabase(db);

  const { password_hash, ...safe } = newUser;
  res.status(201).json(safe);
});

// ----------------- VITE INTEGRATION -----------------
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // Mount Vite middleware in development
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[HILALPOS] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
