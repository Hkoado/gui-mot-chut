export type Locale = 'vi' | 'en';

/** Visitors whose IP resolves to Vietnam see Vietnamese; everyone else English. */
export const homeCountry = 'VN';
/** Free client-side IP → country lookup. The visitor's IP is sent to this third party. */
export const countryLookupUrl = 'https://api.country.is/';
export const localeCacheKey = 'trao:locale';
const lookupTimeoutMs = 3000;
const vietnamTimeZones = ['Asia/Ho_Chi_Minh', 'Asia/Saigon'];

export function isLocale(value: unknown): value is Locale {
  return value === 'vi' || value === 'en';
}

/** Offline guess used only when the IP lookup fails (blocked, offline, rate-limited). */
export function guessLocaleFromDevice(): Locale {
  try {
    return vietnamTimeZones.includes(Intl.DateTimeFormat().resolvedOptions().timeZone) ? 'vi' : 'en';
  } catch { return 'vi'; }
}

export function readCachedLocale(): Locale | null {
  try {
    const value = sessionStorage.getItem(localeCacheKey);
    return isLocale(value) ? value : null;
  } catch { return null; }
}

/** Resolves the visitor locale from their IP country, once per browser tab session. */
export async function detectLocale(): Promise<Locale> {
  const cached = readCachedLocale();
  if (cached) return cached;
  let locale: Locale;
  try {
    const response = await fetch(countryLookupUrl, { signal: AbortSignal.timeout(lookupTimeoutMs), cache: 'no-store' });
    if (!response.ok) throw new Error(`Country lookup failed: ${response.status}`);
    const { country } = await response.json() as { country?: unknown };
    if (typeof country !== 'string' || !/^[A-Z]{2}$/.test(country)) throw new Error('Country lookup returned no country');
    locale = country === homeCountry ? 'vi' : 'en';
  } catch {
    locale = guessLocaleFromDevice();
  }
  try { sessionStorage.setItem(localeCacheKey, locale); } catch { /* Detection still works without storage. */ }
  return locale;
}

/**
 * Runs before first paint (inlined in <head>). When this tab is likely to be
 * shown in English (cached English, or a non-Vietnam time zone), hide the page
 * until LocaleProvider has rendered the English copy, so visitors do not see
 * Vietnamese flash first. A timeout always reveals the page.
 */
export const localeBootScript = `(function(){try{var d=document.documentElement,c=null;try{c=sessionStorage.getItem(${JSON.stringify(localeCacheKey)})}catch(e){}
var z='';try{z=Intl.DateTimeFormat().resolvedOptions().timeZone}catch(e){}
if(c==='en'||(c!=='vi'&&${JSON.stringify(vietnamTimeZones)}.indexOf(z)<0)){d.setAttribute('data-locale-pending','');setTimeout(function(){d.removeAttribute('data-locale-pending')},${lookupTimeoutMs + 500})}}catch(e){}})();`;
