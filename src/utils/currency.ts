// Utility functions for currency formatting and parsing

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export const parseCurrency = (value: string): number => {
  // Remove all non-numeric characters except comma and dot
  const cleanValue = value.replace(/[^\d,.-]/g, '');
  
  // Replace comma with dot for proper parsing
  const normalizedValue = cleanValue.replace(',', '.');
  
  return parseFloat(normalizedValue) || 0;
};

export const formatCurrencyInput = (value: string): string => {
  // Remove all non-numeric characters
  const numericValue = value.replace(/\D/g, '');
  
  if (!numericValue) return '';
  
  // Convert to number and divide by 100 to handle cents
  const number = parseInt(numericValue) / 100;
  
  // Format with Brazilian currency format
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(number);
};