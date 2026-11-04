'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '../LanguageProvider';
import { site } from '../../config/site';

export default function Header() {
  const { language, setLanguage, t } = useLanguage();
  const home = usePathname() === '/';
  return <header className="site-header"><div className="container header-inner">
    <Link className="brand" href="/" aria-label={`${site.brand} — về trang chủ`}><span className="brand-mark" aria-hidden="true">g.</span><span>{site.brand}</span></Link>
    <nav className="main-nav" aria-label={t('Điều hướng chính', 'Main navigation')}><Link href="/#xem-mau">{t('Kệ sách', 'The shelf')}</Link><Link href="/#cach-dat">{t('Cách đặt', 'How it works')}</Link><Link href="/bang-gia/">{t('Bảng giá', 'Pricing (VI)')}</Link></nav>
    {home && <div className="language-switch" role="group" aria-label="Ngôn ngữ / Language">{(['vi', 'en'] as const).map(value => <button key={value} type="button" aria-pressed={language === value} onClick={() => setLanguage(value)} lang={value}>{value.toUpperCase()}</button>)}</div>}
  </div></header>;
}