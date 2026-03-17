/**
 * MRP Service - Material Requirements Planning
 * 
 * Per The ERP Architect's Handbook:
 * - Backward scheduling from required date
 * - Multi-level BOM explosion
 * - Safety stock consideration
 * - Lead time based planning
 * - Planned order generation
 */

import { v4 as uuidv4 } from 'uuid';
import type { Database } from 'better-sqlite3';

export interface MrpRunParams {
  tenantId: string;
  planningHorizonDays: number;
  includeSafetyStock: boolean;
  includeReorderLevel: boolean;
  considerLeadTime: boolean;
  sourceDocuments: ('sales_orders' | 'production_orders' | 'forecasts')[];
  warehouseIds?: string[];
  itemFilter?: {
    categoryIds?: string[];
    itemIds?: string[];
  };
  runBy: string;
}

export interface MrpDemand {
  itemId: string;
  itemCode: string;
  demandDate: string;
  demandType: string;
  sourceDocumentType?: string;
  sourceDocumentId?: string;
  sourceDocumentNumber?: string;
  warehouseId?: string;
  requiredQty: number;
  uomId: string;
  priority: number;
}

export interface MrpSupply {
  itemId: string;
  itemCode: string;
  supplyDate: string;
  supplyType: string;
  sourceDocumentType?: string;
  sourceDocumentId?: string;
  sourceDocumentNumber?: string;
  warehouseId?: string;
  availableQty: number;
  uomId: string;
}

export interface MrpPlannedOrder {
  id: string;
  itemId: string;
  itemCode: string;
  itemName: string;
  orderType: 'purchase' | 'production';
  warehouseId?: string;
  requiredDate: string;
  orderDate: string;
  quantity: number;
  uomId: string;
  unitCost: number;
  totalCost: number;
  leadTimeDays: number;
  preferredVendorId?: string;
  preferredVendorName?: string;
  bomId?: string;
  explodedComponents?: Array<{
    itemId: string;
    itemCode: string;
    itemName: string;
    quantity: number;
    uomId: string;
  }>;
}

export interface MrpRunResult {
  runId: string;
  runNumber: string;
  totalItemsProcessed: number;
  totalPlannedOrders: number;
  totalPlannedValue: number;
  plannedOrders: MrpPlannedOrder[];
}

/**
 * Execute MRP Run
 */
