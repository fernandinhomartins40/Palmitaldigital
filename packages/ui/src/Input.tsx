import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className = '', id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold uppercase tracking-wider text-mute">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={[
          'w-full rounded-2xl px-4 py-3 text-sm text-ink outline-none transition-all',
          'bg-ink/[0.03] border border-line placeholder:text-subtle',
          'focus:bg-surface focus:border-coral focus:ring-4 focus:ring-coral/15',
          'dark:bg-white/[0.04] dark:focus:bg-white/[0.08]',
          error ? 'border-coral ring-2 ring-coral/30' : '',
          className,
        ].join(' ')}
        {...props}
      />
      {error && <span className="text-xs font-medium text-coral">{error}</span>}
      {hint && !error && <span className="text-xs text-mute">{hint}</span>}
    </div>
  );
}
