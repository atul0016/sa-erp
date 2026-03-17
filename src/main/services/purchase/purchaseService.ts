/**
 * SA ERP - Purchase Service
 * Handles purchase operations, vendor management, and three-way matching
 */

import { BaseRepository, generateId } from '../../database/repository';
import { getDatabase } from '../../database';
import { getFinanceService } from '../finance';
import { getInventoryService } from '../inventory';
import { round, calculateGST, isInterStateTransaction } from '../../utils/helpers';

// ==================== Interfaces ====================

interface Vendor {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  gstin?: string;
  pan?: string;
  vendor_type: string;
  address: string;
  city: string;
  state: string;
  state_code: string;
  pincode: string;
  phone?: string;
  email?: string;
  payment_terms: number;
  tds_applicable: boolean;
  tds_section?: string;
  is_active: boolean;
}

interface PurchaseOrder {
  id: string;
  tenant_id: string;
  po_number: string;
  vendor_id: string;
  order_date: string;
  expected_delivery_date?: string;
  status: string;
  subtotal: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  total_amount: number;
  notes?: string;
  created_by: string;
}

interface PurchaseOrderItem {
  id: string;
  purchase_order_id: string;
  item_id: string;
  description: string;
  quantity: number;
  received_quantity: number;
  unit_price: number;
  gst_rate: number;
  hsn_code: string;
  amount: number;
}

interface GoodsReceiptNote {
  id: string;
  tenant_id: string;
  grn_number: string;
  vendor_id: string;
  purchase_order_id: string;
  grn_date: string;
  warehouse_location_id: string;
  status: string;
  total_quantity: number;
  notes?: string;
  created_by: string;
}

interface GRNItem {
  id: string;
  grn_id: string;
  po_item_id: string;
  item_id: string;
  quantity_ordered: number;
  quantity_received: number;
  unit_cost: number;
  batch_number?: string;
  expiry_date?: string;
}

interface PurchaseInvoice {
  id: string;
  tenant_id: string;
  invoice_number: string;
  vendor_invoice_number: string;
  vendor_id: string;
  purchase_order_id?: string;
  grn_id?: string;
  invoice_date: string;
  due_date: string;
  status: string;
  subtotal: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  tds_amount: number;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  three_way_match_status: string;
  created_by: string;
}

interface VendorPayment {
  id: string;
  tenant_id: string;
  payment_number: string;
  vendor_id: string;
  payment_date: string;
  payment_mode: string;
  bank_account_id?: string;
  amount: number;
  reference_number?: string;
  notes?: string;
  status: string;
  created_by: string;
}

// ==================== Repositories ====================

class VendorRepository extends BaseRepository<Vendor> {
  constructor() {
    super('vendors');
  }

  findByCode(tenantId: string, code: string): Vendor | undefined {
    return this.findOne(tenantId, { code, is_active: 1 });
  }

  search(tenantId: string, query: string, limit: number = 20): Vendor[] {
    return this.query<Vendor>(
      `SELECT * FROM ${this.tableName} 
       WHERE tenant_id = ? AND is_active = 1 
       AND (name LIKE ? OR code LIKE ? OR gstin LIKE ?)
       ORDER BY name
       LIMIT ?`,
      [tenantId, `%${query}%`, `%${query}%`, `%${query}%`, limit]
    );
  }

  getOutstandingBalance(tenantId: string, vendorId: string): number {
    const result = this.query<{ balance: number }>(
      `SELECT COALESCE(SUM(balance_due), 0) as balance 
       FROM purchase_invoices 
       WHERE tenant_id = ? AND vendor_id = ? AND status != 'cancelled'`,
      [tenantId, vendorId]
    );
    return result[0]?.balance || 0;
  }
}

class PurchaseOrderRepository extends BaseRepository<PurchaseOrder> {
  constructor() {
    super('purchase_orders');
  }

  getWithItems(id: string, tenantId: string): (PurchaseOrder & { items: PurchaseOrderItem[]; vendor: Vendor }) | undefined {
    const order = this.findById(id, tenantId);
    if (!order) return undefined;

    const items = this.query<PurchaseOrderItem>(
      `SELECT poi.*, i.name as item_name, i.sku
       FROM purchase_order_items poi
       JOIN items i ON i.id = poi.item_id
       WHERE poi.purchase_order_id = ?`,
      [id]
    );

    const vendor = this.query<Vendor>(
      `SELECT * FROM vendors WHERE id = ?`,
      [order.vendor_id]
    )[0];

    return { ...order, items, vendor };
  }

