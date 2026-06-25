import { z } from "zod";

// Single source of truth for income input — shared by the Convex mutation args
// (convex/income.ts, via the Zod function builders) and the client form
// (income-form.tsx, via safeParse). `amountMinor` is integer minor units; the
// form converts the user's typed major-unit amount before validating.
export const incomeFields = {
  platform: z.string().trim().min(1, "Enter a platform").max(80),
  amountMinor: z.number().int().nonnegative(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD"),
};

export const incomeSchema = z.object(incomeFields);

export type IncomeInput = z.infer<typeof incomeSchema>;
