/**
 * SA ERP - Purchase IPC Handlers
 */

import { ipcMain } from 'electron';
import { getPurchaseService } from '../services/purchase';

export function registerPurchaseHandlers() {
  // Vendors
  ipcMain.handle('purchase:createVendor', async (_, tenantId: string, data: unknown) => {
    try {
      return { success: true, data: getPurchaseService().createVendor(tenantId, data as Record<string, unknown>) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('purchase:updateVendor', async (_, id: string, tenantId: string, data: unknown) => {
    try {
      const result = getPurchaseService().updateVendor(id, tenantId, data as Record<string, unknown>);
      return result ? { success: true, data: result } : { success: false, error: 'Vendor not found' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('purchase:getVendor', async (_, id: string, tenantId: string) => {
    try {
      const vendor = getPurchaseService().getVendor(id, tenantId);
      return vendor ? { success: true, data: vendor } : { success: false, error: 'Vendor not found' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('purchase:searchVendors', async (_, tenantId: string, query: string) => {
    try {
      return { success: true, data: getPurchaseService().searchVendors(tenantId, query) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('purchase:getVendorBalance', async (_, tenantId: string, vendorId: string) => {
    try {
      return { success: true, data: getPurchaseService().getVendorBalance(tenantId, vendorId) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Purchase Orders
  ipcMain.handle('purchase:createPurchaseOrder', async (_, tenantId: string, data: unknown, userId: string) => {
    try {
      const service = getPurchaseService();
      const order = service.createPurchaseOrder(
        tenantId,
        data as Parameters<typeof service.createPurchaseOrder>[1],
        userId
      );
      return { success: true, data: order };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('purchase:getPurchaseOrder', async (_, id: string, tenantId: string) => {
    try {
      const order = getPurchaseService().getPurchaseOrder(id, tenantId);
      return order ? { success: true, data: order } : { success: false, error: 'Purchase order not found' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('purchase:approvePurchaseOrder', async (_, id: string, tenantId: string) => {
    try {
      const result = getPurchaseService().approvePurchaseOrder(id, tenantId);
      return { success: result, error: result ? undefined : 'Failed to approve purchase order' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('purchase:getPendingPurchaseOrders', async (_, tenantId: string, vendorId?: string) => {
    try {
      return { success: true, data: getPurchaseService().getPendingPurchaseOrders(tenantId, vendorId) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // GRN
  ipcMain.handle('purchase:createGRN', async (_, tenantId: string, data: unknown, userId: string) => {
    try {
      const service = getPurchaseService();
      const grn = service.createGRN(
        tenantId,
        data as Parameters<typeof service.createGRN>[1],
        userId
      );
      return { success: true, data: grn };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Purchase Invoices
  ipcMain.handle('purchase:createPurchaseInvoice', async (_, tenantId: string, data: unknown, userId: string) => {
    try {
      const service = getPurchaseService();
      const invoice = service.createPurchaseInvoice(
        tenantId,
        data as Parameters<typeof service.createPurchaseInvoice>[1],
        userId
      );
      return { success: true, data: invoice };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('purchase:getOutstandingInvoices', async (_, tenantId: string, vendorId?: string) => {
    try {
      return { success: true, data: getPurchaseService().getOutstandingInvoices(tenantId, vendorId) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Vendor Payments
  ipcMain.handle('purchase:createVendorPayment', async (_, tenantId: string, data: unknown, userId: string) => {
    try {
      const service = getPurchaseService();
      const payment = service.createVendorPayment(
        tenantId,
        data as Parameters<typeof service.createVendorPayment>[1],
        userId
      );
      return { success: true, data: payment };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('purchase:getVendorPayments', async (_, tenantId: string) => {
    try {
      return { success: true, data: getPurchaseService().getAllVendorPayments(tenantId) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('purchase:getPurchaseOrders', async (_, tenantId: string) => {
    try {
      return { success: true, data: getPurchaseService().getAllPurchaseOrders(tenantId) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('purchase:getPurchaseInvoices', async (_, tenantId: string) => {
    try {
      return { success: true, data: getPurchaseService().getAllPurchaseInvoices(tenantId) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('purchase:getGoodsReceiptNotes', async (_, tenantId: string) => {
    try {
      return { success: true, data: getPurchaseService().getAllGoodsReceiptNotes(tenantId) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Reports
  ipcMain.handle('purchase:getPurchaseReport', async (_, tenantId: string, fromDate: string, toDate: string) => {
    try {
      return { success: true, data: getPurchaseService().getPurchaseReport(tenantId, fromDate, toDate) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('purchase:getAgingReport', async (_, tenantId: string) => {
    try {
      return { success: true, data: getPurchaseService().getAgingReport(tenantId) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });
}

