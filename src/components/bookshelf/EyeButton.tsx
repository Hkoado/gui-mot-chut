import type { ButtonHTMLAttributes, ReactNode } from 'react';

type EyeButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> & { children: ReactNode };

export default function EyeButton({ children, className, ...props }: EyeButtonProps) {
  return <button {...props} type="button" className={`button eye-action ${className ?? ''}`}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>
    <span>{children}</span>
  </button>;
}