export async function executeMrpRun(
  db: Database,
  params: MrpRunParams
): Promise<MrpRunResult> {
  const runId = uuidv4();
  const runNumber = `MRP-${Date.now()}`;
  const runDate = new Date().toISOString().split('T')[0];
  const startTime = new Date().toISOString();

  // Create MRP run record
  db.prepare(`
    INSERT INTO mrp_runs (
      id, tenant_id, run_number, run_date, planning_horizon_days,
      include_safety_stock, include_reorder_level, consider_lead_time,
      source_documents, warehouses, item_filter, run_by, started_at, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'running')
  `).run(
    runId,
    params.tenantId,
    runNumber,
    runDate,
    params.planningHorizonDays,
    params.includeSafetyStock ? 1 : 0,
    params.includeReorderLevel ? 1 : 0,
    params.considerLeadTime ? 1 : 0,
    JSON.stringify(params.sourceDocuments),
    params.warehouseIds ? JSON.stringify(params.warehouseIds) : null,
    params.itemFilter ? JSON.stringify(params.itemFilter) : null,
    params.runBy,
    startTime
  );

  try {
    // Calculate horizon end date
    const horizonEndDate = new Date();
    horizonEndDate.setDate(horizonEndDate.getDate() + params.planningHorizonDays);
    const horizonEnd = horizonEndDate.toISOString().split('T')[0];

    // Gather all demands
    const demands = gatherDemands(db, params, runId, runDate, horizonEnd);

    // Gather all supplies
    const supplies = gatherSupplies(db, params, runId, runDate, horizonEnd);

    // Get items to process
    const itemIds = new Set([
      ...demands.map(d => d.itemId),
      ...supplies.map(s => s.itemId),
    ]);

    const plannedOrders: MrpPlannedOrder[] = [];
    let totalValue = 0;

    // Process each item
    for (const itemId of itemIds) {
      const itemDemands = demands.filter(d => d.itemId === itemId);
      const itemSupplies = supplies.filter(s => s.itemId === itemId);

      const itemOrders = calculateNetRequirements(
        db,
        params,
        runId,
        itemId,
        itemDemands,
        itemSupplies
      );

      plannedOrders.push(...itemOrders);
      totalValue += itemOrders.reduce((sum, o) => sum + o.totalCost, 0);
    }

    // Save planned orders
    for (const order of plannedOrders) {
      db.prepare(`
        INSERT INTO mrp_planned_orders (
          id, mrp_run_id, tenant_id, item_id, item_code, item_name,
          order_type, warehouse_id, required_date, order_date, quantity, uom_id,
          unit_cost, total_cost, lead_time_days, preferred_vendor_id, preferred_vendor_name,
          bom_id, exploded_components, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'planned')
      `).run(
        order.id,
        runId,
        params.tenantId,
        order.itemId,
        order.itemCode,
        order.itemName,
        order.orderType,
        order.warehouseId || null,
        order.requiredDate,
        order.orderDate,
        order.quantity,
        order.uomId,
        order.unitCost,
        order.totalCost,
        order.leadTimeDays,
        order.preferredVendorId || null,
        order.preferredVendorName || null,
        order.bomId || null,
        order.explodedComponents ? JSON.stringify(order.explodedComponents) : null
      );
    }

    // Update MRP run with results
    db.prepare(`
      UPDATE mrp_runs SET
        total_items_processed = ?,
        total_planned_orders = ?,
        total_planned_value = ?,
        completed_at = datetime('now'),
        status = 'completed'
      WHERE id = ?
    `).run(itemIds.size, plannedOrders.length, totalValue, runId);

    return {
      runId,
      runNumber,
      totalItemsProcessed: itemIds.size,
      totalPlannedOrders: plannedOrders.length,
      totalPlannedValue: totalValue,
      plannedOrders,
    };
  } catch (error) {
    // Mark run as failed
    db.prepare(`
      UPDATE mrp_runs SET status = 'failed' WHERE id = ?
    `).run(runId);
    throw error;
  }
}

/**
 * Gather demands from various sources
 */
