'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { site } from '../../config/site';
import BrandWordmark from '../BrandWordmark';
import { useLocale, useMessages } from '../../i18n/LocaleProvider';

export default function Footer() {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useMessages();
  if (pathname === '/') return null;
  return <footer className="site-footer" id="lien-he"><div className="container footer-inner">
    <Link className="brand" href="/"><BrandWordmark /></Link><p>{t.footer.tagline}</p>
    <p className="muted">{site.contactUrl ? <a href={site.contactUrl}>{t.footer.contact}</a> : locale === 'en' ? site.contactLabelEn : site.contactLabel}</p>
    <small>© {new Date().getFullYear()} {site.brand}</small>
  </div></footer>;
}