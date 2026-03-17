/**
 * SA ERP - Finance IPC Handlers
 */

import { ipcMain } from 'electron';
import { getFinanceService } from '../services/finance';

export function registerFinanceHandlers() {
  // Chart of Accounts
  ipcMain.handle('finance:getChartOfAccounts', async (_, tenantId: string) => {
    try {
      return { success: true, data: getFinanceService().getChartOfAccounts(tenantId) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('finance:createAccount', async (_, tenantId: string, data: unknown) => {
    try {
      return { success: true, data: getFinanceService().createAccount(tenantId, data as Record<string, unknown>) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('finance:updateAccount', async (_, id: string, tenantId: string, data: unknown) => {
    try {
      const result = getFinanceService().updateAccount(id, tenantId, data as Record<string, unknown>);
      return result ? { success: true, data: result } : { success: false, error: 'Account not found' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('finance:getAccountBalance', async (_, tenantId: string, accountId: string, asOfDate?: string) => {
    try {
      return { success: true, data: getFinanceService().getAccountBalance(tenantId, accountId, asOfDate) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('finance:getTrialBalance', async (_, tenantId: string, asOfDate?: string) => {
    try {
      return { success: true, data: getFinanceService().getTrialBalance(tenantId, asOfDate) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Journal Entries
  ipcMain.handle('finance:createJournalEntry', async (_, tenantId: string, data: unknown, userId: string) => {
    try {
      const service = getFinanceService();
      const entry = service.createJournalEntry(tenantId, data as Parameters<typeof service.createJournalEntry>[1], userId);
      return { success: true, data: entry };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('finance:getJournalEntry', async (_, id: string, tenantId: string) => {
    try {
      const entry = getFinanceService().getJournalEntry(id, tenantId);
      return entry ? { success: true, data: entry } : { success: false, error: 'Journal entry not found' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('finance:postJournalEntry', async (_, id: string, tenantId: string) => {
    try {
      const result = getFinanceService().postJournalEntry(id, tenantId);
      return { success: result, error: result ? undefined : 'Failed to post journal entry' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('finance:getAccountLedger', async (_, tenantId: string, accountId: string, fromDate: string, toDate: string) => {
    try {
      return { success: true, data: getFinanceService().getAccountLedger(tenantId, accountId, fromDate, toDate) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Reports
  ipcMain.handle('finance:getProfitAndLoss', async (_, tenantId: string, fromDate: string, toDate: string) => {
    try {
      return { success: true, data: getFinanceService().getProfitAndLoss(tenantId, fromDate, toDate) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('finance:getBalanceSheet', async (_, tenantId: string, asOfDate: string) => {
    try {
      return { success: true, data: getFinanceService().getBalanceSheet(tenantId, asOfDate) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });
}

