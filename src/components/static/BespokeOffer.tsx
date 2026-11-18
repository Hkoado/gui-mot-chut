'use client';
import { bespoke, bespokeCopy, getInstagramUrl } from '../../config/bespoke';
import { useLocale, useMessages } from '../../i18n/LocaleProvider';
import { site } from '../../config/site';

export default function BespokeOffer() {
  const locale = useLocale();
  const t = useMessages();
  const copy = bespokeCopy(locale);
  const details = copy.details;
  const instagramUrl = getInstagramUrl(bespoke.instagramUrl);
  return <section className="bespoke-offer" id="doc-ban" aria-labelledby="bespoke-title">
    <div className="bespoke-art" aria-hidden="true"><span>01 / 01</span><span className="inscription">{t.bespoke.artLines[0]}<br />{t.bespoke.artLines[1]}</span><svg viewBox="0 0 200 100" fill="none"><path d="M15 75C50 5 110 10 90 55S20 90 55 50s100-55 125-10M35 88q60-30 140-10" stroke="currentColor" strokeWidth="1.5" /></svg><span>{site.brand.toUpperCase()} · {t.bespoke.artFooter}</span></div>
    <div><p className="eyebrow">{t.bespoke.eyebrow}</p><h2 id="bespoke-title">{copy.title}</h2><p>{copy.description}</p><ul>{details.map(detail => <li key={detail}>{detail}</li>)}</ul><p className="eyebrow">{t.bespoke.quote}</p>
      {instagramUrl ? <a className="button" href={instagramUrl} target="_blank" rel="noopener noreferrer">{t.bespoke.instagram} ↗</a> : <p className="unavailable">{t.bespoke.instagramPending}</p>}
      <p className="muted note">{copy.note}</p>
    </div>
  </section>;
}