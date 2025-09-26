import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import Toast from '../components/ui/Toast';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { supabase } from '../lib/supabaseClient';
import { useAppContext } from './AppContext';
import type { Notification } from '../types';

// Define types
export type ToastType = 'success' | 'error' | 'info';

export interface ToastProps {
  id: number;
  message: string;
  type: ToastType;
}

interface ConfirmDialogState {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loadingNotifications: boolean;
  addToast: (message: string, type?: ToastType) => void;
  showConfirm: (message: string, onConfirm: () => void) => void;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser } = useAppContext();
  const [toasts, setToasts] = useState<ToastProps[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    message: '',
    onConfirm: () => {},
    onCancel: () => {},
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!supabase || !currentUser) {
      setLoadingNotifications(false);
      setNotifications([]);
      return;
    }
    setLoadingNotifications(true);
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching notifications:", error);
      setNotifications([]);
    } else {
      setNotifications(data || []);
    }
    setLoadingNotifications(false);
  }, [currentUser]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // --- Real-time subscription for new notifications ---
  useEffect(() => {
    if (!supabase || !currentUser) return;

    const channel = supabase
      .channel(`public:notifications:user_id=eq.${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUser.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          // Add to state and show a toast
          setNotifications((prev) => [newNotification, ...prev]);
          addToast(newNotification.message, 'info');
        }
      )
      .subscribe();

    // Cleanup function
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser, supabase]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const addToast = (message: string, type: ToastType = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const showConfirm = (message: string, onConfirm: () => void) => {
    setConfirmDialog({
      isOpen: true,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
      onCancel: () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  const markNotificationAsRead = async (id: string) => {
    if (!supabase || !currentUser) return;
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, is_read: true } : n)));
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id).eq('user_id', currentUser.id);
    if (error) {
      addToast('Failed to mark notification as read.', 'error');
      fetchNotifications(); // Revert on error
    }
  };

  const markAllNotificationsAsRead = async () => {
    if (!supabase || !currentUser) return;
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('user_id', currentUser.id).eq('is_read', false);
    if (error) {
      addToast('Failed to mark all notifications as read.', 'error');
      fetchNotifications(); // Revert on error
    }
  };

  const value = {
    notifications,
    unreadCount,
    loadingNotifications,
    addToast,
    showConfirm,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    refreshNotifications: fetchNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {/* Toast container */}
      <div className="fixed top-5 right-5 z-50 w-full max-w-sm space-y-2">
        {toasts.map(toast => (
          <Toast key={toast.id} {...toast} onDismiss={() => removeToast(toast.id)} />
        ))}
      </div>
      {/* Confirm Dialog */}
      <ConfirmDialog {...confirmDialog} />
    </NotificationContext.Provider>
  );
};

export const useNotifier = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifier must be used within a NotificationProvider');
  }
  return context;
};
