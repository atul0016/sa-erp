/**
 * SA ERP - Inventory Service
 * Handles inventory operations with double-entry stock moves
 */

import {
  ItemRepository,
  WarehouseRepository,
  WarehouseLocationRepository,
  StockMoveRepository,
  BatchRepository,
  SerialNumberRepository
} from './inventoryRepository';
import { generateId } from '../../database/repository';
import { Item, StockMove, Warehouse, WarehouseLocation, Batch, SerialNumber, LocationType } from '../../../shared/types';
import { getDatabase } from '../../database';
import { round } from '../../utils/helpers';

export class InventoryService {
  private itemRepo: ItemRepository;
  private warehouseRepo: WarehouseRepository;
  private locationRepo: WarehouseLocationRepository;
  private stockMoveRepo: StockMoveRepository;
  private batchRepo: BatchRepository;
  private serialRepo: SerialNumberRepository;

  constructor() {
    this.itemRepo = new ItemRepository();
    this.warehouseRepo = new WarehouseRepository();
    this.locationRepo = new WarehouseLocationRepository();
    this.stockMoveRepo = new StockMoveRepository();
    this.batchRepo = new BatchRepository();
    this.serialRepo = new SerialNumberRepository();
  }

  // ==================== Items ====================

  /**
   * Create new item
   */
  createItem(tenantId: string, data: Partial<Item>): Item {
    const item: Partial<Item> = {
      id: generateId(),
      tenant_id: tenantId,
      ...data,
      is_active: true
    };
    return this.itemRepo.create(item);
  }

  /**
   * Update item
   */
  updateItem(id: string, tenantId: string, data: Partial<Item>): Item | undefined {
    return this.itemRepo.update(id, data, tenantId);
  }

  /**
   * Get item by ID
   */
  getItem(id: string, tenantId: string): Item | undefined {
    return this.itemRepo.findById(id, tenantId);
  }

  /**
   * Search items
   */
  searchItems(tenantId: string, query: string, limit?: number): Item[] {
    return this.itemRepo.search(tenantId, query, limit);
  }

  /**
   * Get low stock items
   */
  getLowStockItems(tenantId: string): Item[] {
    return this.itemRepo.getLowStockItems(tenantId);
  }

  // ==================== Warehouses & Locations ====================

  /**
   * Create warehouse
   */
  createWarehouse(tenantId: string, data: Partial<Warehouse>): Warehouse {
    const db = getDatabase();
    
    return db.transaction(() => {
      const warehouseId = generateId();
      
      const warehouse = this.warehouseRepo.create({
        id: warehouseId,
        tenant_id: tenantId,
        ...data,
        is_active: true
      });
      
      // Create default internal location
      this.locationRepo.create({
        id: generateId(),
        warehouse_id: warehouseId,
        name: 'Stock',
        location_type: 'internal',
        is_active: true
      });
      
      // Create virtual locations for this warehouse
      this.createVirtualLocations(warehouseId);
      
      return warehouse;
    })();
  }

  private createVirtualLocations(warehouseId: string) {
    const virtualLocations: Array<{ name: string; location_type: LocationType }> = [
      { name: 'Vendor Location', location_type: 'vendor' },
      { name: 'Customer Location', location_type: 'customer' },
      { name: 'Production/WIP', location_type: 'production' },
      { name: 'Inventory Adjustment', location_type: 'adjustment' },
      { name: 'Scrap', location_type: 'scrap' }
    ];
    
    for (const loc of virtualLocations) {
      this.locationRepo.create({
        id: generateId(),
        warehouse_id: warehouseId,
        ...loc,
        is_active: true
      });
    }
  }

  /**
   * Get warehouse with locations
   */
  getWarehouse(id: string, tenantId: string) {
    return this.warehouseRepo.getWithLocations(id, tenantId);
  }

  /**
   * Get all warehouses
   */
  getWarehouses(tenantId: string): Warehouse[] {
    return this.warehouseRepo.findAll(tenantId, { where: { is_active: 1 } });
  }

  // ==================== Stock Operations ====================

