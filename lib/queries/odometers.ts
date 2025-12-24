import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { OdometerEntry } from '@/lib/odometer';

const ODOMETERS_QUERY_KEY = ['odometers'];
const ODOMETERS_API_PATH = '/api/odometers';

export type OdometerPayload = {
  date: string;
  startReading: number;
  endReading: number;
  vehicleProfileId?: string | null;
};

const fetchOdometers = async () => {
  const response = await fetch(ODOMETERS_API_PATH, {
    method: 'GET',
    cache: 'no-store',
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Unable to load odometer logs.');
  }
  return (await response.json()) as OdometerEntry[];
};

const submitOdometer = async (input: OdometerPayload) => {
  const response = await fetch(ODOMETERS_API_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    credentials: 'include',
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error('Could not save odometer entry.');
  }
  return (await response.json()) as OdometerEntry;
};

const updateOdometer = async (input: OdometerPayload & { id: string }) => {
  const response = await fetch(ODOMETERS_API_PATH, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    credentials: 'include',
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error('Could not update odometer entry.');
  }
  return (await response.json()) as OdometerEntry;
};

const deleteOdometer = async (input: { id: string }) => {
  const response = await fetch(ODOMETERS_API_PATH, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    credentials: 'include',
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error('Could not delete odometer entry.');
  }
  return (await response.json()) as { id: string };
};

export const useOdometerLogs = () =>
  useQuery({
    queryKey: ODOMETERS_QUERY_KEY,
    queryFn: fetchOdometers,
  });

export const useAddOdometer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: OdometerPayload) => submitOdometer(input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ODOMETERS_QUERY_KEY }),
  });
};

export const useUpdateOdometer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: OdometerPayload & { id: string }) =>
      updateOdometer(input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ODOMETERS_QUERY_KEY }),
  });
};

export const useDeleteOdometer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string }) => deleteOdometer(input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ODOMETERS_QUERY_KEY }),
  });
};
