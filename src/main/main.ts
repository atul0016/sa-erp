/**
 * SA ERP - Main Process Entry Point
 */

import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { initDatabase, closeDatabase } from './database';
import { registerFinanceHandlers } from './handlers/financeHandlers';
import { registerInventoryHandlers } from './handlers/inventoryHandlers';
import { registerSalesHandlers } from './handlers/salesHandlers';
import { registerPurchaseHandlers } from './handlers/purchaseHandlers';
import { registerGSTHandlers } from './handlers/gstHandlers';
import { registerMasterHandlers } from './handlers/masterHandlers';
import { registerReportHandlers } from './handlers/reportHandlers';
import { registerManufacturingHandlers } from './handlers/manufacturingHandlers';
import { registerHRMHandlers } from './handlers/hrmHandlers';
import { registerDashboardHandlers } from './handlers/dashboardHandlers';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    icon: path.join(__dirname, '../renderer/assets/icon.png'),
    show: false
  });

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Initialize app
app.whenReady().then(() => {
  // Initialize database
  initDatabase();

  // Register IPC handlers
  registerFinanceHandlers();
  registerInventoryHandlers();
  registerSalesHandlers();
  registerPurchaseHandlers();
  registerGSTHandlers();
  registerMasterHandlers();
  registerReportHandlers();
  registerManufacturingHandlers();
  registerHRMHandlers();
  registerDashboardHandlers();

  // Create window
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Cleanup on quit
app.on('window-all-closed', () => {
  closeDatabase();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  closeDatabase();
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

