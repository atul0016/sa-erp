/**
 * SA ERP - Sales Service
 * Handles sales operations, invoicing, and customer management
 */

import { BaseRepository, generateId } from '../../database/repository';
import { getDatabase } from '../../database';
import { getFinanceService } from '../finance';
import { getInventoryService } from '../inventory';
import { round, calculateGST, isInterStateTransaction, formatDateForDb } from '../../utils/helpers';

// ==================== Repositories ====================

interface Customer {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  gstin?: string;
  pan?: string;
  customer_type: string;
  billing_address: string;
  billing_city: string;
  billing_state: string;
  billing_state_code: string;
  billing_pincode: string;
  phone?: string;
  email?: string;
  credit_limit: number;
  payment_terms: number;
  is_active: boolean;
}

interface SalesOrder {
  id: string;
  tenant_id: string;
  order_number: string;
  customer_id: string;
  order_date: string;
  expected_delivery_date?: string;
  status: string;
  subtotal: number;
  discount_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  total_amount: number;
  notes?: string;
  created_by: string;
}

interface SalesOrderItem {
  id: string;
  sales_order_id: string;
  item_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  gst_rate: number;
  hsn_code: string;
  amount: number;
}

interface SalesInvoice {
  id: string;
  tenant_id: string;
  invoice_number: string;
  customer_id: string;
  sales_order_id?: string;
  invoice_date: string;
  due_date: string;
  status: string;
  subtotal: number;
  discount_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  e_invoice_irn?: string;
  e_invoice_ack_number?: string;
  e_invoice_ack_date?: string;
  created_by: string;
}

interface SalesInvoiceItem {
  id: string;
  sales_invoice_id: string;
  item_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  gst_rate: number;
  hsn_code: string;
  amount: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
}

interface CustomerReceipt {
  id: string;
  tenant_id: string;
  receipt_number: string;
  customer_id: string;
  receipt_date: string;
  payment_mode: string;
  bank_account_id?: string;
  amount: number;
  reference_number?: string;
  notes?: string;
  status: string;
  created_by: string;
}

class CustomerRepository extends BaseRepository<Customer> {
  constructor() {
    super('customers');
  }

  findByCode(tenantId: string, code: string): Customer | undefined {
    return this.findOne(tenantId, { code, is_active: 1 });
  }

  findByGstin(tenantId: string, gstin: string): Customer | undefined {
    return this.findOne(tenantId, { gstin, is_active: 1 });
  }

  search(tenantId: string, query: string, limit: number = 20): Customer[] {
    return this.query<Customer>(
      `SELECT * FROM ${this.tableName} 
       WHERE tenant_id = ? AND is_active = 1 
       AND (name LIKE ? OR code LIKE ? OR gstin LIKE ?)
       ORDER BY name
       LIMIT ?`,
      [tenantId, `%${query}%`, `%${query}%`, `%${query}%`, limit]
    );
  }

  getOutstandingBalance(tenantId: string, customerId: string): number {
    const result = this.query<{ balance: number }>(
      `SELECT COALESCE(SUM(balance_due), 0) as balance 
       FROM sales_invoices 
       WHERE tenant_id = ? AND customer_id = ? AND status != 'cancelled'`,
      [tenantId, customerId]
    );
    return result[0]?.balance || 0;
  }
}

class SalesOrderRepository extends BaseRepository<SalesOrder> {
  constructor() {
    super('sales_orders');
  }

  getWithItems(id: string, tenantId: string): (SalesOrder & { items: SalesOrderItem[]; customer: Customer }) | undefined {
    const order = this.findById(id, tenantId);
    if (!order) return undefined;

    const items = this.query<SalesOrderItem>(
      `SELECT soi.*, i.name as item_name, i.sku
       FROM sales_order_items soi
       JOIN items i ON i.id = soi.item_id
       WHERE soi.sales_order_id = ?`,
      [id]
    );

    const customer = this.query<Customer>(
      `SELECT * FROM customers WHERE id = ?`,
      [order.customer_id]
    )[0];

    return { ...order, items, customer };
  }

