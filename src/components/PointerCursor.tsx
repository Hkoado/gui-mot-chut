'use client';

import { useEffect, useRef } from 'react';
import '../styles/cursor.css';

export default function PointerCursor() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const cursor = ref.current!;
    const fine = matchMedia('(pointer: fine)');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let x = 0, y = 0, mx = 0, my = 0, previous = 0, frame = 0, visible = false;
    const rate = parseFloat(getComputedStyle(cursor).getPropertyValue('--cursor-follow-rate'));
    // A non-interactive manual popover stays above native modal dialogs too.
    const elevate = () => {
      if (!fine.matches || !visible) return;
      cursor.hidePopover?.();
      cursor.showPopover();
    };
    const hide = () => {
      visible = false;
      delete document.documentElement.dataset.customCursor;
      cursor.hidePopover?.();
      cancelAnimationFrame(frame); frame = 0; previous = 0;
    };
    const tick = (now: number) => {
      const dt = previous ? Math.min((now - previous) / 1000, .05) : 1 / 60;
      previous = now;
      const a = reduced.matches ? 1 : 1 - Math.exp(-rate * dt);
      x += (mx - x) * a; y += (my - y) * a;
      cursor.style.transform = `translate3d(${x}px,${y}px,0)`;
      const target = document.elementFromPoint(mx, my);
      const detail = !!document.querySelector('dialog[open]');
      const shelf = document.querySelector<HTMLElement>('.bookshelf');
      const state = !detail && shelf?.dataset.cursorOpen === 'true' ? 'open'
        : !detail && target?.closest('.book:not(.is-active)') ? 'spine'
        : target?.closest('button, a, [role="button"]') && !target.closest('.bookshelf') ? 'btn' : '';
      cursor.className = `pointer-cursor${state ? ` ${state}` : ''}`;
      frame = requestAnimationFrame(tick);
    };
    const move = (event: PointerEvent) => {
      if (!fine.matches || event.pointerType !== 'mouse' || typeof cursor.showPopover !== 'function') { hide(); return; }
      mx = event.clientX; my = event.clientY;
      if (!visible) {
        x = mx; y = my; visible = true;
        cursor.style.transform = `translate3d(${x}px,${y}px,0)`;
        elevate();
        document.documentElement.dataset.customCursor = 'true';
      }
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const leave = (event: PointerEvent) => { if (!event.relatedTarget) hide(); };
    const visibility = () => { if (document.hidden) hide(); };
    const observer = new MutationObserver(records => {
      if (records.some(record => record.type === 'attributes' && record.attributeName === 'open')) elevate();
    });
    observer.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['open'] });
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerout', leave);
    window.addEventListener('blur', hide);
    document.addEventListener('visibilitychange', visibility);
    fine.addEventListener('change', hide);
    return () => {
      hide(); observer.disconnect();
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerout', leave);
      window.removeEventListener('blur', hide); document.removeEventListener('visibilitychange', visibility);
      fine.removeEventListener('change', hide);
    };
  }, []);
  return <div ref={ref} className="pointer-cursor" popover="manual" aria-hidden="true">
    <span className="pointer-cursor-ring" /><span className="pointer-cursor-dot" />
    <span className="pointer-cursor-label">MỞ</span>
  </div>;
}