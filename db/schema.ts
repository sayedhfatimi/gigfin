import { relations } from 'drizzle-orm';

import { account, session, twoFactor, user, verification } from './auth-schema';
import { chargingVendor } from './charging-vendor-schema';
import { expense } from './expense-schema';
import { income } from './income-schema';
import { vehicleProfile } from './vehicle-profile-schema';

export {
  account,
  expense,
  income,
  session,
  twoFactor,
  user,
  verification,
  vehicleProfile,
  chargingVendor,
};

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  incomes: many(income),
  twoFactors: many(twoFactor),
  vehicleProfiles: many(vehicleProfile),
  expenses: many(expense),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const twoFactorRelations = relations(twoFactor, ({ one }) => ({
  user: one(user, {
    fields: [twoFactor.userId],
    references: [user.id],
  }),
}));

export const vehicleProfileRelations = relations(vehicleProfile, ({ one }) => ({
  user: one(user, {
    fields: [vehicleProfile.userId],
    references: [user.id],
  }),
}));

export const expenseRelations = relations(expense, ({ one }) => ({
  user: one(user, {
    fields: [expense.userId],
    references: [user.id],
  }),
  vehicleProfile: one(vehicleProfile, {
    fields: [expense.vehicleProfileId],
    references: [vehicleProfile.id],
  }),
}));

export const chargingVendorRelations = relations(chargingVendor, ({ one }) => ({
  user: one(user, {
    fields: [chargingVendor.userId],
    references: [user.id],
  }),
}));
