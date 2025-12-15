import type { VehicleType } from './vehicle';

export type UnitRateUnit = 'kwh' | 'litre' | 'gallon_us' | 'gallon_imp';

export type ExpenseVehicle = {
  id: string;
  label?: string;
  vehicleType?: VehicleType;
};

export type ExpenseEntry = {
  id: string;
  userId: string;
  expenseType: string;
  amountMinor: number;
  paidAt: string;
  unitRateMinor: number | null;
  unitRateUnit: UnitRateUnit | null;
  notes: string | null;
  vehicleProfileId: string | null;
  vehicle: ExpenseVehicle | null;
  detailsJson: string | null;
  createdAt: string;
  updatedAt: string;
};

export const expenseTypeOptions = [
  { value: 'fuel_charging', label: 'Fuel / Charging' },
  { value: 'maintenance', label: 'Maintenance / Servicing' },
  { value: 'repairs', label: 'Repairs' },
  { value: 'tyres', label: 'Tyres' },
  { value: 'cleaning', label: 'Cleaning / Car wash' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'road_tax', label: 'Road tax / registration' },
  { value: 'mot', label: 'MOT / inspections' },
  { value: 'parking', label: 'Parking (paid)' },
  { value: 'tolls', label: 'Tolls / bridges / ferries' },
  { value: 'congestion', label: 'Congestion / clean-air charges' },
  { value: 'phone', label: 'Phone / data' },
  {
    value: 'equipment',
    label: 'Equipment (mounts, cables, power banks, bags)',
  },
  {
    value: 'platform_fees',
    label: 'Platform fees / subscriptions / cashout fees',
  },
  { value: 'fines', label: 'Fines / penalties' },
  { value: 'finance', label: 'Finance / lease / loan interest' },
  { value: 'depreciation', label: 'Depreciation / vehicle purchase' },
];
