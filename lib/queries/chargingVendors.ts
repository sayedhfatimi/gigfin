import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { ChargingVendor } from '@/lib/charging-vendor';
import type { UnitRateUnit } from '@/lib/expenses';

const CHARGING_VENDOR_QUERY_KEY = ['charging-vendors'];
const CHARGING_VENDOR_API_PATH = '/api/charging-vendors';

type ChargingVendorPayload = {
  label: string;
  unitRateMinor: number;
  unitRateUnit: UnitRateUnit;
};

const fetchChargingVendors = async () => {
  const response = await fetch(CHARGING_VENDOR_API_PATH, {
    method: 'GET',
    cache: 'no-store',
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Unable to load charging vendors.');
  }
  return (await response.json()) as ChargingVendor[];
};

const createChargingVendor = async (input: ChargingVendorPayload) => {
  const response = await fetch(CHARGING_VENDOR_API_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    credentials: 'include',
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error('Could not create charging vendor.');
  }
  return (await response.json()) as ChargingVendor;
};

const updateChargingVendor = async (
  input: ChargingVendorPayload & { id: string },
) => {
  const response = await fetch(CHARGING_VENDOR_API_PATH, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    credentials: 'include',
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error('Could not update charging vendor.');
  }
  return (await response.json()) as ChargingVendor;
};

const deleteChargingVendor = async (input: { id: string }) => {
  const response = await fetch(CHARGING_VENDOR_API_PATH, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    credentials: 'include',
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error('Could not delete charging vendor.');
  }
  return (await response.json()) as { id: string };
};

export const useChargingVendors = () =>
  useQuery({
    queryKey: CHARGING_VENDOR_QUERY_KEY,
    queryFn: fetchChargingVendors,
  });

export const useCreateChargingVendor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ChargingVendorPayload) => createChargingVendor(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHARGING_VENDOR_QUERY_KEY });
    },
  });
};

export const useUpdateChargingVendor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ChargingVendorPayload & { id: string }) =>
      updateChargingVendor(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHARGING_VENDOR_QUERY_KEY });
    },
  });
};

export const useDeleteChargingVendor = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string }) => deleteChargingVendor(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHARGING_VENDOR_QUERY_KEY });
    },
  });
};
