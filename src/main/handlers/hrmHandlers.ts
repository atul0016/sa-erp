/**
 * SA ERP - HRM IPC Handlers
 */

import { ipcMain } from 'electron';
import { hrmService } from '../services/hrm';

export function registerHRMHandlers() {
  // Employees
  ipcMain.handle('hrm:createEmployee', async (_, tenantId: string, data: unknown) => {
    try {
      return { success: true, data: hrmService.createEmployee(tenantId, data as Parameters<typeof hrmService.createEmployee>[1]) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('hrm:getEmployee', async (_, id: string, tenantId: string) => {
    try {
      const employee = hrmService.getEmployee(id, tenantId);
      return employee ? { success: true, data: employee } : { success: false, error: 'Employee not found' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('hrm:getEmployees', async (_, tenantId: string, filters?: { departmentId?: string; status?: string }) => {
    try {
      return { success: true, data: hrmService.getEmployees(tenantId, filters) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('hrm:updateEmployee', async (_, id: string, tenantId: string, data: unknown) => {
    try {
      const employee = hrmService.updateEmployee(id, tenantId, data as Record<string, unknown>);
      return employee ? { success: true, data: employee } : { success: false, error: 'Employee not found' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Salary Structure
  ipcMain.handle('hrm:createSalaryStructure', async (_, tenantId: string, data: unknown) => {
    try {
      return { success: true, data: hrmService.createSalaryStructure(tenantId, data as Parameters<typeof hrmService.createSalaryStructure>[1]) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('hrm:getSalaryStructure', async (_, employeeId: string, tenantId: string) => {
    try {
      const ss = hrmService.getSalaryStructure(employeeId, tenantId);
      return ss ? { success: true, data: ss } : { success: false, error: 'Salary structure not found' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Attendance
  ipcMain.handle('hrm:recordAttendance', async (_, tenantId: string, data: unknown) => {
    try {
      return { success: true, data: hrmService.recordAttendance(tenantId, data as Parameters<typeof hrmService.recordAttendance>[1]) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('hrm:getAttendanceReport', async (_, tenantId: string, employeeId: string, month: string) => {
    try {
      return { success: true, data: hrmService.getAttendanceReport(tenantId, employeeId, month) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Leave Management
  ipcMain.handle('hrm:applyLeave', async (_, tenantId: string, data: unknown, userId: string) => {
    try {
      return { success: true, data: hrmService.applyLeave(tenantId, data as Parameters<typeof hrmService.applyLeave>[1], userId) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('hrm:approveLeave', async (_, id: string, tenantId: string, approverId: string, approved: boolean, remarks?: string) => {
    try {
      const result = hrmService.approveLeave(id, tenantId, approverId, approved, remarks);
      return { success: result, error: result ? undefined : 'Failed to process leave' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('hrm:getLeaveBalance', async (_, tenantId: string, employeeId: string, year?: string) => {
    try {
      return { success: true, data: hrmService.getLeaveBalance(tenantId, employeeId, year) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('hrm:getLeaves', async (_, tenantId: string, filters?: unknown) => {
    try {
      return { success: true, data: hrmService.getLeaves(tenantId, filters as Parameters<typeof hrmService.getLeaves>[1]) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Payroll
  ipcMain.handle('hrm:processPayroll', async (_, tenantId: string, month: string, userId: string) => {
    try {
      return { success: true, data: hrmService.processPayroll(tenantId, month, userId) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('hrm:getPayslip', async (_, employeeId: string, tenantId: string, month: string) => {
    try {
      const payslip = hrmService.getPayslip(employeeId, tenantId, month);
      return payslip ? { success: true, data: payslip } : { success: false, error: 'Payslip not found' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Tax Declarations
  ipcMain.handle('hrm:submitTaxDeclaration', async (_, tenantId: string, data: unknown) => {
    try {
      return { success: true, data: hrmService.submitTaxDeclaration(tenantId, data as Parameters<typeof hrmService.submitTaxDeclaration>[1]) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Form 16
  ipcMain.handle('hrm:generateForm16', async (_, tenantId: string, employeeId: string, fiscalYear: string) => {
    try {
      return { success: true, data: hrmService.generateForm16(tenantId, employeeId, fiscalYear) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // PF/ESI Reports
  ipcMain.handle('hrm:getPFReport', async (_, tenantId: string, month: string) => {
    try {
      return { success: true, data: hrmService.getPFReport(tenantId, month) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('hrm:getESIReport', async (_, tenantId: string, month: string) => {
    try {
      return { success: true, data: hrmService.getESIReport(tenantId, month) };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });
}

