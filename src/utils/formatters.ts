import { Currency } from '../types';

export const formatCurrency = (
  amount: number, 
  currency: Currency = 'USD', 
  notation: 'compact' | 'standard' = 'standard'
): string => {
  if (currency === 'INR') {
    // Conversion factor for display: 1 USD ≈ 83 INR
    const inrValue = amount * 83;
    if (notation === 'compact') {
      if (Math.abs(inrValue) >= 10000000) {
        return `₹${(inrValue / 10000000).toFixed(2)} Cr`;
      }
      if (Math.abs(inrValue) >= 100000) {
        return `₹${(inrValue / 100000).toFixed(2)} L`;
      }
      if (Math.abs(inrValue) >= 1000) {
        return `₹${(inrValue / 1000).toFixed(1)}k`;
      }
      return `₹${inrValue.toLocaleString('en-IN')}`;
    }
    return `₹${Math.round(inrValue).toLocaleString('en-IN')}`;
  }

  // USD Default
  if (notation === 'compact') {
    if (Math.abs(amount) >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    if (Math.abs(amount) >= 1000) {
      return `$${(amount / 1000).toFixed(1)}k`;
    }
    return `$${amount.toLocaleString('en-US')}`;
  }

  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

export const formatPercent = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

export const truncateHash = (hash: string, left: number = 6, right: number = 4): string => {
  if (!hash || hash.length <= left + right) return hash;
  return `${hash.slice(0, left)}...${hash.slice(-right)}`;
};
