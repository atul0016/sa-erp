/**
 * SA ERP - Report IPC Handlers
 */

import { ipcMain, BrowserWindow } from 'electron';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';

export function registerReportHandlers() {
  // Export to PDF
  ipcMain.handle('report:exportToPdf', async (_, reportType: string, data: unknown) => {
    try {
      const win = BrowserWindow.getFocusedWindow();
      if (!win) {
        return { success: false, error: 'No active window' };
      }

      const pdfPath = path.join(
        app.getPath('downloads'),
        `${reportType}_${Date.now()}.pdf`
      );

      const pdfData = await win.webContents.printToPDF({
        printBackground: true,
        pageSize: 'A4'
      });

      fs.writeFileSync(pdfPath, pdfData);

      return { success: true, data: { path: pdfPath } };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Export to Excel
  ipcMain.handle('report:exportToExcel', async (_, reportType: string, data: unknown) => {
    try {
      // In production, you would use ExcelJS or similar library
      // This is a placeholder implementation
      const ExcelJS = require('exceljs');
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet(reportType);

      // Add data based on report type
      const reportData = data as Record<string, unknown>;
      
      if (Array.isArray(reportData)) {
        // Add headers
        if (reportData.length > 0) {
          const headers = Object.keys(reportData[0] as object);
          sheet.addRow(headers);
          
          // Add data rows
          for (const row of reportData) {
            sheet.addRow(Object.values(row as object));
          }
        }
      }

      const excelPath = path.join(
        app.getPath('downloads'),
        `${reportType}_${Date.now()}.xlsx`
      );

      await workbook.xlsx.writeFile(excelPath);

      return { success: true, data: { path: excelPath } };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Print
  ipcMain.handle('report:print', async (_, reportType: string, data: unknown) => {
    try {
      const win = BrowserWindow.getFocusedWindow();
      if (!win) {
        return { success: false, error: 'No active window' };
      }

      await win.webContents.print({
        silent: false,
        printBackground: true
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });
}

