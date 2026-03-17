/**
 * Common Report Actions Component
 * Reusable export buttons for all report pages
 */
import React from 'react';
import { FileSpreadsheet, Printer, RefreshCw, Mail } from 'lucide-react';
import { exportToExcel } from '../../utils/exportHelpers';

interface ReportActionsProps {
  onRefresh?: () => void;
  onExport?: () => void;
  onPrint?: () => void;
  onEmail?: () => void;
  exportData?: any[];
  exportFilename?: string;
  className?: string;
}

export const ReportActions: React.FC<ReportActionsProps> = ({
  onRefresh,
  onExport,
  onPrint,
  onEmail,
  exportData,
  exportFilename = 'report',
  className = '',
}) => {
  const handleExport = () => {
    if (onExport) {
      onExport();
    } else if (exportData) {
      exportToExcel(exportData, exportFilename);
    }
  };

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <div className={`flex gap-3 ${className}`}>
      {onEmail && (
        <button
          onClick={onEmail}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Mail className="h-4 w-4" />
          Email
        </button>
      )}
      
      {(onExport || exportData) && (
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <FileSpreadsheet className="h-4 w-4" />
          Export Excel
        </button>
      )}
      
      <button
        onClick={handlePrint}
        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Printer className="h-4 w-4" />
        Print
      </button>
      
      {onRefresh && (
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      )}
    </div>
  );
};
