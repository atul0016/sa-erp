/**
 * SA ERP - Inventory Repository
 */

import { BaseRepository, generateId } from '../../database/repository';
import { Item, StockMove, Warehouse, WarehouseLocation, Batch, SerialNumber } from '../../../shared/types';

export class ItemRepository extends BaseRepository<Item> {
  constructor() {
    super('items');
  }

  /**
   * Find item by SKU
   */
  findBySku(tenantId: string, sku: string): Item | undefined {
    return this.findOne(tenantId, { sku, is_active: 1 });
  }

  /**
   * Find item by barcode
   */
  findByBarcode(tenantId: string, barcode: string): Item | undefined {
    return this.findOne(tenantId, { barcode, is_active: 1 });
  }

  /**
   * Search items by name or SKU
   */
  search(tenantId: string, query: string, limit: number = 20): Item[] {
    return this.query<Item>(
      `SELECT * FROM ${this.tableName} 
       WHERE tenant_id = ? AND is_active = 1 
       AND (name LIKE ? OR sku LIKE ? OR barcode LIKE ?)
       LIMIT ?`,
      [tenantId, `%${query}%`, `%${query}%`, `%${query}%`, limit]
    );
  }

  /**
   * Get items by category
   */
  getByCategory(tenantId: string, categoryId: string): Item[] {
    return this.query<Item>(
      `SELECT * FROM ${this.tableName} 
       WHERE tenant_id = ? AND category_id = ? AND is_active = 1 
       ORDER BY name`,
      [tenantId, categoryId]
    );
  }

  /**
   * Get low stock items
   */
  getLowStockItems(tenantId: string): Item[] {
    return this.query<Item>(
      `SELECT i.*, 
        COALESCE(
          (SELECT SUM(sm.quantity * CASE WHEN sm.move_type = 'in' THEN 1 ELSE -1 END)
           FROM stock_moves sm WHERE sm.item_id = i.id AND sm.status = 'done'), 0
        ) as current_stock
       FROM ${this.tableName} i
       WHERE i.tenant_id = ? AND i.is_active = 1 AND i.track_inventory = 1
       AND current_stock <= i.reorder_point
       ORDER BY i.name`,
      [tenantId]
    );
  }
}

export class WarehouseRepository extends BaseRepository<Warehouse> {
  constructor() {
    super('warehouses');
  }

  /**
   * Get warehouse with locations
   */
  getWithLocations(id: string, tenantId: string): (Warehouse & { locations: WarehouseLocation[] }) | undefined {
    const warehouse = this.findById(id, tenantId);
    if (!warehouse) return undefined;

    const locations = this.query<WarehouseLocation>(
      `SELECT * FROM warehouse_locations WHERE warehouse_id = ? AND is_active = 1 ORDER BY name`,
      [id]
    );

    return { ...warehouse, locations };
  }

  /**
   * Get default warehouse for tenant
   */
  getDefault(tenantId: string): Warehouse | undefined {
    return this.findOne(tenantId, { is_default: 1, is_active: 1 });
  }
}

export class WarehouseLocationRepository extends BaseRepository<WarehouseLocation> {
  constructor() {
    super('warehouse_locations');
  }

  /**
   * Get virtual locations (Vendor, Customer, WIP, etc.)
   */
  getVirtualLocations(tenantId: string): WarehouseLocation[] {
    return this.query<WarehouseLocation>(
      `SELECT wl.* FROM ${this.tableName} wl
       JOIN warehouses w ON w.id = wl.warehouse_id
       WHERE w.tenant_id = ? AND wl.is_virtual = 1 AND wl.is_active = 1`,
      [tenantId]
    );
  }

