import { pgTable, text, timestamp, integer, boolean, decimal, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  password: text('password').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Sessions table
export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Wallets table (store user's connected Stellar wallets)
export const wallets = pgTable('wallets', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  publicKey: varchar('public_key', { length: 56 }).notNull(),
  walletType: varchar('wallet_type', { length: 50 }).notNull(), // 'freighter', 'albedo', 'custom'
  displayName: varchar('display_name', { length: 255 }).notNull(),
  isDefault: boolean('is_default').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Transactions table (track all path payments)
export const transactions = pgTable('transactions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  walletId: text('wallet_id').references(() => wallets.id, { onDelete: 'set null' }),
  sourceAsset: varchar('source_asset', { length: 12 }).notNull(),
  sourceAmount: decimal('source_amount', { precision: 20, scale: 7 }).notNull(),
  destAsset: varchar('dest_asset', { length: 12 }).notNull(),
  destAmount: decimal('dest_amount', { precision: 20, scale: 7 }).notNull(),
  recipient: varchar('recipient', { length: 255 }).notNull(),
  txHash: varchar('tx_hash', { length: 64 }),
  status: varchar('status', { length: 50 }).notNull().default('pending'), // pending, success, failed
  feePaid: decimal('fee_paid', { precision: 20, scale: 7 }),
  savedAmount: decimal('saved_amount', { precision: 20, scale: 7 }),
  routePath: text('route_path'), // JSON array of assets in the path
  createdAt: timestamp('created_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
});

// Payment history/routes table
export const paymentRoutes = pgTable('payment_routes', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  sourceAsset: varchar('source_asset', { length: 12 }).notNull(),
  destAsset: varchar('dest_asset', { length: 12 }).notNull(),
  recipient: varchar('recipient', { length: 255 }).notNull(),
  recipientName: varchar('recipient_name', { length: 255 }),
  isFrequent: boolean('is_frequent').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  lastUsed: timestamp('last_used'),
});

// Relayer jobs (for autonomous features)
export const relayerJobs = pgTable('relayer_jobs', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  jobType: varchar('job_type', { length: 50 }).notNull(), // 'payment', 'monitoring', 'arbitrage'
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  payload: text('payload'), // JSON
  result: text('result'), // JSON
  createdAt: timestamp('created_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
  retries: integer('retries').notNull().default(0),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  wallets: many(wallets),
  transactions: many(transactions),
  paymentRoutes: many(paymentRoutes),
  relayerJobs: many(relayerJobs),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const walletsRelations = relations(wallets, ({ one, many }) => ({
  user: one(users, {
    fields: [wallets.userId],
    references: [users.id],
  }),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  wallet: one(wallets, {
    fields: [transactions.walletId],
    references: [wallets.id],
  }),
}));

export const paymentRoutesRelations = relations(paymentRoutes, ({ one }) => ({
  user: one(users, {
    fields: [paymentRoutes.userId],
    references: [users.id],
  }),
}));

export const relayerJobsRelations = relations(relayerJobs, ({ one }) => ({
  user: one(users, {
    fields: [relayerJobs.userId],
    references: [users.id],
  }),
}));
