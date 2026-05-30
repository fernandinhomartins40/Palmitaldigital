import React from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'glass';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-ink text-surface hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0',
  secondary:
    'bg-ink/5 text-ink hover:bg-ink/10 dark:bg-white/5 dark:hover:bg-white/10 border border-line',
  ghost: 'bg-transparent text-ink hover:bg-ink/5 dark:hover:bg-white/5',
  danger: 'bg-coral text-white hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0',
  glass: 'glass text-ink hover:bg-white/80 dark:hover:bg-white/10',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-2 text-sm rounded-xl',
  md: 'px-4 py-2.5 text-sm rounded-2xl',
  lg: 'px-6 py-3 text-base rounded-2xl',
};

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  className = '',
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={[
        'inline-flex items-center justify-center font-semibold transition-all duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
