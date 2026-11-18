'use client';

import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';

// The server-rendered first page keeps the plain CSS entrance.
let hydrated = false;

export default function RouteTransition({ children }: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!hydrated) { hydrated = true; return; }
    if (!element) return;
    // Heavy routes (the 3D bookshelf) spend their first frames mounting,
    // fitting and sampling motion. Hold the entrance until frames are smooth
    // again (two consecutive short frames, capped) so the animation clock does
    // not run out during that work and appear skipped. Light routes start
    // after a couple of frames.
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
  }, [pathname]);

  return <div ref={ref} className="route-content" key={pathname}>{children}</div>;
}
