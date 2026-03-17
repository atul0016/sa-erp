/**
 * SA ERP - GST Compliance Service
 * Handles E-Invoice, E-Way Bill, GSTR returns, and ITC reconciliation
 */

import { BaseRepository, generateId } from '../../database/repository';
import { getDatabase } from '../../database';
import { round, validateGSTIN, getStateFromGSTIN, formatDate } from '../../utils/helpers';

// ==================== Interfaces ====================

interface EInvoice {
  id: string;
  tenant_id: string;
  sales_invoice_id: string;
  invoice_number: string;
  invoice_date: string;
  irn?: string;
  ack_number?: string;
  ack_date?: string;
  signed_qr_code?: string;
  signed_invoice?: string;
  status: string;
  error_message?: string;
  submitted_at?: string;
  created_at: string;
}

interface EwayBill {
  id: string;
  tenant_id: string;
  document_type: string;
  document_id: string;
  document_number: string;
  document_date: string;
  eway_bill_number?: string;
  eway_bill_date?: string;
  valid_upto?: string;
  transporter_id?: string;
  transporter_name?: string;
  transport_mode: string;
  vehicle_number?: string;
  from_state: string;
  to_state: string;
  distance_km: number;
  status: string;
  error_message?: string;
  created_at: string;
}

interface GSTR1 {
  id: string;
  tenant_id: string;
  return_period: string; // MMYYYY format
  filing_status: string;
  b2b_invoices: number;
  b2b_amount: number;
  b2cl_invoices: number;
  b2cl_amount: number;
  b2cs_amount: number;
  credit_debit_notes: number;
  cdn_amount: number;
  exports_invoices: number;
  exports_amount: number;
  nil_rated_amount: number;
  total_taxable_amount: number;
  total_cgst: number;
  total_sgst: number;
  total_igst: number;
  total_cess: number;
  filed_at?: string;
  arn?: string;
}

interface GSTR2AImport {
  id: string;
  tenant_id: string;
  return_period: string;
  supplier_gstin: string;
  supplier_name: string;
  invoice_number: string;
  invoice_date: string;
  invoice_type: string;
  taxable_amount: number;
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
  itc_status: string;
  matched_invoice_id?: string;
  import_date: string;
}

interface ITCReconciliation {
  id: string;
  tenant_id: string;
  return_period: string;
  supplier_gstin: string;
  supplier_name: string;
  our_invoice_number: string;
  our_invoice_date: string;
  our_taxable_amount: number;
  our_gst_amount: number;
  gstr2a_invoice_number?: string;
  gstr2a_invoice_date?: string;
  gstr2a_taxable_amount?: number;
  gstr2a_gst_amount?: number;
  variance_amount: number;
  status: string;
  action_taken?: string;
}

interface TDSDeduction {
  id: string;
  tenant_id: string;
  vendor_id: string;
  purchase_invoice_id: string;
  tds_section: string;
  deduction_date: string;
  gross_amount: number;
  tds_rate: number;
  tds_amount: number;
  certificate_number?: string;
  certificate_date?: string;
  status: string;
}

// ==================== Repository ====================

class EInvoiceRepository extends BaseRepository<EInvoice> {
  constructor() {
    super('e_invoices');
  }

  findByInvoice(tenantId: string, salesInvoiceId: string): EInvoice | undefined {
    return this.findOne(tenantId, { sales_invoice_id: salesInvoiceId });
  }

  getPendingInvoices(tenantId: string): EInvoice[] {
    return this.query<EInvoice>(
      `SELECT * FROM ${this.tableName} WHERE tenant_id = ? AND status = 'pending'`,
      [tenantId]
    );
  }
}

class EwayBillRepository extends BaseRepository<EwayBill> {
  constructor() {
    super('eway_bills');
  }

  getExpiringSoon(tenantId: string, daysAhead: number = 1): EwayBill[] {
    return this.query<EwayBill>(
      `SELECT * FROM ${this.tableName} 
       WHERE tenant_id = ? AND status = 'active'
       AND datetime(valid_upto) <= datetime('now', '+${daysAhead} days')`,
      [tenantId]
    );
  }
}

