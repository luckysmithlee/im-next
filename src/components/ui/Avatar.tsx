import { cn } from '@/utils';
import { User } from 'lucide-react';
import { forwardRef } from 'react';

export interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  online?: boolean;
}

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ src, alt, size = 'md', className, online = false }, ref) => {
    const sizeClasses = {
      sm: 'w-8 h-8',
      md: 'w-10 h-10',
      lg: 'w-12 h-12',
    };

    return (
      <div ref={ref} className={cn('relative', className)}>
        <div className={cn(
          'rounded-full bg-gray-200 flex items-center justify-center overflow-hidden',
          sizeClasses[size]
        )}>
          {src ? (
            <img 
              src={src} 
              alt={alt || 'Avatar'} 
              className="w-full h-full object-cover"
            />
          ) : (
            <User className={cn(
              'text-gray-400',
              size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-6 h-6'
            )} />
          )}
        </div>
        {online && (
          <div className={cn(
            'absolute bottom-0 right-0 bg-green-500 rounded-full border-2 border-white',
            size === 'sm' ? 'w-3 h-3' : size === 'md' ? 'w-3 h-3' : 'w-4 h-4'
          )} />
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';