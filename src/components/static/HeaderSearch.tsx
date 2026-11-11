'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent } from 'react';

export default function HeaderSearch() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setOpen(false); setSubmitted(false); }, [pathname]);

  useEffect(() => {
    if (!open) return;
    // Wait for the visibility/inert styles to commit before moving focus.
    const focusFrame = requestAnimationFrame(() => {
      const input = inputRef.current;
      if (!input) return;
      // Flush the opening visibility transition before the focusability check.
      input.getBoundingClientRect();
      input.focus({ preventScroll: true });
    });
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus({ preventScroll: true });
    };
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('keydown', escape);
    document.addEventListener('pointerdown', outside);
    return () => {
      cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', escape);
      document.removeEventListener('pointerdown', outside);
    };
  }, [open]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (query.trim()) setSubmitted(true);
  };

  return <div ref={rootRef} className="header-search" data-open={open} onBlur={event => {
    if (event.relatedTarget instanceof Node && !event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  }}>
    <button ref={triggerRef} type="button" className="header-search-toggle" aria-label={open ? 'Đóng tìm kiếm' : 'Mở tìm kiếm'} aria-expanded={open} aria-controls="header-search-panel" onClick={() => { setOpen(value => !value); setSubmitted(false); }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4.5 4.5" /></svg>
    </button>
    <div id="header-search-panel" className="header-search-panel" inert={!open} aria-hidden={!open}>
      <form role="search" aria-label="Tìm kiếm trên Trao" onSubmit={submit}>
        <label htmlFor="header-search-input">Bạn đang tìm điều gì?</label>
        <div className="header-search-fields">
          <input ref={inputRef} id="header-search-input" type="search" name="q" value={query} required maxLength={200} autoComplete="off" placeholder="Nhập từ khóa…" aria-describedby="header-search-help" onChange={event => { setQuery(event.target.value); setSubmitted(false); }} />
          <button className="button" type="submit" disabled={!query.trim()}>Tìm kiếm</button>
          <button className="button button--quiet" type="button" onClick={() => { setOpen(false); triggerRef.current?.focus({ preventScroll: true }); }}>Đóng</button>
        </div>
        <p id="header-search-help" className="header-search-help">Tìm kiếm chưa được kết nối. Bạn có thể khám phá qua các mục điều hướng.</p>
        <p className="header-search-status" role="status">{submitted ? 'Chưa thể thực hiện tìm kiếm lúc này vì tính năng chưa được kết nối.' : ''}</p>
      </form>
    </div>
  </div>;
}