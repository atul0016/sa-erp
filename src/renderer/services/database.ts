/**
 * SA ERP - Appwrite Database Service
 * Generic CRUD + module-specific queries via Appwrite Databases API.
 * 
 * Every method returns the same { success, data, error } shape
 * used by the mock API so pages don't need to change.
 */

import { databases, DATABASE_ID, COLLECTIONS } from './appwrite';
import { ID, Query, type Models } from 'appwrite';

type CollectionId = typeof COLLECTIONS[keyof typeof COLLECTIONS];

// ---------------------------------------------------------------------------
// Generic helpers
// ---------------------------------------------------------------------------

function docToPlain(doc: Models.Document): Record<string, any> {
  const { $id, $collectionId, $databaseId, $createdAt, $updatedAt, $permissions, ...rest } = doc;
  return { id: $id, created_at: $createdAt, updated_at: $updatedAt, ...rest };
}

async function ok<T>(data: T) {
  return { success: true as const, data };
}

function fail(err: any) {
  console.error('[DB]', err);
  return { success: false as const, error: err?.message || String(err) };
}

// ---------------------------------------------------------------------------
// Generic CRUD factory – one per collection
// ---------------------------------------------------------------------------

export function createCRUD(collectionId: CollectionId) {
  return {
    async getAll(tenantId: string, extraQueries: string[] = []) {
      try {
        const queries = [Query.equal('tenant_id', tenantId), Query.limit(500), ...extraQueries];
        const res = await databases.listDocuments(DATABASE_ID, collectionId, queries);
        return ok(res.documents.map(docToPlain));
      } catch (e) { return fail(e); }
    },

    async getById(id: string) {
      try {
        const doc = await databases.getDocument(DATABASE_ID, collectionId, id);
        return ok(docToPlain(doc));
      } catch (e) { return fail(e); }
    },

    async create(data: Record<string, any>) {
      try {
        const doc = await databases.createDocument(DATABASE_ID, collectionId, ID.unique(), data);
        return ok(docToPlain(doc));
      } catch (e) { return fail(e); }
    },

    async update(id: string, data: Record<string, any>) {
      try {
        const doc = await databases.updateDocument(DATABASE_ID, collectionId, id, data);
        return ok(docToPlain(doc));
      } catch (e) { return fail(e); }
    },

    async delete(id: string) {
      try {
        await databases.deleteDocument(DATABASE_ID, collectionId, id);
        return ok(null);
      } catch (e) { return fail(e); }
    },
  };
}

// ---------------------------------------------------------------------------
// Pre-built CRUD instances (matching mock API module structure)
// ---------------------------------------------------------------------------

export const customersCrud = createCRUD(COLLECTIONS.CUSTOMERS);
export const vendorsCrud   = createCRUD(COLLECTIONS.VENDORS);
export const itemsCrud     = createCRUD(COLLECTIONS.ITEMS);
export const accountsCrud  = createCRUD(COLLECTIONS.ACCOUNTS);
export const employeesCrud = createCRUD(COLLECTIONS.EMPLOYEES);
export const warehousesCrud = createCRUD(COLLECTIONS.WAREHOUSES);

// ---------------------------------------------------------------------------
// Module-specific query builders
// ---------------------------------------------------------------------------

/** Dashboard KPIs */
export async function getDashboardData(tenantId: string) {
  try {
    const [salesRes, purchaseRes, customersRes] = await Promise.all([
      databases.listDocuments(DATABASE_ID, COLLECTIONS.SALES_INVOICES, [
        Query.equal('tenant_id', tenantId), Query.limit(500),
      ]),
      databases.listDocuments(DATABASE_ID, COLLECTIONS.PURCHASE_INVOICES, [
        Query.equal('tenant_id', tenantId), Query.limit(500),
      ]),
      databases.listDocuments(DATABASE_ID, COLLECTIONS.CUSTOMERS, [
        Query.equal('tenant_id', tenantId), Query.orderDesc('outstanding'), Query.limit(5),
      ]),
    ]);

    const sales = salesRes.documents;
    const purchases = purchaseRes.documents;

    const salesThisMonth = sales.reduce((s, d) => s + (d.total_amount || 0), 0);
    const purchasesThisMonth = purchases.reduce((s, d) => s + (d.total_amount || 0), 0);
    const receivables = sales.reduce((s, d) => s + (d.balance_due || 0), 0);
    const payables = purchases.reduce((s, d) => s + (d.balance_due || 0), 0);

    return ok({
      salesThisMonth,
      purchasesThisMonth,
      receivables,
      payables,
      netProfit: salesThisMonth - purchasesThisMonth,
      cashBalance: 2500000, // from bank account
      gstPayable: 150000,
      tdsPayable: 45000,
      topCustomers: customersRes.documents.map(docToPlain),
      recentTransactions: sales.slice(0, 7).map(docToPlain),
      monthlyTrend: [], // compute from aggregation
    });
  } catch (e) { return fail(e); }
}

/** Approval workflow queries */
export async function getApprovals(tenantId: string, status?: string, userRoles?: string[]) {
  try {
    const queries: string[] = [Query.equal('tenant_id', tenantId), Query.limit(100)];
    if (status) queries.push(Query.equal('status', status));
    const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.APPROVAL_REQUESTS, queries);
    let docs = res.documents.map(docToPlain);
    // Client-side role filter (Appwrite doesn't support array-contains easily)
    if (userRoles && userRoles.length) {
      docs = docs.filter((d: any) => {
        const required = Array.isArray(d.required_roles) ? d.required_roles : JSON.parse(d.required_roles || '[]');
        return required.some((r: string) => userRoles.includes(r));
      });
    }
    return ok(docs);
  } catch (e) { return fail(e); }
}

export async function updateApprovalStatus(
  id: string,
  status: 'approved' | 'rejected',
  actionedBy: string,
  comments: string
) {
  try {
    const doc = await databases.updateDocument(DATABASE_ID, COLLECTIONS.APPROVAL_REQUESTS, id, {
      status,
      actioned_by: actionedBy,
      actioned_at: new Date().toISOString(),
      comments,
    });
    return ok(docToPlain(doc));
  } catch (e) { return fail(e); }
}

/** Activity feed / notifications */
export async function getActivityFeed(tenantId: string) {
  try {
    const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.NOTIFICATIONS, [
      Query.equal('tenant_id', tenantId),
      Query.orderDesc('$createdAt'),
      Query.limit(50),
    ]);
    return ok(res.documents.map(docToPlain));
  } catch (e) { return fail(e); }
}
