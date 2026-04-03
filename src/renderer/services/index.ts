/**
 * SA ERP - Services Index
 * Re-exports all backend service modules
 */

export { isAppwriteConfigured, DATABASE_ID, COLLECTIONS } from './appwrite';
export { appwriteLogin, appwriteLogout, appwriteGetCurrentUser, appwriteRegister } from './auth';
export {
  createCRUD,
  customersCrud, vendorsCrud, itemsCrud, accountsCrud, employeesCrud, warehousesCrud,
  getDashboardData, getApprovals, updateApprovalStatus, getActivityFeed,
} from './database';
export { isFirebaseConfigured, initFirebase, requestNotificationPermission, onForegroundMessage } from './firebase';
