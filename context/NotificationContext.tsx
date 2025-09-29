import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import Toast from '../components/ui/Toast';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { supabase } from '../lib/supabaseClient';
import { useAppContext } from './AppContext';
import type { Notification } from '../types';

// Define types
export type ToastType = 'success' | 'error' | 'info';
export type PermissionStatus = 'default' | 'granted' | 'denied';

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
  permissionStatus: PermissionStatus;
  addToast: (message: string, type?: ToastType) => void;
  showConfirm: (message: string, onConfirm: () => void) => void;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  requestNotificationPermission: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// IMPORTANT: Replace this with your actual VAPID public key from your push service.
// You can generate one using `npx web-push generate-vapid-keys`
const VAPID_PUBLIC_KEY = 'BC3Y85YCRqc6T3w3I4yqfK22Z6Qp7q-y0LhJ7aZ2pY6l3d1e0f9g8h7i6j5k4l3m2n1o0p9q8r7s6';


function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}


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
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('default');

  useEffect(() => {
    // Check for notification support and set initial permission status
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }
  }, []);

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
  
  const addToast = (message: string, type: ToastType = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };
  
  const saveSubscription = async (subscription: PushSubscription) => {
    if (!supabase || !currentUser) return;

    const { error } = await supabase.from('push_subscriptions').upsert({
        user_id: currentUser.id,
        subscription_object: subscription.toJSON()
    }, { onConflict: 'user_id' }); 

    if (error) {
        console.error('Error saving push subscription:', error);
    } else {
        console.log('Push subscription saved successfully.');
    }
  };
  
  const subscribeUserToPush = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !supabase || !currentUser) {
        return;
    }

    try {
        const registration = await navigator.serviceWorker.ready;
        const existingSubscription = await registration.pushManager.getSubscription();

        if (existingSubscription) {
            await saveSubscription(existingSubscription);
            return;
        }

        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });

        await saveSubscription(subscription);

    } catch (error) {
        console.error('Failed to subscribe the user: ', error);
        addToast('Failed to enable push notifications.', 'error');
    }
  }, [currentUser, supabase]);


  const requestNotificationPermission = async () => {
    const permissionResult = await Notification.requestPermission();
    setPermissionStatus(permissionResult);
    if (permissionResult === 'granted') {
        await subscribeUserToPush();
        addToast('Push notifications enabled!', 'success');
    } else {
        addToast('Push notifications were not enabled.', 'info');
    }
  };

  useEffect(() => {
    if (currentUser && permissionStatus === 'granted') {
        subscribeUserToPush();
    }
  }, [currentUser, permissionStatus, subscribeUserToPush]);


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
    permissionStatus,
    addToast,
    showConfirm,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    refreshNotifications: fetchNotifications,
    requestNotificationPermission,
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