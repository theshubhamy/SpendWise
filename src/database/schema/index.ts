/**
 * Database schema definitions
 */

export const SCHEMA_VERSION = 2; // Incremented for Splitwise features

export const TABLES = {
  EXPENSES: 'expenses',
  EXPENSE_GROUPS: 'expense_groups',
  GROUP_MEMBERS: 'group_members',
  EXPENSE_SPLITS: 'expense_splits',
  RECURRING_EXPENSES: 'recurring_expenses',
  REMINDERS: 'reminders',
  CURRENCIES: 'currencies',
  UNDO_HISTORY: 'undo_history',
  PAYMENTS: 'payments',
} as const;

export const CREATE_TABLES = {
  EXPENSES: `
    CREATE TABLE IF NOT EXISTS ${TABLES.EXPENSES} (
      id TEXT PRIMARY KEY,
      amount REAL NOT NULL,
      currency_code TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      notes_encrypted TEXT,
      date TEXT NOT NULL,
      group_id TEXT,
      paid_by_member_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (group_id) REFERENCES ${TABLES.EXPENSE_GROUPS}(id) ON DELETE SET NULL,
      FOREIGN KEY (paid_by_member_id) REFERENCES ${TABLES.GROUP_MEMBERS}(id) ON DELETE SET NULL
    );
  `,

  EXPENSE_GROUPS: `
    CREATE TABLE IF NOT EXISTS ${TABLES.EXPENSE_GROUPS} (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      currency_code TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `,

  GROUP_MEMBERS: `
    CREATE TABLE IF NOT EXISTS ${TABLES.GROUP_MEMBERS} (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (group_id) REFERENCES ${TABLES.EXPENSE_GROUPS}(id) ON DELETE CASCADE,
      UNIQUE(group_id, user_id)
    );
  `,

  EXPENSE_SPLITS: `
    CREATE TABLE IF NOT EXISTS ${TABLES.EXPENSE_SPLITS} (
      id TEXT PRIMARY KEY,
      expense_id TEXT NOT NULL,
      member_id TEXT NOT NULL,
      amount REAL NOT NULL,
      percentage REAL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (expense_id) REFERENCES ${TABLES.EXPENSES}(id) ON DELETE CASCADE,
      FOREIGN KEY (member_id) REFERENCES ${TABLES.GROUP_MEMBERS}(id) ON DELETE CASCADE
    );
  `,

  RECURRING_EXPENSES: `
    CREATE TABLE IF NOT EXISTS ${TABLES.RECURRING_EXPENSES} (
      id TEXT PRIMARY KEY,
      amount REAL NOT NULL,
      currency_code TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      interval TEXT NOT NULL,
      interval_value INTEGER NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT,
      last_generated TEXT,
      group_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (group_id) REFERENCES ${TABLES.EXPENSE_GROUPS}(id) ON DELETE SET NULL
    );
  `,

  REMINDERS: `
    CREATE TABLE IF NOT EXISTS ${TABLES.REMINDERS} (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      scheduled_date TEXT NOT NULL,
      expense_id TEXT,
      recurring_expense_id TEXT,
      is_completed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (expense_id) REFERENCES ${TABLES.EXPENSES}(id) ON DELETE CASCADE,
      FOREIGN KEY (recurring_expense_id) REFERENCES ${TABLES.RECURRING_EXPENSES}(id) ON DELETE CASCADE
    );
  `,

  CURRENCIES: `
    CREATE TABLE IF NOT EXISTS ${TABLES.CURRENCIES} (
      code TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      symbol TEXT NOT NULL,
      is_base INTEGER NOT NULL DEFAULT 0
    );
  `,

  UNDO_HISTORY: `
    CREATE TABLE IF NOT EXISTS ${TABLES.UNDO_HISTORY} (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      payload TEXT NOT NULL,
      timestamp TEXT NOT NULL
    );
  `,

  PAYMENTS: `
    CREATE TABLE IF NOT EXISTS ${TABLES.PAYMENTS} (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL,
      from_member_id TEXT NOT NULL,
      to_member_id TEXT NOT NULL,
      amount REAL NOT NULL,
      currency_code TEXT NOT NULL,
      date TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (group_id) REFERENCES ${TABLES.EXPENSE_GROUPS}(id) ON DELETE CASCADE,
      FOREIGN KEY (from_member_id) REFERENCES ${TABLES.GROUP_MEMBERS}(id) ON DELETE CASCADE,
      FOREIGN KEY (to_member_id) REFERENCES ${TABLES.GROUP_MEMBERS}(id) ON DELETE CASCADE
    );
  `,
};

// Indexes for performance
export const CREATE_INDEXES = [
  `CREATE INDEX IF NOT EXISTS idx_expenses_date ON ${TABLES.EXPENSES}(date);`,
  `CREATE INDEX IF NOT EXISTS idx_expenses_group_id ON ${TABLES.EXPENSES}(group_id);`,
  `CREATE INDEX IF NOT EXISTS idx_expenses_paid_by ON ${TABLES.EXPENSES}(paid_by_member_id);`,
  `CREATE INDEX IF NOT EXISTS idx_expenses_category ON ${TABLES.EXPENSES}(category);`,
  `CREATE INDEX IF NOT EXISTS idx_expenses_currency_code ON ${TABLES.EXPENSES}(currency_code);`,
  `CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON ${TABLES.GROUP_MEMBERS}(group_id);`,
  `CREATE INDEX IF NOT EXISTS idx_expense_splits_expense_id ON ${TABLES.EXPENSE_SPLITS}(expense_id);`,
  `CREATE INDEX IF NOT EXISTS idx_expense_splits_member_id ON ${TABLES.EXPENSE_SPLITS}(member_id);`,
  `CREATE INDEX IF NOT EXISTS idx_recurring_expenses_start_date ON ${TABLES.RECURRING_EXPENSES}(start_date);`,
  `CREATE INDEX IF NOT EXISTS idx_reminders_scheduled_date ON ${TABLES.REMINDERS}(scheduled_date);`,
  `CREATE INDEX IF NOT EXISTS idx_undo_history_timestamp ON ${TABLES.UNDO_HISTORY}(timestamp);`,
  `CREATE INDEX IF NOT EXISTS idx_payments_group_id ON ${TABLES.PAYMENTS}(group_id);`,
  `CREATE INDEX IF NOT EXISTS idx_payments_from_member ON ${TABLES.PAYMENTS}(from_member_id);`,
  `CREATE INDEX IF NOT EXISTS idx_payments_to_member ON ${TABLES.PAYMENTS}(to_member_id);`,
];
