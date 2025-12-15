export type VehicleType = 'EV' | 'PETROL' | 'DIESEL' | 'HYBRID';

export type VehicleProfile = {
  id: string;
  userId: string;
  label: string;
  vehicleType: VehicleType;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export const vehicleTypeOptions: { value: VehicleType; label: string }[] = [
  { value: 'EV', label: 'Electric (EV)' },
  { value: 'PETROL', label: 'Petrol' },
  { value: 'DIESEL', label: 'Diesel' },
  { value: 'HYBRID', label: 'Hybrid' },
];
