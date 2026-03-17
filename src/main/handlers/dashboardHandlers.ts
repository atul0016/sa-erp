/**
 * SA ERP - Dashboard IPC Handlers
 */

import { ipcMain } from 'electron';
import { dashboardService } from '../services';

export function registerDashboardHandlers(): void {
  ipcMain.handle('dashboard:getStats', async (_, tenantId: string) => {
    try {
      return { success: true, data: dashboardService.getDashboardStats(tenantId) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('dashboard:getRecentTransactions', async (_, tenantId: string, limit?: number) => {
    try {
      return { success: true, data: dashboardService.getRecentTransactions(tenantId, limit) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });
}

