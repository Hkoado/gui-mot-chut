import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Header from '../components/static/Header';
import Footer from '../components/static/Footer';
import RouteTransition from '../components/static/RouteTransition';
import { site } from '../config/site';
import '../styles/global.css';
import '../styles/site.css';

export const metadata: Metadata = {
  title: `${site.brand} — một chiếc web nhỏ dành cho người đặc biệt`,
  description: 'Website quà tặng được làm riêng cho người bạn thương.',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <html lang="vi"><body data-ui="album-gallery"><Header /><RouteTransition><>{children}<Footer /></></RouteTransition></body></html>;
}