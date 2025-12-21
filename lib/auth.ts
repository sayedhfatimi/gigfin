import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { twoFactor as twoFactorPlugin } from 'better-auth/plugins/two-factor';
import { db } from '@/db';
import {
  account,
  income,
  session,
  twoFactor,
  user,
  verification,
} from '@/db/schema';

export const auth = betterAuth({
  appName: 'GigFin',
  database: drizzleAdapter(db, {
    provider: 'sqlite',
    schema: { account, income, session, user, verification, twoFactor },
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [twoFactorPlugin({ issuer: 'GigFin' })],
  advanced: {
    ipAddress: {
      ipAddressHeaders: ['cf-connecting-ip'],
    },
  },
  user: {
    additionalFields: {
      currency: {
        type: 'string',
        input: true,
        output: true,
        defaultValue: 'GBP',
      },
      unitSystem: {
        type: 'string',
        input: true,
        output: true,
        defaultValue: 'metric',
      },
      volumeUnit: {
        type: 'string',
        input: true,
        output: true,
        defaultValue: 'litre',
      },
    },
  },
});
