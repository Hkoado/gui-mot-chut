'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { site } from '../../config/site';
import HeaderDisclosure from './HeaderDisclosure';

function availableUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

function Utility({ label, url, children, showLabel = false }: { label: string; url: string | null; children: ReactNode; showLabel?: boolean }) {
  const statusId = useId();
  const href = availableUrl(url);
  const className = 'header-utility';
  if (href) return <a className={className} href={href} aria-label={label}>{children}{showLabel && <span>{label}</span>}</a>;
  const status = `${label} — ${['Facebook', 'Instagram', 'Threads'].includes(label) ? 'chưa có kênh liên hệ được cấu hình' : 'chưa khả dụng'}`;
  return <span className="header-utility-wrap"><button type="button" className={className} aria-disabled="true" aria-label={status} aria-describedby={statusId}>{children}{showLabel && <span>{label}</span>}</button><span className="header-utility-status" role="tooltip" id={statusId}>{status}</span></span>;
}

function Icon({ children }: { children: ReactNode }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>;
}

function SocialLinks({ showLabel = false }: { showLabel?: boolean }) {
  return <div className="header-contact" role="group" aria-label="Mạng xã hội">
    <Utility label="Facebook" url={site.socials.facebook} showLabel={showLabel}><Icon><path d="M14 21v-8h3l.5-4H14V7c0-1 .5-2 2-2h2V2h-3c-3 0-5 2-5 5v2H7v4h3v8" /></Icon></Utility>
    <Utility label="Instagram" url={site.socials.instagram} showLabel={showLabel}><Icon><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><path d="M17.5 6.5h.01" /></Icon></Utility>
    <Utility label="Threads" url={site.socials.threads} showLabel={showLabel}><Icon><path d="M20 7c-1.3-3.4-4-5-8-5C5.5 2 3 6.5 3 12s2.5 10 9 10c5.2 0 8.5-2.8 8.5-6.5 0-3.5-2.8-5.5-7-5.5-3 0-5 1.3-5 3.5s1.5 3.5 3.7 3.5c3.2 0 4.3-2.5 4.3-5.7 0-3-1.4-5.3-4.5-5.3-1.8 0-3.2.8-4 2" /></Icon></Utility>
  </div>;
}

export function HeaderContact() {
  return <div className="header-desktop-contact"><SocialLinks /></div>;
}

export function HeaderMobileContact() {
  return <HeaderDisclosure name="contact" label="Liên hệ"><SocialLinks showLabel /></HeaderDisclosure>;
}

export function HeaderCart() {
  return <Link href="/gio-hang/" className="header-utility header-cart" aria-label="Giỏ hàng"><Icon><path d="M2 3h3l3 13h11l3-10H6M9 20h.01M18 20h.01" /><circle cx="9" cy="20" r="1" /><circle cx="18" cy="20" r="1" /></Icon></Link>;
}

export function HeaderAccount() {
  const [open, setOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const statusId = useId();

  useEffect(() => {
    if (!open) return;
    const dismiss = (event: PointerEvent) => {
      if (event.target instanceof Node && !accountRef.current?.contains(event.target)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', dismiss);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);

  return <>
    <HeaderCart />
    <div className="header-account" ref={accountRef} onBlur={event => {
      if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
    }}>
      <button ref={triggerRef} type="button" className="header-utility header-account__trigger" aria-label="Trang cá nhân" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen(value => !value)}>
        <Icon><circle cx="12" cy="7" r="4" /><path d="M4 21v-2a8 8 0 0 1 16 0v2" /></Icon>
      </button>
      <div className="header-account__panel" id={panelId} hidden={!open}>
        <ul className="header-account__list" aria-label="Tài khoản">
          {['Đăng nhập', 'Đăng ký', 'Thiệp đã lưu', 'Cài đặt tài khoản'].map(label => <li key={label}>
            <button type="button" className="header-account__item" disabled aria-describedby={statusId}>{label}</button>
          </li>)}
        </ul>
        <p className="header-account__status" id={statusId}>Các tính năng tài khoản chưa khả dụng.</p>
      </div>
    </div>
  </>;
}