/**
 * SA ERP - Sales IPC Handlers
 */

import { ipcMain } from 'electron';
import { getSalesService } from '../services/sales';

export function registerSalesHandlers() {
  // Customers
  ipcMain.handle('sales:createCustomer', async (_, tenantId: string, data: unknown) => {
    try {
      return { success: true, data: getSalesService().createCustomer(tenantId, data as Record<string, unknown>) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('sales:updateCustomer', async (_, id: string, tenantId: string, data: unknown) => {
    try {
      const result = getSalesService().updateCustomer(id, tenantId, data as Record<string, unknown>);
      return result ? { success: true, data: result } : { success: false, error: 'Customer not found' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('sales:getCustomer', async (_, id: string, tenantId: string) => {
    try {
      const customer = getSalesService().getCustomer(id, tenantId);
      return customer ? { success: true, data: customer } : { success: false, error: 'Customer not found' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('sales:searchCustomers', async (_, tenantId: string, query: string) => {
    try {
      return { success: true, data: getSalesService().searchCustomers(tenantId, query) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('sales:getCustomerBalance', async (_, tenantId: string, customerId: string) => {
    try {
      return { success: true, data: getSalesService().getCustomerBalance(tenantId, customerId) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Sales Orders
  ipcMain.handle('sales:createSalesOrder', async (_, tenantId: string, data: unknown, userId: string) => {
    try {
      const service = getSalesService();
      const order = service.createSalesOrder(
        tenantId,
        data as Parameters<typeof service.createSalesOrder>[1],
        userId
      );
      return { success: true, data: order };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('sales:getSalesOrder', async (_, id: string, tenantId: string) => {
    try {
      const order = getSalesService().getSalesOrder(id, tenantId);
      return order ? { success: true, data: order } : { success: false, error: 'Sales order not found' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('sales:confirmSalesOrder', async (_, id: string, tenantId: string) => {
    try {
      const result = getSalesService().confirmSalesOrder(id, tenantId);
      return { success: result, error: result ? undefined : 'Failed to confirm sales order' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Sales Invoices
  ipcMain.handle('sales:createSalesInvoice', async (_, tenantId: string, data: unknown, userId: string) => {
    try {
      const service = getSalesService();
      const invoice = service.createSalesInvoice(
        tenantId,
        data as Parameters<typeof service.createSalesInvoice>[1],
        userId
      );
      return { success: true, data: invoice };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('sales:getSalesInvoice', async (_, id: string, tenantId: string) => {
    try {
      const invoice = getSalesService().getSalesInvoice(id, tenantId);
      return invoice ? { success: true, data: invoice } : { success: false, error: 'Invoice not found' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('sales:getOutstandingInvoices', async (_, tenantId: string, customerId?: string) => {
    try {
      return { success: true, data: getSalesService().getOutstandingInvoices(tenantId, customerId) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Customer Receipts
  ipcMain.handle('sales:createCustomerReceipt', async (_, tenantId: string, data: unknown, userId: string) => {
    try {
      const service = getSalesService();
      const receipt = service.createCustomerReceipt(
        tenantId,
        data as Parameters<typeof service.createCustomerReceipt>[1],
        userId
      );
      return { success: true, data: receipt };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('sales:getCustomerReceipts', async (_, tenantId: string) => {
    try {
      return { success: true, data: getSalesService().getAllCustomerReceipts(tenantId) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('sales:getSalesOrders', async (_, tenantId: string) => {
    try {
      return { success: true, data: getSalesService().getAllSalesOrders(tenantId) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('sales:getSalesInvoices', async (_, tenantId: string) => {
    try {
      return { success: true, data: getSalesService().getAllSalesInvoices(tenantId) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Reports
  ipcMain.handle('sales:getSalesReport', async (_, tenantId: string, fromDate: string, toDate: string) => {
    try {
      return { success: true, data: getSalesService().getSalesReport(tenantId, fromDate, toDate) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('sales:getAgingReport', async (_, tenantId: string) => {
    try {
      return { success: true, data: getSalesService().getAgingReport(tenantId) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });
}

