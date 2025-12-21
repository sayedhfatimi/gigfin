'use client';

type StatusAlertsProps = {
  message?: string;
  error?: string;
};

export function StatusAlerts({ message, error }: StatusAlertsProps) {
  if (!message && !error) {
    return null;
  }

  return (
    <>
      {message && (
        <p className='text-sm font-semibold uppercase text-success'>
          {message}
        </p>
      )}
      {error && (
        <p className='text-sm font-semibold uppercase text-error'>{error}</p>
      )}
    </>
  );
}
