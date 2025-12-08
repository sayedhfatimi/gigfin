import { relations } from 'drizzle-orm';

import { account, session, twoFactor, user, verification } from './auth-schema';
import { income } from './income-schema';

export { account, income, session, twoFactor, user, verification };

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  incomes: many(income),
  twoFactors: many(twoFactor),
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
