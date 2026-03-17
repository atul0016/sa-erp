/**
 * SA ERP - Inventory Types
 * Double-Entry Stock Movement Architecture
 */

// ==================== PRODUCTS & ITEMS ====================

export type ItemType = 'goods' | 'service' | 'consumable' | 'asset';
export type ValuationMethod = 'fifo' | 'weighted_average' | 'standard';

export interface Item {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  description?: string;
  item_type: ItemType;
  category_id?: string;
  brand_id?: string;
  uom_id: string;
  secondary_uom_id?: string;
  conversion_factor?: number;
  
  // Inventory settings
  is_stock_item: boolean;
  valuation_method: ValuationMethod;
  standard_cost?: number;
  min_stock_level?: number;
  max_stock_level?: number;
  reorder_level?: number;
  reorder_qty?: number;
  lead_time_days?: number;
  
  // Tracking
  has_batch: boolean;
  has_serial: boolean;
  has_expiry: boolean;
  shelf_life_days?: number;
  
  // Tax & HSN
  hsn_code: string;
  sac_code?: string;
  gst_rate: number;
  cess_rate?: number;
  
  // Pricing
  purchase_price: number;
  selling_price: number;
  mrp?: number;
  
  // Dimensions (for shipping)
  weight?: number;
  weight_uom?: string;
  length?: number;
  width?: number;
  height?: number;
  dimension_uom?: string;
  
  // Images & Attachments
  image_url?: string;
  attachments?: string[];
  
  // Custom attributes (JSONB)
  attributes?: Record<string, unknown>;
  
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ItemCategory {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  parent_id?: string;
  default_valuation_method?: ValuationMethod;
  is_active: boolean;
}

export interface Brand {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  logo_url?: string;
  is_active: boolean;
}

export interface UnitOfMeasure {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  category: 'unit' | 'weight' | 'volume' | 'length' | 'time';
  is_active: boolean;
}

// ==================== WAREHOUSE & LOCATIONS ====================

export interface Warehouse {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    state_code: string;
    pincode: string;
  };
  is_default: boolean;
  is_active: boolean;
  locations: WarehouseLocation[];
}

export type LocationType = 
  | 'internal'      // Physical storage
  | 'vendor'        // Virtual: Goods with vendor
  | 'customer'      // Virtual: Goods with customer
  | 'production'    // Virtual: WIP
  | 'scrap'         // Virtual: Scrap/Loss
  | 'adjustment'    // Virtual: Inventory adjustments
  | 'transit';      // Virtual: Goods in transit

export interface WarehouseLocation {
  id: string;
  warehouse_id: string;
  code: string;
  name: string;
  location_type: LocationType;
  parent_id?: string;
  is_active: boolean;
  // For bin locations
  aisle?: string;
  rack?: string;
  shelf?: string;
  bin?: string;
}

// ==================== STOCK MOVES (DOUBLE-ENTRY INVENTORY) ====================

export type StockMoveType =
  | 'receipt'          // Purchase receipt
  | 'delivery'         // Sales delivery
  | 'transfer'         // Internal transfer
  | 'adjustment'       // Manual adjustment
  | 'production_in'    // Finished goods from production
  | 'production_out'   // Raw material to production
  | 'scrap'            // Scrap/Wastage
  | 'return_in'        // Customer return
  | 'return_out'       // Return to vendor
  | 'job_work_out'     // Send for job work
  | 'job_work_in';     // Receive from job work

export interface StockMove {
  id: string;
  tenant_id: string;
  move_number: string;
  move_type: StockMoveType;
  date: string;
  
  // Source & Destination (Double-entry)
  source_location_id: string;
  destination_location_id: string;
  
  // Item details
  item_id: string;
  item_code: string;
  item_name: string;
  uom_id: string;
  quantity: number;
  
  // Batch/Serial tracking
  batch_id?: string;
  serial_numbers?: string[];
  
  // Valuation
  unit_cost: number;
  total_cost: number;
  
  // Reference document
  reference_type?: 'purchase_receipt' | 'delivery_note' | 'production_order' | 'transfer' | 'adjustment';
  reference_id?: string;
  reference_number?: string;
  
  // Status
  status: 'draft' | 'confirmed' | 'done' | 'cancelled';
  
  created_by: string;
  created_at: string;
  updated_at: string;
}

// ==================== BATCH & SERIAL TRACKING ====================

export interface Batch {
  id: string;
  tenant_id: string;
  item_id: string;
  batch_number: string;
  manufacturing_date?: string;
  expiry_date?: string;
  supplier_batch?: string;
  status: 'active' | 'expired' | 'quarantine' | 'recalled';
  attributes?: Record<string, unknown>;
  created_at: string;
}

export interface SerialNumber {
  id: string;
  tenant_id: string;
  item_id: string;
  serial_number: string;
  batch_id?: string;
  status: 'available' | 'sold' | 'in_repair' | 'scrapped';
  warranty_start?: string;
  warranty_end?: string;
  current_location_id?: string;
  created_at: string;
}

// ==================== STOCK VALUATION ====================

export interface StockValuation {
  id: string;
  tenant_id: string;
  item_id: string;
  warehouse_id: string;
  location_id: string;
  batch_id?: string;
  
  // Quantities
  quantity_on_hand: number;
  quantity_reserved: number;
  quantity_available: number;
  
  // Values (calculated from stock moves)
  unit_cost: number;
  total_value: number;
  
  valuation_date: string;
  updated_at: string;
}

// ==================== STOCK TAKE / PHYSICAL INVENTORY ====================

export interface StockTake {
  id: string;
  tenant_id: string;
  document_number: string;
  warehouse_id: string;
  location_ids?: string[];
  item_category_ids?: string[];
  date: string;
  status: 'draft' | 'in_progress' | 'completed' | 'posted';
  lines: StockTakeLine[];
  adjustments_posted: boolean;
  created_by: string;
  created_at: string;
}

export interface StockTakeLine {
  id: string;
  stock_take_id: string;
  item_id: string;
  location_id: string;
  batch_id?: string;
  system_qty: number;
  counted_qty: number;
  variance: number;
  unit_cost: number;
  variance_value: number;
  remarks?: string;
  counted_by?: string;
  counted_at?: string;
}

// ==================== GATE PASS ====================

export type GatePassType = 'returnable' | 'non_returnable';

export interface GatePass {
  id: string;
  tenant_id: string;
  gate_pass_number: string;
  gate_pass_type: GatePassType;
  date: string;
  
  // Party
  party_type: 'customer' | 'vendor' | 'employee' | 'other';
  party_id?: string;
  party_name: string;
  
  // Vehicle
  vehicle_number?: string;
  driver_name?: string;
  driver_contact?: string;
  
  // Purpose
  purpose: string;
  expected_return_date?: string;
  actual_return_date?: string;
  
  lines: GatePassLine[];
  status: 'pending' | 'issued' | 'returned' | 'closed';
  
  issued_by: string;
  issued_at: string;
  created_at: string;
}

export interface GatePassLine {
  id: string;
  gate_pass_id: string;
  item_id: string;
  description: string;
  quantity: number;
  uom_id: string;
  returned_quantity?: number;
  remarks?: string;
}

