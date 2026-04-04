// Toast Provider - 使用 Radix UI Toast
import * as Toast from '@radix-ui/react-toast';
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

// Toast 类型
export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastData {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

interface ToastContextValue {
  toast: (type: ToastType, title: string, description?: string) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// Toast 图标映射
const toastIcons: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

// Toast 样式类
const toastStyles: Record<ToastType, string> = {
  success: 'border-green-500 bg-green-50',
  error: 'border-red-500 bg-red-50',
  warning: 'border-yellow-500 bg-yellow-50',
  info: 'border-blue-500 bg-blue-50',
};

const iconStyles: Record<ToastType, string> = {
  success: 'text-green-600',
  error: 'text-red-600',
  warning: 'text-yellow-600',
  info: 'text-blue-600',
};

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((type: ToastType, title: string, description?: string) => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, type, title, description }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (type: ToastType, title: string, description?: string) => addToast(type, title, description),
    [addToast]
  );

  const success = useCallback(
    (title: string, description?: string) => addToast('success', title, description),
    [addToast]
  );

  const error = useCallback((title: string, description?: string) => addToast('error', title, description), [addToast]);

  const warning = useCallback(
    (title: string, description?: string) => addToast('warning', title, description),
    [addToast]
  );

  const info = useCallback((title: string, description?: string) => addToast('info', title, description), [addToast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info }}>
      <Toast.Provider swipeDirection="right">
        {children}

        {toasts.map((t) => {
          const Icon = toastIcons[t.type];
          return (
            <Toast.Root
              key={t.id}
              className={`
                flex items-start gap-3 p-4 rounded-lg border-l-4 shadow-lg
                bg-white ${toastStyles[t.type]}
                data-[state=open]:animate-slideIn
                data-[state=closed]:animate-hide
                data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]
                data-[swipe=cancel]:translate-x-0
                data-[swipe=end]:animate-swipeOut
              `}
              onOpenChange={(open) => !open && removeToast(t.id)}
              open={true}
            >
              <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${iconStyles[t.type]}`} />
              <div className="flex-1">
                <Toast.Title className="font-semibold text-gray-900">{t.title}</Toast.Title>
                {t.description && (
                  <Toast.Description className="text-sm text-gray-600 mt-1">{t.description}</Toast.Description>
                )}
              </div>
              <Toast.Close className="flex-shrink-0">
                <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </Toast.Close>
            </Toast.Root>
          );
        })}

        <Toast.Viewport className="fixed bottom-4 right-4 flex flex-col gap-2 w-96 max-w-[calc(100vw-2rem)] z-[100]" />
      </Toast.Provider>
    </ToastContext.Provider>
  );
}

// Hook 使用 Toast
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
