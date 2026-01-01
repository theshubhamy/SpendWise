/**
 * Currency conversion service
 * Handles exchange rates and currency conversions
 */

import { getDatabase } from '@/database';
import { QUERIES } from '@/database/queries';
import { Currency } from '@/types';
import { DEFAULT_SETTINGS, STORAGE_KEYS } from '@/constants';
import { Storage } from '@/utils/storage';


/**
 * Get base currency
 */
export const getBaseCurrency = async (): Promise<string> => {
  const baseCurrency = Storage.getString(STORAGE_KEYS.BASE_CURRENCY);
  return baseCurrency || DEFAULT_SETTINGS.BASE_CURRENCY;
};

/**
 * Set base currency
 */
export const setBaseCurrency = async (currencyCode: string): Promise<void> => {
  Storage.setString(STORAGE_KEYS.BASE_CURRENCY, currencyCode);

  // Update database
  const db = getDatabase();
  db.execute(`UPDATE currencies SET is_base = 0`);
  db.execute(`UPDATE currencies SET is_base = 1 WHERE code = ?`, [currencyCode]);
};

/**
 * Get exchange rate for a currency
 */
export const getExchangeRate = async (currencyCode: string): Promise<number> => {
  if (currencyCode === await getBaseCurrency()) {
    return 1.0;
  }

  const db = getDatabase();
  const result = db.query(QUERIES.GET_CURRENCY_BY_CODE, [currencyCode]);

  if (result.rows && result.rows.length > 0) {
    return result.rows[0].exchange_rate as number;
  }

  // Default to 1.0 if currency not found
  return 1.0;
};

/**
 * Set exchange rate for a currency
 */
export const setExchangeRate = async (
  currencyCode: string,
  rate: number,
): Promise<void> => {
  const db = getDatabase();
  const result = db.query(QUERIES.GET_CURRENCY_BY_CODE, [currencyCode]);

  if (result.rows && result.rows.length > 0) {
    // Update existing currency
    db.execute(QUERIES.UPDATE_CURRENCY, [
      result.rows[0].name as string,
      result.rows[0].symbol as string,
      rate,
      0, // is_base
      currencyCode,
    ]);
  } else {
    // Add new currency
    const currencyName = getCurrencyName(currencyCode);
    const currencySymbol = getCurrencySymbol(currencyCode);
    const baseCurrency = await getBaseCurrency();

    db.execute(QUERIES.INSERT_CURRENCY, [
      currencyCode,
      currencyName,
      currencySymbol,
      rate,
      currencyCode === baseCurrency ? 1 : 0,
    ]);
  }
};

/**
 * Convert amount from one currency to base currency
 */
export const convertToBase = async (
  amount: number,
  fromCurrency: string,
): Promise<number> => {
  const baseCurrency = await getBaseCurrency();

  if (fromCurrency === baseCurrency) {
    return amount;
  }

  const exchangeRate = await getExchangeRate(fromCurrency);
  return amount * exchangeRate;
};

/**
 * Convert amount from base currency to target currency
 */
export const convertFromBase = async (
  amount: number,
  toCurrency: string,
): Promise<number> => {
  const baseCurrency = await getBaseCurrency();

  if (toCurrency === baseCurrency) {
    return amount;
  }

  const exchangeRate = await getExchangeRate(toCurrency);
  return amount / exchangeRate;
};

/**
 * Get all currencies
 */
export const getAllCurrencies = async (): Promise<Currency[]> => {
  const db = getDatabase();
  const result = db.query(QUERIES.GET_ALL_CURRENCIES);

  const currencies: Currency[] = [];
  for (let i = 0; i < (result.rows?.length || 0); i++) {
    const row = result.rows?.[i];
    if (row) {
      currencies.push({
        code: row.code as string,
        name: row.name as string,
        symbol: row.symbol as string,
        exchangeRate: row.exchange_rate as number,
        isBase: (row.is_base as number) === 1,
      });
    }
  }

  return currencies;
};

/**
 * Initialize default currencies
 */
export const initializeDefaultCurrencies = async (): Promise<void> => {
  const db = getDatabase();
  const baseCurrency = await getBaseCurrency();

  const defaultCurrencies = [
    { code: 'USD', name: 'US Dollar', symbol: '$', rate: 1.0 },
    { code: 'EUR', name: 'Euro', symbol: '€', rate: 0.85 },
    { code: 'GBP', name: 'British Pound', symbol: '£', rate: 0.73 },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹', rate: 83.0 },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥', rate: 110.0 },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', rate: 1.25 },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', rate: 1.35 },
  ];

  for (const currency of defaultCurrencies) {
    const existing = db.query(QUERIES.GET_CURRENCY_BY_CODE, [currency.code]);

    if (!existing.rows || existing.rows.length === 0) {
      db.execute(QUERIES.INSERT_CURRENCY, [
        currency.code,
        currency.name,
        currency.symbol,
        currency.rate,
        currency.code === baseCurrency ? 1 : 0,
      ]);
    }
  }
};

/**
 * Get currency name by code
 */
const getCurrencyName = (code: string): string => {
  const names: Record<string, string> = {
    USD: 'US Dollar',
    EUR: 'Euro',
    GBP: 'British Pound',
    INR: 'Indian Rupee',
    JPY: 'Japanese Yen',
    CAD: 'Canadian Dollar',
    AUD: 'Australian Dollar',
  };
  return names[code] || code;
};

/**
 * Get currency symbol by code
 */
const getCurrencySymbol = (code: string): string => {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    INR: '₹',
    JPY: '¥',
    CAD: 'C$',
    AUD: 'A$',
  };
  return symbols[code] || code;
};