  getNextOrderNumber(tenantId: string): string {
    const result = this.query<{ max_num: number }>(
      `SELECT MAX(CAST(SUBSTR(order_number, 4) AS INTEGER)) as max_num
       FROM sales_orders WHERE tenant_id = ?`,
      [tenantId]
    );
    const nextNum = (result[0]?.max_num || 0) + 1;
    return `SO/${nextNum.toString().padStart(6, '0')}`;
  }
}

class SalesInvoiceRepository extends BaseRepository<SalesInvoice> {
  constructor() {
    super('sales_invoices');
  }

  getWithItems(id: string, tenantId: string): (SalesInvoice & { items: SalesInvoiceItem[]; customer: Customer }) | undefined {
    const invoice = this.findById(id, tenantId);
    if (!invoice) return undefined;

    const items = this.query<SalesInvoiceItem>(
      `SELECT sii.*, i.name as item_name, i.sku
       FROM sales_invoice_items sii
       JOIN items i ON i.id = sii.item_id
       WHERE sii.sales_invoice_id = ?`,
      [id]
    );

    const customer = this.query<Customer>(
      `SELECT * FROM customers WHERE id = ?`,
      [invoice.customer_id]
    )[0];

    return { ...invoice, items, customer };
  }

  getNextInvoiceNumber(tenantId: string): string {
    const result = this.query<{ max_num: number }>(
      `SELECT MAX(CAST(SUBSTR(invoice_number, 5) AS INTEGER)) as max_num
       FROM sales_invoices WHERE tenant_id = ?`,
      [tenantId]
    );
    const nextNum = (result[0]?.max_num || 0) + 1;
    return `INV/${nextNum.toString().padStart(6, '0')}`;
  }

  getOutstandingInvoices(tenantId: string, customerId?: string): SalesInvoice[] {
    let sql = `SELECT * FROM sales_invoices 
               WHERE tenant_id = ? AND status IN ('draft', 'sent', 'partial') AND balance_due > 0`;
    const params: unknown[] = [tenantId];

    if (customerId) {
      sql += ` AND customer_id = ?`;
      params.push(customerId);
    }

    sql += ` ORDER BY due_date ASC`;
    return this.query<SalesInvoice>(sql, params);
  }
}

class CustomerReceiptRepository extends BaseRepository<CustomerReceipt> {
  constructor() {
    super('customer_receipts');
  }

  getNextReceiptNumber(tenantId: string): string {
    const result = this.query<{ max_num: number }>(
      `SELECT MAX(CAST(SUBSTR(receipt_number, 5) AS INTEGER)) as max_num
       FROM customer_receipts WHERE tenant_id = ?`,
      [tenantId]
    );
    const nextNum = (result[0]?.max_num || 0) + 1;
    return `RCT/${nextNum.toString().padStart(6, '0')}`;
  }
}

// ==================== Service ====================

export class SalesService {
  private customerRepo: CustomerRepository;
  private salesOrderRepo: SalesOrderRepository;
  private invoiceRepo: SalesInvoiceRepository;
  private receiptRepo: CustomerReceiptRepository;

  constructor() {
    this.customerRepo = new CustomerRepository();
    this.salesOrderRepo = new SalesOrderRepository();
    this.invoiceRepo = new SalesInvoiceRepository();
    this.receiptRepo = new CustomerReceiptRepository();
  }

  // ==================== Customers ====================

  createCustomer(tenantId: string, data: Partial<Customer>): Customer {
    const customer: Partial<Customer> = {
      id: generateId(),
      tenant_id: tenantId,
      ...data,
      credit_limit: data.credit_limit || 0,
      payment_terms: data.payment_terms || 30,
      is_active: true
    };
    return this.customerRepo.create(customer);
  }

