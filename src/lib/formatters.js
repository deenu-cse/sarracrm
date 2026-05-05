import { format } from 'date-fns';

export const formatCurrency = (amountInLakhs) => {
  if (amountInLakhs === null || amountInLakhs === undefined || isNaN(amountInLakhs)) return '₹0.00 Lakh';
  return `₹${Number(amountInLakhs).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Lakh`;
};

export const formatNumber = (num) => {
  if (num === null || num === undefined || isNaN(num)) return '0';
  return Number(num).toLocaleString('en-IN');
};

export const formatDate = (dateString, formatStr = 'dd MMM yyyy') => {
  if (!dateString) return 'N/A';
  try {
    return format(new Date(dateString), formatStr);
  } catch (e) {
    return 'Invalid Date';
  }
};

export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};
