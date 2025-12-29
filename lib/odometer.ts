export type OdometerEntry = {
  id: string;
  userId: string;
  date: string;
  startReading: number;
  endReading: number;
  vehicleProfileId: string | null;
  createdAt: string;
  updatedAt: string;
  vehicle?: {
    id: string;
    label?: string;
    vehicleType?: string;
  } | null;
};

export const getOdometerDistance = (entry: OdometerEntry) =>
  entry.endReading - entry.startReading;

export type OdometerUnit = 'km' | 'miles';

const ODOMETER_UNIT_LABEL: Record<OdometerUnit, string> = {
  km: 'km',
  miles: 'mi',
};

export const formatOdometerReading = (
  value: number,
  unit: OdometerUnit = 'km',
) => `${value.toFixed(2)} ${ODOMETER_UNIT_LABEL[unit]}`;

export const formatOdometerDistance = (
  distance: number,
  unit: OdometerUnit = 'km',
) => `${distance.toFixed(2)} ${ODOMETER_UNIT_LABEL[unit]}`;
