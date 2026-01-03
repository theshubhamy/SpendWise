/**
 * Currency Constants
 * Centralized currency definitions used throughout the app
 */

export interface CurrencyDefinition {
  code: string;
  name: string;
  symbol: string;
}

/**
 * All supported currencies
 */
export const CURRENCIES: CurrencyDefinition[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱' },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨' },
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳' },
  { code: 'LKR', name: 'Sri Lankan Rupee', symbol: '₨' },
  { code: 'NPR', name: 'Nepalese Rupee', symbol: '₨' },
];

/**
 * Currency code to definition map for quick lookup
 */
export const CURRENCY_MAP: Record<string, CurrencyDefinition> =
  CURRENCIES.reduce((acc, currency) => {
    acc[currency.code] = currency;
    return acc;
  }, {} as Record<string, CurrencyDefinition>);

/**
 * Get currency by code
 */
export const getCurrencyByCode = (
  code: string,
): CurrencyDefinition | undefined => {
  return CURRENCY_MAP[code];
};

/**
 * Get currency name by code
 */
export const getCurrencyName = (code: string): string => {
  return CURRENCY_MAP[code]?.name || code;
};

/**
 * Get currency symbol by code
 */
export const getCurrencySymbol = (code: string): string => {
  return CURRENCY_MAP[code]?.symbol || code;
};

/**
 * Get formatted currency display string
 * Format: "CODE - Name Symbol"
 */
export const getCurrencyDisplayName = (code: string): string => {
  const currency = CURRENCY_MAP[code];
  if (!currency) {
    return code;
  }
  return `${currency.code} - ${currency.name} ${currency.symbol}`;
};

/**
 * Default currencies for initialization (most commonly used)
 */
export const DEFAULT_CURRENCIES: CurrencyDefinition[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
];
