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

const MILES_PER_KM = 0.621371;

const ODOMETER_UNIT_LABEL: Record<OdometerUnit, string> = {
  km: 'km',
  miles: 'mi',
};

export const convertOdometerValue = (value: number, unit: OdometerUnit) =>
  unit === 'km' ? value : value * MILES_PER_KM;

export const formatOdometerReading = (
  value: number,
  unit: OdometerUnit = 'km',
) =>
  `${convertOdometerValue(value, unit).toFixed(2)} ${ODOMETER_UNIT_LABEL[unit]}`;

export const formatOdometerDistance = (
  distance: number,
  unit: OdometerUnit = 'km',
) =>
  `${convertOdometerValue(distance, unit).toFixed(2)} ${ODOMETER_UNIT_LABEL[unit]}`;
