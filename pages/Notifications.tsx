import React from 'react';
// FIX: Use wildcard import for react-router-dom to resolve module export errors.
import * as ReactRouterDOM from 'react-router-dom';
const { useNavigate } = ReactRouterDOM;
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useNotifier } from '../context/NotificationContext';
import { BellIcon, CheckDoubleIcon, UserIcon, ClipboardListIcon, CoinIcon, ChatIcon } from '../components/ui/Icons';
import type { Notification } from '../types';

const Notifications: React.FC = () => {
    const { 
        notifications, 
        loadingNotifications, 
        markNotificationAsRead, 
        markAllNotificationsAsRead,
        unreadCount
    } = useNotifier();
    const navigate = useNavigate();

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.is_read) {
            markNotificationAsRead(notification.id);
        }
        if (notification.link) {
            navigate(notification.link);
        }
    };
    
    const getNotificationIcon = (type: Notification['type']) => {
      const iconClass = "w-5 h-5 text-white";
      const containerClass = "w-10 h-10 rounded-full flex items-center justify-center";
      switch (type) {
        case 'new_user': return <div className={`${containerClass} bg-blue-500`}><UserIcon className={iconClass} /></div>;
        case 'task_assigned':
        case 'task_completed': return <div className={`${containerClass} bg-purple-500`}><ClipboardListIcon className={iconClass} /></div>;
        case 'coin_approved': return <div className={`${containerClass} bg-yellow-500`}><CoinIcon className={iconClass} /></div>;
        case 'new_message': return <div className={`${containerClass} bg-green-500`}><ChatIcon className={iconClass} /></div>;
        default: return <div className={`${containerClass} bg-gray-500`}><BellIcon className={iconClass} /></div>;
      }
    };

    const timeAgo = (dateString: string) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      const now = new Date();
      const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      
      if (seconds < 5) return "just now";
      if (seconds < 60) return `${seconds} seconds ago`;

      const minutes = Math.floor(seconds / 60);
      if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
      
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;

      const days = Math.floor(hours / 24);
      if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;
      
      const months = Math.floor(days / 30);
      if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;

      const years = Math.floor(months / 12);
      return `${years} year${years > 1 ? 's' : ''} ago`;
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Notifications</h1>
                    {unreadCount > 0 && <p className="text-sm text-primary-600 dark:text-primary-400 mt-1">You have {unreadCount} unread notifications</p>}
                </div>
                <Button variant="ghost" size="sm" onClick={markAllNotificationsAsRead} disabled={unreadCount === 0}>
                    <CheckDoubleIcon className="w-5 h-5 mr-1.5" /> Mark all as read
                </Button>
            </div>

            <Card className="!p-0">
                {loadingNotifications ? (
                    <div className="p-10 text-center text-gray-500">Loading notifications...</div>
                ) : notifications.length > 0 ? (
                    <ul className="divide-y dark:divide-gray-700">
                        {notifications.map(notification => (
                            <li 
                                key={notification.id} 
                                onClick={() => handleNotificationClick(notification)}
                                className={`flex items-start gap-4 p-4 transition-colors cursor-pointer ${notification.is_read ? '' : 'bg-primary-50 dark:bg-primary-900/20'} hover:bg-gray-100/50 dark:hover:bg-gray-800/40`}
                            >
                                <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>
                                <div className="flex-1">
                                    <p className="text-sm text-gray-800 dark:text-gray-200">{notification.message}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{timeAgo(notification.created_at)}</p>
                                </div>
                                {!notification.is_read && (
                                    <div className="w-2.5 h-2.5 mt-2 bg-blue-500 rounded-full flex-shrink-0" title="Unread"></div>
                                )}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center py-12 px-4">
                        <BellIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600" />
                        <h3 className="text-lg font-semibold mt-4">You're all caught up!</h3>
                        <p className="text-gray-500 mt-2">You have no new notifications.</p>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default Notifications;