// ==================== Service ====================

export class GSTService {
  private einvoiceRepo: EInvoiceRepository;
  private ewayBillRepo: EwayBillRepository;

  constructor() {
    this.einvoiceRepo = new EInvoiceRepository();
    this.ewayBillRepo = new EwayBillRepository();
  }

  // ==================== E-Invoice ====================

  /**
   * Generate E-Invoice JSON for IRP submission
   */
  generateEInvoiceJson(tenantId: string, salesInvoiceId: string): object {
    const db = getDatabase();

    // Get invoice with details
    const invoice = db.prepare(`
      SELECT si.*, c.name as customer_name, c.gstin as customer_gstin,
             c.billing_address, c.billing_city, c.billing_state, c.billing_state_code, c.billing_pincode
      FROM sales_invoices si
      JOIN customers c ON c.id = si.customer_id
      WHERE si.id = ? AND si.tenant_id = ?
    `).get(salesInvoiceId, tenantId) as Record<string, unknown>;

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Get tenant details
    const tenant = db.prepare(`SELECT * FROM tenants WHERE id = ?`).get(tenantId) as Record<string, unknown>;

    // Get invoice items
    const items = db.prepare(`
      SELECT sii.*, i.name as item_name, i.hsn_code as item_hsn
      FROM sales_invoice_items sii
      JOIN items i ON i.id = sii.item_id
      WHERE sii.sales_invoice_id = ?
    `).all(salesInvoiceId) as Array<Record<string, unknown>>;

    // Build E-Invoice JSON structure (IRN schema)
    const einvoiceJson = {
      Version: '1.1',
      TranDtls: {
        TaxSch: 'GST',
        SupTyp: this.getSupplyType(tenant.state_code as string, invoice.customer_state_code as string),
        RegRev: 'N',
        EcmGstin: null,
        IgstOnIntra: 'N'
      },
      DocDtls: {
        Typ: 'INV',
        No: invoice.invoice_number,
        Dt: formatDate(invoice.invoice_date as string)
      },
      SellerDtls: {
        Gstin: tenant.gstin,
        LglNm: tenant.name,
        Addr1: tenant.address,
        Loc: tenant.city,
        Pin: parseInt(tenant.pincode as string),
        Stcd: tenant.state_code,
        Ph: tenant.phone,
        Em: tenant.email
      },
      BuyerDtls: {
        Gstin: invoice.customer_gstin || 'URP',
        LglNm: invoice.customer_name,
        Pos: invoice.billing_state_code,
        Addr1: invoice.billing_address,
        Loc: invoice.billing_city,
        Pin: parseInt(invoice.billing_pincode as string),
        Stcd: invoice.billing_state_code,
        Ph: invoice.phone || null,
        Em: invoice.email || null
      },
      ItemList: items.map((item, index) => ({
        SlNo: (index + 1).toString(),
        PrdDesc: item.description || item.item_name,
        IsServc: 'N',
        HsnCd: item.hsn_code || item.item_hsn,
        Qty: item.quantity,
        Unit: 'NOS',
        UnitPrice: item.unit_price,
        TotAmt: item.amount,
        Discount: item.discount_amount || 0,
        AssAmt: item.amount,
        GstRt: item.gst_rate,
        IgstAmt: item.igst_amount || 0,
        CgstAmt: item.cgst_amount || 0,
        SgstAmt: item.sgst_amount || 0,
        CesRt: 0,
        CesAmt: 0,
        TotItemVal: round((item.amount as number) + (item.cgst_amount as number || 0) + 
                         (item.sgst_amount as number || 0) + (item.igst_amount as number || 0))
      })),
      ValDtls: {
        AssVal: invoice.subtotal,
        CgstVal: invoice.cgst_amount,
        SgstVal: invoice.sgst_amount,
        IgstVal: invoice.igst_amount,
        CesVal: 0,
        Discount: invoice.discount_amount || 0,
        OthChrg: 0,
        RndOffAmt: 0,
        TotInvVal: invoice.total_amount
      }
    };

    return einvoiceJson;
  }

