import React from 'react';
import Card from './Card';
import Button from './Button';
import { XIcon, BellIcon } from './Icons';
import type { Notification } from '../../types';

interface NotificationModalProps {
  notification: Notification | null;
  onClose: () => void;
}

const NotificationModal: React.FC<NotificationModalProps> = ({ notification, onClose }) => {
  if (!notification) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in-up"
      style={{ animationDuration: '200ms' }}
      aria-labelledby="notification-modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white dark:bg-dark rounded-lg shadow-xl max-w-md w-full relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" aria-label="Close notification viewer">
            <XIcon className="w-6 h-6" />
        </button>
        <div className="p-6">
          <div className="flex items-start">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900/50 sm:mx-0 sm:h-10 sm:w-10">
              <BellIcon className="h-6 w-6 text-primary-600 dark:text-primary-300" />
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="notification-modal-title">
                Notification
              </h3>
               <p className="text-xs text-gray-400 mt-1">{new Date(notification.created_at).toLocaleString()}</p>
              <div className="mt-4">
                <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                  {notification.message}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 sm:px-6 flex flex-row-reverse rounded-b-lg">
          <Button onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;
