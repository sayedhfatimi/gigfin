const currencyMetadata = {
  GBP: {
    label: 'Pound sterling',
    icon: 'fa-sterling-sign',
    locale: 'en-GB',
  },
  USD: {
    label: 'US dollar',
    icon: 'fa-dollar-sign',
    locale: 'en-US',
  },
  EUR: {
    label: 'Euro',
    icon: 'fa-euro-sign',
    locale: 'en-IE',
  },
} as const;

export type CurrencyCode = keyof typeof currencyMetadata;

export const DEFAULT_CURRENCY: CurrencyCode = 'GBP';

const currencyCodes = Object.keys(currencyMetadata) as CurrencyCode[];

export const currencyOptions = currencyCodes.map((value) => ({
  value,
  label: `${value} · ${currencyMetadata[value].label}`,
}));

export const getCurrencyIcon = (currency: CurrencyCode = DEFAULT_CURRENCY) =>
  currencyMetadata[currency].icon;

export const getCurrencyLocale = (currency: CurrencyCode = DEFAULT_CURRENCY) =>
  currencyMetadata[currency].locale;

export const resolveCurrency = (value: unknown): CurrencyCode => {
  if (typeof value !== 'string') {
    return DEFAULT_CURRENCY;
  }
  const normalized = value.toUpperCase() as CurrencyCode;
  return currencyCodes.includes(normalized) ? normalized : DEFAULT_CURRENCY;
};

export const formatCurrency = (
  value: number,
  currency: CurrencyCode = DEFAULT_CURRENCY,
) =>
  new Intl.NumberFormat(getCurrencyLocale(currency), {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value);
