'use client';
import type { ReactNode } from 'react';
import { useMessages } from '../../i18n/LocaleProvider';
import { site } from '../../config/site';

function availableUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

function Utility({ id, label, url, social = false, children }: { id: string; label: string; url: string | null; social?: boolean; children: ReactNode }) {
  const t = useMessages();
  const href = availableUrl(url);
  const className = 'header-utility';
  if (href) return <a className={className} href={href} aria-label={label}>{children}</a>;
  const status = `${label} — ${social ? t.header.noContactChannel : t.header.unavailable}`;
  return <span className="header-utility-wrap"><button type="button" className={className} aria-disabled="true" aria-label={status} aria-describedby={`header-${id}-status`}>{children}</button><span className="header-utility-status" role="tooltip" id={`header-${id}-status`}>{status}</span></span>;
}

function Icon({ children }: { children: ReactNode }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>;
}

export function HeaderContact() {
  const t = useMessages();
  return <div className="header-contact" role="group" aria-label={t.header.socials}>
    <Utility id="Facebook" label="Facebook" social url={site.socials.facebook}><Icon><path d="M14 21v-8h3l.5-4H14V7c0-1 .5-2 2-2h2V2h-3c-3 0-5 2-5 5v2H7v4h3v8" /></Icon></Utility>
    <Utility id="Instagram" label="Instagram" social url={site.socials.instagram}><Icon><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><path d="M17.5 6.5h.01" /></Icon></Utility>
    <Utility id="Threads" label="Threads" social url={site.socials.threads}><Icon><path d="M20 7c-1.3-3.4-4-5-8-5C5.5 2 3 6.5 3 12s2.5 10 9 10c5.2 0 8.5-2.8 8.5-6.5 0-3.5-2.8-5.5-7-5.5-3 0-5 1.3-5 3.5s1.5 3.5 3.7 3.5c3.2 0 4.3-2.5 4.3-5.7 0-3-1.4-5.3-4.5-5.3-1.8 0-3.2.8-4 2" /></Icon></Utility>
  </div>;
}

export function HeaderAccount() {
  const t = useMessages();
  return <>
    <Utility id="Giỏ-hàng" label={t.header.cart} url={null}><Icon><path d="M2 3h3l3 13h11l3-10H6M9 20h.01M18 20h.01" /><circle cx="9" cy="20" r="1" /><circle cx="18" cy="20" r="1" /></Icon></Utility>
    <Utility id="Trang-cá-nhân" label={t.header.account} url={null}><Icon><circle cx="12" cy="7" r="4" /><path d="M4 21v-2a8 8 0 0 1 16 0v2" /></Icon></Utility>
  </>;
}