  getNextPONumber(tenantId: string): string {
    const result = this.query<{ max_num: number }>(
      `SELECT MAX(CAST(SUBSTR(po_number, 4) AS INTEGER)) as max_num
       FROM purchase_orders WHERE tenant_id = ?`,
      [tenantId]
    );
    const nextNum = (result[0]?.max_num || 0) + 1;
    return `PO/${nextNum.toString().padStart(6, '0')}`;
  }

  getPendingPOs(tenantId: string, vendorId?: string): PurchaseOrder[] {
    let sql = `SELECT * FROM purchase_orders 
               WHERE tenant_id = ? AND status IN ('approved', 'partial')`;
    const params: unknown[] = [tenantId];

    if (vendorId) {
      sql += ` AND vendor_id = ?`;
      params.push(vendorId);
    }

    sql += ` ORDER BY order_date DESC`;
    return this.query<PurchaseOrder>(sql, params);
  }
}

class GRNRepository extends BaseRepository<GoodsReceiptNote> {
  constructor() {
    super('goods_receipt_notes');
  }

  getNextGRNNumber(tenantId: string): string {
    const result = this.query<{ max_num: number }>(
      `SELECT MAX(CAST(SUBSTR(grn_number, 5) AS INTEGER)) as max_num
       FROM goods_receipt_notes WHERE tenant_id = ?`,
      [tenantId]
    );
    const nextNum = (result[0]?.max_num || 0) + 1;
    return `GRN/${nextNum.toString().padStart(6, '0')}`;
  }
}

class PurchaseInvoiceRepository extends BaseRepository<PurchaseInvoice> {
  constructor() {
    super('purchase_invoices');
  }

  getNextInvoiceNumber(tenantId: string): string {
    const result = this.query<{ max_num: number }>(
      `SELECT MAX(CAST(SUBSTR(invoice_number, 5) AS INTEGER)) as max_num
       FROM purchase_invoices WHERE tenant_id = ?`,
      [tenantId]
    );
    const nextNum = (result[0]?.max_num || 0) + 1;
    return `PBI/${nextNum.toString().padStart(6, '0')}`;
  }

  getOutstandingInvoices(tenantId: string, vendorId?: string): PurchaseInvoice[] {
    let sql = `SELECT * FROM purchase_invoices 
               WHERE tenant_id = ? AND status IN ('approved', 'partial') AND balance_due > 0`;
    const params: unknown[] = [tenantId];

    if (vendorId) {
      sql += ` AND vendor_id = ?`;
      params.push(vendorId);
    }

    sql += ` ORDER BY due_date ASC`;
    return this.query<PurchaseInvoice>(sql, params);
  }
}

class VendorPaymentRepository extends BaseRepository<VendorPayment> {
  constructor() {
    super('vendor_payments');
  }

  getNextPaymentNumber(tenantId: string): string {
    const result = this.query<{ max_num: number }>(
      `SELECT MAX(CAST(SUBSTR(payment_number, 5) AS INTEGER)) as max_num
       FROM vendor_payments WHERE tenant_id = ?`,
      [tenantId]
    );
    const nextNum = (result[0]?.max_num || 0) + 1;
    return `PAY/${nextNum.toString().padStart(6, '0')}`;
  }
}

// ==================== Service ====================

export class PurchaseService {
  private vendorRepo: VendorRepository;
  private poRepo: PurchaseOrderRepository;
  private grnRepo: GRNRepository;
  private invoiceRepo: PurchaseInvoiceRepository;
  private paymentRepo: VendorPaymentRepository;

  constructor() {
    this.vendorRepo = new VendorRepository();
    this.poRepo = new PurchaseOrderRepository();
    this.grnRepo = new GRNRepository();
    this.invoiceRepo = new PurchaseInvoiceRepository();
    this.paymentRepo = new VendorPaymentRepository();
  }

  // ==================== Vendors ====================

