export type IncomeEntry = {
  id: string;
  userId: string;
  platform: string;
  amount: number;
  date: string;
  createdAt: string;
};

export type DailyIncomeSummary = {
  date: string;
  total: number;
  entries: IncomeEntry[];
  breakdown: {
    platform: string;
    amount: number;
  }[];
};

const sumByPlatform = (entries: IncomeEntry[]) => {
  const aggregator = new Map<string, number>();
  entries.forEach((entry) => {
    const current = aggregator.get(entry.platform) ?? 0;
    aggregator.set(entry.platform, current + entry.amount);
  });
  return Array.from(aggregator.entries()).map(([platform, amount]) => ({
    platform,
    amount,
  }));
};

export const aggregateDailyIncomes = (
  entries: IncomeEntry[],
): DailyIncomeSummary[] => {
  const byDay = new Map<string, IncomeEntry[]>();
  entries.forEach((entry) => {
    const day = entry.date;
    const bucket = byDay.get(day) ?? [];
    byDay.set(day, [...bucket, entry]);
  });
  return Array.from(byDay.entries())
    .map(([date, rows]) => {
      const breakdown = sumByPlatform(rows);
      const total = rows.reduce((acc, curr) => acc + curr.amount, 0);
      return {
        date,
        entries: rows,
        total,
        breakdown,
      };
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));
};

export const getPlatformDistribution = (entries: IncomeEntry[]) => {
  const breakdown = sumByPlatform(entries);
  const total = breakdown.reduce((acc, row) => acc + row.amount, 0);
  return breakdown
    .map((row) => ({
      ...row,
      percentage: total ? row.amount / total : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
};

export const formatCurrency = (value: number) =>
  Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 2,
  }).format(value);

const monthFormatter = new Intl.DateTimeFormat('en-GB', {
  month: 'short',
  year: 'numeric',
});
const monthShortFormatter = new Intl.DateTimeFormat('en-GB', {
  month: 'short',
});

export type MonthlyIncomeSummary = {
  label: string;
  year: number;
  month: number;
  total: number;
};

export const getEntryMonth = (entry: IncomeEntry) => {
  const date = new Date(entry.date);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return {
    year: date.getFullYear(),
    month: date.getMonth(),
  };
};

export const getCurrentMonthEntries = (
  entries: IncomeEntry[],
  reference = new Date(),
) => {
  const refYear = reference.getFullYear();
  const refMonth = reference.getMonth();
  return entries.filter((entry) => {
    const parsed = getEntryMonth(entry);
    if (!parsed) {
      return false;
    }
    return parsed.year === refYear && parsed.month === refMonth;
  });
};

export const getMonthlyTotals = (
  entries: IncomeEntry[],
  months = 6,
  reference = new Date(),
): MonthlyIncomeSummary[] => {
  const totals = new Map<string, number>();
  entries.forEach((entry) => {
    const parsed = getEntryMonth(entry);
    if (!parsed) {
      return;
    }
    const key = `${parsed.year}-${parsed.month}`;
    totals.set(key, (totals.get(key) ?? 0) + entry.amount);
  });

  const result: MonthlyIncomeSummary[] = [];
  for (let offset = 0; offset < months; offset += 1) {
    const date = new Date(
      reference.getFullYear(),
      reference.getMonth() - offset,
      1,
    );
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    result.push({
      label: monthFormatter.format(date),
      year: date.getFullYear(),
      month: date.getMonth(),
      total: totals.get(key) ?? 0,
    });
  }
  return result;
};

export const getYearlyMonthlyTotals = (
  entries: IncomeEntry[],
  reference = new Date(),
): MonthlyIncomeSummary[] => {
  const year = reference.getFullYear();
  const totals = new Map<number, number>();
  entries.forEach((entry) => {
    const parsed = getEntryMonth(entry);
    if (!parsed || parsed.year !== year) {
      return;
    }
    totals.set(parsed.month, (totals.get(parsed.month) ?? 0) + entry.amount);
  });

  const result: MonthlyIncomeSummary[] = [];
  for (let month = 0; month < 12; month += 1) {
    const date = new Date(year, month, 1);
    result.push({
      label: monthFormatter.format(date),
      year,
      month,
      total: totals.get(month) ?? 0,
    });
  }
  return result;
};

export const formatMonthLabel = (year: number, month: number) =>
  monthFormatter.format(new Date(year, month, 1));

export const formatMonthShortLabel = (year: number, month: number) =>
  monthShortFormatter.format(new Date(year, month, 1));

export type MonthOption = {
  key: string;
  label: string;
  year: number;
  month: number;
};

export const getMonthOptions = (
  entries: IncomeEntry[],
  span = 12,
  reference = new Date(),
): MonthOption[] => {
  const map = new Map<string, MonthOption>();
  const addOption = (year: number, month: number) => {
    const key = `${year}-${month}`;
    if (map.has(key)) {
      return;
    }
    map.set(key, {
      key,
      label: formatMonthLabel(year, month),
      year,
      month,
    });
  };
  entries.forEach((entry) => {
    const parsed = getEntryMonth(entry);
    if (!parsed) {
      return;
    }
    addOption(parsed.year, parsed.month);
  });
  for (let offset = 0; offset < span; offset += 1) {
    const date = new Date(
      reference.getFullYear(),
      reference.getMonth() - offset,
      1,
    );
    addOption(date.getFullYear(), date.getMonth());
  }
  return Array.from(map.values()).sort((a, b) => {
    if (a.year !== b.year) {
      return b.year - a.year;
    }
    return b.month - a.month;
  });
};
