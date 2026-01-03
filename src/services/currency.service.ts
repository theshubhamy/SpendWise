/**
 * Currency service
 * Handles currency management (no exchange rate conversion)
 */

import { getDatabase } from '@/database';
import { QUERIES } from '@/database/queries';
import { Currency } from '@/types';
import { DEFAULT_SETTINGS, STORAGE_KEYS } from '@/constants';
import { Storage } from '@/utils/storage';
import { DEFAULT_CURRENCIES } from '@/constants/currencies';

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
  db.execute(`UPDATE currencies SET is_base = 1 WHERE code = ?`, [
    currencyCode,
  ]);
};

/**
 * Get all currencies
 */
export const getAllCurrencies = async (): Promise<Currency[]> => {
  const db = getDatabase();
  const result = db.query(QUERIES.GET_ALL_CURRENCIES);

  const currencies: Currency[] = [];
  for (let i = 0; i < (result.rows?.length || 0); i++) {
    const row = result.rows?.[i] as Record<string, unknown> | undefined;
    if (row) {
      currencies.push({
        code: row.code as string,
        name: row.name as string,
        symbol: row.symbol as string,
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

  for (const currency of DEFAULT_CURRENCIES) {
    const existing = db.query(QUERIES.GET_CURRENCY_BY_CODE, [currency.code]);

    if (!existing.rows || existing.rows.length === 0) {
      db.execute(QUERIES.INSERT_CURRENCY, [
        currency.code,
        currency.name,
        currency.symbol,
        currency.code === baseCurrency ? 1 : 0,
      ]);
    }
  }
};

/**
 * Re-export currency helper functions from constants
 */
export { getCurrencySymbol } from '@/constants/currencies';