  /**
   * Receive stock (e.g., from GRN)
   */
  receiveStock(
    tenantId: string,
    data: {
      item_id: string;
      quantity: number;
      unit_cost: number;
      destination_location_id: string;
      reference_type: string;
      reference_id: string;
      batch_number?: string;
      expiry_date?: string;
      serial_numbers?: string[];
    },
    createdBy: string
  ): StockMove {
    const db = getDatabase();
    
    return db.transaction(() => {
      // Get vendor location as source
      const vendorLocation = this.locationRepo.findByType(tenantId, 'vendor');
      if (!vendorLocation) {
        throw new Error('Vendor location not found');
      }

      let batchId: string | undefined;
      
      // Create batch if batch tracking
      if (data.batch_number) {
        const batch = this.batchRepo.create({
          id: generateId(),
          tenant_id: tenantId,
          item_id: data.item_id,
          batch_number: data.batch_number,
          expiry_date: data.expiry_date,
          status: 'active'
        });
        batchId = batch.id;
      }

      // Create serial numbers if serial tracking
      if (data.serial_numbers && data.serial_numbers.length > 0) {
        for (const sn of data.serial_numbers) {
          this.serialRepo.create({
            id: generateId(),
            tenant_id: tenantId,
            item_id: data.item_id,
            serial_number: sn,
            batch_id: batchId,
            status: 'available',
            current_location_id: data.destination_location_id
          });
        }
      }

      // Create stock move
      const move = this.stockMoveRepo.createMove(
        tenantId,
        {
          item_id: data.item_id,
          source_location_id: vendorLocation.id,
          destination_location_id: data.destination_location_id,
          quantity: data.quantity,
          unit_cost: data.unit_cost,
          reference_type: data.reference_type,
          reference_id: data.reference_id,
          batch_id: batchId
        },
        createdBy
      );

      // Confirm the move immediately
      this.stockMoveRepo.confirmMove(move.id, tenantId);

      // Update stock valuation
      this.updateStockValuation(tenantId, data.item_id, data.quantity, data.unit_cost);

      return this.stockMoveRepo.findById(move.id, tenantId) as StockMove;
    })();
  }

  /**
   * Issue stock (e.g., for delivery)
   */
  issueStock(
    tenantId: string,
    data: {
      item_id: string;
      quantity: number;
      source_location_id: string;
      reference_type: string;
      reference_id: string;
      batch_id?: string;
      serial_number_ids?: string[];
    },
    createdBy: string
  ): StockMove {
    const db = getDatabase();
    
    return db.transaction(() => {
      // Get customer location as destination
      const customerLocation = this.locationRepo.findByType(tenantId, 'customer');
      if (!customerLocation) {
        throw new Error('Customer location not found');
      }

      // Check stock availability
      const availableStock = this.stockMoveRepo.getStockInLocation(
        tenantId, 
        data.item_id, 
        data.source_location_id
      );
      
      if (availableStock < data.quantity) {
        throw new Error(`Insufficient stock. Available: ${availableStock}, Required: ${data.quantity}`);
      }

      // Get unit cost (FIFO valuation)
      const unitCost = this.getItemCost(tenantId, data.item_id);

      // Update serial numbers if applicable
      if (data.serial_number_ids) {
        for (const snId of data.serial_number_ids) {
          this.serialRepo.updateStatus(snId, tenantId, 'sold', customerLocation.id);
        }
      }

      // Create stock move
      const move = this.stockMoveRepo.createMove(
        tenantId,
        {
          item_id: data.item_id,
          source_location_id: data.source_location_id,
          destination_location_id: customerLocation.id,
          quantity: data.quantity,
          unit_cost: unitCost,
          reference_type: data.reference_type,
          reference_id: data.reference_id,
          batch_id: data.batch_id
        },
        createdBy
      );

      // Confirm the move
      this.stockMoveRepo.confirmMove(move.id, tenantId);

      // Update stock valuation
      this.updateStockValuation(tenantId, data.item_id, -data.quantity, unitCost);

      return this.stockMoveRepo.findById(move.id, tenantId) as StockMove;
    })();
  }

