/**
 * SA ERP - Appwrite Auth Service
 * Handles login, logout, session management via Appwrite Account API
 */

import { account } from './appwrite';
import { ID, type Models } from 'appwrite';

export interface ERPUser {
  id: string;
  tenant_id: string;
  tenant_name: string;
  tenant_code: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  roles: string; // JSON array string e.g. '["admin"]'
}

/**
 * Map Appwrite account + prefs to ERPUser shape
 */
function mapToERPUser(acc: Models.User<Models.Preferences>): ERPUser {
  const prefs = acc.prefs || {};
  return {
    id: acc.$id,
    tenant_id: prefs.tenant_id || '',
    tenant_name: prefs.tenant_name || '',
    tenant_code: prefs.tenant_code || '',
    username: acc.name || acc.email.split('@')[0],
    email: acc.email,
    first_name: prefs.first_name || acc.name?.split(' ')[0] || '',
    last_name: prefs.last_name || acc.name?.split(' ').slice(1).join(' ') || '',
    roles: prefs.roles || '["viewer"]',
  };
}

/**
 * Login with email + password via Appwrite
 */
export async function appwriteLogin(email: string, password: string): Promise<{ success: boolean; data?: ERPUser; error?: string }> {
  try {
    // Appwrite uses email for auth — if user typed a username, append domain
    const loginEmail = email.includes('@') ? email : `${email}@sa-erp.local`;
    await account.createEmailPasswordSession(loginEmail, password);
    const acc = await account.get();
    const user = mapToERPUser(acc);
    return { success: true, data: user };
  } catch (err: any) {
    return { success: false, error: err.message || 'Invalid credentials' };
  }
}

/**
 * Logout — destroy current session
 */
export async function appwriteLogout(): Promise<void> {
  try {
    await account.deleteSession('current');
  } catch {
    // Already logged out
  }
}

/**
 * Get current session user (for auto-login on refresh)
 */
export async function appwriteGetCurrentUser(): Promise<ERPUser | null> {
  try {
    const acc = await account.get();
    return mapToERPUser(acc);
  } catch {
    return null;
  }
}

/**
 * Register a new user (admin use)
 */
export async function appwriteRegister(
  email: string,
  password: string,
  name: string,
  prefs: Record<string, string>
): Promise<{ success: boolean; data?: ERPUser; error?: string }> {
  try {
    await account.create(ID.unique(), email, password, name);
    // Login immediately after registration
    await account.createEmailPasswordSession(email, password);
    await account.updatePrefs(prefs);
    const acc = await account.get();
    return { success: true, data: mapToERPUser(acc) };
  } catch (err: any) {
    return { success: false, error: err.message || 'Registration failed' };
  }
}
