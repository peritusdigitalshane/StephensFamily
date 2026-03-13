'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  exiting?: boolean;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const MAX_TOASTS = 3;
const AUTO_DISMISS_MS = 4000;
const EXIT_ANIMATION_MS = 350;

const ICON_MAP: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const COLOR_MAP: Record<ToastType, { bg: string; icon: string; bar: string; border: string }> = {
  success: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    icon: 'text-emerald-500',
    bar: 'bg-emerald-500',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-950/40',
    icon: 'text-red-500',
    bar: 'bg-red-500',
    border: 'border-red-200 dark:border-red-800',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    icon: 'text-blue-500',
    bar: 'bg-blue-500',
    border: 'border-blue-200 dark:border-blue-800',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    icon: 'text-amber-500',
    bar: 'bg-amber-500',
    border: 'border-amber-200 dark:border-amber-800',
  },
};

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}

/* ------------------------------------------------------------------ */
/*  Single Toast                                                       */
/* ------------------------------------------------------------------ */

function ToastCard({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const colors = COLOR_MAP[item.type];
  const Icon = ICON_MAP[item.type];

  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        'pointer-events-auto relative w-80 overflow-hidden rounded-xl border shadow-lg',
        'backdrop-blur-md transition-all duration-300',
        colors.bg,
        colors.border,
        item.exiting
          ? 'translate-x-[120%] opacity-0'
          : 'translate-x-0 opacity-100 animate-[slideInRight_0.3s_ease-out]',
      ].join(' ')}
    >
      {/* Content */}
      <div className="flex items-start gap-3 px-4 py-3">
        <Icon size={20} className={`mt-0.5 shrink-0 ${colors.icon}`} />
        <p className="flex-1 text-sm font-medium text-[var(--foreground)] leading-snug">
          {item.message}
        </p>
        <button
          onClick={() => onDismiss(item.id)}
          className="shrink-0 rounded-lg p-1 text-[var(--text-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)] transition-colors"
          aria-label="Dismiss notification"
        >
          <X size={14} />
        </button>
      </div>

      {/* Progress bar */}
      {!item.exiting && (
        <div className="h-[3px] w-full bg-[var(--border)]">
          <div
            className={`h-full ${colors.bar} rounded-full`}
            style={{
              animation: `shrinkBar ${AUTO_DISMISS_MS}ms linear forwards`,
            }}
          />
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  /* Schedule auto-dismiss */
  const scheduleDismiss = useCallback((id: string) => {
    const timer = setTimeout(() => {
      // Start exit animation
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)),
      );
      // Remove after animation completes
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
        timersRef.current.delete(id);
      }, EXIT_ANIMATION_MS);
    }, AUTO_DISMISS_MS);
    timersRef.current.set(id, timer);
  }, []);

  /* Dismiss a toast immediately (with exit animation) */
  const dismiss = useCallback((id: string) => {
    const existing = timersRef.current.get(id);
    if (existing) clearTimeout(existing);
    timersRef.current.delete(id);

    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)),
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, EXIT_ANIMATION_MS);
  }, []);

  /* Public toast function */
  const toast = useCallback(
    (message: string, type: ToastType = 'info') => {
      const id = crypto.randomUUID();
      const newToast: ToastItem = { id, type, message };

      setToasts((prev) => {
        let next = [...prev, newToast];
        // Evict oldest if over max
        while (next.filter((t) => !t.exiting).length > MAX_TOASTS) {
          const oldest = next.find((t) => !t.exiting);
          if (oldest) {
            const timer = timersRef.current.get(oldest.id);
            if (timer) clearTimeout(timer);
            timersRef.current.delete(oldest.id);
            next = next.filter((t) => t.id !== oldest.id);
          } else break;
        }
        return next;
      });

      scheduleDismiss(id);
    },
    [scheduleDismiss],
  );

  /* Cleanup on unmount */
  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Toast container */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-4 right-4 z-[9999] flex flex-col-reverse gap-3"
      >
        {toasts.map((item) => (
          <ToastCard key={item.id} item={item} onDismiss={dismiss} />
        ))}
      </div>

      {/* Keyframe styles */}
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(120%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes shrinkBar {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </ToastContext.Provider>
  );
}
