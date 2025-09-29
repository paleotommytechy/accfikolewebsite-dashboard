
import React from 'react';
// FIX: Use wildcard import for react-router-dom to resolve module export errors.
import * as ReactRouterDOM from 'react-router-dom';
const { Link } = ReactRouterDOM;

// FIX: Add target and rel to ButtonProps for use with anchor tags.
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  href?: string;
  to?: string;
  target?: string;
  rel?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  href,
  to,
  // FIX: Destructure target and rel to prevent them from being passed to button elements.
  target,
  rel,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200';

  const variantClasses = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
    secondary: 'bg-gray-700 text-white hover:bg-gray-800 focus:ring-gray-600',
    outline: 'border border-primary-600 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 focus:ring-primary-500',
    ghost: 'text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 focus:ring-primary-500',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  if (to) {
    // Cast props to 'any' for simplicity to allow anchor attributes.
    // A more robust solution would involve generics.
    // FIX: Explicitly pass target and rel to the Link component.
    return (
      <Link to={to} className={classes} target={target} rel={rel} {...(props as any)}>
        {children}
      </Link>
    );
  }

  if (href) {
    // Cast props to 'any' for simplicity to allow anchor attributes.
    // A more robust solution would involve generics.
    // FIX: Explicitly pass target and rel to the anchor tag.
    return (
      <a href={href} className={classes} target={target} rel={rel} {...(props as any)}>
        {children}
      </a>
    );
  }

  return (
    <button
      className={classes}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
