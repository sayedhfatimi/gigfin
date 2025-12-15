export const formatDateValue = (
  value: string | number | Date | null | undefined,
) => {
  if (value === null || value === undefined) {
    return '';
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof value === 'number') {
    return new Date(value).toISOString();
  }
  return value;
};

export const escapeCsvValue = (value: unknown) =>
  `"${String(value ?? '').replace(/"/g, '""')}"`;

export const formatMinorAmount = (value: number | null | undefined) =>
  value === null || value === undefined ? '' : (value / 100).toFixed(2);
