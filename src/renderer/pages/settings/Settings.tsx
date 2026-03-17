import React, { useState } from 'react';
import {
  BuildingOfficeIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  CogIcon,
  DocumentTextIcon,
  GlobeAltIcon,
} from '@heroicons/react/24/outline';
import { Card, Button } from '../../components/common';
import { useApp } from '../../context';

interface CompanyInfo {
  name: string;
  gstin: string;
  pan: string;
  cin: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  website: string;
  logo: string | null;
}

export function Settings() {
  const { state, notify } = useApp();
  const [activeTab, setActiveTab] = useState('company');
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    name: 'Your Company Name Pvt Ltd',
    gstin: '27AABCU9603R1ZM',
    pan: 'AABCU9603R',
    cin: 'U12345MH2020PTC123456',
    address: '123, Industrial Area, Sector 5',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    phone: '022-12345678',
    email: 'info@company.com',
    website: 'www.company.com',
    logo: null,
  });

  const [gstSettings, setGstSettings] = useState({
    eInvoiceEnabled: true,
    eInvoiceThreshold: 500000000, // 5 Cr
    eWayBillThreshold: 50000,
    autoGenerateEInvoice: false,
    autoGenerateEWayBill: true,
    defaultTaxRate: 18,
    reverseChargeApplicable: false,
  });

  const [invoiceSettings, setInvoiceSettings] = useState({
    invoicePrefix: 'INV',
    invoiceStartNumber: 1,
    fiscalYearStart: '04', // April
    showIRN: true,
    showQRCode: true,
    defaultPaymentTerms: 30,
    defaultCreditDays: 30,
    bankDetails: 'Bank Name: State Bank of India\nAccount No: 1234567890\nIFSC: SBIN0001234',
    termsAndConditions: '1. Goods once sold will not be taken back.\n2. Interest @18% p.a. will be charged on delayed payments.',
  });

  const handleSave = () => {
    notify('success', 'Settings saved successfully');
  };

  const tabs = [
    { id: 'company', label: 'Company Profile', icon: BuildingOfficeIcon },
    { id: 'gst', label: 'GST Settings', icon: DocumentTextIcon },
    { id: 'invoice', label: 'Invoice Settings', icon: DocumentTextIcon },
    { id: 'users', label: 'Users & Roles', icon: UserGroupIcon },
    { id: 'security', label: 'Security', icon: ShieldCheckIcon },
    { id: 'system', label: 'System', icon: CogIcon },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Manage your organization settings and preferences
        </p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0">
          <Card className="p-2">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </Card>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'company' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-6">Company Profile</h2>
              <form className="space-y-6">
                {/* Logo Upload */}
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                    {companyInfo.logo ? (
                      <img src={companyInfo.logo} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <BuildingOfficeIcon className="w-12 h-12 text-slate-400" />
                    )}
                  </div>
                  <div>
                    <Button variant="secondary" size="sm">Upload Logo</Button>
                    <p className="mt-1 text-xs text-slate-500">PNG, JPG up to 2MB</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Company Name
                    </label>
                    <input
                      type="text"
                      value={companyInfo.name}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, name: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      GSTIN
                    </label>
                    <input
                      type="text"
                      value={companyInfo.gstin}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, gstin: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600"
                      maxLength={15}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      PAN
                    </label>
                    <input
                      type="text"
                      value={companyInfo.pan}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, pan: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600"
                      maxLength={10}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      CIN (Corporate Identification Number)
                    </label>
                    <input
                      type="text"
                      value={companyInfo.cin}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, cin: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Address
                    </label>
                    <textarea
                      value={companyInfo.address}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, address: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600"
                      rows={2}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      City
                    </label>
                    <input
                      type="text"
                      value={companyInfo.city}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, city: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      State
                    </label>
                    <select
                      value={companyInfo.state}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, state: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600"
                    >
                      <option value="Maharashtra">Maharashtra</option>
                      <option value="Delhi">Delhi</option>
                      <option value="Gujarat">Gujarat</option>
                      <option value="Karnataka">Karnataka</option>
                      <option value="Tamil Nadu">Tamil Nadu</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={companyInfo.phone}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, phone: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Email
                    </label>
                    <input
                      type="email"
                      value={companyInfo.email}
                      onChange={(e) => setCompanyInfo({ ...companyInfo, email: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSave}>Save Changes</Button>
                </div>
              </form>
            </Card>
          )}

          {activeTab === 'gst' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-6">GST Settings</h2>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">E-Invoice Generation</div>
                    <div className="text-sm text-slate-500">Enable automatic e-invoice generation</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={gstSettings.eInvoiceEnabled}
                      onChange={(e) => setGstSettings({ ...gstSettings, eInvoiceEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Auto Generate E-Invoice</div>
                    <div className="text-sm text-slate-500">Automatically generate e-invoice when posting invoice</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={gstSettings.autoGenerateEInvoice}
                      onChange={(e) => setGstSettings({ ...gstSettings, autoGenerateEInvoice: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Auto Generate E-Way Bill</div>
                    <div className="text-sm text-slate-500">Automatically generate e-way bill for eligible invoices</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={gstSettings.autoGenerateEWayBill}
                      onChange={(e) => setGstSettings({ ...gstSettings, autoGenerateEWayBill: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    E-Way Bill Threshold (₹)
                  </label>
                  <input
                    type="number"
                    value={gstSettings.eWayBillThreshold}
                    onChange={(e) => setGstSettings({ ...gstSettings, eWayBillThreshold: parseInt(e.target.value) })}
                    className="mt-1 block w-full max-w-xs px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600"
                  />
                  <p className="mt-1 text-xs text-slate-500">Default: ₹50,000</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Default GST Rate (%)
                  </label>
                  <select
                    value={gstSettings.defaultTaxRate}
                    onChange={(e) => setGstSettings({ ...gstSettings, defaultTaxRate: parseInt(e.target.value) })}
                    className="mt-1 block w-full max-w-xs px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600"
                  >
                    <option value={0}>0%</option>
                    <option value={5}>5%</option>
                    <option value={12}>12%</option>
                    <option value={18}>18%</option>
                    <option value={28}>28%</option>
                  </select>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSave}>Save Changes</Button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'invoice' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-6">Invoice Settings</h2>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Invoice Prefix
                    </label>
                    <input
                      type="text"
                      value={invoiceSettings.invoicePrefix}
                      onChange={(e) => setInvoiceSettings({ ...invoiceSettings, invoicePrefix: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Starting Number
                    </label>
                    <input
                      type="number"
                      value={invoiceSettings.invoiceStartNumber}
                      onChange={(e) => setInvoiceSettings({ ...invoiceSettings, invoiceStartNumber: parseInt(e.target.value) })}
                      className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Fiscal Year Start Month
                    </label>
                    <select
                      value={invoiceSettings.fiscalYearStart}
                      onChange={(e) => setInvoiceSettings({ ...invoiceSettings, fiscalYearStart: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600"
                    >
                      <option value="01">January</option>
                      <option value="04">April</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                      Default Payment Terms (days)
                    </label>
                    <input
                      type="number"
                      value={invoiceSettings.defaultPaymentTerms}
                      onChange={(e) => setInvoiceSettings({ ...invoiceSettings, defaultPaymentTerms: parseInt(e.target.value) })}
                      className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Bank Details (for invoice)
                  </label>
                  <textarea
                    value={invoiceSettings.bankDetails}
                    onChange={(e) => setInvoiceSettings({ ...invoiceSettings, bankDetails: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Terms & Conditions
                  </label>
                  <textarea
                    value={invoiceSettings.termsAndConditions}
                    onChange={(e) => setInvoiceSettings({ ...invoiceSettings, termsAndConditions: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600"
                    rows={4}
                  />
                </div>

                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={invoiceSettings.showIRN}
                      onChange={(e) => setInvoiceSettings({ ...invoiceSettings, showIRN: e.target.checked })}
                      className="rounded border-slate-300"
                    />
                    <span className="text-sm">Show IRN on invoice</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={invoiceSettings.showQRCode}
                      onChange={(e) => setInvoiceSettings({ ...invoiceSettings, showQRCode: e.target.checked })}
                      className="rounded border-slate-300"
                    />
                    <span className="text-sm">Show QR Code on invoice</span>
                  </label>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSave}>Save Changes</Button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'users' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-6">Users & Roles</h2>
              <div className="text-center py-12 text-slate-500">
                <UserGroupIcon className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p>User management interface coming soon</p>
              </div>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-6">Security Settings</h2>
              <div className="text-center py-12 text-slate-500">
                <ShieldCheckIcon className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p>Security settings interface coming soon</p>
              </div>
            </Card>
          )}

          {activeTab === 'system' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-6">System Settings</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div>
                    <div className="font-medium">Application Version</div>
                    <div className="text-sm text-slate-500">SA ERP v1.0.0</div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div>
                    <div className="font-medium">Database</div>
                    <div className="text-sm text-slate-500">SQLite (better-sqlite3)</div>
                  </div>
                  <Button variant="secondary" size="sm">Backup</Button>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                  <div>
                    <div className="font-medium">Data Location</div>
                    <div className="text-sm text-slate-500">%APPDATA%/indian-erp/data</div>
                  </div>
                  <Button variant="secondary" size="sm">Open Folder</Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default Settings;

