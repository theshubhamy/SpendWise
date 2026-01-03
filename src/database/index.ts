/**
 * Database initialization and connection
 */

import { open, QuickSQLiteConnection, QueryResult } from 'react-native-quick-sqlite';
import { DB_NAME } from '@/constants/app';
import { CREATE_TABLES, CREATE_INDEXES, TABLES } from '@/database/schema';
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

    // Migrate existing database (add new columns if they don't exist)
    try {
      // Add paid_by_member_id column if it doesn't exist (for existing databases)
      db?.execute(`
        ALTER TABLE ${TABLES.EXPENSES}
        ADD COLUMN paid_by_member_id TEXT
        REFERENCES ${TABLES.GROUP_MEMBERS}(id) ON DELETE SET NULL;
      `);
    } catch (error) {
      // Column might already exist, ignore error
      if (!(error as Error).message.includes('duplicate column')) {
        console.warn('Migration warning:', error);
      }
    }

    // Create indexes
    CREATE_INDEXES.forEach((sql) => {
      try {
        db?.execute(sql);
      } catch (error) {
        // Index might already exist, ignore error
        if (!(error as Error).message.includes('already exists')) {
          console.warn('Index creation warning:', error);
        }
      }
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
  query: (query: string, params?: unknown[]) => QueryResult & {
    rows: {
      length: number;
      _array: unknown[];
      item: (idx: number) => unknown;
      [index: number]: unknown;
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
    query: (query: string, params?: unknown[]) => {
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
          rows: normalizedRows as typeof rows,
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

