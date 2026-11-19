import type { MouseEventHandler } from 'react';
import './close-button.css';

export function CloseIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>;
}

export default function CloseButton({ label, onClick, className, autoFocus }: {
  label: string;
  onClick: MouseEventHandler<HTMLButtonElement>;
  className: string;
  autoFocus?: boolean;
}) {
  return <button className={`close-button ${className}`} type="button" aria-label={label} onClick={onClick} autoFocus={autoFocus}><CloseIcon /></button>;
}