  /**
   * Transfer stock between locations
   */
  transferStock(
    tenantId: string,
    data: {
      item_id: string;
      quantity: number;
      source_location_id: string;
      destination_location_id: string;
      batch_id?: string;
      serial_number_ids?: string[];
    },
    createdBy: string
  ): StockMove {
    const db = getDatabase();
    
    return db.transaction(() => {
      // Check stock availability
      const availableStock = this.stockMoveRepo.getStockInLocation(
        tenantId,
        data.item_id,
        data.source_location_id
      );
      
      if (availableStock < data.quantity) {
        throw new Error(`Insufficient stock. Available: ${availableStock}, Required: ${data.quantity}`);
      }

      const unitCost = this.getItemCost(tenantId, data.item_id);

      // Update serial number locations if applicable
      if (data.serial_number_ids) {
        for (const snId of data.serial_number_ids) {
          this.serialRepo.updateStatus(snId, tenantId, 'available', data.destination_location_id);
        }
      }

      // Create stock move
      const move = this.stockMoveRepo.createMove(
        tenantId,
        {
          item_id: data.item_id,
          source_location_id: data.source_location_id,
          destination_location_id: data.destination_location_id,
          quantity: data.quantity,
          unit_cost: unitCost,
          reference_type: 'transfer',
          reference_id: generateId(),
          batch_id: data.batch_id
        },
        createdBy
      );

      // Confirm the move
      this.stockMoveRepo.confirmMove(move.id, tenantId);

      return this.stockMoveRepo.findById(move.id, tenantId) as StockMove;
    })();
  }

  /**
   * Adjust stock (positive or negative)
   */
  adjustStock(
    tenantId: string,
    data: {
      item_id: string;
      quantity: number; // Positive for increase, negative for decrease
      location_id: string;
      reason: string;
    },
    createdBy: string
  ): StockMove {
    const db = getDatabase();
    
    return db.transaction(() => {
      const adjustmentLocation = this.locationRepo.findByType(tenantId, 'adjustment');
      if (!adjustmentLocation) {
        throw new Error('Adjustment location not found');
      }

      const unitCost = this.getItemCost(tenantId, data.item_id);
      const isPositive = data.quantity > 0;

      // Create stock move
      const move = this.stockMoveRepo.createMove(
        tenantId,
        {
          item_id: data.item_id,
          source_location_id: isPositive ? adjustmentLocation.id : data.location_id,
          destination_location_id: isPositive ? data.location_id : adjustmentLocation.id,
          quantity: Math.abs(data.quantity),
          unit_cost: unitCost,
          reference_type: 'adjustment',
          reference_id: generateId()
        },
        createdBy
      );

      // Confirm the move
      this.stockMoveRepo.confirmMove(move.id, tenantId);

      // Update stock valuation
      this.updateStockValuation(tenantId, data.item_id, data.quantity, unitCost);

      return this.stockMoveRepo.findById(move.id, tenantId) as StockMove;
    })();
  }

  // ==================== Stock Queries ====================

  /**
   * Get stock for item
   */
  getItemStock(tenantId: string, itemId: string): {
    total: number;
    byLocation: Array<{ location_id: string; location_name: string; quantity: number }>;
  } {
    const db = getDatabase();
    
    const byLocation = db.prepare(`
      SELECT 
        wl.id as location_id,
        wl.name as location_name,
        COALESCE(
          SUM(CASE WHEN sm.destination_location_id = wl.id THEN sm.quantity ELSE 0 END) -
          SUM(CASE WHEN sm.source_location_id = wl.id THEN sm.quantity ELSE 0 END),
          0
        ) as quantity
      FROM warehouse_locations wl
      JOIN warehouses w ON w.id = wl.warehouse_id
      LEFT JOIN stock_moves sm ON (sm.source_location_id = wl.id OR sm.destination_location_id = wl.id)
        AND sm.item_id = ? AND sm.status = 'done'
      WHERE w.tenant_id = ? AND wl.is_virtual = 0 AND wl.is_active = 1
      GROUP BY wl.id
      HAVING quantity > 0
    `).all(itemId, tenantId) as Array<{ location_id: string; location_name: string; quantity: number }>;
    
    const total = byLocation.reduce((sum, loc) => sum + loc.quantity, 0);
    
    return { total, byLocation };
  }

  /**
   * Get stock movements for item
   */
  getStockMovements(tenantId: string, itemId: string, fromDate?: string, toDate?: string): StockMove[] {
    return this.stockMoveRepo.getMovesForItem(tenantId, itemId, fromDate, toDate);
  }

  /**
   * Get item cost (weighted average or FIFO)
   */
  getItemCost(tenantId: string, itemId: string): number {
    const db = getDatabase();
    
    // Using weighted average cost
    const result = db.prepare(`
      SELECT 
        COALESCE(
          SUM(CASE 
            WHEN dl.location_type IN ('internal', 'production') 
            THEN sm.total_cost ELSE 0 
          END) /
          NULLIF(SUM(CASE 
            WHEN dl.location_type IN ('internal', 'production') 
            THEN sm.quantity ELSE 0 
          END), 0),
          0
        ) as avg_cost
      FROM stock_moves sm
      LEFT JOIN warehouse_locations dl ON dl.id = sm.destination_location_id
      WHERE sm.tenant_id = ? AND sm.item_id = ? AND sm.status = 'done'
    `).get(tenantId, itemId) as { avg_cost: number } | undefined;
    
    return round(result?.avg_cost || 0);
  }

