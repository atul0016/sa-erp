/**
 * SA ERP - Inventory IPC Handlers
 */

import { ipcMain } from 'electron';
import { getInventoryService } from '../services/inventory';

export function registerInventoryHandlers() {
  // Items
  ipcMain.handle('inventory:createItem', async (_, tenantId: string, data: unknown) => {
    try {
      return { success: true, data: getInventoryService().createItem(tenantId, data as Record<string, unknown>) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('inventory:updateItem', async (_, id: string, tenantId: string, data: unknown) => {
    try {
      const result = getInventoryService().updateItem(id, tenantId, data as Record<string, unknown>);
      return result ? { success: true, data: result } : { success: false, error: 'Item not found' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('inventory:getItem', async (_, id: string, tenantId: string) => {
    try {
      const item = getInventoryService().getItem(id, tenantId);
      return item ? { success: true, data: item } : { success: false, error: 'Item not found' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('inventory:searchItems', async (_, tenantId: string, query: string, limit?: number) => {
    try {
      return { success: true, data: getInventoryService().searchItems(tenantId, query, limit) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('inventory:getLowStockItems', async (_, tenantId: string) => {
    try {
      return { success: true, data: getInventoryService().getLowStockItems(tenantId) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('inventory:getItems', async (_, tenantId: string) => {
    try {
      return { success: true, data: getInventoryService().getAllItems(tenantId) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('inventory:getLowStockAlerts', async (_, tenantId: string) => {
    try {
      return { success: true, data: getInventoryService().getLowStockAlerts(tenantId) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Warehouses
  ipcMain.handle('inventory:createWarehouse', async (_, tenantId: string, data: unknown) => {
    try {
      return { success: true, data: getInventoryService().createWarehouse(tenantId, data as Record<string, unknown>) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('inventory:getWarehouse', async (_, id: string, tenantId: string) => {
    try {
      const warehouse = getInventoryService().getWarehouse(id, tenantId);
      return warehouse ? { success: true, data: warehouse } : { success: false, error: 'Warehouse not found' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('inventory:getWarehouses', async (_, tenantId: string) => {
    try {
      return { success: true, data: getInventoryService().getWarehouses(tenantId) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Stock Operations
  ipcMain.handle('inventory:receiveStock', async (_, tenantId: string, data: unknown, userId: string) => {
    try {
      const service = getInventoryService();
      const result = service.receiveStock(
        tenantId,
        data as Parameters<typeof service.receiveStock>[1],
        userId
      );
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('inventory:issueStock', async (_, tenantId: string, data: unknown, userId: string) => {
    try {
      const service = getInventoryService();
      const result = service.issueStock(
        tenantId,
        data as Parameters<typeof service.issueStock>[1],
        userId
      );
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('inventory:transferStock', async (_, tenantId: string, data: unknown, userId: string) => {
    try {
      const service = getInventoryService();
      const result = service.transferStock(
        tenantId,
        data as Parameters<typeof service.transferStock>[1],
        userId
      );
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('inventory:adjustStock', async (_, tenantId: string, data: unknown, userId: string) => {
    try {
      const service = getInventoryService();
      const result = service.adjustStock(
        tenantId,
        data as Parameters<typeof service.adjustStock>[1],
        userId
      );
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Stock Queries
  ipcMain.handle('inventory:getItemStock', async (_, tenantId: string, itemId: string) => {
    try {
      return { success: true, data: getInventoryService().getItemStock(tenantId, itemId) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('inventory:getStockMovements', async (_, tenantId: string, itemId: string, fromDate?: string, toDate?: string) => {
    try {
      return { success: true, data: getInventoryService().getStockMovements(tenantId, itemId, fromDate, toDate) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('inventory:getStockValuation', async (_, tenantId: string) => {
    try {
      return { success: true, data: getInventoryService().getStockValuation(tenantId) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });
}

