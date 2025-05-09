import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

interface MobileCardProps {
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
  title?: string;
  onClick?: () => void;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function MobileCard({
  children,
  className,
  icon,
  title,
  onClick,
  variant = 'default',
  size = 'md',
}: MobileCardProps) {
  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-5',
  };
  
  const variantClasses = {
    default: 'bg-white dark:bg-gray-800 shadow-sm',
    outline: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
    ghost: 'bg-transparent hover:bg-gray-50 dark:hover:bg-gray-900',
  };
  
  return (
    <Card 
      className={cn(
        'rounded-xl transition-all', 
        sizeClasses[size],
        variantClasses[variant],
        onClick && 'cursor-pointer hover:shadow-md active:scale-[0.98]',
        className
      )}
      onClick={onClick}
    >
      {(icon || title) && (
        <div className="flex items-center gap-3 mb-2">
          {icon && (
            <div className="shrink-0 flex items-center justify-center">
              {icon}
            </div>
          )}
          {title && <h3 className="font-medium text-sm">{title}</h3>}
        </div>
      )}
      <div>{children}</div>
    </Card>
  );
}

export function MobileCardGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('grid grid-cols-2 gap-4', className)}>
      {children}
    </div>
  );
}

export function MobileCardList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {children}
    </div>
  );
}