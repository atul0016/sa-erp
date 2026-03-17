/**
 * SA ERP - Master Data IPC Handlers
 */

import { ipcMain } from 'electron';
import { getDatabase } from '../database';
import { generateId } from '../database/repository';
import bcrypt from 'bcryptjs';

export function registerMasterHandlers() {
  const db = () => getDatabase();

  // Tenants
  ipcMain.handle('master:getTenant', async (_, tenantId: string) => {
    try {
      const tenant = db().prepare('SELECT * FROM tenants WHERE id = ?').get(tenantId);
      return tenant ? { success: true, data: tenant } : { success: false, error: 'Tenant not found' };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('master:updateTenant', async (_, tenantId: string, data: Record<string, unknown>) => {
    try {
      const updates = Object.entries(data)
        .filter(([key]) => !['id', 'code'].includes(key))
        .map(([key]) => `${key} = ?`);
      
      if (updates.length === 0) {
        return { success: false, error: 'No fields to update' };
      }
      
      const values = Object.entries(data)
        .filter(([key]) => !['id', 'code'].includes(key))
        .map(([, value]) => value);
      
      db().prepare(`UPDATE tenants SET ${updates.join(', ')} WHERE id = ?`).run(...values, tenantId);
      
      const updated = db().prepare('SELECT * FROM tenants WHERE id = ?').get(tenantId);
      return { success: true, data: updated };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Users
  ipcMain.handle('master:getUsers', async (_, tenantId: string) => {
    try {
      const users = db().prepare(
        'SELECT id, tenant_id, username, email, first_name, last_name, roles, is_active FROM users WHERE tenant_id = ?'
      ).all(tenantId);
      return { success: true, data: users };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('master:createUser', async (_, tenantId: string, data: {
    username: string;
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    roles: string[];
  }) => {
    try {
      const passwordHash = bcrypt.hashSync(data.password, 10);
      const userId = generateId();
      
      db().prepare(`
        INSERT INTO users (id, tenant_id, username, email, password_hash, first_name, last_name, roles, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
      `).run(userId, tenantId, data.username, data.email, passwordHash, data.first_name, data.last_name, JSON.stringify(data.roles));
      
      const user = db().prepare(
        'SELECT id, tenant_id, username, email, first_name, last_name, roles, is_active FROM users WHERE id = ?'
      ).get(userId);
      return { success: true, data: user };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('master:updateUser', async (_, id: string, tenantId: string, data: Record<string, unknown>) => {
    try {
      const allowedFields = ['email', 'first_name', 'last_name', 'roles', 'is_active'];
      const updates = Object.entries(data)
        .filter(([key]) => allowedFields.includes(key))
        .map(([key]) => `${key} = ?`);
      
      if (updates.length === 0) {
        return { success: false, error: 'No valid fields to update' };
      }
      
      const values = Object.entries(data)
        .filter(([key]) => allowedFields.includes(key))
        .map(([key, value]) => key === 'roles' ? JSON.stringify(value) : value);
      
      db().prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ? AND tenant_id = ?`).run(...values, id, tenantId);
      
      const user = db().prepare(
        'SELECT id, tenant_id, username, email, first_name, last_name, roles, is_active FROM users WHERE id = ?'
      ).get(id);
      return { success: true, data: user };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Roles
  ipcMain.handle('master:getRoles', async (_, tenantId: string) => {
    try {
      const roles = db().prepare('SELECT * FROM roles WHERE tenant_id = ?').all(tenantId);
      return { success: true, data: roles };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Units of Measure
  ipcMain.handle('master:getUnitsOfMeasure', async (_, tenantId: string) => {
    try {
      const uoms = db().prepare('SELECT * FROM units_of_measure WHERE tenant_id = ? AND is_active = 1').all(tenantId);
      return { success: true, data: uoms };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // HSN Codes
  ipcMain.handle('master:getHSNCodes', async (_, query?: string) => {
    try {
      let sql = 'SELECT * FROM hsn_codes';
      const params: string[] = [];
      
      if (query) {
        sql += ' WHERE code LIKE ? OR description LIKE ?';
        params.push(`%${query}%`, `%${query}%`);
      }
      
      sql += ' ORDER BY code LIMIT 100';
      
      const hsnCodes = db().prepare(sql).all(...params);
      return { success: true, data: hsnCodes };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Categories
  ipcMain.handle('master:getCategories', async (_, tenantId: string) => {
    try {
      const categories = db().prepare(
        'SELECT * FROM categories WHERE tenant_id = ? AND is_active = 1 ORDER BY name'
      ).all(tenantId);
      return { success: true, data: categories };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('master:createCategory', async (_, tenantId: string, data: { name: string; parent_id?: string }) => {
    try {
      const categoryId = generateId();
      
      db().prepare(`
        INSERT INTO categories (id, tenant_id, name, parent_id, is_active)
        VALUES (?, ?, ?, ?, 1)
      `).run(categoryId, tenantId, data.name, data.parent_id || null);
      
      const category = db().prepare('SELECT * FROM categories WHERE id = ?').get(categoryId);
      return { success: true, data: category };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  // Authentication
  ipcMain.handle('auth:login', async (_, username: string, password: string) => {
    try {
      const user = db().prepare(`
        SELECT u.*, t.name as tenant_name, t.code as tenant_code
        FROM users u
        JOIN tenants t ON t.id = u.tenant_id
        WHERE u.username = ? AND u.is_active = 1
      `).get(username) as { password_hash: string; [key: string]: unknown } | undefined;
      
      if (!user) {
        return { success: false, error: 'Invalid username or password' };
      }
      
      const isValid = bcrypt.compareSync(password, user.password_hash);
      if (!isValid) {
        return { success: false, error: 'Invalid username or password' };
      }
      
      // Remove password hash from response
      const { password_hash, ...userData } = user;
      
      // Update last login
      db().prepare('UPDATE users SET last_login = datetime("now") WHERE id = ?').run(user.id);
      
      return { success: true, data: userData };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });

  ipcMain.handle('auth:changePassword', async (_, userId: string, oldPassword: string, newPassword: string) => {
    try {
      const user = db().prepare('SELECT password_hash FROM users WHERE id = ?').get(userId) as { password_hash: string } | undefined;
      
      if (!user) {
        return { success: false, error: 'User not found' };
      }
      
      const isValid = bcrypt.compareSync(oldPassword, user.password_hash);
      if (!isValid) {
        return { success: false, error: 'Current password is incorrect' };
      }
      
      const newHash = bcrypt.hashSync(newPassword, 10);
      db().prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, userId);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  });
}

