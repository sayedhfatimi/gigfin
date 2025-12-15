import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { ExpenseEntry, UnitRateUnit } from '@/lib/expenses';

const EXPENSES_QUERY_KEY = ['expenses'];
const EXPENSES_API_PATH = '/api/expenses';

export type ExpensePayload = {
  expenseType: string;
  amountMinor: number;
  paidAt: string;
  notes?: string | null;
  vehicleProfileId?: string | null;
  unitRateMinor?: number | null;
  unitRateUnit?: UnitRateUnit | null;
  detailsJson?: string | null;
};

const fetchExpenses = async () => {
  const response = await fetch(EXPENSES_API_PATH, {
    method: 'GET',
    cache: 'no-store',
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Unable to load expenses.');
  }
  return (await response.json()) as ExpenseEntry[];
};

const submitExpense = async (input: ExpensePayload) => {
  const response = await fetch(EXPENSES_API_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    credentials: 'include',
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error('Could not save expense.');
  }
  return (await response.json()) as ExpenseEntry;
};

const updateExpense = async (input: ExpensePayload & { id: string }) => {
  const response = await fetch(EXPENSES_API_PATH, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    credentials: 'include',
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error('Could not update expense.');
  }
  return (await response.json()) as ExpenseEntry;
};

const deleteExpense = async (input: { id: string }) => {
  const response = await fetch(EXPENSES_API_PATH, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    credentials: 'include',
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error('Could not delete expense.');
  }
  return (await response.json()) as { id: string };
};

export const useExpenseLogs = () =>
  useQuery({
    queryKey: EXPENSES_QUERY_KEY,
    queryFn: fetchExpenses,
  });

export const useAddExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ExpensePayload) => submitExpense(input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: EXPENSES_QUERY_KEY }),
  });
};

export const useUpdateExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ExpensePayload & { id: string }) =>
      updateExpense(input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: EXPENSES_QUERY_KEY }),
  });
};

export const useDeleteExpense = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id: string }) => deleteExpense(input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: EXPENSES_QUERY_KEY }),
  });
};
