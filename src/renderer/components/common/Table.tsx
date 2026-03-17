/**
 * Table Component
 */

import React from 'react';

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  sortable?: boolean;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor?: (row: T, index: number) => string;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  emptyMessage?: string;
  striped?: boolean;
  hoverable?: boolean;
  compact?: boolean;
  className?: string;
  selectedRow?: T;
  rowClassName?: (row: T) => string;
}

export function Table<T extends Record<string, any>>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  loading = false,
  emptyMessage = 'No data available',
  striped = true,
  hoverable = true,
  compact = false,
  className = '',
  selectedRow,
  rowClassName,
}: TableProps<T>) {
  const getKey = (row: T, index: number): string => {
    if (keyExtractor) return keyExtractor(row, index);
    if (row.id) return String(row.id);
    return String(index);
  };

  const getCellValue = (row: T, column: Column<T>, index: number): React.ReactNode => {
    if (column.render) {
      return column.render(row, index);
    }
    const value = row[column.key as keyof T];
    return value !== undefined && value !== null ? String(value) : '-';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={String(column.key)}
                scope="col"
                className={`
                  ${compact ? 'px-3 py-2' : 'px-6 py-3'}
                  text-left text-xs font-medium text-gray-500 uppercase tracking-wider
                  ${column.headerClassName || ''}
                `}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-6 py-12 text-center text-gray-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, index) => {
              const isSelected = selectedRow && JSON.stringify(selectedRow) === JSON.stringify(row);
              const customRowClass = rowClassName ? rowClassName(row) : '';
              
              return (
                <tr
                  key={getKey(row, index)}
                  onClick={() => onRowClick?.(row)}
                  className={`
                    ${striped && index % 2 === 1 ? 'bg-gray-50' : ''}
                    ${hoverable && onRowClick ? 'hover:bg-gray-100 cursor-pointer' : ''}
                    ${isSelected ? 'bg-blue-50' : ''}
                    ${customRowClass}
                  `}
                >
                  {columns.map((column) => (
                    <td
                      key={`${getKey(row, index)}-${String(column.key)}`}
                      className={`
                        ${compact ? 'px-3 py-2' : 'px-6 py-4'}
                        whitespace-nowrap text-sm text-gray-900
                        ${column.className || ''}
                      `}
                    >
                      {getCellValue(row, column, index)}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
