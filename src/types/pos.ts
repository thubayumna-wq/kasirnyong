export interface UnitConversion {
  unit: string;
  factor: number; // e.g., 10 (1 renteng = 10 pcs), 200 (1 karton = 200 pcs)
  price: number; // custom unit price e.g. Rp18.000
  name?: string;
}

export interface Product {
  id: string;
  store_id: string;
  sku: string;
  barcode: string;
  name: string;
  category_id: string;
  brand_variant: string;
  description: string;
  cost_price: number;
  sell_price: number;
  base_unit: string;
  current_stock: number;
  min_stock: number;
  supplier_id?: string;
  is_active: boolean;
  unit_conversions: UnitConversion[];
  created_at: string;
  updated_at: string;
  updated_by?: string;
}

export interface Category {
  id: string;
  store_id: string;
  name: string;
  icon?: string;
  created_at: string;
  updated_at: string;
}

export interface Unit {
  id: string;
  store_id: string;
  name: string;
  symbol: string;
  is_base: boolean;
}

export interface Customer {
  id: string;
  store_id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  total_debt: number;
  debt_limit: number;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  store_id: string;
  name: string;
  phone: string;
  contact_person: string;
  address: string;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string; // unique item line id
  product_id: string;
  sku: string;
  barcode: string;
  name: string;
  unit: string; // 'pcs', 'renteng', 'karton', etc.
  factor: number; // how many base units
  unit_price: number;
  cost_price: number;
  qty: number;
  discount: number;
  subtotal: number;
  available_stock: number;
}

export interface Transaction {
  id: string;
  store_id: string;
  invoice_number: string;
  cashier_id: string;
  cashier_name: string;
  customer_id?: string | null;
  customer_name: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payment_method: 'Tunai' | 'Debit' | 'Kredit' | 'Transfer' | 'QRIS' | 'Tempo';
  payment_status: 'Lunas' | 'Sebagian' | 'Belum Lunas' | 'Batal';
  total_paid: number;
  change_amount: number;
  remaining_debt: number;
  due_date?: string | null;
  notes?: string;
  offline_created: boolean;
  idempotency_key: string;
  synced_at?: string;
  created_at: string;
  updated_at: string;
  items_count?: number;
  items_detail?: TransactionItem[];
}

export interface TransactionItem {
  id: string;
  transaction_id: string;
  product_id: string;
  sku_snapshot: string;
  name_snapshot: string;
  unit: string;
  factor: number;
  qty: number;
  base_qty: number;
  cost_price_snapshot: number;
  sell_price_snapshot: number;
  discount: number;
  subtotal: number;
}

export interface StockMutation {
  id: string;
  store_id: string;
  product_id: string;
  product_name?: string;
  product_sku?: string;
  mutation_type: 'sale' | 'purchase' | 'in' | 'out' | 'adjustment' | 'return';
  qty_delta: number;
  remaining_stock: number;
  reference_id: string;
  notes: string;
  user_id?: string;
  user_name: string;
  created_at: string;
}

export interface StoreSettings {
  id: string;
  name: string;
  tagline: string;
  address: string;
  phone: string;
  currency: string;
  timezone: string;
  tax_rate: number;
  receipt_paper: '58mm' | '80mm';
  receipt_header: string;
  receipt_footer: string;
  whatsapp_sender?: string;
  whatsapp_template?: string;
  negative_stock_allowed: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface User {
  id: string;
  store_id: string;
  username: string;
  name: string;
  role: 'superadmin' | 'admin' | 'kasir' | 'supervisor';
  token?: string;
}

export type ConnectionState = 'online' | 'offline' | 'syncing' | 'error';

export interface SyncConflict {
  transaction_invoice: string;
  product_id: string;
  product_name: string;
  requested_base_qty: number;
  available_stock: number;
  message: string;
}

export interface ParkedDraft {
  id: string;
  created_at: string;
  customer_name: string;
  items: CartItem[];
  notes?: string;
}
