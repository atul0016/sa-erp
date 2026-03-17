/**
 * POS Service - Point of Sale with Offline Support
 * 
 * Per The ERP Architect's Handbook:
 * - Offline capability with sync
 * - Weighing scale / pole display integration hooks
 * - Loyalty program support
 * - Session management
 * - Credit sale handling
 */

import { v4 as uuidv4 } from 'uuid';
import type { Database } from 'better-sqlite3';

export interface PosTerminal {
  id: string;
  tenant_id: string;
  terminal_code: string;
  terminal_name: string;
  warehouse_id: string;
  location?: string;
  default_customer_id?: string;
  default_price_list_id?: string;
  allow_credit_sale: boolean;
  allow_discount: boolean;
  max_discount_percent: number;
  auto_print_receipt: boolean;
  is_active: boolean;
}

export interface PosSession {
  id: string;
  tenant_id: string;
  terminal_id: string;
  session_number: string;
  opened_by: string;
  opened_at: string;
  opening_cash: number;
  closed_by?: string;
  closed_at?: string;
  closing_cash?: number;
  expected_cash?: number;
  cash_difference?: number;
  total_transactions: number;
  total_sales: number;
  total_returns: number;
  net_sales: number;
  total_discounts: number;
  cash_sales: number;
  card_sales: number;
  upi_sales: number;
  credit_sales: number;
  status: 'open' | 'closing' | 'closed';
}

export interface PosTransactionInput {
  customerId?: string;
  customerName?: string;
  customerMobile?: string;
  customerGstin?: string;
  lines: Array<{
    itemId: string;
    quantity: number;
    sellingPrice: number;
    discountPercent?: number;
    discountAmount?: number;
    batchId?: string;
    serialNumber?: string;
    isWeighingItem?: boolean;
  }>;
  discountPercent?: number;
  discountAmount?: number;
  payments: Array<{
    method: 'cash' | 'card' | 'upi' | 'credit' | 'voucher';
    amount: number;
    reference?: string;
  }>;
  loyaltyPointsRedeem?: number;
  isOffline?: boolean;
  offlineId?: string;
}

export interface PosTransaction {
  id: string;
  tenant_id: string;
  transaction_number: string;
  session_id: string;
  terminal_id: string;
  transaction_type: 'sale' | 'return' | 'exchange';
  transaction_date: string;
  transaction_time: string;
  customer_id?: string;
  customer_name?: string;
  customer_mobile?: string;
  customer_gstin?: string;
  gross_amount: number;
  discount_amount: number;
  discount_percent: number;
  taxable_amount: number;
  cgst_amount: number;
  sgst_amount: number;
  round_off: number;
  net_amount: number;
  payments: Array<{ method: string; amount: number; reference?: string }>;
  change_amount: number;
  loyalty_points_earned: number;
  loyalty_points_redeemed: number;
  loyalty_discount: number;
  is_offline: boolean;
  offline_id?: string;
  operator_id: string;
  operator_name: string;
  status: 'completed' | 'voided' | 'returned';
}

/**
 * Open a new POS session
 */
