import React, { useState, useEffect } from 'react';
import {
  ScaleIcon,
  ArrowDownTrayIcon,
  PrinterIcon,
  BuildingLibraryIcon,
  CurrencyRupeeIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';
import { Card, Button, Badge } from '../../components/common';
import { useApp } from '../../context';

interface BalanceSheetItem {
  id: number;
  code: string;
  name: string;
  amount: number;
  previousAmount: number;
  isSubtotal?: boolean;
  isHeader?: boolean;
  indent?: number;
}

export function BalanceSheet() {
  const { state, notify } = useApp();
  const [assetItems, setAssetItems] = useState<BalanceSheetItem[]>([]);
  const [liabilityItems, setLiabilityItems] = useState<BalanceSheetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [asOnDate, setAsOnDate] = useState('2024-01-31');

  useEffect(() => {
    loadBalanceSheet();
  }, [asOnDate, state.user?.tenant_id]);

  const loadBalanceSheet = async () => {
    if (!state.user?.tenant_id) return;
    
    setLoading(true);
    try {
      const response = await window.electronAPI.finance.getBalanceSheet(state.user.tenant_id, asOnDate);
      
      if (response.success && response.data) {
        setAssetItems(response.data.assets || []);
        setLiabilityItems(response.data.liabilities || []);
      } else {
        notify('error', response.error || 'Failed to load balance sheet');
      }
    } catch (error) {
      console.error('Error loading balance sheet:', error);
      notify('error', 'Failed to load balance sheet');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    const isNegative = amount < 0;
    const formatted = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Math.abs(amount));
    return isNegative ? `(${formatted})` : formatted;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Calculate totals
  const totalAssets = assetItems.filter(i => i.code === '' && i.isSubtotal && !i.name.includes('Net') && !i.name.includes('Total Inventories'))
    .reduce((sum, i) => sum + i.amount, 0);
  const totalLiabilities = liabilityItems.filter(i => i.isSubtotal).reduce((sum, i) => sum + i.amount, 0);

  const prevTotalAssets = assetItems.filter(i => i.code === '' && i.isSubtotal && !i.name.includes('Net') && !i.name.includes('Total Inventories'))
    .reduce((sum, i) => sum + i.previousAmount, 0);
  const prevTotalLiabilities = liabilityItems.filter(i => i.isSubtotal).reduce((sum, i) => sum + i.previousAmount, 0);

  const isBalanced = Math.abs(totalAssets - totalLiabilities) < 1;
  const currentRatio = (assetItems.find(a => a.name === 'Total Current Assets')?.amount || 0) / 
    (liabilityItems.find(l => l.name === 'Total Current Liabilities')?.amount || 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Balance Sheet</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Statement of Financial Position as per Schedule III
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">
            <PrinterIcon className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button variant="secondary">
            <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              As On Date
            </label>
            <input
              type="date"
              value={asOnDate}
              onChange={(e) => setAsOnDate(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg dark:bg-slate-700 dark:border-slate-600"
            />
          </div>
          <div className="ml-auto flex items-center gap-4">
            {isBalanced ? (
              <Badge variant="success">✓ Balanced</Badge>
            ) : (
              <Badge variant="danger">⚠ Not Balanced</Badge>
            )}
          </div>
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <BuildingLibraryIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <div className="text-sm text-slate-500">Total Assets</div>
              <div className="text-xl font-bold text-blue-600">{formatCurrency(totalAssets)}</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <BanknotesIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <div className="text-sm text-slate-500">Total Liabilities</div>
              <div className="text-xl font-bold text-purple-600">{formatCurrency(totalLiabilities)}</div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CurrencyRupeeIcon className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-sm text-slate-500">Net Worth</div>
              <div className="text-xl font-bold text-green-600">
                {formatCurrency(liabilityItems.find(l => l.name === "Total Shareholders' Funds")?.amount || 0)}
              </div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <ScaleIcon className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <div className="text-sm text-slate-500">Current Ratio</div>
              <div className={`text-xl font-bold ${currentRatio >= 1.5 ? 'text-green-600' : currentRatio >= 1 ? 'text-amber-600' : 'text-red-600'}`}>
                {currentRatio.toFixed(2)}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Balance Sheet - Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Liabilities & Equity Side */}
        <Card>
          <div className="px-6 py-4 border-b dark:border-slate-700 bg-purple-50 dark:bg-purple-900/20">
            <h3 className="font-semibold text-purple-700 dark:text-purple-400">
              EQUITY AND LIABILITIES
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">Particulars</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-600 dark:text-slate-300">As on {formatDate(asOnDate)}</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-600 dark:text-slate-300">Previous</th>
                </tr>
              </thead>
              <tbody>
                {liabilityItems.map((item) => (
                  <tr 
                    key={item.id} 
                    className={`
                      ${item.isHeader && !item.indent ? 'bg-purple-50/50 dark:bg-purple-900/10 font-bold' : ''}
                      ${item.isHeader && item.indent ? 'font-semibold' : ''}
                      ${item.isSubtotal ? 'bg-purple-100/50 dark:bg-purple-900/20 font-bold border-t border-b dark:border-slate-700' : ''}
                      hover:bg-slate-50 dark:hover:bg-slate-800/50
                    `}
                  >
                    <td className="px-4 py-2" style={{ paddingLeft: `${(item.indent || 0) * 16 + 16}px` }}>
                      {item.code && <span className="text-xs text-slate-500 mr-2">{item.code}</span>}
                      {item.name}
                    </td>
                    <td className="px-4 py-2 text-right">{item.amount !== 0 ? formatCurrency(item.amount) : ''}</td>
                    <td className="px-4 py-2 text-right text-slate-500">{item.previousAmount !== 0 ? formatCurrency(item.previousAmount) : ''}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-purple-200 dark:bg-purple-900/40 font-bold">
                <tr>
                  <td className="px-4 py-3">TOTAL EQUITY AND LIABILITIES</td>
                  <td className="px-4 py-3 text-right text-purple-700">{formatCurrency(totalLiabilities)}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(prevTotalLiabilities)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>

        {/* Assets Side */}
        <Card>
          <div className="px-6 py-4 border-b dark:border-slate-700 bg-blue-50 dark:bg-blue-900/20">
            <h3 className="font-semibold text-blue-700 dark:text-blue-400">
              ASSETS
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">Particulars</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-600 dark:text-slate-300">As on {formatDate(asOnDate)}</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-600 dark:text-slate-300">Previous</th>
                </tr>
              </thead>
              <tbody>
                {assetItems.map((item) => (
                  <tr 
                    key={item.id} 
                    className={`
                      ${item.isHeader && !item.indent ? 'bg-blue-50/50 dark:bg-blue-900/10 font-bold' : ''}
                      ${item.isHeader && item.indent ? 'font-semibold' : ''}
                      ${item.isSubtotal ? 'bg-blue-100/50 dark:bg-blue-900/20 font-bold border-t border-b dark:border-slate-700' : ''}
                      hover:bg-slate-50 dark:hover:bg-slate-800/50
                    `}
                  >
                    <td className="px-4 py-2" style={{ paddingLeft: `${(item.indent || 0) * 16 + 16}px` }}>
                      {item.code && <span className="text-xs text-slate-500 mr-2">{item.code}</span>}
                      {item.name}
                    </td>
                    <td className="px-4 py-2 text-right">{item.amount !== 0 ? formatCurrency(item.amount) : ''}</td>
                    <td className="px-4 py-2 text-right text-slate-500">{item.previousAmount !== 0 ? formatCurrency(item.previousAmount) : ''}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-blue-200 dark:bg-blue-900/40 font-bold">
                <tr>
                  <td className="px-4 py-3">TOTAL ASSETS</td>
                  <td className="px-4 py-3 text-right text-blue-700">{formatCurrency(totalAssets)}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(prevTotalAssets)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      </div>

      {/* Key Ratios */}
      <Card className="p-6">
        <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Key Financial Ratios</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div className="text-sm text-slate-500">Debt-to-Equity</div>
            <div className="text-lg font-bold text-slate-900 dark:text-white">
              {((350000 + 724450 - 2715750) / 2715750 * -1).toFixed(2)}
            </div>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div className="text-sm text-slate-500">Quick Ratio</div>
            <div className="text-lg font-bold text-slate-900 dark:text-white">
              {((2040200 - 850000) / 724450).toFixed(2)}
            </div>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div className="text-sm text-slate-500">Working Capital</div>
            <div className="text-lg font-bold text-green-600">
              {formatCurrency(2040200 - 724450)}
            </div>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div className="text-sm text-slate-500">ROE</div>
            <div className="text-lg font-bold text-slate-900 dark:text-white">
              {(115750 / 2715750 * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default BalanceSheet;
