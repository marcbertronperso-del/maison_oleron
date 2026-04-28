import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTableCreator,
  primaryKey,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { type AdapterAccount } from "next-auth/adapters";

export const createTable = pgTableCreator((name) => `maison-oleron_${name}`);

// ── Enums ──────────────────────────────────────────────────────────────────

export const bookingStatusEnum = pgEnum("booking_status", [
  "pending",
  "confirmed",
  "cancelled",
  "refunded",
]);

// ── Business Tables ────────────────────────────────────────────────────────

export const bookings = createTable(
  "bookings",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    arrival_date: date("arrival_date", { mode: "string" }).notNull(),
    departure_date: date("departure_date", { mode: "string" }).notNull(),
    tenant_name: d.varchar({ length: 255 }).notNull(),
    tenant_email: d.varchar({ length: 255 }).notNull(),
    tenant_phone: d.varchar({ length: 50 }).notNull(),
    total_price: d.integer().notNull(),     // cents (e.g. 84000 = 840.00 EUR)
    deposit_amount: d.integer().notNull(),  // cents
    status: bookingStatusEnum("status").notNull().default("pending"),
    stripe_payment_id: d.varchar({ length: 255 }),
    paypal_order_id: d.varchar({ length: 255 }),
    created_at: d.timestamp({ withTimezone: true }).notNull().defaultNow(),
    confirmed_at: d.timestamp({ withTimezone: true }),
  }),
  (t) => [
    index("bookings_arrival_date_idx").on(t.arrival_date),
    index("bookings_departure_date_idx").on(t.departure_date),
    index("bookings_status_idx").on(t.status),
    index("bookings_tenant_email_idx").on(t.tenant_email),
  ],
);

export const slotHolds = createTable(
  "slot_holds",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    arrival_date: date("arrival_date", { mode: "string" }).notNull(),
    departure_date: date("departure_date", { mode: "string" }).notNull(),
    booking_reference: d.varchar({ length: 255 }).notNull(),
    expires_at: d.timestamp({ withTimezone: true }).notNull(),
    created_at: d.timestamp({ withTimezone: true }).notNull().defaultNow(),
  }),
  (t) => [
    index("slot_holds_expires_at_idx").on(t.expires_at),
    index("slot_holds_arrival_date_idx").on(t.arrival_date),
  ],
);

export const availabilityBlocks = createTable(
  "availability_blocks",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    start_date: date("start_date", { mode: "string" }).notNull(),
    end_date: date("end_date", { mode: "string" }).notNull(),
    reason: d.text(),
    created_by_admin: d.boolean().notNull().default(true),
    created_at: d.timestamp({ withTimezone: true }).notNull().defaultNow(),
  }),
  (t) => [
    index("availability_blocks_start_date_idx").on(t.start_date),
    index("availability_blocks_end_date_idx").on(t.end_date),
  ],
);

export const pricingPeriods = createTable("pricing_periods", (d) => ({
  id: d.uuid().primaryKey().defaultRandom(),
  name: d.varchar({ length: 255 }).notNull(),
  start_month: d.integer().notNull(), // 1–12
  end_month: d.integer().notNull(),   // 1–12
  price_per_night: d.integer().notNull(), // cents (e.g. 8000 = 80.00 EUR)
  created_at: d.timestamp({ withTimezone: true }).notNull().defaultNow(),
  updated_at: d
    .timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
}));

export const photos = createTable(
  "photos",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    blob_url: d.text().notNull(),
    alt_text: d.varchar({ length: 255 }).notNull(),
    display_order: d.integer().notNull(),
    is_active: d.boolean().notNull().default(true),
    created_at: d.timestamp({ withTimezone: true }).notNull().defaultNow(),
  }),
  (t) => [index("photos_display_order_idx").on(t.display_order)],
);

export const adminAuditLogs = createTable(
  "admin_audit_logs",
  (d) => ({
    id: d.uuid().primaryKey().defaultRandom(),
    action: d.varchar({ length: 255 }).notNull(),
    entity_type: d.varchar({ length: 100 }).notNull(),
    entity_id: d.varchar({ length: 255 }),
    details: jsonb("details"),
    performed_at: d.timestamp({ withTimezone: true }).notNull().defaultNow(),
  }),
  (t) => [index("admin_audit_logs_performed_at_idx").on(t.performed_at)],
);

// ── Auth.js Tables ─────────────────────────────────────────────────────────
// Required by @auth/drizzle-adapter — fully wired in Story 4.1

export const users = createTable("user", (d) => ({
  id: d
    .varchar({ length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: d.varchar({ length: 255 }),
  email: d.varchar({ length: 255 }).notNull(),
  emailVerified: d
    .timestamp({ mode: "date", withTimezone: true })
    .$defaultFn(() => new Date()),
  image: d.varchar({ length: 255 }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
}));

export const accounts = createTable(
  "account",
  (d) => ({
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    type: d
      .varchar({ length: 255 })
      .$type<AdapterAccount["type"]>()
      .notNull(),
    provider: d.varchar({ length: 255 }).notNull(),
    providerAccountId: d.varchar({ length: 255 }).notNull(),
    refresh_token: d.text(),
    access_token: d.text(),
    expires_at: d.integer(),
    token_type: d.varchar({ length: 255 }),
    scope: d.varchar({ length: 255 }),
    id_token: d.text(),
    session_state: d.varchar({ length: 255 }),
  }),
  (t) => [
    primaryKey({ columns: [t.provider, t.providerAccountId] }),
    index("account_user_id_idx").on(t.userId),
  ],
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessions = createTable(
  "session",
  (d) => ({
    sessionToken: d.varchar({ length: 255 }).notNull().primaryKey(),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
  }),
  (t) => [index("t_user_id_idx").on(t.userId)],
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const verificationTokens = createTable(
  "verification_token",
  (d) => ({
    identifier: d.varchar({ length: 255 }).notNull(),
    token: d.varchar({ length: 255 }).notNull(),
    expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
  }),
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);
