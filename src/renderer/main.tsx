import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles/globals.css';

// Mock electronAPI for browser development/testing
if (!window.electronAPI) {
  console.warn('Running in browser mode - electronAPI mocked for development');
  
  const mockUser = {
    id: 'mock-user-id',
    tenant_id: 'mock-tenant-id',
    tenant_name: 'Demo Company',
    tenant_code: 'DEMO',
    username: 'admin',
    email: 'admin@demo.com',
    first_name: 'Admin',
    last_name: 'User',
    roles: '["admin"]'
  };

  // In-memory storage for mock data with seed data
  const mockStorage: Record<string, any[]> = {
    customers: [
      { id: 1001, tenant_id: 'mock-tenant-id', code: 'CUST-001', name: 'Acme Corporation Ltd', gstin: '27AABCT1234F1Z5', contact_person: 'Rajesh Kumar', phone: '9876543210', email: 'rajesh@acmecorp.com', address: '123 Business Park, Andheri East', city: 'Mumbai', state: 'Maharashtra', pincode: '400069', credit_limit: 500000, outstanding: 0, total_orders: 0, is_active: true, created_at: '2026-01-15' },
      { id: 1002, tenant_id: 'mock-tenant-id', code: 'CUST-002', name: 'Tech Solutions India Pvt Ltd', gstin: '29AAXYZ5678P1ZW', contact_person: 'Priya Sharma', phone: '9123456789', email: 'priya@techsolutions.in', address: '45 Electronic City Phase 1', city: 'Bangalore', state: 'Karnataka', pincode: '560100', credit_limit: 750000, outstanding: 0, total_orders: 0, is_active: true, created_at: '2026-01-18' },
      { id: 1003, tenant_id: 'mock-tenant-id', code: 'CUST-003', name: 'Gujarat Industries Ltd', gstin: '24BBCDE9012Q1ZX', contact_person: 'Amit Patel', phone: '9988776655', email: 'amit@gujaratind.com', address: '78 GIDC Industrial Estate', city: 'Ahmedabad', state: 'Gujarat', pincode: '382445', credit_limit: 1000000, outstanding: 0, total_orders: 0, is_active: true, created_at: '2026-01-20' },
      { id: 1004, tenant_id: 'mock-tenant-id', code: 'CUST-004', name: 'Tamil Nadu Trading Co', gstin: '33CDEFG3456R1ZY', contact_person: 'Lakshmi Iyer', phone: '9445566778', email: 'lakshmi@tntrading.com', address: '156 Anna Salai, T Nagar', city: 'Chennai', state: 'Tamil Nadu', pincode: '600017', credit_limit: 300000, outstanding: 0, total_orders: 0, is_active: true, created_at: '2026-01-22' },
      { id: 1005, tenant_id: 'mock-tenant-id', code: 'CUST-005', name: 'Delhi Enterprises', gstin: '07DEFGH7890S1ZZ', contact_person: 'Vikram Singh', phone: '9811223344', email: 'vikram@delhient.co.in', address: '89 Nehru Place Commercial Complex', city: 'New Delhi', state: 'Delhi', pincode: '110019', credit_limit: 600000, outstanding: 0, total_orders: 0, is_active: true, created_at: '2026-01-25' },
    ],
    vendors: [
      { id: 2001, tenant_id: 'mock-tenant-id', code: 'VEND-001', name: 'Steel Suppliers India', gstin: '27STLSU8901A1ZA', contact_person: 'Ramesh Gupta', phone: '9876512345', email: 'ramesh@steelsuppliers.com', address: '12 Industrial Area, Mahape', city: 'Navi Mumbai', state: 'Maharashtra', pincode: '400710', vendor_type: 'supplier', payment_terms: 30, credit_limit: 800000, outstanding: 0, is_active: true, created_at: '2026-01-10' },
      { id: 2002, tenant_id: 'mock-tenant-id', code: 'VEND-002', name: 'Electronic Components Co', gstin: '29ELECO5432B1ZB', contact_person: 'Sunita Reddy', phone: '9880123456', email: 'sunita@electrocomp.in', address: '67 Peenya Industrial Area', city: 'Bangalore', state: 'Karnataka', pincode: '560058', vendor_type: 'supplier', payment_terms: 45, credit_limit: 1200000, outstanding: 0, is_active: true, created_at: '2026-01-12' },
      { id: 2003, tenant_id: 'mock-tenant-id', code: 'VEND-003', name: 'Packaging Solutions Ltd', gstin: '24PAKSO7654C1ZC', contact_person: 'Kiran Shah', phone: '9898765432', email: 'kiran@packagingsol.com', address: '34 Vatva GIDC', city: 'Ahmedabad', state: 'Gujarat', pincode: '382445', vendor_type: 'supplier', payment_terms: 30, credit_limit: 500000, outstanding: 0, is_active: true, created_at: '2026-01-14' },
      { id: 2004, tenant_id: 'mock-tenant-id', code: 'VEND-004', name: 'Logistics Partners India', gstin: '33LOGPA4321D1ZD', contact_person: 'Murugan S', phone: '9444332211', email: 'murugan@logisticspi.com', address: '78 Ambattur Industrial Estate', city: 'Chennai', state: 'Tamil Nadu', pincode: '600058', vendor_type: 'service_provider', payment_terms: 15, credit_limit: 300000, outstanding: 0, is_active: true, created_at: '2026-01-16' },
      { id: 2005, tenant_id: 'mock-tenant-id', code: 'VEND-005', name: 'Chemical Traders Delhi', gstin: '07CHEMT6789E1ZE', contact_person: 'Anjali Verma', phone: '9811445566', email: 'anjali@chemtraders.co.in', address: '45 Okhla Industrial Phase 2', city: 'New Delhi', state: 'Delhi', pincode: '110020', vendor_type: 'supplier', payment_terms: 30, credit_limit: 700000, outstanding: 0, is_active: true, created_at: '2026-01-19' },
    ],
    items: [
      { id: 3001, tenant_id: 'mock-tenant-id', item_code: 'RM-STL-001', item_name: 'MS Steel Plate 10mm', item_type: 'raw_material', hsn_code: '7208', uom: 'KG', unit_price: 65, gst_rate: 18, reorder_level: 1000, current_stock: 5000, is_active: true, created_at: '2026-01-05' },
      { id: 3002, tenant_id: 'mock-tenant-id', item_code: 'RM-STL-002', item_name: 'SS Sheet 304 Grade', item_type: 'raw_material', hsn_code: '7219', uom: 'KG', unit_price: 280, gst_rate: 18, reorder_level: 500, current_stock: 2500, is_active: true, created_at: '2026-01-05' },
      { id: 3003, tenant_id: 'mock-tenant-id', item_code: 'RM-ELC-001', item_name: 'PCB Board FR4', item_type: 'raw_material', hsn_code: '8534', uom: 'PCS', unit_price: 450, gst_rate: 18, reorder_level: 100, current_stock: 800, is_active: true, created_at: '2026-01-06' },
      { id: 3004, tenant_id: 'mock-tenant-id', item_code: 'RM-ELC-002', item_name: 'Resistor 10K Ohm', item_type: 'raw_material', hsn_code: '8533', uom: 'PCS', unit_price: 2, gst_rate: 12, reorder_level: 5000, current_stock: 50000, is_active: true, created_at: '2026-01-06' },
      { id: 3005, tenant_id: 'mock-tenant-id', item_code: 'FG-MECH-001', item_name: 'Gear Assembly Type A', item_type: 'finished_goods', hsn_code: '8483', uom: 'PCS', unit_price: 1200, gst_rate: 18, reorder_level: 50, current_stock: 250, is_active: true, created_at: '2026-01-08' },
      { id: 3006, tenant_id: 'mock-tenant-id', item_code: 'FG-MECH-002', item_name: 'Ball Bearing 6205', item_type: 'finished_goods', hsn_code: '8482', uom: 'PCS', unit_price: 450, gst_rate: 18, reorder_level: 100, current_stock: 500, is_active: true, created_at: '2026-01-08' },
      { id: 3007, tenant_id: 'mock-tenant-id', item_code: 'FG-ELEC-001', item_name: 'Power Supply 12V 5A', item_type: 'finished_goods', hsn_code: '8504', uom: 'PCS', unit_price: 850, gst_rate: 18, reorder_level: 50, current_stock: 300, is_active: true, created_at: '2026-01-10' },
      { id: 3008, tenant_id: 'mock-tenant-id', item_code: 'PKG-001', item_name: 'Corrugated Box Medium', item_type: 'consumable', hsn_code: '4819', uom: 'PCS', unit_price: 45, gst_rate: 12, reorder_level: 200, current_stock: 1500, is_active: true, created_at: '2026-01-12' },
      { id: 3009, tenant_id: 'mock-tenant-id', item_code: 'SRV-001', item_name: 'Installation Service', item_type: 'service', hsn_code: '998599', uom: 'HRS', unit_price: 800, gst_rate: 18, reorder_level: 0, current_stock: 0, is_active: true, created_at: '2026-01-15' },
      { id: 3010, tenant_id: 'mock-tenant-id', item_code: 'SRV-002', item_name: 'Maintenance AMC', item_type: 'service', hsn_code: '998599', uom: 'MTH', unit_price: 5000, gst_rate: 18, reorder_level: 0, current_stock: 0, is_active: true, created_at: '2026-01-15' },
    ],
    salesOrders: [],
    salesInvoices: [],
    purchaseOrders: [],
    purchaseInvoices: [],
    employees: [
      { id: 4001, tenant_id: 'mock-tenant-id', employee_code: 'EMP-001', first_name: 'Arjun', last_name: 'Mehta', email: 'arjun.mehta@company.com', phone: '9876543210', department: 'Sales', designation: 'Sales Manager', date_of_joining: '2024-06-01', date_of_birth: '1990-03-15', gender: 'male', basic_salary: 60000, is_active: true, created_at: '2024-06-01' },
      { id: 4002, tenant_id: 'mock-tenant-id', employee_code: 'EMP-002', first_name: 'Sneha', last_name: 'Rao', email: 'sneha.rao@company.com', phone: '9123456789', department: 'Finance', designation: 'Accountant', date_of_joining: '2024-07-15', date_of_birth: '1992-08-22', gender: 'female', basic_salary: 45000, is_active: true, created_at: '2024-07-15' },
      { id: 4003, tenant_id: 'mock-tenant-id', employee_code: 'EMP-003', first_name: 'Rahul', last_name: 'Sharma', email: 'rahul.sharma@company.com', phone: '9988776655', department: 'Production', designation: 'Production Supervisor', date_of_joining: '2024-05-10', date_of_birth: '1988-11-30', gender: 'male', basic_salary: 50000, is_active: true, created_at: '2024-05-10' },
      { id: 4004, tenant_id: 'mock-tenant-id', employee_code: 'EMP-004', first_name: 'Kavita', last_name: 'Desai', email: 'kavita.desai@company.com', phone: '9445566778', department: 'HR', designation: 'HR Executive', date_of_joining: '2024-08-01', date_of_birth: '1993-05-18', gender: 'female', basic_salary: 40000, is_active: true, created_at: '2024-08-01' },
      { id: 4005, tenant_id: 'mock-tenant-id', employee_code: 'EMP-005', first_name: 'Vikram', last_name: 'Patel', email: 'vikram.patel@company.com', phone: '9811223344', department: 'IT', designation: 'IT Support Engineer', date_of_joining: '2024-09-15', date_of_birth: '1995-02-10', gender: 'male', basic_salary: 38000, is_active: true, created_at: '2024-09-15' },
    ],
    accounts: [
      { id: 5001, tenant_id: 'mock-tenant-id', account_code: 'A-1001', account_name: 'Cash in Hand', account_type: 'asset', parent_account: null, is_system: true, balance: 50000, is_active: true, created_at: '2024-04-01' },
      { id: 5002, tenant_id: 'mock-tenant-id', account_code: 'A-1002', account_name: 'HDFC Bank Current Account', account_type: 'asset', parent_account: null, is_system: false, balance: 2500000, is_active: true, created_at: '2024-04-01' },
      { id: 5003, tenant_id: 'mock-tenant-id', account_code: 'A-2001', account_name: 'Sundry Debtors', account_type: 'asset', parent_account: null, is_system: true, balance: 1500000, is_active: true, created_at: '2024-04-01' },
      { id: 5004, tenant_id: 'mock-tenant-id', account_code: 'A-3001', account_name: 'Sundry Creditors', account_type: 'liability', parent_account: null, is_system: true, balance: 800000, is_active: true, created_at: '2024-04-01' },
      { id: 5005, tenant_id: 'mock-tenant-id', account_code: 'A-3002', account_name: 'GST Payable', account_type: 'liability', parent_account: null, is_system: true, balance: 150000, is_active: true, created_at: '2024-04-01' },
      { id: 5006, tenant_id: 'mock-tenant-id', account_code: 'A-4001', account_name: 'Sales Revenue', account_type: 'income', parent_account: null, is_system: true, balance: 5000000, is_active: true, created_at: '2024-04-01' },
      { id: 5007, tenant_id: 'mock-tenant-id', account_code: 'A-5001', account_name: 'Purchase Expense', account_type: 'expense', parent_account: null, is_system: true, balance: 2500000, is_active: true, created_at: '2024-04-01' },
      { id: 5008, tenant_id: 'mock-tenant-id', account_code: 'A-5002', account_name: 'Salary Expense', account_type: 'expense', parent_account: null, is_system: true, balance: 800000, is_active: true, created_at: '2024-04-01' },
      { id: 5009, tenant_id: 'mock-tenant-id', account_code: 'A-5003', account_name: 'Rent Expense', account_type: 'expense', parent_account: null, is_system: true, balance: 180000, is_active: true, created_at: '2024-04-01' },
      { id: 5010, tenant_id: 'mock-tenant-id', account_code: 'A-6001', account_name: 'Share Capital', account_type: 'equity', parent_account: null, is_system: true, balance: 5000000, is_active: true, created_at: '2024-04-01' },
    ]
  };

  let idCounter = 5100;
  const generateId = () => (idCounter++).toString();

  const createMockCRUDApi = (storageKey: string) => ({
    getAll: async () => ({ success: true, data: mockStorage[storageKey] || [] }),
    getById: async (id: string) => ({ 
      success: true, 
      data: mockStorage[storageKey]?.find((item: any) => item.id === id) 
    }),
    create: async (data: any) => {
      const newItem = { ...data, id: generateId(), created_at: new Date().toISOString() };
      mockStorage[storageKey] = [...(mockStorage[storageKey] || []), newItem];
      return { success: true, data: newItem };
    },
    update: async (id: string, data: any) => {
      const index = mockStorage[storageKey]?.findIndex((item: any) => item.id === id);
      if (index >= 0) {
        mockStorage[storageKey][index] = { ...mockStorage[storageKey][index], ...data };
        return { success: true, data: mockStorage[storageKey][index] };
      }
      return { success: false, error: 'Not found' };
    },
    delete: async (id: string) => {
      mockStorage[storageKey] = mockStorage[storageKey]?.filter((item: any) => item.id !== id) || [];
      return { success: true };
    }
  });

  const mockApiResponse = async () => ({ success: true, data: [] });
  const mockApiMethod = () => mockApiResponse;

  window.electronAPI = {
    auth: {
      login: async (username: string, password: string) => {
        if (username === 'admin' && password === 'admin123') {
          return { success: true, data: mockUser };
        }
        return { success: false, error: 'Invalid credentials' };
      },
      logout: async () => ({ success: true }),
      getCurrentUser: async () => ({ success: true, data: mockUser }),
      changePassword: async () => ({ success: true })
    },
    dashboard: {
      getStats: async () => ({ 
        success: true, 
        data: {
          totalRevenue: mockStorage.salesInvoices?.reduce((sum: number, inv: any) => sum + (inv.total || 0), 0) || 0,
          totalExpenses: mockStorage.purchaseInvoices?.reduce((sum: number, inv: any) => sum + (inv.total || 0), 0) || 0,
          netProfit: 0,
          cashBalance: 0,
          totalReceivables: 0,
          totalPayables: 0,
          lowStockItems: 0,
          pendingOrders: mockStorage.salesOrders?.length || 0
        }
      }),
      getRecentTransactions: async () => ({ success: true, data: [] })
    },
    finance: {
      getAccounts: async () => ({ success: true, data: mockStorage.accounts }),
      getChartOfAccounts: async (tenantId: string) => ({ 
        success: true, 
        data: mockStorage.accounts.map(a => ({
          ...a,
          code: a.account_code,
          name: a.account_name,
          type: a.account_type,
          parent_id: a.parent_account,
          is_active: a.is_active
        }))
      }),
      createAccount: async (tenantId: string, data: any) => {
        const account = { ...data, id: generateId(), tenant_id: tenantId };
        mockStorage.accounts.push(account);
        return { success: true, data: account };
      },
      updateAccount: async (tenantId: string, id: string, data: any) => {
        const index = mockStorage.accounts.findIndex(a => a.id === id);
        if (index >= 0) {
          mockStorage.accounts[index] = { ...mockStorage.accounts[index], ...data };
          return { success: true, data: mockStorage.accounts[index] };
        }
        return { success: false, error: 'Not found' };
      },
      ...new Proxy({}, { get: () => mockApiMethod() })
    },
    inventory: {
      getItems: async () => ({ success: true, data: mockStorage.items }),
      createItem: async (tenantId: string, data: any) => {
        const item = { ...data, id: generateId(), tenant_id: tenantId, item_code: `ITEM-${Date.now()}` };
        mockStorage.items.push(item);
        return { success: true, data: item };
      },
      updateItem: async (tenantId: string, id: string, data: any) => {
        const index = mockStorage.items.findIndex(item => item.id === id);
        if (index >= 0) {
          mockStorage.items[index] = { ...mockStorage.items[index], ...data };
          return { success: true, data: mockStorage.items[index] };
        }
        return { success: false, error: 'Not found' };
      },
      deleteItem: async (tenantId: string, id: string) => {
        mockStorage.items = mockStorage.items.filter(item => item.id !== id);
        return { success: true };
      },
      getLowStockAlerts: async () => ({ success: true, data: [] }),
      ...new Proxy({}, { get: () => mockApiMethod() })
    },
    sales: {
      getCustomers: async () => ({ success: true, data: mockStorage.customers }),
      createCustomer: async (tenantId: string, data: any) => {
        const customer = { ...data, id: generateId(), tenant_id: tenantId };
        mockStorage.customers.push(customer);
        return { success: true, data: customer };
      },
      updateCustomer: async (tenantId: string, id: string, data: any) => {
        const index = mockStorage.customers.findIndex(c => c.id === id);
        if (index >= 0) {
          mockStorage.customers[index] = { ...mockStorage.customers[index], ...data };
          return { success: true, data: mockStorage.customers[index] };
        }
        return { success: false, error: 'Not found' };
      },
      deleteCustomer: async (tenantId: string, id: string) => {
        mockStorage.customers = mockStorage.customers.filter(c => c.id !== id);
        return { success: true };
      },
      getSalesOrders: async () => ({ success: true, data: mockStorage.salesOrders }),
      getSalesInvoices: async () => ({ success: true, data: mockStorage.salesInvoices }),
      createSalesInvoice: async (tenantId: string, data: any) => {
        const invoice = { ...data, id: generateId(), invoice_number: `SI-${Date.now()}`, tenant_id: tenantId };
        mockStorage.salesInvoices.push(invoice);
        return { success: true, data: invoice };
      },
      getCustomerReceipts: async () => ({ success: true, data: [] }),
      getAgingReport: async () => ({ success: true, data: [] }),
      ...new Proxy({}, { get: () => mockApiMethod() })
    },
    purchase: {
      getVendors: async () => ({ success: true, data: mockStorage.vendors }),
      createVendor: async (tenantId: string, data: any) => {
        const vendor = { ...data, id: generateId(), tenant_id: tenantId };
        mockStorage.vendors.push(vendor);
        return { success: true, data: vendor };
      },
      updateVendor: async (tenantId: string, id: string, data: any) => {
        const index = mockStorage.vendors.findIndex(v => v.id === id);
        if (index >= 0) {
          mockStorage.vendors[index] = { ...mockStorage.vendors[index], ...data };
          return { success: true, data: mockStorage.vendors[index] };
        }
        return { success: false, error: 'Not found' };
      },
      deleteVendor: async (tenantId: string, id: string) => {
        mockStorage.vendors = mockStorage.vendors.filter(v => v.id !== id);
        return { success: true };
      },
      getPurchaseOrders: async () => ({ success: true, data: mockStorage.purchaseOrders }),
      getPurchaseInvoices: async () => ({ success: true, data: mockStorage.purchaseInvoices }),
      getGoodsReceiptNotes: async () => ({ success: true, data: [] }),
      getVendorPayments: async () => ({ success: true, data: [] }),
      ...new Proxy({}, { get: () => mockApiMethod() })
    },
    gst: new Proxy({}, { get: () => mockApiMethod() }),
    manufacturing: new Proxy({}, { get: () => mockApiMethod() }),
    hrm: {
      getEmployees: async () => ({ success: true, data: mockStorage.employees }),
      createEmployee: async (tenantId: string, data: any) => {
        const employee = { ...data, id: generateId(), employee_code: `EMP-${Date.now()}`, tenant_id: tenantId };
        mockStorage.employees.push(employee);
        return { success: true, data: employee };
      },
      updateEmployee: async (tenantId: string, id: string, data: any) => {
        const index = mockStorage.employees.findIndex(e => e.id === id);
        if (index >= 0) {
          mockStorage.employees[index] = { ...mockStorage.employees[index], ...data };
          return { success: true, data: mockStorage.employees[index] };
        }
        return { success: false, error: 'Not found' };
      },
      getAttendanceReport: async () => ({ success: true, data: [] }),
      getLeaves: async () => ({ success: true, data: [] }),
      getPayrolls: async () => ({ success: true, data: [] }),
      ...new Proxy({}, { get: () => mockApiMethod() })
    },
    master: {
      getTenant: async () => ({ success: true, data: { id: 'mock-tenant-id', name: 'Demo Company' } }),
      updateTenant: async () => ({ success: true }),
      getUsers: async () => ({ success: true, data: [] }),
      createUser: async () => ({ success: true }),
      updateUser: async () => ({ success: true }),
      getRoles: async () => ({ success: true, data: [] }),
      getUnitsOfMeasure: async () => ({ success: true, data: [
        { id: '1', code: 'PCS', name: 'Pieces' },
        { id: '2', code: 'KG', name: 'Kilograms' },
        { id: '3', code: 'LTR', name: 'Liters' },
        { id: '4', code: 'MTR', name: 'Meters' }
      ] }),
      getHSNCodes: async () => ({ success: true, data: [] }),
      getCategories: async () => ({ success: true, data: [] }),
      createCategory: async () => ({ success: true }),
      getCustomers: async () => ({ success: true, data: mockStorage.customers }),
      getVendors: async () => ({ success: true, data: mockStorage.vendors })
    },
    report: new Proxy({}, { get: () => mockApiMethod() }),
    platform: 'browser',
    versions: { node: 'N/A', chrome: 'N/A', electron: 'N/A' }
  };
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
