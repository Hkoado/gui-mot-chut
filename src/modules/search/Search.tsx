'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { findFolders, resolveSearch } from './catalog';
import { site } from '../../config/site';
import { useLocale, useMessages } from '../../i18n/LocaleProvider';
import './search.css';

function SearchIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4.5 4.5" /></svg>;
}

function CloseIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>;
}

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
  const folders = findFolders(query, locale);
  const resultCount = folders.reduce((count, folder) => count + folder.children.length, 0);

  useEffect(() => { setOpen(false); setSubmitted(false); }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current!;
    const overflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    inputRef.current?.focus({ preventScroll: true });
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      triggerRef.current?.focus({ preventScroll: true });
    };
  }, [open]);

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
    <dialog ref={dialogRef} id="trao-search-dialog" className="trao-search__dialog" aria-label={t.dialog(site.brand)} onKeyDownCapture={event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setOpen(false); } }} onCancel={event => { event.preventDefault(); setOpen(false); }} onClose={() => setOpen(false)}>
      <button className="trao-search__icon trao-search__close" type="button" aria-label={t.close} onClick={() => setOpen(false)}><CloseIcon /></button>
      <div className="trao-search__content">
        <form role="search" aria-label={t.dialog(site.brand)} onSubmit={submit}>
          <label className="trao-search__label" htmlFor="trao-search-input">{t.label}</label>
          <div className="trao-search__field">
            <input ref={inputRef} id="trao-search-input" type="search" name="q" value={query} required maxLength={200} autoComplete="off" placeholder={t.label} onChange={event => { setQuery(event.target.value); setSubmitted(false); }} />
            {query && <button className="trao-search__icon trao-search__clear" type="button" aria-label={t.clear} onClick={() => { setQuery(''); setSubmitted(false); inputRef.current?.focus({ preventScroll: true }); }}><CloseIcon /></button>}
            <button className="trao-search__icon trao-search__submit" type="submit" aria-label={t.label} disabled={!query.trim()}><SearchIcon /></button>
          </div>
        </form>
        <section className="trao-search__suggestions" aria-label={query.trim() ? t.results : t.suggestions}>
          {/* Shortcut styled as a folder heading; client-side route change straight into the
              bespoke module. Re-clicking it on that route replays the entrance (RouteTransition). */}
          <Link className="trao-search__shortcut" href="/thiet-ke-rieng/" onClick={() => setOpen(false)}><h3>{messages.nav.custom}</h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 16 16 8M10 8h6v6" /></svg></Link>
          {/* Results are expanded while typing; idle suggestions stay collapsed. */}
          {folders.map(folder => <details className="trao-search__folder" key={`${open}:${folder.id}:${!!query.trim()}`} open={!!query.trim() || undefined}>
            <summary><h3>{folder.label}</h3><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><path d="m8 10 4 4 4-4" /></svg></summary>
            <ul>{folder.children.map(item => <li key={item.href}><a href={item.href} onClick={() => setOpen(false)}>{item.label}</a></li>)}</ul>
          </details>)}
        </section>
        <p className="trao-search__status" role="status">{query.trim() && !resultCount ? t.empty : submitted ? t.ambiguous : query.trim() ? t.count(resultCount) : ''}</p>
      </div>
    </dialog>
  </div>;
}