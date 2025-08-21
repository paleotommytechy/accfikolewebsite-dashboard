import React from 'react';

interface AvatarProps {
  src: string | null | undefined;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ src, alt, size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-16 w-16',
    xl: 'h-24 w-24',
  };

  // Fallback to a generated avatar if no src is provided.
  // This is great for new users or users who haven't uploaded a picture.
  const fallbackSrc = `https://ui-avatars.com/api/?name=${encodeURIComponent(alt)}&background=059669&color=fff&font-size=0.5`;

  return (
    <img
      className={`rounded-full object-cover bg-gray-200 dark:bg-gray-700 ${sizeClasses[size]} ${className}`}
      src={src || fallbackSrc}
      alt={alt}
      onError={(e) => {
        // In case the primary src fails (e.g., broken link), fallback to the generated one.
        const target = e.target as HTMLImageElement;
        if (target.src !== fallbackSrc) {
            target.src = fallbackSrc;
        }
      }}
    />
  );
};

export default Avatar;