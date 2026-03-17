import React, { useState } from 'react';
import { DocumentChartBarIcon, DocumentTextIcon, CalendarIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { Button, Input, Card, Select } from '@components/common';

interface ReportTemplate {
  id: string;
  name: string;
  category: 'Finance' | 'Inventory' | 'Sales' | 'Purchase' | 'Manufacturing' | 'HRM' | 'GST';
  description: string;
  icon: React.ReactNode;
}

const FinancialReports: React.FC = () => {
  const [selectedReport, setSelectedReport] = useState<string>('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});

  const reportTemplates: ReportTemplate[] = [
    {
      id: 'balance-sheet',
      name: 'Balance Sheet',
      category: 'Finance',
      description: 'Statement of financial position showing assets, liabilities, and equity',
      icon: <DocumentChartBarIcon className="h-6 w-6" />,
    },
    {
      id: 'profit-loss',
      name: 'Profit & Loss Statement',
      category: 'Finance',
      description: 'Income statement showing revenues, expenses, and profit/loss',
      icon: <DocumentChartBarIcon className="h-6 w-6" />,
    },
    {
      id: 'trial-balance',
      name: 'Trial Balance',
      category: 'Finance',
      description: 'List of all ledger balances to verify debit-credit equality',
      icon: <DocumentTextIcon className="h-6 w-6" />,
    },
    {
      id: 'cash-flow',
      name: 'Cash Flow Statement',
      category: 'Finance',
      description: 'Analysis of cash inflows and outflows from operating, investing, and financing',
      icon: <DocumentChartBarIcon className="h-6 w-6" />,
    },
    {
      id: 'ledger',
      name: 'General Ledger',
      category: 'Finance',
      description: 'Detailed account-wise transactions with running balance',
      icon: <DocumentTextIcon className="h-6 w-6" />,
    },
    {
      id: 'daybook',
      name: 'Day Book',
      category: 'Finance',
      description: 'Daily summary of all journal entries',
      icon: <DocumentTextIcon className="h-6 w-6" />,
    },
    {
      id: 'stock-summary',
      name: 'Stock Summary',
      category: 'Inventory',
      description: 'Item-wise stock levels across warehouses',
      icon: <DocumentChartBarIcon className="h-6 w-6" />,
    },
    {
      id: 'stock-movement',
      name: 'Stock Movement Register',
      category: 'Inventory',
      description: 'Detailed movement history of inventory items',
      icon: <DocumentTextIcon className="h-6 w-6" />,
    },
    {
      id: 'ageing-receivables',
      name: 'Receivables Aging',
      category: 'Sales',
      description: 'Customer-wise outstanding amounts by aging buckets',
      icon: <DocumentChartBarIcon className="h-6 w-6" />,
    },
    {
      id: 'ageing-payables',
      name: 'Payables Aging',
      category: 'Purchase',
      description: 'Vendor-wise outstanding amounts by aging buckets',
      icon: <DocumentChartBarIcon className="h-6 w-6" />,
    },
    {
      id: 'sales-register',
      name: 'Sales Register',
      category: 'Sales',
      description: 'Detailed sales transactions with GST breakdown',
      icon: <DocumentTextIcon className="h-6 w-6" />,
    },
    {
      id: 'purchase-register',
      name: 'Purchase Register',
      category: 'Purchase',
      description: 'Detailed purchase transactions with GST breakdown',
      icon: <DocumentTextIcon className="h-6 w-6" />,
    },
    {
      id: 'gstr1-report',
      name: 'GSTR-1 Report',
      category: 'GST',
      description: 'Outward supplies return for GST filing',
      icon: <DocumentTextIcon className="h-6 w-6" />,
    },
    {
      id: 'gstr3b-report',
      name: 'GSTR-3B Report',
      category: 'GST',
      description: 'Monthly summary return with tax liability',
      icon: <DocumentTextIcon className="h-6 w-6" />,
    },
    {
      id: 'production-report',
      name: 'Production Report',
      category: 'Manufacturing',
      description: 'Production order summary with material consumption',
      icon: <DocumentChartBarIcon className="h-6 w-6" />,
    },
    {
      id: 'payroll-summary',
      name: 'Payroll Summary',
      category: 'HRM',
      description: 'Employee-wise salary details with deductions',
      icon: <DocumentTextIcon className="h-6 w-6" />,
    },
  ];

  const categories = Array.from(new Set(reportTemplates.map((r) => r.category)));

  const handleGenerateReport = () => {
    if (!selectedReport) {
      alert('Please select a report');
      return;
    }
    if (!fromDate || !toDate) {
      alert('Please select date range');
      return;
    }
    console.log('Generating report:', {
      report: selectedReport,
      fromDate,
      toDate,
      filters,
    });
    // TODO: Implement actual report generation via IPC
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
        <p className="text-gray-600">Generate comprehensive business reports</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Report Templates */}
        <div className="col-span-2 space-y-4">
          <Card>
            <h2 className="text-lg font-semibold mb-4">Report Templates</h2>
            <div className="space-y-2">
              {categories.map((category) => (
                <div key={category}>
                  <h3 className="text-sm font-medium text-gray-700 mb-2 mt-4 first:mt-0">
                    {category}
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {reportTemplates
                      .filter((r) => r.category === category)
                      .map((report) => (
                        <button
                          key={report.id}
                          onClick={() => setSelectedReport(report.id)}
                          className={`p-4 border rounded-lg text-left hover:border-indigo-500 hover:bg-indigo-50 transition-colors ${
                            selectedReport === report.id
                              ? 'border-indigo-500 bg-indigo-50'
                              : 'border-gray-200'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`${
                                selectedReport === report.id
                                  ? 'text-indigo-600'
                                  : 'text-gray-400'
                              }`}
                            >
                              {report.icon}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-sm text-gray-900">
                                {report.name}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {report.description}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Report Parameters */}
        <div className="space-y-4">
          <Card>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FunnelIcon className="h-5 w-5" />
              Report Parameters
            </h2>
            <div className="space-y-4">
              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <CalendarIcon className="h-4 w-4 inline mr-1" />
                  Date Range
                </label>
                <div className="space-y-2">
                  <Input
                    label="From Date"
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                  <Input
                    label="To Date"
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Additional Filters based on selected report */}
              {selectedReport === 'ledger' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account
                  </label>
                  <select className="w-full px-4 py-2 border rounded-lg">
                    <option value="">Select Account</option>
                    <option value="all">All Accounts</option>
                    <option value="cash">Cash</option>
                    <option value="bank">Bank</option>
                    <option value="sales">Sales</option>
                  </select>
                </div>
              )}

              {selectedReport === 'stock-summary' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Warehouse
                  </label>
                  <select className="w-full px-4 py-2 border rounded-lg">
                    <option value="">All Warehouses</option>
                    <option value="main">Main Warehouse</option>
                    <option value="fg">Finished Goods</option>
                  </select>
                </div>
              )}

              {(selectedReport === 'ageing-receivables' ||
                selectedReport === 'sales-register') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer
                  </label>
                  <select className="w-full px-4 py-2 border rounded-lg">
                    <option value="">All Customers</option>
                    <option value="c1">Customer 1</option>
                    <option value="c2">Customer 2</option>
                  </select>
                </div>
              )}

              {(selectedReport === 'ageing-payables' ||
                selectedReport === 'purchase-register') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vendor
                  </label>
                  <select className="w-full px-4 py-2 border rounded-lg">
                    <option value="">All Vendors</option>
                    <option value="v1">Vendor 1</option>
                    <option value="v2">Vendor 2</option>
                  </select>
                </div>
              )}

              {/* Format Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Export Format
                </label>
                <select className="w-full px-4 py-2 border rounded-lg">
                  <option value="pdf">PDF</option>
                  <option value="excel">Excel</option>
                  <option value="csv">CSV</option>
                </select>
              </div>

              {/* Generate Button */}
              <Button className="w-full" onClick={handleGenerateReport}>
                <DocumentTextIcon className="h-5 w-5 mr-2" />
                Generate Report
              </Button>
            </div>
          </Card>

          {/* Quick Links */}
          <Card>
            <h2 className="text-lg font-semibold mb-4">Quick Links</h2>
            <div className="space-y-2">
              <Button variant="secondary" className="w-full text-left justify-start">
                Recent Reports
              </Button>
              <Button variant="secondary" className="w-full text-left justify-start">
                Scheduled Reports
              </Button>
              <Button variant="secondary" className="w-full text-left justify-start">
                Report Builder
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Selected Report Info */}
      {selectedReport && (
        <Card className="bg-indigo-50 border-indigo-200">
          <div className="flex items-start gap-3">
            <div className="text-indigo-600">
              {reportTemplates.find((r) => r.id === selectedReport)?.icon}
            </div>
            <div>
              <h3 className="font-medium text-indigo-900">
                {reportTemplates.find((r) => r.id === selectedReport)?.name}
              </h3>
              <p className="text-sm text-indigo-700 mt-1">
                {reportTemplates.find((r) => r.id === selectedReport)?.description}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default FinancialReports;
