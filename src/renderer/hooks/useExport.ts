/**
 * useExport Hook - Reusable export functionality
 */
import { useState } from 'react';
import { exportToExcel, exportToPDF } from '../utils/exportHelpers';

export const useExport = (filename: string) => {
  const [exporting, setExporting] = useState(false);

  const handleExportExcel = async (data: any[]) => {
    setExporting(true);
    try {
      await exportToExcel(data, filename);
    } finally {
      setExporting(false);
    }
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      await exportToPDF(filename);
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return {
    exporting,
    exportExcel: handleExportExcel,
    exportPDF: handleExportPDF,
    print: handlePrint,
  };
};
