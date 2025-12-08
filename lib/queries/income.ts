import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { IncomeEntry } from '@/lib/income';

const INCOME_QUERY_KEY = ['incomes'];
const INCOME_API_PATH = '/api/incomes';

const fetchIncomes = async () => {
  const response = await fetch(INCOME_API_PATH, {
    method: 'GET',
    cache: 'no-store',
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Unable to load income logs.');
  }
  return (await response.json()) as IncomeEntry[];
};

const submitIncome = async (input: {
  date: string;
  platform: string;
  amount: number;
}) => {
  const response = await fetch(INCOME_API_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    credentials: 'include',
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error('Could not save income entry.');
  }
  return (await response.json()) as IncomeEntry;
};

const updateIncome = async (input: {
  id: string;
  date: string;
  platform: string;
  amount: number;
}) => {
  const response = await fetch(INCOME_API_PATH, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    credentials: 'include',
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error('Could not update income entry.');
  }
  return (await response.json()) as IncomeEntry;
};

const deleteIncome = async (input: { id: string }) => {
  const response = await fetch(INCOME_API_PATH, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    credentials: 'include',
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error('Could not delete income entry.');
  }
  return (await response.json()) as { id: string };
};

export const useIncomeLogs = () =>
  useQuery({
    queryKey: INCOME_QUERY_KEY,
    queryFn: fetchIncomes,
  });

export const useAddIncome = () => {
  const queryClient = useQueryClient();

  return useMutation<
    IncomeEntry,
    Error,
    { date: string; platform: string; amount: number }
  >({
    mutationFn: (input) => submitIncome(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: INCOME_QUERY_KEY,
      });
    },
  });
};

export const useUpdateIncome = () => {
  const queryClient = useQueryClient();
  return useMutation<
    IncomeEntry,
    Error,
    { id: string; date: string; platform: string; amount: number }
  >({
    mutationFn: (input) => updateIncome(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: INCOME_QUERY_KEY,
      });
    },
  });
};

export const useDeleteIncome = () => {
  const queryClient = useQueryClient();
  return useMutation<{ id: string }, Error, { id: string }>({
    mutationFn: (input) => deleteIncome(input),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: INCOME_QUERY_KEY,
      });
    },
  });
};
