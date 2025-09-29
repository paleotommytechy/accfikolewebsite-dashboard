
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  // FIX: Changed title prop type from string to React.ReactNode to allow JSX components.
  title?: React.ReactNode;
  action?: React.ReactNode;
  // FIX: Add style prop to allow passing inline styles for animations.
  style?: React.CSSProperties;
}

const Card: React.FC<CardProps> = ({ children, className = '', title, action, style }) => {
  return (
    <div className={`bg-white dark:bg-dark rounded-lg shadow-md p-4 sm:p-6 ${className}`} style={style}>
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
