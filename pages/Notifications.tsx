import React, { useState, useMemo } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Avatar from '../components/auth/Avatar';
import { CheckDoubleIcon } from '../components/ui/Icons';
import { mockDetailedNotifications } from '../services/mockData';
import type { DetailedNotification } from '../types';

type FilterType = 'all' | 'mentions' | 'followers' | 'invites';

const NotificationItem: React.FC<{ notification: DetailedNotification }> = ({ notification }) => {
    let title = <></>;
    switch(notification.type) {
        case 'follow':
            title = <><span className="font-bold">{notification.user.name}</span> followed you</>;
            break;
        case 'comment':
            title = <><span className="font-bold">{notification.user.name}</span> commented on <span className="font-bold">{notification.postTitle}</span></>;
            break;
        case 'like':
            title = <><span className="font-bold">{notification.user.name}</span> liked <span className="font-bold">{notification.postTitle}</span></>;
            break;
        case 'invite':
            title = <><span className="font-bold">{notification.user.name}</span> invited you to <span className="font-bold">{notification.dashboardName}</span></>;
            break;
        case 'system':
             title = <><span className="font-bold">{notification.user.name}</span> sent a system message</>;
             break;
    }

    return (
        <li className="flex items-start gap-4 p-4">
            <Avatar src={notification.user.avatarUrl} alt={notification.user.name} size="md" />
            <div className="flex-1">
                <p className="text-sm text-gray-800 dark:text-gray-200">{title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{notification.time}</p>

                {notification.comment && (
                    <div className="mt-2 p-3 text-sm bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700">
                        {notification.comment}
                    </div>
                )}
                
                {notification.type === 'invite' && (
                    <div className="mt-3 flex gap-2">
                        <Button variant="outline" size="sm">Decline</Button>
                        <Button variant="primary" size="sm">Accept</Button>
                    </div>
                )}
            </div>
            <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">{notification.ago}</span>
                {!notification.isRead && (
                    <div className="w-2.5 h-2.5 bg-blue-500 rounded-full flex-shrink-0"></div>
                )}
            </div>
        </li>
    );
};

const Notifications: React.FC = () => {
    const [notifications, setNotifications] = useState<DetailedNotification[]>(mockDetailedNotifications);
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    
    const unreadCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);
    
    const counts = useMemo(() => ({
        all: notifications.length,
        mentions: notifications.filter(n => n.category === 'mentions').length,
        followers: notifications.filter(n => n.category === 'followers').length,
        invites: notifications.filter(n => n.category === 'invites').length,
    }), [notifications]);

    const filteredNotifications = useMemo(() => {
        if (activeFilter === 'all') return notifications;
        return notifications.filter(n => n.category === activeFilter);
    }, [activeFilter, notifications]);

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };

    const filters: { id: FilterType; label: string; count: number }[] = [
        { id: 'all', label: 'View all', count: counts.all },
        { id: 'mentions', label: 'Mentions', count: counts.mentions },
        { id: 'followers', label: 'Followers', count: counts.followers },
        { id: 'invites', label: 'Invites', count: counts.invites },
    ];

    return (
        <div className="max-w-3xl mx-auto">
            <Card className="!p-0">
                {/* Header */}
                <div className="p-4 sm:p-6 border-b dark:border-gray-700 flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Your notifications</h1>
                        {unreadCount > 0 && <p className="text-sm text-primary-600 dark:text-primary-400">You have {unreadCount} unread notifications</p>}
                    </div>
                    <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                        <CheckDoubleIcon className="w-5 h-5 mr-1.5" /> Mark all as read
                    </Button>
                </div>

                {/* Filters */}
                <div className="p-2 sm:p-3 border-b dark:border-gray-700">
                    <div className="flex items-center gap-2 flex-wrap">
                        {filters.map(filter => (
                            <button
                                key={filter.id}
                                onClick={() => setActiveFilter(filter.id)}
                                className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${
                                    activeFilter === filter.id
                                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                }`}
                            >
                                {filter.label}
                                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${activeFilter === filter.id ? 'bg-white dark:bg-black/20' : 'bg-gray-200 dark:bg-gray-700'}`}>
                                    {filter.count}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
                
                {/* Notification List */}
                <ul className="divide-y dark:divide-gray-700">
                    {filteredNotifications.length > 0 ? (
                        filteredNotifications.map(notification => (
                            <NotificationItem key={notification.id} notification={notification} />
                        ))
                    ) : (
                        <li className="p-10 text-center text-gray-500">
                            No notifications in this category.
                        </li>
                    )}
                </ul>
            </Card>
        </div>
    );
};

export default Notifications;