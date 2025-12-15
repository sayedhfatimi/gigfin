import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { user } from './auth-schema';
import { vehicleProfile } from './vehicle-profile-schema';

export const expense = sqliteTable(
  'expenses',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    expenseType: text('expense_type').notNull(),
    amountMinor: integer('amount_minor').notNull(),
    paidAt: text('paid_at').notNull(),
    vehicleProfileId: text('vehicle_profile_id').references(
      () => vehicleProfile.id,
    ),
    notes: text('notes'),
    unitRateMinor: integer('unit_rate_minor'),
    unitRateUnit: text('unit_rate_unit'),
    detailsJson: text('details_json'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('expenses_user_paid_at_idx').on(table.userId, table.paidAt),
    index('expenses_user_type_idx').on(table.userId, table.expenseType),
    index('expenses_vehicle_paid_at_idx').on(
      table.vehicleProfileId,
      table.paidAt,
    ),
  ],
);