  createVendor(tenantId: string, data: Partial<Vendor>): Vendor {
    const vendor: Partial<Vendor> = {
      id: generateId(),
      tenant_id: tenantId,
      ...data,
      payment_terms: data.payment_terms || 30,
      tds_applicable: data.tds_applicable || false,
      is_active: true
    };
    return this.vendorRepo.create(vendor);
  }

  updateVendor(id: string, tenantId: string, data: Partial<Vendor>): Vendor | undefined {
    return this.vendorRepo.update(id, data, tenantId);
  }

  getVendor(id: string, tenantId: string): Vendor | undefined {
    return this.vendorRepo.findById(id, tenantId);
  }

  searchVendors(tenantId: string, query: string): Vendor[] {
    return this.vendorRepo.search(tenantId, query);
  }

  getVendorBalance(tenantId: string, vendorId: string): number {
    return this.vendorRepo.getOutstandingBalance(tenantId, vendorId);
  }

  // ==================== Purchase Orders ====================

  createPurchaseOrder(
    tenantId: string,
    data: {
      vendor_id: string;
      order_date: string;
      expected_delivery_date?: string;
      items: Array<{
        item_id: string;
        description: string;
        quantity: number;
        unit_price: number;
        gst_rate: number;
        hsn_code: string;
      }>;
      notes?: string;
    },
    createdBy: string
  ): PurchaseOrder {
    const db = getDatabase();

    return db.transaction(() => {
      const poId = generateId();
      const poNumber = this.poRepo.getNextPONumber(tenantId);

      // Get vendor for GST calculation
      const vendor = this.vendorRepo.findById(data.vendor_id, tenantId);
      if (!vendor) {
        throw new Error('Vendor not found');
      }

      // Get tenant state code
      const tenant = db.prepare('SELECT state_code FROM tenants WHERE id = ?').get(tenantId) as { state_code: string };
      const isInterState = isInterStateTransaction(tenant.state_code, vendor.state_code);

      // Calculate totals
      let subtotal = 0;
      let totalCgst = 0;
      let totalSgst = 0;
      let totalIgst = 0;

      const itemsWithCalculations = data.items.map(item => {
        const amount = round(item.unit_price * item.quantity);
        const gst = calculateGST(amount, item.gst_rate, isInterState);

        subtotal += amount;
        totalCgst += gst.cgst;
        totalSgst += gst.sgst;
        totalIgst += gst.igst;

        return {
          id: generateId(),
          purchase_order_id: poId,
          ...item,
          received_quantity: 0,
          amount
        };
      });

      const totalAmount = round(subtotal + totalCgst + totalSgst + totalIgst);

      // Insert purchase order
      db.prepare(`
        INSERT INTO purchase_orders (
          id, tenant_id, po_number, vendor_id, order_date, expected_delivery_date,
          status, subtotal, cgst_amount, sgst_amount, igst_amount,
          total_amount, notes, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(
        poId, tenantId, poNumber, data.vendor_id, data.order_date,
        data.expected_delivery_date || null, subtotal, totalCgst, totalSgst,
        totalIgst, totalAmount, data.notes || null, createdBy
      );

      // Insert PO items
      const itemStmt = db.prepare(`
        INSERT INTO purchase_order_items (
          id, purchase_order_id, item_id, description, quantity, received_quantity,
          unit_price, gst_rate, hsn_code, amount
        ) VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?)
      `);

      for (const item of itemsWithCalculations) {
        itemStmt.run(
          item.id, item.purchase_order_id, item.item_id, item.description,
          item.quantity, item.unit_price, item.gst_rate, item.hsn_code, item.amount
        );
      }

      return this.poRepo.findById(poId, tenantId) as PurchaseOrder;
    })();
  }

  getPurchaseOrder(id: string, tenantId: string) {
    return this.poRepo.getWithItems(id, tenantId);
  }

  approvePurchaseOrder(id: string, tenantId: string): boolean {
    const result = getDatabase().prepare(
      `UPDATE purchase_orders SET status = 'approved' WHERE id = ? AND tenant_id = ? AND status = 'draft'`
    ).run(id, tenantId);
    return result.changes > 0;
  }

  getPendingPurchaseOrders(tenantId: string, vendorId?: string): PurchaseOrder[] {
    return this.poRepo.getPendingPOs(tenantId, vendorId);
  }

  // ==================== Goods Receipt Note (GRN) ====================

  createGRN(
    tenantId: string,
    data: {
      vendor_id: string;
      purchase_order_id: string;
      grn_date: string;
      warehouse_location_id: string;
      items: Array<{
        po_item_id: string;
        item_id: string;
        quantity_received: number;
        unit_cost: number;
        batch_number?: string;
        expiry_date?: string;
      }>;
      notes?: string;
    },
    createdBy: string
  ): GoodsReceiptNote {
    const db = getDatabase();

    return db.transaction(() => {
      const grnId = generateId();
      const grnNumber = this.grnRepo.getNextGRNNumber(tenantId);

      // Validate PO exists and is approved
      const po = this.poRepo.findById(data.purchase_order_id, tenantId);
      if (!po || !['approved', 'partial'].includes(po.status)) {
        throw new Error('Invalid or unapproved purchase order');
      }

      let totalQuantity = 0;

      // Insert GRN
      db.prepare(`
        INSERT INTO goods_receipt_notes (
          id, tenant_id, grn_number, vendor_id, purchase_order_id, grn_date,
          warehouse_location_id, status, total_quantity, notes, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', 0, ?, ?, datetime('now'))
      `).run(
        grnId, tenantId, grnNumber, data.vendor_id, data.purchase_order_id,
        data.grn_date, data.warehouse_location_id, data.notes || null, createdBy
      );

      // Insert GRN items and create stock moves
      const itemStmt = db.prepare(`
        INSERT INTO grn_items (
          id, grn_id, po_item_id, item_id, quantity_ordered, quantity_received,
          unit_cost, batch_number, expiry_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const item of data.items) {
        // Get PO item details
        const poItem = db.prepare(
          `SELECT * FROM purchase_order_items WHERE id = ?`
        ).get(item.po_item_id) as PurchaseOrderItem;

        if (!poItem) {
          throw new Error(`PO item not found: ${item.po_item_id}`);
        }

        // Insert GRN item
        itemStmt.run(
          generateId(), grnId, item.po_item_id, item.item_id,
          poItem.quantity, item.quantity_received, item.unit_cost,
          item.batch_number || null, item.expiry_date || null
        );

        totalQuantity += item.quantity_received;

        // Create stock move (receive stock)
        getInventoryService().receiveStock(
          tenantId,
          {
            item_id: item.item_id,
            quantity: item.quantity_received,
            unit_cost: item.unit_cost,
            destination_location_id: data.warehouse_location_id,
            reference_type: 'grn',
            reference_id: grnId,
            batch_number: item.batch_number,
            expiry_date: item.expiry_date
          },
          createdBy
        );

        // Update PO item received quantity
        db.prepare(`
          UPDATE purchase_order_items 
          SET received_quantity = received_quantity + ?
          WHERE id = ?
        `).run(item.quantity_received, item.po_item_id);
      }

      // Update GRN total quantity
      db.prepare(`UPDATE goods_receipt_notes SET total_quantity = ? WHERE id = ?`)
        .run(totalQuantity, grnId);

      // Update PO status based on total received
      this.updatePOStatusAfterGRN(data.purchase_order_id, tenantId);

      // Confirm GRN
      db.prepare(`UPDATE goods_receipt_notes SET status = 'completed' WHERE id = ?`).run(grnId);

      return this.grnRepo.findById(grnId, tenantId) as GoodsReceiptNote;
    })();
  }

  private updatePOStatusAfterGRN(poId: string, tenantId: string) {
    const db = getDatabase();

    const result = db.prepare(`
      SELECT 
        SUM(quantity) as total_ordered,
        SUM(received_quantity) as total_received
      FROM purchase_order_items
      WHERE purchase_order_id = ?
    `).get(poId) as { total_ordered: number; total_received: number };

    let newStatus = 'partial';
    if (result.total_received >= result.total_ordered) {
      newStatus = 'received';
    }

    db.prepare(`UPDATE purchase_orders SET status = ? WHERE id = ? AND tenant_id = ?`)
      .run(newStatus, poId, tenantId);
  }

  // ==================== Purchase Invoices ====================

  createPurchaseInvoice(
    tenantId: string,
    data: {
      vendor_id: string;
      vendor_invoice_number: string;
      purchase_order_id?: string;
      grn_id?: string;
      invoice_date: string;
      due_date: string;
      items: Array<{
        item_id: string;
        description: string;
        quantity: number;
        unit_price: number;
        gst_rate: number;
        hsn_code: string;
      }>;
    },
    createdBy: string
  ): PurchaseInvoice {
    const db = getDatabase();

    return db.transaction(() => {
      const invoiceId = generateId();
      const invoiceNumber = this.invoiceRepo.getNextInvoiceNumber(tenantId);

      // Get vendor
      const vendor = this.vendorRepo.findById(data.vendor_id, tenantId);
      if (!vendor) {
        throw new Error('Vendor not found');
      }

      // Get tenant state code
      const tenant = db.prepare('SELECT state_code FROM tenants WHERE id = ?').get(tenantId) as { state_code: string };
      const isInterState = isInterStateTransaction(tenant.state_code, vendor.state_code);

      // Calculate totals
      let subtotal = 0;
      let totalCgst = 0;
      let totalSgst = 0;
      let totalIgst = 0;

      const itemsWithCalculations = data.items.map(item => {
        const amount = round(item.unit_price * item.quantity);
        const gst = calculateGST(amount, item.gst_rate, isInterState);

        subtotal += amount;
        totalCgst += gst.cgst;
        totalSgst += gst.sgst;
        totalIgst += gst.igst;

        return {
          id: generateId(),
          purchase_invoice_id: invoiceId,
          ...item,
          amount,
          cgst_amount: gst.cgst,
          sgst_amount: gst.sgst,
          igst_amount: gst.igst
        };
      });

      // Calculate TDS if applicable
      let tdsAmount = 0;
      if (vendor.tds_applicable && vendor.tds_section) {
        const tdsRate = this.getTDSRate(vendor.tds_section);
        tdsAmount = round(subtotal * tdsRate / 100);
      }

      const totalAmount = round(subtotal + totalCgst + totalSgst + totalIgst - tdsAmount);

      // Determine three-way match status
      let matchStatus = 'not_applicable';
      if (data.purchase_order_id && data.grn_id) {
        matchStatus = this.performThreeWayMatch(data.purchase_order_id, data.grn_id, data.items)
          ? 'matched' : 'unmatched';
      }

      // Insert purchase invoice
      db.prepare(`
        INSERT INTO purchase_invoices (
          id, tenant_id, invoice_number, vendor_invoice_number, vendor_id,
          purchase_order_id, grn_id, invoice_date, due_date, status, subtotal,
          cgst_amount, sgst_amount, igst_amount, tds_amount, total_amount,
          amount_paid, balance_due, three_way_match_status, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, datetime('now'))
      `).run(
        invoiceId, tenantId, invoiceNumber, data.vendor_invoice_number, data.vendor_id,
        data.purchase_order_id || null, data.grn_id || null, data.invoice_date, data.due_date,
        subtotal, totalCgst, totalSgst, totalIgst, tdsAmount, totalAmount, totalAmount,
        matchStatus, createdBy
      );

      // Insert invoice items
      const itemStmt = db.prepare(`
        INSERT INTO purchase_invoice_items (
          id, purchase_invoice_id, item_id, description, quantity, unit_price,
          gst_rate, hsn_code, amount, cgst_amount, sgst_amount, igst_amount
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const item of itemsWithCalculations) {
        itemStmt.run(
          item.id, item.purchase_invoice_id, item.item_id, item.description,
          item.quantity, item.unit_price, item.gst_rate, item.hsn_code,
          item.amount, item.cgst_amount, item.sgst_amount, item.igst_amount
        );
      }

      // Create journal entry
      getFinanceService().createPurchaseInvoiceEntry(
        tenantId,
        {
          id: invoiceId,
          invoice_number: invoiceNumber,
          date: data.invoice_date,
          vendor_id: data.vendor_id,
          total_amount: subtotal,
          cgst_amount: totalCgst,
          sgst_amount: totalSgst,
          igst_amount: totalIgst
        },
        createdBy
      );

      return this.invoiceRepo.findById(invoiceId, tenantId) as PurchaseInvoice;
    })();
  }

  private performThreeWayMatch(
    poId: string,
    grnId: string,
    invoiceItems: Array<{ item_id: string; quantity: number; unit_price: number }>
  ): boolean {
    const db = getDatabase();

    // Get PO items
    const poItems = db.prepare(
      `SELECT item_id, quantity, unit_price FROM purchase_order_items WHERE purchase_order_id = ?`
    ).all(poId) as Array<{ item_id: string; quantity: number; unit_price: number }>;

    // Get GRN items
    const grnItems = db.prepare(
      `SELECT item_id, quantity_received FROM grn_items WHERE grn_id = ?`
    ).all(grnId) as Array<{ item_id: string; quantity_received: number }>;

    // Check if invoice matches PO and GRN
    for (const invItem of invoiceItems) {
      const poItem = poItems.find(p => p.item_id === invItem.item_id);
      const grnItem = grnItems.find(g => g.item_id === invItem.item_id);

      if (!poItem || !grnItem) return false;

      // Allow 2% tolerance
      const qtyTolerance = poItem.quantity * 0.02;
      const priceTolerance = poItem.unit_price * 0.02;

      if (Math.abs(invItem.quantity - grnItem.quantity_received) > qtyTolerance) return false;
      if (Math.abs(invItem.unit_price - poItem.unit_price) > priceTolerance) return false;
    }

    return true;
  }

  private getTDSRate(section: string): number {
    const tdsRates: Record<string, number> = {
      '194A': 10,
      '194C': 1,
      '194H': 5,
      '194I': 10,
      '194J': 10,
      '194Q': 0.1
    };
    return tdsRates[section] || 0;
  }

  getOutstandingInvoices(tenantId: string, vendorId?: string): PurchaseInvoice[] {
    return this.invoiceRepo.getOutstandingInvoices(tenantId, vendorId);
  }

  // ==================== Vendor Payments ====================

  createVendorPayment(
    tenantId: string,
    data: {
      vendor_id: string;
      payment_date: string;
      payment_mode: string;
      bank_account_id?: string;
      amount: number;
      reference_number?: string;
      notes?: string;
      invoice_allocations: Array<{ invoice_id: string; amount: number }>;
    },
    createdBy: string
  ): VendorPayment {
    const db = getDatabase();

    return db.transaction(() => {
      const paymentId = generateId();
      const paymentNumber = this.paymentRepo.getNextPaymentNumber(tenantId);

      // Insert payment
      db.prepare(`
        INSERT INTO vendor_payments (
          id, tenant_id, payment_number, vendor_id, payment_date, payment_mode,
          bank_account_id, amount, reference_number, notes, status, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, datetime('now'))
      `).run(
        paymentId, tenantId, paymentNumber, data.vendor_id, data.payment_date,
        data.payment_mode, data.bank_account_id || null, data.amount,
        data.reference_number || null, data.notes || null, createdBy
      );

      // Allocate to invoices
      for (const allocation of data.invoice_allocations) {
        // Insert allocation record
        db.prepare(`
          INSERT INTO payment_allocations (id, payment_id, invoice_id, amount)
          VALUES (?, ?, ?, ?)
        `).run(generateId(), paymentId, allocation.invoice_id, allocation.amount);

        // Update invoice
        db.prepare(`
          UPDATE purchase_invoices 
          SET amount_paid = amount_paid + ?,
              balance_due = balance_due - ?,
              status = CASE WHEN balance_due - ? <= 0 THEN 'paid' ELSE 'partial' END
          WHERE id = ? AND tenant_id = ?
        `).run(allocation.amount, allocation.amount, allocation.amount, allocation.invoice_id, tenantId);
      }

      return this.paymentRepo.findById(paymentId, tenantId) as VendorPayment;
    })();
  }

  // ==================== Reports ====================

  getPurchaseReport(tenantId: string, fromDate: string, toDate: string) {
    const db = getDatabase();

    const summary = db.prepare(`
      SELECT 
        COUNT(*) as total_invoices,
        COALESCE(SUM(total_amount), 0) as total_purchases,
        COALESCE(SUM(cgst_amount + sgst_amount + igst_amount), 0) as total_gst,
        COALESCE(SUM(tds_amount), 0) as total_tds,
        COALESCE(SUM(amount_paid), 0) as total_paid,
        COALESCE(SUM(balance_due), 0) as total_outstanding
      FROM purchase_invoices
      WHERE tenant_id = ? AND invoice_date BETWEEN ? AND ? AND status != 'cancelled'
    `).get(tenantId, fromDate, toDate);

    const byVendor = db.prepare(`
      SELECT 
        v.name as vendor_name,
        COUNT(*) as invoice_count,
        SUM(pi.total_amount) as total_purchases
      FROM purchase_invoices pi
      JOIN vendors v ON v.id = pi.vendor_id
      WHERE pi.tenant_id = ? AND pi.invoice_date BETWEEN ? AND ? AND pi.status != 'cancelled'
      GROUP BY pi.vendor_id
      ORDER BY total_purchases DESC
    `).all(tenantId, fromDate, toDate);

    return { summary, byVendor };
  }

  getAgingReport(tenantId: string) {
    const db = getDatabase();

    return db.prepare(`
      SELECT 
        v.name as vendor_name,
        SUM(CASE WHEN julianday('now') - julianday(pi.due_date) < 0 THEN pi.balance_due ELSE 0 END) as current,
        SUM(CASE WHEN julianday('now') - julianday(pi.due_date) BETWEEN 0 AND 30 THEN pi.balance_due ELSE 0 END) as days_1_30,
        SUM(CASE WHEN julianday('now') - julianday(pi.due_date) BETWEEN 31 AND 60 THEN pi.balance_due ELSE 0 END) as days_31_60,
        SUM(CASE WHEN julianday('now') - julianday(pi.due_date) BETWEEN 61 AND 90 THEN pi.balance_due ELSE 0 END) as days_61_90,
        SUM(CASE WHEN julianday('now') - julianday(pi.due_date) > 90 THEN pi.balance_due ELSE 0 END) as over_90,
        SUM(pi.balance_due) as total
      FROM purchase_invoices pi
      JOIN vendors v ON v.id = pi.vendor_id
      WHERE pi.tenant_id = ? AND pi.balance_due > 0 AND pi.status != 'cancelled'
      GROUP BY pi.vendor_id
      ORDER BY total DESC
    `).all(tenantId);
  }

  // List methods
  getAllPurchaseOrders(tenantId: string): PurchaseOrder[] {
    return getDatabase().prepare(
      `SELECT po.*, v.name as vendor_name 
       FROM purchase_orders po
       JOIN vendors v ON v.id = po.vendor_id
       WHERE po.tenant_id = ?
       ORDER BY po.order_date DESC`
    ).all(tenantId) as PurchaseOrder[];
  }

  getAllPurchaseInvoices(tenantId: string): PurchaseInvoice[] {
    return getDatabase().prepare(
      `SELECT pi.*, v.name as vendor_name 
       FROM purchase_invoices pi
       JOIN vendors v ON v.id = pi.vendor_id
       WHERE pi.tenant_id = ?
       ORDER BY pi.invoice_date DESC`
    ).all(tenantId) as PurchaseInvoice[];
  }

  getAllGoodsReceiptNotes(tenantId: string): GoodsReceiptNote[] {
    return getDatabase().prepare(
      `SELECT g.*, v.name as vendor_name, po.po_number
       FROM goods_receipt_notes g
       JOIN vendors v ON v.id = g.vendor_id
       JOIN purchase_orders po ON po.id = g.purchase_order_id
       WHERE g.tenant_id = ?
       ORDER BY g.grn_date DESC`
    ).all(tenantId) as GoodsReceiptNote[];
  }

  getAllVendorPayments(tenantId: string): VendorPayment[] {
    return getDatabase().prepare(
      `SELECT vp.*, v.name as vendor_name
       FROM vendor_payments vp
       JOIN vendors v ON v.id = vp.vendor_id
       WHERE vp.tenant_id = ?
       ORDER BY vp.payment_date DESC`
    ).all(tenantId) as VendorPayment[];
  }
}

// Export singleton instance (lazy initialization)
let _purchaseService: PurchaseService | null = null;
export const getPurchaseService = (): PurchaseService => {
  if (!_purchaseService) {
    _purchaseService = new PurchaseService();
  }
  return _purchaseService;
};

// For backward compatibility - use getPurchaseService() instead
export { getPurchaseService as purchaseService };

