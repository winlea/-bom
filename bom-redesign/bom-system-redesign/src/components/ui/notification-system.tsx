import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// 通知类型
export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'loading';

// 通知接口
export interface Notification {
  id: string;
  type: NotificationType;
  title?: string;
  message: string;
  duration?: number; // 毫秒，0表示不自动关闭
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean; // 是否可手动关闭
  persistent?: boolean; // 是否持久化（不自动关闭）
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

// 通知上下文
interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => string;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;
  showSuccess: (message: string, options?: Partial<Omit<Notification, 'id' | 'type' | 'message'>>) => string;
  showError: (message: string, options?: Partial<Omit<Notification, 'id' | 'type' | 'message'>>) => string;
  showWarning: (message: string, options?: Partial<Omit<Notification, 'id' | 'type' | 'message'>>) => string;
  showInfo: (message: string, options?: Partial<Omit<Notification, 'id' | 'type' | 'message'>>) => string;
  showLoading: (message: string, options?: Partial<Omit<Notification, 'id' | 'type' | 'message'>>) => string;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// 通知提供者组件
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const timeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});

  // 生成唯一ID
  const generateId = useCallback(() => {
    return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // 添加通知
  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = generateId();
    const newNotification: Notification = {
      id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      duration: notification.duration ?? (notification.type === 'loading' ? 0 : 5000),
      action: notification.action,
      dismissible: notification.dismissible ?? true,
      persistent: notification.persistent ?? notification.type === 'loading',
      position: notification.position ?? 'top-right',
    };

    setNotifications(prev => [...prev, newNotification]);

    // 设置自动关闭定时器
    if (newNotification.duration && newNotification.duration > 0 && !newNotification.persistent) {
      timeoutsRef.current[id] = setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  }, [generateId]);

  // 移除通知
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
    
    // 清除定时器
    if (timeoutsRef.current[id]) {
      clearTimeout(timeoutsRef.current[id]);
      delete timeoutsRef.current[id];
    }
  }, []);

  // 清除所有通知
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
    
    // 清除所有定时器
    Object.values(timeoutsRef.current).forEach(timeout => clearTimeout(timeout));
    timeoutsRef.current = {};
  }, []);

  // 便捷方法
  const showSuccess = useCallback((message: string, options = {}) => {
    return addNotification({ type: 'success', message, ...options });
  }, [addNotification]);

  const showError = useCallback((message: string, options = {}) => {
    return addNotification({ type: 'error', message, ...options });
  }, [addNotification]);

  const showWarning = useCallback((message: string, options = {}) => {
    return addNotification({ type: 'warning', message, ...options });
  }, [addNotification]);

  const showInfo = useCallback((message: string, options = {}) => {
    return addNotification({ type: 'info', message, ...options });
  }, [addNotification]);

  const showLoading = useCallback((message: string, options = {}) => {
    return addNotification({ type: 'loading', message, duration: 0, persistent: true, ...options });
  }, [addNotification]);

  // 清理定时器
  useEffect(() => {
    return () => {
      Object.values(timeoutsRef.current).forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  const value: NotificationContextType = {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
}

// 使用通知的Hook
export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}

// 通知图标映射
const iconMap = {
  success: <CheckCircle className="h-5 w-5 text-green-500" />,
  error: <AlertCircle className="h-5 w-5 text-red-500" />,
  warning: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
  info: <Info className="h-5 w-5 text-blue-500" />,
  loading: <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />,
};

// 通知容器组件
function NotificationContainer() {
  const { notifications } = useNotification();

  // 按位置分组通知
  const notificationsByPosition = notifications.reduce((acc, notification) => {
    const position = notification.position || 'top-right';
    if (!acc[position]) {
      acc[position] = [];
    }
    acc[position].push(notification);
    return acc;
  }, {} as Record<string, Notification[]>);

  // 位置样式映射
  const positionStyles = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2',
  };

  return (
    <>
      {Object.entries(notificationsByPosition).map(([position, positionNotifications]) => (
        <div
          key={position}
          className={cn(
            'fixed z-50 flex flex-col space-y-2 pointer-events-none',
            positionStyles[position as keyof typeof positionStyles]
          )}
        >
          {positionNotifications.map(notification => (
            <NotificationItem key={notification.id} notification={notification} />
          ))}
        </div>
      ))}
    </>
  );
}

// 单个通知项组件
function NotificationItem({ notification }: { notification: Notification }) {
  const { removeNotification } = useNotification();
  const [isLeaving, setIsLeaving] = useState(false);

  // 处理关闭
  const handleClose = useCallback(() => {
    setIsLeaving(true);
    setTimeout(() => {
      removeNotification(notification.id);
    }, 300); // 动画持续时间
  }, [notification.id, removeNotification]);

  // 处理操作点击
  const handleActionClick = useCallback(() => {
    if (notification.action) {
      notification.action.onClick();
      if (!notification.persistent) {
        handleClose();
      }
    }
  }, [notification.action, notification.persistent, handleClose]);

  // 通知样式
  const notificationStyles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    loading: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  return (
    <div
      className={cn(
        'pointer-events-auto max-w-sm w-full bg-white shadow-lg rounded-lg border border-slate-200 p-4 transition-all duration-300 transform',
        notificationStyles[notification.type],
        isLeaving ? 'opacity-0 scale-95 translate-x-full' : 'opacity-100 scale-100 translate-x-0'
      )}
    >
      <div className="flex">
        <div className="flex-shrink-0">
          {iconMap[notification.type]}
        </div>
        <div className="ml-3 flex-1">
          {notification.title && (
            <p className="text-sm font-medium">{notification.title}</p>
          )}
          <p className="text-sm mt-1">{notification.message}</p>
          {notification.action && (
            <div className="mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleActionClick}
                className="text-xs"
              >
                {notification.action.label}
              </Button>
            </div>
          )}
        </div>
        {notification.dismissible && (
          <div className="ml-4 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// 便捷的通知Hook
export function useNotifications() {
  const {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading,
    removeNotification,
  } = useNotification();

  return {
    success: showSuccess,
    error: showError,
    warning: showWarning,
    info: showInfo,
    loading: showLoading,
    remove: removeNotification,
  };
}

export default NotificationProvider;