  updateCustomer(id: string, tenantId: string, data: Partial<Customer>): Customer | undefined {
    return this.customerRepo.update(id, data, tenantId);
  }

  getCustomer(id: string, tenantId: string): Customer | undefined {
    return this.customerRepo.findById(id, tenantId);
  }

  searchCustomers(tenantId: string, query: string): Customer[] {
    return this.customerRepo.search(tenantId, query);
  }

  getCustomerBalance(tenantId: string, customerId: string): number {
    return this.customerRepo.getOutstandingBalance(tenantId, customerId);
  }

  // ==================== Sales Orders ====================

  createSalesOrder(
    tenantId: string,
    data: {
      customer_id: string;
      order_date: string;
      expected_delivery_date?: string;
      items: Array<{
        item_id: string;
        description: string;
        quantity: number;
        unit_price: number;
        discount_percent?: number;
        gst_rate: number;
        hsn_code: string;
      }>;
      notes?: string;
    },
    createdBy: string
  ): SalesOrder {
    const db = getDatabase();

    return db.transaction(() => {
      const orderId = generateId();
      const orderNumber = this.salesOrderRepo.getNextOrderNumber(tenantId);

      // Get customer for GST calculation
      const customer = this.customerRepo.findById(data.customer_id, tenantId);
      if (!customer) {
        throw new Error('Customer not found');
      }

      // Get tenant state code
      const tenant = db.prepare('SELECT state_code FROM tenants WHERE id = ?').get(tenantId) as { state_code: string };
      const isInterState = isInterStateTransaction(tenant.state_code, customer.billing_state_code);

      // Calculate totals
      let subtotal = 0;
      let totalCgst = 0;
      let totalSgst = 0;
      let totalIgst = 0;

      const itemsWithCalculations = data.items.map(item => {
        const discountAmount = round(item.unit_price * item.quantity * (item.discount_percent || 0) / 100);
        const amount = round(item.unit_price * item.quantity - discountAmount);
        const gst = calculateGST(amount, item.gst_rate, isInterState);

        subtotal += amount;
        totalCgst += gst.cgst;
        totalSgst += gst.sgst;
        totalIgst += gst.igst;

        return {
          id: generateId(),
          sales_order_id: orderId,
          ...item,
          discount_percent: item.discount_percent || 0,
          amount
        };
      });

      const totalAmount = round(subtotal + totalCgst + totalSgst + totalIgst);

      // Insert sales order
      db.prepare(`
        INSERT INTO sales_orders (
          id, tenant_id, order_number, customer_id, order_date, expected_delivery_date,
          status, subtotal, discount_amount, cgst_amount, sgst_amount, igst_amount,
          total_amount, notes, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'draft', ?, 0, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(
        orderId, tenantId, orderNumber, data.customer_id, data.order_date,
        data.expected_delivery_date || null, subtotal, totalCgst, totalSgst,
        totalIgst, totalAmount, data.notes || null, createdBy
      );

      // Insert order items
      const itemStmt = db.prepare(`
        INSERT INTO sales_order_items (
          id, sales_order_id, item_id, description, quantity, unit_price,
          discount_percent, gst_rate, hsn_code, amount
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const item of itemsWithCalculations) {
        itemStmt.run(
          item.id, item.sales_order_id, item.item_id, item.description,
          item.quantity, item.unit_price, item.discount_percent,
          item.gst_rate, item.hsn_code, item.amount
        );
      }

      return this.salesOrderRepo.findById(orderId, tenantId) as SalesOrder;
    })();
  }

  getSalesOrder(id: string, tenantId: string) {
    return this.salesOrderRepo.getWithItems(id, tenantId);
  }

  confirmSalesOrder(id: string, tenantId: string): boolean {
    const result = getDatabase().prepare(
      `UPDATE sales_orders SET status = 'confirmed' WHERE id = ? AND tenant_id = ? AND status = 'draft'`
    ).run(id, tenantId);
    return result.changes > 0;
  }

  // ==================== Sales Invoices ====================

  createSalesInvoice(
    tenantId: string,
    data: {
      customer_id: string;
      sales_order_id?: string;
      invoice_date: string;
      due_date: string;
      items: Array<{
        item_id: string;
        description: string;
        quantity: number;
        unit_price: number;
        discount_percent?: number;
        gst_rate: number;
        hsn_code: string;
      }>;
      warehouse_location_id: string; // For stock deduction
    },
    createdBy: string
  ): SalesInvoice {
    const db = getDatabase();

    return db.transaction(() => {
      const invoiceId = generateId();
      const invoiceNumber = this.invoiceRepo.getNextInvoiceNumber(tenantId);

      // Get customer
      const customer = this.customerRepo.findById(data.customer_id, tenantId);
      if (!customer) {
        throw new Error('Customer not found');
      }

      // Get tenant state code
      const tenant = db.prepare('SELECT state_code FROM tenants WHERE id = ?').get(tenantId) as { state_code: string };
      const isInterState = isInterStateTransaction(tenant.state_code, customer.billing_state_code);

      // Calculate totals
      let subtotal = 0;
      let totalCgst = 0;
      let totalSgst = 0;
      let totalIgst = 0;

      const itemsWithCalculations = data.items.map(item => {
        const discountAmount = round(item.unit_price * item.quantity * (item.discount_percent || 0) / 100);
        const amount = round(item.unit_price * item.quantity - discountAmount);
        const gst = calculateGST(amount, item.gst_rate, isInterState);

        subtotal += amount;
        totalCgst += gst.cgst;
        totalSgst += gst.sgst;
        totalIgst += gst.igst;

        return {
          id: generateId(),
          sales_invoice_id: invoiceId,
          ...item,
          discount_percent: item.discount_percent || 0,
          amount,
          cgst_amount: gst.cgst,
          sgst_amount: gst.sgst,
          igst_amount: gst.igst
        };
      });

      const totalAmount = round(subtotal + totalCgst + totalSgst + totalIgst);

      // Insert sales invoice
      db.prepare(`
        INSERT INTO sales_invoices (
          id, tenant_id, invoice_number, customer_id, sales_order_id, invoice_date, due_date,
          status, subtotal, discount_amount, cgst_amount, sgst_amount, igst_amount,
          total_amount, amount_paid, balance_due, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', ?, 0, ?, ?, ?, ?, 0, ?, ?, datetime('now'))
      `).run(
        invoiceId, tenantId, invoiceNumber, data.customer_id, data.sales_order_id || null,
        data.invoice_date, data.due_date, subtotal, totalCgst, totalSgst, totalIgst,
        totalAmount, totalAmount, createdBy
      );

      // Insert invoice items
      const itemStmt = db.prepare(`
        INSERT INTO sales_invoice_items (
          id, sales_invoice_id, item_id, description, quantity, unit_price,
          discount_percent, gst_rate, hsn_code, amount, cgst_amount, sgst_amount, igst_amount
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const item of itemsWithCalculations) {
        itemStmt.run(
          item.id, item.sales_invoice_id, item.item_id, item.description,
          item.quantity, item.unit_price, item.discount_percent,
          item.gst_rate, item.hsn_code, item.amount,
          item.cgst_amount, item.sgst_amount, item.igst_amount
        );

        // Issue stock
        getInventoryService().issueStock(
          tenantId,
          {
            item_id: item.item_id,
            quantity: item.quantity,
            source_location_id: data.warehouse_location_id,
            reference_type: 'sales_invoice',
            reference_id: invoiceId
          },
          createdBy
        );
      }

      // Create journal entry for the invoice
      getFinanceService().createSalesInvoiceEntry(
        tenantId,
        {
          id: invoiceId,
          invoice_number: invoiceNumber,
          date: data.invoice_date,
          customer_id: data.customer_id,
          total_amount: subtotal,
          cgst_amount: totalCgst,
          sgst_amount: totalSgst,
          igst_amount: totalIgst
        },
        createdBy
      );

      // Update sales order status if linked
      if (data.sales_order_id) {
        db.prepare(
          `UPDATE sales_orders SET status = 'invoiced' WHERE id = ? AND tenant_id = ?`
        ).run(data.sales_order_id, tenantId);
      }

      return this.invoiceRepo.findById(invoiceId, tenantId) as SalesInvoice;
    })();
  }

  getSalesInvoice(id: string, tenantId: string) {
    return this.invoiceRepo.getWithItems(id, tenantId);
  }

  getOutstandingInvoices(tenantId: string, customerId?: string): SalesInvoice[] {
    return this.invoiceRepo.getOutstandingInvoices(tenantId, customerId);
  }

  // ==================== Customer Receipts ====================

  createCustomerReceipt(
    tenantId: string,
    data: {
      customer_id: string;
      receipt_date: string;
      payment_mode: string;
      bank_account_id?: string;
      amount: number;
      reference_number?: string;
      notes?: string;
      invoice_allocations: Array<{ invoice_id: string; amount: number }>;
    },
    createdBy: string
  ): CustomerReceipt {
    const db = getDatabase();

    return db.transaction(() => {
      const receiptId = generateId();
      const receiptNumber = this.receiptRepo.getNextReceiptNumber(tenantId);

      // Insert receipt
      db.prepare(`
        INSERT INTO customer_receipts (
          id, tenant_id, receipt_number, customer_id, receipt_date, payment_mode,
          bank_account_id, amount, reference_number, notes, status, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, datetime('now'))
      `).run(
        receiptId, tenantId, receiptNumber, data.customer_id, data.receipt_date,
        data.payment_mode, data.bank_account_id || null, data.amount,
        data.reference_number || null, data.notes || null, createdBy
      );

      // Allocate to invoices
      for (const allocation of data.invoice_allocations) {
        // Insert allocation record
        db.prepare(`
          INSERT INTO receipt_allocations (id, receipt_id, invoice_id, amount)
          VALUES (?, ?, ?, ?)
        `).run(generateId(), receiptId, allocation.invoice_id, allocation.amount);

        // Update invoice
        db.prepare(`
          UPDATE sales_invoices 
          SET amount_paid = amount_paid + ?,
              balance_due = balance_due - ?,
              status = CASE WHEN balance_due - ? <= 0 THEN 'paid' ELSE 'partial' END
          WHERE id = ? AND tenant_id = ?
        `).run(allocation.amount, allocation.amount, allocation.amount, allocation.invoice_id, tenantId);
      }

      // Create journal entry
      getFinanceService().createCustomerReceiptEntry(
        tenantId,
        {
          id: receiptId,
          receipt_number: receiptNumber,
          date: data.receipt_date,
          customer_id: data.customer_id,
          amount: data.amount,
          bank_account_id: data.bank_account_id || ''
        },
        createdBy
      );

      return this.receiptRepo.findById(receiptId, tenantId) as CustomerReceipt;
    })();
  }

  // ==================== Reports ====================

  getSalesReport(tenantId: string, fromDate: string, toDate: string) {
    const db = getDatabase();

    const summary = db.prepare(`
      SELECT 
        COUNT(*) as total_invoices,
        COALESCE(SUM(total_amount), 0) as total_sales,
        COALESCE(SUM(cgst_amount + sgst_amount + igst_amount), 0) as total_gst,
        COALESCE(SUM(amount_paid), 0) as total_collected,
        COALESCE(SUM(balance_due), 0) as total_outstanding
      FROM sales_invoices
      WHERE tenant_id = ? AND invoice_date BETWEEN ? AND ? AND status != 'cancelled'
    `).get(tenantId, fromDate, toDate);

    const byCustomer = db.prepare(`
      SELECT 
        c.name as customer_name,
        COUNT(*) as invoice_count,
        SUM(si.total_amount) as total_sales
      FROM sales_invoices si
      JOIN customers c ON c.id = si.customer_id
      WHERE si.tenant_id = ? AND si.invoice_date BETWEEN ? AND ? AND si.status != 'cancelled'
      GROUP BY si.customer_id
      ORDER BY total_sales DESC
    `).all(tenantId, fromDate, toDate);

    const byItem = db.prepare(`
      SELECT 
        i.name as item_name,
        SUM(sii.quantity) as total_quantity,
        SUM(sii.amount) as total_sales
      FROM sales_invoice_items sii
      JOIN sales_invoices si ON si.id = sii.sales_invoice_id
      JOIN items i ON i.id = sii.item_id
      WHERE si.tenant_id = ? AND si.invoice_date BETWEEN ? AND ? AND si.status != 'cancelled'
      GROUP BY sii.item_id
      ORDER BY total_sales DESC
    `).all(tenantId, fromDate, toDate);

    return { summary, byCustomer, byItem };
  }

  getAgingReport(tenantId: string) {
    const db = getDatabase();

    return db.prepare(`
      SELECT 
        c.name as customer_name,
        SUM(CASE WHEN julianday('now') - julianday(si.due_date) < 0 THEN si.balance_due ELSE 0 END) as current,
        SUM(CASE WHEN julianday('now') - julianday(si.due_date) BETWEEN 0 AND 30 THEN si.balance_due ELSE 0 END) as days_1_30,
        SUM(CASE WHEN julianday('now') - julianday(si.due_date) BETWEEN 31 AND 60 THEN si.balance_due ELSE 0 END) as days_31_60,
        SUM(CASE WHEN julianday('now') - julianday(si.due_date) BETWEEN 61 AND 90 THEN si.balance_due ELSE 0 END) as days_61_90,
        SUM(CASE WHEN julianday('now') - julianday(si.due_date) > 90 THEN si.balance_due ELSE 0 END) as over_90,
        SUM(si.balance_due) as total
      FROM sales_invoices si
      JOIN customers c ON c.id = si.customer_id
      WHERE si.tenant_id = ? AND si.balance_due > 0 AND si.status != 'cancelled'
      GROUP BY si.customer_id
      ORDER BY total DESC
    `).all(tenantId);
  }

  getAllCustomerReceipts(tenantId: string): CustomerReceipt[] {
    return getDatabase().prepare(
      `SELECT cr.*, c.name as customer_name
       FROM customer_receipts cr
       JOIN customers c ON c.id = cr.customer_id
       WHERE cr.tenant_id = ?
       ORDER BY cr.receipt_date DESC`
    ).all(tenantId) as CustomerReceipt[];
  }

  getAllSalesOrders(tenantId: string): SalesOrder[] {
    return getDatabase().prepare(
      `SELECT so.*, c.name as customer_name
       FROM sales_orders so
       JOIN customers c ON c.id = so.customer_id
       WHERE so.tenant_id = ?
       ORDER BY so.order_date DESC`
    ).all(tenantId) as SalesOrder[];
  }

  getAllSalesInvoices(tenantId: string): SalesInvoice[] {
    return getDatabase().prepare(
      `SELECT si.*, c.name as customer_name
       FROM sales_invoices si
       JOIN customers c ON c.id = si.customer_id
       WHERE si.tenant_id = ?
       ORDER BY si.invoice_date DESC`
    ).all(tenantId) as SalesInvoice[];
  }
}

// Export singleton instance (lazy initialization)
let _salesService: SalesService | null = null;
export const getSalesService = (): SalesService => {
  if (!_salesService) {
    _salesService = new SalesService();
  }
  return _salesService;
};

// For backward compatibility - use getSalesService() instead
export { getSalesService as salesService };

