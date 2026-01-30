'use client';

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';

export type ToastTone =
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'accent'
  | 'neutral';

export type Toast = {
  id: string;
  message: string;
  tone: ToastTone;
  duration?: number;
  onUndo?: () => void;
  undoLabel?: string;
};

type ToastContextValue = {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  showSuccess: (
    message: string,
    options?: { onUndo?: () => void; undoLabel?: string },
  ) => string;
  showError: (message: string) => string;
  showInfo: (message: string) => string;
  showWarning: (message: string) => string;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION = 5000;
const UNDO_DURATION = 8000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeoutRefs = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );
  const toastIdRef = useRef(0);

  const removeToast = useCallback((id: string) => {
    const timeout = timeoutRefs.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutRefs.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: Omit<Toast, 'id'>): string => {
      const id = `toast-${++toastIdRef.current}`;
      const duration = toast.onUndo
        ? (toast.duration ?? UNDO_DURATION)
        : (toast.duration ?? DEFAULT_DURATION);

      setToasts((prev) => [...prev, { ...toast, id }]);

      if (duration > 0) {
        const timeout = setTimeout(() => {
          removeToast(id);
        }, duration);
        timeoutRefs.current.set(id, timeout);
      }

      return id;
    },
    [removeToast],
  );

  const showSuccess = useCallback(
    (
      message: string,
      options?: { onUndo?: () => void; undoLabel?: string },
    ): string =>
      addToast({
        message,
        tone: 'success',
        onUndo: options?.onUndo,
        undoLabel: options?.undoLabel,
      }),
    [addToast],
  );

  const showError = useCallback(
    (message: string): string => addToast({ message, tone: 'error' }),
    [addToast],
  );

  const showInfo = useCallback(
    (message: string): string => addToast({ message, tone: 'info' }),
    [addToast],
  );

  const showWarning = useCallback(
    (message: string): string => addToast({ message, tone: 'warning' }),
    [addToast],
  );

  const value = useMemo(
    () => ({
      toasts,
      addToast,
      removeToast,
      showSuccess,
      showError,
      showInfo,
      showWarning,
    }),
    [
      toasts,
      addToast,
      removeToast,
      showSuccess,
      showError,
      showInfo,
      showWarning,
    ],
  );

  return (
    <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) {
    return null;
  }

  const handleUndo = (toast: Toast) => {
    if (toast.onUndo) {
      toast.onUndo();
    }
    removeToast(toast.id);
  };

  return (
    <div className='pointer-events-none fixed inset-0 z-50 flex items-end justify-end p-4 sm:p-6'>
      <div className='flex flex-col items-end gap-3'>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className='toast toast-end pointer-events-auto animate-in slide-in-from-right'
          >
            <output
              aria-live='polite'
              className={`alert alert-${toast.tone} shadow-lg flex items-center gap-3`}
            >
              <span>{toast.message}</span>
              {toast.onUndo && (
                <button
                  type='button'
                  className='btn btn-sm btn-ghost'
                  onClick={() => handleUndo(toast)}
                >
                  {toast.undoLabel ?? 'Undo'}
                </button>
              )}
              <button
                type='button'
                className='btn btn-sm btn-ghost btn-square'
                onClick={() => removeToast(toast.id)}
                aria-label='Dismiss'
              >
                <span className='fa-solid fa-xmark' aria-hidden='true' />
              </button>
            </output>
          </div>
        ))}
      </div>
    </div>
  );
}