export function openSession(
  db: Database,
  tenantId: string,
  terminalId: string,
  openedBy: string,
  openingCash: number
): PosSession {
  // Check if terminal exists and is active
  const terminal = db.prepare(`
    SELECT * FROM pos_terminals WHERE id = ? AND tenant_id = ? AND is_active = 1
  `).get(terminalId, tenantId) as PosTerminal | undefined;

  if (!terminal) {
    throw new Error('Terminal not found or inactive');
  }

  // Check for existing open session
  const existingSession = db.prepare(`
    SELECT * FROM pos_sessions WHERE terminal_id = ? AND status = 'open'
  `).get(terminalId) as PosSession | undefined;

  if (existingSession) {
    throw new Error('Terminal already has an open session');
  }

  const sessionNumber = `POS-${terminal.terminal_code}-${Date.now()}`;
  const now = new Date().toISOString();

  const session: PosSession = {
    id: uuidv4(),
    tenant_id: tenantId,
    terminal_id: terminalId,
    session_number: sessionNumber,
    opened_by: openedBy,
    opened_at: now,
    opening_cash: openingCash,
    total_transactions: 0,
    total_sales: 0,
    total_returns: 0,
    net_sales: 0,
    total_discounts: 0,
    cash_sales: 0,
    card_sales: 0,
    upi_sales: 0,
    credit_sales: 0,
    status: 'open',
  };

  db.prepare(`
    INSERT INTO pos_sessions (
      id, tenant_id, terminal_id, session_number, opened_by, opened_at, opening_cash,
      total_transactions, total_sales, total_returns, net_sales, total_discounts,
      cash_sales, card_sales, upi_sales, credit_sales, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    session.id, session.tenant_id, session.terminal_id, session.session_number,
    session.opened_by, session.opened_at, session.opening_cash,
    session.total_transactions, session.total_sales, session.total_returns,
    session.net_sales, session.total_discounts, session.cash_sales,
    session.card_sales, session.upi_sales, session.credit_sales, session.status
  );

  return session;
}

/**
 * Create a POS transaction (sale)
 */
export function createTransaction(
  db: Database,
  tenantId: string,
  sessionId: string,
  operatorId: string,
  operatorName: string,
  input: PosTransactionInput
): PosTransaction {
  // Get session
  const session = db.prepare(`
    SELECT * FROM pos_sessions WHERE id = ? AND status = 'open'
  `).get(sessionId) as PosSession | undefined;

  if (!session) {
    throw new Error('Session not found or not open');
  }

  // Get terminal for settings
  const terminal = db.prepare(`
    SELECT * FROM pos_terminals WHERE id = ?
  `).get(session.terminal_id) as PosTerminal;

  const now = new Date();
  const transactionNumber = `TXN-${now.getTime()}`;

  // Calculate line items
  let grossAmount = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let lineDiscounts = 0;
  const lines: any[] = [];

  for (let i = 0; i < input.lines.length; i++) {
    const line = input.lines[i];
    
    // Get item details
    const item = db.prepare(`
      SELECT i.*, h.gst_rate, h.cess_rate
      FROM items i
      LEFT JOIN hsn_codes h ON i.hsn_code = h.code
      WHERE i.id = ?
    `).get(line.itemId) as any;

    if (!item) {
      throw new Error(`Item not found: ${line.itemId}`);
    }

    const lineGross = line.quantity * line.sellingPrice;
    const lineDiscount = line.discountAmount || (lineGross * (line.discountPercent || 0) / 100);
    const taxableAmount = lineGross - lineDiscount;
    
    const gstRate = item.gst_rate || 0;
    const cgstRate = gstRate / 2;
    const sgstRate = gstRate / 2;
    const cgstAmount = Math.round(taxableAmount * cgstRate / 100 * 100) / 100;
    const sgstAmount = Math.round(taxableAmount * sgstRate / 100 * 100) / 100;
    const lineTotal = taxableAmount + cgstAmount + sgstAmount;

    grossAmount += lineGross;
    lineDiscounts += lineDiscount;
    totalCgst += cgstAmount;
    totalSgst += sgstAmount;

    lines.push({
      id: uuidv4(),
      line_number: i + 1,
      item_id: line.itemId,
      item_code: item.code,
      item_name: item.name,
      barcode: item.barcode,
      hsn_code: item.hsn_code,
      quantity: line.quantity,
      uom_id: item.primary_uom_id,
      mrp: item.mrp || line.sellingPrice,
      selling_price: line.sellingPrice,
      discount_percent: line.discountPercent || 0,
      discount_amount: lineDiscount,
      taxable_amount: taxableAmount,
      gst_rate: gstRate,
      cgst_rate: cgstRate,
      cgst_amount: cgstAmount,
      sgst_rate: sgstRate,
      sgst_amount: sgstAmount,
      line_total: lineTotal,
      batch_id: line.batchId,
      serial_number: line.serialNumber,
      is_weighing_item: line.isWeighingItem ? 1 : 0,
    });
  }

  // Apply bill-level discount
  let billDiscount = input.discountAmount || 0;
  if (input.discountPercent && input.discountPercent > 0) {
    billDiscount = grossAmount * input.discountPercent / 100;
    
    // Check max discount
    if (terminal.max_discount_percent && input.discountPercent > terminal.max_discount_percent) {
      throw new Error(`Discount exceeds maximum allowed (${terminal.max_discount_percent}%)`);
    }
  }

  const totalDiscount = lineDiscounts + billDiscount;
  const taxableAmount = grossAmount - totalDiscount;
  
  // Recalculate GST on discounted amount (proportional)
  if (billDiscount > 0) {
    const discountRatio = (grossAmount - totalDiscount) / (grossAmount - lineDiscounts);
    totalCgst = Math.round(totalCgst * discountRatio * 100) / 100;
    totalSgst = Math.round(totalSgst * discountRatio * 100) / 100;
  }

  const totalBeforeRound = taxableAmount + totalCgst + totalSgst;
  const roundOff = Math.round(totalBeforeRound) - totalBeforeRound;
  const netAmount = Math.round(totalBeforeRound);

  // Handle loyalty
  let loyaltyDiscount = 0;
  let loyaltyPointsRedeemed = 0;
  let loyaltyPointsEarned = 0;

  if (input.customerId) {
    const loyalty = db.prepare(`
      SELECT cl.*, lp.points_per_amount, lp.redemption_rate, lp.max_redemption_percent
      FROM customer_loyalty cl
      JOIN loyalty_programs lp ON cl.program_id = lp.id
      WHERE cl.customer_id = ? AND cl.status = 'active'
    `).get(input.customerId) as any;

    if (loyalty) {
      // Redeem points
      if (input.loyaltyPointsRedeem && input.loyaltyPointsRedeem > 0) {
        const maxRedeemable = Math.min(
          loyalty.current_points,
          Math.floor(netAmount * loyalty.max_redemption_percent / 100 / loyalty.redemption_rate)
        );
        loyaltyPointsRedeemed = Math.min(input.loyaltyPointsRedeem, maxRedeemable);
        loyaltyDiscount = loyaltyPointsRedeemed * loyalty.redemption_rate;
      }

      // Earn points
      loyaltyPointsEarned = Math.floor((netAmount - loyaltyDiscount) / loyalty.points_per_amount);
    }
  }

  const finalAmount = netAmount - loyaltyDiscount;

  // Validate payments
  const totalPayments = input.payments.reduce((sum, p) => sum + p.amount, 0);
  if (totalPayments < finalAmount) {
    throw new Error('Insufficient payment amount');
  }

  const changeAmount = totalPayments - finalAmount;

  // Check credit sale permission
  const hasCreditPayment = input.payments.some(p => p.method === 'credit');
  if (hasCreditPayment && !terminal.allow_credit_sale) {
    throw new Error('Credit sales not allowed on this terminal');
  }

  // Create transaction
  const transaction: PosTransaction = {
    id: uuidv4(),
    tenant_id: tenantId,
    transaction_number: transactionNumber,
    session_id: sessionId,
    terminal_id: session.terminal_id,
    transaction_type: 'sale',
    transaction_date: now.toISOString().split('T')[0],
    transaction_time: now.toISOString().split('T')[1].substring(0, 8),
    customer_id: input.customerId,
    customer_name: input.customerName,
    customer_mobile: input.customerMobile,
    customer_gstin: input.customerGstin,
    gross_amount: grossAmount,
    discount_amount: totalDiscount,
    discount_percent: input.discountPercent || 0,
    taxable_amount: taxableAmount,
    cgst_amount: totalCgst,
    sgst_amount: totalSgst,
    round_off: roundOff,
    net_amount: finalAmount,
    payments: input.payments,
    change_amount: changeAmount,
    loyalty_points_earned: loyaltyPointsEarned,
    loyalty_points_redeemed: loyaltyPointsRedeemed,
    loyalty_discount: loyaltyDiscount,
    is_offline: input.isOffline || false,
    offline_id: input.offlineId,
    operator_id: operatorId,
    operator_name: operatorName,
    status: 'completed',
  };

  // Save transaction
  db.prepare(`
    INSERT INTO pos_transactions (
      id, tenant_id, transaction_number, session_id, terminal_id, transaction_type,
      transaction_date, transaction_time, customer_id, customer_name, customer_mobile, customer_gstin,
      gross_amount, discount_amount, discount_percent, taxable_amount,
      cgst_amount, sgst_amount, round_off, net_amount,
      payments, change_amount, loyalty_points_earned, loyalty_points_redeemed, loyalty_discount,
      is_offline, offline_id, operator_id, operator_name, status
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?
    )
  `).run(
    transaction.id, transaction.tenant_id, transaction.transaction_number,
    transaction.session_id, transaction.terminal_id, transaction.transaction_type,
    transaction.transaction_date, transaction.transaction_time,
    transaction.customer_id, transaction.customer_name, transaction.customer_mobile, transaction.customer_gstin,
    transaction.gross_amount, transaction.discount_amount, transaction.discount_percent, transaction.taxable_amount,
    transaction.cgst_amount, transaction.sgst_amount, transaction.round_off, transaction.net_amount,
    JSON.stringify(transaction.payments), transaction.change_amount,
    transaction.loyalty_points_earned, transaction.loyalty_points_redeemed, transaction.loyalty_discount,
    transaction.is_offline ? 1 : 0, transaction.offline_id,
    transaction.operator_id, transaction.operator_name, transaction.status
  );

  // Save transaction lines
  for (const line of lines) {
    db.prepare(`
      INSERT INTO pos_transaction_lines (
        id, transaction_id, line_number, item_id, item_code, item_name, barcode, hsn_code,
        quantity, uom_id, mrp, selling_price, discount_percent, discount_amount,
        taxable_amount, gst_rate, cgst_rate, cgst_amount, sgst_rate, sgst_amount,
        line_total, batch_id, serial_number, is_weighing_item
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      line.id, transaction.id, line.line_number, line.item_id, line.item_code, line.item_name,
      line.barcode, line.hsn_code, line.quantity, line.uom_id, line.mrp, line.selling_price,
      line.discount_percent, line.discount_amount, line.taxable_amount, line.gst_rate,
      line.cgst_rate, line.cgst_amount, line.sgst_rate, line.sgst_amount, line.line_total,
      line.batch_id, line.serial_number, line.is_weighing_item
    );
  }

  // Update session totals
  const cashAmount = input.payments.filter(p => p.method === 'cash').reduce((s, p) => s + p.amount, 0);
  const cardAmount = input.payments.filter(p => p.method === 'card').reduce((s, p) => s + p.amount, 0);
  const upiAmount = input.payments.filter(p => p.method === 'upi').reduce((s, p) => s + p.amount, 0);
  const creditAmount = input.payments.filter(p => p.method === 'credit').reduce((s, p) => s + p.amount, 0);

  db.prepare(`
    UPDATE pos_sessions SET
      total_transactions = total_transactions + 1,
      total_sales = total_sales + ?,
      net_sales = net_sales + ?,
      total_discounts = total_discounts + ?,
      cash_sales = cash_sales + ?,
      card_sales = card_sales + ?,
      upi_sales = upi_sales + ?,
      credit_sales = credit_sales + ?
    WHERE id = ?
  `).run(
    finalAmount, finalAmount, totalDiscount,
    cashAmount - changeAmount, cardAmount, upiAmount, creditAmount,
    sessionId
  );

  // Update loyalty points
  if (input.customerId && (loyaltyPointsEarned > 0 || loyaltyPointsRedeemed > 0)) {
    updateLoyaltyPoints(db, tenantId, input.customerId, transaction.id, loyaltyPointsEarned, loyaltyPointsRedeemed);
  }

  // Create stock movement (for inventory tracking)
  for (const line of lines) {
    db.prepare(`
      INSERT INTO stock_moves (
        id, tenant_id, date, move_type, reference_type, reference_id, reference_number,
        item_id, warehouse_id, batch_id, quantity, uom_id, status
      ) VALUES (?, ?, ?, 'out', 'pos_transaction', ?, ?, ?, ?, ?, ?, ?, 'completed')
    `).run(
      uuidv4(), tenantId, transaction.transaction_date,
      transaction.id, transaction.transaction_number,
      line.item_id, terminal.warehouse_id, line.batch_id, line.quantity, line.uom_id
    );
  }

  return transaction;
}

