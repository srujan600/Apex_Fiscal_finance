import { Currency } from '../types';

export const formatCurrency = (
  amount: number, 
  currency: Currency = 'INR', 
  notation: 'compact' | 'standard' = 'standard'
): string => {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₹0';
  }

  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const sign = isNegative ? '-' : '';

  // All financial figures across APEX Fiscal are formatted exclusively in INR (₹)
  // Conversion factor from base ledger unit: 1 USD ≈ 83 INR
  const inrValue = absAmount * 83;
  if (notation === 'compact') {
    if (inrValue >= 10000000) {
      return `${sign}₹${(inrValue / 10000000).toFixed(2)} Cr`;
    }
    if (inrValue >= 100000) {
      return `${sign}₹${(inrValue / 100000).toFixed(2)} L`;
    }
    if (inrValue >= 1000) {
      return `${sign}₹${(inrValue / 1000).toFixed(1)}k`;
    }
    return `${sign}₹${Math.round(inrValue).toLocaleString('en-IN')}`;
  }

  return `${sign}₹${Math.round(inrValue).toLocaleString('en-IN')}`;
};

export const formatPercent = (value: number, decimals: number = 1): string => {
  if (isNaN(value) || value === null || value === undefined) return '0%';
  return `${value.toFixed(decimals)}%`;
};

export const truncateHash = (hash: string, left: number = 6, right: number = 4): string => {
  if (!hash || hash.length <= left + right) return hash;
  return `${hash.slice(0, left)}...${hash.slice(-right)}`;
};
