'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
type Language = 'vi' | 'en';
const LanguageContext = createContext({ language: 'vi' as Language, setLanguage: (_: Language) => {}, t: (vi: string, _en: string) => vi });
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [preferred, setPreferred] = useState<Language>('vi');
  const home = usePathname() === '/';
  const language = home ? preferred : 'vi';
  useEffect(() => { try { if (localStorage.getItem('gmc-language') === 'en') setPreferred('en'); } catch { /* Optional storage. */ } }, []);
  useEffect(() => { document.documentElement.lang = language; }, [language]);
  const setLanguage = (value: Language) => { setPreferred(value); try { localStorage.setItem('gmc-language', value); } catch { /* Keep in memory. */ } };
  return <LanguageContext.Provider value={{ language, setLanguage, t: (vi, en) => language === 'vi' ? vi : en }}>{children}</LanguageContext.Provider>;
}
export const useLanguage = () => useContext(LanguageContext);