/**
 * SA ERP - GST IPC Handlers
 */

import { ipcMain } from 'electron';
import { getGSTService } from '../services/gst';
import tdsService from '../services/gst/tdsService';
import { getDatabase } from '../database';

export function registerGSTHandlers() {
  // E-Invoice
  ipcMain.handle('gst:generateEInvoiceJson', async (_, tenantId: string, invoiceId: string) => {
    try {
      return { success: true, data: getGSTService().generateEInvoiceJson(tenantId, invoiceId) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('gst:submitEInvoice', async (_, tenantId: string, invoiceId: string, userId: string) => {
    try {
      const result = await getGSTService().submitEInvoice(tenantId, invoiceId, userId);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('gst:cancelEInvoice', async (_, tenantId: string, einvoiceId: string, reason: string) => {
    try {
      const result = await getGSTService().cancelEInvoice(tenantId, einvoiceId, reason);
      return { success: result, error: result ? undefined : 'Failed to cancel e-invoice' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // E-Way Bill
  ipcMain.handle('gst:generateEwayBill', async (_, tenantId: string, data: unknown, userId: string) => {
    try {
      const service = getGSTService();
      const result = await service.generateEwayBill(
        tenantId,
        data as Parameters<typeof service.generateEwayBill>[1],
        userId
      );
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('gst:updateEwayBillVehicle', async (_, tenantId: string, ewayBillId: string, vehicleNumber: string, reason: string) => {
    try {
      const result = await getGSTService().updateEwayBillVehicle(tenantId, ewayBillId, vehicleNumber, reason);
      return { success: result, error: result ? undefined : 'Failed to update e-way bill' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('gst:getExpiringEwayBills', async (_, tenantId: string, daysAhead?: number) => {
    try {
      return { success: true, data: getGSTService().getExpiringEwayBills(tenantId, daysAhead) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // GSTR Returns
  ipcMain.handle('gst:prepareGSTR1', async (_, tenantId: string, returnPeriod: string) => {
    try {
      return { success: true, data: getGSTService().prepareGSTR1(tenantId, returnPeriod) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('gst:getGSTR1B2BDetails', async (_, tenantId: string, returnPeriod: string) => {
    try {
      return { success: true, data: getGSTService().getGSTR1B2BDetails(tenantId, returnPeriod) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // ITC Reconciliation
  ipcMain.handle('gst:performITCReconciliation', async (_, tenantId: string, returnPeriod: string) => {
    try {
      return { success: true, data: getGSTService().performITCReconciliation(tenantId, returnPeriod) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Reports
  ipcMain.handle('gst:getGSTLiabilitySummary', async (_, tenantId: string, fromDate: string, toDate: string) => {
    try {
      return { success: true, data: getGSTService().getGSTLiabilitySummary(tenantId, fromDate, toDate) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('gst:getHSNWiseSummary', async (_, tenantId: string, fromDate: string, toDate: string) => {
    try {
      return { success: true, data: getGSTService().getHSNWiseSummary(tenantId, fromDate, toDate) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // TDS Management
  ipcMain.handle('gst:getTdsSections', async () => {
    try {
      return { success: true, data: tdsService.getTdsSections(getDatabase()) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('gst:getTdsTransactions', async (_, tenantId: string, filters?: unknown) => {
    try {
      return { success: true, data: tdsService.getTdsTransactions(getDatabase(), tenantId, filters as any) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('gst:getTdsSummary', async (_, tenantId: string, quarter?: string) => {
    try {
      return { success: true, data: tdsService.getTdsSummary(getDatabase(), tenantId, quarter) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });
}

