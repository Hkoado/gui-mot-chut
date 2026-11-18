'use client';
import Bookshelf from '../components/bookshelf/Bookshelf';
import { getTemplates } from '../data/templates';
import { useLocale, useMessages } from '../i18n/LocaleProvider';
import { getTopics } from '../data/topics';

export default function HomePage() {
  const locale = useLocale();
  const t = useMessages();
  return <main className="album-page">
    <section className="hero" id="xem-mau" aria-label={t.nav.collection}>
      <Bookshelf books={getTopics(locale)} templates={getTemplates(locale)} />
    </section>
  </main>;
}
