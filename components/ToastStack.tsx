'use client';

export type ToastTone =
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'accent'
  | 'neutral';

export type ToastMessage = {
  type: ToastTone;
  text: string;
};

type ToastStackProps = {
  pendingMessage?: string;
  pendingTone?: ToastTone;
  statusMessage?: ToastMessage | null;
  className?: string;
};

const getContainerClass = (className?: string) =>
  [
    'pointer-events-none fixed inset-0 z-50 flex items-end justify-end p-4 sm:p-6',
    className,
  ]
    .filter(Boolean)
    .join(' ');

const renderToast = (text: string, tone: ToastTone) => (
  <div className='toast toast-end pointer-events-auto' key={`${tone}-${text}`}>
    <output aria-live='polite' className={`alert alert-${tone} shadow-lg`}>
      <span>{text}</span>
    </output>
  </div>
);

export function ToastStack({
  pendingMessage,
  pendingTone = 'info',
  statusMessage,
  className,
}: ToastStackProps) {
  if (!pendingMessage && !statusMessage) {
    return null;
  }

  return (
    <div className={getContainerClass(className)}>
      <div className='flex flex-col items-end gap-3'>
        {pendingMessage && renderToast(pendingMessage, pendingTone)}
        {statusMessage && renderToast(statusMessage.text, statusMessage.type)}
      </div>
    </div>
  );
}
