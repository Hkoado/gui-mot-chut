'use client';

import { useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';

// The server-rendered first page keeps the plain CSS entrance.
let hydrated = false;

const normalizePath = (path: string) => path.replace(/\/+$/, '') || '/';

/**
 * Plays the shared module entrance on `element`. Heavy routes (the 3D
 * bookshelf) spend their first frames mounting, fitting and sampling motion,
 * so the entrance waits until frames are smooth again (two consecutive short
 * frames, capped) instead of letting the animation clock run out during that
 * work. Light routes start after a couple of frames. Returns a cancel function.
 */
function playEntrance(element: HTMLElement) {
  element.dataset.enter = 'pending';
  const start = performance.now();
  let previous = 0, smooth = 0;
  let frame = requestAnimationFrame(function wait(now) {
    smooth = previous && now - previous < 25 ? smooth + 1 : 0;
    previous = now;
    if (smooth >= 2 || now - start > 700) element.dataset.enter = 'run';
    else frame = requestAnimationFrame(wait);
  });
  return () => cancelAnimationFrame(frame);
}

export default function RouteTransition({ children }: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);
  const cancel = useRef<() => void>(() => {});

  useLayoutEffect(() => {
    const element = ref.current;
    if (!hydrated) { hydrated = true; return; }
    if (!element) return;
    cancel.current();
    cancel.current = playEntrance(element);
    return () => cancel.current();
  }, [pathname]);

  useEffect(() => {
    // A link to the route already on screen (header tab, search shortcut, or
    // any future in-app link) does not remount the page, so replay the same
    // entrance for it. Hash links (e.g. /#album/…) keep their own behaviour.
    const replay = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!anchor || (anchor.target && anchor.target !== '_self') || anchor.hasAttribute('download')) return;
      const url = new URL(anchor.href, location.href);
      if (url.origin !== location.origin || url.hash || normalizePath(url.pathname) !== normalizePath(location.pathname)) return;
      const element = ref.current;
      if (!element) return;
      cancel.current();
      cancel.current = playEntrance(element);
    };
    document.addEventListener('click', replay);
    return () => document.removeEventListener('click', replay);
  }, []);

  return <div ref={ref} className="route-content" key={pathname}>{children}</div>;
}
