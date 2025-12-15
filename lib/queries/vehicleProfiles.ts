import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { VehicleProfile, VehicleType } from '@/lib/vehicle';

const VEHICLE_PROFILE_QUERY_KEY = ['vehicle-profiles'];
const VEHICLE_PROFILE_API_PATH = '/api/vehicle-profiles';

const fetchVehicleProfiles = async () => {
  const response = await fetch(VEHICLE_PROFILE_API_PATH, {
    method: 'GET',
    cache: 'no-store',
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Unable to load vehicle profiles.');
  }
  return (await response.json()) as VehicleProfile[];
};

const createVehicleProfile = async (input: {
  label: string;
  vehicleType: VehicleType;
  isDefault?: boolean;
}) => {
  const response = await fetch(VEHICLE_PROFILE_API_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    credentials: 'include',
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error('Could not create vehicle profile.');
  }
  return (await response.json()) as VehicleProfile;
};

const updateVehicleProfile = async (input: {
  id: string;
  label: string;
  vehicleType: VehicleType;
  isDefault?: boolean;
}) => {
  const response = await fetch(VEHICLE_PROFILE_API_PATH, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    credentials: 'include',
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error('Could not update vehicle profile.');
  }
  return (await response.json()) as VehicleProfile;
};

const deleteVehicleProfile = async (input: { id: string }) => {
  const response = await fetch(VEHICLE_PROFILE_API_PATH, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    credentials: 'include',
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error('Could not delete vehicle profile.');
  }
  return (await response.json()) as { id: string };
};

export const useVehicleProfiles = () =>
  useQuery({
    queryKey: VEHICLE_PROFILE_QUERY_KEY,
    queryFn: fetchVehicleProfiles,
  });

export const useCreateVehicleProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      label: string;
      vehicleType: VehicleType;
      isDefault?: boolean;
    }) => createVehicleProfile(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VEHICLE_PROFILE_QUERY_KEY });
    },
  });
};

export const useUpdateVehicleProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      id: string;
      label: string;
      vehicleType: VehicleType;
      isDefault?: boolean;
    }) => updateVehicleProfile(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VEHICLE_PROFILE_QUERY_KEY });
    },
  });
};

export const useDeleteVehicleProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string }) => deleteVehicleProfile(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VEHICLE_PROFILE_QUERY_KEY });
    },
  });
};
