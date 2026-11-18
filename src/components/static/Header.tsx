'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLayoutEffect, useRef } from 'react';
import { site } from '../../config/site';
import BrandWordmark from '../BrandWordmark';
import Search from '../../modules/search/Search';
import { HeaderContact, HeaderAccount } from './HeaderUtilities';
import { useMessages } from '../../i18n/LocaleProvider';

const tabs = [['/', 'collection'], ['/cach-dat/', 'order'], ['/thiet-ke-rieng/', 'custom'], ['/hoi-dap/', 'faq'], ['/bang-gia/', 'pricing']] as const;

export default function Header() {
  const pathname = usePathname();
  const t = useMessages();
  const navRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const underlineRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const nav = navRef.current;
    const track = trackRef.current;
    const underline = underlineRef.current;
    if (!nav || !track || !underline) return;
    let disposed = false;
    let readyFrame = 0;
    const measure = () => {
      if (disposed) return;
      const active = track.querySelector<HTMLElement>('[aria-current="page"] span');
      underline.hidden = !active;
      if (!active) return;
      const label = active.getBoundingClientRect();
      const bounds = track.getBoundingClientRect();
      underline.style.width = `${label.width}px`;
      underline.style.transform = `translateX(${label.left - bounds.left}px)`;
      // Only scroll the navigation viewport, never the document or bookshelf.
      const viewport = nav.getBoundingClientRect();
      if (label.left < viewport.left || label.right > viewport.right) {
        nav.scrollTo({ left: nav.scrollLeft + label.left - viewport.left - (viewport.width - label.width) / 2, behavior: 'instant' });
      }
    };
    measure();
    // The first measurement is placed without travelling from the origin.
    readyFrame = requestAnimationFrame(() => { underline.dataset.ready = 'true'; });
    const observer = new ResizeObserver(measure);
    observer.observe(nav);
    observer.observe(track);
    track.querySelectorAll('a span').forEach(label => observer.observe(label));
    document.fonts.ready.then(measure);
    document.fonts.addEventListener('loadingdone', measure);
    return () => {
      disposed = true;
      cancelAnimationFrame(readyFrame);
      observer.disconnect();
      document.fonts.removeEventListener('loadingdone', measure);
    };
  // Labels change width when the locale switches; re-measure the underline.
  }, [pathname, t]);

  return <header className="site-header" data-ui="album-gallery"><div className="container header-inner">
    <HeaderContact />
    <Link className="brand" href="/" aria-label={t.header.home(site.brand)}><BrandWordmark /></Link>
    <div className="header-actions" role="group" aria-label={t.header.actions}><Search /><HeaderAccount /></div>
    <nav ref={navRef} className="main-nav" aria-label={t.header.mainNav}><div ref={trackRef} className="main-nav-track">
      {tabs.map(([href, key]) => <Link key={href} href={href} aria-current={pathname.replace(/\/$/, '') === href.replace(/\/$/, '') ? 'page' : undefined}><span>{t.nav[key]}</span></Link>)}
      <span ref={underlineRef} className="main-nav-underline" aria-hidden="true" hidden />
    </div></nav>
  </div></header>;
}