/**
 * Close POS session
 */
export function closeSession(
  db: Database,
  sessionId: string,
  closedBy: string,
  closingCash: number,
  remarks?: string
): PosSession {
  const session = db.prepare(`
    SELECT * FROM pos_sessions WHERE id = ? AND status = 'open'
  `).get(sessionId) as PosSession | undefined;

  if (!session) {
    throw new Error('Session not found or already closed');
  }

  const expectedCash = session.opening_cash + session.cash_sales;
  const cashDifference = closingCash - expectedCash;

  db.prepare(`
    UPDATE pos_sessions SET
      closed_by = ?,
      closed_at = datetime('now'),
      closing_cash = ?,
      expected_cash = ?,
      cash_difference = ?,
      remarks = ?,
      status = 'closed'
    WHERE id = ?
  `).run(closedBy, closingCash, expectedCash, cashDifference, remarks, sessionId);

  return {
    ...session,
    closed_by: closedBy,
    closed_at: new Date().toISOString(),
    closing_cash: closingCash,
    expected_cash: expectedCash,
    cash_difference: cashDifference,
    status: 'closed',
  };
}

/**
 * Sync offline transactions
 */
export function syncOfflineTransactions(
  db: Database,
  tenantId: string,
  transactions: PosTransactionInput[]
): { synced: number; errors: string[] } {
  let synced = 0;
  const errors: string[] = [];

  for (const txn of transactions) {
    try {
      // Check if already synced
      if (txn.offlineId) {
        const existing = db.prepare(`
          SELECT id FROM pos_transactions WHERE offline_id = ?
        `).get(txn.offlineId);

        if (existing) {
          continue; // Already synced
        }
      }

      // Find open session for terminal or create one
      // This would need more context about which session to use
      // For now, skip if no session info
      errors.push(`Transaction ${txn.offlineId}: Session context required for sync`);
    } catch (error: any) {
      errors.push(`Transaction ${txn.offlineId}: ${error.message}`);
    }
  }

  return { synced, errors };
}