function gatherDemands(
  db: Database,
  params: MrpRunParams,
  runId: string,
  runDate: string,
  horizonEnd: string
): MrpDemand[] {
  const demands: MrpDemand[] = [];

  // Demand from Sales Orders
  if (params.sourceDocuments.includes('sales_orders')) {
    const soLines = db.prepare(`
      SELECT 
        sol.item_id, sol.item_code, sol.quantity, sol.delivered_qty, sol.uom_id,
        so.delivery_date, so.order_number, so.id as order_id, so.warehouse_id, so.priority
      FROM sales_order_lines sol
      JOIN sales_orders so ON sol.sales_order_id = so.id
      WHERE so.tenant_id = ?
      AND so.status IN ('confirmed', 'processing', 'partial_delivered')
      AND so.delivery_date BETWEEN ? AND ?
      ${params.warehouseIds?.length ? `AND so.warehouse_id IN (${params.warehouseIds.map(() => '?').join(',')})` : ''}
    `).all(
      params.tenantId,
      runDate,
      horizonEnd,
      ...(params.warehouseIds || [])
    ) as any[];

    for (const line of soLines) {
      const pendingQty = line.quantity - (line.delivered_qty || 0);
      if (pendingQty > 0) {
        const demand: MrpDemand = {
          itemId: line.item_id,
          itemCode: line.item_code,
          demandDate: line.delivery_date,
          demandType: 'sales_order',
          sourceDocumentType: 'sales_order',
          sourceDocumentId: line.order_id,
          sourceDocumentNumber: line.order_number,
          warehouseId: line.warehouse_id,
          requiredQty: pendingQty,
          uomId: line.uom_id,
          priority: getPriorityValue(line.priority),
        };
        demands.push(demand);

        // Save to mrp_demands
        db.prepare(`
          INSERT INTO mrp_demands (
            id, mrp_run_id, item_id, item_code, demand_date, demand_type,
            source_document_type, source_document_id, source_document_number,
            warehouse_id, required_qty, uom_id, priority
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          uuidv4(), runId, demand.itemId, demand.itemCode, demand.demandDate,
          demand.demandType, demand.sourceDocumentType, demand.sourceDocumentId,
          demand.sourceDocumentNumber, demand.warehouseId, demand.requiredQty,
          demand.uomId, demand.priority
        );
      }
    }
  }

  // Demand from Production Orders (Component requirements)
  if (params.sourceDocuments.includes('production_orders')) {
    const poComponents = db.prepare(`
      SELECT 
        poc.item_id, poc.item_code, poc.required_qty, poc.issued_qty, poc.uom_id,
        po.planned_start, po.order_number, po.id as order_id, po.warehouse_id
      FROM production_order_components poc
      JOIN production_orders po ON poc.production_order_id = po.id
      WHERE po.tenant_id = ?
      AND po.status IN ('released', 'in_progress')
      AND po.planned_start BETWEEN ? AND ?
    `).all(params.tenantId, runDate, horizonEnd) as any[];

    for (const comp of poComponents) {
      const pendingQty = comp.required_qty - (comp.issued_qty || 0);
      if (pendingQty > 0) {
        const demand: MrpDemand = {
          itemId: comp.item_id,
          itemCode: comp.item_code,
          demandDate: comp.planned_start,
          demandType: 'production_order',
          sourceDocumentType: 'production_order',
          sourceDocumentId: comp.order_id,
          sourceDocumentNumber: comp.order_number,
          warehouseId: comp.warehouse_id,
          requiredQty: pendingQty,
          uomId: comp.uom_id,
          priority: 5, // Production orders have high priority
        };
        demands.push(demand);

        db.prepare(`
          INSERT INTO mrp_demands (
            id, mrp_run_id, item_id, item_code, demand_date, demand_type,
            source_document_type, source_document_id, source_document_number,
            warehouse_id, required_qty, uom_id, priority
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          uuidv4(), runId, demand.itemId, demand.itemCode, demand.demandDate,
          demand.demandType, demand.sourceDocumentType, demand.sourceDocumentId,
          demand.sourceDocumentNumber, demand.warehouseId, demand.requiredQty,
          demand.uomId, demand.priority
        );
      }
    }
  }

  // Safety Stock requirements
  if (params.includeSafetyStock) {
    const items = db.prepare(`
      SELECT id, code, safety_stock_qty, primary_uom_id
      FROM items
      WHERE tenant_id = ? AND safety_stock_qty > 0 AND is_active = 1
    `).all(params.tenantId) as any[];

    for (const item of items) {
      const currentStock = getCurrentStock(db, params.tenantId, item.id);
      if (currentStock < item.safety_stock_qty) {
        const demand: MrpDemand = {
          itemId: item.id,
          itemCode: item.code,
          demandDate: runDate,
          demandType: 'safety_stock',
          requiredQty: item.safety_stock_qty - currentStock,
          uomId: item.primary_uom_id,
          priority: 3,
        };
        demands.push(demand);

        db.prepare(`
          INSERT INTO mrp_demands (
            id, mrp_run_id, item_id, item_code, demand_date, demand_type,
            required_qty, uom_id, priority
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          uuidv4(), runId, demand.itemId, demand.itemCode, demand.demandDate,
          demand.demandType, demand.requiredQty, demand.uomId, demand.priority
        );
      }
    }
  }

  return demands;
}

/**
 * Gather supplies (scheduled receipts)
 */
function gatherSupplies(
  db: Database,
  params: MrpRunParams,
  runId: string,
  runDate: string,
  horizonEnd: string
): MrpSupply[] {
  const supplies: MrpSupply[] = [];

  // On-hand inventory
  const stockLevels = db.prepare(`
    SELECT 
      sv.item_id, i.code as item_code, sv.warehouse_id, sv.quantity, i.primary_uom_id
    FROM stock_valuations sv
    JOIN items i ON sv.item_id = i.id
    WHERE sv.tenant_id = ? AND sv.quantity > 0
    ${params.warehouseIds?.length ? `AND sv.warehouse_id IN (${params.warehouseIds.map(() => '?').join(',')})` : ''}
  `).all(params.tenantId, ...(params.warehouseIds || [])) as any[];

  for (const stock of stockLevels) {
    const supply: MrpSupply = {
      itemId: stock.item_id,
      itemCode: stock.item_code,
      supplyDate: runDate,
      supplyType: 'on_hand',
      warehouseId: stock.warehouse_id,
      availableQty: stock.quantity,
      uomId: stock.primary_uom_id,
    };
    supplies.push(supply);

    db.prepare(`
      INSERT INTO mrp_supplies (
        id, mrp_run_id, item_id, item_code, supply_date, supply_type,
        warehouse_id, available_qty, uom_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(), runId, supply.itemId, supply.itemCode, supply.supplyDate,
      supply.supplyType, supply.warehouseId, supply.availableQty, supply.uomId
    );
  }

  // Purchase Orders (pending receipts)
  const poLines = db.prepare(`
    SELECT 
      pol.item_id, pol.item_code, pol.quantity, pol.received_qty, pol.uom_id,
      po.expected_date, po.order_number, po.id as order_id, po.warehouse_id
    FROM purchase_order_lines pol
    JOIN purchase_orders po ON pol.purchase_order_id = po.id
    WHERE po.tenant_id = ?
    AND po.status IN ('confirmed', 'partial_received')
    AND po.expected_date BETWEEN ? AND ?
  `).all(params.tenantId, runDate, horizonEnd) as any[];

  for (const line of poLines) {
    const pendingQty = line.quantity - (line.received_qty || 0);
    if (pendingQty > 0) {
      const supply: MrpSupply = {
        itemId: line.item_id,
        itemCode: line.item_code,
        supplyDate: line.expected_date,
        supplyType: 'purchase_order',
        sourceDocumentType: 'purchase_order',
        sourceDocumentId: line.order_id,
        sourceDocumentNumber: line.order_number,
        warehouseId: line.warehouse_id,
        availableQty: pendingQty,
        uomId: line.uom_id,
      };
      supplies.push(supply);

      db.prepare(`
        INSERT INTO mrp_supplies (
          id, mrp_run_id, item_id, item_code, supply_date, supply_type,
          source_document_type, source_document_id, source_document_number,
          warehouse_id, available_qty, uom_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        uuidv4(), runId, supply.itemId, supply.itemCode, supply.supplyDate,
        supply.supplyType, supply.sourceDocumentType, supply.sourceDocumentId,
        supply.sourceDocumentNumber, supply.warehouseId, supply.availableQty, supply.uomId
      );
    }
  }

  // Production Orders (finished goods expected)
  const productionOrders = db.prepare(`
    SELECT 
      po.item_id, i.code as item_code, po.planned_qty, po.completed_qty, i.primary_uom_id,
      po.planned_end, po.order_number, po.id as order_id, po.warehouse_id
    FROM production_orders po
    JOIN items i ON po.item_id = i.id
    WHERE po.tenant_id = ?
    AND po.status IN ('released', 'in_progress')
    AND po.planned_end BETWEEN ? AND ?
  `).all(params.tenantId, runDate, horizonEnd) as any[];

  for (const po of productionOrders) {
    const pendingQty = po.planned_qty - (po.completed_qty || 0);
    if (pendingQty > 0) {
      const supply: MrpSupply = {
        itemId: po.item_id,
        itemCode: po.item_code,
        supplyDate: po.planned_end,
        supplyType: 'production_order',
        sourceDocumentType: 'production_order',
        sourceDocumentId: po.order_id,
        sourceDocumentNumber: po.order_number,
        warehouseId: po.warehouse_id,
        availableQty: pendingQty,
        uomId: po.primary_uom_id,
      };
      supplies.push(supply);

      db.prepare(`
        INSERT INTO mrp_supplies (
          id, mrp_run_id, item_id, item_code, supply_date, supply_type,
          source_document_type, source_document_id, source_document_number,
          warehouse_id, available_qty, uom_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        uuidv4(), runId, supply.itemId, supply.itemCode, supply.supplyDate,
        supply.supplyType, supply.sourceDocumentType, supply.sourceDocumentId,
        supply.sourceDocumentNumber, supply.warehouseId, supply.availableQty, supply.uomId
      );
    }
  }

  return supplies;
}

/**
 * Calculate net requirements and generate planned orders
 */
function calculateNetRequirements(
  db: Database,
  params: MrpRunParams,
  runId: string,
  itemId: string,
  demands: MrpDemand[],
  supplies: MrpSupply[]
): MrpPlannedOrder[] {
  const plannedOrders: MrpPlannedOrder[] = [];

  // Get item details
  const item = db.prepare(`
    SELECT 
      i.*, 
      COALESCE(i.lead_time_days, 7) as lead_time,
      (SELECT id FROM vendors WHERE id = i.preferred_vendor_id) as vendor_id,
      (SELECT name FROM vendors WHERE id = i.preferred_vendor_id) as vendor_name,
      (SELECT id FROM bills_of_materials WHERE item_id = i.id AND is_default = 1 AND is_active = 1 LIMIT 1) as default_bom_id
    FROM items i
    WHERE i.id = ?
  `).get(itemId) as any;

  if (!item) return plannedOrders;

  // Sort demands by date
  const sortedDemands = [...demands].sort(
    (a, b) => new Date(a.demandDate).getTime() - new Date(b.demandDate).getTime()
  );

  // Calculate available supply by date
  let runningBalance = supplies
    .filter(s => s.supplyType === 'on_hand')
    .reduce((sum, s) => sum + s.availableQty, 0);

  const scheduledReceipts = supplies
    .filter(s => s.supplyType !== 'on_hand')
    .sort((a, b) => new Date(a.supplyDate).getTime() - new Date(b.supplyDate).getTime());

  let receiptIndex = 0;

  for (const demand of sortedDemands) {
    // Add scheduled receipts that arrive before this demand
    while (
      receiptIndex < scheduledReceipts.length &&
      new Date(scheduledReceipts[receiptIndex].supplyDate) <= new Date(demand.demandDate)
    ) {
      runningBalance += scheduledReceipts[receiptIndex].availableQty;
      receiptIndex++;
    }

    // Check if we need to create a planned order
    if (runningBalance < demand.requiredQty) {
      const shortfall = demand.requiredQty - runningBalance;

      // Calculate order quantity (consider lot sizing)
      let orderQty = shortfall;
      if (item.min_order_qty && orderQty < item.min_order_qty) {
        orderQty = item.min_order_qty;
      }
      if (item.order_multiple && orderQty % item.order_multiple !== 0) {
        orderQty = Math.ceil(orderQty / item.order_multiple) * item.order_multiple;
      }

      // Backward schedule from required date
      const requiredDate = new Date(demand.demandDate);
      const leadTime = params.considerLeadTime ? item.lead_time : 0;
      const orderDate = new Date(requiredDate);
      orderDate.setDate(orderDate.getDate() - leadTime);

      // Determine order type (Make or Buy)
      const orderType: 'purchase' | 'production' = item.default_bom_id ? 'production' : 'purchase';

      // Get components if production
      let explodedComponents: MrpPlannedOrder['explodedComponents'];
      if (orderType === 'production' && item.default_bom_id) {
        const components = db.prepare(`
          SELECT bc.*, i.code as item_code, i.name as item_name
          FROM bom_components bc
          JOIN items i ON bc.item_id = i.id
          WHERE bc.bom_id = ?
        `).all(item.default_bom_id) as any[];

        explodedComponents = components.map(c => ({
          itemId: c.item_id,
          itemCode: c.item_code,
          itemName: c.item_name,
          quantity: c.quantity * orderQty,
          uomId: c.uom_id,
        }));
      }

      const plannedOrder: MrpPlannedOrder = {
        id: uuidv4(),
        itemId: item.id,
        itemCode: item.code,
        itemName: item.name,
        orderType,
        warehouseId: demand.warehouseId,
        requiredDate: demand.demandDate,
        orderDate: orderDate.toISOString().split('T')[0],
        quantity: orderQty,
        uomId: item.primary_uom_id,
        unitCost: item.standard_cost || item.last_purchase_price || 0,
        totalCost: (item.standard_cost || item.last_purchase_price || 0) * orderQty,
        leadTimeDays: leadTime,
        preferredVendorId: orderType === 'purchase' ? item.vendor_id : undefined,
        preferredVendorName: orderType === 'purchase' ? item.vendor_name : undefined,
        bomId: orderType === 'production' ? item.default_bom_id : undefined,
        explodedComponents,
      };

      plannedOrders.push(plannedOrder);

      // Update running balance
      runningBalance += orderQty;
    }

    // Consume demand
    runningBalance -= demand.requiredQty;
  }

  return plannedOrders;
}

/**
 * Convert planned orders to actual orders
 */
export function convertPlannedOrders(
  db: Database,
  tenantId: string,
  plannedOrderIds: string[],
  createdBy: string
): { purchaseOrders: string[]; productionOrders: string[] } {
  const result = { purchaseOrders: [] as string[], productionOrders: [] as string[] };

  const placeholders = plannedOrderIds.map(() => '?').join(',');
  const plannedOrders = db.prepare(`
    SELECT * FROM mrp_planned_orders
    WHERE id IN (${placeholders}) AND status = 'planned'
  `).all(...plannedOrderIds) as MrpPlannedOrder[];

  // Group purchase orders by vendor
  const purchaseByVendor = new Map<string, MrpPlannedOrder[]>();

  for (const order of plannedOrders) {
    if (order.orderType === 'purchase' && order.preferredVendorId) {
      const existing = purchaseByVendor.get(order.preferredVendorId) || [];
      existing.push(order);
      purchaseByVendor.set(order.preferredVendorId, existing);
    } else if (order.orderType === 'production') {
      // Create individual production orders
      // This would call the production service
      // For now, just mark as converted
      db.prepare(`
        UPDATE mrp_planned_orders
        SET is_converted = 1, converted_to_type = 'production_order', converted_at = datetime('now'), status = 'converted'
        WHERE id = ?
      `).run(order.id);
    }
  }

  // Create purchase orders (would call purchase service)
  for (const [vendorId, orders] of purchaseByVendor) {
    // Mark as converted
    for (const order of orders) {
      db.prepare(`
        UPDATE mrp_planned_orders
        SET is_converted = 1, converted_to_type = 'purchase_order', converted_at = datetime('now'), status = 'converted'
        WHERE id = ?
      `).run(order.id);
    }
  }

  return result;
}

// Helper functions
function getCurrentStock(db: Database, tenantId: string, itemId: string): number {
  const result = db.prepare(`
    SELECT COALESCE(SUM(quantity), 0) as total
    FROM stock_valuations
    WHERE tenant_id = ? AND item_id = ?
  `).get(tenantId, itemId) as { total: number };
  return result.total;
}

function getPriorityValue(priority: string): number {
  switch (priority) {
    case 'urgent': return 10;
    case 'high': return 7;
    case 'normal': return 5;
    case 'low': return 3;
    default: return 5;
  }
}

export default {
  executeMrpRun,
  convertPlannedOrders,
};
