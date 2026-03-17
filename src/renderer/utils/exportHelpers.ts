/**
 * Export Helper Functions
 */

export const exportToPDF = async (title: string, elementId?: string) => {
  try {
    await window.print();
    return true;
  } catch (error) {
    console.error('PDF export error:', error);
    alert('Failed to export PDF');
    return false;
  }
};

export const exportToExcel = (data: any[], filename: string) => {
  try {
    // Convert data to CSV
    if (!data || data.length === 0) {
      alert('No data to export');
      return false;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Handle values with commas or quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return true;
  } catch (error) {
    console.error('Excel export error:', error);
    alert('Failed to export to Excel');
    return false;
  }
};

export const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Clipboard error:', error);
    return false;
  }
};

export const makePhoneCall = (phoneNumber: string) => {
  if (!phoneNumber) return;
  // In Electron, you could integrate with system telephony or open default phone app
  window.open(`tel:${phoneNumber}`);
};

export const sendEmail = (email: string, subject?: string, body?: string) => {
  if (!email) return;
  let mailto = `mailto:${email}`;
  const params = [];
  if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
  if (body) params.push(`body=${encodeURIComponent(body)}`);
  if (params.length > 0) mailto += `?${params.join('&')}`;
  window.open(mailto);
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};
