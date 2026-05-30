import React from 'react';

type CardVariant = 'glass' | 'glass-strong' | 'solid' | 'plain';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: CardVariant;
  signature?: boolean;
}

const variants: Record<CardVariant, string> = {
  glass: 'glass',
  'glass-strong': 'glass-strong',
  solid: 'bg-surface border border-line',
  plain: '',
};

export function Card({
  children,
  className = '',
  onClick,
  variant = 'glass',
  signature = true,
}: CardProps) {
  return (
    <div
      className={[
        variants[variant],
        signature ? 'shape-signature' : 'rounded-glass',
        'text-ink',
        onClick ? 'cursor-pointer transition-transform hover:-translate-y-0.5' : '',
        className,
      ].join(' ')}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
