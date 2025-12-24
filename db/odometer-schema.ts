import { sql } from 'drizzle-orm';
import {
  index,
  integer,
  real,
  sqliteTable,
  text,
} from 'drizzle-orm/sqlite-core';

import { user } from './auth-schema';
import { vehicleProfile } from './vehicle-profile-schema';

export const odometer = sqliteTable(
  'odometers',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    date: text('date').notNull(),
    startReading: real('start_reading').notNull(),
    endReading: real('end_reading').notNull(),
    vehicleProfileId: text('vehicle_profile_id').references(
      () => vehicleProfile.id,
    ),
    notes: text('notes'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('odometers_user_date_idx').on(table.userId, table.date),
    index('odometers_vehicle_date_idx').on(table.vehicleProfileId, table.date),
  ],
);