  /**
   * Submit E-Invoice to IRP (mock implementation)
   */
  async submitEInvoice(tenantId: string, salesInvoiceId: string, createdBy: string): Promise<EInvoice> {
    const db = getDatabase();

    // Generate JSON
    const einvoiceJson = this.generateEInvoiceJson(tenantId, salesInvoiceId);

    // Create E-Invoice record
    const einvoiceId = generateId();

    db.prepare(`
      INSERT INTO e_invoices (
        id, tenant_id, sales_invoice_id, invoice_number, invoice_date,
        status, created_at, submitted_at
      )
      SELECT ?, ?, id, invoice_number, invoice_date, 'pending', datetime('now'), datetime('now')
      FROM sales_invoices WHERE id = ? AND tenant_id = ?
    `).run(einvoiceId, tenantId, salesInvoiceId, tenantId);

    // In production, you would call the IRP API here
    // For now, we'll simulate a successful response
    const mockIRN = `INV${Date.now()}${Math.random().toString(36).substring(7)}`.toUpperCase();
    const mockAckNo = Math.floor(Math.random() * 1000000000).toString();

    // Update with mock response
    db.prepare(`
      UPDATE e_invoices 
      SET irn = ?, ack_number = ?, ack_date = datetime('now'), status = 'generated'
      WHERE id = ?
    `).run(mockIRN, mockAckNo, einvoiceId);

    // Update sales invoice with IRN
    db.prepare(`
      UPDATE sales_invoices 
      SET e_invoice_irn = ?, e_invoice_ack_number = ?, e_invoice_ack_date = datetime('now')
      WHERE id = ?
    `).run(mockIRN, mockAckNo, salesInvoiceId);

    return this.einvoiceRepo.findById(einvoiceId, tenantId) as EInvoice;
  }

  /**
   * Cancel E-Invoice
   */
  async cancelEInvoice(tenantId: string, einvoiceId: string, reason: string): Promise<boolean> {
    const db = getDatabase();

    // In production, you would call the IRP cancel API
    const result = db.prepare(`
      UPDATE e_invoices SET status = 'cancelled', error_message = ? WHERE id = ? AND tenant_id = ?
    `).run(`Cancelled: ${reason}`, einvoiceId, tenantId);

    return result.changes > 0;
  }

  private getSupplyType(sellerStateCode: string, buyerStateCode: string): string {
    if (sellerStateCode === buyerStateCode) return 'B2B';
    return 'INTER';
  }

  // ==================== E-Way Bill ====================

  /**
   * Generate E-Way Bill
   */
  async generateEwayBill(
    tenantId: string,
    data: {
      document_type: 'sales_invoice' | 'delivery_note' | 'purchase_invoice' | 'grn';
      document_id: string;
      transporter_id?: string;
      transporter_name?: string;
      transport_mode: 'road' | 'rail' | 'air' | 'ship';
      vehicle_number?: string;
      distance_km: number;
    },
    createdBy: string
  ): Promise<EwayBill> {
    const db = getDatabase();

    // Get document details based on type
    let document: Record<string, unknown>;
    let fromState: string;
    let toState: string;

    if (data.document_type === 'sales_invoice') {
      document = db.prepare(`
        SELECT si.*, t.state_code as from_state, c.billing_state_code as to_state
        FROM sales_invoices si
        JOIN tenants t ON t.id = si.tenant_id
        JOIN customers c ON c.id = si.customer_id
        WHERE si.id = ? AND si.tenant_id = ?
      `).get(data.document_id, tenantId) as Record<string, unknown>;
      fromState = document.from_state as string;
      toState = document.to_state as string;
    } else {
      throw new Error('Unsupported document type for E-Way Bill');
    }

    if (!document) {
      throw new Error('Document not found');
    }

    // Calculate validity (1 day per 100km, minimum 1 day)
    const validityDays = Math.max(1, Math.ceil(data.distance_km / 100));

    const ewayBillId = generateId();

    // In production, call GST Portal E-Way Bill API
    const mockEwayBillNumber = `EWB${Date.now()}`;

    db.prepare(`
      INSERT INTO eway_bills (
        id, tenant_id, document_type, document_id, document_number, document_date,
        eway_bill_number, eway_bill_date, valid_upto, transporter_id, transporter_name,
        transport_mode, vehicle_number, from_state, to_state, distance_km, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now', '+${validityDays} days'),
        ?, ?, ?, ?, ?, ?, ?, 'active', datetime('now'))
    `).run(
      ewayBillId, tenantId, data.document_type, data.document_id,
      document.invoice_number, document.invoice_date, mockEwayBillNumber,
      data.transporter_id || null, data.transporter_name || null,
      data.transport_mode, data.vehicle_number || null,
      fromState, toState, data.distance_km
    );

    return this.ewayBillRepo.findById(ewayBillId, tenantId) as EwayBill;
  }

