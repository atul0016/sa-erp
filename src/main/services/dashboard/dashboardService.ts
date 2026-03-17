/**
 * SA ERP - Dashboard Service
 * 
 * Aggregates data from multiple modules for dashboard display
 */

import { getDatabase } from '../../database';

class DashboardService {
  private db() {
    return getDatabase();
  }

  getDashboardStats(tenantId: string): unknown {
    const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
    const [year, month] = currentMonth.split('-');

    // Sales this month
    const salesStats = this.db().prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as total, COUNT(*) as count
      FROM sales_invoices
      WHERE tenant_id = ? AND strftime('%Y-%m', invoice_date) = ?
    `).get(tenantId, currentMonth) as { total: number; count: number };

    // Purchase this month
    const purchaseStats = this.db().prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as total, COUNT(*) as count
      FROM purchase_invoices
      WHERE tenant_id = ? AND strftime('%Y-%m', invoice_date) = ?
    `).get(tenantId, currentMonth) as { total: number; count: number };

    // Receivables (Debit balance in customer accounts)
    const receivables = this.db().prepare(`
      SELECT COALESCE(SUM(debit - credit), 0) as total
      FROM ledger_entries
      WHERE tenant_id = ? AND account_code LIKE '1301%'
    `).get(tenantId) as { total: number };

    // Payables (Credit balance in vendor accounts)
    const payables = this.db().prepare(`
      SELECT COALESCE(SUM(credit - debit), 0) as total
      FROM ledger_entries
      WHERE tenant_id = ? AND account_code LIKE '2301%'
    `).get(tenantId) as { total: number };

    // Low stock items
    const lowStockCount = this.db().prepare(`
      SELECT COUNT(*) as count
      FROM (
        SELECT i.id
        FROM items i
        LEFT JOIN (
          SELECT item_id, COALESCE(SUM(quantity), 0) as current_stock
          FROM stock_movements
          WHERE tenant_id = ?
          GROUP BY item_id
        ) sm ON sm.item_id = i.id
        WHERE i.tenant_id = ? AND i.is_active = 1
          AND COALESCE(sm.current_stock, 0) <= i.reorder_level
      )
    `).get(tenantId, tenantId) as { count: number };

    // Pending sales orders
    const pendingSalesOrders = this.db().prepare(`
      SELECT COUNT(*) as count
      FROM sales_orders
      WHERE tenant_id = ? AND status IN ('confirmed', 'processing')
    `).get(tenantId) as { count: number };

    // Pending purchase orders
    const pendingPurchaseOrders = this.db().prepare(`
      SELECT COUNT(*) as count
      FROM purchase_orders
      WHERE tenant_id = ? AND status IN ('approved', 'sent')
    `).get(tenantId) as { count: number };

    // Pending GRNs
    const pendingGRNs = this.db().prepare(`
      SELECT COUNT(*) as count
      FROM goods_receipt_notes
      WHERE tenant_id = ? AND status = 'draft'
    `).get(tenantId) as { count: number };

    return {
      salesThisMonth: salesStats.total,
      purchaseThisMonth: purchaseStats.total,
      receivablesTotal: receivables.total,
      payablesTotal: payables.total,
      lowStockItems: lowStockCount.count,
      pendingSalesOrders: pendingSalesOrders.count,
      pendingPurchaseOrders: pendingPurchaseOrders.count,
      pendingGRNs: pendingGRNs.count,
    };
  }

  getRecentTransactions(tenantId: string, limit: number = 10): unknown[] {
    return this.db().prepare(`
      SELECT 
        'Sales Invoice' as type,
        invoice_number as number,
        c.name as party,
        total_amount as amount,
        invoice_date as date
      FROM sales_invoices si
      LEFT JOIN customers c ON c.id = si.customer_id
      WHERE si.tenant_id = ?
      UNION ALL
      SELECT 
        'Purchase Invoice' as type,
        invoice_number as number,
        v.name as party,
        total_amount as amount,
        invoice_date as date
      FROM purchase_invoices pi
      LEFT JOIN vendors v ON v.id = pi.vendor_id
      WHERE pi.tenant_id = ?
      UNION ALL
      SELECT 
        'Receipt' as type,
        receipt_number as number,
        c.name as party,
        amount,
        receipt_date as date
      FROM customer_receipts cr
      LEFT JOIN customers c ON c.id = cr.customer_id
      WHERE cr.tenant_id = ?
      UNION ALL
      SELECT 
        'Payment' as type,
        payment_number as number,
        v.name as party,
        amount,
        payment_date as date
      FROM vendor_payments vp
      LEFT JOIN vendors v ON v.id = vp.vendor_id
      WHERE vp.tenant_id = ?
      ORDER BY date DESC
      LIMIT ?
    `).all(tenantId, tenantId, tenantId, tenantId, limit);
  }
}

export const dashboardService = new DashboardService();

