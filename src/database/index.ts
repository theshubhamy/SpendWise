/**
 * Database initialization and connection
 */

import { open, QuickSQLiteConnection, QueryResult } from 'react-native-quick-sqlite';
import { DB_NAME } from '@/constants';
import { CREATE_TABLES, CREATE_INDEXES } from '@/database/schema';
import { initializeDefaultCurrencies } from '@/services/currency.service';

let db: QuickSQLiteConnection | null = null;

export const initDatabase = async (): Promise<void> => {
  try {
    db = open({
      name: DB_NAME,
      location: 'default',
    });

    // Create tables
    Object.values(CREATE_TABLES).forEach((sql) => {
      db?.execute(sql);
    });

    // Create indexes
    CREATE_INDEXES.forEach((sql) => {
      db?.execute(sql);
    });

    // Initialize default currencies
    await initializeDefaultCurrencies();

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};

// Extended database interface with query helper for backward compatibility
interface DatabaseWithQuery extends QuickSQLiteConnection {
  query: (query: string, params?: any[]) => QueryResult & {
    rows: {
      length: number;
      _array: any[];
      item: (idx: number) => any;
      [index: number]: any;
    } | undefined;
  };
}

export const getDatabase = (): DatabaseWithQuery => {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }

  // Add query method that uses execute and normalizes result format
  return {
    ...db,
    query: (query: string, params?: any[]) => {
      const result = db!.execute(query, params);
      // Normalize result.rows to support both array access and _array access
      if (result.rows) {
        const rows = result.rows;
        const array = rows._array || [];
        // Create a proxy that allows both array[index] and rows.item(index) access
        const normalizedRows = new Proxy(rows, {
          get(target, prop) {
            if (typeof prop === 'string' && !isNaN(Number(prop))) {
              // Array index access
              return array[Number(prop)];
            }
            return target[prop as keyof typeof target];
          },
        });
        return {
          ...result,
          rows: normalizedRows as any,
        };
      }
      return result;
    },
  } as DatabaseWithQuery;
};

export const closeDatabase = () => {
  if (db) {
    db.close();
    db = null;
  }
};

