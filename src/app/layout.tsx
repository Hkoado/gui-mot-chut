import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Header from '../components/static/Header';
import Footer from '../components/static/Footer';
import { LanguageProvider } from '../components/LanguageProvider';
import '../styles/global.css';
import '../styles/site.css';

export const metadata: Metadata = {
  title: 'Gửi Một Chút — một chiếc web nhỏ dành cho người đặc biệt',
  description: 'Website quà tặng được làm riêng cho người bạn thương.',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <html lang="vi"><body><LanguageProvider><Header />{children}<Footer /></LanguageProvider></body></html>;
}