'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

export default function RouteTransition({ children }: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname();

  return <div className="route-content" key={pathname}>{children}</div>;
}