/**
 * Get item by barcode (for scanner)
 */
export function getItemByBarcode(
  db: Database,
  tenantId: string,
  barcode: string
): any {
  return db.prepare(`
    SELECT i.*, h.gst_rate, h.cess_rate
    FROM items i
    LEFT JOIN hsn_codes h ON i.hsn_code = h.code
    WHERE i.tenant_id = ? AND (i.barcode = ? OR i.code = ?) AND i.is_active = 1
  `).get(tenantId, barcode, barcode);
}

// Helper function to update loyalty points
function updateLoyaltyPoints(
  db: Database,
  tenantId: string,
  customerId: string,
  transactionId: string,
  earned: number,
  redeemed: number
): void {
  const loyalty = db.prepare(`
    SELECT * FROM customer_loyalty WHERE customer_id = ? AND tenant_id = ?
  `).get(customerId, tenantId) as any;

  if (!loyalty) return;

  // Record transactions
  if (earned > 0) {
    db.prepare(`
      INSERT INTO loyalty_transactions (
        id, tenant_id, customer_loyalty_id, transaction_type, pos_transaction_id,
        points, balance_after, description
      ) VALUES (?, ?, ?, 'earn', ?, ?, ?, 'Points earned from purchase')
    `).run(
      uuidv4(), tenantId, loyalty.id, transactionId,
      earned, loyalty.current_points + earned - redeemed
    );
  }

  if (redeemed > 0) {
    db.prepare(`
      INSERT INTO loyalty_transactions (
        id, tenant_id, customer_loyalty_id, transaction_type, pos_transaction_id,
        points, balance_after, description
      ) VALUES (?, ?, ?, 'redeem', ?, ?, ?, 'Points redeemed for discount')
    `).run(
      uuidv4(), tenantId, loyalty.id, transactionId,
      -redeemed, loyalty.current_points + earned - redeemed
    );
  }

  // Update loyalty record
  db.prepare(`
    UPDATE customer_loyalty SET
      total_points_earned = total_points_earned + ?,
      total_points_redeemed = total_points_redeemed + ?,
      current_points = current_points + ? - ?,
      visit_count = visit_count + 1,
      last_visit_date = date('now')
    WHERE id = ?
  `).run(earned, redeemed, earned, redeemed, loyalty.id);
}

export default {
  openSession,
  createTransaction,
  closeSession,
  syncOfflineTransactions,
  getItemByBarcode,
};
