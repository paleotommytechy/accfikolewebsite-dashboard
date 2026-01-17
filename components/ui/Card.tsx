
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
  action?: React.ReactNode;
  style?: React.CSSProperties;
}

const Card: React.FC<CardProps> = ({ children, className = '', title, action, style }) => {
  return (
    <div 
      className={`bg-white dark:bg-dark rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] p-5 sm:p-7 border border-gray-100 dark:border-gray-800/50 ${className}`} 
      style={style}
    >
      {(title || action) && (
        <div className="flex items-center justify-between mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
          {title && <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">{title}</h3>}
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      <div className="relative">{children}</div>
    </div>
  );
};

export default Card;
