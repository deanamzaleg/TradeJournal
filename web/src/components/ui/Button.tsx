import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const variantClass: Record<string, string> = {
  primary: 'bg-accent text-bg font-semibold hover:bg-accent-h',
  secondary: 'bg-transparent text-text border border-border hover:border-accent hover:bg-panel-2',
  danger: 'bg-negative text-white hover:opacity-90',
  ghost: 'bg-transparent text-muted hover:text-text',
};

const sizeClass: Record<string, string> = {
  sm: 'px-4 py-2 text-xs rounded-md',
  md: 'px-5 py-2.5 text-sm rounded-lg',
  lg: 'px-7 py-3.5 text-base rounded-lg',
};

export function Button({ variant = 'secondary', size = 'md', className = '', children, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={`inline-flex items-center gap-2 cursor-pointer transition-all duration-150 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-1 focus-visible:ring-offset-bg disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 ${variantClass[variant]} ${sizeClass[size]} ${className}`}
    >
      {children}
    </button>
  );
}
