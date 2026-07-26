import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, X } from 'lucide-react';

export type ToastVariant = 'success' | 'warning' | 'danger';

export interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
  duration?: number;
}

interface ToastContextType {
  toast: (message: string, options?: { variant?: ToastVariant; duration?: number }) => void;
  removeToast: (id: string) => void;
  toasts: ToastItem[];
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, options?: { variant?: ToastVariant; duration?: number }) => {
      const id = Math.random().toString(36).substring(2, 9);
      const variant = options?.variant || 'success';
      const duration = options?.duration ?? 4000;

      setToasts((prev) => [...prev, { id, message, variant, duration }]);
    },
    []
  );

  return (
    <ToastContext.Provider value={{ toast, removeToast, toasts }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

interface ToastContainerProps {
  toasts: ToastItem[];
  removeToast: (id: string) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
  return (
    <div
      className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
      role="region"
      aria-live="assertive"
      aria-label="Notifications"
    >
      {toasts.map((item) => (
        <Toast key={item.id} item={item} onClose={() => removeToast(item.id)} />
      ))}
    </div>
  );
};

interface ToastProps {
  item: ToastItem;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ item, onClose }) => {
  const { message, variant, duration } = item;

  useEffect(() => {
    if (!duration || duration === Infinity) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getVariantStyles = (type: ToastVariant) => {
    switch (type) {
      case 'success':
        return {
          container:
            'bg-emerald-50 border-emerald-150 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-900/50 dark:text-emerald-300',
          iconColor: 'text-emerald-500 dark:text-emerald-400',
          Icon: CheckCircle2,
        };
      case 'warning':
        return {
          container:
            'bg-amber-50 border-amber-150 text-amber-900 dark:bg-amber-950/40 dark:border-amber-900/50 dark:text-amber-300',
          iconColor: 'text-amber-500 dark:text-amber-400',
          Icon: AlertTriangle,
        };
      case 'danger':
        return {
          container:
            'bg-rose-50 border-rose-150 text-rose-900 dark:bg-rose-950/40 dark:border-rose-900/50 dark:text-rose-300',
          iconColor: 'text-rose-500 dark:text-rose-400',
          Icon: AlertCircle,
        };
      default:
        return {
          container:
            'bg-slate-50 border-slate-150 text-slate-900 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-200',
          iconColor: 'text-slate-500',
          Icon: CheckCircle2,
        };
    }
  };

  const styles = getVariantStyles(variant);
  const ToastIcon = styles.Icon;

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-xl backdrop-blur-[2px] transition-all duration-300 animate-in slide-in-from-right-5 ${styles.container}`}
      role="status"
    >
      <div className="shrink-0 pt-0.5">
        <ToastIcon className={`w-4 h-4 ${styles.iconColor}`} />
      </div>
      <div className="flex-1 min-w-0 text-xs font-medium leading-relaxed break-words">
        {message}
      </div>
      <button
        onClick={onClose}
        className="shrink-0 p-0.5 rounded-lg opacity-50 hover:opacity-100 transition-opacity hover:bg-black/5 dark:hover:bg-white/10"
        aria-label="Close notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