  /**
   * Update E-Way Bill vehicle
   */
  async updateEwayBillVehicle(
    tenantId: string,
    ewayBillId: string,
    vehicleNumber: string,
    reason: string
  ): Promise<boolean> {
    const result = getDatabase().prepare(`
      UPDATE eway_bills SET vehicle_number = ? WHERE id = ? AND tenant_id = ? AND status = 'active'
    `).run(vehicleNumber, ewayBillId, tenantId);

    return result.changes > 0;
  }

  /**
   * Get E-Way Bills expiring soon
   */
  getExpiringEwayBills(tenantId: string, daysAhead: number = 1): EwayBill[] {
    return this.ewayBillRepo.getExpiringSoon(tenantId, daysAhead);
  }

  // ==================== GSTR-1 ====================

  /**
   * Prepare GSTR-1 data for a return period
   */
  prepareGSTR1(tenantId: string, returnPeriod: string): GSTR1 {
    const db = getDatabase();

    // Parse return period (MMYYYY)
    const month = parseInt(returnPeriod.substring(0, 2));
    const year = parseInt(returnPeriod.substring(2));
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    // Get tenant state code
    const tenant = db.prepare('SELECT state_code FROM tenants WHERE id = ?').get(tenantId) as { state_code: string };

    // B2B Invoices (registered customers with GSTIN)
    const b2b = db.prepare(`
      SELECT COUNT(*) as count, COALESCE(SUM(subtotal), 0) as amount,
             COALESCE(SUM(cgst_amount), 0) as cgst, COALESCE(SUM(sgst_amount), 0) as sgst,
             COALESCE(SUM(igst_amount), 0) as igst
      FROM sales_invoices si
      JOIN customers c ON c.id = si.customer_id
      WHERE si.tenant_id = ? AND si.invoice_date BETWEEN ? AND ?
      AND si.status != 'cancelled' AND c.gstin IS NOT NULL AND c.gstin != ''
    `).get(tenantId, startDate, endDate) as Record<string, number>;

    // B2CL Invoices (unregistered customers, inter-state, value > 2.5L)
    const b2cl = db.prepare(`
      SELECT COUNT(*) as count, COALESCE(SUM(subtotal), 0) as amount
      FROM sales_invoices si
      JOIN customers c ON c.id = si.customer_id
      WHERE si.tenant_id = ? AND si.invoice_date BETWEEN ? AND ?
      AND si.status != 'cancelled'
      AND (c.gstin IS NULL OR c.gstin = '')
      AND c.billing_state_code != ?
      AND si.total_amount > 250000
    `).get(tenantId, startDate, endDate, tenant.state_code) as Record<string, number>;

    // B2CS (unregistered customers, intra-state or inter-state < 2.5L)
    const b2cs = db.prepare(`
      SELECT COALESCE(SUM(subtotal), 0) as amount
      FROM sales_invoices si
      JOIN customers c ON c.id = si.customer_id
      WHERE si.tenant_id = ? AND si.invoice_date BETWEEN ? AND ?
      AND si.status != 'cancelled'
      AND (c.gstin IS NULL OR c.gstin = '')
      AND (c.billing_state_code = ? OR si.total_amount <= 250000)
    `).get(tenantId, startDate, endDate, tenant.state_code) as Record<string, number>;

    // Credit/Debit Notes
    const cdn = db.prepare(`
      SELECT COUNT(*) as count, COALESCE(SUM(ABS(total_amount)), 0) as amount
      FROM credit_notes
      WHERE tenant_id = ? AND note_date BETWEEN ? AND ? AND status != 'cancelled'
    `).get(tenantId, startDate, endDate) as Record<string, number>;

    // Exports (if any)
    const exports = db.prepare(`
      SELECT COUNT(*) as count, COALESCE(SUM(subtotal), 0) as amount
      FROM sales_invoices
      WHERE tenant_id = ? AND invoice_date BETWEEN ? AND ?
      AND status != 'cancelled' AND is_export = 1
    `).get(tenantId, startDate, endDate) as Record<string, number>;

    // Nil rated supplies
    const nilRated = db.prepare(`
      SELECT COALESCE(SUM(sii.amount), 0) as amount
      FROM sales_invoice_items sii
      JOIN sales_invoices si ON si.id = sii.sales_invoice_id
      WHERE si.tenant_id = ? AND si.invoice_date BETWEEN ? AND ?
      AND si.status != 'cancelled' AND sii.gst_rate = 0
    `).get(tenantId, startDate, endDate) as Record<string, number>;

    // Calculate totals
    const totalTaxable = (b2b.amount || 0) + (b2cl.amount || 0) + (b2cs.amount || 0);
    const totalCgst = b2b.cgst || 0;
    const totalSgst = b2b.sgst || 0;
    const totalIgst = b2b.igst || 0;

    // Create or update GSTR-1 record
    const existingGstr1 = db.prepare(
      `SELECT id FROM gstr1_returns WHERE tenant_id = ? AND return_period = ?`
    ).get(tenantId, returnPeriod) as { id: string } | undefined;

    const gstr1Id = existingGstr1?.id || generateId();

    if (existingGstr1) {
      db.prepare(`
        UPDATE gstr1_returns SET
          b2b_invoices = ?, b2b_amount = ?, b2cl_invoices = ?, b2cl_amount = ?,
          b2cs_amount = ?, credit_debit_notes = ?, cdn_amount = ?,
          exports_invoices = ?, exports_amount = ?, nil_rated_amount = ?,
          total_taxable_amount = ?, total_cgst = ?, total_sgst = ?, total_igst = ?,
          total_cess = 0
        WHERE id = ?
      `).run(
        b2b.count, b2b.amount, b2cl.count, b2cl.amount,
        b2cs.amount, cdn.count, cdn.amount,
        exports.count, exports.amount, nilRated.amount,
        totalTaxable, totalCgst, totalSgst, totalIgst, gstr1Id
      );
    } else {
      db.prepare(`
        INSERT INTO gstr1_returns (
          id, tenant_id, return_period, filing_status,
          b2b_invoices, b2b_amount, b2cl_invoices, b2cl_amount,
          b2cs_amount, credit_debit_notes, cdn_amount,
          exports_invoices, exports_amount, nil_rated_amount,
          total_taxable_amount, total_cgst, total_sgst, total_igst, total_cess
        ) VALUES (?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
      `).run(
        gstr1Id, tenantId, returnPeriod,
        b2b.count, b2b.amount, b2cl.count, b2cl.amount,
        b2cs.amount, cdn.count, cdn.amount,
        exports.count, exports.amount, nilRated.amount,
        totalTaxable, totalCgst, totalSgst, totalIgst
      );
    }

    return db.prepare('SELECT * FROM gstr1_returns WHERE id = ?').get(gstr1Id) as GSTR1;
  }

