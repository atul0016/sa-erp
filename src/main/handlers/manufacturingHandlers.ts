/**
 * SA ERP - Manufacturing IPC Handlers
 */

import { ipcMain } from 'electron';
import { manufacturingService } from '../services/manufacturing';

export function registerManufacturingHandlers() {
  // BOM
  ipcMain.handle('manufacturing:createBOM', async (_, tenantId: string, data: unknown, userId: string) => {
    try {
      const bom = manufacturingService.createBOM(
        tenantId,
        data as Parameters<typeof manufacturingService.createBOM>[1],
        userId
      );
      return { success: true, data: bom };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('manufacturing:getBOM', async (_, id: string, tenantId: string) => {
    try {
      const bom = manufacturingService.getBOM(id, tenantId);
      return bom ? { success: true, data: bom } : { success: false, error: 'BOM not found' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('manufacturing:getBOMsForItem', async (_, tenantId: string, itemId: string) => {
    try {
      return { success: true, data: manufacturingService.getBOMsForItem(tenantId, itemId) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('manufacturing:approveBOM', async (_, id: string, tenantId: string) => {
    try {
      const result = manufacturingService.approveBOM(id, tenantId);
      return { success: result, error: result ? undefined : 'Failed to approve BOM' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('manufacturing:setDefaultBOM', async (_, id: string, tenantId: string) => {
    try {
      const result = manufacturingService.setDefaultBOM(id, tenantId);
      return { success: result, error: result ? undefined : 'Failed to set default BOM' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Work Centers
  ipcMain.handle('manufacturing:createWorkCenter', async (_, tenantId: string, data: unknown) => {
    try {
      return {
        success: true,
        data: manufacturingService.createWorkCenter(
          tenantId,
          data as Parameters<typeof manufacturingService.createWorkCenter>[1]
        )
      };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('manufacturing:getWorkCenters', async (_, tenantId: string) => {
    try {
      return { success: true, data: manufacturingService.getWorkCenters(tenantId) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('manufacturing:getWorkCenterUtilization', async (_, tenantId: string, workCenterId: string, fromDate: string, toDate: string) => {
    try {
      return { success: true, data: manufacturingService.getWorkCenterUtilization(tenantId, workCenterId, fromDate, toDate) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Production Orders
  ipcMain.handle('manufacturing:createProductionOrder', async (_, tenantId: string, data: unknown, userId: string) => {
    try {
      const po = manufacturingService.createProductionOrder(
        tenantId,
        data as Parameters<typeof manufacturingService.createProductionOrder>[1],
        userId
      );
      return { success: true, data: po };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('manufacturing:getProductionOrder', async (_, id: string, tenantId: string) => {
    try {
      const po = manufacturingService.getProductionOrder(id, tenantId);
      return po ? { success: true, data: po } : { success: false, error: 'Production order not found' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('manufacturing:releaseProductionOrder', async (_, id: string, tenantId: string) => {
    try {
      const result = manufacturingService.releaseProductionOrder(id, tenantId);
      return { success: result, error: result ? undefined : 'Failed to release production order' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('manufacturing:startProductionOrder', async (_, id: string, tenantId: string) => {
    try {
      const result = manufacturingService.startProductionOrder(id, tenantId);
      return { success: result, error: result ? undefined : 'Failed to start production order' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('manufacturing:issueMaterials', async (_, tenantId: string, productionOrderId: string, data: unknown, userId: string) => {
    try {
      const result = manufacturingService.issueMaterials(
        tenantId,
        productionOrderId,
        data as Parameters<typeof manufacturingService.issueMaterials>[2],
        userId
      );
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('manufacturing:recordProduction', async (_, tenantId: string, productionOrderId: string, data: unknown, userId: string) => {
    try {
      const result = manufacturingService.recordProduction(
        tenantId,
        productionOrderId,
        data as Parameters<typeof manufacturingService.recordProduction>[2],
        userId
      );
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // MRP
  ipcMain.handle('manufacturing:runMRP', async (_, tenantId: string, data: unknown) => {
    try {
      return { success: true, data: manufacturingService.runMRP(tenantId, data as Parameters<typeof manufacturingService.runMRP>[1]) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Job Work
  ipcMain.handle('manufacturing:createJobWorkOrder', async (_, tenantId: string, data: unknown, userId: string) => {
    try {
      const jw = manufacturingService.createJobWorkOrder(
        tenantId,
        data as Parameters<typeof manufacturingService.createJobWorkOrder>[1],
        userId
      );
      return { success: true, data: jw };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('manufacturing:getJobWorkOrder', async (_, id: string, tenantId: string) => {
    try {
      const jw = manufacturingService.getJobWorkOrder(id, tenantId);
      return jw ? { success: true, data: jw } : { success: false, error: 'Job work order not found' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // QC
  ipcMain.handle('manufacturing:createQCInspection', async (_, tenantId: string, data: unknown, userId: string) => {
    try {
      const qc = manufacturingService.createQCInspection(
        tenantId,
        data as Parameters<typeof manufacturingService.createQCInspection>[1],
        userId
      );
      return { success: true, data: qc };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('manufacturing:getQCInspection', async (_, id: string, tenantId: string) => {
    try {
      const qc = manufacturingService.getQCInspection(id, tenantId);
      return qc ? { success: true, data: qc } : { success: false, error: 'QC inspection not found' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Reports
  ipcMain.handle('manufacturing:getProductionReport', async (_, tenantId: string, fromDate: string, toDate: string) => {
    try {
      return { success: true, data: manufacturingService.getProductionReport(tenantId, fromDate, toDate) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('manufacturing:getWorkCenterLoadReport', async (_, tenantId: string, fromDate: string, toDate: string) => {
    try {
      return { success: true, data: manufacturingService.getWorkCenterLoadReport(tenantId, fromDate, toDate) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });
}

