/**
 * SA ERP - Manufacturing Service
 * 
 * Implements manufacturing operations:
 * - Bill of Materials (BOM)
 * - Work Centers
 * - Production Orders
 * - Material Requirement Planning (MRP)
 * - Job Work
 * - Quality Control
 */

import { getDatabase } from '../../database';
import { generateId, generateDocNumber } from '../../database/repository';

class ManufacturingService {
  private db() {
    return getDatabase();
  }

  private getNextDocSequence(tableName: string, tenantId: string): number {
    const result = this.db().prepare(
      `SELECT COUNT(*) as count FROM ${tableName} WHERE tenant_id = ?`
    ).get(tenantId) as { count: number };
    return (result?.count || 0) + 1;
  }

  // ==================== BILL OF MATERIALS ====================

  createBOM(tenantId: string, data: {
    itemId: string;
    bomType: 'production' | 'subcontracting' | 'kit';
    name: string;
    description?: string;
    version: string;
    routings?: Array<{
      workCenterId: string;
      sequence: number;
      operationName: string;
      setupTime: number;
      runTime: number;
      waitTime: number;
    }>;
    components: Array<{
      itemId: string;
      quantity: number;
      wastePercentage?: number;
    }>;
  }, userId: string): unknown {
    const bomId = generateId();
    
    return this.db().transaction(() => {
      // Create BOM header
      this.db().prepare(`
        INSERT INTO bom (
          id, tenant_id, item_id, bom_type, name, description,
          version, status, is_default, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', 0, ?)
      `).run(
        bomId,
        tenantId,
        data.itemId,
        data.bomType,
        data.name,
        data.description || null,
        data.version,
        userId
      );

      // Create BOM components
      for (const comp of data.components) {
        this.db().prepare(`
          INSERT INTO bom_components (
            id, bom_id, tenant_id, item_id, quantity, waste_percentage
          ) VALUES (?, ?, ?, ?, ?, ?)
        `).run(
          generateId(),
          bomId,
          tenantId,
          comp.itemId,
          comp.quantity,
          comp.wastePercentage || 0
        );
      }

      // Create routings if provided
      if (data.routings && data.routings.length > 0) {
        for (const routing of data.routings) {
          this.db().prepare(`
            INSERT INTO bom_routings (
              id, bom_id, tenant_id, work_center_id, sequence,
              operation_name, setup_time_minutes, run_time_minutes, wait_time_minutes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            generateId(),
            bomId,
            tenantId,
            routing.workCenterId,
            routing.sequence,
            routing.operationName,
            routing.setupTime,
            routing.runTime,
            routing.waitTime
          );
        }
      }

      return this.getBOM(bomId, tenantId);
    })();
  }

  getBOM(id: string, tenantId: string): unknown {
    const bom = this.db().prepare(`
      SELECT b.*, i.name as item_name, i.sku as item_sku
      FROM bom b
      JOIN items i ON i.id = b.item_id
      WHERE b.id = ? AND b.tenant_id = ?
    `).get(id, tenantId);

    if (!bom) return null;

    const components = this.db().prepare(`
      SELECT bc.*, i.name as item_name, i.sku as item_sku, u.symbol as uom_symbol
      FROM bom_components bc
      JOIN items i ON i.id = bc.item_id
      LEFT JOIN units_of_measure u ON u.id = i.uom_id
      WHERE bc.bom_id = ? AND bc.tenant_id = ?
      ORDER BY i.name
    `).all(id, tenantId);

    const routings = this.db().prepare(`
      SELECT br.*, wc.name as work_center_name
      FROM bom_routings br
      JOIN work_centers wc ON wc.id = br.work_center_id
      WHERE br.bom_id = ? AND br.tenant_id = ?
      ORDER BY br.sequence
    `).all(id, tenantId);

    return { ...bom as object, components, routings };
  }

  getBOMsForItem(tenantId: string, itemId: string): unknown[] {
    return this.db().prepare(`
      SELECT * FROM bom 
      WHERE tenant_id = ? AND item_id = ? 
      ORDER BY is_default DESC, version DESC
    `).all(tenantId, itemId);
  }

  approveBOM(id: string, tenantId: string): boolean {
    const result = this.db().prepare(`
      UPDATE bom SET status = 'active' WHERE id = ? AND tenant_id = ? AND status = 'draft'
    `).run(id, tenantId);
    return result.changes > 0;
  }

  setDefaultBOM(id: string, tenantId: string): boolean {
    return this.db().transaction(() => {
      const bom = this.db().prepare('SELECT item_id FROM bom WHERE id = ? AND tenant_id = ?').get(id, tenantId) as { item_id: string } | undefined;
      if (!bom) return false;

      // Remove default from other BOMs for same item
      this.db().prepare(`
        UPDATE bom SET is_default = 0 WHERE item_id = ? AND tenant_id = ?
      `).run(bom.item_id, tenantId);

      // Set this as default
      this.db().prepare(`
        UPDATE bom SET is_default = 1 WHERE id = ? AND tenant_id = ?
      `).run(id, tenantId);

      return true;
    })();
  }

  // ==================== WORK CENTERS ====================

  createWorkCenter(tenantId: string, data: {
    code: string;
    name: string;
    type: 'machine' | 'assembly' | 'manual' | 'outsourced';
    capacityPerHour: number;
    costPerHour: number;
    setupCost?: number;
    location?: string;
  }): unknown {
    const wcId = generateId();

    this.db().prepare(`
      INSERT INTO work_centers (
        id, tenant_id, code, name, type, capacity_per_hour,
        cost_per_hour, setup_cost, location, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).run(
      wcId,
      tenantId,
      data.code,
      data.name,
      data.type,
      data.capacityPerHour,
      data.costPerHour,
      data.setupCost || 0,
      data.location || null
    );

    return this.db().prepare('SELECT * FROM work_centers WHERE id = ?').get(wcId);
  }

  getWorkCenters(tenantId: string): unknown[] {
    return this.db().prepare(`
      SELECT * FROM work_centers WHERE tenant_id = ? AND is_active = 1 ORDER BY name
    `).all(tenantId);
  }

  getWorkCenterUtilization(tenantId: string, workCenterId: string, fromDate: string, toDate: string): unknown {
    // Get planned hours
    const planned = this.db().prepare(`
      SELECT 
        COALESCE(SUM((br.setup_time_minutes + br.run_time_minutes * po.quantity) / 60.0), 0) as planned_hours
      FROM production_orders po
      JOIN bom b ON b.id = po.bom_id
      JOIN bom_routings br ON br.bom_id = b.id
      WHERE po.tenant_id = ?
        AND br.work_center_id = ?
        AND po.planned_start_date BETWEEN ? AND ?
        AND po.status NOT IN ('cancelled', 'closed')
    `).get(tenantId, workCenterId, fromDate, toDate) as { planned_hours: number };

    // Get actual hours
    const actual = this.db().prepare(`
      SELECT COALESCE(SUM(actual_time_minutes / 60.0), 0) as actual_hours
      FROM production_order_operations
      WHERE tenant_id = ?
        AND work_center_id = ?
        AND completed_at BETWEEN ? AND ?
    `).get(tenantId, workCenterId, fromDate, toDate) as { actual_hours: number };

    // Calculate available hours (8 hours * working days)
    const days = Math.ceil((new Date(toDate).getTime() - new Date(fromDate).getTime()) / (1000 * 60 * 60 * 24));
    const availableHours = days * 8; // Assuming 8-hour shifts

    return {
      workCenterId,
      fromDate,
      toDate,
      plannedHours: planned.planned_hours,
      actualHours: actual.actual_hours,
      availableHours,
      utilizationPercent: availableHours > 0 ? (planned.planned_hours / availableHours) * 100 : 0
    };
  }

  // ==================== PRODUCTION ORDERS ====================

  createProductionOrder(tenantId: string, data: {
    itemId: string;
    bomId?: string;
    warehouseId: string;
    quantity: number;
    plannedStartDate: string;
    plannedEndDate: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    notes?: string;
    salesOrderId?: string;
  }, userId: string): unknown {
    const poId = generateId();
    const docNumber = generateDocNumber('PO', this.getNextDocSequence('production_orders', tenantId));

    // Get default BOM if not provided
    let bomId = data.bomId;
    if (!bomId) {
      const defaultBom = this.db().prepare(`
        SELECT id FROM bom 
        WHERE tenant_id = ? AND item_id = ? AND is_default = 1 AND status = 'active'
      `).get(tenantId, data.itemId) as { id: string } | undefined;
      
      if (!defaultBom) {
        throw new Error('No active default BOM found for this item');
      }
      bomId = defaultBom.id;
    }

    return this.db().transaction(() => {
      // Create production order
      this.db().prepare(`
        INSERT INTO production_orders (
          id, tenant_id, document_number, item_id, bom_id, warehouse_id,
          quantity, produced_quantity, planned_start_date, planned_end_date,
          status, priority, notes, sales_order_id, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 'draft', ?, ?, ?, ?)
      `).run(
        poId,
        tenantId,
        docNumber,
        data.itemId,
        bomId,
        data.warehouseId,
        data.quantity,
        data.plannedStartDate,
        data.plannedEndDate,
        data.priority || 'normal',
        data.notes || null,
        data.salesOrderId || null,
        userId
      );

      // Create material reservations from BOM
      const components = this.db().prepare(`
        SELECT * FROM bom_components WHERE bom_id = ? AND tenant_id = ?
      `).all(bomId, tenantId) as Array<{ item_id: string; quantity: number; waste_percentage: number }>;

      for (const comp of components) {
        const requiredQty = comp.quantity * data.quantity * (1 + comp.waste_percentage / 100);
        
        this.db().prepare(`
          INSERT INTO production_order_materials (
            id, production_order_id, tenant_id, item_id,
            required_quantity, issued_quantity, status
          ) VALUES (?, ?, ?, ?, ?, 0, 'pending')
        `).run(
          generateId(),
          poId,
          tenantId,
          comp.item_id,
          requiredQty
        );
      }

      // Create operations from BOM routings
      const routings = this.db().prepare(`
        SELECT * FROM bom_routings WHERE bom_id = ? AND tenant_id = ? ORDER BY sequence
      `).all(bomId, tenantId) as Array<{
        work_center_id: string;
        sequence: number;
        operation_name: string;
        setup_time_minutes: number;
        run_time_minutes: number;
        wait_time_minutes: number;
      }>;

      for (const routing of routings) {
        this.db().prepare(`
          INSERT INTO production_order_operations (
            id, production_order_id, tenant_id, work_center_id, sequence,
            operation_name, planned_time_minutes, actual_time_minutes, status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 'pending')
        `).run(
          generateId(),
          poId,
          tenantId,
          routing.work_center_id,
          routing.sequence,
          routing.operation_name,
          routing.setup_time_minutes + (routing.run_time_minutes * data.quantity),
          
        );
      }

      return this.getProductionOrder(poId, tenantId);
    })();
  }

  getProductionOrder(id: string, tenantId: string): unknown {
    const po = this.db().prepare(`
      SELECT po.*, i.name as item_name, i.sku as item_sku,
             w.name as warehouse_name, b.name as bom_name
      FROM production_orders po
      JOIN items i ON i.id = po.item_id
      JOIN warehouses w ON w.id = po.warehouse_id
      JOIN bom b ON b.id = po.bom_id
      WHERE po.id = ? AND po.tenant_id = ?
    `).get(id, tenantId);

    if (!po) return null;

    const materials = this.db().prepare(`
      SELECT pom.*, i.name as item_name, i.sku as item_sku
      FROM production_order_materials pom
      JOIN items i ON i.id = pom.item_id
      WHERE pom.production_order_id = ? AND pom.tenant_id = ?
    `).all(id, tenantId);

    const operations = this.db().prepare(`
      SELECT poo.*, wc.name as work_center_name
      FROM production_order_operations poo
      JOIN work_centers wc ON wc.id = poo.work_center_id
      WHERE poo.production_order_id = ? AND poo.tenant_id = ?
      ORDER BY poo.sequence
    `).all(id, tenantId);

    return { ...po as object, materials, operations };
  }

  releaseProductionOrder(id: string, tenantId: string): boolean {
    return this.db().transaction(() => {
      const po = this.db().prepare(`
        SELECT * FROM production_orders WHERE id = ? AND tenant_id = ? AND status = 'draft'
      `).get(id, tenantId);

      if (!po) return false;

      // Check material availability
      const materials = this.db().prepare(`
        SELECT pom.*, COALESCE(s.quantity, 0) as available_qty
        FROM production_order_materials pom
        LEFT JOIN (
          SELECT item_id, SUM(CASE WHEN direction = 'in' THEN quantity ELSE -quantity END) as quantity
          FROM stock_moves
          WHERE tenant_id = ? AND status = 'posted'
          GROUP BY item_id
        ) s ON s.item_id = pom.item_id
        WHERE pom.production_order_id = ? AND pom.tenant_id = ?
      `).all(tenantId, id, tenantId) as Array<{
        item_id: string;
        required_quantity: number;
        available_qty: number;
      }>;

      const shortages = materials.filter(m => m.available_qty < m.required_quantity);
      if (shortages.length > 0) {
        throw new Error('Insufficient material availability for some items');
      }

      // Update status
      this.db().prepare(`
        UPDATE production_orders SET status = 'released' WHERE id = ? AND tenant_id = ?
      `).run(id, tenantId);

      return true;
    })();
  }

  startProductionOrder(id: string, tenantId: string): boolean {
    const result = this.db().prepare(`
      UPDATE production_orders 
      SET status = 'in_progress', actual_start_date = datetime('now')
      WHERE id = ? AND tenant_id = ? AND status = 'released'
    `).run(id, tenantId);
    return result.changes > 0;
  }

  issueMaterials(tenantId: string, productionOrderId: string, data: {
    materials: Array<{
      materialId: string;
      quantity: number;
      batchId?: string;
    }>;
  }, userId: string): unknown {
    return this.db().transaction(() => {
      const results: string[] = [];

      for (const mat of data.materials) {
        // Update issued quantity
        this.db().prepare(`
          UPDATE production_order_materials
          SET issued_quantity = issued_quantity + ?, status = 'issued'
          WHERE id = ? AND tenant_id = ?
        `).run(mat.quantity, mat.materialId, tenantId);

        // Get material details
        const material = this.db().prepare(`
          SELECT pom.*, po.warehouse_id
          FROM production_order_materials pom
          JOIN production_orders po ON po.id = pom.production_order_id
          WHERE pom.id = ? AND pom.tenant_id = ?
        `).get(mat.materialId, tenantId) as { item_id: string; warehouse_id: string };

        // Create stock move (issue from warehouse)
        const stockMoveId = generateId();
        this.db().prepare(`
          INSERT INTO stock_moves (
            id, tenant_id, reference_type, reference_id, item_id,
            source_location_id, source_warehouse_id, quantity, direction,
            move_date, status, created_by
          ) VALUES (?, ?, 'production', ?, ?, 
            (SELECT id FROM locations WHERE warehouse_id = ? AND type = 'storage' LIMIT 1),
            ?, ?, 'out', datetime('now'), 'posted', ?)
        `).run(
          stockMoveId,
          tenantId,
          productionOrderId,
          material.item_id,
          material.warehouse_id,
          material.warehouse_id,
          mat.quantity,
          userId
        );

        results.push(stockMoveId);
      }

      return results;
    })();
  }

  recordProduction(tenantId: string, productionOrderId: string, data: {
    quantity: number;
    scrapQuantity?: number;
    notes?: string;
  }, userId: string): unknown {
    return this.db().transaction(() => {
      // Update production order
      this.db().prepare(`
        UPDATE production_orders 
        SET produced_quantity = produced_quantity + ?,
            status = CASE 
              WHEN produced_quantity + ? >= quantity THEN 'completed'
              ELSE status 
            END,
            actual_end_date = CASE 
              WHEN produced_quantity + ? >= quantity THEN datetime('now')
              ELSE actual_end_date 
            END
        WHERE id = ? AND tenant_id = ?
      `).run(data.quantity, data.quantity, data.quantity, productionOrderId, tenantId);

      // Get production order details
      const po = this.db().prepare(`
        SELECT * FROM production_orders WHERE id = ? AND tenant_id = ?
      `).get(productionOrderId, tenantId) as { item_id: string; warehouse_id: string };

      // Create stock move (receive finished goods)
      const stockMoveId = generateId();
      this.db().prepare(`
        INSERT INTO stock_moves (
          id, tenant_id, reference_type, reference_id, item_id,
          destination_location_id, destination_warehouse_id, quantity, direction,
          move_date, status, created_by
        ) VALUES (?, ?, 'production', ?, ?,
          (SELECT id FROM locations WHERE warehouse_id = ? AND type = 'storage' LIMIT 1),
          ?, ?, 'in', datetime('now'), 'posted', ?)
      `).run(
        stockMoveId,
        tenantId,
        productionOrderId,
        po.item_id,
        po.warehouse_id,
        po.warehouse_id,
        data.quantity,
        userId
      );

      return this.getProductionOrder(productionOrderId, tenantId);
    })();
  }

  // ==================== MRP ====================

  runMRP(tenantId: string, data: {
    planningHorizonDays: number;
    includeOrders: boolean;
    includeForecast: boolean;
  }): unknown {
    const horizon = new Date();
    horizon.setDate(horizon.getDate() + data.planningHorizonDays);
    const horizonDate = horizon.toISOString().split('T')[0];

    // Get demand (sales orders + forecasts)
    const demands: Array<{ item_id: string; quantity: number; required_date: string }> = [];

    if (data.includeOrders) {
      const orderDemand = this.db().prepare(`
        SELECT sol.item_id, SUM(sol.quantity - sol.delivered_quantity) as quantity,
               so.delivery_date as required_date
        FROM sales_order_lines sol
        JOIN sales_orders so ON so.id = sol.sales_order_id
        WHERE so.tenant_id = ? 
          AND so.status IN ('confirmed', 'partially_delivered')
          AND so.delivery_date <= ?
        GROUP BY sol.item_id, so.delivery_date
      `).all(tenantId, horizonDate) as Array<{ item_id: string; quantity: number; required_date: string }>;
      
      demands.push(...orderDemand);
    }

    // Calculate net requirements
    const requirements: Array<{
      itemId: string;
      itemName: string;
      grossRequirement: number;
      currentStock: number;
      scheduledReceipts: number;
      netRequirement: number;
      recommendedAction: string;
      requiredDate: string;
    }> = [];

    for (const demand of demands) {
      // Get current stock
      const stock = this.db().prepare(`
        SELECT COALESCE(SUM(CASE WHEN direction = 'in' THEN quantity ELSE -quantity END), 0) as qty
        FROM stock_moves
        WHERE tenant_id = ? AND item_id = ? AND status = 'posted'
      `).get(tenantId, demand.item_id) as { qty: number };

      // Get scheduled receipts (pending POs and production orders)
      const receipts = this.db().prepare(`
        SELECT COALESCE(SUM(pol.quantity - pol.received_quantity), 0) as qty
        FROM purchase_order_lines pol
        JOIN purchase_orders po ON po.id = pol.purchase_order_id
        WHERE po.tenant_id = ? AND pol.item_id = ? 
          AND po.status IN ('approved', 'partially_received')
      `).get(tenantId, demand.item_id) as { qty: number };

      const netReq = demand.quantity - stock.qty - receipts.qty;

      if (netReq > 0) {
        const item = this.db().prepare(`
          SELECT name, item_type FROM items WHERE id = ? AND tenant_id = ?
        `).get(demand.item_id, tenantId) as { name: string; item_type: string };

        requirements.push({
          itemId: demand.item_id,
          itemName: item?.name || 'Unknown',
          grossRequirement: demand.quantity,
          currentStock: stock.qty,
          scheduledReceipts: receipts.qty,
          netRequirement: netReq,
          recommendedAction: item?.item_type === 'manufactured' ? 'Create Production Order' : 'Create Purchase Order',
          requiredDate: demand.required_date
        });
      }
    }

    return {
      runDate: new Date().toISOString(),
      horizonDate,
      requirements: requirements.sort((a, b) => 
        new Date(a.requiredDate).getTime() - new Date(b.requiredDate).getTime()
      )
    };
  }

  // ==================== JOB WORK ====================

  createJobWorkOrder(tenantId: string, data: {
    vendorId: string;
    itemId: string;
    quantity: number;
    warehouseId: string;
    expectedDeliveryDate: string;
    processDescription: string;
    materialsToSend: Array<{
      itemId: string;
      quantity: number;
    }>;
  }, userId: string): unknown {
    const jwId = generateId();
    const docNumber = generateDocNumber('JW', this.getNextDocSequence('job_work_orders', tenantId));

    return this.db().transaction(() => {
      this.db().prepare(`
        INSERT INTO job_work_orders (
          id, tenant_id, document_number, vendor_id, item_id,
          quantity, received_quantity, warehouse_id, expected_delivery_date,
          process_description, status, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, 'draft', ?)
      `).run(
        jwId,
        tenantId,
        docNumber,
        data.vendorId,
        data.itemId,
        data.quantity,
        data.warehouseId,
        data.expectedDeliveryDate,
        data.processDescription,
        userId
      );

      // Add materials to be sent
      for (const mat of data.materialsToSend) {
        this.db().prepare(`
          INSERT INTO job_work_materials (
            id, job_work_order_id, tenant_id, item_id,
            sent_quantity, returned_quantity
          ) VALUES (?, ?, ?, ?, ?, 0)
        `).run(
          generateId(),
          jwId,
          tenantId,
          mat.itemId,
          mat.quantity
        );
      }

      return this.getJobWorkOrder(jwId, tenantId);
    })();
  }

  getJobWorkOrder(id: string, tenantId: string): unknown {
    const jw = this.db().prepare(`
      SELECT jw.*, v.name as vendor_name, i.name as item_name,
             w.name as warehouse_name
      FROM job_work_orders jw
      JOIN vendors v ON v.id = jw.vendor_id
      JOIN items i ON i.id = jw.item_id
      JOIN warehouses w ON w.id = jw.warehouse_id
      WHERE jw.id = ? AND jw.tenant_id = ?
    `).get(id, tenantId);

    if (!jw) return null;

    const materials = this.db().prepare(`
      SELECT jwm.*, i.name as item_name
      FROM job_work_materials jwm
      JOIN items i ON i.id = jwm.item_id
      WHERE jwm.job_work_order_id = ? AND jwm.tenant_id = ?
    `).all(id, tenantId);

    return { ...jw as object, materials };
  }

  // ==================== QUALITY CONTROL ====================

  createQCInspection(tenantId: string, data: {
    referenceType: 'grn' | 'production' | 'job_work';
    referenceId: string;
    itemId: string;
    quantity: number;
    inspectionType: 'incoming' | 'in_process' | 'final';
    parameters: Array<{
      name: string;
      specification: string;
      actualValue: string;
      result: 'pass' | 'fail';
    }>;
  }, userId: string): unknown {
    const qcId = generateId();
    const docNumber = generateDocNumber('QC', this.getNextDocSequence('qc_inspections', tenantId));

    return this.db().transaction(() => {
      const passedParams = data.parameters.filter(p => p.result === 'pass').length;
      const totalParams = data.parameters.length;
      const overallResult = passedParams === totalParams ? 'accepted' : 'rejected';

      this.db().prepare(`
        INSERT INTO qc_inspections (
          id, tenant_id, document_number, reference_type, reference_id,
          item_id, quantity_inspected, accepted_quantity, rejected_quantity,
          inspection_type, result, inspection_date, inspected_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?)
      `).run(
        qcId,
        tenantId,
        docNumber,
        data.referenceType,
        data.referenceId,
        data.itemId,
        data.quantity,
        overallResult === 'accepted' ? data.quantity : 0,
        overallResult === 'rejected' ? data.quantity : 0,
        data.inspectionType,
        overallResult,
        userId
      );

      // Add parameters
      for (const param of data.parameters) {
        this.db().prepare(`
          INSERT INTO qc_parameters (
            id, qc_inspection_id, tenant_id, parameter_name,
            specification, actual_value, result
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          generateId(),
          qcId,
          tenantId,
          param.name,
          param.specification,
          param.actualValue,
          param.result
        );
      }

      return this.getQCInspection(qcId, tenantId);
    })();
  }

  getQCInspection(id: string, tenantId: string): unknown {
    const qc = this.db().prepare(`
      SELECT qc.*, i.name as item_name, u.first_name || ' ' || u.last_name as inspector_name
      FROM qc_inspections qc
      JOIN items i ON i.id = qc.item_id
      LEFT JOIN users u ON u.id = qc.inspected_by
      WHERE qc.id = ? AND qc.tenant_id = ?
    `).get(id, tenantId);

    if (!qc) return null;

    const parameters = this.db().prepare(`
      SELECT * FROM qc_parameters WHERE qc_inspection_id = ? AND tenant_id = ?
    `).all(id, tenantId);

    return { ...qc as object, parameters };
  }

  // ==================== REPORTS ====================

  getProductionReport(tenantId: string, fromDate: string, toDate: string): unknown {
    return this.db().prepare(`
      SELECT 
        i.name as item_name,
        COUNT(po.id) as order_count,
        SUM(po.quantity) as planned_quantity,
        SUM(po.produced_quantity) as produced_quantity,
        SUM(CASE WHEN po.status = 'completed' THEN 1 ELSE 0 END) as completed_orders,
        AVG(
          CASE WHEN po.actual_end_date IS NOT NULL AND po.actual_start_date IS NOT NULL
          THEN julianday(po.actual_end_date) - julianday(po.actual_start_date)
          ELSE NULL END
        ) as avg_production_days
      FROM production_orders po
      JOIN items i ON i.id = po.item_id
      WHERE po.tenant_id = ?
        AND po.created_at BETWEEN ? AND ?
      GROUP BY po.item_id
      ORDER BY produced_quantity DESC
    `).all(tenantId, fromDate, toDate);
  }

  getWorkCenterLoadReport(tenantId: string, fromDate: string, toDate: string): unknown {
    return this.db().prepare(`
      SELECT 
        wc.name as work_center_name,
        wc.type as work_center_type,
        COUNT(DISTINCT poo.production_order_id) as order_count,
        SUM(poo.planned_time_minutes) as total_planned_minutes,
        SUM(poo.actual_time_minutes) as total_actual_minutes,
        wc.cost_per_hour,
        SUM(poo.actual_time_minutes / 60.0 * wc.cost_per_hour) as total_cost
      FROM production_order_operations poo
      JOIN work_centers wc ON wc.id = poo.work_center_id
      JOIN production_orders po ON po.id = poo.production_order_id
      WHERE poo.tenant_id = ?
        AND po.planned_start_date BETWEEN ? AND ?
      GROUP BY poo.work_center_id
      ORDER BY total_planned_minutes DESC
    `).all(tenantId, fromDate, toDate);
  }
}

export const manufacturingService = new ManufacturingService();

