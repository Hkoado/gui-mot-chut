import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Header from '../components/static/Header';
import Footer from '../components/static/Footer';
import RouteTransition from '../components/static/RouteTransition';
import { site } from '../config/site';
import { LocaleProvider } from '../i18n/LocaleProvider';
import { localeBootScript } from '../i18n/detect';
import '../styles/global.css';
import '../styles/site.css';

export const metadata: Metadata = {
  title: `${site.brand} — một chiếc web nhỏ dành cho người đặc biệt`,
  description: 'Website quà tặng được làm riêng cho người bạn thương.',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  // The boot script may mark <html> before hydration, hence suppressHydrationWarning.
  return <html lang="vi" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: localeBootScript }} /></head>
    <body data-ui="album-gallery"><LocaleProvider><Header /><RouteTransition><>{children}<Footer /></></RouteTransition></LocaleProvider></body></html>;
}