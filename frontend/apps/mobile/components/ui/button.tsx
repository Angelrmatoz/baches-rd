import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, type PressableProps } from 'react-native';

import { cn } from '../../lib/cn';

export type ButtonVariant = 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive' | 'link';
export type ButtonSize = 'default' | 'xs' | 'sm' | 'lg' | 'icon' | 'icon-sm' | 'icon-lg';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  className?: string;
  children?: ReactNode;
}

const base = 'flex-row items-center justify-center rounded-lg border border-transparent active:opacity-80 disabled:opacity-50';

const variants: Record<ButtonVariant, string> = {
  default: 'bg-civic-primary',
  outline: 'border-civic-secondary bg-civic-background',
  secondary: 'bg-civic-secondary',
  ghost: 'border-transparent bg-transparent',
  destructive: 'bg-civic-destructive',
  link: 'border-transparent bg-transparent',
};

const sizes: Record<ButtonSize, string> = {
  default: 'h-8 gap-1.5 px-2.5',
  xs: 'h-6 gap-1 px-2',
  sm: 'h-7 gap-1 px-2.5',
  lg: 'h-9 gap-1.5 px-2.5',
  icon: 'h-8 w-8',
  'icon-sm': 'h-7 w-7',
  'icon-lg': 'h-9 w-9',
};

export function Button({
  variant = 'default',
  size = 'default',
  loading = false,
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <Pressable
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <ActivityIndicator size="small" color={variant === 'default' || variant === 'destructive' ? '#0d1420' : '#a8b2c7'} />}
      {children}
    </Pressable>
  );
}
