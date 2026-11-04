'use client';
import Link from 'next/link';
import { useLanguage } from '../LanguageProvider';
import { site } from '../../config/site';

export default function Footer() {
  const { t } = useLanguage();
  return <footer className="site-footer" id="lien-he"><div className="container footer-inner">
    <Link className="brand" href="/">Gửi Một Chút</Link><p>{t('Một câu chuyện nhỏ, gửi đến người thật đặc biệt.', 'A little story for someone truly special.')}</p>
    <p className="muted">{site.contactUrl ? <a href={site.contactUrl}>{t('Nhắn mình', 'Get in touch')}</a> : t(site.contactLabel, 'Contact details are not available yet')}</p>
    <small>© {new Date().getFullYear()} Gửi Một Chút</small>
  </div></footer>;
}