  /**
   * Get GSTR-1 B2B details for filing
   */
  getGSTR1B2BDetails(tenantId: string, returnPeriod: string): Array<{
    customer_gstin: string;
    customer_name: string;
    invoices: Array<{
      invoice_number: string;
      invoice_date: string;
      invoice_value: number;
      taxable_value: number;
      cgst: number;
      sgst: number;
      igst: number;
    }>;
  }> {
    const db = getDatabase();

    const month = parseInt(returnPeriod.substring(0, 2));
    const year = parseInt(returnPeriod.substring(2));
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    type B2BInvoiceRow = {
      customer_gstin: string;
      customer_name: string;
      invoice_number: string;
      invoice_date: string;
      total_amount: number;
      subtotal: number;
      cgst_amount: number;
      sgst_amount: number;
      igst_amount: number;
    };

    type B2BGrouped = {
      customer_gstin: string;
      customer_name: string;
      invoices: Array<{
        invoice_number: string;
        invoice_date: string;
        invoice_value: number;
        taxable_value: number;
        cgst: number;
        sgst: number;
        igst: number;
      }>;
    };

    const invoices = db.prepare(`
      SELECT si.*, c.gstin as customer_gstin, c.name as customer_name
      FROM sales_invoices si
      JOIN customers c ON c.id = si.customer_id
      WHERE si.tenant_id = ? AND si.invoice_date BETWEEN ? AND ?
      AND si.status != 'cancelled' AND c.gstin IS NOT NULL AND c.gstin != ''
      ORDER BY c.gstin, si.invoice_date
    `).all(tenantId, startDate, endDate) as B2BInvoiceRow[];

    // Group by customer GSTIN
    const grouped = new Map<string, B2BGrouped>();

    for (const inv of invoices) {
      const gstin = inv.customer_gstin;
      if (!grouped.has(gstin)) {
        grouped.set(gstin, {
          customer_gstin: gstin,
          customer_name: inv.customer_name,
          invoices: []
        });
      }
      grouped.get(gstin)!.invoices.push({
        invoice_number: inv.invoice_number,
        invoice_date: inv.invoice_date,
        invoice_value: inv.total_amount,
        taxable_value: inv.subtotal,
        cgst: inv.cgst_amount,
        sgst: inv.sgst_amount,
        igst: inv.igst_amount
      });
    }

    return Array.from(grouped.values());
  }

