import React from 'react';
import { generateInitials } from '@palmital/utils';

type AccentColor = 'coral' | 'citrus' | 'cobalt' | 'magenta' | 'mint' | 'amber';

interface AvatarProps {
  src?: string | null;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  accent?: AccentColor;
}

const sizeClasses: Record<NonNullable<AvatarProps['size']>, string> = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
  xl: 'h-20 w-20 text-2xl',
};

const accentBg: Record<AccentColor, string> = {
  coral: 'bg-coral',
  citrus: 'bg-citrus text-ink',
  cobalt: 'bg-cobalt',
  magenta: 'bg-magenta',
  mint: 'bg-mint text-ink',
  amber: 'bg-amber text-ink',
};

function pickAccent(name: string): AccentColor {
  const accents: AccentColor[] = ['coral', 'cobalt', 'magenta', 'mint', 'amber', 'citrus'];
  const hash = name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return accents[hash % accents.length];
}

export function Avatar({ src, name, size = 'md', className = '', accent }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`rounded-full object-cover ring-2 ring-white/60 dark:ring-white/10 ${sizeClasses[size]} ${className}`}
      />
    );
  }
  const tone = accent ?? pickAccent(name);
  return (
    <div
      className={`inline-flex items-center justify-center rounded-full font-display font-semibold text-white ring-2 ring-white/60 dark:ring-white/10 ${accentBg[tone]} ${sizeClasses[size]} ${className}`}
    >
      {generateInitials(name)}
    </div>
  );
}
