'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, type RefObject } from 'react';

function milliseconds(element: Element, name: string) {
  const value = getComputedStyle(element).getPropertyValue(name).trim();
  const number = parseFloat(value);
  return Number.isFinite(number) ? number * (value.endsWith('ms') ? 1 : 1000) : 0;
}

/**
 * Standard close (×) behaviour for native dialogs: plays the shared
 * `.dialog-exit` animation (tokens in theme.css), then calls `onClosed`, which
 * should unmount/close the dialog. Escape and the native cancel event should
 * call `close` too. Call `reset` before every `showModal()` so a reopened
 * dialog never starts in its closing state. Reduced motion shortens the
 * animation through the token, so the same path stays correct.
 *
 * Usage: `<dialog className="dialog-exit" …>` + `const { close, reset } = useGentleClose(ref, onClosed)`.
 */
export function useGentleClose(ref: RefObject<HTMLDialogElement | null>, onClosed: () => void) {
  const closing = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const callback = useRef(onClosed);
  useLayoutEffect(() => { callback.current = onClosed; });
  useEffect(() => () => clearTimeout(timer.current), []);

  const reset = useCallback(() => {
    clearTimeout(timer.current);
    closing.current = false;
    if (ref.current) delete ref.current.dataset.closing;
  }, [ref]);

  const close = useCallback(() => {
    const dialog = ref.current;
    if (!dialog?.open) { callback.current(); return; }
    if (closing.current) return;
    closing.current = true;
    const finish = () => {
      if (!closing.current) return;
      closing.current = false;
      clearTimeout(timer.current);
      // The exit keyframes fill forwards (opacity 0) until the dialog closes,
      // so there is no flash between the last frame and teardown.
      callback.current();
    };
    dialog.dataset.closing = 'true';
    // getAnimations() flushes style, so the CSS exit animation exists here.
    const exit = dialog.getAnimations().find(item => (item as CSSAnimation).animationName === 'dialog-exit');
    exit?.finished.then(finish, finish);
    // Fallback if the animation is missing or never finishes (e.g. hidden tab).
    timer.current = setTimeout(finish, milliseconds(dialog, '--duration-dialog-exit') + 100);
  }, [ref]);

  return { close, reset };
}
