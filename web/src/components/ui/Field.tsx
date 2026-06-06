import type { ReactNode, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

interface FieldProps {
  label: string;
  children: ReactNode;
  error?: string;
  hint?: string;
}

export function Field({ label, children, error, hint }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted uppercase tracking-wide">{label}</label>
      {children}
      {hint && !error && <span className="text-xs text-muted">{hint}</span>}
      {error && <span className="text-xs text-negative">{error}</span>}
    </div>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export function Input({ error, className = '', ...props }: InputProps) {
  return (
    <input
      {...props}
      className={`bg-panel-2 border ${error ? 'border-negative' : 'border-border'} rounded-lg px-3 py-2 text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors tabular-nums w-full ${className}`}
    />
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export function Select({ error, className = '', children, ...props }: SelectProps) {
  return (
    <select
      {...props}
      className={`bg-panel-2 border ${error ? 'border-negative' : 'border-border'} rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors cursor-pointer w-full ${className}`}
    >
      {children}
    </select>
  );
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`bg-panel-2 border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-colors resize-none w-full ${props.className ?? ''}`}
    />
  );
}
