'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';

/** Non-modal disclosure; never locks page scrolling or traps focus. */
export default function HeaderDisclosure({ name, label, children }: { name: string; label: ReactNode; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  const pathname = usePathname();
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const dismiss = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      // A nested disclosure handles Escape first; keep its parent open for focus restoration.
      if (event.target instanceof Element && event.target.closest('.header-disclosure') !== root.current) return;
      event.preventDefault();
      setOpen(false);
      trigger.current?.focus();
    };
    const resize = () => setOpen(false);
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', escape);
    window.addEventListener('resize', resize);
    return () => {
      document.removeEventListener('pointerdown', dismiss);
      document.removeEventListener('keydown', escape);
      window.removeEventListener('resize', resize);
    };
  }, [open]);
  return <div className={`header-disclosure header-disclosure--${name}`} ref={root} onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  }}>
    <button ref={trigger} className="header-utility header-disclosure__trigger" type="button" aria-label={name === 'navigation' ? 'Mở điều hướng' : undefined} aria-expanded={open} aria-controls={id} onClick={() => setOpen(value => !value)}>{label}</button>
    <div id={id} className="header-disclosure__panel" hidden={!open} onClick={event => {
      if (event.target instanceof Element && event.target.closest('a')) {
        setOpen(false);
        trigger.current?.focus();
      }
    }}>{children}</div>
  </div>;
}