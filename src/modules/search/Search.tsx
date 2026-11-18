'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { findFolders, resolveSearch } from './catalog';
import { site } from '../../config/site';
import { useLocale, useMessages } from '../../i18n/LocaleProvider';
import { useGentleClose } from '../../lib/useGentleClose';
import './search.css';

function SearchIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4.5 4.5" /></svg>;
}

function CloseIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>;
}

const idleCardCount = 6;

export default function Search() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = useLocale();
  const messages = useMessages();
  const t = messages.search;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // Card names are listed directly: the first few while idle, every match while typing.
  const matches = findFolders(query, locale).flatMap(folder => folder.children);
  const resultCount = matches.length;
  const cards = query.trim() ? matches : matches.slice(0, idleCardCount);
  // × / Escape close gently; navigating away closes at once so the route entrance leads.
  const { close, reset } = useGentleClose(dialogRef, () => setOpen(false));

  useEffect(() => { setOpen(false); setSubmitted(false); }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current!;
    const overflow = document.body.style.overflow;
    reset();
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    inputRef.current?.focus({ preventScroll: true });
    return () => {
      dialog.close();
      reset();
      document.body.style.overflow = overflow;
      triggerRef.current?.focus({ preventScroll: true });
    };
  }, [open, reset]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const href = resolveSearch(query, locale);
    if (href) {
      setOpen(false);
      // Native fragment navigation emits hashchange even when already on home.
      if (href.startsWith('/#')) window.location.assign(href);
      else router.push(href);
    } else if (query.trim()) setSubmitted(true);
  };

  return <div className="trao-search">
    <button ref={triggerRef} type="button" className="trao-search__toggle" aria-label={t.open} aria-haspopup="dialog" aria-expanded={open} aria-controls="trao-search-dialog" onClick={() => { setQuery(''); setOpen(true); setSubmitted(false); }}><SearchIcon /></button>
    <dialog ref={dialogRef} id="trao-search-dialog" className="trao-search__dialog dialog-exit" aria-label={t.dialog(site.brand)} onKeyDownCapture={event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); } }} onCancel={event => { event.preventDefault(); close(); }} onClose={() => setOpen(false)}>
      <button className="trao-search__icon trao-search__close" type="button" aria-label={t.close} onClick={close}><CloseIcon /></button>
      <div className="trao-search__content">
        <form role="search" aria-label={t.dialog(site.brand)} onSubmit={submit}>
          <label className="trao-search__label" htmlFor="trao-search-input">{t.label}</label>
          <div className="trao-search__field">
            <input ref={inputRef} id="trao-search-input" type="search" name="q" value={query} required maxLength={200} autoComplete="off" placeholder={t.label} onChange={event => { setQuery(event.target.value); setSubmitted(false); }} />
            {query && <button className="trao-search__icon trao-search__clear" type="button" aria-label={t.clear} onClick={() => { setQuery(''); setSubmitted(false); inputRef.current?.focus({ preventScroll: true }); }}><CloseIcon /></button>}
            <button className="trao-search__icon trao-search__submit" type="submit" aria-label={t.label} disabled={!query.trim()}><SearchIcon /></button>
          </div>
        </form>
        <div className="trao-search__suggestions">
          {/* The bespoke commission is the primary offer: the one distinct paper card, styled like
              the bespoke page rather than an ad. It comes first in the DOM (screen readers, stacked
              mobile layout) and sits in the right column on wider screens beside Highlights. The
              whole card is one client-side link; re-clicking it on that route replays the entrance. */}
          <Link className="trao-search__bespoke" href="/thiet-ke-rieng/" onClick={() => setOpen(false)} aria-labelledby="trao-search-bespoke-title" aria-describedby="trao-search-bespoke-line">
            <span className="trao-search__bespoke-copy">
              <span className="eyebrow">{messages.bespoke.eyebrow}</span>
              <span className="trao-search__bespoke-title" id="trao-search-bespoke-title">{messages.nav.custom}</span>
              <span className="trao-search__bespoke-line" id="trao-search-bespoke-line">{messages.bespoke.artLines.join(' ')}</span>
            </span>
            <span className="trao-search__bespoke-foot" aria-hidden="true">
              <svg className="trao-search__bespoke-sign" viewBox="0 0 200 100" fill="none"><path d="M15 75C50 5 110 10 90 55S20 90 55 50s100-55 125-10M35 88q60-30 140-10" stroke="currentColor" strokeWidth="1.5" /></svg>
              <span className="trao-search__bespoke-go"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg></span>
            </span>
          </Link>
          <section className="trao-search__cards" aria-labelledby="trao-search-cards">
            <h2 id="trao-search-cards">{t.cardSuggestions}</h2>
            {cards.length > 0 && <ul>{cards.map(item => <li key={item.href}><a href={item.href} onClick={() => setOpen(false)}>{item.label}</a></li>)}</ul>}
          </section>
        </div>
        <p className="trao-search__status" role="status">{query.trim() && !resultCount ? t.empty : submitted ? t.ambiguous : query.trim() ? t.count(resultCount) : ''}</p>
      </div>
    </dialog>
  </div>;
}