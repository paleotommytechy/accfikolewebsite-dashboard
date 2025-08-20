
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  action?: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ children, className = '', title, action }) => {
  return (
    <div className={`bg-white dark:bg-dark rounded-lg shadow-md p-4 sm:p-6 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-4 border-b border-gray-200 dark:border-gray-700 pb-3">
          {title && <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{title}</h3>}
          {action && <div>{action}</div>}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
};

export default Card;
