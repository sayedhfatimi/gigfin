import { authedMutationV } from "./lib/functions";

const PLATFORMS = ["Uber Eats", "Deliveroo", "Just Eat", "Amazon Flex"];

const SAMPLE_EXPENSES = [
  ["fuel_charging", 1840],
  ["insurance", 6200],
  ["phone", 1500],
  ["cleaning", 900],
  ["tyres", 8400],
  ["road_tax", 2000],
  ["platform_fees", 3200],
] as const;

// Populate the current user's account with a few weeks of realistic sample
// data (for the gigfin.me demo and for new users exploring the app).
export const loadSample = authedMutationV({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const iso = (daysAgo: number) =>
      new Date(now - daysAgo * 86_400_000).toISOString().slice(0, 10);

    const vehicleId = await ctx.db.insert("vehicles", {
      userId: ctx.userId,
      label: "Sample EV",
      vehicleType: "EV",
      isDefault: true,
      createdAt: now,
      updatedAt: now,
    });

    for (let i = 0; i < 21; i++) {
      // skip ~2 days a week to look natural
      if (i % 7 === 5 || i % 7 === 6) continue;
      await ctx.db.insert("income", {
        userId: ctx.userId,
        platform: PLATFORMS[i % PLATFORMS.length],
        amountMinor: 3200 + ((i * 173) % 5200),
        date: iso(i),
        createdAt: now,
      });
      await ctx.db.insert("shifts", {
        userId: ctx.userId,
        date: iso(i),
        startMinutes: 600,
        endMinutes: 1020,
        durationMin: 420,
        platform: PLATFORMS[i % PLATFORMS.length],
        vehicleId,
        createdAt: now,
        updatedAt: now,
      });
    }

    for (let i = 0; i < SAMPLE_EXPENSES.length; i++) {
      const [expenseType, amountMinor] = SAMPLE_EXPENSES[i];
      await ctx.db.insert("expenses", {
        userId: ctx.userId,
        expenseType,
        amountMinor,
        date: iso(i * 3),
        vehicleId,
        createdAt: now,
        updatedAt: now,
      });
    }

    for (let i = 0; i < 6; i++) {
      const start = 18_400 + i * 80;
      await ctx.db.insert("odometers", {
        userId: ctx.userId,
        date: iso(i * 2),
        startReading: start,
        endReading: start + 60 + i * 4,
        vehicleId,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});
