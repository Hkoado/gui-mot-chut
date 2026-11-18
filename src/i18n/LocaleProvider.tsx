'use client';

import { createContext, useContext, useEffect, useLayoutEffect, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { detectLocale, readCachedLocale, type Locale } from './detect';
import { messages, type Messages } from './messages';

const LocaleContext = createContext<Locale>('vi');

/**
 * The static export renders Vietnamese. On the client the visitor's IP
 * country decides the locale: Vietnam keeps Vietnamese, any other country
 * switches the whole UI to English. There is no manual switch.
 */
export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('vi');
  const [resolved, setResolved] = useState(false);
  const pathname = usePathname();

  useLayoutEffect(() => {
    // A cached decision applies before first client paint.
    const cached = readCachedLocale();
    if (cached) { setLocale(cached); setResolved(true); return; }
    let active = true;
    detectLocale().then(value => { if (active) { setLocale(value); setResolved(true); } });
    return () => { active = false; };
  }, []);

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.lang = locale;
    // Reveal only once the resolved copy has been committed.
    if (resolved) root.removeAttribute('data-locale-pending');
  }, [locale, resolved]);

  useEffect(() => {
    // Static metadata is Vietnamese and Next re-applies it to <head> after
    // navigation, so keep re-asserting the English title while it changes.
    if (locale === 'vi') return;
    const title = messages.en.documentTitle[pathname] ?? messages.en.documentTitle['/'];
    const apply = () => { if (document.title !== title) document.title = title; };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.head, { subtree: true, childList: true, characterData: true });
    return () => observer.disconnect();
  }, [locale, pathname]);

  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

export function useMessages(): Messages {
  return messages[useContext(LocaleContext)];
}
