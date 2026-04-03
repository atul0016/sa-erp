/**
 * TDS Management Page
 * 
 * Tax Deducted at Source management per Indian Income Tax Act
 * Handles Section 194C, 194J, 194Q, etc.
 */

import { useState, useEffect } from 'react';
import {
  DocumentTextIcon,
  BanknotesIcon,
  PlusIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CalculatorIcon,
} from '@heroicons/react/24/outline';
import { useApp } from '../../context';

interface TdsTransaction {
  id: string;
  transaction_number: string;
  transaction_date: string;
  party_name: string;
  pan_number: string;
  section_code: string;
  section_name: string;
  base_amount: number;
  tds_rate: number;
  tds_amount: number;
  reference_type: string;
  reference_number: string;
  status: 'pending' | 'deposited' | 'filed';
  challan_number?: string;
}

interface TdsSection {
  code: string;
  name: string;
  description: string;
  rate_individual: number;
  rate_company: number;
  threshold: number;
}

interface TdsSummary {
  total_deducted: number;
  total_deposited: number;
  pending_deposit: number;
  pending_filing: number;
}

export default function TdsManagement() {
  const { state, notify } = useApp();
  const [activeTab, setActiveTab] = useState<'transactions' | 'challans' | 'returns'>('transactions');
  const [transactions, setTransactions] = useState<TdsTransaction[]>([]);
  const [sections, setSections] = useState<TdsSection[]>([]);
  const [summary, setSummary] = useState<TdsSummary>({
    total_deducted: 0,
    total_deposited: 0,
    pending_deposit: 0,
    pending_filing: 0,
  });
  const [selectedQuarter, setSelectedQuarter] = useState('Q3-2024');
  const [showNewChallanModal, setShowNewChallanModal] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTdsData = async () => {
    if (!state.user?.tenant_id) return;
    
    setLoading(true);
    try {
      const [sectionsRes, transactionsRes, summaryRes] = await Promise.all([
        window.electronAPI.gst.getTdsSections(),
        window.electronAPI.gst.getTdsTransactions(state.user.tenant_id, { quarter: selectedQuarter }),
        window.electronAPI.gst.getTdsSummary(state.user.tenant_id, selectedQuarter)
      ]);

      if (sectionsRes.success && sectionsRes.data) {
        setSections(sectionsRes.data.map((s: any) => ({
          code: s.section_code,
          name: s.description,
          description: s.payment_nature,
          rate_individual: s.individual_rate,
          rate_company: s.company_rate,
          threshold: s.threshold_single,
        })));
      }

      if (transactionsRes.success && transactionsRes.data) {
        setTransactions(transactionsRes.data.map((t: any) => ({
          id: t.id,
          transaction_number: t.id,
          transaction_date: t.transaction_date,
          party_name: t.party_name,
          pan_number: t.pan,
          section_code: t.section_code,
          section_name: t.section_code,
          base_amount: t.base_amount,
          tds_rate: t.tds_rate,
          tds_amount: t.tds_amount,
          reference_type: t.reference_type,
          reference_number: t.reference_number,
          status: t.payment_status === 'paid' ? 'deposited' : 'pending',
          challan_number: t.challan_id,
        })));
      }

      if (summaryRes.success && summaryRes.data) {
        setSummary(summaryRes.data);
      }
    } catch (error) {
      console.error('Error loading TDS data:', error);
      notify('error', 'Failed to load TDS data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTdsData();
  }, [state.user?.tenant_id, selectedQuarter]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'deposited':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">Deposited</span>;
      case 'filed':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">Filed</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">Pending</span>;
    }
  };

  const handleSelectTransaction = (id: string) => {
    setSelectedTransactions(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleGenerateChallan = () => {
    if (selectedTransactions.length > 0) {
      setShowNewChallanModal(true);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">TDS Management</h1>
          <p className="text-gray-600">Tax Deducted at Source compliance and filing</p>
        </div>

        <div className="flex gap-3">
          <select
            value={selectedQuarter}
            onChange={(e) => setSelectedQuarter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="Q1-2024">Q1 FY 2024-25 (Apr-Jun)</option>
            <option value="Q2-2024">Q2 FY 2024-25 (Jul-Sep)</option>
            <option value="Q3-2024">Q3 FY 2024-25 (Oct-Dec)</option>
            <option value="Q4-2024">Q4 FY 2024-25 (Jan-Mar)</option>
          </select>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <ArrowDownTrayIcon className="h-5 w-5" />
            Generate Form 26Q
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total TDS Deducted</p>
              <p className="text-2xl font-bold text-gray-800">{formatCurrency(summary.total_deducted)}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <CalculatorIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Deposited</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.total_deposited)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Deposit</p>
              <p className="text-2xl font-bold text-yellow-600">{formatCurrency(summary.pending_deposit)}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <ClockIcon className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
          <p className="text-xs text-yellow-600 mt-2">Due by 7th of next month</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Filing</p>
              <p className="text-2xl font-bold text-orange-600">{formatCurrency(summary.pending_filing)}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <DocumentTextIcon className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <p className="text-xs text-orange-600 mt-2">Form 26Q due: 31st Jan</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border mb-6">
        <div className="border-b">
          <nav className="flex -mb-px">
            {[
              { id: 'transactions', label: 'TDS Transactions', icon: BanknotesIcon },
              { id: 'challans', label: 'Challans', icon: DocumentTextIcon },
              { id: 'returns', label: 'Returns (26Q)', icon: DocumentTextIcon },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors
                  ${activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                <tab.icon className="h-5 w-5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div className="p-6">
            {/* Actions */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-2">
                <button
                  onClick={handleGenerateChallan}
                  disabled={selectedTransactions.length === 0}
                  className={`px-4 py-2 rounded-lg flex items-center gap-2 text-sm
                    ${selectedTransactions.length > 0
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                >
                  <PlusIcon className="h-4 w-4" />
                  Generate Challan ({selectedTransactions.length})
                </button>
              </div>

              <div className="flex gap-2">
                <select className="px-3 py-2 border rounded-lg text-sm">
                  <option value="">All Sections</option>
                  {sections.map(s => (
                    <option key={s.code} value={s.code}>{s.code} - {s.name}</option>
                  ))}
                </select>
                <select className="px-3 py-2 border rounded-lg text-sm">
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="deposited">Deposited</option>
                  <option value="filed">Filed</option>
                </select>
              </div>
            </div>

            {/* Transactions Table */}
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTransactions(transactions.filter(t => t.status === 'pending').map(t => t.id));
                        } else {
                          setSelectedTransactions([]);
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Party</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">PAN</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Section</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Base Amount</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Rate</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">TDS Amount</th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {transactions.map(txn => (
                  <tr key={txn.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedTransactions.includes(txn.id)}
                        onChange={() => handleSelectTransaction(txn.id)}
                        disabled={txn.status !== 'pending'}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(txn.transaction_date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-800">{txn.party_name}</div>
                      <div className="text-xs text-gray-500">{txn.reference_type}: {txn.reference_number}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-gray-600">{txn.pan_number}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-800">{txn.section_code}</div>
                      <div className="text-xs text-gray-500">{txn.section_name}</div>
                    </td>
                    <td className="px-4 py-3 text-right text-sm text-gray-600">
                      {formatCurrency(txn.base_amount)}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">{txn.tds_rate}%</td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-gray-800">
                      {formatCurrency(txn.tds_amount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {getStatusBadge(txn.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Challans Tab */}
        {activeTab === 'challans' && (
          <div className="p-6">
            <div className="text-center py-12 text-gray-500">
              <DocumentTextIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>TDS Challans management coming soon</p>
              <p className="text-sm">View and manage ITNS 281 challans here</p>
            </div>
          </div>
        )}

        {/* Returns Tab */}
        {activeTab === 'returns' && (
          <div className="p-6">
            <div className="text-center py-12 text-gray-500">
              <DocumentTextIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>Form 26Q Returns management coming soon</p>
              <p className="text-sm">Generate and track quarterly TDS returns</p>
            </div>
          </div>
        )}
      </div>

      {/* TDS Sections Reference */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">TDS Sections Reference</h3>
        <div className="grid grid-cols-3 gap-4">
          {sections.map(section => (
            <div key={section.code} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <span className="text-lg font-bold text-blue-600">{section.code}</span>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                  {section.rate_individual}% / {section.rate_company}%
                </span>
              </div>
              <div className="text-sm font-medium text-gray-800">{section.name}</div>
              <div className="text-xs text-gray-500 mt-1">{section.description}</div>
              <div className="text-xs text-gray-500 mt-2">
                Threshold: {formatCurrency(section.threshold)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
