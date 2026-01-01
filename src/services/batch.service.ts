/**
 * Batch service - handles batched database operations for performance
 */

import { getDatabase } from '@/database';
import { QUERIES } from '@/database/queries';

interface BatchOperation {
  query: string;
  params: any[];
}

class BatchWriter {
  private operations: BatchOperation[] = [];
  private batchSize: number = 50;
  private flushTimeout: NodeJS.Timeout | null = null;
  private readonly FLUSH_DELAY = 100; // ms

  /**
   * Add operation to batch
   */
  add(query: string, params: any[]): void {
    this.operations.push({ query, params });

    // Auto-flush if batch is full
    if (this.operations.length >= this.batchSize) {
      this.flush();
    } else {
      // Schedule flush after delay
      this.scheduleFlush();
    }
  }

  /**
   * Schedule a flush operation
   */
  private scheduleFlush(): void {
    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
    }

    this.flushTimeout = setTimeout(() => {
      this.flush();
    }, this.FLUSH_DELAY);
  }

  /**
   * Flush all pending operations
   */
  async flush(): Promise<void> {
    if (this.operations.length === 0) {
      return;
    }

    const db = getDatabase();
    const ops = [...this.operations];
    this.operations = [];

    if (this.flushTimeout) {
      clearTimeout(this.flushTimeout);
      this.flushTimeout = null;
    }

    // Execute all operations in a transaction-like manner
    try {
      for (const op of ops) {
        db.execute(op.query, op.params);
      }
    } catch (error) {
      console.error('Batch write error:', error);
      throw error;
    }
  }

  /**
   * Get pending operation count
   */
  getPendingCount(): number {
    return this.operations.length;
  }
}

// Global batch writer instance
export const batchWriter = new BatchWriter();

/**
 * Execute batched write operation
 */
export const batchWrite = async (
  operations: Array<{ query: string; params: any[] }>,
): Promise<void> => {
  const db = getDatabase();

  // Execute in batches for better performance
  const BATCH_SIZE = 50;
  for (let i = 0; i < operations.length; i += BATCH_SIZE) {
    const batch = operations.slice(i, i + BATCH_SIZE);
    for (const op of batch) {
      db.execute(op.query, op.params);
    }
  }
};

