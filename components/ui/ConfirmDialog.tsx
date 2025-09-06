import React from 'react';
import Button from './Button';
import { InformationCircleIcon } from './Icons';

interface ConfirmDialogProps {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ isOpen, message, onConfirm, onCancel }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in-up"
      style={{ animationDuration: '200ms' }}
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white dark:bg-dark rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-start">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900/50 sm:mx-0 sm:h-10 sm:w-10">
              <InformationCircleIcon className="h-6 w-6 text-primary-600 dark:text-primary-300" />
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                Confirmation Required
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500 dark:text-gray-300">
                  {message}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
          <Button onClick={onConfirm} className="w-full sm:w-auto sm:ml-3">
            Confirm
          </Button>
          <Button onClick={onCancel} variant="outline" className="w-full sm:w-auto mt-3 sm:mt-0">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