  // ==================== ITC Reconciliation ====================

  /**
   * Perform ITC reconciliation
   */
  performITCReconciliation(tenantId: string, returnPeriod: string): Array<ITCReconciliation> {
    const db = getDatabase();

    const month = parseInt(returnPeriod.substring(0, 2));
    const year = parseInt(returnPeriod.substring(2));
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    // Get our purchase invoices
    const ourInvoices = db.prepare(`
      SELECT pi.*, v.gstin as supplier_gstin, v.name as supplier_name
      FROM purchase_invoices pi
      JOIN vendors v ON v.id = pi.vendor_id
      WHERE pi.tenant_id = ? AND pi.invoice_date BETWEEN ? AND ?
      AND pi.status != 'cancelled' AND v.gstin IS NOT NULL
    `).all(tenantId, startDate, endDate) as Array<Record<string, unknown>>;

    // Get GSTR-2A imports
    const gstr2aRecords = db.prepare(`
      SELECT * FROM gstr2a_imports
      WHERE tenant_id = ? AND return_period = ?
    `).all(tenantId, returnPeriod) as Array<GSTR2AImport>;

    const reconciliations: ITCReconciliation[] = [];

    for (const ourInv of ourInvoices) {
      // Try to find matching GSTR-2A record
      const match = gstr2aRecords.find(g2a => 
        g2a.supplier_gstin === ourInv.supplier_gstin &&
        this.normalizeInvoiceNumber(g2a.invoice_number) === this.normalizeInvoiceNumber(ourInv.vendor_invoice_number as string)
      );

      const ourGstAmount = (ourInv.cgst_amount as number) + (ourInv.sgst_amount as number) + (ourInv.igst_amount as number);
      
      let status = 'not_in_gstr2a';
      let varianceAmount = ourGstAmount;
      let gstr2aGstAmount = 0;

      if (match) {
        gstr2aGstAmount = match.cgst + match.sgst + match.igst;
        varianceAmount = Math.abs(ourGstAmount - gstr2aGstAmount);
        
        if (varianceAmount < 1) {
          status = 'matched';
          varianceAmount = 0;
        } else {
          status = 'variance';
        }
      }

      const reconciliationId = generateId();

      db.prepare(`
        INSERT INTO itc_reconciliations (
          id, tenant_id, return_period, supplier_gstin, supplier_name,
          our_invoice_number, our_invoice_date, our_taxable_amount, our_gst_amount,
          gstr2a_invoice_number, gstr2a_invoice_date, gstr2a_taxable_amount, gstr2a_gst_amount,
          variance_amount, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        reconciliationId, tenantId, returnPeriod,
        ourInv.supplier_gstin, ourInv.supplier_name,
        ourInv.vendor_invoice_number, ourInv.invoice_date,
        ourInv.subtotal, ourGstAmount,
        match?.invoice_number || null, match?.invoice_date || null,
        match?.taxable_amount || null, gstr2aGstAmount || null,
        varianceAmount, status
      );

      reconciliations.push(db.prepare('SELECT * FROM itc_reconciliations WHERE id = ?').get(reconciliationId) as ITCReconciliation);
    }

    return reconciliations;
  }

  private normalizeInvoiceNumber(invoiceNumber: string): string {
    return invoiceNumber.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  }

  // ==================== GST Summary Reports ====================

  /**
   * Get GST liability summary
   */
  getGSTLiabilitySummary(tenantId: string, fromDate: string, toDate: string) {
    const db = getDatabase();

    // Output GST (from sales)
    const output = db.prepare(`
      SELECT 
        COALESCE(SUM(cgst_amount), 0) as cgst,
        COALESCE(SUM(sgst_amount), 0) as sgst,
        COALESCE(SUM(igst_amount), 0) as igst
      FROM sales_invoices
      WHERE tenant_id = ? AND invoice_date BETWEEN ? AND ? AND status != 'cancelled'
    `).get(tenantId, fromDate, toDate) as Record<string, number>;

    // Input GST (from purchases)
    const input = db.prepare(`
      SELECT 
        COALESCE(SUM(cgst_amount), 0) as cgst,
        COALESCE(SUM(sgst_amount), 0) as sgst,
        COALESCE(SUM(igst_amount), 0) as igst
      FROM purchase_invoices
      WHERE tenant_id = ? AND invoice_date BETWEEN ? AND ? AND status NOT IN ('cancelled', 'draft')
    `).get(tenantId, fromDate, toDate) as Record<string, number>;

    const outputTotal = (output.cgst || 0) + (output.sgst || 0) + (output.igst || 0);
    const inputTotal = (input.cgst || 0) + (input.sgst || 0) + (input.igst || 0);

    return {
      output: {
        cgst: output.cgst || 0,
        sgst: output.sgst || 0,
        igst: output.igst || 0,
        total: outputTotal
      },
      input: {
        cgst: input.cgst || 0,
        sgst: input.sgst || 0,
        igst: input.igst || 0,
        total: inputTotal
      },
      netLiability: {
        cgst: round((output.cgst || 0) - (input.cgst || 0)),
        sgst: round((output.sgst || 0) - (input.sgst || 0)),
        igst: round((output.igst || 0) - (input.igst || 0)),
        total: round(outputTotal - inputTotal)
      }
    };
  }

  /**
   * Get HSN-wise summary
   */
  getHSNWiseSummary(tenantId: string, fromDate: string, toDate: string) {
    const db = getDatabase();

    return db.prepare(`
      SELECT 
        sii.hsn_code,
        h.description as hsn_description,
        SUM(sii.quantity) as total_quantity,
        SUM(sii.amount) as total_value,
        SUM(sii.cgst_amount + sii.sgst_amount + sii.igst_amount) as total_tax
      FROM sales_invoice_items sii
      JOIN sales_invoices si ON si.id = sii.sales_invoice_id
      LEFT JOIN hsn_codes h ON h.code = sii.hsn_code
      WHERE si.tenant_id = ? AND si.invoice_date BETWEEN ? AND ? AND si.status != 'cancelled'
      GROUP BY sii.hsn_code
      ORDER BY total_value DESC
    `).all(tenantId, fromDate, toDate);
  }
}

// Export singleton instance (lazy initialization)
let _gstService: GSTService | null = null;
export const getGSTService = (): GSTService => {
  if (!_gstService) {
    _gstService = new GSTService();
  }
  return _gstService;
};

// For backward compatibility - use getGSTService() instead
export { getGSTService as gstService };