  /**
   * Get stock valuation report
   */
  getStockValuation(tenantId: string): Array<{
    item_id: string;
    item_name: string;
    sku: string;
    quantity: number;
    unit_cost: number;
    total_value: number;
  }> {
    const db = getDatabase();
    
    return db.prepare(`
      SELECT 
        i.id as item_id,
        i.name as item_name,
        i.sku,
        sv.quantity,
        sv.weighted_average_cost as unit_cost,
        sv.total_value
      FROM stock_valuations sv
      JOIN items i ON i.id = sv.item_id
      WHERE sv.tenant_id = ? AND sv.quantity > 0
      ORDER BY i.name
    `).all(tenantId) as Array<{
      item_id: string;
      item_name: string;
      sku: string;
      quantity: number;
      unit_cost: number;
      total_value: number;
    }>;
  }

  private updateStockValuation(tenantId: string, itemId: string, quantityChange: number, unitCost: number) {
    const db = getDatabase();
    
    // Get current valuation
    const current = db.prepare(
      `SELECT * FROM stock_valuations WHERE tenant_id = ? AND item_id = ?`
    ).get(tenantId, itemId) as {
      id: string;
      quantity: number;
      total_value: number;
      weighted_average_cost: number;
    } | undefined;
    
    if (current) {
      const newQty = current.quantity + quantityChange;
      let newTotalValue: number;
      let newAvgCost: number;
      
      if (quantityChange > 0) {
        // Receiving stock - calculate new weighted average
        newTotalValue = current.total_value + (quantityChange * unitCost);
        newAvgCost = newQty > 0 ? newTotalValue / newQty : 0;
      } else {
        // Issuing stock - reduce at current average cost
        newTotalValue = newQty * current.weighted_average_cost;
        newAvgCost = current.weighted_average_cost;
      }
      
      db.prepare(`
        UPDATE stock_valuations 
        SET quantity = ?, total_value = ?, weighted_average_cost = ?, last_updated = datetime('now')
        WHERE tenant_id = ? AND item_id = ?
      `).run(newQty, newTotalValue, newAvgCost, tenantId, itemId);
    } else {
      // First receipt - create valuation record
      db.prepare(`
        INSERT INTO stock_valuations (id, tenant_id, item_id, quantity, total_value, weighted_average_cost, last_updated)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(generateId(), tenantId, itemId, quantityChange, quantityChange * unitCost, unitCost);
    }
  }

  private getWarehouseForLocation(locationId: string): string {
    const db = getDatabase();
    const result = db.prepare(
      `SELECT warehouse_id FROM warehouse_locations WHERE id = ?`
    ).get(locationId) as { warehouse_id: string } | undefined;
    return result?.warehouse_id || '';
  }

  // List methods
  getAllItems(tenantId: string): Item[] {
    return this.itemRepo.findAll(tenantId, { where: { is_active: 1 } });
  }

  getLowStockAlerts(tenantId: string) {
    const db = getDatabase();
    return db.prepare(`
      SELECT 
        i.id, i.sku, i.name, i.reorder_level, i.preferred_vendor_id,
        COALESCE(SUM(sm.quantity), 0) as current_stock,
        i.reorder_level - COALESCE(SUM(sm.quantity), 0) as to_order,
        v.name as vendor_name
      FROM items i
      LEFT JOIN stock_moves sm ON sm.item_id = i.id AND sm.tenant_id = i.tenant_id
      LEFT JOIN vendors v ON v.id = i.preferred_vendor_id
      WHERE i.tenant_id = ? AND i.is_active = 1 AND i.reorder_level > 0
      GROUP BY i.id
      HAVING current_stock <= i.reorder_level
      ORDER BY (i.reorder_level - current_stock) DESC
    `).all(tenantId);
  }
}



// Export singleton instance (lazy initialization)
let _inventoryService: InventoryService | null = null;
export const getInventoryService = (): InventoryService => {
  if (!_inventoryService) {
    _inventoryService = new InventoryService();
  }
  return _inventoryService;
};

// For backward compatibility - use getInventoryService() instead
export { getInventoryService as inventoryService };