  /**
   * Find by location type
   */
  findByType(tenantId: string, locationType: string): WarehouseLocation | undefined {
    const result = this.query<WarehouseLocation>(
      `SELECT wl.* FROM ${this.tableName} wl
       JOIN warehouses w ON w.id = wl.warehouse_id
       WHERE w.tenant_id = ? AND wl.location_type = ? AND wl.is_active = 1
       LIMIT 1`,
      [tenantId, locationType]
    );
    return result[0];
  }
}

export class StockMoveRepository extends BaseRepository<StockMove> {
  constructor() {
    super('stock_moves');
  }

  /**
   * Create stock move (double-entry inventory)
   */
  createMove(
    tenantId: string,
    data: {
      item_id: string;
      source_location_id: string;
      destination_location_id: string;
      quantity: number;
      unit_cost: number;
      reference_type: string;
      reference_id: string;
      batch_id?: string;
      serial_number_id?: string;
    },
    createdBy: string
  ): StockMove {
    const moveId = generateId();
    const moveNumber = this.getNextMoveNumber(tenantId);

    this.execute(
      `INSERT INTO stock_moves (
        id, tenant_id, move_number, item_id, source_location_id, destination_location_id,
        quantity, unit_cost, total_cost, reference_type, reference_id, 
        batch_id, serial_number_id, status, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, datetime('now'))`,
      [
        moveId,
        tenantId,
        moveNumber,
        data.item_id,
        data.source_location_id,
        data.destination_location_id,
        data.quantity,
        data.unit_cost,
        data.quantity * data.unit_cost,
        data.reference_type,
        data.reference_id,
        data.batch_id || null,
        data.serial_number_id || null,
        createdBy
      ]
    );

    return this.findById(moveId, tenantId) as StockMove;
  }

  /**
   * Confirm stock move
   */
  confirmMove(id: string, tenantId: string): boolean {
    const result = this.execute(
      `UPDATE stock_moves SET status = 'done', done_at = datetime('now') WHERE id = ? AND tenant_id = ?`,
      [id, tenantId]
    );
    return result.changes > 0;
  }

  /**
   * Get stock moves for an item
   */
  getMovesForItem(tenantId: string, itemId: string, fromDate?: string, toDate?: string): StockMove[] {
    let sql = `SELECT sm.*, 
      sl.name as source_location_name, 
      dl.name as dest_location_name
      FROM stock_moves sm
      LEFT JOIN warehouse_locations sl ON sl.id = sm.source_location_id
      LEFT JOIN warehouse_locations dl ON dl.id = sm.destination_location_id
      WHERE sm.tenant_id = ? AND sm.item_id = ?`;
    
    const params: unknown[] = [tenantId, itemId];

    if (fromDate) {
      sql += ' AND sm.created_at >= ?';
      params.push(fromDate);
    }
    if (toDate) {
      sql += ' AND sm.created_at <= ?';
      params.push(toDate);
    }

    sql += ' ORDER BY sm.created_at DESC';

    return this.query<StockMove>(sql, params);
  }

  /**
   * Get current stock for item in location
   */
  getStockInLocation(tenantId: string, itemId: string, locationId: string): number {
    const result = this.query<{ stock: number }>(
      `SELECT 
        COALESCE(
          SUM(CASE WHEN destination_location_id = ? THEN quantity ELSE 0 END) -
          SUM(CASE WHEN source_location_id = ? THEN quantity ELSE 0 END),
          0
        ) as stock
       FROM stock_moves 
       WHERE tenant_id = ? AND item_id = ? AND status = 'done'`,
      [locationId, locationId, tenantId, itemId]
    );
    return result[0]?.stock || 0;
  }

