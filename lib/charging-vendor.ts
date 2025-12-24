import type { UnitRateUnit } from './expenses';

export type ChargingVendor = {
  id: string;
  userId: string;
  label: string;
  unitRateMinor: number;
  unitRateUnit: UnitRateUnit;
  createdAt: string;
  updatedAt: string;
};
