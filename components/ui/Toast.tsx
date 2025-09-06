import React from 'react';
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon, XIcon } from './Icons';
import type { ToastProps as ToastData } from '../../context/NotificationContext';

interface ToastProps extends ToastData {
  onDismiss: () => void;
}

const toastConfig = {
  success: {
    icon: <CheckCircleIcon className="w-6 h-6 text-green-500" />,
    style: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700',
    textStyle: 'text-green-800 dark:text-green-200',
  },
  error: {
    icon: <XCircleIcon className="w-6 h-6 text-red-500" />,
    style: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700',
    textStyle: 'text-red-800 dark:text-red-200',
  },
  info: {
    icon: <InformationCircleIcon className="w-6 h-6 text-blue-500" />,
    style: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700',
    textStyle: 'text-blue-800 dark:text-blue-200',
  },
};

const Toast: React.FC<ToastProps> = ({ message, type, onDismiss }) => {
  const config = toastConfig[type];

  return (
    <div className={`w-full rounded-lg shadow-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden border animate-fade-in-up ${config.style}`}>
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {config.icon}
          </div>
          <div className="ml-3 w-0 flex-1 pt-0.5">
            <p className={`text-sm font-medium ${config.textStyle}`}>
              {message}
            </p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={onDismiss}
              className="inline-flex rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <span className="sr-only">Close</span>
              <XIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Toast;