  /**
   * Get total stock for item across all locations
   */
  getTotalStock(tenantId: string, itemId: string): number {
    // Stock = sum of all inbound moves - sum of all outbound moves from internal locations
    const result = this.query<{ stock: number }>(
      `SELECT 
        COALESCE(SUM(
          CASE 
            WHEN dl.location_type = 'internal' THEN sm.quantity 
            WHEN sl.location_type = 'internal' THEN -sm.quantity 
            ELSE 0 
          END
        ), 0) as stock
       FROM stock_moves sm
       LEFT JOIN warehouse_locations sl ON sl.id = sm.source_location_id
       LEFT JOIN warehouse_locations dl ON dl.id = sm.destination_location_id
       WHERE sm.tenant_id = ? AND sm.item_id = ? AND sm.status = 'done'`,
      [tenantId, itemId]
    );
    return result[0]?.stock || 0;
  }

  private getNextMoveNumber(tenantId: string): string {
    const result = this.query<{ max_num: number }>(
      `SELECT MAX(CAST(SUBSTR(move_number, 3) AS INTEGER)) as max_num
       FROM stock_moves WHERE tenant_id = ?`,
      [tenantId]
    );
    const nextNum = (result[0]?.max_num || 0) + 1;
    return `SM${nextNum.toString().padStart(8, '0')}`;
  }
}

export class BatchRepository extends BaseRepository<Batch> {
  constructor() {
    super('batches');
  }

  /**
   * Get available batches for item (FIFO order)
   */
  getAvailableBatches(tenantId: string, itemId: string, warehouseId?: string): Array<Batch & { available_qty: number }> {
    let sql = `SELECT b.*, 
      COALESCE(
        (SELECT SUM(sm.quantity) FROM stock_moves sm 
         WHERE sm.batch_id = b.id AND sm.status = 'done' 
         AND sm.destination_location_id IN (
           SELECT id FROM warehouse_locations WHERE is_virtual = 0
         )) -
        (SELECT COALESCE(SUM(sm.quantity), 0) FROM stock_moves sm 
         WHERE sm.batch_id = b.id AND sm.status = 'done'
         AND sm.source_location_id IN (
           SELECT id FROM warehouse_locations WHERE is_virtual = 0
         )),
        0
      ) as available_qty
      FROM batches b
      WHERE b.tenant_id = ? AND b.item_id = ? AND b.status = 'available'`;

    const params: unknown[] = [tenantId, itemId];

    if (warehouseId) {
      sql += ` AND b.warehouse_id = ?`;
      params.push(warehouseId);
    }

    sql += ` HAVING available_qty > 0 ORDER BY b.expiry_date ASC, b.manufacturing_date ASC`;

    return this.query(sql, params);
  }

  /**
   * Find batch by number
   */
  findByNumber(tenantId: string, itemId: string, batchNumber: string): Batch | undefined {
    return this.findOne(tenantId, { item_id: itemId, batch_number: batchNumber });
  }
}

export class SerialNumberRepository extends BaseRepository<SerialNumber> {
  constructor() {
    super('serial_numbers');
  }

  /**
   * Find available serial numbers for item
   */
  getAvailable(tenantId: string, itemId: string, warehouseId?: string): SerialNumber[] {
    let sql = `SELECT * FROM serial_numbers WHERE tenant_id = ? AND item_id = ? AND status = 'available'`;
    const params: unknown[] = [tenantId, itemId];

    if (warehouseId) {
      sql += ` AND warehouse_id = ?`;
      params.push(warehouseId);
    }

    return this.query<SerialNumber>(sql, params);
  }

  /**
   * Find by serial number
   */
  findByNumber(tenantId: string, serialNumber: string): SerialNumber | undefined {
    return this.findOne(tenantId, { serial_number: serialNumber });
  }

  /**
   * Update serial number status
   */
  updateStatus(id: string, tenantId: string, status: string, currentLocationId?: string): boolean {
    let sql = `UPDATE serial_numbers SET status = ?`;
    const params: unknown[] = [status];

    if (currentLocationId) {
      sql += `, current_location_id = ?`;
      params.push(currentLocationId);
    }

    sql += ` WHERE id = ? AND tenant_id = ?`;
    params.push(id, tenantId);

    const result = this.execute(sql, params);
    return result.changes > 0;
  }
}

